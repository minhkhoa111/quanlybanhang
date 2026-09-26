import { cookies } from "next/headers";
import { clearAdminSession } from "@/app/admin-auth";
import { CUSTOMER_COOKIE, CUSTOMER_PASSWORD_RESET_COOKIE, customerCookieOptions, shortLivedCookieOptions } from "@/app/customer-auth";
import { createCustomerSession, passwordResetFromToken, resetCustomerPassword } from "@/db/customers";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { password?: string; confirmPassword?: string };
    const password = String(body.password || "");
    if (password !== String(body.confirmPassword || "")) throw new Error("Hai lần nhập mật khẩu mới chưa trùng nhau.");
    const store = await cookies();
    const token = store.get(CUSTOMER_PASSWORD_RESET_COOKIE)?.value;
    const pending = await passwordResetFromToken(token);
    if (!pending || !pending.verifiedAt) throw new Error("Bạn cần xác minh mã trước khi đổi mật khẩu.");
    const customer = await resetCustomerPassword(pending.id, pending.customer.id, password);
    if (!customer) throw new Error("Không tìm thấy tài khoản cần khôi phục.");
    const session = await createCustomerSession(customer.id);
    await clearAdminSession();
    store.set(CUSTOMER_PASSWORD_RESET_COOKIE, "", shortLivedCookieOptions(0));
    store.set(CUSTOMER_COOKIE, session, customerCookieOptions());
    return Response.json({ ok: true, customer, message: "Mật khẩu đã được cập nhật." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ ok: false, message: error instanceof Error ? error.message : "Không thể đặt lại mật khẩu." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
