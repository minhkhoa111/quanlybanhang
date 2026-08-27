import { currentAdminUser } from "@/app/admin-auth";
import { employeeCheck } from "@/db/hr";
import { faceBackend, faceError, FaceProxyError, readFacePayload } from "../_backend";

export async function GET() {
  try {
    const user = await attendanceUser();
    const result = await faceBackend("/employees") as { employees?: Array<{ employee_id: string }> };
    return Response.json({ registered: (result.employees || []).some((employee) => employee.employee_id === user.id) }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    return faceError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await attendanceUser();
    const clonedRequest = request.clone();
    const body = await clonedRequest.json() as { mode?: unknown };
    const mode = body.mode === "in" ? "in" : body.mode === "out" ? "out" : "";
    if (!mode) throw new FaceProxyError("Loại chấm công không hợp lệ.", 400);
    const payload = await readFacePayload(request, user.id);
    const result = await faceBackend("/verify", { method: "POST", body: JSON.stringify(payload) }) as { verified?: boolean; confidence?: number; distance?: number; message?: string; facial_area?: Record<string, number> };
    if (!result.verified) return Response.json({ ok: false, verified: false, message: result.message || "Khuôn mặt không trùng khớp.", facial_area: result.facial_area }, { status: 401, headers: { "Cache-Control": "private, no-store, max-age=0" } });
    try {
      await employeeCheck(user.id, mode, `${user.name} · DeepFace`);
    } catch (error) {
      throw new FaceProxyError(error instanceof Error ? error.message : "Không thể ghi nhận chấm công.", 409);
    }
    return Response.json({ ok: true, verified: true, status: mode === "in" ? "checked-in" : "checked-out", confidence: result.confidence, distance: result.distance, facial_area: result.facial_area }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    return faceError(error);
  }
}

async function attendanceUser() {
  const user = await currentAdminUser();
  if (!user) throw new FaceProxyError("Bạn cần đăng nhập tài khoản nhân viên để chấm công.", 401);
  if (user.role === "owner") throw new FaceProxyError("Tài khoản Giám đốc không thuộc danh sách chấm công nhân viên.", 403);
  return user;
}
