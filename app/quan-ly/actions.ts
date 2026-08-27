"use server";

import { env } from "cloudflare:workers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearAdminSession, requireAdminAction } from "../admin-auth";
import { deleteManagedProduct, getManagedProductById, saveManagedProduct, setProductActive } from "@/db/products";
import type { Product, ProductVariant } from "../products";

type Bindings = {
  PRODUCT_IMAGES: R2Bucket;
};

export async function saveProductAction(formData: FormData) {
  await requireAdminAction();
  let resultPath = "/admin/products?status=saved";

  try {
    const name = value(formData, "name");
    const brand = value(formData, "brand");
    const category = value(formData, "category") as Product["category"];
    if (!name || !brand || !["iphone", "samsung", "android", "ipad", "macbook", "mac-mini-studio", "imac", "laptop", "laptop-cu", "smartwatch", "audio", "phu-kien"].includes(category)) {
      throw new Error("Vui lòng nhập tên, hãng và nhóm sản phẩm.");
    }

    const id = value(formData, "id") || crypto.randomUUID();
    const previous = value(formData, "id") ? await getManagedProductById(id) : undefined;
    const slug = slugify(value(formData, "slug") || name);
    if (!slug) throw new Error("Tên đường dẫn sản phẩm chưa hợp lệ.");

    let image = value(formData, "existingImage");
    const imageFile = formData.get("imageFile");
    if (imageFile instanceof File && imageFile.size > 0) {
      if (!imageFile.type.startsWith("image/")) {
        throw new Error("Tệp tải lên phải là hình ảnh.");
      }
      if (imageFile.size > 6 * 1024 * 1024) {
        throw new Error("Ảnh phải nhỏ hơn 6 MB.");
      }
      const bucket = (env as unknown as Bindings).PRODUCT_IMAGES;
      if (!bucket) throw new Error("Kho ảnh sản phẩm chưa sẵn sàng.");
      const extension = safeExtension(imageFile.name, imageFile.type);
      const key = `${crypto.randomUUID()}.${extension}`;
      await bucket.put(key, await imageFile.arrayBuffer(), {
        httpMetadata: { contentType: imageFile.type },
      });
      image = `/api/product-images/${key}`;
    }

    if (!image || (!image.startsWith("/") && !image.startsWith("https://"))) {
      throw new Error("Hãy tải ảnh sản phẩm trực tiếp lên hệ thống.");
    }

    const colors = splitValues(value(formData, "colors"), ",", ["#111111"]);
    const variants = category === "macbook" || category === "mac-mini-studio" || category === "imac" || category === "laptop"
      ? buildMacVariants(formData, colors, image, previous?.variants)
      : previous?.variants;

    await saveManagedProduct({
      id,
      slug,
      name,
      brand,
      category,
      sku: previous?.sku,
      description: previous?.description,
      image,
      images: [image, ...(previous?.images ?? [])].filter((item, index, list) => list.indexOf(item) === index),
      badge: value(formData, "badge") || "Mới",
      tagline: value(formData, "tagline") || `Khám phá ${name} tại Infinity Company.`,
      price: value(formData, "price") || "Liên hệ giá tốt",
      costPrice: previous?.costPrice,
      sellingPrice: value(formData, "price") || previous?.sellingPrice || "Liên hệ giá tốt",
      salePrice: previous?.salePrice,
      stock: previous?.stock,
      status: formData.get("active") === "on" ? "active" : "inactive",
      tags: previous?.tags,
      seoTitle: previous?.seoTitle,
      seoDescription: previous?.seoDescription,
      variants,
      colors,
      specs: splitValues(value(formData, "specs"), "\n", ["Liên hệ để được xác nhận"]),
      featured: formData.get("featured") === "on",
      active: formData.get("active") === "on",
      source: value(formData, "source"),
    });

    refreshProductPages(slug);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể lưu sản phẩm.";
    resultPath = `/admin/products?error=${encodeURIComponent(message)}`;
  }

  redirect(resultPath);
}

export async function toggleProductAction(formData: FormData) {
  await requireAdminAction();
  const id = value(formData, "id");
  const slug = value(formData, "slug");
  const nextActive = value(formData, "nextActive") === "true";
  if (id) await setProductActive(id, nextActive);
  refreshProductPages(slug);
  redirect(`/admin/products?status=${nextActive ? "shown" : "hidden"}`);
}

export async function deleteProductAction(formData: FormData) {
  await requireAdminAction();
  const id = value(formData, "id");
  const slug = value(formData, "slug");
  if (id) await deleteManagedProduct(id);
  refreshProductPages(slug);
  redirect("/admin/products?status=deleted");
}

export async function logoutAdminAction() {
  await clearAdminSession();
  redirect("/admin-login?status=signed-out");
}

function refreshProductPages(slug: string) {
  revalidatePath("/");
  revalidatePath("/iphone");
  revalidatePath("/samsung");
  revalidatePath("/android");
  revalidatePath("/ipad");
  revalidatePath("/macbook");
  revalidatePath("/mac-mini-studio");
  revalidatePath("/imac");
  revalidatePath("/laptop");
  revalidatePath("/laptop-cu");
  revalidatePath("/smartwatch");
  revalidatePath("/audio");
  revalidatePath("/phu-kien");
  revalidatePath("/admin/products");
  if (slug) revalidatePath(`/san-pham/${slug}`);
}

function buildMacVariants(formData: FormData, colors: string[], image: string, previous?: ProductVariant[]) {
  const lines = value(formData, "macConfigurations").split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return previous;

  const ramOptions = splitValues(value(formData, "macRamOptions"), ",", []);
  const storageOptions = splitValues(value(formData, "macSsdOptions"), ",", []);
  const colorNames = splitValues(value(formData, "macColorNames"), ",", []);
  const configurations = lines.map((line) => {
    const [ram = "", storage = "", price = ""] = line.split("|").map((item) => item.trim());
    if (!ram || !storage || !price) throw new Error(`Cấu hình "${line}" chưa đúng dạng RAM | SSD | Giá.`);
    if (ramOptions.length && !ramOptions.some((item) => sameOption(item, ram))) throw new Error(`RAM ${ram} chưa có trong danh sách RAM.`);
    if (storageOptions.length && !storageOptions.some((item) => sameOption(item, storage))) throw new Error(`SSD ${storage} chưa có trong danh sách SSD.`);
    return { ram, storage, price };
  });

  return configurations.flatMap((configuration, configurationIndex) => colors.map((hex, colorIndex) => {
    const color = colorNames[colorIndex] || `Màu ${colorIndex + 1}`;
    const prior = previous?.find((variant) => sameOption(variant.ram, configuration.ram) && sameOption(variant.storage, configuration.storage) && sameOption(variant.color, color));
    return {
      id: prior?.id || `mac-${configurationIndex + 1}-${colorIndex + 1}-${crypto.randomUUID().slice(0, 8)}`,
      name: `${configuration.ram} / ${configuration.storage} / ${color}`,
      ram: configuration.ram,
      storage: configuration.storage,
      color,
      colorHex: hex,
      price: configuration.price,
      stock: prior?.stock ?? 0,
      image: prior?.image || image,
    } satisfies ProductVariant;
  }));
}

function sameOption(left?: string, right?: string) {
  return (left ?? "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase() === (right ?? "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function splitValues(raw: string, separator: string, fallback: string[]) {
  const values = raw
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
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
