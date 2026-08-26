import {
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { currentAdminUser } from "@/app/admin-auth";
import {
  consumeAttendanceChallenge,
  getAttendancePasskeys,
  saveAttendancePasskey,
  updateAttendancePasskeyCounter,
} from "@/db/attendance-passkeys";
import { employeeCheck } from "@/db/hr";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await currentAdminUser();
    if (!user || user.role === "owner") return Response.json({ message: "Không có quyền xác thực chấm công." }, { status: 403 });
    const body = await request.json() as { flow?: unknown; challengeId?: unknown; response?: unknown; mode?: unknown };
    const flow = body.flow === "authentication" ? "authentication" : body.flow === "registration" ? "registration" : "";
    const challengeId = typeof body.challengeId === "string" ? body.challengeId : "";
    if (!flow || !challengeId || !body.response) return Response.json({ message: "Phiên xác thực không hợp lệ." }, { status: 400 });
    const expectedChallenge = await consumeAttendanceChallenge(challengeId, user.id, flow);
    if (!expectedChallenge) return Response.json({ message: "Phiên xác thực đã hết hạn. Vui lòng thử lại." }, { status: 410 });
    const url = new URL(request.url);
    const expectedOrigin = url.origin;
    const expectedRPID = url.hostname;

    if (flow === "registration") {
      const verification = await verifyRegistrationResponse({
        response: body.response as RegistrationResponseJSON,
        expectedChallenge,
        expectedOrigin,
        expectedRPID,
        requireUserPresence: true,
        requireUserVerification: true,
      });
      if (!verification.verified || !verification.registrationInfo.userVerified) throw new Error("Thiết bị chưa xác nhận được chủ nhân.");
      const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
      await saveAttendancePasskey({
        id: credential.id,
        adminUserId: user.id,
        publicKey: isoBase64URL.fromBuffer(credential.publicKey),
        counter: credential.counter,
        transports: credential.transports ?? [],
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
      });
      return Response.json({ ok: true, message: "Đã đăng ký thiết bị sinh trắc học." }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
    }

    const response = body.response as AuthenticationResponseJSON;
    const passkey = (await getAttendancePasskeys(user.id)).find((item) => item.id === response.id);
    if (!passkey) return Response.json({ message: "Thiết bị này chưa được đăng ký cho tài khoản." }, { status: 404 });
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
      credential: {
        id: passkey.id,
        publicKey: isoBase64URL.toBuffer(passkey.publicKey),
        counter: passkey.counter,
        transports: passkey.transports as AuthenticatorTransportFuture[],
      },
      requireUserVerification: true,
    });
    if (!verification.verified || !verification.authenticationInfo.userVerified) throw new Error("Xác thực khuôn mặt/sinh trắc học chưa thành công.");
    const mode = body.mode === "out" ? "out" : body.mode === "in" ? "in" : "";
    if (!mode) return Response.json({ message: "Loại chấm công không hợp lệ." }, { status: 400 });
    await updateAttendancePasskeyCounter(passkey.id, user.id, verification.authenticationInfo.newCounter);
    await employeeCheck(user.id, mode, `${user.name} · sinh trắc học thiết bị`);
    return Response.json({ ok: true, status: mode === "in" ? "checked-in" : "checked-out" }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Không thể xác thực sinh trắc học." }, { status: 400 });
  }
}
