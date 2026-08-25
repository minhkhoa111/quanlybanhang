import { createOrder, type OrderInput, type OrderItem } from "@/db/orders";
import { getPublicProducts } from "@/db/products";
import { productUnitPrice } from "@/app/order-pricing";
import { currentCustomer } from "@/app/customer-auth";
import { redeemVoucher, validateVoucher } from "@/db/vouchers";
import {
  calculateInstallmentPlan,
  DOWN_PAYMENT_OPTIONS,
  FINANCE_COMPANIES,
  INSTALLMENT_TERMS,
  MIN_INSTALLMENT_TOTAL,
} from "@/app/installment";

export const dynamic = "force-dynamic";

const INSTALLMENT_PAYMENT = "Trả góp qua công ty tài chính";
const FINANCE_RATES = new Map<string, number>(FINANCE_COMPANIES.map((company) => [company.name, company.monthlyRate]));

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<OrderInput> & { installmentConsent?: boolean; ram?: string; items?: unknown };
    const order = await normalizeOrder(payload);
    const saved = await createOrder(order);
    if (order.voucherCode) await redeemVoucher(order.voucherCode);
    return Response.json({
      ok: true,
      id: saved.id,
      orderCode: order.orderCode,
      status: saved.status,
      paymentStatus: saved.paymentStatus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể tạo đơn hàng.";
    return Response.json({ ok: false, message }, { status: 400 });
  }
}

