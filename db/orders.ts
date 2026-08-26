import { env } from "cloudflare:workers";

type Bindings = {
  DB: D1Database;
};

export type ManagedOrder = {
  id: string;
  orderCode: string;
  customerName: string;
  phone: string;
  email: string;
  productSlug: string;
  productName: string;
  color: string;
  storage: string;
  quantity: number;
  deliveryMethod: string;
  address: string;
  paymentMethod: string;
  contactTime: string;
  note: string;
  status: string;
  paymentStatus: string;
  total: string;
  shippingFee: string;
  discount: string;
  financeCompany: string;
  installmentName: string;
  installmentPhone: string;
  dateOfBirth: string;
  citizenId: string;
  citizenIdIssueDate: string;
  citizenIdIssuePlace: string;
  downPaymentPercent: number;
  downPaymentAmount: string;
  financedAmount: string;
  installmentTerm: number;
  monthlyPayment: string;
  estimatedInterest: string;
  customerId: string;
  voucherCode: string;
  items: OrderItem[];
  invoiceStatus: string;
  invoiceNumber: string;
  invoiceTemplateCode: string;
  invoiceSeries: string;
  invoiceDate: string;
  invoiceBuyerType: string;
  invoiceBuyerName: string;
  invoiceCompanyName: string;
  invoiceTaxCode: string;
  invoiceAddress: string;
  invoiceEmail: string;
  invoiceSellerName: string;
  invoiceSellerTaxCode: string;
  invoiceSellerAddress: string;
  invoiceSellerPhone: string;
  invoiceTaxRate: number;
  invoiceTaxIncluded: boolean;
  invoiceNote: string;
  warrantyMonths: number;
  warrantyStartDate: string;
  warrantySerials: string;
  warrantyPolicy: string;
  branchId: string;
  branchName: string;
  assignedAdminId: string;
  assignedAdminName: string;
  createdAt: number;
};

export type OrderItem = {
  productSlug: string;
  productName: string;
  ram: string;
  storage: string;
  color: string;
  quantity: number;
  unitPrice: number;
  image: string;
};

type AdminInvoiceField =
  | "invoiceStatus" | "invoiceNumber" | "invoiceTemplateCode" | "invoiceSeries"
  | "invoiceDate" | "invoiceBuyerType" | "invoiceBuyerName" | "invoiceCompanyName"
  | "invoiceTaxCode" | "invoiceAddress" | "invoiceEmail" | "invoiceSellerName"
  | "invoiceSellerTaxCode" | "invoiceSellerAddress" | "invoiceSellerPhone"
  | "invoiceTaxRate" | "invoiceTaxIncluded" | "invoiceNote" | "warrantyMonths"
  | "warrantyStartDate" | "warrantySerials" | "warrantyPolicy";

type OperationalField = "branchId" | "branchName" | "assignedAdminId" | "assignedAdminName";
export type OrderInput = Omit<ManagedOrder, "id" | "status" | "paymentStatus" | "shippingFee" | "createdAt" | AdminInvoiceField | OperationalField>;

export type OrderInvoiceInput = Pick<ManagedOrder, AdminInvoiceField>;

type OrderRow = {
  id: string;
  order_code?: string;
  customer_name: string;
  phone: string;
  email: string;
  product_slug: string;
  product_name: string;
  color: string;
  storage: string;
  quantity: number;
  delivery_method: string;
  address: string;
  payment_method: string;
  contact_time: string;
  note: string;
  status: string;
  payment_status?: string;
  total?: string;
  shipping_fee?: string;
  discount?: string;
  finance_company?: string;
  installment_name?: string;
  installment_phone?: string;
  date_of_birth?: string;
  citizen_id?: string;
  citizen_id_issue_date?: string;
  citizen_id_issue_place?: string;
  down_payment_percent?: number;
  down_payment_amount?: string;
  financed_amount?: string;
  installment_term?: number;
  monthly_payment?: string;
  estimated_interest?: string;
  customer_id?: string;
  voucher_code?: string;
  items_json?: string;
  invoice_status?: string;
  invoice_number?: string;
  invoice_template_code?: string;
  invoice_series?: string;
  invoice_date?: string;
  invoice_buyer_type?: string;
  invoice_buyer_name?: string;
  invoice_company_name?: string;
  invoice_tax_code?: string;
  invoice_address?: string;
  invoice_email?: string;
  invoice_seller_name?: string;
  invoice_seller_tax_code?: string;
  invoice_seller_address?: string;
  invoice_seller_phone?: string;
  invoice_tax_rate?: number;
  invoice_tax_included?: number;
  invoice_note?: string;
  warranty_months?: number;
  warranty_start_date?: string;
  warranty_serials?: string;
  warranty_policy?: string;
  branch_id?: string;
  branch_name?: string;
  assigned_admin_id?: string;
  assigned_admin_name?: string;
  created_at: number;
};

