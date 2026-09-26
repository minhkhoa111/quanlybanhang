type SecurityEnv = {
  DB?: D1Database;
};

type RatePolicy = {
  limit: number;
  windowSeconds: number;
  scope: string;
};

type RateRecord = {
  count: number;
};

const AUTH_API_PATHS = new Set([
  "/api/account/login",
  "/api/account/register",
  "/api/account/google/start",
  "/api/account/google/callback",
  "/api/account/password/forgot",
  "/api/account/password/reset",
  "/api/account/password/verify",
  "/api/account/verification/resend",
  "/api/account/verification/check",
  "/api/account/verification/verify",
]);
const ADMIN_LOGIN_PATHS = new Set(["/admin-login", "/quan-ly/dang-nhap"]);
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const memoryRateLimits = new Map<string, { count: number; expiresAt: number }>();
let rateLimitTableReady: Promise<void> | undefined;

export async function enforceRequestSecurity(request: Request, env: SecurityEnv): Promise<Response | null> {
  const url = new URL(request.url);
  const isApi = url.pathname === "/api" || url.pathname.startsWith("/api/");
  const isAdminLogin = request.method === "POST" && ADMIN_LOGIN_PATHS.has(url.pathname);
  if (!isApi && !isAdminLogin) return null;

  if (MUTATING_METHODS.has(request.method)) {
    const originError = validateRequestOrigin(request, url.pathname);
    if (originError) return problem(originError, 403);

    const payloadError = await validatePayload(request, url.pathname, isAdminLogin);
    if (payloadError) return payloadError;
  }

  const policy = ratePolicy(request, url.pathname, isAdminLogin);
  const client = clientIdentifier(request);
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / policy.windowSeconds) * policy.windowSeconds;
  const key = `${policy.scope}:${client}:${windowStart}`;
  const count = await incrementRateLimit(env.DB, key, windowStart + policy.windowSeconds);

  if (count > policy.limit) {
    const retryAfter = Math.max(1, windowStart + policy.windowSeconds - now);
    return problem("Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau.", 429, {
      "Retry-After": String(retryAfter),
      "RateLimit-Limit": String(policy.limit),
      "RateLimit-Remaining": "0",
      "RateLimit-Reset": String(windowStart + policy.windowSeconds),
    });
  }

  return null;
}

