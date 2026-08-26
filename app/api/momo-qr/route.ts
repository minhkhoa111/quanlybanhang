import QRCode from "qrcode";
import { getOrderPaymentByCode } from "@/db/orders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderCode = searchParams.get("orderCode")?.trim().toUpperCase() ?? "";
  const expiresAt = Number(searchParams.get("expiresAt"));
  const now = Date.now();
  if (!/^[A-Z0-9-]{6,25}$/.test(orderCode)) return Response.json({ message: "Mã đơn hàng không hợp lệ." }, { status: 400 });
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return Response.json({ message: "Mã QR đã hết hạn." }, { status: 410 });
  if (expiresAt > now + 10 * 60 * 1000 + 5_000) return Response.json({ message: "Thời hạn QR không hợp lệ." }, { status: 400 });
  const order = await getOrderPaymentByCode(orderCode);
  const amount = Number(order?.total || 0);
  if (!order || !order.payment_method.startsWith("MoMo") || amount <= 0 || amount > 2_000_000_000) {
    return Response.json({ message: "Đơn hàng MoMo không hợp lệ." }, { status: 400 });
  }
  const recipientLink = "https://nhantien.momo.vn/0869275642";
  const svg = await QRCode.toString(recipientLink, { type: "svg", width: 720, margin: 3, errorCorrectionLevel: "M", color: { dark: "#a50064", light: "#ffffff" } });
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" } });
}
