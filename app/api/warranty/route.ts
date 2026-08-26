import { getWarrantyOrder } from "@/db/orders";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { orderCode?: unknown; phone?: unknown };
    const orderCode = typeof body.orderCode === "string" ? body.orderCode.trim().toUpperCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    if (!/^[A-Z0-9-]{6,25}$/.test(orderCode) || !/^\+?[0-9 .-]{9,18}$/.test(phone)) {
      return Response.json({ message: "Vui lòng nhập đúng mã đơn hàng và số điện thoại." }, { status: 400 });
    }

    const order = await getWarrantyOrder(orderCode, phone);
    if (!order) {
      return Response.json({ message: "Không tìm thấy thông tin phù hợp. Hãy kiểm tra lại mã đơn và số điện thoại." }, { status: 404 });
    }

    const startDate = order.warrantyStartDate || order.invoiceDate;
    return Response.json({
      warranty: {
        orderCode: order.orderCode,
        productName: order.productName,
        items: order.items.map(({ productName, ram, storage, color, quantity }) => ({ productName, ram, storage, color, quantity })),
        orderStatus: order.status,
        invoiceNumber: order.invoiceNumber,
        warrantyMonths: order.warrantyMonths,
        warrantyStartDate: startDate,
        warrantyEndDate: warrantyEndDate(startDate, order.warrantyMonths),
        warrantySerials: order.warrantySerials,
        warrantyPolicy: order.warrantyPolicy,
        branchName: order.branchName,
      },
    }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch {
    return Response.json({ message: "Không thể tra cứu bảo hành lúc này." }, { status: 400 });
  }
}

function warrantyEndDate(startDate: string, months: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || months <= 0) return "";
  const date = new Date(`${startDate}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}