export function addSecurityHeaders(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  if (new URL(request.url).protocol === "https:") {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  if (new URL(request.url).pathname.startsWith("/api/account/")) {
    headers.set("Cache-Control", "no-store");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function ratePolicy(request: Request, pathname: string, isAdminLogin: boolean): RatePolicy {
  if (isAdminLogin || AUTH_API_PATHS.has(pathname)) {
    return { limit: 5, windowSeconds: 15 * 60, scope: `auth:${pathname}` };
  }
  if (pathname.startsWith("/api/face/")) {
    return { limit: 20, windowSeconds: 60, scope: `face:${normalizedPath(pathname)}` };
  }
  if (pathname === "/api/payment/casso") {
    return { limit: 120, windowSeconds: 60, scope: "webhook:casso" };
  }
  const limit = MUTATING_METHODS.has(request.method) ? 60 : 180;
  return { limit, windowSeconds: 60, scope: `api:${request.method}:${normalizedPath(pathname)}` };
}

function normalizedPath(pathname: string) {
  if (pathname.startsWith("/api/product-images/")) return "/api/product-images/:key";
  if (pathname.startsWith("/api/task-files/")) return "/api/task-files/:key";
  if (pathname.startsWith("/api/face/hr-photo/")) return "/api/face/hr-photo/:id";
  if (pathname.startsWith("/api/face/employees/")) return "/api/face/employees/:id";
  return pathname;
}

function clientIdentifier(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = request.headers.get("cf-connecting-ip")
    || request.headers.get("true-client-ip")
    || request.headers.get("x-real-ip")
    || forwarded
    || "unknown";
  return address.slice(0, 96);
}

function validateRequestOrigin(request: Request, pathname: string) {
  if (pathname === "/api/payment/casso") return "";
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return "Yêu cầu khác nguồn đã bị từ chối.";
  }
  const origin = request.headers.get("origin");
  if (!origin) return "";
  try {
    return new URL(origin).origin === new URL(request.url).origin ? "" : "Yêu cầu khác nguồn đã bị từ chối.";
  } catch {
    return "Origin không hợp lệ.";
  }
}

async function validatePayload(request: Request, pathname: string, isAdminLogin: boolean): Promise<Response | null> {
  if (!request.body) return null;
  const maxBytes = payloadLimit(pathname, isAdminLogin);
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (!Number.isFinite(declaredLength) || declaredLength < 0) return problem("Content-Length không hợp lệ.", 400);
  if (declaredLength > maxBytes) return problem("Dữ liệu gửi lên vượt quá giới hạn cho phép.", 413);

  const contentType = request.headers.get("content-type")?.toLowerCase() || "";
  const allowsMultipart = pathname === "/api/account/avatar";
  const allowsForm = isAdminLogin;
  if (allowsMultipart && contentType.startsWith("multipart/form-data")) {
    return (await bodyExceedsLimit(request, maxBytes)) ? problem("Tệp tải lên vượt quá giới hạn cho phép.", 413) : null;
  }
  if (allowsForm && (contentType.startsWith("application/x-www-form-urlencoded") || contentType.startsWith("multipart/form-data"))) {
    return (await bodyExceedsLimit(request, maxBytes)) ? problem("Dữ liệu gửi lên vượt quá giới hạn cho phép.", 413) : null;
  }
  if (!contentType.includes("application/json")) {
    return problem("API chỉ chấp nhận dữ liệu JSON đúng định dạng.", 415);
  }

  const bytes = await readLimitedBody(request, maxBytes);
  if (!bytes) return problem("Dữ liệu gửi lên vượt quá giới hạn cho phép.", 413);
  if (bytes.byteLength === 0) return null;
  try {
    const parsed: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return problem("Payload JSON phải là một object.", 400);
    }
    validateJsonShape(parsed, pathname);
  } catch (error) {
    const message = error instanceof Error && error.message.startsWith("PAYLOAD:")
      ? error.message.slice("PAYLOAD:".length)
      : "Payload JSON không hợp lệ.";
    return problem(message, 400);
  }
  return null;
}

function payloadLimit(pathname: string, isAdminLogin: boolean) {
  if (isAdminLogin) return 64 * 1024;
  if (pathname === "/api/account/avatar") return 4 * 1024 * 1024;
  if (pathname.startsWith("/api/face/")) return 5 * 1024 * 1024;
  if (pathname.startsWith("/api/product-images/")) return 6 * 1024 * 1024;
  return 256 * 1024;
}

async function bodyExceedsLimit(request: Request, maxBytes: number) {
  return (await readLimitedBody(request, maxBytes)) === null;
}

async function readLimitedBody(request: Request, maxBytes: number): Promise<Uint8Array | null> {
  const reader = request.clone().body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return combined;
}

function validateJsonShape(value: unknown, pathname: string) {
  let fields = 0;
  const visit = (current: unknown, depth: number, key = ""): void => {
    if (depth > 12) throw new Error("PAYLOAD:Dữ liệu lồng quá sâu.");
    if (typeof current === "string") {
      const specialLimit = pathname.startsWith("/api/face/") && (key === "image" || key === "image_base64")
        ? 4_500_000
        : 65_536;
      if (current.length > specialLimit) throw new Error("PAYLOAD:Một trường dữ liệu quá dài.");
      if (/\u0000/.test(current)) throw new Error("PAYLOAD:Dữ liệu chứa ký tự không hợp lệ.");
      return;
    }
    if (Array.isArray(current)) {
      if (current.length > 200) throw new Error("PAYLOAD:Mảng dữ liệu có quá nhiều phần tử.");
      for (const item of current) visit(item, depth + 1, key);
      return;
    }
    if (!current || typeof current !== "object") return;
    for (const [childKey, child] of Object.entries(current as Record<string, unknown>)) {
      fields += 1;
      if (fields > 1_000) throw new Error("PAYLOAD:Payload có quá nhiều trường.");
      if (childKey === "__proto__" || childKey === "prototype" || childKey === "constructor") {
        throw new Error("PAYLOAD:Tên trường không được phép.");
      }
      visit(child, depth + 1, childKey);
    }
  };
  visit(value, 0);
}

async function incrementRateLimit(db: D1Database | undefined, key: string, expiresAt: number) {
  if (db) {
    try {
      await ensureRateLimitTable(db);
      const row = await db.prepare(`
        INSERT INTO api_rate_limits (rate_key, count, expires_at)
        VALUES (?, 1, ?)
        ON CONFLICT(rate_key) DO UPDATE SET count = count + 1
        RETURNING count
      `).bind(key, expiresAt).first<RateRecord>();
      if (Math.random() < 0.01) {
        void db.prepare("DELETE FROM api_rate_limits WHERE expires_at < ?").bind(Math.floor(Date.now() / 1000)).run();
      }
      return Number(row?.count || 1);
    } catch (error) {
      console.error("D1 rate limiter unavailable; using isolate fallback", error);
    }
  }
  return incrementMemoryRateLimit(key, expiresAt);
}

function ensureRateLimitTable(db: D1Database) {
  if (!rateLimitTableReady) {
    rateLimitTableReady = db.prepare(`
      CREATE TABLE IF NOT EXISTS api_rate_limits (
        rate_key TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 1,
        expires_at INTEGER NOT NULL
      )
    `).run().then(() => undefined).catch((error) => {
      rateLimitTableReady = undefined;
      throw error;
    });
  }
  return rateLimitTableReady;
}

function incrementMemoryRateLimit(key: string, expiresAt: number) {
  const now = Math.floor(Date.now() / 1000);
  const existing = memoryRateLimits.get(key);
  const count = existing && existing.expiresAt >= now ? existing.count + 1 : 1;
  memoryRateLimits.set(key, { count, expiresAt });
  if (memoryRateLimits.size > 5_000) {
    for (const [storedKey, record] of memoryRateLimits) {
      if (record.expiresAt < now) memoryRateLimits.delete(storedKey);
    }
  }
  return count;
}

function problem(message: string, status: number, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}
