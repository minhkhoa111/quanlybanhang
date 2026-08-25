"use server";

import { env } from "cloudflare:workers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAction } from "@/app/admin-auth";
import {
  deleteManagedProducts,
  getManagedProductById,
  saveManagedProduct,
  setProductActive,
} from "@/db/products";
import { updateOrderInvoice, updateOrderPaymentStatus, updateOrderStatus } from "@/db/orders";
import type { Product, ProductVariant } from "@/app/products";

type Bindings = {
  PRODUCT_IMAGES?: R2Bucket;
};

const categories = [
  "iphone",
  "samsung",
  "android",
  "ipad",
  "macbook",
  "mac-mini-studio",
  "imac",
  "laptop",
  "laptop-cu",
  "smartwatch",
  "audio",
  "phu-kien",
] as const;

export async function saveAdminProductAction(formData: FormData) {
  await requireAdminAction();
  const mode = value(formData, "mode");
  let target = "/admin/products?status=saved";

  try {
    const name = value(formData, "name");
    const brand = value(formData, "brand");
    const category = normalizeCategory(value(formData, "category"));
    if (!name || !brand) throw new Error("Vui lòng nhập tên sản phẩm và hãng.");

    const existingId = value(formData, "id");
    const previous = existingId ? await getManagedProductById(existingId) : undefined;
    const id = existingId || crypto.randomUUID();
    const slug = slugify(value(formData, "slug") || previous?.slug || name);
    if (!slug) throw new Error("Đường dẫn sản phẩm chưa hợp lệ.");

    const uploadedImages = await uploadImages(formData.getAll("imageFiles"));
    const existingImages = splitValues(value(formData, "existingImages"), "\n");
    let allImages = [...existingImages, ...uploadedImages]
      .filter((image, index, list) => image && list.indexOf(image) === index);
    const primaryUploadIndex = Number(value(formData, "primaryUploadIndex"));
    const selectedUpload = Number.isInteger(primaryUploadIndex) && primaryUploadIndex >= 0
      ? uploadedImages[primaryUploadIndex]
      : "";
    const primaryImage = selectedUpload || value(formData, "primaryImage") || allImages[0] || "";
    if (!primaryImage) throw new Error("Hãy tải ít nhất một ảnh sản phẩm lên.");
    if (!primaryImage.startsWith("/") && !primaryImage.startsWith("https://")) {
      throw new Error("Ảnh chính phải là ảnh upload hoặc đường dẫn HTTPS.");
    }
    if (!allImages.includes(primaryImage)) {
      throw new Error("Ảnh chính phải nằm trong bộ ảnh sản phẩm đang giữ lại.");
    }

    const status = normalizeProductStatus(value(formData, "status"));
    const sellingPrice = value(formData, "sellingPrice") || value(formData, "price") || previous?.price || "Liên hệ giá tốt";
    const variants = await uploadVariantImages(parseVariants(value(formData, "variantsJson"), category), formData);
    allImages = [...allImages, ...variants.map((variant) => variant.image).filter((image): image is string => Boolean(image))]
      .filter((image, index, list) => list.indexOf(image) === index);

    await saveManagedProduct({
      id,
      slug,
      name,
      brand,
      category,
      sku: value(formData, "sku"),
      description: value(formData, "description"),
      image: primaryImage,
      images: allImages.length ? allImages : [primaryImage],
      badge: value(formData, "badge") || (status === "draft" ? "Nháp" : "Mới"),
      tagline: value(formData, "tagline") || value(formData, "description") || `Khám phá ${name} tại Huy Apple.`,
      price: sellingPrice,
      costPrice: value(formData, "costPrice"),
      sellingPrice,
      salePrice: value(formData, "salePrice"),
      stock: Math.max(0, Number(value(formData, "stock")) || 0),
      status,
      tags: splitValues(value(formData, "tags"), ","),
      seoTitle: value(formData, "seoTitle"),
      seoDescription: value(formData, "seoDescription"),
      variants,
      colors: splitValues(value(formData, "colors"), ",", ["#111111"]),
      specs: splitValues(value(formData, "specs"), "\n", ["Liên hệ để được xác nhận"]),
      featured: formData.get("featured") === "on",
      active: status === "active",
      source: value(formData, "source"),
    });

    refreshAdminAndStore(slug);
    target = mode === "another" ? "/admin/products/new?status=saved" : `/admin/products/${id}?status=saved`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể lưu sản phẩm.";
    target = `/admin/products/new?error=${encodeURIComponent(message)}`;
  }
  redirect(target);
}

