import { env } from "cloudflare:workers";
import { ensureAdminUserStore, type AdminRole } from "@/db/admin-users";

type Bindings = { DB: D1Database; HR_DATA_KEY?: string; ADMIN_PASSWORD?: string };

export type EmployeeProfile = {
  adminUserId: string;
  name: string;
  username: string;
  role: AdminRole;
  branchId: string;
  branch: string;
  active: boolean;
  dateOfBirth: string;
  joinedDate: string;
  citizenId: string;
  permanentAddress: string;
  temporaryAddress: string;
  photoKey: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  monthlySalary: number;
  updatedAt: number;
};

export type AttendanceRecord = {
  id: string;
  adminUserId: string;
  employeeName: string;
  branch: string;
  workDate: string;
  checkIn: string;
  checkOut: string;
  status: string;
  note: string;
  recordedBy: string;
  createdAt: number;
  updatedAt: number;
};

const database = () => {
  const value = (env as unknown as Bindings).DB;
  if (!value) throw new Error("Cơ sở dữ liệu nhân sự chưa sẵn sàng.");
  return value;
};

let ready: Promise<void> | null = null;
export function ensureHrStore() {
  if (!ready) ready = initialize().catch((error) => { ready = null; throw error; });
  return ready;
}

async function initialize() {
  await ensureAdminUserStore();
  const db = database();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS employee_profiles (
      admin_user_id TEXT PRIMARY KEY,
      date_of_birth TEXT NOT NULL DEFAULT '',
      joined_date TEXT NOT NULL DEFAULT '',
      citizen_id_encrypted TEXT NOT NULL DEFAULT '',
      permanent_address_encrypted TEXT NOT NULL DEFAULT '',
      temporary_address_encrypted TEXT NOT NULL DEFAULT '',
      photo_key TEXT NOT NULL DEFAULT '',
      bank_name TEXT NOT NULL DEFAULT '',
      bank_account_name_encrypted TEXT NOT NULL DEFAULT '',
      bank_account_number_encrypted TEXT NOT NULL DEFAULT '',
      monthly_salary INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS employee_attendance (
      id TEXT PRIMARY KEY,
      admin_user_id TEXT NOT NULL,
      work_date TEXT NOT NULL,
      check_in TEXT NOT NULL DEFAULT '',
      check_out TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'present',
      note TEXT NOT NULL DEFAULT '',
      recorded_by TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS employee_attendance_user_date_idx ON employee_attendance(admin_user_id, work_date)"),
    db.prepare("CREATE INDEX IF NOT EXISTS employee_attendance_date_idx ON employee_attendance(work_date, admin_user_id)"),
  ]);
}

export async function getEmployeeDirectory(): Promise<Array<EmployeeProfile & { profileScore: number; todayStatus: string; todayCheckIn: string; citizenIdMasked: string; bankAccountMasked: string }>> {
  await ensureHrStore();
  const today = vietnamDate();
  const rows = await database().prepare(`SELECT u.*,p.*,a.status today_status,a.check_in today_check_in
    FROM admin_users u
    LEFT JOIN employee_profiles p ON p.admin_user_id=u.id
    LEFT JOIN employee_attendance a ON a.admin_user_id=u.id AND a.work_date=?
    ORDER BY u.active DESC,u.name ASC`).bind(today).all<Record<string, unknown>>();
  return Promise.all(rows.results.map(async (row) => {
    const profile = await mapProfile(row);
    const fields = [profile.dateOfBirth, profile.joinedDate, profile.citizenId, profile.permanentAddress, profile.photoKey, profile.bankName, profile.bankAccountName, profile.bankAccountNumber];
    return {
      ...profile,
      profileScore: Math.round(fields.filter(Boolean).length / fields.length * 100),
      todayStatus: String(row.today_status || ""),
      todayCheckIn: String(row.today_check_in || ""),
      citizenIdMasked: maskValue(profile.citizenId),
      bankAccountMasked: maskValue(profile.bankAccountNumber),
    };
  }));
}

export async function getEmployeeProfile(adminUserId: string) {
  await ensureHrStore();
  const row = await database().prepare(`SELECT u.*,p.* FROM admin_users u LEFT JOIN employee_profiles p ON p.admin_user_id=u.id WHERE u.id=? LIMIT 1`)
    .bind(adminUserId).first<Record<string, unknown>>();
  return row ? mapProfile(row) : undefined;
}

