import { cookies } from "next/headers";
import { startOtpVerification } from "@/app/account-providers";
import { verificationFromToken } from "@/db/customers";
import { CUSTOMER_VERIFICATION_COOKIE } from "@/app/customer-auth";

export async function POST() {
  try {
    const pending = await verificationFromToken((await cookies()).get(CUSTOMER_VERIFICATION_COOKIE)?.value);
    if (!pending) throw new Error("Phiên xác minh đã hết hạn. Vui lòng đăng nhập lại.");
    await startOtpVerification(pending.destination, pending.channel);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, message: error instanceof Error ? error.message : "Không thể gửi lại mã." }, { status: 400 });
  }
}