async function normalizeOrder(payload: Partial<OrderInput> & { installmentConsent?: boolean; ram?: string; items?: unknown }): Promise<OrderInput> {
  const customerName = clean(payload.customerName);
  const phone = clean(payload.phone);
  if (!customerName || !phone) {
    throw new Error("Vui lòng nhập họ tên, số điện thoại và sản phẩm cần đặt.");
  }

  const products = await getPublicProducts();
  const requestedItems = Array.isArray(payload.items) ? payload.items : [];
  const items = requestedItems.length
    ? normalizeItems(requestedItems, products)
    : normalizeItems([{ productSlug: payload.productSlug, ram: payload.ram, storage: payload.storage, color: payload.color, quantity: payload.quantity }], products);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const voucherResult = await validateVoucher(clean(payload.voucherCode), subtotal);
  const total = subtotal - voucherResult.discount;
  const firstItem = items[0];
  const productSlug = items.length === 1 ? firstItem.productSlug : "gio-hang";
  const productName = items.length === 1 ? firstItem.productName : `${items.length} sản phẩm trong giỏ hàng`;
  const color = items.length === 1 ? firstItem.color : "Nhiều màu";
  const storage = items.length === 1 ? [firstItem.ram && `${firstItem.ram} RAM`, firstItem.storage && `${firstItem.storage} SSD`].filter(Boolean).join(" / ") : "Nhiều cấu hình";
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const requestedOrderCode = clean(payload.orderCode).toUpperCase();
  const orderCode = /^[A-Z0-9-]{6,25}$/.test(requestedOrderCode)
    ? requestedOrderCode
    : `HA${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
  const paymentMethod = clean(payload.paymentMethod);
  const isInstallment = paymentMethod === INSTALLMENT_PAYMENT;
  const financeCompany = isInstallment ? clean(payload.financeCompany) : "";
  const installmentName = isInstallment ? clean(payload.installmentName) : "";
  const installmentPhone = isInstallment ? clean(payload.installmentPhone) : "";
  const dateOfBirth = isInstallment ? cleanDate(payload.dateOfBirth, "ngày sinh") : "";
  const citizenId = isInstallment ? clean(payload.citizenId).replace(/\D/g, "") : "";
  const citizenIdIssueDate = isInstallment ? cleanDate(payload.citizenIdIssueDate, "ngày cấp CCCD") : "";
  const citizenIdIssuePlace = isInstallment ? clean(payload.citizenIdIssuePlace) : "";
  const downPaymentPercent = isInstallment ? Number(payload.downPaymentPercent) : 0;
  const installmentTerm = isInstallment ? Number(payload.installmentTerm) : 0;
  const monthlyRate = FINANCE_RATES.get(financeCompany) ?? 0;

  if (isInstallment) {
    if (!FINANCE_RATES.has(financeCompany)) {
      throw new Error("Vui lòng chọn công ty tài chính cần tư vấn.");
    }
    if (total < MIN_INSTALLMENT_TOTAL) {
      throw new Error("Trả góp qua công ty tài chính chỉ áp dụng cho đơn hàng từ 8.000.000đ.");
    }
    if (!DOWN_PAYMENT_OPTIONS.includes(downPaymentPercent as (typeof DOWN_PAYMENT_OPTIONS)[number]) || !INSTALLMENT_TERMS.includes(installmentTerm as (typeof INSTALLMENT_TERMS)[number])) {
      throw new Error("Vui lòng chọn mức trả trước và kỳ hạn hợp lệ.");
    }
    if (!installmentName || !/^[0-9 +]{9,15}$/.test(installmentPhone)) {
      throw new Error("Vui lòng nhập đúng họ tên và số điện thoại đăng ký trả góp.");
    }
    if (!/^\d{12}$/.test(citizenId)) {
      throw new Error("Số CCCD phải gồm đúng 12 chữ số.");
    }
    if (!citizenIdIssuePlace) {
      throw new Error("Vui lòng nhập nơi cấp CCCD.");
    }
    if (citizenIdIssueDate < dateOfBirth) {
      throw new Error("Ngày cấp CCCD không thể trước ngày sinh.");
    }
    if (payload.installmentConsent !== true) {
      throw new Error("Vui lòng đồng ý chuyển hồ sơ cho công ty tài chính đã chọn.");
    }
  }
  const installmentPlan = calculateInstallmentPlan(
    total,
    downPaymentPercent,
    installmentTerm,
    monthlyRate,
  );

  return {
    orderCode,
    customerName,
    phone,
    email: clean(payload.email),
    productSlug,
    productName,
    color,
    storage,
    quantity,
    deliveryMethod: clean(payload.deliveryMethod),
    address: clean(payload.address),
    paymentMethod,
    total: total > 0 ? String(total) : "",
    discount: String(voucherResult.discount),
    voucherCode: voucherResult.code,
    items,
    customerId: (await currentCustomer())?.id ?? "",
    contactTime: clean(payload.contactTime),
    note: clean(payload.note),
    financeCompany,
    installmentName,
    installmentPhone,
    dateOfBirth,
    citizenId,
    citizenIdIssueDate,
    citizenIdIssuePlace,
    downPaymentPercent,
    downPaymentAmount: isInstallment ? String(installmentPlan.downPaymentAmount) : "",
    financedAmount: isInstallment ? String(installmentPlan.financedAmount) : "",
    installmentTerm,
    monthlyPayment: isInstallment ? String(installmentPlan.monthlyPayment) : "",
    estimatedInterest: isInstallment ? String(installmentPlan.interestAmount) : "",
  };
}

function normalizeItems(rawItems: unknown[], products: Awaited<ReturnType<typeof getPublicProducts>>): OrderItem[] {
  if (!rawItems.length || rawItems.length > 20) throw new Error("Giỏ hàng phải có từ 1 đến 20 sản phẩm.");
  return rawItems.map((raw) => {
    const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const productSlug = clean(input.productSlug);
    const product = products.find((item) => item.slug === productSlug);
    if (!product) throw new Error("Có sản phẩm trong giỏ không còn được bán.");
    const ram = clean(input.ram);
    const storage = clean(input.storage);
    const color = clean(input.color);
    const quantity = Math.min(10, Math.max(1, Math.floor(Number(input.quantity)) || 1));
    if (product.storageOptions?.length && !product.storageOptions.some((option) => sameOption(option, storage))) throw new Error(`Dung lượng của ${product.name} không hợp lệ.`);
    const variants = (product.variants ?? []).filter((variant) => (!ram || sameOption(variant.ram, ram)) && (!storage || sameOption(variant.storage, storage)));
    const rams = (product.variants ?? []).map((variant) => variant.ram).filter(Boolean);
    if (rams.length && !rams.some((option) => sameOption(option, ram))) throw new Error(`RAM của ${product.name} không hợp lệ.`);
    const colors = variants.map((variant) => variant.color).filter(Boolean);
    if (colors.length && !colors.some((option) => sameOption(option, color))) throw new Error(`Màu của ${product.name} không hợp lệ.`);
    const unitPrice = productUnitPrice(product, storage, color, ram);
    if (unitPrice <= 0) throw new Error(`${product.name} chưa có giá hợp lệ.`);
    const image = variants.find((variant) => sameOption(variant.color, color))?.image || product.image;
    return { productSlug, productName: product.name, ram, storage, color, quantity, unitPrice, image };
  });
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 600) : "";
}

function sameOption(left?: string, right?: string) {
  return (left ?? "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase() === (right ?? "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function cleanDate(value: unknown, label: string) {
  const date = clean(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Vui lòng nhập đúng ${label}.`);
  }
  const parsed = new Date(`${date}T00:00:00Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date ||
    parsed.getTime() > Date.now()
  ) {
    throw new Error(`${label[0].toUpperCase()}${label.slice(1)} không hợp lệ.`);
  }
  return date;
}
