import { env } from "cloudflare:workers";
import { currentAdminUser } from "@/app/admin-auth";
import { canAccessTask, getTaskFile } from "@/db/tasks";

type Bindings = { PRODUCT_IMAGES?: R2Bucket };
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const user = await currentAdminUser();
  if (!user) return new Response("Vui lòng đăng nhập.", { status: 401 });
  const { kind, id } = await params;
  if ((kind !== "task" && kind !== "report") || !/^[a-zA-Z0-9-]{8,80}$/.test(id)) return new Response("Đường dẫn file không hợp lệ.", { status: 400 });
  const file = await getTaskFile(kind, id);
  if (!file || !file.key || !canAccessTask(user, file.task)) return new Response("Không có quyền tải file này.", { status: 403 });
  const object = await (env as unknown as Bindings).PRODUCT_IMAGES?.get(file.key);
  if (!object) return new Response("Không tìm thấy file.", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("content-type", file.type || headers.get("content-type") || "application/octet-stream");
  headers.set("content-disposition", `attachment; filename="work-file"; filename*=UTF-8''${encodeURIComponent(file.name || "work-file")}`);
  headers.set("cache-control", "private, no-store");
  headers.set("x-content-type-options", "nosniff");
  headers.set("content-security-policy", "default-src 'none'");
  return new Response(object.body, { headers });
}