function db(): D1Database {
  const binding = (env as unknown as Bindings).DB;
  if (!binding) throw new Error("Cơ sở dữ liệu đơn hàng chưa sẵn sàng.");
  return binding;
}

let readyPromise: Promise<void> | null = null;

export function ensureOrderStore(): Promise<void> {
  if (!readyPromise) {
    readyPromise = initializeOrderStore().catch((error) => {
      readyPromise = null;
      throw error;
    });
  }
  return readyPromise;
}

async function initializeOrderStore() {
  const database = db();
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_code TEXT NOT NULL DEFAULT '',
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      product_slug TEXT NOT NULL DEFAULT '',
      product_name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '',
      storage TEXT NOT NULL DEFAULT '',
      quantity INTEGER NOT NULL DEFAULT 1,
      delivery_method TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      payment_method TEXT NOT NULL DEFAULT '',
      contact_time TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new',
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      total TEXT NOT NULL DEFAULT '',
      shipping_fee TEXT NOT NULL DEFAULT '',
      discount TEXT NOT NULL DEFAULT '',
      finance_company TEXT NOT NULL DEFAULT '',
      installment_name TEXT NOT NULL DEFAULT '',
      installment_phone TEXT NOT NULL DEFAULT '',
      date_of_birth TEXT NOT NULL DEFAULT '',
      citizen_id TEXT NOT NULL DEFAULT '',
      citizen_id_issue_date TEXT NOT NULL DEFAULT '',
      citizen_id_issue_place TEXT NOT NULL DEFAULT '',
      down_payment_percent INTEGER NOT NULL DEFAULT 0,
      down_payment_amount TEXT NOT NULL DEFAULT '',
      financed_amount TEXT NOT NULL DEFAULT '',
      installment_term INTEGER NOT NULL DEFAULT 0,
      monthly_payment TEXT NOT NULL DEFAULT '',
      estimated_interest TEXT NOT NULL DEFAULT '',
      customer_id TEXT NOT NULL DEFAULT '',
      voucher_code TEXT NOT NULL DEFAULT '',
      items_json TEXT NOT NULL DEFAULT '[]',
      invoice_status TEXT NOT NULL DEFAULT 'not_created',
      invoice_number TEXT NOT NULL DEFAULT '',
      invoice_template_code TEXT NOT NULL DEFAULT '',
      invoice_series TEXT NOT NULL DEFAULT '',
      invoice_date TEXT NOT NULL DEFAULT '',
      invoice_buyer_type TEXT NOT NULL DEFAULT 'individual',
      invoice_buyer_name TEXT NOT NULL DEFAULT '',
      invoice_company_name TEXT NOT NULL DEFAULT '',
      invoice_tax_code TEXT NOT NULL DEFAULT '',
      invoice_address TEXT NOT NULL DEFAULT '',
      invoice_email TEXT NOT NULL DEFAULT '',
      invoice_seller_name TEXT NOT NULL DEFAULT '',
      invoice_seller_tax_code TEXT NOT NULL DEFAULT '',
      invoice_seller_address TEXT NOT NULL DEFAULT '',
      invoice_seller_phone TEXT NOT NULL DEFAULT '',
      invoice_tax_rate INTEGER NOT NULL DEFAULT 0,
      invoice_tax_included INTEGER NOT NULL DEFAULT 1,
      invoice_note TEXT NOT NULL DEFAULT '',
      warranty_months INTEGER NOT NULL DEFAULT 12,
      warranty_start_date TEXT NOT NULL DEFAULT '',
      warranty_serials TEXT NOT NULL DEFAULT '',
      warranty_policy TEXT NOT NULL DEFAULT '',
      branch_id TEXT NOT NULL DEFAULT '',
      branch_name TEXT NOT NULL DEFAULT '',
      assigned_admin_id TEXT NOT NULL DEFAULT '',
      assigned_admin_name TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL
    )`),
    database.prepare(
      "CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at)",
    ),
    database.prepare(`CREATE TABLE IF NOT EXISTS bank_payment_events (
      id TEXT PRIMARY KEY,
      order_code TEXT NOT NULL,
      amount INTEGER NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      account_number TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL
    )`),
    database.prepare(
      "CREATE INDEX IF NOT EXISTS bank_payment_events_order_code_idx ON bank_payment_events(order_code)",
    ),
  ]);
  await ensureOrderColumns(database);
  await database.batch([
    database.prepare("CREATE INDEX IF NOT EXISTS orders_branch_created_idx ON orders(branch_id, created_at)"),
    database.prepare("CREATE INDEX IF NOT EXISTS orders_assigned_admin_idx ON orders(assigned_admin_id, created_at)"),
  ]);
}

export async function createOrder(input: OrderInput) {
  await ensureOrderStore();
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  const isBankTransfer = input.paymentMethod.startsWith("Chuyển khoản Techcombank");
  const isInstallment = input.paymentMethod === "Trả góp qua công ty tài chính";
  const isAcceptedOnReceipt = input.paymentMethod === "Thanh toán khi nhận máy" || input.deliveryMethod === "Nhận tại cửa hàng";
  const initialStatus = !isBankTransfer && !isInstallment && isAcceptedOnReceipt ? "confirmed" : "pending";

  await db()
    .prepare(`INSERT INTO orders
      (id, order_code, customer_name, phone, email, product_slug, product_name, color, storage,
       quantity, delivery_method, address, payment_method, contact_time, note, total, status, payment_status,
       finance_company, installment_name, installment_phone, date_of_birth, citizen_id,
       citizen_id_issue_date, citizen_id_issue_place, down_payment_percent, down_payment_amount,
       financed_amount, installment_term, monthly_payment, estimated_interest, customer_id, voucher_code,
       items_json, discount, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      id,
      input.orderCode,
      input.customerName,
      input.phone,
      input.email,
      input.productSlug,
      input.productName,
      input.color,
      input.storage,
      input.quantity,
      input.deliveryMethod,
      input.address,
      input.paymentMethod,
      input.contactTime,
      input.note,
      input.total,
      initialStatus,
      input.financeCompany,
      input.installmentName,
      input.installmentPhone,
      input.dateOfBirth,
      input.citizenId,
      input.citizenIdIssueDate,
      input.citizenIdIssuePlace,
      input.downPaymentPercent,
      input.downPaymentAmount,
      input.financedAmount,
      input.installmentTerm,
      input.monthlyPayment,
      input.estimatedInterest,
      input.customerId,
      input.voucherCode,
      JSON.stringify(input.items),
      input.discount,
      createdAt,
    )
    .run();

  if (isBankTransfer) {
    await applyMatchingPayment(input.orderCode, Number(input.total));
  }
  const saved = await db()
    .prepare("SELECT status, payment_status FROM orders WHERE id = ? LIMIT 1")
    .bind(id)
    .first<{ status: string; payment_status: string }>();

  return {
    id,
    createdAt,
    status: normalizeOrderStatus(saved?.status ?? initialStatus),
    paymentStatus: saved?.payment_status ?? "unpaid",
  };
}

