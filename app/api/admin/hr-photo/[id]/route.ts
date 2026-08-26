import { env } from "cloudflare:workers";
import { canManageEmployee, currentAdminUser } from "@/app/admin-auth";
import { getEmployeePhotoKey, getEmployeeProfile } from "@/db/hr";

type Bindings = { PRODUCT_IMAGES?: R2Bucket };
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentAdminUser();
  if (!user || (user.role !== "owner" && user.role !== "manager")) return new Response("Không có quyền truy cập.", { status: 403 });
  const { id } = await params;
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(id)) return new Response("Mã nhân viên không hợp lệ.", { status: 400 });
  const employee = await getEmployeeProfile(id);
  if (!employee || !canManageEmployee(user, employee)) return new Response("Không có quyền truy cập.", { status: 403 });
  const key = await getEmployeePhotoKey(id);
  if (!key) return new Response("Chưa có ảnh nhân sự.", { status: 404 });
  const object = await (env as unknown as Bindings).PRODUCT_IMAGES?.get(key);
  if (!object) return new Response("Không tìm thấy ảnh nhân sự.", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", "private, no-store");
  headers.set("content-security-policy", "default-src 'none'");
  headers.set("x-content-type-options", "nosniff");
  return new Response(object.body, { headers });
}
