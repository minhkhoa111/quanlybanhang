import { validateVoucher } from "@/db/vouchers";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { code?: string; subtotal?: number };
    const subtotal = Math.max(0, Math.floor(Number(body.subtotal) || 0));
    if (!subtotal) throw new Error("Đơn hàng chưa có sản phẩm để áp dụng voucher.");
    const result = await validateVoucher(body.code ?? "", subtotal);
    return Response.json({ ok: true, code: result.code, discount: result.discount, total: subtotal - result.discount });
  } catch (error) {
    return Response.json({ ok: false, message: error instanceof Error ? error.message : "Voucher không hợp lệ." }, { status: 400 });
  }
}