export async function getManagedOrders(): Promise<ManagedOrder[]> {
  await ensureOrderStore();
  const result = await db()
    .prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 100")
    .all<OrderRow>();
  return result.results.map(mapRow);
}

export async function getReportingOrders(): Promise<ManagedOrder[]> {
  await ensureOrderStore();
  const result = await db()
    .prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 2000")
    .all<OrderRow>();
  return result.results.map(mapRow);
}

export async function getManagedOrderById(id: string): Promise<ManagedOrder | undefined> {
  await ensureOrderStore();
  const row = await db()
    .prepare("SELECT * FROM orders WHERE id = ? LIMIT 1")
    .bind(id)
    .first<OrderRow>();
  return row ? mapRow(row) : undefined;
}

export async function getCustomerOrders(customerId: string, limit = 50): Promise<ManagedOrder[]> {
  await ensureOrderStore();
  if (!customerId) return [];
  const result = await db()
    .prepare("SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT ?")
    .bind(customerId, Math.min(100, Math.max(1, limit)))
    .all<OrderRow>();
  return result.results.map(mapRow);
}

export async function getCustomerOrderById(id: string, customerId: string): Promise<ManagedOrder | undefined> {
  await ensureOrderStore();
  if (!id || !customerId) return undefined;
  const row = await db()
    .prepare("SELECT * FROM orders WHERE id = ? AND customer_id = ? LIMIT 1")
    .bind(id, customerId)
    .first<OrderRow>();
  return row ? mapRow(row) : undefined;
}

