import type { Product, ProductColor, ProductVariant } from "./products";

type ColorAsset = ProductColor & { image: string };
type StoragePrice = { storage: string; price: string };

function phoneVariants(
  slug: string,
  storages: StoragePrice[],
  colors: ColorAsset[],
): ProductVariant[] {
  return storages.flatMap((storage) => colors.map((color) => ({
    id: `${slug}-${storage.storage}-${color.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: `${storage.storage} / ${color.name}`,
    storage: storage.storage,
    color: color.name,
    colorHex: color.hex,
    price: storage.price,
    stock: 1,
    image: color.image,
  })));
}

const iphone17Colors: ColorAsset[] = [
  { name: "Đen", hex: "#202124", image: "/products/details/iphone-17-256gb/color-den-2d1e6cf7.jpg" },
  { name: "Trắng", hex: "#f2f1ed", image: "/products/details/iphone-17-256gb/color-trang-d4b4c480.jpg" },
  { name: "Xanh Lam Khói", hex: "#b6cad7", image: "/products/details/iphone-17-256gb/color-xanhlamkhoi-adf39639.jpg" },
  { name: "Xanh Lá Xô Thơm", hex: "#bdc7b4", image: "/products/details/iphone-17-256gb/color-xanhlaxothom-4f1f2f1a.jpg" },
];

const iphone17ProColors: ColorAsset[] = [
  { name: "Cam Vũ Trụ", hex: "#c87549", image: "/products/details/iphone-17-pro/color-camvutru-6b5ad717.jpg" },
  { name: "Xanh Đậm", hex: "#303e4d", image: "/products/details/iphone-17-pro/color-xanhdam-4228413e.jpg" },
  { name: "Bạc", hex: "#d8d8d5", image: "/products/details/iphone-17-pro/color-bac-b0f6d5e0.jpg" },
];

const iphone17ProMaxColors: ColorAsset[] = [
  { name: "Cam Vũ Trụ", hex: "#c87549", image: "/products/details/iphone-17-pro-max/color-camvutru-67cadb6a.jpg" },
  { name: "Xanh Đậm", hex: "#303e4d", image: "/products/details/iphone-17-pro-max/color-xanhdam-15900afc.jpg" },
  { name: "Bạc", hex: "#d8d8d5", image: "/products/iphone-17-pro-max.jpg" },
];

const iphoneAirColors: ColorAsset[] = [
  { name: "Đen Không Gian", hex: "#242528", image: "/products/details/iphone-air-256gb/color-denkhonggian-9f450e8d.jpg" },
  { name: "Trắng Mây", hex: "#f0f0ed", image: "/products/details/iphone-air-256gb/color-trangmay-c714571b.jpg" },
  { name: "Vàng Nhạt", hex: "#e5dbc4", image: "/products/details/iphone-air-256gb/color-vangnhat-c7b5c4d4.jpg" },
];

const iphone17eColors: ColorAsset[] = [
  { name: "Đen", hex: "#25262a", image: "/products/details/iphone-17e/color-den-902fa51e.jpg" },
  { name: "Trắng", hex: "#f3f1ed", image: "/products/apple/iphone-17e-official/colors.jpg" },
  { name: "Hồng Phớt", hex: "#ead4d4", image: "/products/apple/iphone-17e-official/pink.jpg" },
];

const iphone17Storage = [
  { storage: "256GB", price: "23.890.000đ" },
  { storage: "512GB", price: "29.790.000đ" },
];

const iphone17ProStorage = [
  { storage: "256GB", price: "31.990.000đ" },
  { storage: "512GB", price: "38.490.000đ" },
  { storage: "1TB", price: "44.990.000đ" },
];

const iphone17ProMaxStorage = [
  { storage: "256GB", price: "34.590.000đ" },
  { storage: "512GB", price: "41.490.000đ" },
  { storage: "1TB", price: "47.990.000đ" },
  { storage: "2TB", price: "60.490.000đ" },
];

const iphoneAirStorage = [
  { storage: "256GB", price: "22.990.000đ" },
  { storage: "512GB", price: "29.490.000đ" },
  { storage: "1TB", price: "35.990.000đ" },
];

const iphone17eStorage = [
  { storage: "256GB", price: "17.490.000đ" },
  { storage: "512GB", price: "23.990.000đ" },
];

export const currentCatalogOverrides: Record<string, Partial<Product>> = {
  "iphone-17-pro": {
    name: "iPhone 17 Pro",
    image: iphone17ProColors[0].image,
    images: [...iphone17ProColors.map((color) => color.image), "/products/details/iphone-17-pro/detail-1-6fcb9726.png", "/products/details/iphone-17-pro/detail-2-580ac396.webp", "/products/details/iphone-17-pro/detail-3-a7fe2a22.webp", "/products/details/iphone-17-pro/detail-4-87a73a15.webp"],
    badge: "A19 Pro",
    tagline: "Thiết kế nhôm nguyên khối, camera Pro Fusion 48MP và hiệu năng A19 Pro.",
    description: "iPhone 17 Pro kết hợp màn hình Super Retina XDR 6,3 inch, ProMotion, hệ thống camera chuyên nghiệp và chip A19 Pro.",
    price: iphone17ProStorage[0].price,
    sellingPrice: iphone17ProStorage[0].price,
    variants: phoneVariants("iphone-17-pro", iphone17ProStorage, iphone17ProColors),
    colors: iphone17ProColors.map((color) => color.hex),
    colorOptions: iphone17ProColors,
    storageOptions: iphone17ProStorage.map((item) => item.storage),
    specs: ["Màn hình Super Retina XDR 6,3 inch", "ProMotion lên đến 120Hz", "Chip Apple A19 Pro", "Camera Pro Fusion 48MP", "Camera trước Center Stage", "Khung nhôm nguyên khối", "Nút Điều Khiển Camera và Nút Tác Vụ", "Hỗ trợ 5G và MagSafe"],
    mediaLinks: [{ label: "Xem iPhone 17 Pro trên Apple", url: "https://www.apple.com/vn/iphone-17-pro/" }],
    source: "https://www.apple.com/vn/iphone-17-pro/specs/",
  },
  "iphone-17-pro-max": {
    name: "iPhone 17 Pro Max",
    image: iphone17ProMaxColors[0].image,
    images: [...iphone17ProMaxColors.map((color) => color.image), "/products/details/iphone-17-pro-max/detail-1-68b70cb4.webp", "/products/details/iphone-17-pro-max/detail-2-4745f229.webp", "/products/details/iphone-17-pro-max/detail-3-c552d2e3.webp", "/products/details/iphone-17-pro-max/detail-4-4603a242.webp"],
    badge: "Pro Max",
    tagline: "Màn hình 6,9 inch, camera Pro Fusion 48MP và thời lượng pin dài nhất dòng iPhone 17.",
    description: "iPhone 17 Pro Max dành cho người cần màn hình lớn, camera linh hoạt và dung lượng lưu trữ lên đến 2TB.",
    price: iphone17ProMaxStorage[0].price,
    sellingPrice: iphone17ProMaxStorage[0].price,
    variants: phoneVariants("iphone-17-pro-max", iphone17ProMaxStorage, iphone17ProMaxColors),
    colors: iphone17ProMaxColors.map((color) => color.hex),
    colorOptions: iphone17ProMaxColors,
    storageOptions: iphone17ProMaxStorage.map((item) => item.storage),
    specs: ["Màn hình Super Retina XDR 6,9 inch", "ProMotion lên đến 120Hz", "Chip Apple A19 Pro", "Camera Pro Fusion 48MP", "Zoom quang học đa tiêu cự", "Camera trước Center Stage", "Dung lượng đến 2TB", "Hỗ trợ 5G và MagSafe"],
    mediaLinks: [{ label: "Xem iPhone 17 Pro Max trên Apple", url: "https://www.apple.com/vn/iphone-17-pro/" }],
    source: "https://www.apple.com/vn/iphone-17-pro/specs/",
  },
  "iphone-17": {
    name: "iPhone 17",
    image: iphone17Colors[2].image,
    images: [...iphone17Colors.map((color) => color.image), "/products/details/iphone-17-256gb/detail-1-fcd1b33c.webp", "/products/details/iphone-17-256gb/detail-2-2be21966.webp", "/products/details/iphone-17-256gb/detail-3-8369ff10.webp", "/products/details/iphone-17-256gb/detail-4-1885e4a7.webp"],
    badge: "Mới",
    tagline: "Màn hình 6,3 inch ProMotion, chip A19 và năm màu hoàn thiện.",
    description: "iPhone 17 có màn hình Super Retina XDR 6,3 inch với ProMotion, chip A19 và hệ thống camera Dual Fusion 48MP.",
    price: iphone17Storage[0].price,
    sellingPrice: iphone17Storage[0].price,
    variants: phoneVariants("iphone-17", iphone17Storage, iphone17Colors),
    colors: iphone17Colors.map((color) => color.hex),
    colorOptions: iphone17Colors,
    storageOptions: iphone17Storage.map((item) => item.storage),
    specs: ["Màn hình Super Retina XDR 6,3 inch", "ProMotion lên đến 120Hz", "Chip Apple A19", "Camera Dual Fusion 48MP", "Camera trước Center Stage", "Ceramic Shield 2", "Nút Điều Khiển Camera", "Hỗ trợ 5G và MagSafe"],
    mediaLinks: [{ label: "Xem iPhone 17 trên Apple", url: "https://www.apple.com/vn/iphone-17/" }],
    source: "https://www.apple.com/vn/iphone-17/specs/",
  },
  "iphone-air": {
    name: "iPhone Air",
    image: iphoneAirColors[0].image,
    images: [...iphoneAirColors.map((color) => color.image), "/products/details/iphone-air-256gb/detail-1-0aba6995.jpg", "/products/details/iphone-air-256gb/detail-2-093b563a.webp", "/products/details/iphone-air-256gb/detail-3-f35bdc3b.webp", "/products/details/iphone-air-256gb/detail-4-f29fc3b4.webp"],
    badge: "Mỏng nhẹ",
    tagline: "Thiết kế titan siêu mỏng, màn hình 6,5 inch và chip A19 Pro.",
    description: "iPhone Air ưu tiên thiết kế mỏng nhẹ nhưng vẫn có màn hình ProMotion, chip A19 Pro và camera Fusion 48MP.",
    price: iphoneAirStorage[0].price,
    sellingPrice: iphoneAirStorage[0].price,
    variants: phoneVariants("iphone-air", iphoneAirStorage, iphoneAirColors),
    colors: iphoneAirColors.map((color) => color.hex),
    colorOptions: iphoneAirColors,
    storageOptions: iphoneAirStorage.map((item) => item.storage),
    specs: ["Màn hình Super Retina XDR 6,5 inch", "ProMotion lên đến 120Hz", "Chip Apple A19 Pro", "Camera Fusion 48MP", "Khung titan siêu mỏng", "Camera trước Center Stage", "Nút Điều Khiển Camera", "Hỗ trợ 5G và MagSafe"],
    mediaLinks: [{ label: "Xem iPhone Air trên Apple", url: "https://www.apple.com/vn/iphone-air/" }],
    source: "https://www.apple.com/vn/iphone-air/specs/",
  },
  "iphone-17e": {
    name: "iPhone 17e",
    image: iphone17eColors[2].image,
    images: [
      ...iphone17eColors.map((color) => color.image),
      "/products/details/iphone-17e/detail-1-99fa1e0d.webp",
      "/products/details/iphone-17e/detail-2-1afb6514.webp",
    ],
    badge: "A19",
    tagline: "iPhone dễ tiếp cận với chip A19, camera Fusion 48MP và ba màu.",
    description: "iPhone 17e có màn hình Super Retina XDR 6,1 inch, chip A19, camera Fusion 48MP và bộ nhớ khởi điểm 256GB.",
    price: iphone17eStorage[0].price,
    sellingPrice: iphone17eStorage[0].price,
    variants: phoneVariants("iphone-17e", iphone17eStorage, iphone17eColors),
    colors: iphone17eColors.map((color) => color.hex),
    colorOptions: iphone17eColors,
    storageOptions: iphone17eStorage.map((item) => item.storage),
    specs: ["Màn hình Super Retina XDR 6,1 inch", "Chip Apple A19", "Camera Fusion 48MP", "Camera trước 12MP", "Bộ nhớ từ 256GB", "Nút Tác Vụ", "Hỗ trợ 5G", "Hệ điều hành iOS"],
    mediaLinks: [{ label: "Xem iPhone 17e trên Apple", url: "https://www.apple.com/vn/iphone-17e/" }],
    source: "https://www.apple.com/vn/iphone-17e/specs/",
  },
};

export const catalogProductOrder: Partial<Record<Product["category"], string[]>> = {
  iphone: ["iphone-17-pro-max", "iphone-17-pro", "iphone-17", "iphone-air", "iphone-17e"],
  macbook: ["macbook-pro-16-m5-pro", "macbook-pro-14-m5", "macbook-air-15-m5", "macbook-air-13-m5", "macbook-neo-a18-pro"],
  "mac-mini-studio": ["mac-mini-m4", "mac-mini-m4-pro", "mac-studio-m4-max", "mac-studio-m3-ultra"],
  imac: ["imac-24-m4-10cpu-10gpu", "imac-24-m4-8cpu-8gpu", "imac-24-m3-8cpu-10gpu", "imac-24-m3-8cpu-8gpu"],
};

export function applyCurrentCatalogOverride<T extends Product>(product: T): T {
  const override = currentCatalogOverrides[product.slug];
  return override ? { ...product, ...override } : product;
}

export function orderCatalogProducts<T extends Product>(products: T[], category: Product["category"]): T[] {
  const order = catalogProductOrder[category] ?? [];
  if (!order.length) return products;
  const rank = new Map(order.map((slug, index) => [slug, index]));
  return [...products].sort((left, right) => {
    const leftRank = rank.get(left.slug);
    const rightRank = rank.get(right.slug);
    if (leftRank !== undefined || rightRank !== undefined) {
      return (leftRank ?? Number.MAX_SAFE_INTEGER) - (rightRank ?? Number.MAX_SAFE_INTEGER);
    }
    return left.name.localeCompare(right.name, "vi");
  });
}