export async function saveEmployeeProfile(input: Omit<EmployeeProfile, "username" | "role" | "branchId" | "branch" | "active" | "updatedAt">) {
  await ensureHrStore();
  const now = Date.now();
  const name = cleanText(input.name, 100);
  if (name.length < 2) throw new Error("Vui lòng nhập họ tên nhân viên.");
  const db = database();
  await db.prepare("UPDATE admin_users SET name=? WHERE id=?").bind(name, input.adminUserId).run();
  await db.prepare(`INSERT INTO employee_profiles (
    admin_user_id,date_of_birth,joined_date,citizen_id_encrypted,permanent_address_encrypted,
    temporary_address_encrypted,photo_key,bank_name,bank_account_name_encrypted,
    bank_account_number_encrypted,monthly_salary,updated_at
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(admin_user_id) DO UPDATE SET
    date_of_birth=excluded.date_of_birth,joined_date=excluded.joined_date,
    citizen_id_encrypted=excluded.citizen_id_encrypted,permanent_address_encrypted=excluded.permanent_address_encrypted,
    temporary_address_encrypted=excluded.temporary_address_encrypted,photo_key=excluded.photo_key,
    bank_name=excluded.bank_name,bank_account_name_encrypted=excluded.bank_account_name_encrypted,
    bank_account_number_encrypted=excluded.bank_account_number_encrypted,monthly_salary=excluded.monthly_salary,
    updated_at=excluded.updated_at`).bind(
      input.adminUserId,
      cleanDate(input.dateOfBirth),
      cleanDate(input.joinedDate),
      await encrypt(input.citizenId.replace(/\D/g, "").slice(0, 20)),
      await encrypt(cleanText(input.permanentAddress, 500)),
      await encrypt(cleanText(input.temporaryAddress, 500)),
      input.photoKey.slice(0, 180),
      cleanText(input.bankName, 100),
      await encrypt(cleanText(input.bankAccountName, 120)),
      await encrypt(input.bankAccountNumber.replace(/\s/g, "").slice(0, 40)),
      Math.max(0, Math.floor(input.monthlySalary)),
      now,
    ).run();
}

export async function getEmployeePhotoKey(adminUserId: string) {
  await ensureHrStore();
  const row = await database().prepare("SELECT photo_key FROM employee_profiles WHERE admin_user_id=? LIMIT 1").bind(adminUserId).first<{ photo_key: string }>();
  return row?.photo_key || "";
}

export async function getEmployeeAttendance(adminUserId: string, limit = 120) {
  await ensureHrStore();
  const rows = await database().prepare(`SELECT a.*,u.name employee_name,u.branch FROM employee_attendance a JOIN admin_users u ON u.id=a.admin_user_id WHERE a.admin_user_id=? ORDER BY a.work_date DESC LIMIT ?`)
    .bind(adminUserId, Math.min(366, Math.max(1, limit))).all<Record<string, unknown>>();
  return rows.results.map(mapAttendance);
}

export async function getAttendanceForDate(workDate: string) {
  await ensureHrStore();
  const rows = await database().prepare(`SELECT a.*,u.name employee_name,u.branch FROM employee_attendance a JOIN admin_users u ON u.id=a.admin_user_id WHERE a.work_date=? ORDER BY u.name`).bind(cleanDate(workDate)).all<Record<string, unknown>>();
  return rows.results.map(mapAttendance);
}

export async function saveAttendance(input: { adminUserId: string; workDate: string; checkIn: string; checkOut: string; status: string; note: string; recordedBy: string }) {
  await ensureHrStore();
  const now = Date.now();
  const status = ["present", "late", "leave", "absent"].includes(input.status) ? input.status : "present";
  await database().prepare(`INSERT INTO employee_attendance (id,admin_user_id,work_date,check_in,check_out,status,note,recorded_by,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(admin_user_id,work_date) DO UPDATE SET check_in=excluded.check_in,check_out=excluded.check_out,status=excluded.status,note=excluded.note,recorded_by=excluded.recorded_by,updated_at=excluded.updated_at`)
    .bind(crypto.randomUUID(), input.adminUserId, cleanDate(input.workDate) || vietnamDate(), cleanTime(input.checkIn), cleanTime(input.checkOut), status, cleanText(input.note, 300), cleanText(input.recordedBy, 120), now, now).run();
}