export async function getWarrantyOrder(orderCodeInput: string, phoneInput: string): Promise<ManagedOrder | undefined> {
  await ensureOrderStore();
  const orderCode = orderCodeInput.trim().toUpperCase();
  const phone = normalizeLookupPhone(phoneInput);
  if (!/^[A-Z0-9-]{6,25}$/.test(orderCode) || phone.length < 9) return undefined;
  const row = await db()
    .prepare("SELECT * FROM orders WHERE order_code = ? LIMIT 1")
    .bind(orderCode)
    .first<OrderRow>();
  if (!row || normalizeLookupPhone(row.phone) !== phone) return undefined;
  return mapRow(row);
}

export async function updateOrderStatus(id: string, status: string) {
  await ensureOrderStore();
  await db()
    .prepare("UPDATE orders SET status = ? WHERE id = ?")
    .bind(status, id)
    .run();
}

export async function updateOrderPaymentStatus(id: string, paymentStatus: string) {
  await ensureOrderStore();
  await db()
    .prepare("UPDATE orders SET payment_status = ? WHERE id = ?")
    .bind(paymentStatus, id)
    .run();
}

export async function updateOrderAssignment(id: string, input: { branchId: string; branchName: string; adminUserId: string; adminUserName: string }) {
  await ensureOrderStore();
  await db().prepare(`UPDATE orders SET branch_id = ?, branch_name = ?, assigned_admin_id = ?, assigned_admin_name = ? WHERE id = ?`)
    .bind(input.branchId, input.branchName, input.adminUserId, input.adminUserName, id).run();
}

export async function updateOrderInvoice(id: string, input: OrderInvoiceInput) {
  await ensureOrderStore();
  await db()
    .prepare(`UPDATE orders SET
      invoice_status = ?, invoice_number = ?, invoice_template_code = ?, invoice_series = ?,
      invoice_date = ?, invoice_buyer_type = ?, invoice_buyer_name = ?, invoice_company_name = ?,
      invoice_tax_code = ?, invoice_address = ?, invoice_email = ?, invoice_seller_name = ?,
      invoice_seller_tax_code = ?, invoice_seller_address = ?, invoice_seller_phone = ?,
      invoice_tax_rate = ?, invoice_tax_included = ?, invoice_note = ?, warranty_months = ?,
      warranty_start_date = ?, warranty_serials = ?, warranty_policy = ?
      WHERE id = ?`)
    .bind(
      input.invoiceStatus, input.invoiceNumber, input.invoiceTemplateCode, input.invoiceSeries,
      input.invoiceDate, input.invoiceBuyerType, input.invoiceBuyerName, input.invoiceCompanyName,
      input.invoiceTaxCode, input.invoiceAddress, input.invoiceEmail, input.invoiceSellerName,
      input.invoiceSellerTaxCode, input.invoiceSellerAddress, input.invoiceSellerPhone,
      input.invoiceTaxRate, input.invoiceTaxIncluded ? 1 : 0, input.invoiceNote, input.warrantyMonths,
      input.warrantyStartDate, input.warrantySerials, input.warrantyPolicy, id,
    )
    .run();
}

