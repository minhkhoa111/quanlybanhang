import { cookies } from "next/headers";
import { checkOtpVerification } from "@/app/account-providers";
import { createCustomerSession, deleteVerificationSession, markCustomerVerified, verificationFromToken } from "@/db/customers";
import { CUSTOMER_COOKIE, CUSTOMER_VERIFICATION_COOKIE, customerCookieOptions, shortLivedCookieOptions } from "@/app/customer-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { code?: string };
    const code = (body.code || "").replace(/\D/g, "");
    if (!/^\d{4,10}$/.test(code)) throw new Error("Mã xác minh chưa hợp lệ.");
    const store = await cookies();
    const pending = await verificationFromToken(store.get(CUSTOMER_VERIFICATION_COOKIE)?.value);
    if (!pending) throw new Error("Phiên xác minh đã hết hạn. Vui lòng đăng nhập lại.");
    if (!await checkOtpVerification(pending.destination, code)) throw new Error("Mã xác minh không đúng hoặc đã hết hạn.");
    const customer = await markCustomerVerified(pending.customer.id, pending.channel);
    if (!customer) throw new Error("Không tìm thấy tài khoản cần xác minh.");
    const session = await createCustomerSession(customer.id);
    await deleteVerificationSession(pending.id);
    store.set(CUSTOMER_VERIFICATION_COOKIE, "", shortLivedCookieOptions(0));
    store.set(CUSTOMER_COOKIE, session, customerCookieOptions());
    return Response.json({ ok: true, customer });
  } catch (error) {
    return Response.json({ ok: false, message: error instanceof Error ? error.message : "Không thể xác minh." }, { status: 400 });
  }
}
