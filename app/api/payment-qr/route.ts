import QRCode from "qrcode";
import { BanksObject, QRPay } from "vietnam-qr-pay";
import { getPublicProducts } from "@/db/products";
import { productUnitPrice } from "@/app/order-pricing";
import { getOrderPaymentByCode } from "@/db/orders";
import { validateVoucher } from "@/db/vouchers";

const BANK_ACCOUNT = "6820102010";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productSlug = searchParams.get("product")?.trim() ?? "";
  const storage = searchParams.get("storage")?.trim() ?? "";
  const ram = searchParams.get("ram")?.trim() ?? "";
  const voucherCode = searchParams.get("voucher")?.trim() ?? "";
  const orderCode = searchParams.get("orderCode")?.trim().toUpperCase() ?? "";
  const quantity = Math.min(10, Math.max(1, Math.floor(Number(searchParams.get("quantity"))) || 1));
  const expiresAt = Number(searchParams.get("expiresAt"));
  const now = Date.now();

  if (!/^[A-Z0-9-]{6,25}$/.test(orderCode)) {
    return Response.json({ message: "Mã đơn hàng không hợp lệ." }, { status: 400 });
  }
  if (!Number.isFinite(expiresAt) || expiresAt <= now) {
    return Response.json({ message: "Mã QR đã hết hạn." }, { status: 410 });
  }
  if (expiresAt > now + 10 * 60 * 1000 + 5_000) {
    return Response.json({ message: "Thời hạn QR không hợp lệ." }, { status: 400 });
  }

  const savedOrder = productSlug ? undefined : await getOrderPaymentByCode(orderCode);
  if (savedOrder && !savedOrder.payment_method.startsWith("Chuyển khoản Techcombank")) {
    return Response.json({ message: "Đơn hàng không sử dụng phương thức chuyển khoản." }, { status: 400 });
  }
  const products = productSlug ? await getPublicProducts() : [];
  const product = products.find((item) => item.slug === productSlug);
  const subtotal = savedOrder
    ? Number(savedOrder.total)
    : productUnitPrice(product, storage, "", ram) * quantity;
  const voucher = savedOrder ? { discount: 0 } : await validateVoucher(voucherCode, subtotal);
  const amount = Math.max(0, subtotal - voucher.discount);
  if ((!product && !savedOrder) || amount <= 0 || amount > 2_000_000_000) {
    return Response.json({ message: "Sản phẩm chưa có giá thanh toán hợp lệ." }, { status: 400 });
  }

  const payload = QRPay.initVietQR({
    bankBin: BanksObject.techcombank.bin,
    bankNumber: BANK_ACCOUNT,
    amount: String(amount),
    purpose: orderCode,
  }).build();
  const svg = await QRCode.toString(payload, {
    type: "svg",
    width: 720,
    margin: 3,
    errorCorrectionLevel: "M",
    color: { dark: "#111827", light: "#ffffff" },
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
