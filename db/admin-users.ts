import { env } from "cloudflare:workers";

type Bindings = { DB: D1Database };
export type AdminRole = "owner" | "manager" | "sales" | "consultant" | "warranty" | "repair";
export type AdminUser = {
  id: string;
  username: string;
  name: string;
  role: AdminRole;
  branch: string;
  branchId: string;
  active: boolean;
  createdAt: number;
};

type AdminUserRow = {
  id: string;
  username: string;
  name: string;
  password_hash: string;
  password_salt: string;
  role: string;
  branch: string;
  branch_id: string;
  active: number;
  created_at: number;
};

function db() {
  const binding = (env as unknown as Bindings).DB;
  if (!binding) throw new Error("Cơ sở dữ liệu nhân viên chưa sẵn sàng.");
  return binding;
}

let readyPromise: Promise<void> | null = null;
export function ensureAdminUserStore() {
  if (!readyPromise) readyPromise = initialize().catch((error) => { readyPromise = null; throw error; });
  return readyPromise;
}

async function initialize() {
  const database = db();
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      branch TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    )`),
    database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS admin_users_username_idx ON admin_users(LOWER(username))"),
    database.prepare(`CREATE TABLE IF NOT EXISTS admin_user_sessions (
      id TEXT PRIMARY KEY,
      admin_user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )`),
    database.prepare("CREATE INDEX IF NOT EXISTS admin_user_sessions_token_idx ON admin_user_sessions(token_hash)"),
  ]);
  await ensureColumn(database,"admin_users","branch_id","TEXT NOT NULL DEFAULT ''");
}

export async function createAdminUser(input: { username: string; name: string; password: string; role: AdminRole; branch: string; branchId?: string }) {
  await ensureAdminUserStore();
  const username = normalizeUsername(input.username);
  const name = input.name.trim().replace(/\s+/g, " ").slice(0, 100);
  const branch = input.branch.trim().replace(/\s+/g, " ").slice(0, 120);
  const branchId = (input.branchId ?? "").trim().slice(0, 50);
  if (!/^[a-z0-9._-]{4,32}$/.test(username)) throw new Error("Tên đăng nhập gồm 4–32 chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang.");
  if (name.length < 2) throw new Error("Vui lòng nhập tên nhân viên.");
  if (input.password.length < 8) throw new Error("Mật khẩu phải có ít nhất 8 ký tự.");
  const existing = await db().prepare("SELECT id FROM admin_users WHERE LOWER(username) = ? LIMIT 1").bind(username).first();
  if (existing) throw new Error("Tên đăng nhập nhân viên đã tồn tại.");
  const salt = randomToken(16);
  await db().prepare(`INSERT INTO admin_users
    (id, username, name, password_hash, password_salt, role, branch, branch_id, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`).bind(
      crypto.randomUUID(), username, name, await passwordHash(input.password, salt), salt,
      normalizeRole(input.role), branch, branchId, Date.now(),
    ).run();
}

export async function authenticateAdminUser(usernameInput: string, password: string) {
  await ensureAdminUserStore();
  const username = normalizeUsername(usernameInput);
  const row = await db().prepare("SELECT * FROM admin_users WHERE LOWER(username) = ? AND active = 1 LIMIT 1")
    .bind(username).first<AdminUserRow>();
  if (!row || !constantTimeEqual(await passwordHash(password, row.password_salt), row.password_hash)) return undefined;
  return mapAdminUser(row);
}

export async function createAdminUserSession(adminUserId: string) {
  await ensureAdminUserStore();
  const token = randomToken(32);
  const now = Date.now();
  await db().prepare(`INSERT INTO admin_user_sessions
    (id, admin_user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), adminUserId, await tokenHash(token), now + 30 * 24 * 60 * 60 * 1000, now).run();
  return token;
}

export async function adminUserFromSession(token?: string) {
  if (!token) return undefined;
  await ensureAdminUserStore();
  const row = await db().prepare(`SELECT u.* FROM admin_user_sessions s
    JOIN admin_users u ON u.id = s.admin_user_id
    WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1 LIMIT 1`)
    .bind(await tokenHash(token), Date.now()).first<AdminUserRow>();
  return row ? mapAdminUser(row) : undefined;
}

export async function deleteAdminUserSession(token?: string) {
  if (!token) return;
  await ensureAdminUserStore();
  await db().prepare("DELETE FROM admin_user_sessions WHERE token_hash = ?").bind(await tokenHash(token)).run();
}

export async function getAdminUsers() {
  await ensureAdminUserStore();
  const result = await db().prepare("SELECT * FROM admin_users ORDER BY CASE role WHEN 'manager' THEN 0 WHEN 'sales' THEN 1 WHEN 'consultant' THEN 2 WHEN 'warranty' THEN 3 WHEN 'repair' THEN 4 ELSE 5 END, active DESC, name ASC").all<AdminUserRow>();
  return result.results.map(mapAdminUser);
}

export async function setAdminUserActive(id: string, active: boolean) {
  await ensureAdminUserStore();
  await db().prepare("UPDATE admin_users SET active = ? WHERE id = ?").bind(active ? 1 : 0, id).run();
  if (!active) await db().prepare("DELETE FROM admin_user_sessions WHERE admin_user_id = ?").bind(id).run();
}

function mapAdminUser(row: AdminUserRow): AdminUser {
  return { id: row.id, username: row.username, name: row.name, role: normalizeRole(row.role), branch: row.branch, branchId: row.branch_id || "", active: Number(row.active) === 1, createdAt: Number(row.created_at) };
}
function normalizeUsername(value: string) { return value.trim().toLowerCase(); }
function normalizeRole(value: string): AdminRole {
  return value === "owner" || value === "manager" || value === "consultant" || value === "warranty" || value === "repair" ? value : "sales";
}
async function ensureColumn(database:D1Database,table:string,column:string,definition:string){const info=await database.prepare(`PRAGMA table_info(${table})`).all<{name:string}>();if(!info.results.some(item=>item.name===column))await database.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run()}
function randomToken(length: number) { return [...crypto.getRandomValues(new Uint8Array(length))].map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
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
