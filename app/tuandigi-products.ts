import importedSeeds from "./tuandigi-imported-products.json";
import type { Product, ProductVariant } from "./products";

type ImportedSeed = (typeof importedSeeds)[number];

const categoryLabels: Record<string, string> = {
  ipad: "iPad",
  "phu-kien": "Phụ kiện",
};

function colorFor(seed: ImportedSeed) {
  const haystack = `${seed.name} ${seed.image}`.toLowerCase();
  if (haystack.includes("cam") || haystack.includes("vang") || haystack.includes("orange")) return { name: "Cam / Vàng", hex: "#c7794e" };
  if (haystack.includes("xanh") || haystack.includes("blue")) return { name: "Xanh", hex: "#41617b" };
  if (haystack.includes("tim") || haystack.includes("purple")) return { name: "Tím", hex: "#9a8cae" };
  if (haystack.includes("den") || haystack.includes("black")) return { name: "Đen", hex: "#1b1d20" };
  return { name: "Màu theo ảnh", hex: "#d8d8d8" };
}

function buildVariant(seed: ImportedSeed): ProductVariant {
  const color = colorFor(seed);
  return {
    id: `${seed.slug}-default`,
    name: `${seed.name} / ${color.name}`,
    color: color.name,
    colorHex: color.hex,
    storage: seed.name.match(/(?:\d+GB|\d+TB)/i)?.[0]?.toUpperCase(),
    price: seed.price,
    stock: 1,
    image: seed.image,
  };
}

export const tuandigiProducts: Product[] = importedSeeds.map((seed) => {
  const variant = buildVariant(seed);
  const color = colorFor(seed);
  const label = categoryLabels[seed.category] ?? seed.category;
  const isUsed = seed.category.endsWith("-cu");
  const badge = isUsed ? "Máy cũ 99%" : seed.category === "phu-kien" ? "Phụ kiện" : "Chính hãng";
  return {
    slug: seed.slug,
    name: seed.name,
    brand: seed.brand,
    category: seed.category as Product["category"],
    image: seed.image,
    images: [seed.image],
    badge,
    tagline: `${label} tham khảo từ Tuấn Digi. Kiểm tra tình trạng và tồn kho trước khi chốt đơn.`,
    description: `Sản phẩm ${seed.name}. Giá và thông tin được nhập từ trang sản phẩm tham khảo; nhân viên Huy Apple sẽ xác nhận tình trạng thực tế trước khi giao.`,
    price: seed.price,
    sellingPrice: seed.price,
    salePrice: seed.price,
    stock: 1,
    status: "active",
    active: true,
    variants: [variant],
    colors: [color.hex],
    colorOptions: [color],
    storageOptions: variant.storage ? [variant.storage] : [],
    specs: seed.specs.length ? seed.specs : ["Liên hệ để được xác nhận cấu hình và tình trạng"],
    source: seed.source,
    mediaLinks: [{ label: "Xem nguồn tham khảo", url: seed.source }],
  };
});
