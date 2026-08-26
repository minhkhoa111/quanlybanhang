import { env } from "cloudflare:workers";

type Bindings = { DB: D1Database };
export type PayrollStatus = "draft" | "paid";
export type PayrollRecord = { id: string; adminUserId: string; payrollMonth: string; baseSalary: number; payableAmount: number; workDays: number; status: PayrollStatus; paidAt: number; note: string; updatedAt: number };

const database = () => { const value = (env as unknown as Bindings).DB; if (!value) throw new Error("Cơ sở dữ liệu kiểm kê lương chưa sẵn sàng."); return value; };
let ready: Promise<void> | null = null;
export function ensurePayrollStore() { if (!ready) ready = initialize().catch((error) => { ready = null; throw error; }); return ready; }
async function initialize() { const db = database(); await db.batch([
  db.prepare(`CREATE TABLE IF NOT EXISTS employee_payroll_records (
    id TEXT PRIMARY KEY, admin_user_id TEXT NOT NULL, payroll_month TEXT NOT NULL,
    base_salary INTEGER NOT NULL DEFAULT 0, payable_amount INTEGER NOT NULL DEFAULT 0,
    work_days INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'draft',
    paid_at INTEGER NOT NULL DEFAULT 0, note TEXT NOT NULL DEFAULT '', updated_at INTEGER NOT NULL
  )`),
  db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS employee_payroll_user_month_idx ON employee_payroll_records(admin_user_id, payroll_month)"),
  db.prepare("CREATE INDEX IF NOT EXISTS employee_payroll_month_idx ON employee_payroll_records(payroll_month, status)"),
]); }

export async function getPayrollRecords(month: string) {
  await ensurePayrollStore();
  const rows = await database().prepare("SELECT * FROM employee_payroll_records WHERE payroll_month=? ORDER BY updated_at DESC").bind(cleanMonth(month)).all<Record<string, unknown>>();
  return rows.results.map(mapRecord);
}

export async function savePayrollRecord(input: { adminUserId: string; payrollMonth: string; baseSalary: number; payableAmount: number; workDays: number; status: string; note: string }) {
  await ensurePayrollStore();
  const month = cleanMonth(input.payrollMonth);
  if (!input.adminUserId || !month) throw new Error("Nhân viên hoặc tháng lương không hợp lệ.");
  const status: PayrollStatus = input.status === "paid" ? "paid" : "draft";
  const existing = await database().prepare("SELECT paid_at FROM employee_payroll_records WHERE admin_user_id=? AND payroll_month=? LIMIT 1").bind(input.adminUserId, month).first<{ paid_at: number }>();
  const now = Date.now();
  const paidAt = status === "paid" ? Number(existing?.paid_at || now) : 0;
  await database().prepare(`INSERT INTO employee_payroll_records (id,admin_user_id,payroll_month,base_salary,payable_amount,work_days,status,paid_at,note,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(admin_user_id,payroll_month) DO UPDATE SET
    base_salary=excluded.base_salary,payable_amount=excluded.payable_amount,work_days=excluded.work_days,status=excluded.status,paid_at=excluded.paid_at,note=excluded.note,updated_at=excluded.updated_at`)
    .bind(crypto.randomUUID(), input.adminUserId, month, money(input.baseSalary), money(input.payableAmount), Math.max(0, Math.floor(input.workDays)), status, paidAt, input.note.trim().replace(/\s+/g, " ").slice(0, 300), now).run();
}

function mapRecord(row: Record<string, unknown>): PayrollRecord { return { id: String(row.id), adminUserId: String(row.admin_user_id), payrollMonth: String(row.payroll_month), baseSalary: Number(row.base_salary || 0), payableAmount: Number(row.payable_amount || 0), workDays: Number(row.work_days || 0), status: row.status === "paid" ? "paid" : "draft", paidAt: Number(row.paid_at || 0), note: String(row.note || ""), updatedAt: Number(row.updated_at || 0) }; }
function cleanMonth(value: string) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : ""; }
function money(value: number) { return Math.max(0, Math.min(10_000_000_000, Math.round(Number.isFinite(value) ? value : 0))); }