export async function employeeCheck(adminUserId: string, mode: "in" | "out", recordedBy: string) {
  await ensureHrStore();
  const now = new Date();
  const workDate = vietnamDate(now);
  const time = vietnamTime(now);
  const existing = await database().prepare("SELECT * FROM employee_attendance WHERE admin_user_id=? AND work_date=? LIMIT 1").bind(adminUserId, workDate).first<Record<string, unknown>>();
  if (mode === "in") {
    if (existing?.check_in) throw new Error("Bạn đã chấm công vào hôm nay.");
    const status = time > "09:00" ? "late" : "present";
    await saveAttendance({ adminUserId, workDate, checkIn: time, checkOut: String(existing?.check_out || ""), status, note: String(existing?.note || ""), recordedBy });
  } else {
    if (!existing?.check_in) throw new Error("Bạn cần chấm công vào trước khi chấm công ra.");
    if (existing?.check_out) throw new Error("Bạn đã chấm công ra hôm nay.");
    await saveAttendance({ adminUserId, workDate, checkIn: String(existing.check_in), checkOut: time, status: String(existing.status || "present"), note: String(existing.note || ""), recordedBy });
  }
}

async function mapProfile(row: Record<string, unknown>): Promise<EmployeeProfile> {
  return {
    adminUserId: String(row.id || row.admin_user_id),
    name: String(row.name || ""),
    username: String(row.username || ""),
    role: normalizeRole(String(row.role || "sales")),
    branchId: String(row.branch_id || ""),
    branch: String(row.branch || ""),
    active: Number(row.active) === 1,
    dateOfBirth: String(row.date_of_birth || ""),
    joinedDate: String(row.joined_date || ""),
    citizenId: await decrypt(String(row.citizen_id_encrypted || "")),
    permanentAddress: await decrypt(String(row.permanent_address_encrypted || "")),
    temporaryAddress: await decrypt(String(row.temporary_address_encrypted || "")),
    photoKey: String(row.photo_key || ""),
    bankName: String(row.bank_name || ""),
    bankAccountName: await decrypt(String(row.bank_account_name_encrypted || "")),
    bankAccountNumber: await decrypt(String(row.bank_account_number_encrypted || "")),
    monthlySalary: Number(row.monthly_salary || 0),
    updatedAt: Number(row.updated_at || 0),
  };
}

function mapAttendance(row: Record<string, unknown>): AttendanceRecord {
  return { id: String(row.id), adminUserId: String(row.admin_user_id), employeeName: String(row.employee_name || ""), branch: String(row.branch || ""), workDate: String(row.work_date), checkIn: String(row.check_in || ""), checkOut: String(row.check_out || ""), status: String(row.status || "present"), note: String(row.note || ""), recordedBy: String(row.recorded_by || ""), createdAt: Number(row.created_at), updatedAt: Number(row.updated_at) };
}

function normalizeRole(value: string): AdminRole {
  return value === "manager" || value === "consultant" || value === "owner" || value === "warranty" || value === "repair" ? value : "sales";
}
function cleanText(value: string, limit: number) { return value.trim().replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").slice(0, limit); }
function cleanDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ""; }
function cleanTime(value: string) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : ""; }
function maskValue(value: string) { return value ? `${"•".repeat(Math.max(4, value.length - 4))}${value.slice(-4)}` : "Chưa cập nhật"; }
export function vietnamDate(date = new Date()) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(date); }
function vietnamTime(date = new Date()) { return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false }).format(date); }

async function encryptionKey() {
  const bindings = env as unknown as Bindings;
  const secret = bindings.HR_DATA_KEY || bindings.ADMIN_PASSWORD || process.env.HR_DATA_KEY || process.env.ADMIN_PASSWORD || "huy-apple-local-hr-data-key";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`hr:v1:${secret}`));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encrypt(value: string) {
  if (!value) return "";
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(), new TextEncoder().encode(value));
  return `v1.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`;
}

async function decrypt(value: string) {
  if (!value) return "";
  if (!value.startsWith("v1.")) return value;
  try {
    const [, iv, payload] = value.split(".");
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(iv) }, await encryptionKey(), base64ToBytes(payload));
    return new TextDecoder().decode(decrypted);
  } catch { return ""; }
}

function bytesToBase64(bytes: Uint8Array) { return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join("")); }
function base64ToBytes(value: string) { return Uint8Array.from(atob(value), (char) => char.charCodeAt(0)); }
