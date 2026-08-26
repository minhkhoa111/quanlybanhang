import { generateAuthenticationOptions, generateRegistrationOptions, type AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { currentAdminUser } from "@/app/admin-auth";
import { createAttendanceChallenge, getAttendancePasskeys } from "@/db/attendance-passkeys";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await currentAdminUser();
    if (!user || user.role === "owner") return Response.json({ message: "Không có quyền đăng ký thiết bị chấm công." }, { status: 403 });
    const body = await request.json() as { flow?: unknown };
    const flow = body.flow === "authentication" ? "authentication" : body.flow === "registration" ? "registration" : "";
    if (!flow) return Response.json({ message: "Yêu cầu xác thực không hợp lệ." }, { status: 400 });
    const { hostname: rpID } = new URL(request.url);
    const passkeys = await getAttendancePasskeys(user.id);

    const options = flow === "registration"
      ? await generateRegistrationOptions({
          rpName: "Huy Apple Attendance",
          rpID,
          userID: new TextEncoder().encode(user.id),
          userName: user.username,
          userDisplayName: user.name,
          attestationType: "none",
          timeout: 60_000,
          excludeCredentials: passkeys.map((item) => ({ id: item.id, transports: item.transports as AuthenticatorTransportFuture[] })),
          authenticatorSelection: { authenticatorAttachment: "platform", residentKey: "discouraged", userVerification: "required" },
          preferredAuthenticatorType: "localDevice",
        })
      : await generateAuthenticationOptions({
          rpID,
          timeout: 60_000,
          userVerification: "required",
          allowCredentials: passkeys.map((item) => ({ id: item.id, transports: item.transports as AuthenticatorTransportFuture[] })),
        });

    if (flow === "authentication" && !passkeys.length) {
      return Response.json({ message: "Bạn chưa đăng ký Face ID/sinh trắc học trên thiết bị." }, { status: 409 });
    }
    const challengeId = await createAttendanceChallenge(user.id, flow, options.challenge);
    return Response.json({ options, challengeId }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Không thể khởi tạo xác thực sinh trắc học." }, { status: 400 });
  }
}
