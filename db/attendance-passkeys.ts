import { env } from "cloudflare:workers";
import { ensureAdminUserStore } from "@/db/admin-users";

type Bindings = { DB: D1Database };

export type AttendancePasskey = {
  id: string;
  adminUserId: string;
  publicKey: string;
  counter: number;
  transports: string[];
  deviceType: string;
  backedUp: boolean;
  createdAt: number;
  lastUsedAt: number;
};

type PasskeyRow = {
  id: string;
  admin_user_id: string;
  public_key: string;
  counter: number;
  transports_json: string;
  device_type: string;
  backed_up: number;
  created_at: number;
  last_used_at: number;
};

const database = () => {
  const value = (env as unknown as Bindings).DB;
  if (!value) throw new Error("Cơ sở dữ liệu xác thực chấm công chưa sẵn sàng.");
  return value;
};

let ready: Promise<void> | null = null;
export function ensureAttendancePasskeyStore() {
  if (!ready) ready = initialize().catch((error) => { ready = null; throw error; });
  return ready;
}

async function initialize() {
  await ensureAdminUserStore();
  const db = database();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS employee_attendance_passkeys (
      id TEXT PRIMARY KEY,
      admin_user_id TEXT NOT NULL,
      public_key TEXT NOT NULL,
      counter INTEGER NOT NULL DEFAULT 0,
      transports_json TEXT NOT NULL DEFAULT '[]',
      device_type TEXT NOT NULL DEFAULT 'singleDevice',
      backed_up INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      last_used_at INTEGER NOT NULL DEFAULT 0
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS employee_attendance_passkeys_user_idx ON employee_attendance_passkeys(admin_user_id, created_at)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS employee_attendance_challenges (
      id TEXT PRIMARY KEY,
      admin_user_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      challenge TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS employee_attendance_challenges_user_idx ON employee_attendance_challenges(admin_user_id, expires_at)"),
  ]);
}

export async function getAttendancePasskeys(adminUserId: string) {
  await ensureAttendancePasskeyStore();
  const rows = await database().prepare("SELECT * FROM employee_attendance_passkeys WHERE admin_user_id=? ORDER BY created_at DESC")
    .bind(adminUserId).all<PasskeyRow>();
  return rows.results.map(mapPasskey);
}

export async function saveAttendancePasskey(input: Omit<AttendancePasskey, "createdAt" | "lastUsedAt">) {
  await ensureAttendancePasskeyStore();
  const count = await database().prepare("SELECT COUNT(*) total FROM employee_attendance_passkeys WHERE admin_user_id=?")
    .bind(input.adminUserId).first<{ total: number }>();
  if (Number(count?.total || 0) >= 5) throw new Error("Mỗi nhân viên chỉ được đăng ký tối đa 5 thiết bị.");
  await database().prepare(`INSERT INTO employee_attendance_passkeys
    (id,admin_user_id,public_key,counter,transports_json,device_type,backed_up,created_at,last_used_at)
    VALUES (?,?,?,?,?,?,?,?,0) ON CONFLICT(id) DO NOTHING`).bind(
      input.id,
      input.adminUserId,
      input.publicKey,
      input.counter,
      JSON.stringify(input.transports.slice(0, 8)),
      input.deviceType.slice(0, 30),
      input.backedUp ? 1 : 0,
      Date.now(),
    ).run();
}

export async function updateAttendancePasskeyCounter(id: string, adminUserId: string, counter: number) {
  await ensureAttendancePasskeyStore();
  await database().prepare("UPDATE employee_attendance_passkeys SET counter=?,last_used_at=? WHERE id=? AND admin_user_id=?")
    .bind(Math.max(0, counter), Date.now(), id, adminUserId).run();
}

export async function revokeAttendancePasskeys(adminUserId: string) {
  await ensureAttendancePasskeyStore();
  await database().batch([
    database().prepare("DELETE FROM employee_attendance_passkeys WHERE admin_user_id=?").bind(adminUserId),
    database().prepare("DELETE FROM employee_attendance_challenges WHERE admin_user_id=?").bind(adminUserId),
  ]);
}

export async function createAttendanceChallenge(adminUserId: string, kind: "registration" | "authentication", challenge: string) {
  await ensureAttendancePasskeyStore();
  const id = crypto.randomUUID();
  const now = Date.now();
  await database().batch([
    database().prepare("DELETE FROM employee_attendance_challenges WHERE expires_at<=? OR admin_user_id=?").bind(now, adminUserId),
    database().prepare("INSERT INTO employee_attendance_challenges (id,admin_user_id,kind,challenge,expires_at,created_at) VALUES (?,?,?,?,?,?)")
      .bind(id, adminUserId, kind, challenge, now + 5 * 60 * 1000, now),
  ]);
  return id;
}

export async function consumeAttendanceChallenge(id: string, adminUserId: string, kind: "registration" | "authentication") {
  await ensureAttendancePasskeyStore();
  const row = await database().prepare("SELECT challenge,expires_at FROM employee_attendance_challenges WHERE id=? AND admin_user_id=? AND kind=? LIMIT 1")
    .bind(id, adminUserId, kind).first<{ challenge: string; expires_at: number }>();
  await database().prepare("DELETE FROM employee_attendance_challenges WHERE id=? AND admin_user_id=?").bind(id, adminUserId).run();
  if (!row || Number(row.expires_at) <= Date.now()) return "";
  return row.challenge;
}

function mapPasskey(row: PasskeyRow): AttendancePasskey {
  let transports: string[] = [];
  try { const parsed = JSON.parse(row.transports_json); if (Array.isArray(parsed)) transports = parsed.filter((item): item is string => typeof item === "string"); } catch { /* malformed legacy value */ }
  return {
    id: row.id,
    adminUserId: row.admin_user_id,
    publicKey: row.public_key,
    counter: Number(row.counter),
    transports,
    deviceType: row.device_type,
    backedUp: Number(row.backed_up) === 1,
    createdAt: Number(row.created_at),
    lastUsedAt: Number(row.last_used_at),
  };
}
