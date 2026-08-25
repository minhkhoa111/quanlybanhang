import { env } from "cloudflare:workers";

type Bindings = { DB: D1Database };

export type Customer = {
  id: string;
  username: string;
  avatarUrl: string;
  name: string;
  email: string;
  phone: string;
  provider: "password" | "google";
  verified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  profileComplete: boolean;
  verificationChannel: "email" | "sms";
  createdAt: number;
};

type CustomerRow = {
  id: string;
  username?: string;
  avatar_url?: string;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  password_salt: string;
  provider?: string;
  google_sub?: string;
  email_verified?: number;
  phone_verified?: number;
  profile_completed?: number;
  verification_channel?: string;
  created_at: number;
};

type VerificationRow = {
  id: string;
  customer_id: string;
  channel: string;
  destination: string;
  expires_at: number;
};

function db() {
  const binding = (env as unknown as Bindings).DB;
  if (!binding) throw new Error("Cơ sở dữ liệu khách hàng chưa sẵn sàng.");
  return binding;
}

let readyPromise: Promise<void> | null = null;

export function ensureCustomerStore() {
  if (!readyPromise) readyPromise = initialize().catch((error) => { readyPromise = null; throw error; });
  return readyPromise;
}

async function initialize() {
  const database = db();
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL DEFAULT '',
      avatar_url TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'password',
      google_sub TEXT NOT NULL DEFAULT '',
      email_verified INTEGER NOT NULL DEFAULT 0,
      phone_verified INTEGER NOT NULL DEFAULT 0,
      profile_completed INTEGER NOT NULL DEFAULT 1,
      verification_channel TEXT NOT NULL DEFAULT 'email',
      created_at INTEGER NOT NULL
    )`),
    database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS customers_email_idx ON customers(email)"),
    database.prepare(`CREATE TABLE IF NOT EXISTS customer_sessions (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )`),
    database.prepare("CREATE INDEX IF NOT EXISTS customer_sessions_token_idx ON customer_sessions(token_hash)"),
    database.prepare(`CREATE TABLE IF NOT EXISTS customer_verification_sessions (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      channel TEXT NOT NULL,
      destination TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )`),
    database.prepare("CREATE INDEX IF NOT EXISTS customer_verification_token_idx ON customer_verification_sessions(token_hash)"),
  ]);
  await ensureCustomerColumns(database);
}

export async function registerCustomer(input: { username: string; name: string; email: string; phone: string; password: string }) {
  await ensureCustomerStore();
  const username = normalizeUsername(input.username);
  const name = input.name.trim().replace(/\s+/g, " ");
  const email = normalizeEmail(input.email);
  const phone = input.phone.replace(/\s+/g, "").trim();
  if (!/^[a-z0-9._]{4,24}$/.test(username)) throw new Error("Tên đăng nhập gồm 4–24 chữ thường, số, dấu chấm hoặc gạch dưới.");
  if (name.length < 2) throw new Error("Vui lòng nhập họ tên hợp lệ.");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Email chưa hợp lệ.");
  if (!/^[0-9+]{9,15}$/.test(phone)) throw new Error("Số điện thoại chưa hợp lệ.");
  if (input.password.length < 8) throw new Error("Mật khẩu phải có ít nhất 8 ký tự.");

  const existing = await db().prepare("SELECT id FROM customers WHERE email = ? LIMIT 1").bind(email).first();
  if (existing) throw new Error("Email này đã được đăng ký.");
  const existingUsername = await db().prepare("SELECT id FROM customers WHERE LOWER(username) = ? LIMIT 1").bind(username).first();
  if (existingUsername) throw new Error("Tên đăng nhập đã được sử dụng.");
  const id = crypto.randomUUID();
  const salt = randomToken(16);
  const hash = await passwordHash(input.password, salt);
  const createdAt = Date.now();
  await db().prepare(`INSERT INTO customers
    (id, username, name, email, phone, password_hash, password_salt, provider, google_sub,
     email_verified, phone_verified, profile_completed, verification_channel, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'password', '', 1, 0, 1, 'email', ?)`)
    .bind(id, username, name, email, phone, hash, salt, createdAt).run();
  return (await customerById(id)) as Customer;
}

export async function authenticateCustomer(identifierInput: string, password: string) {
  await ensureCustomerStore();
  const identifier = identifierInput.trim().toLowerCase();
  const row = await db().prepare("SELECT * FROM customers WHERE LOWER(username) = ? OR email = ? LIMIT 1")
    .bind(identifier, normalizeEmail(identifier)).first<CustomerRow>();
  if (!row || !constantTimeEqual(await passwordHash(password, row.password_salt), row.password_hash)) {
    throw new Error("Tên đăng nhập, email hoặc mật khẩu không đúng.");
  }
  return mapCustomer(row);
}

export async function upsertGoogleCustomer(input: { googleSub: string; email: string; name: string; emailVerified: boolean }) {
  await ensureCustomerStore();
  const email = normalizeEmail(input.email);
  if (!input.googleSub || !/^\S+@\S+\.\S+$/.test(email) || !input.emailVerified) {
    throw new Error("Google chưa xác minh được địa chỉ email của tài khoản.");
  }
  const byGoogle = await db().prepare("SELECT * FROM customers WHERE google_sub = ? LIMIT 1").bind(input.googleSub).first<CustomerRow>();
  const byEmail = byGoogle ? null : await db().prepare("SELECT * FROM customers WHERE email = ? LIMIT 1").bind(email).first<CustomerRow>();
  const existing = byGoogle || byEmail;
  if (existing) {
    const name = existing.name || cleanName(input.name);
    await db().prepare(`UPDATE customers SET google_sub = ?, provider = 'google', email_verified = 1,
      name = ?, profile_completed = CASE WHEN phone <> '' AND ? <> '' THEN 1 ELSE 0 END WHERE id = ?`)
      .bind(input.googleSub, name, name, existing.id).run();
    return (await customerById(existing.id)) as Customer;
  }
  const id = crypto.randomUUID();
  const name = cleanName(input.name);
  await db().prepare(`INSERT INTO customers
    (id, name, email, phone, password_hash, password_salt, provider, google_sub,
     email_verified, phone_verified, profile_completed, verification_channel, created_at)
    VALUES (?, ?, ?, '', '', '', 'google', ?, 1, 0, 0, 'email', ?)`)
    .bind(id, name, email, input.googleSub, Date.now()).run();
  return (await customerById(id)) as Customer;
}

export async function updateCustomerProfile(customerId: string, input: { name: string; phone: string }) {
  await ensureCustomerStore();
  const name = cleanName(input.name);
  const phone = normalizePhone(input.phone);
  if (name.length < 2) throw new Error("Vui lòng nhập họ tên hợp lệ.");
  if (!/^\+?[0-9]{9,15}$/.test(phone)) throw new Error("Số điện thoại chưa hợp lệ.");
  await db().prepare("UPDATE customers SET name = ?, phone = ?, profile_completed = 1 WHERE id = ?")
    .bind(name, phone, customerId).run();
  return customerById(customerId);
}

export async function updateCustomerAvatar(customerId: string, avatarUrl: string) {
  await ensureCustomerStore();
  if (avatarUrl && !/^\/api\/product-images\/[a-zA-Z0-9._-]+$/.test(avatarUrl)) throw new Error("Đường dẫn ảnh đại diện chưa hợp lệ.");
  await db().prepare("UPDATE customers SET avatar_url = ? WHERE id = ?").bind(avatarUrl, customerId).run();
  return customerById(customerId);
}

export async function markCustomerVerified(customerId: string, channel: "email" | "sms") {
  await ensureCustomerStore();
  const column = channel === "sms" ? "phone_verified" : "email_verified";
  await db().prepare(`UPDATE customers SET ${column} = 1 WHERE id = ?`).bind(customerId).run();
  return customerById(customerId);
}

export async function deleteUnverifiedCustomer(customerId: string) {
  await ensureCustomerStore();
  await db().prepare("DELETE FROM customers WHERE id = ? AND email_verified = 0 AND phone_verified = 0 AND provider = 'password'")
    .bind(customerId).run();
}

export async function createCustomerVerificationSession(customer: Customer) {
  await ensureCustomerStore();
  const channel = customer.verificationChannel;
  const destination = channel === "sms" ? customer.phone : customer.email;
  const token = randomToken(32);
  const now = Date.now();
  await db().prepare("DELETE FROM customer_verification_sessions WHERE customer_id = ?").bind(customer.id).run();
  await db().prepare(`INSERT INTO customer_verification_sessions
    (id, customer_id, token_hash, channel, destination, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), customer.id, await tokenHash(token), channel, destination, now + 10 * 60 * 1000, now).run();
  return { token, channel, destination };
}

