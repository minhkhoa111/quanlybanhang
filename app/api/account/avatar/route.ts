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
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!hasValidImageSignature(bytes, file.type)) {
      throw new Error("Nội dung tệp không khớp với định dạng ảnh đã chọn.");
    }

    const bucket = (env as unknown as Bindings).PRODUCT_IMAGES;
    if (!bucket) throw new Error("Kho ảnh chưa sẵn sàng.");
    const key = `avatar-${customer.id}-${crypto.randomUUID()}.${extension}`;
    await bucket.put(key, bytes, { httpMetadata: { contentType: file.type } });
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

function hasValidImageSignature(bytes: Uint8Array, contentType: string) {
  if (bytes.length < 12) return false;
  if (contentType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (contentType === "image/png") {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
      && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  }
  const header = String.fromCharCode(...bytes.slice(0, 12));
  return contentType === "image/webp" && header.startsWith("RIFF") && header.slice(8, 12) === "WEBP";
}
