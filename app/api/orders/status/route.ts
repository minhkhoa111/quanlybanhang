import { getOrderStatusByCode } from "@/db/orders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const orderCode = new URL(request.url).searchParams.get("orderCode")?.trim().toUpperCase() ?? "";
  if (!/^HA[A-Z0-9]{10}$/.test(orderCode)) {
    return Response.json({ message: "Mã đơn hàng không hợp lệ." }, { status: 400 });
  }

  const order = await getOrderStatusByCode(orderCode);
  if (!order) {
    return Response.json({ message: "Không tìm thấy đơn hàng." }, { status: 404 });
  }

  return Response.json(
    { status: order.status === "new" ? "pending" : order.status, paymentStatus: order.payment_status },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