export async function toggleAdminProductAction(formData: FormData) {
  await requireAdminAction();
  const id = value(formData, "id");
  const active = value(formData, "active") === "true";
  if (id) await setProductActive(id, active);
  refreshAdminAndStore(value(formData, "slug"));
  redirect("/admin/products?status=updated");
}

export async function bulkDeleteProductsAction(formData: FormData) {
  await requireAdminAction();
  const ids = formData.getAll("ids").filter((item): item is string => typeof item === "string");
  await deleteManagedProducts(ids);
  revalidatePath("/admin/products");
  redirect("/admin/products?status=deleted");
}

export async function changeOrderStatusAction(formData: FormData) {
  await requireAdminAction();
  const id = value(formData, "id");
  const status = value(formData, "status");
  if (id && status) await updateOrderStatus(id, status);
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}?status=updated`);
}

export async function changeOrderPaymentStatusAction(formData: FormData) {
  await requireAdminAction();
  const id = value(formData, "id");
  const paymentStatus = value(formData, "paymentStatus");
  if (id && paymentStatus) await updateOrderPaymentStatus(id, paymentStatus);
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}?status=updated`);
}

export async function saveOrderInvoiceAction(formData: FormData) {
  await requireAdminAction();
  const id = value(formData, "id");
  if (!id) redirect("/admin/orders");

  const allowedStatuses = ["not_created", "draft", "ready", "issued", "cancelled"];
  const invoiceStatus = allowedStatuses.includes(value(formData, "invoiceStatus"))
    ? value(formData, "invoiceStatus")
    : "draft";
  const rawTaxRate = Number(value(formData, "invoiceTaxRate"));
  const invoiceTaxRate = [0, 5, 8, 10].includes(rawTaxRate) ? rawTaxRate : 0;

  await updateOrderInvoice(id, {
    invoiceStatus,
    invoiceNumber: value(formData, "invoiceNumber"),
    invoiceTemplateCode: value(formData, "invoiceTemplateCode"),
    invoiceSeries: value(formData, "invoiceSeries"),
    invoiceDate: value(formData, "invoiceDate"),
    invoiceBuyerType: value(formData, "invoiceBuyerType") === "company" ? "company" : "individual",
    invoiceBuyerName: value(formData, "invoiceBuyerName"),
    invoiceCompanyName: value(formData, "invoiceCompanyName"),
    invoiceTaxCode: value(formData, "invoiceTaxCode").replace(/[^0-9-]/g, ""),
    invoiceAddress: value(formData, "invoiceAddress"),
    invoiceEmail: value(formData, "invoiceEmail"),
    invoiceSellerName: value(formData, "invoiceSellerName"),
    invoiceSellerTaxCode: value(formData, "invoiceSellerTaxCode").replace(/[^0-9-]/g, ""),
    invoiceSellerAddress: value(formData, "invoiceSellerAddress"),
    invoiceSellerPhone: value(formData, "invoiceSellerPhone"),
    invoiceTaxRate,
    invoiceTaxIncluded: formData.get("invoiceTaxIncluded") === "on",
    invoiceNote: value(formData, "invoiceNote"),
    warrantyMonths: Math.min(120, Math.max(0, Number(value(formData, "warrantyMonths")) || 0)),
    warrantyStartDate: value(formData, "warrantyStartDate"),
    warrantySerials: value(formData, "warrantySerials"),
    warrantyPolicy: value(formData, "warrantyPolicy"),
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}?status=invoice-saved`);
}

async function uploadImages(items: FormDataEntryValue[]) {
  const files = items.filter((item): item is File => item instanceof File && item.size > 0);
  if (!files.length) return [];

  const bucket = (env as unknown as Bindings).PRODUCT_IMAGES;
  if (!bucket) throw new Error("Kho ảnh sản phẩm chưa sẵn sàng.");

  const urls: string[] = [];
  for (const file of files) {
    if (!file.type.startsWith("image/")) throw new Error("Tệp tải lên phải là hình ảnh.");
    if (file.size > 6 * 1024 * 1024) throw new Error("Mỗi ảnh phải nhỏ hơn 6 MB.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const detectedType = detectImageType(bytes);
    if (!detectedType) throw new Error(`${file.name} không phải tệp ảnh PNG, JPG, WEBP, GIF hoặc AVIF hợp lệ.`);
    const key = `${crypto.randomUUID()}.${safeExtension("", detectedType)}`;
    await bucket.put(key, bytes, {
      httpMetadata: { contentType: detectedType },
    });
    urls.push(`/api/product-images/${key}`);
  }
  return urls;
}

async function uploadVariantImages(variants: ProductVariant[], formData: FormData) {
  return Promise.all(variants.map(async (variant) => {
    const file = formData.get(`variantImage_${variant.id}`);
    const [uploadedImage] = await uploadImages(file ? [file] : []);
    return uploadedImage ? { ...variant, image: uploadedImage } : variant;
  }));
}

function refreshAdminAndStore(slug: string) {
  ["/", "/iphone", "/samsung", "/android", "/ipad", "/macbook", "/mac-mini-studio", "/imac", "/laptop", "/laptop-cu", "/smartwatch", "/audio", "/phu-kien", "/admin", "/admin/products"].forEach((path) =>
    revalidatePath(path),
  );
  if (slug) revalidatePath(`/san-pham/${slug}`);
}

function normalizeCategory(raw: string): Product["category"] {
  return (categories as readonly string[]).includes(raw) ? (raw as Product["category"]) : "iphone";
}

function normalizeProductStatus(raw: string): NonNullable<Product["status"]> {
  if (raw === "draft" || raw === "inactive") return raw;
  return "active";
}

function parseVariants(raw: string, category: Product["category"]): ProductVariant[] {
  try {
    const parsed: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      .map((item) => {
        const storage = normalizeStorage(String(item.storage ?? ""));
        const ram = normalizeRam(String(item.ram ?? ""));
        const color = String(item.color ?? "").trim();
        const version = String(item.version ?? "").trim();
        const size = normalizeScreenSize(String(item.size ?? ""));
        const name = String(item.name ?? "").trim() || variantName(category, { storage, ram, color, version, size });
        return {
          id: String(item.id ?? crypto.randomUUID()),
          name,
          color,
          colorHex: /^#[0-9a-f]{6}$/i.test(String(item.colorHex ?? "")) ? String(item.colorHex) : "#111111",
          size,
          ram,
          storage,
          version,
          sku: String(item.sku ?? "").trim(),
          price: String(item.price ?? "").trim(),
          stock: Math.max(0, Number(item.stock) || 0),
          image: String(item.image ?? "").trim(),
        } satisfies ProductVariant;
      })
      .filter((item) => item.name || item.storage || item.color || item.ram || item.version);
  } catch {
    return [];
  }
}

function normalizeRam(raw: string) {
  const value = raw.trim().replace(/\s+/g, "").toUpperCase();
  if (!value) return "";
  if (/^\d+$/.test(value)) return `${value}GB`;
  return value.replace(/G$/, "GB");
}

function normalizeStorage(raw: string) {
  const value = raw.trim().replace(/\s+/g, "").toUpperCase();
  if (!value) return "";
  if (/^\d+$/.test(value)) return `${value}${Number(value) <= 8 ? "TB" : "GB"}`;
  return value.replace(/G$/, "GB").replace(/T$/, "TB");
}

function normalizeScreenSize(raw: string) {
  const value = raw.trim().replace(",", ".");
  if (!value) return "";
  if (/^\d+(?:\.\d+)?$/.test(value)) return `${value} inch`;
  return value;
}

function variantName(category: Product["category"], values: { storage: string; ram: string; color: string; version: string; size: string }) {
  const parts = category === "macbook" || category === "mac-mini-studio" || category === "imac" || category === "laptop"
    ? [values.version, values.ram && `RAM ${values.ram}`, values.storage && `SSD ${values.storage}`, values.size, values.color]
    : category === "ipad"
      ? [values.storage, values.version, values.size, values.color]
      : [values.storage, values.ram && `RAM ${values.ram}`, values.version, values.color];
  return parts.filter(Boolean).join(" · ");
}

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function splitValues(raw: string, separator: string, fallback: string[] = []) {
  const values = raw.split(separator).map((item) => item.trim()).filter(Boolean);
  return values.length ? values : fallback;
}

function slugify(raw: string) {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function safeExtension(filename: string, contentType: string) {
  const candidate = filename.split(".").pop()?.toLowerCase();
  if (candidate && /^(png|jpe?g|webp|gif|avif)$/.test(candidate)) return candidate;
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/gif") return "gif";
  if (contentType === "image/avif") return "avif";
  return "jpg";
}

function detectImageType(bytes: Uint8Array) {
  if (bytes.length < 12) return "";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  const header = String.fromCharCode(...bytes.slice(0, 12));
  if (header.startsWith("GIF87a") || header.startsWith("GIF89a")) return "image/gif";
  if (header.startsWith("RIFF") && header.slice(8, 12) === "WEBP") return "image/webp";
  if (header.slice(4, 8) === "ftyp" && /^(avif|avis|mif1|msf1)$/.test(header.slice(8, 12))) return "image/avif";
  return "";
}