export async function recordBankPayment(input: {
  id: string;
  orderCode: string;
  amount: number;
  description: string;
  accountNumber: string;
}) {
  await ensureOrderStore();
  await db()
    .prepare(`INSERT OR IGNORE INTO bank_payment_events
      (id, order_code, amount, description, account_number, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(
      input.id,
      input.orderCode,
      Math.max(0, Math.floor(input.amount)),
      input.description,
      input.accountNumber,
      Date.now(),
    )
    .run();

  return markOrderPaidByCode(input.orderCode, input.amount);
}

export async function getOrderStatusByCode(orderCode: string) {
  await ensureOrderStore();
  return db()
    .prepare("SELECT status, payment_status FROM orders WHERE order_code = ? LIMIT 1")
    .bind(orderCode)
    .first<{ status: string; payment_status: string }>();
}

export async function getOrderPaymentByCode(orderCode: string) {
  await ensureOrderStore();
  return db().prepare("SELECT total, payment_method FROM orders WHERE order_code = ? LIMIT 1")
    .bind(orderCode).first<{ total: string; payment_method: string }>();
}

async function applyMatchingPayment(orderCode: string, total: number) {
  if (!orderCode || total <= 0) return false;
  const payment = await db()
    .prepare(`SELECT amount FROM bank_payment_events
      WHERE order_code = ? AND amount >= ? ORDER BY created_at DESC LIMIT 1`)
    .bind(orderCode, Math.floor(total))
    .first<{ amount: number }>();
  return payment ? markOrderPaidByCode(orderCode, Number(payment.amount)) : false;
}

async function markOrderPaidByCode(orderCode: string, amount: number) {
  const result = await db()
    .prepare(`UPDATE orders
      SET payment_status = 'paid',
          status = CASE WHEN status IN ('new', 'pending') THEN 'confirmed' ELSE status END
      WHERE order_code = ?
        AND payment_method LIKE 'Chuyển khoản Techcombank%'
        AND CAST(total AS INTEGER) > 0
        AND CAST(total AS INTEGER) <= ?`)
    .bind(orderCode, Math.max(0, Math.floor(amount)))
    .run() as { meta?: { changes?: number } };
  return Number(result.meta?.changes ?? 0) > 0;
}

async function ensureOrderColumns(database: D1Database) {
  const columns: Array<[string, string]> = [
    ["order_code", "TEXT NOT NULL DEFAULT ''"],
    ["payment_status", "TEXT NOT NULL DEFAULT 'unpaid'"],
    ["total", "TEXT NOT NULL DEFAULT ''"],
    ["shipping_fee", "TEXT NOT NULL DEFAULT ''"],
    ["discount", "TEXT NOT NULL DEFAULT ''"],
    ["finance_company", "TEXT NOT NULL DEFAULT ''"],
    ["installment_name", "TEXT NOT NULL DEFAULT ''"],
    ["installment_phone", "TEXT NOT NULL DEFAULT ''"],
    ["date_of_birth", "TEXT NOT NULL DEFAULT ''"],
    ["citizen_id", "TEXT NOT NULL DEFAULT ''"],
    ["citizen_id_issue_date", "TEXT NOT NULL DEFAULT ''"],
    ["citizen_id_issue_place", "TEXT NOT NULL DEFAULT ''"],
    ["down_payment_percent", "INTEGER NOT NULL DEFAULT 0"],
    ["down_payment_amount", "TEXT NOT NULL DEFAULT ''"],
    ["financed_amount", "TEXT NOT NULL DEFAULT ''"],
    ["installment_term", "INTEGER NOT NULL DEFAULT 0"],
    ["monthly_payment", "TEXT NOT NULL DEFAULT ''"],
    ["estimated_interest", "TEXT NOT NULL DEFAULT ''"],
    ["customer_id", "TEXT NOT NULL DEFAULT ''"],
    ["voucher_code", "TEXT NOT NULL DEFAULT ''"],
    ["items_json", "TEXT NOT NULL DEFAULT '[]'"],
    ["invoice_status", "TEXT NOT NULL DEFAULT 'not_created'"],
    ["invoice_number", "TEXT NOT NULL DEFAULT ''"],
    ["invoice_template_code", "TEXT NOT NULL DEFAULT ''"],
    ["invoice_series", "TEXT NOT NULL DEFAULT ''"],
    ["invoice_date", "TEXT NOT NULL DEFAULT ''"],
    ["invoice_buyer_type", "TEXT NOT NULL DEFAULT 'individual'"],
    ["invoice_buyer_name", "TEXT NOT NULL DEFAULT ''"],
    ["invoice_company_name", "TEXT NOT NULL DEFAULT ''"],
    ["invoice_tax_code", "TEXT NOT NULL DEFAULT ''"],
    ["invoice_address", "TEXT NOT NULL DEFAULT ''"],
    ["invoice_email", "TEXT NOT NULL DEFAULT ''"],
    ["invoice_seller_name", "TEXT NOT NULL DEFAULT ''"],
    ["invoice_seller_tax_code", "TEXT NOT NULL DEFAULT ''"],
    ["invoice_seller_address", "TEXT NOT NULL DEFAULT ''"],
    ["invoice_seller_phone", "TEXT NOT NULL DEFAULT ''"],
    ["invoice_tax_rate", "INTEGER NOT NULL DEFAULT 0"],
    ["invoice_tax_included", "INTEGER NOT NULL DEFAULT 1"],
    ["invoice_note", "TEXT NOT NULL DEFAULT ''"],
    ["warranty_months", "INTEGER NOT NULL DEFAULT 12"],
    ["warranty_start_date", "TEXT NOT NULL DEFAULT ''"],
    ["warranty_serials", "TEXT NOT NULL DEFAULT ''"],
    ["warranty_policy", "TEXT NOT NULL DEFAULT ''"],
    ["branch_id", "TEXT NOT NULL DEFAULT ''"],
    ["branch_name", "TEXT NOT NULL DEFAULT ''"],
    ["assigned_admin_id", "TEXT NOT NULL DEFAULT ''"],
    ["assigned_admin_name", "TEXT NOT NULL DEFAULT ''"],
  ];

  for (const [name, definition] of columns) {
    try {
      await database.prepare(`ALTER TABLE orders ADD COLUMN ${name} ${definition}`).run();
    } catch {
      // Existing databases already have the column.
    }
  }
}

function mapRow(row: OrderRow): ManagedOrder {
  return {
    id: row.id,
    orderCode: row.order_code || row.id.slice(0, 12).toUpperCase(),
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email,
    productSlug: row.product_slug,
    productName: row.product_name,
    color: row.color,
    storage: row.storage,
    quantity: Number(row.quantity),
    deliveryMethod: row.delivery_method,
    address: row.address,
    paymentMethod: row.payment_method,
    contactTime: row.contact_time,
    note: row.note,
    status: normalizeOrderStatus(row.status),
    paymentStatus: row.payment_status ?? "unpaid",
    total: row.total ?? "",
    shippingFee: row.shipping_fee ?? "",
    discount: row.discount ?? "",
    financeCompany: row.finance_company ?? "",
    installmentName: row.installment_name ?? "",
    installmentPhone: row.installment_phone ?? "",
    dateOfBirth: row.date_of_birth ?? "",
    citizenId: row.citizen_id ?? "",
    citizenIdIssueDate: row.citizen_id_issue_date ?? "",
    citizenIdIssuePlace: row.citizen_id_issue_place ?? "",
    downPaymentPercent: Number(row.down_payment_percent ?? 0),
    downPaymentAmount: row.down_payment_amount ?? "",
    financedAmount: row.financed_amount ?? "",
    installmentTerm: Number(row.installment_term ?? 0),
    monthlyPayment: row.monthly_payment ?? "",
    estimatedInterest: row.estimated_interest ?? "",
    customerId: row.customer_id ?? "",
    voucherCode: row.voucher_code ?? "",
    items: parseItems(row.items_json),
    invoiceStatus: row.invoice_status ?? "not_created",
    invoiceNumber: row.invoice_number ?? "",
    invoiceTemplateCode: row.invoice_template_code ?? "",
    invoiceSeries: row.invoice_series ?? "",
    invoiceDate: row.invoice_date ?? "",
    invoiceBuyerType: row.invoice_buyer_type ?? "individual",
    invoiceBuyerName: row.invoice_buyer_name ?? "",
    invoiceCompanyName: row.invoice_company_name ?? "",
    invoiceTaxCode: row.invoice_tax_code ?? "",
    invoiceAddress: row.invoice_address ?? "",
    invoiceEmail: row.invoice_email ?? "",
    invoiceSellerName: row.invoice_seller_name ?? "",
    invoiceSellerTaxCode: row.invoice_seller_tax_code ?? "",
    invoiceSellerAddress: row.invoice_seller_address ?? "",
    invoiceSellerPhone: row.invoice_seller_phone ?? "",
    invoiceTaxRate: Number(row.invoice_tax_rate ?? 0),
    invoiceTaxIncluded: Number(row.invoice_tax_included ?? 1) === 1,
    invoiceNote: row.invoice_note ?? "",
    warrantyMonths: Number(row.warranty_months ?? 12),
    warrantyStartDate: row.warranty_start_date ?? "",
    warrantySerials: row.warranty_serials ?? "",
    warrantyPolicy: row.warranty_policy ?? "",
    branchId: row.branch_id ?? "",
    branchName: row.branch_name ?? "",
    assignedAdminId: row.assigned_admin_id ?? "",
    assignedAdminName: row.assigned_admin_name ?? "",
    createdAt: Number(row.created_at),
  };
}

function parseItems(value?: string): OrderItem[] {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeOrderStatus(status: string) {
  if (status === "new") return "pending";
  return status;
}

function normalizeLookupPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length >= 11) return `0${digits.slice(2)}`;
  return digits;
}
