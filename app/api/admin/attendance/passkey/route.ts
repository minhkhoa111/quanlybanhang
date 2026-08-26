import { currentAdminUser } from "@/app/admin-auth";
import { revokeAttendancePasskeys } from "@/db/attendance-passkeys";

export const dynamic = "force-dynamic";

export async function DELETE() {
  const user = await currentAdminUser();
  if (!user || user.role === "owner") return Response.json({ message: "Không có quyền gỡ thiết bị chấm công." }, { status: 403 });
  await revokeAttendancePasskeys(user.id);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
