import { env } from "cloudflare:workers";
import { getManagedProducts, ensureProductStore, type ManagedProduct } from "@/db/products";

type Bindings = { DB: D1Database };
export type InventoryOperation = "receive" | "issue" | "count";
export type BranchInventoryItem = { product: ManagedProduct; quantity: number; updatedAt: number };
export type InventoryMovement = {
  id: string;
  branchId: string;
  productId: string;
  productName: string;
  operation: InventoryOperation;
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  note: string;
  actorId: string;
  actorName: string;
  createdAt: number;
};

const database = () => {
  const binding = (env as unknown as Bindings).DB;
  if (!binding) throw new Error("Cơ sở dữ liệu kho chưa sẵn sàng.");
  return binding;
};

let ready: Promise<void> | null = null;
export function ensureInventoryStore() {
  if (!ready) ready = initialize().catch((error) => { ready = null; throw error; });
  return ready;
}

async function initialize() {
  await ensureProductStore();
  const db = database();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS branch_inventory (
      branch_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (branch_id, product_id)
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS branch_inventory_branch_idx ON branch_inventory(branch_id, updated_at DESC)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS inventory_movements (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      operation TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      before_quantity INTEGER NOT NULL,
      after_quantity INTEGER NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      actor_id TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS inventory_movements_branch_idx ON inventory_movements(branch_id, created_at DESC)"),
  ]);
}

export async function getBranchInventory(branchId: string): Promise<BranchInventoryItem[]> {
  await ensureInventoryStore();
  const [products, rows] = await Promise.all([
    getManagedProducts(),
    database().prepare("SELECT product_id,quantity,updated_at FROM branch_inventory WHERE branch_id=?")
      .bind(branchId).all<Record<string, unknown>>(),
  ]);
  const inventory = new Map(rows.results.map((row) => [String(row.product_id), { quantity: Number(row.quantity || 0), updatedAt: Number(row.updated_at || 0) }]));
  return products
    .filter((product) => product.active || (inventory.get(product.id)?.quantity || 0) > 0)
    .map((product) => ({ product, quantity: inventory.get(product.id)?.quantity || 0, updatedAt: inventory.get(product.id)?.updatedAt || 0 }));
}

export async function getInventoryMovements(branchId: string, limit = 30): Promise<InventoryMovement[]> {
  await ensureInventoryStore();
  const rows = await database().prepare("SELECT * FROM inventory_movements WHERE branch_id=? ORDER BY created_at DESC LIMIT ?")
    .bind(branchId, Math.min(100, Math.max(1, limit))).all<Record<string, unknown>>();
  return rows.results.map((row) => ({
    id: String(row.id), branchId: String(row.branch_id), productId: String(row.product_id), productName: String(row.product_name),
    operation: normalizeOperation(String(row.operation)), quantity: Number(row.quantity), beforeQuantity: Number(row.before_quantity),
    afterQuantity: Number(row.after_quantity), note: String(row.note || ""), actorId: String(row.actor_id), actorName: String(row.actor_name), createdAt: Number(row.created_at),
  }));
}

export async function adjustBranchInventory(input: {
  branchId: string;
  product: Pick<ManagedProduct, "id" | "name">;
  operation: InventoryOperation;
  quantity: number;
  note: string;
  actorId: string;
  actorName: string;
}) {
  await ensureInventoryStore();
  const quantity = Math.trunc(input.quantity);
  if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > 100_000) throw new Error("Số lượng kho không hợp lệ.");
  if (input.operation !== "count" && quantity === 0) throw new Error("Số lượng xuất hoặc nhập phải lớn hơn 0.");
  const existing = await database().prepare("SELECT quantity FROM branch_inventory WHERE branch_id=? AND product_id=? LIMIT 1")
    .bind(input.branchId, input.product.id).first<{ quantity: number }>();
  const beforeQuantity = Number(existing?.quantity || 0);
  const afterQuantity = input.operation === "receive"
    ? beforeQuantity + quantity
    : input.operation === "issue"
      ? beforeQuantity - quantity
      : quantity;
  if (afterQuantity < 0) throw new Error(`Không đủ tồn kho để xuất. Chi nhánh hiện còn ${beforeQuantity} sản phẩm.`);
  const now = Date.now();
  await database().batch([
    database().prepare(`INSERT INTO branch_inventory (branch_id,product_id,quantity,updated_at) VALUES (?,?,?,?)
      ON CONFLICT(branch_id,product_id) DO UPDATE SET quantity=excluded.quantity,updated_at=excluded.updated_at`)
      .bind(input.branchId, input.product.id, afterQuantity, now),
    database().prepare(`INSERT INTO inventory_movements
      (id,branch_id,product_id,product_name,operation,quantity,before_quantity,after_quantity,note,actor_id,actor_name,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(crypto.randomUUID(), input.branchId, input.product.id, clean(input.product.name, 180), input.operation, quantity, beforeQuantity, afterQuantity, clean(input.note, 240), input.actorId, clean(input.actorName, 120), now),
  ]);
  return { beforeQuantity, afterQuantity };
}

function normalizeOperation(value: string): InventoryOperation {
  if (value === "issue" || value === "count") return value;
  return "receive";
}
function clean(value: string, limit: number) { return value.trim().replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").slice(0, limit); }
