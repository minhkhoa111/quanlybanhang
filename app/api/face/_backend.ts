import { env } from "cloudflare:workers";
import { canManageEmployee, currentAdminUser } from "@/app/admin-auth";
import { getAdminUsers, type AdminUser } from "@/db/admin-users";

type FaceBindings = {
  FACE_API_URL?: string;
  FACE_API_KEY?: string;
};

export type FacePayload = { employee_id: string; image_base64: string };

export class FaceProxyError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

export async function requireFaceManager() {
  const user = await currentAdminUser();
  if (!user) throw new FaceProxyError("Bạn cần đăng nhập để quản lý khuôn mặt.", 401);
  if (user.role !== "owner" && user.role !== "manager") {
    throw new FaceProxyError("Chỉ Giám đốc hoặc quản lý chi nhánh được quản lý khuôn mặt nhân viên.", 403);
  }
  return user;
}

export async function readFacePayload(request: Request, employeeIdOverride?: string): Promise<FacePayload> {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    throw new FaceProxyError("Dữ liệu gửi lên không hợp lệ.", 400);
  }
  const employeeId = cleanEmployeeId(employeeIdOverride || body.employee_id);
  const imageBase64 = String(body.image_base64 || "");
  validateFaceImage(imageBase64);
  return { employee_id: employeeId, image_base64: imageBase64 };
}

export async function requireEmployee(value: string) {
  const employeeId = cleanEmployeeId(value);
  const employees = await getAdminUsers();
  const employee = employees.find((item) => item.id === employeeId);
  if (!employee) {
    throw new FaceProxyError("Không tìm thấy nhân viên trong hệ thống.", 404);
  }
  return employee;
}

export async function requireManagedEmployee(manager: AdminUser, value: string) {
  const employee = await requireEmployee(value);
  if (!canManageEmployee(manager, employee)) {
    throw new FaceProxyError("Bạn không được quản lý khuôn mặt nhân viên ngoài chi nhánh của mình.", 403);
  }
  return employee;
}

export async function scopedEmployees(manager: AdminUser) {
  const employees = await getAdminUsers();
  return manager.role === "owner" ? employees : employees.filter((employee) => canManageEmployee(manager, employee));
}

export async function faceBackend(path: string, init: RequestInit = {}) {
  const bindings = env as unknown as FaceBindings;
  const baseUrl = String(bindings.FACE_API_URL || process.env.FACE_API_URL || "http://127.0.0.1:8001").trim().replace(/\/+$/, "");
  const apiKey = String(bindings.FACE_API_KEY || process.env.FACE_API_KEY || "").trim();
  if (!apiKey) throw new FaceProxyError("Server Next.js chưa được cấu hình FACE_API_KEY.", 503);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey, ...(init.headers || {}) },
      signal: controller.signal,
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) throw new FaceProxyError(String(data.detail || data.message || "DeepFace không thể xử lý yêu cầu."), response.status);
    return data;
  } catch (error) {
    if (error instanceof FaceProxyError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw new FaceProxyError("DeepFace xử lý quá thời gian cho phép.", 504);
    throw new FaceProxyError("Không kết nối được máy chủ nhận diện khuôn mặt.", 502);
  } finally {
    clearTimeout(timeout);
  }
}

export function faceError(error: unknown) {
  const status = error instanceof FaceProxyError ? error.status : 500;
  const message = error instanceof FaceProxyError ? error.message : "Không thể xử lý yêu cầu khuôn mặt.";
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}

function cleanEmployeeId(value: unknown) {
  const normalized = String(value || "").trim();
  if (!normalized || normalized.length > 100 || /[\u0000-\u001f\u007f]/.test(normalized)) {
    throw new FaceProxyError("Mã nhân viên không hợp lệ.", 400);
  }
  return normalized;
}

function validateFaceImage(image: string) {
  if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(image) || image.length < 200) {
    throw new FaceProxyError("Ảnh khuôn mặt không hợp lệ.", 400);
  }
  if (image.length > 4_000_000) throw new FaceProxyError("Một ảnh khuôn mặt vượt quá dung lượng cho phép.", 413);
}
