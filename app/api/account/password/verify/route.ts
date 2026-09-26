import { cookies } from "next/headers";
import { checkOtpVerification } from "@/app/account-providers";
import { CUSTOMER_PASSWORD_RESET_COOKIE } from "@/app/customer-auth";
import { markPasswordResetVerified, passwordResetFromToken, recordPasswordResetAttempt } from "@/db/customers";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { code?: string };
    const code = String(body.code || "").replace(/\D/g, "");
    if (!/^\d{4,10}$/.test(code)) throw new Error("Mã xác minh chưa hợp lệ.");
    const token = (await cookies()).get(CUSTOMER_PASSWORD_RESET_COOKIE)?.value;
    const pending = await passwordResetFromToken(token);
    if (!pending) throw new Error("Phiên khôi phục đã hết hạn. Vui lòng yêu cầu mã mới.");
    if (!await checkOtpVerification(pending.destination, code)) {
      await recordPasswordResetAttempt(pending.id);
      throw new Error("Mã xác minh không đúng hoặc đã hết hạn.");
    }
    await markPasswordResetVerified(pending.id);
    return Response.json({ ok: true, message: "Mã xác minh chính xác. Bạn có thể đặt mật khẩu mới." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ ok: false, message: error instanceof Error ? error.message : "Không thể xác minh mã." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