export async function verificationFromToken(token?: string) {
  if (!token) return undefined;
  await ensureCustomerStore();
  const row = await db().prepare(`SELECT * FROM customer_verification_sessions
    WHERE token_hash = ? AND expires_at > ? LIMIT 1`)
    .bind(await tokenHash(token), Date.now()).first<VerificationRow>();
  if (!row) return undefined;
  const customer = await customerById(row.customer_id);
  return customer ? {
    id: row.id,
    customer,
    channel: row.channel === "sms" ? "sms" as const : "email" as const,
    destination: row.destination,
  } : undefined;
}

export async function deleteVerificationSession(id: string) {
  await ensureCustomerStore();
  await db().prepare("DELETE FROM customer_verification_sessions WHERE id = ?").bind(id).run();
}

export async function createCustomerSession(customerId: string) {
  await ensureCustomerStore();
  const token = randomToken(32);
  const now = Date.now();
  await db().prepare(`INSERT INTO customer_sessions
    (id, customer_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), customerId, await tokenHash(token), now + 30 * 24 * 60 * 60 * 1000, now).run();
  return token;
}

export async function customerFromSession(token?: string) {
  if (!token) return undefined;
  await ensureCustomerStore();
  const row = await db().prepare(`SELECT c.* FROM customer_sessions s
    JOIN customers c ON c.id = s.customer_id
    WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1`)
    .bind(await tokenHash(token), Date.now()).first<CustomerRow>();
  return row ? mapCustomer(row) : undefined;
}

export async function deleteCustomerSession(token?: string) {
  if (!token) return;
  await ensureCustomerStore();
  await db().prepare("DELETE FROM customer_sessions WHERE token_hash = ?").bind(await tokenHash(token)).run();
}

export async function getManagedCustomers(): Promise<Customer[]> {
  await ensureCustomerStore();
  const result = await db().prepare("SELECT * FROM customers ORDER BY created_at DESC LIMIT 300").all<CustomerRow>();
  return result.results.map(mapCustomer);
}

function mapCustomer(row: CustomerRow): Customer {
  const emailVerified = Number(row.email_verified ?? 1) === 1;
  const phoneVerified = Number(row.phone_verified ?? 0) === 1;
  return {
    id: row.id,
    username: row.username ?? "",
    avatarUrl: row.avatar_url ?? "",
    name: row.name,
    email: row.email,
    phone: row.phone,
    provider: row.provider === "google" ? "google" : "password",
    verified: emailVerified || phoneVerified || row.provider === "google",
    emailVerified,
    phoneVerified,
    profileComplete: Number(row.profile_completed ?? 1) === 1 && Boolean(row.name && row.phone),
    verificationChannel: row.verification_channel === "sms" ? "sms" : "email",
    createdAt: Number(row.created_at),
  };
}

function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
function normalizeUsername(username: string) { return username.trim().toLowerCase(); }
function normalizePhone(phone: string) { return phone.replace(/[\s().-]/g, "").trim(); }
function cleanName(name: string) { return name.trim().replace(/\s+/g, " ").slice(0, 120); }

async function customerById(id: string) {
  const row = await db().prepare("SELECT * FROM customers WHERE id = ? LIMIT 1").bind(id).first<CustomerRow>();
  return row ? mapCustomer(row) : undefined;
}

async function ensureCustomerColumns(database: D1Database) {
  const columns: Array<[string, string]> = [
    ["username", "TEXT NOT NULL DEFAULT ''"],
    ["avatar_url", "TEXT NOT NULL DEFAULT ''"],
    ["provider", "TEXT NOT NULL DEFAULT 'password'"],
    ["google_sub", "TEXT NOT NULL DEFAULT ''"],
    ["email_verified", "INTEGER NOT NULL DEFAULT 1"],
    ["phone_verified", "INTEGER NOT NULL DEFAULT 0"],
    ["profile_completed", "INTEGER NOT NULL DEFAULT 1"],
    ["verification_channel", "TEXT NOT NULL DEFAULT 'email'"],
  ];
  for (const [name, definition] of columns) {
    try { await database.prepare(`ALTER TABLE customers ADD COLUMN ${name} ${definition}`).run(); } catch { /* already present */ }
  }
  try { await database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS customers_google_sub_idx ON customers(google_sub) WHERE google_sub <> ''").run(); } catch { /* existing index */ }
  try { await database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS customers_username_idx ON customers(LOWER(username)) WHERE username <> ''").run(); } catch { /* existing index */ }
}

function randomToken(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function passwordHash(password: string, saltHex: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)?.map((part) => Number.parseInt(part, 16)) ?? []);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 120_000 }, key, 256);
  return [...new Uint8Array(bits)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function tokenHash(token: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}
