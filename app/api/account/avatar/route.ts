import { env } from "cloudflare:workers";
import { currentCustomer } from "@/app/customer-auth";
import { updateCustomerAvatar } from "@/db/customers";

type Bindings = { PRODUCT_IMAGES?: R2Bucket };

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function POST(request: Request) {
  try {
    const customer = await currentCustomer();
    if (!customer) return Response.json({ ok: false, message: "Vui lòng đăng nhập." }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("avatar");
    if (!(file instanceof File) || file.size === 0) throw new Error("Vui lòng chọn ảnh đại diện.");
    const extension = allowedTypes.get(file.type);
    if (!extension) throw new Error("Ảnh đại diện phải là tệp JPG, PNG hoặc WebP.");
    if (file.size > 3 * 1024 * 1024) throw new Error("Ảnh đại diện phải nhỏ hơn 3 MB.");

    const bucket = (env as unknown as Bindings).PRODUCT_IMAGES;
    if (!bucket) throw new Error("Kho ảnh chưa sẵn sàng.");
    const key = `avatar-${customer.id}-${crypto.randomUUID()}.${extension}`;
    await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
    const updated = await updateCustomerAvatar(customer.id, `/api/product-images/${key}`);
    const previousKey = imageKey(customer.avatarUrl);
    if (previousKey) await bucket.delete(previousKey).catch(() => undefined);

    return Response.json({ ok: true, customer: updated });
  } catch (error) {
    return Response.json({ ok: false, message: error instanceof Error ? error.message : "Không thể cập nhật ảnh đại diện." }, { status: 400 });
  }
}

export async function DELETE() {
  try {
    const customer = await currentCustomer();
    if (!customer) return Response.json({ ok: false, message: "Vui lòng đăng nhập." }, { status: 401 });
    const key = imageKey(customer.avatarUrl);
    const bucket = (env as unknown as Bindings).PRODUCT_IMAGES;
    if (key && bucket) await bucket.delete(key).catch(() => undefined);
    const updated = await updateCustomerAvatar(customer.id, "");
    return Response.json({ ok: true, customer: updated });
  } catch (error) {
    return Response.json({ ok: false, message: error instanceof Error ? error.message : "Không thể gỡ ảnh đại diện." }, { status: 400 });
  }
}

function imageKey(avatarUrl: string) {
  const match = avatarUrl.match(/^\/api\/product-images\/([a-zA-Z0-9._-]+)$/);
  return match?.[1] ?? "";
}
