import { cookies } from "next/headers";
import { startOtpVerification } from "@/app/account-providers";
import { CUSTOMER_PASSWORD_RESET_COOKIE, shortLivedCookieOptions } from "@/app/customer-auth";
import { createCustomerPasswordResetSession, customerForPasswordReset } from "@/db/customers";

const GENERIC_MESSAGE = "Nếu thông tin khớp với tài khoản, mã xác minh đã được gửi qua email hoặc SMS.";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { identifier?: string };
    const identifier = String(body.identifier || "").trim();
    if (identifier.length < 4 || identifier.length > 160) throw new Error("Vui lòng nhập tên đăng nhập, email hoặc số điện thoại hợp lệ.");
    const store = await cookies();
    const customer = await customerForPasswordReset(identifier);
    if (!customer) {
      store.set(CUSTOMER_PASSWORD_RESET_COOKIE, "", shortLivedCookieOptions(0));
      return Response.json({ ok: true, message: GENERIC_MESSAGE }, { headers: { "Cache-Control": "no-store" } });
    }
    const compactPhone = identifier.replace(/[\s().-]/g, "");
    const channel = compactPhone === customer.phone.replace(/[\s().-]/g, "") ? "sms" as const : "email" as const;
    await startOtpVerification(channel === "sms" ? customer.phone : customer.email, channel);
    const reset = await createCustomerPasswordResetSession(customer, channel);
    store.set(CUSTOMER_PASSWORD_RESET_COOKIE, reset.token, shortLivedCookieOptions(15 * 60));
    return Response.json({ ok: true, message: GENERIC_MESSAGE }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ ok: false, message: error instanceof Error ? error.message : "Không thể gửi mã xác minh lúc này." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
