import { env } from "cloudflare:workers";

type Bindings = { DB: D1Database };
export type VoucherType = "percent" | "fixed";
export type Voucher = {
  id: string; code: string; type: VoucherType; value: number; minOrder: number; maxDiscount: number;
  usageLimit: number; usedCount: number; startsAt: number; expiresAt: number; active: boolean; createdAt: number;
};
type VoucherRow = { id: string; code: string; type: string; value: number; min_order: number; max_discount: number; usage_limit: number; used_count: number; starts_at: number; expires_at: number; active: number; created_at: number };

function db() {
  const binding = (env as unknown as Bindings).DB;
  if (!binding) throw new Error("Cơ sở dữ liệu voucher chưa sẵn sàng.");
  return binding;
}

let readyPromise: Promise<void> | null = null;
export function ensureVoucherStore() {
  if (!readyPromise) readyPromise = initialize().catch((error) => { readyPromise = null; throw error; });
  return readyPromise;
}

async function initialize() {
  await db().batch([
    db().prepare(`CREATE TABLE IF NOT EXISTS vouchers (
      id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, type TEXT NOT NULL, value INTEGER NOT NULL,
      min_order INTEGER NOT NULL DEFAULT 0, max_discount INTEGER NOT NULL DEFAULT 0,
      usage_limit INTEGER NOT NULL DEFAULT 0, used_count INTEGER NOT NULL DEFAULT 0,
      starts_at INTEGER NOT NULL DEFAULT 0, expires_at INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL
    )`),
    db().prepare("CREATE UNIQUE INDEX IF NOT EXISTS vouchers_code_idx ON vouchers(code)"),
  ]);
}

export async function getManagedVouchers() {
  await ensureVoucherStore();
  const result = await db().prepare("SELECT * FROM vouchers ORDER BY created_at DESC").all<VoucherRow>();
  return result.results.map(mapVoucher);
}

export async function saveVoucher(input: Omit<Voucher, "usedCount" | "createdAt"> & { usedCount?: number }) {
  await ensureVoucherStore();
  const code = normalizeCode(input.code);
  if (!/^[A-Z0-9_-]{3,24}$/.test(code)) throw new Error("Mã voucher chỉ gồm 3–24 chữ cái, số, gạch ngang hoặc gạch dưới.");
  if (input.type === "percent" && (input.value < 1 || input.value > 100)) throw new Error("Phần trăm giảm phải từ 1 đến 100.");
  if (input.type === "fixed" && input.value < 1) throw new Error("Số tiền giảm phải lớn hơn 0.");
  await db().prepare(`INSERT INTO vouchers
    (id, code, type, value, min_order, max_discount, usage_limit, used_count, starts_at, expires_at, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET code=excluded.code, type=excluded.type, value=excluded.value,
      min_order=excluded.min_order, max_discount=excluded.max_discount, usage_limit=excluded.usage_limit,
      starts_at=excluded.starts_at, expires_at=excluded.expires_at, active=excluded.active`)
    .bind(input.id, code, input.type, input.value, input.minOrder, input.maxDiscount, input.usageLimit,
      input.usedCount ?? 0, input.startsAt, input.expiresAt, input.active ? 1 : 0, Date.now()).run();
}

export async function setVoucherActive(id: string, active: boolean) {
  await ensureVoucherStore();
  await db().prepare("UPDATE vouchers SET active = ? WHERE id = ?").bind(active ? 1 : 0, id).run();
}

export async function deleteVoucher(id: string) {
  await ensureVoucherStore();
  await db().prepare("DELETE FROM vouchers WHERE id = ?").bind(id).run();
}

export async function validateVoucher(codeInput: string, subtotal: number) {
  const code = normalizeCode(codeInput);
  if (!code) return { code: "", discount: 0 };
  await ensureVoucherStore();
  const row = await db().prepare("SELECT * FROM vouchers WHERE code = ? LIMIT 1").bind(code).first<VoucherRow>();
  if (!row) throw new Error("Voucher không tồn tại.");
  const voucher = mapVoucher(row);
  const now = Date.now();
  if (!voucher.active) throw new Error("Voucher đã tạm ngừng.");
  if (voucher.startsAt > 0 && now < voucher.startsAt) throw new Error("Voucher chưa đến thời gian sử dụng.");
  if (voucher.expiresAt > 0 && now > voucher.expiresAt) throw new Error("Voucher đã hết hạn.");
  if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) throw new Error("Voucher đã hết lượt sử dụng.");
  if (subtotal < voucher.minOrder) throw new Error(`Đơn hàng chưa đạt giá trị tối thiểu ${formatMoney(voucher.minOrder)}.`);
  const rawDiscount = voucher.type === "percent" ? Math.floor(subtotal * voucher.value / 100) : voucher.value;
  const discount = Math.min(subtotal, voucher.maxDiscount > 0 ? Math.min(rawDiscount, voucher.maxDiscount) : rawDiscount);
  return { code: voucher.code, discount, voucher };
}

export async function redeemVoucher(codeInput: string) {
  const code = normalizeCode(codeInput);
  if (!code) return;
  await ensureVoucherStore();
  await db().prepare("UPDATE vouchers SET used_count = used_count + 1 WHERE code = ?").bind(code).run();
}

function mapVoucher(row: VoucherRow): Voucher {
  return { id: row.id, code: row.code, type: row.type === "fixed" ? "fixed" : "percent", value: Number(row.value), minOrder: Number(row.min_order), maxDiscount: Number(row.max_discount), usageLimit: Number(row.usage_limit), usedCount: Number(row.used_count), startsAt: Number(row.starts_at), expiresAt: Number(row.expires_at), active: Number(row.active) === 1, createdAt: Number(row.created_at) };
}
function normalizeCode(code: string) { return code.trim().toUpperCase(); }
function formatMoney(value: number) { return `${new Intl.NumberFormat("vi-VN").format(value)}đ`; }
