import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CUSTOMER_COOKIE, clearCustomerSession } from "@/app/customer-auth";
import { adminUserFromSession, authenticateAdminUser, createAdminUserSession, deleteAdminUserSession, type AdminUser } from "@/db/admin-users";

const ADMIN_COOKIE = "admin";
const DEFAULT_ADMIN_PASSWORD = "admin696969";

type Bindings = {
  ADMIN_PASSWORD?: string;
};

export async function requireAdminPage(returnTo = "/admin") {
  if (await hasCustomerSession()) {
    redirect("/tai-khoan?error=admin-only");
  }
  const user = await adminUserFromCookie();
  if (user) return user;
  redirect(`/admin-login?returnTo=${encodeURIComponent(returnTo)}`);
}

export async function requireAdminAction() {
  const user = await currentAdminUser();
  if (!user) {
    throw new Error("Bạn không có quyền quản lý sản phẩm.");
  }
  return user;
}

export async function requireOwnerPage(returnTo = "/admin/staff") {
  const user = await requireAdminPage(returnTo);
  if (user.role !== "owner") redirect("/admin?error=owner-required");
  return user;
}

export async function requireOwnerAction() {
  const user = await requireAdminAction();
  if (user.role !== "owner") throw new Error("Chỉ tài khoản chủ cửa hàng được quản lý nhân viên.");
  return user;
}

export async function createAdminSession(username: string, password: string) {
  const normalizedUsername = username.trim().toLowerCase();
  let token = "";
  if ((!normalizedUsername || normalizedUsername === "admin" || normalizedUsername === "owner") && password === getAdminPassword()) {
    token = await ownerSessionToken();
  } else {
    try {
      const user = await authenticateAdminUser(normalizedUsername, password);
      if (!user) return false;
      token = await createAdminUserSession(user.id);
    } catch {
      return false;
    }
  }

  await clearCustomerSession();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return true;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (token && token !== await ownerSessionToken()) {
    try { await deleteAdminUserSession(token); } catch { /* database may be unavailable during logout */ }
  }
  cookieStore.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function currentAdminUser(): Promise<AdminUser | undefined> {
  if (await hasCustomerSession()) return undefined;
  return adminUserFromCookie();
}

async function hasCustomerSession() {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(CUSTOMER_COOKIE)?.value);
}

async function adminUserFromCookie(): Promise<AdminUser | undefined> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!session) return undefined;
  if (session === await ownerSessionToken()) {
    return { id: "owner", username: "admin", name: "Chủ cửa hàng", role: "owner", branch: "Toàn hệ thống", active: true, createdAt: 0 };
  }
  try { return await adminUserFromSession(session); } catch { return undefined; }
}

async function ownerSessionToken() {
  const bytes = new TextEncoder().encode(`huy-admin:${getAdminPassword()}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getAdminPassword() {
  const cloudflarePassword = (env as unknown as Bindings).ADMIN_PASSWORD;
  if (typeof cloudflarePassword === "string" && cloudflarePassword.trim()) {
    return cloudflarePassword.trim();
  }

  if (process.env.ADMIN_PASSWORD?.trim()) {
    return process.env.ADMIN_PASSWORD.trim();
  }

  return DEFAULT_ADMIN_PASSWORD;
}
