import type { Product, ProductColor, ProductVariant } from "./products";

type ColorAsset = ProductColor & { image: string };
type Configuration = { ram?: string; storage: string; price: string };
type Seed = {
  slug: string;
  name: string;
  brand: string;
  category: Product["category"];
  image: string;
  price: string;
  tagline: string;
  configurations: Configuration[];
  colors: ColorAsset[];
  specs: string[];
  source: string;
  badge?: string;
  gallery?: string[];
};

function buildProduct(seed: Seed): Product {
  const variants: ProductVariant[] = seed.configurations.flatMap((configuration) =>
    seed.colors.map((color) => ({
      id: `${seed.slug}-${configuration.ram ?? ""}-${configuration.storage}-${color.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: [configuration.ram, configuration.storage, color.name].filter(Boolean).join(" / "),
      ram: configuration.ram,
      storage: configuration.storage,
      color: color.name,
      colorHex: color.hex,
      price: configuration.price,
      stock: 10,
      image: color.image,
    })),
  );
  return {
    slug: seed.slug,
    name: seed.name,
    brand: seed.brand,
    category: seed.category,
    image: seed.image,
    images: Array.from(new Set([seed.image, ...seed.colors.map((color) => color.image), ...(seed.gallery ?? [])])),
    badge: seed.badge ?? seed.brand,
    tagline: seed.tagline,
    description: `${seed.name} có nhiều lựa chọn cấu hình và màu sắc. Khách có thể xem giá theo từng phiên bản trước khi thêm vào giỏ hàng.`,
    price: seed.price,
    sellingPrice: seed.configurations[0]?.price ?? seed.price,
    stock: variants.reduce((total, variant) => total + (variant.stock ?? 0), 0),
    status: "active",
    variants,
    colors: seed.colors.map((color) => color.hex),
    colorOptions: seed.colors,
    storageOptions: Array.from(new Set(seed.configurations.map((item) => item.storage))),
    specs: seed.specs,
    active: true,
    source: seed.source,
  };
}

const exactImageColor = (image: string, name = "Màu theo ảnh", hex = "#8a8f98"): ColorAsset[] => [{ name, hex, image }];
const iphoneSpecs = ["Màn hình Super Retina XDR", "Chip Apple Bionic", "Camera chính độ phân giải cao", "Quay video 4K", "Face ID", "Hỗ trợ MagSafe", "Kháng nước", "Hệ điều hành iOS"];

export const newIphones = [
  ["iphone-16-pro", "iPhone 16 Pro", "/products/iphone-16-pro-max.png", "25.990.000đ", "Thiết kế titan nhỏ gọn, chip A18 Pro và camera Pro.", [["128GB", "25.990.000đ"], ["256GB", "28.990.000đ"], ["512GB", "34.990.000đ"]]],
  ["iphone-15-pro-max", "iPhone 15 Pro Max", "/products/iphone-16-pro-max.png", "26.990.000đ", "Khung titan, chip A17 Pro và camera tele 5x.", [["256GB", "26.990.000đ"], ["512GB", "32.990.000đ"], ["1TB", "38.990.000đ"]]],
  ["iphone-14-plus", "iPhone 14 Plus", "/products/iphone-14.jpg", "16.490.000đ", "Màn hình lớn 6,7 inch và thời lượng pin bền bỉ.", [["128GB", "16.490.000đ"], ["256GB", "19.490.000đ"], ["512GB", "24.490.000đ"]]],
  ["iphone-14-pro-max", "iPhone 14 Pro Max", "/products/iphone-16-pro-max.png", "22.990.000đ", "Dynamic Island, ProMotion và camera chính 48MP.", [["128GB", "22.990.000đ"], ["256GB", "25.990.000đ"], ["512GB", "30.990.000đ"]]],
  ["iphone-se-3", "iPhone SE thế hệ 3", "/products/iphone-13.jpg", "9.990.000đ", "Thiết kế nhỏ gọn, Touch ID và hiệu năng A15 Bionic.", [["64GB", "9.990.000đ"], ["128GB", "11.490.000đ"], ["256GB", "13.990.000đ"]]],
].map(([slug, name, image, price, tagline, options]) => buildProduct({
  slug: String(slug), name: String(name), brand: "Apple", category: "iphone", image: String(image), price: `Từ ${price}`, tagline: String(tagline),
  configurations: (options as string[][]).map(([storage, optionPrice]) => ({ storage, price: optionPrice })), colors: exactImageColor(String(image)), specs: iphoneSpecs, source: "https://www.apple.com/vn/iphone/compare/",
}));

const classicIphones: Product[] = [
  buildProduct({
    slug: "iphone-12", name: "iPhone 12", brand: "Apple", category: "iphone", image: "/products/iphone-13.jpg", price: "Từ 10.990.000đ",
    tagline: "Thiết kế cạnh phẳng, màn hình OLED và kết nối 5G.", configurations: [{ storage: "64GB", price: "10.990.000đ" }, { storage: "128GB", price: "12.490.000đ" }, { storage: "256GB", price: "14.990.000đ" }],
    colors: exactImageColor("/products/iphone-13.jpg", "Trắng", "#f2f1ed"), specs: [...iphoneSpecs, "Chip A14 Bionic", "Màn hình 6,1 inch"], source: "https://support.apple.com/vi-vn/111876",
    gallery: ["/products/details/iphone-13/detail-1-7dd32e9e.jpg", "/products/details/iphone-13/detail-2-ea0a1cdc.webp", "/products/details/iphone-13/detail-4-8591fcdb.webp"],
  }),
  buildProduct({
    slug: "iphone-12-mini", name: "iPhone 12 mini", brand: "Apple", category: "iphone", image: "/products/iphone-13.jpg", price: "Từ 9.490.000đ",
    tagline: "iPhone nhỏ gọn 5,4 inch với màn hình Super Retina XDR.", configurations: [{ storage: "64GB", price: "9.490.000đ" }, { storage: "128GB", price: "10.990.000đ" }, { storage: "256GB", price: "12.990.000đ" }],
    colors: exactImageColor("/products/iphone-13.jpg", "Trắng", "#f2f1ed"), specs: [...iphoneSpecs, "Chip A14 Bionic", "Màn hình 5,4 inch"], source: "https://support.apple.com/vi-vn/111877",
    gallery: ["/products/details/iphone-13/detail-3-f8e9ad9a.png", "/products/details/iphone-13/detail-5-fb01372f.webp", "/products/details/iphone-13/detail-6-59360690.webp"],
  }),
  buildProduct({
    slug: "iphone-12-pro", name: "iPhone 12 Pro", brand: "Apple", category: "iphone", image: "/products/iphone-16-pro-max.png", price: "Từ 14.490.000đ",
    tagline: "Khung thép không gỉ, camera tele và cảm biến LiDAR.", configurations: [{ storage: "128GB", price: "14.490.000đ" }, { storage: "256GB", price: "16.490.000đ" }, { storage: "512GB", price: "19.490.000đ" }],
    colors: exactImageColor("/products/iphone-16-pro-max.png", "Titan Tự Nhiên", "#aaa396"), specs: [...iphoneSpecs, "Chip A14 Bionic", "Camera ba ống kính"], source: "https://support.apple.com/vi-vn/111875",
    gallery: ["/products/details/iphone-16-pro-max/detail-1-0a3ffeae.png", "/products/details/iphone-16-pro-max/detail-3-a91eca29.webp", "/products/details/iphone-16-pro-max/detail-5-7599d9d5.webp"],
  }),
  buildProduct({
    slug: "iphone-12-pro-max", name: "iPhone 12 Pro Max", brand: "Apple", category: "iphone", image: "/products/iphone-16-pro-max.png", price: "Từ 16.990.000đ",
    tagline: "Màn hình 6,7 inch, camera Pro và cảm biến LiDAR.", configurations: [{ storage: "128GB", price: "16.990.000đ" }, { storage: "256GB", price: "18.990.000đ" }, { storage: "512GB", price: "21.990.000đ" }],
    colors: exactImageColor("/products/iphone-16-pro-max.png", "Titan Tự Nhiên", "#aaa396"), specs: [...iphoneSpecs, "Chip A14 Bionic", "Màn hình 6,7 inch"], source: "https://support.apple.com/vi-vn/111874",
    gallery: ["/products/details/iphone-16-pro-max/detail-2-99d15514.png", "/products/details/iphone-16-pro-max/detail-4-1f08d82a.webp", "/products/details/iphone-16-pro-max/detail-6-3409fa47.webp"],
  }),
  buildProduct({
    slug: "iphone-13-mini", name: "iPhone 13 mini", brand: "Apple", category: "iphone", image: "/products/details/iphone-13/color-trang-00ac4beb.jpg", price: "Từ 11.490.000đ",
    tagline: "Thiết kế nhỏ gọn, chip A15 Bionic và camera kép.", configurations: [{ storage: "128GB", price: "11.490.000đ" }, { storage: "256GB", price: "13.490.000đ" }, { storage: "512GB", price: "16.490.000đ" }],
    colors: exactImageColor("/products/details/iphone-13/color-trang-00ac4beb.jpg", "Trắng Ánh Sao", "#f0eee5"), specs: [...iphoneSpecs, "Chip A15 Bionic", "Màn hình 5,4 inch"], source: "https://support.apple.com/vi-vn/111873",
    gallery: ["/products/details/iphone-13/detail-1-7dd32e9e.jpg", "/products/details/iphone-13/detail-7-c606a1f1.png", "/products/details/iphone-13/detail-8-d1c57e80.png"],
  }),
  buildProduct({
    slug: "iphone-13-pro", name: "iPhone 13 Pro", brand: "Apple", category: "iphone", image: "/products/iphone-16-pro-max.png", price: "Từ 16.490.000đ",
    tagline: "Màn hình ProMotion 120Hz và hệ thống camera Pro.", configurations: [{ storage: "128GB", price: "16.490.000đ" }, { storage: "256GB", price: "18.490.000đ" }, { storage: "512GB", price: "21.490.000đ" }, { storage: "1TB", price: "24.490.000đ" }],
    colors: exactImageColor("/products/iphone-16-pro-max.png", "Xám Graphite", "#4b4a46"), specs: [...iphoneSpecs, "Chip A15 Bionic", "ProMotion 120Hz"], source: "https://support.apple.com/vi-vn/111871",
    gallery: ["/products/details/iphone-16-pro-max/detail-1-0a3ffeae.png", "/products/details/iphone-16-pro-max/detail-4-1f08d82a.webp", "/products/details/iphone-16-pro-max/detail-8-530896fd.png"],
  }),
  buildProduct({
    slug: "iphone-13-pro-max", name: "iPhone 13 Pro Max", brand: "Apple", category: "iphone", image: "/products/iphone-16-pro-max.png", price: "Từ 18.990.000đ",
    tagline: "Màn hình ProMotion 6,7 inch và pin bền bỉ.", configurations: [{ storage: "128GB", price: "18.990.000đ" }, { storage: "256GB", price: "20.990.000đ" }, { storage: "512GB", price: "23.990.000đ" }, { storage: "1TB", price: "26.990.000đ" }],
    colors: exactImageColor("/products/iphone-16-pro-max.png", "Xám Graphite", "#4b4a46"), specs: [...iphoneSpecs, "Chip A15 Bionic", "Màn hình 6,7 inch ProMotion"], source: "https://support.apple.com/vi-vn/111870",
    gallery: ["/products/details/iphone-16-pro-max/detail-2-99d15514.png", "/products/details/iphone-16-pro-max/detail-5-7599d9d5.webp", "/products/details/iphone-16-pro-max/detail-7-44c16e81.png"],
  }),
  buildProduct({
    slug: "iphone-15-pro", name: "iPhone 15 Pro", brand: "Apple", category: "iphone", image: "/products/iphone-16-pro-max.png", price: "Từ 23.990.000đ",
    tagline: "Khung titan, chip A17 Pro và Nút Tác Vụ.", configurations: [{ storage: "128GB", price: "23.990.000đ" }, { storage: "256GB", price: "26.990.000đ" }, { storage: "512GB", price: "31.990.000đ" }, { storage: "1TB", price: "36.990.000đ" }],
    colors: exactImageColor("/products/iphone-16-pro-max.png", "Titan Tự Nhiên", "#9a9184"), specs: [...iphoneSpecs, "Chip A17 Pro", "Khung titan", "USB-C"], source: "https://support.apple.com/vi-vn/111829",
    gallery: ["/products/details/iphone-16-pro-max/detail-1-0a3ffeae.png", "/products/details/iphone-16-pro-max/detail-3-a91eca29.webp", "/products/details/iphone-16-pro-max/detail-6-3409fa47.webp"],
  }),
];

const macColors: ColorAsset[] = [
  { name: "Bạc", hex: "#d7d8d8", image: "/products/apple/macbook-air/silver.jpg" },
  { name: "Đêm Xanh Thẳm", hex: "#2d3640", image: "/products/apple/macbook-air/midnight.jpg" },
];
const macProColors: ColorAsset[] = [
  { name: "Đen Không Gian", hex: "#272729", image: "/products/apple/macbook-pro/space-black.jpg" },
  { name: "Bạc", hex: "#d6d7d8", image: "/products/apple/macbook-pro/silver.jpg" },
];
const macSpecs = ["Chip Apple Silicon", "CPU và GPU tích hợp", "RAM hợp nhất", "SSD tốc độ cao", "Màn hình Retina", "Camera FaceTime HD", "Touch ID", "Pin dùng cả ngày", "Hệ điều hành macOS"];
export const newMacbooks = [
  ["macbook-air-13-m1", "MacBook Air 13 inch M1", "/products/macbook-air-2020-m1.png", "15.490.000đ", "MacBook mỏng nhẹ, yên tĩnh cho công việc hằng ngày.", [["8GB", "256GB", "15.490.000đ"], ["8GB", "512GB", "18.990.000đ"]], macColors],
  ["macbook-air-13-m2", "MacBook Air 13 inch M2", "/products/macbook-air-m2-2022-16gb.png", "20.990.000đ", "Thiết kế phẳng, MagSafe và camera Full HD.", [["16GB", "256GB", "20.990.000đ"], ["16GB", "512GB", "24.990.000đ"]], macColors],
  ["macbook-air-13-m4", "MacBook Air 13 inch M4", "/products/apple-macbook-air-13-m4-10cpu-10gpu-16gb-512gb-2025.png", "25.990.000đ", "Hiệu năng M4 trong thân máy Air mỏng nhẹ.", [["16GB", "256GB", "25.990.000đ"], ["16GB", "512GB", "30.490.000đ"], ["24GB", "512GB", "35.490.000đ"]], macColors],
  ["macbook-pro-14-m4-pro", "MacBook Pro 14 inch M4 Pro", "/products/macbook-pro-14-m5-pro-15cpu-16-gpu-24gb-1tb.png", "49.990.000đ", "M4 Pro và màn hình XDR cho công việc chuyên nghiệp.", [["24GB", "512GB", "49.990.000đ"], ["24GB", "1TB", "55.990.000đ"], ["48GB", "1TB", "69.990.000đ"]], macProColors],
  ["macbook-pro-16-m4-max", "MacBook Pro 16 inch M4 Max", "/products/macbook-pro-16-inch-m3-max-2023-48gb-1tb.png", "89.990.000đ", "Hiệu năng cao cho dựng phim, đồ họa 3D và AI.", [["48GB", "1TB", "89.990.000đ"], ["64GB", "2TB", "119.990.000đ"], ["128GB", "4TB", "169.990.000đ"]], macProColors],
].map(([slug, name, image, price, tagline, options, colors]) => buildProduct({
  slug: String(slug), name: String(name), brand: "Apple", category: "macbook", image: String(image), price: `Từ ${price}`, tagline: String(tagline),
  configurations: (options as string[][]).map(([ram, storage, optionPrice]) => ({ ram, storage, price: optionPrice })), colors: colors as ColorAsset[], specs: macSpecs, source: "https://www.apple.com/vn/mac/compare/",
}));

const airGallery = ["/products/apple/macbook-air/apple-hero.png", "/products/apple/macbook-air/apple-display.jpg"];
const proGallery = ["/products/apple/macbook-pro/apple-display.jpg", "/products/apple/macbook-pro/apple-performance.jpg"];
type MacSeed = [string, string, string, string, string, string[][], ColorAsset[], string[]];
const additionalMacSeeds: MacSeed[] = [
  ["macbook-air-15-m2", "MacBook Air 15 inch M2", "/products/macbook-air-m2-2022-16gb.png", "25.990.000đ", "Màn hình 15,3 inch rộng rãi trong thiết kế Air mỏng nhẹ.", [["16GB", "256GB", "25.990.000đ"], ["16GB", "512GB", "29.990.000đ"], ["24GB", "1TB", "39.990.000đ"]], macColors, airGallery],
  ["macbook-air-13-m3", "MacBook Air 13 inch M3", "/products/macbook-air-15-m3-16-256gb-2024-sac-35w.png", "23.990.000đ", "Chip M3, Wi-Fi 6E và hỗ trợ hai màn hình ngoài.", [["16GB", "256GB", "23.990.000đ"], ["16GB", "512GB", "28.490.000đ"], ["24GB", "1TB", "37.990.000đ"]], macColors, airGallery],
  ["macbook-air-15-m3", "MacBook Air 15 inch M3", "/products/macbook-air-15-m3-16-256gb-2024-sac-35w.png", "28.990.000đ", "Không gian hiển thị lớn, chip M3 và pin cả ngày.", [["16GB", "256GB", "28.990.000đ"], ["16GB", "512GB", "33.490.000đ"], ["24GB", "1TB", "42.990.000đ"]], macColors, airGallery],
  ["macbook-air-15-m4", "MacBook Air 15 inch M4", "/products/apple-macbook-air-13-m4-10cpu-10gpu-16gb-512gb-2025.png", "31.990.000đ", "Màn hình 15,3 inch kết hợp hiệu năng M4 và camera Center Stage.", [["16GB", "256GB", "31.990.000đ"], ["16GB", "512GB", "36.490.000đ"], ["24GB", "1TB", "45.990.000đ"], ["32GB", "2TB", "59.990.000đ"]], macColors, airGallery],
  ["macbook-pro-13-m1", "MacBook Pro 13 inch M1", "/products/macbook-pro-14-inch-m3-max-96gb-512gb-sac-96w.png", "18.990.000đ", "Chip M1, quạt tản nhiệt chủ động và Touch Bar.", [["8GB", "256GB", "18.990.000đ"], ["8GB", "512GB", "21.990.000đ"], ["16GB", "1TB", "28.990.000đ"]], macProColors, proGallery],
  ["macbook-pro-13-m2", "MacBook Pro 13 inch M2", "/products/macbook-pro-14-inch-m3-max-96gb-512gb-sac-96w.png", "23.990.000đ", "Chip M2 và tản nhiệt chủ động cho hiệu năng duy trì.", [["8GB", "256GB", "23.990.000đ"], ["8GB", "512GB", "27.990.000đ"], ["16GB", "1TB", "34.990.000đ"]], macProColors, proGallery],
  ["macbook-pro-14-m1-pro", "MacBook Pro 14 inch M1 Pro", "/products/macbook-pro-14-inch-m3-max-96gb-512gb-sac-96w.png", "28.990.000đ", "Màn hình Liquid Retina XDR và chip M1 Pro mạnh mẽ.", [["16GB", "512GB", "28.990.000đ"], ["16GB", "1TB", "33.990.000đ"], ["32GB", "1TB", "41.990.000đ"]], macProColors, proGallery],
  ["macbook-pro-16-m1-pro", "MacBook Pro 16 inch M1 Pro", "/products/macbook-pro-16-inch-m3-max-2023-48gb-1tb.png", "34.990.000đ", "Màn hình XDR 16,2 inch và hệ thống âm thanh sáu loa.", [["16GB", "512GB", "34.990.000đ"], ["16GB", "1TB", "39.990.000đ"], ["32GB", "1TB", "47.990.000đ"]], macProColors, proGallery],
  ["macbook-pro-14-m2-pro", "MacBook Pro 14 inch M2 Pro", "/products/macbook-pro-14-inch-m3-max-96gb-512gb-sac-96w.png", "34.990.000đ", "M2 Pro, ProMotion 120Hz và kết nối HDMI nâng cấp.", [["16GB", "512GB", "34.990.000đ"], ["16GB", "1TB", "39.990.000đ"], ["32GB", "1TB", "49.990.000đ"]], macProColors, proGallery],
  ["macbook-pro-16-m2-pro", "MacBook Pro 16 inch M2 Pro", "/products/macbook-pro-16-inch-m3-max-2023-48gb-1tb.png", "42.990.000đ", "Màn hình lớn và hiệu năng M2 Pro cho quy trình chuyên sâu.", [["16GB", "512GB", "42.990.000đ"], ["16GB", "1TB", "47.990.000đ"], ["32GB", "1TB", "57.990.000đ"]], macProColors, proGallery],
  ["macbook-pro-14-m3", "MacBook Pro 14 inch M3", "/products/macbook-pro-14-inch-m3-max-96gb-512gb-sac-96w.png", "36.990.000đ", "Chip M3 và màn hình XDR trong thân máy Pro 14 inch.", [["8GB", "512GB", "36.990.000đ"], ["16GB", "1TB", "45.990.000đ"], ["24GB", "1TB", "52.990.000đ"]], macProColors, proGallery],
  ["macbook-pro-14-m3-pro", "MacBook Pro 14 inch M3 Pro", "/products/macbook-pro-14-inch-m3-max-96gb-512gb-sac-96w.png", "45.990.000đ", "M3 Pro, màu Đen Không Gian và màn hình Liquid Retina XDR.", [["18GB", "512GB", "45.990.000đ"], ["18GB", "1TB", "51.990.000đ"], ["36GB", "1TB", "63.990.000đ"]], macProColors, proGallery],
  ["macbook-pro-16-m3-pro", "MacBook Pro 16 inch M3 Pro", "/products/macbook-pro-16-inch-m3-max-2023-48gb-1tb.png", "58.990.000đ", "Màn hình 16,2 inch và chip M3 Pro cho tác vụ chuyên nghiệp.", [["18GB", "512GB", "58.990.000đ"], ["18GB", "1TB", "64.990.000đ"], ["36GB", "1TB", "76.990.000đ"]], macProColors, proGallery],
  ["macbook-pro-14-m4", "MacBook Pro 14 inch M4", "/products/macbook-pro-14-inch-m5-16gb-1tb.png", "39.990.000đ", "Chip M4, màn hình XDR và thời lượng pin dài.", [["16GB", "512GB", "39.990.000đ"], ["16GB", "1TB", "45.990.000đ"], ["24GB", "1TB", "52.990.000đ"]], macProColors, proGallery],
  ["macbook-pro-16-m4-pro", "MacBook Pro 16 inch M4 Pro", "/products/macbook-pro-16-inch-m3-max-2023-48gb-1tb.png", "69.990.000đ", "M4 Pro, Thunderbolt 5 và màn hình XDR 16,2 inch.", [["24GB", "512GB", "69.990.000đ"], ["24GB", "1TB", "75.990.000đ"], ["48GB", "1TB", "89.990.000đ"], ["48GB", "2TB", "101.990.000đ"]], macProColors, proGallery],
];

export const additionalMacbooks = additionalMacSeeds.map(([slug, name, image, price, tagline, options, colors, gallery]) => buildProduct({
  slug, name, brand: "Apple", category: "macbook", image, price: `Từ ${price}`, tagline,
  configurations: options.map(([ram, storage, optionPrice]) => ({ ram, storage, price: optionPrice })),
  colors, specs: macSpecs, source: "https://www.apple.com/vn/mac/compare/", gallery,
}));

const ipadColors: ColorAsset[] = [
  { name: "Bạc", hex: "#d8d9db", image: "/products/apple/ipad-a16/silver.jpg" },
  { name: "Xanh Dương", hex: "#7da6bc", image: "/products/apple/ipad-a16/blue.jpg" },
  { name: "Hồng", hex: "#d7a2a9", image: "/products/apple/ipad-a16/pink.jpg" },
];
const ipadProColors: ColorAsset[] = [
  { name: "Đen Không Gian", hex: "#272729", image: "/products/apple/ipad-pro/space-black.jpg" },
  { name: "Bạc", hex: "#d6d7d8", image: "/products/apple/ipad-pro/silver.jpg" },
];
const ipadSpecs = ["Màn hình Liquid Retina", "Chip Apple", "Camera sau 12MP", "Camera trước đặt ngang", "Hỗ trợ Apple Pencil", "Kết nối USB-C", "Wi-Fi tốc độ cao", "Hệ điều hành iPadOS"];
export const newIpads = [
  ["ipad-mini-a17-pro", "iPad mini A17 Pro", "/products/apple/ipad-a16/blue.jpg", "16.499.000đ", "iPad nhỏ gọn với A17 Pro và Apple Pencil Pro.", [["128GB", "16.499.000đ"], ["256GB", "19.999.000đ"], ["512GB", "26.999.000đ"]], exactImageColor("/products/apple/ipad-a16/blue.jpg", "Xanh Dương", "#7da6bc")],
  ["ipad-10", "iPad thế hệ 10", "/products/apple/ipad-a16/pink.jpg", "9.990.000đ", "Thiết kế toàn màn hình phù hợp học tập và giải trí.", [["64GB", "9.990.000đ"], ["256GB", "14.490.000đ"]], ipadColors],
  ["ipad-pro-11-m4", "iPad Pro 11 inch M4", "/products/apple/ipad-pro/space-black.jpg", "27.990.000đ", "Ultra Retina XDR và chip M4 trong thiết kế siêu mỏng.", [["256GB", "27.990.000đ"], ["512GB", "34.490.000đ"], ["1TB", "45.990.000đ"]], ipadProColors],
  ["ipad-pro-13-m4", "iPad Pro 13 inch M4", "/products/apple/ipad-pro/silver.jpg", "36.990.000đ", "Không gian hiển thị 13 inch cho nhà sáng tạo.", [["256GB", "36.990.000đ"], ["512GB", "43.490.000đ"], ["1TB", "54.990.000đ"]], ipadProColors],
  ["ipad-air-11-m3", "iPad Air 11 inch M3", "/products/apple/ipad-air/blue.jpg", "16.990.000đ", "Chip M3 mạnh, thiết kế nhẹ và hỗ trợ Pencil Pro.", [["128GB", "16.990.000đ"], ["256GB", "19.990.000đ"], ["512GB", "25.990.000đ"]], exactImageColor("/products/apple/ipad-air/blue.jpg", "Xanh Dương", "#8094b4")],
].map(([slug, name, image, price, tagline, options, colors]) => buildProduct({
  slug: String(slug), name: String(name), brand: "Apple", category: "ipad", image: String(image), price: `Từ ${price}`, tagline: String(tagline),
  configurations: (options as string[][]).map(([storage, optionPrice]) => ({ storage, price: optionPrice })), colors: colors as ColorAsset[], specs: ipadSpecs, source: "https://www.apple.com/vn/ipad/compare/",
}));

const androidSpecs = ["Màn hình AMOLED tần số quét cao", "Camera chính độ phân giải cao", "Pin dung lượng lớn", "Sạc nhanh", "Hai SIM", "Cảm biến vân tay", "Wi-Fi và Bluetooth", "Hệ điều hành Android"];
const androidSeeds: Array<[string, string, string, string, string, string[][], string, ColorAsset[]?]> = [
  ["redmi-note-15", "Redmi Note 15", "Xiaomi", "/products/redmi-note-14-pro.png", "5.590.000đ", [["6GB", "128GB", "5.590.000đ"], ["8GB", "256GB", "6.790.000đ"]], "AMOLED 6,77 inch, camera 108MP và pin 6.000mAh."],
  ["redmi-note-15-5g", "Redmi Note 15 5G", "Xiaomi", "/products/redmi-note-14-pro.png", "7.190.000đ", [["6GB", "128GB", "7.190.000đ"], ["8GB", "256GB", "8.290.000đ"]], "Kết nối 5G, màn hình AMOLED và camera sắc nét."],
  ["redmi-note-15-pro", "Redmi Note 15 Pro", "Xiaomi", "/products/redmi-note-14-pro.png", "8.990.000đ", [["8GB", "256GB", "8.990.000đ"], ["12GB", "256GB", "9.790.000đ"]], "Camera độ phân giải cao và thân máy bền bỉ."],
  ["redmi-note-15-pro-5g", "Redmi Note 15 Pro 5G", "Xiaomi", "/products/redmi-note-14-pro.png", "10.490.000đ", [["8GB", "256GB", "10.490.000đ"], ["12GB", "256GB", "11.490.000đ"]], "Hiệu năng 5G mạnh, màn hình sáng và camera chống rung."],
  ["redmi-note-15-pro-plus-5g", "Redmi Note 15 Pro+ 5G", "Xiaomi", "/products/redmi-note-14-pro.png", "12.990.000đ", [["12GB", "256GB", "12.990.000đ"], ["12GB", "512GB", "14.490.000đ"]], "Phiên bản Note cao cấp với sạc nhanh nổi bật."],
  ["redmi-15-5g", "Redmi 15 5G", "Xiaomi", "/products/redmi-14c.jpg", "5.890.000đ", [["8GB", "256GB", "5.890.000đ"]], "Màn hình lớn, pin bền và kết nối 5G."],
  ["redmi-15c", "Redmi 15C", "Xiaomi", "/products/redmi-14c.jpg", "3.690.000đ", [["6GB", "128GB", "3.690.000đ"], ["8GB", "256GB", "4.590.000đ"]], "Điện thoại phổ thông màn hình lớn và pin lâu."],
  ["redmi-a5", "Redmi A5", "Xiaomi", "/products/redmi-14c.jpg", "2.690.000đ", [["4GB", "128GB", "2.690.000đ"]], "Lựa chọn cơ bản dễ dùng cho liên lạc hằng ngày."],
  ["redmi-note-14-5g", "Redmi Note 14 5G", "Xiaomi", "/products/redmi-note-14-pro.png", "6.490.000đ", [["8GB", "256GB", "6.490.000đ"]], "Màn hình AMOLED, camera 108MP và kết nối 5G."],
  ["redmi-note-14-pro-plus-5g", "Redmi Note 14 Pro+ 5G", "Xiaomi", "/products/redmi-note-14-pro.png", "8.490.000đ", [["8GB", "256GB", "8.490.000đ"], ["12GB", "512GB", "10.990.000đ"]], "Camera 200MP, sạc nhanh và thiết kế cao cấp."],
  ["xiaomi-15t", "Xiaomi 15T", "Xiaomi", "/products/xiaomi-14t-pro.png", "16.990.000đ", [["12GB", "256GB", "16.990.000đ"], ["12GB", "512GB", "18.990.000đ"]], "Hiệu năng cận cao cấp và camera Leica."],
  ["xiaomi-15t-pro", "Xiaomi 15T Pro", "Xiaomi", "/products/xiaomi-14t-pro.png", "21.990.000đ", [["12GB", "512GB", "21.990.000đ"], ["16GB", "1TB", "25.990.000đ"]], "Hiệu năng flagship, camera Leica và sạc nhanh."],
  ["xiaomi-17", "Xiaomi 17", "Xiaomi", "/products/xiaomi-15.png", "24.990.000đ", [["12GB", "256GB", "24.990.000đ"], ["16GB", "512GB", "28.990.000đ"]], "Flagship nhỏ gọn với hệ thống camera Leica."],
  ["xiaomi-17-ultra", "Xiaomi 17 Ultra", "Xiaomi", "/products/xiaomi-15-ultra.png", "34.990.000đ", [["16GB", "512GB", "34.990.000đ"], ["16GB", "1TB", "39.990.000đ"]], "Camera Leica chuyên sâu và phần cứng flagship."],
  ["poco-f8-pro", "POCO F8 Pro", "POCO", "/products/xiaomi-15.png", "15.990.000đ", [["12GB", "256GB", "15.990.000đ"], ["12GB", "512GB", "17.990.000đ"]], "Hiệu năng chơi game mạnh và màn hình tốc độ cao."],
  ["huawei-pura-80-ultra", "HUAWEI Pura 80 Ultra", "Huawei", "/products/expanded/huawei-pura80-ultra.png", "36.500.000đ", [["16GB", "512GB", "36.500.000đ"]], "Flagship nhiếp ảnh XMAGE với cụm camera nổi bật."],
  ["huawei-pura-80-pro", "HUAWEI Pura 80 Pro", "Huawei", "/products/expanded/huawei-pura80-pro.png", "27.990.000đ", [["12GB", "512GB", "27.990.000đ"]], "Camera XMAGE, màn hình OLED và thiết kế cao cấp."],
  ["huawei-mate-xt", "HUAWEI Mate XT Ultimate Design", "Huawei", "/products/expanded/huawei-mate-xt.jpg", "89.990.000đ", [["16GB", "1TB", "89.990.000đ"]], "Điện thoại gập ba màn hình đặc biệt."],
  ["huawei-mate-x6", "HUAWEI Mate X6", "Huawei", "/products/expanded/huawei-mate-x6.jpg", "49.990.000đ", [["12GB", "512GB", "49.990.000đ"]], "Điện thoại gập cao cấp, mỏng nhẹ và camera XMAGE."],
  ["huawei-nova-13-pro", "HUAWEI nova 13 Pro", "Huawei", "/products/expanded/huawei-nova13-pro.jpg", "16.990.000đ", [["12GB", "256GB", "16.990.000đ"], ["12GB", "512GB", "18.990.000đ"]], "Chân dung đa tiêu cự, thiết kế trẻ và sạc nhanh."],
];
export const newAndroids = androidSeeds.map(([slug, name, brand, image, price, options, tagline, colors]) => buildProduct({
  slug, name, brand, category: "android", image, price: `Từ ${price}`, tagline,
  configurations: options.map(([ram, storage, optionPrice]) => ({ ram, storage, price: optionPrice })), colors: colors ?? exactImageColor(image), specs: androidSpecs,
  source: brand === "Huawei" ? "https://consumer.huawei.com/vn/phones/" : "https://www.mi.com/vn/sitemap/",
}));

const laptopSpecs = ["CPU hiệu năng cao", "GPU NVIDIA GeForce RTX 50 Series", "RAM DDR5", "SSD NVMe", "Màn hình tần số quét cao", "Tản nhiệt chuyên dụng", "Wi-Fi tốc độ cao", "Hệ điều hành Windows 11"];
const laptopSeeds: Array<[string, string, string, string, string, string[][], string, string]> = [
  ["gigabyte-gaming-a16-rtx5070", "Gigabyte Gaming A16 RTX 5070", "Gigabyte", "/products/expanded/aorus-master16.jpg", "40.790.000đ", [["16GB", "1TB", "40.790.000đ"], ["32GB", "1TB", "44.990.000đ"]], "Laptop gaming RTX 5070 màn hình 16 inch.", "https://phongvu.vn/c/laptop-rtx-50-series"],
  ["rog-zephyrus-g14-rtx5070ti", "ASUS ROG Zephyrus G14 RTX 5070 Ti", "ASUS", "/products/expanded/rog-scar18.jpg", "77.990.000đ", [["32GB", "1TB", "77.990.000đ"], ["64GB", "2TB", "86.990.000đ"]], "Gaming cao cấp gọn nhẹ với OLED 14 inch.", "https://phongvu.vn/cong-nghe/asus-rog-ra-mat-laptop-gaming-rtx-50-series-manh-nhat-tai-viet-nam/"],
  ["rog-zephyrus-g16-rtx5070ti", "ASUS ROG Zephyrus G16 RTX 5070 Ti", "ASUS", "/products/expanded/rog-duo.jpg", "82.990.000đ", [["32GB", "1TB", "82.990.000đ"], ["64GB", "2TB", "94.990.000đ"]], "Thân máy mỏng, OLED 16 inch và RTX 5070 Ti.", "https://phongvu.vn/cong-nghe/asus-rog-ra-mat-laptop-gaming-rtx-50-series-manh-nhat-tai-viet-nam/"],
  ["aorus-master-16-rtx5080", "Gigabyte AORUS Master 16 RTX 5080", "Gigabyte", "/products/expanded/aorus-master16.jpg", "90.990.000đ", [["32GB", "1TB", "90.990.000đ"], ["64GB", "2TB", "99.990.000đ"]], "OLED, RTX 5080 và hệ thống tản nhiệt mạnh.", "https://phongvu.vn/cong-nghe/laptop-gigabyte-aorus-master-16-byh-c5vne64s/"],
  ["rog-zephyrus-g14-rtx5080", "ASUS ROG Zephyrus G14 RTX 5080", "ASUS", "/products/expanded/rog-scar18.jpg", "116.990.000đ", [["32GB", "1TB", "116.990.000đ"], ["64GB", "2TB", "126.990.000đ"]], "RTX 5080 trong thiết kế gaming 14 inch cơ động.", "https://phongvu.vn/laptop-asus-rog-zephyrus-g14-gu405aw-sy029w--s260507143"],
  ["rog-strix-scar16-rtx5080", "ASUS ROG Strix SCAR 16 RTX 5080", "ASUS", "/products/expanded/rog-scar18.jpg", "117.990.000đ", [["64GB", "2TB", "117.990.000đ"], ["64GB", "4TB", "129.990.000đ"]], "Mini LED, RTX 5080 và tản nhiệt buồng hơi.", "https://phongvu.vn/cong-nghe/asus-rog-ra-mat-laptop-gaming-rtx-50-series-manh-nhat-tai-viet-nam/"],
  ["msi-raider-18-hx-ai-rtx5080", "MSI Raider 18 HX AI RTX 5080", "MSI", "/products/expanded/msi-raider18.jpg", "119.990.000đ", [["64GB", "4TB", "119.990.000đ"]], "Mini LED 4K 120Hz, RAM 64GB và SSD 4TB.", "https://phongvu.vn/laptop-msi-raider-18-hx-ai-a2xwig-033vn--s250206539"],
  ["rog-zephyrus-g16-rtx5080", "ASUS ROG Zephyrus G16 RTX 5080", "ASUS", "/products/expanded/rog-duo.jpg", "139.990.000đ", [["64GB", "1TB", "139.990.000đ"], ["64GB", "2TB", "149.990.000đ"]], "Laptop gaming mỏng cao cấp với OLED 16 inch.", "https://phongvu.vn/c/laptop-rtx-5080"],
  ["rog-zephyrus-duo-rtx5090", "ASUS ROG Zephyrus Duo RTX 5090", "ASUS", "/products/expanded/rog-duo.jpg", "169.990.000đ", [["64GB", "2TB", "169.990.000đ"], ["64GB", "4TB", "184.990.000đ"]], "Hai màn hình OLED và RTX 5090.", "https://phongvu.vn/cong-nghe/dat-truoc-asus-rog-zephyrus-duo-2026-nhan-ngay-1-nam-bao-hanh/"],
  ["rog-strix-scar18-2026-rtx5090", "ASUS ROG Strix SCAR 18 2026 RTX 5090", "ASUS", "/products/expanded/rog-scar18.jpg", "179.990.000đ", [["64GB", "2TB", "179.990.000đ"], ["64GB", "4TB", "194.990.000đ"]], "Flagship gaming 18 inch với RTX 5090.", "https://tinhocngoisao.com/blogs/tu-van-so-sanh/laptop-rtx-50-series-kien-truc-blackwell-ky-nguyen-ai-cho-sinh-vien"],
];
export const premiumLaptops = laptopSeeds.map(([slug, name, brand, image, price, options, tagline, source]) => buildProduct({
  slug, name, brand, category: "laptop", image, price: `Từ ${price}`, tagline,
  configurations: options.map(([ram, storage, optionPrice]) => ({ ram, storage, price: optionPrice })), colors: exactImageColor(image), specs: laptopSpecs, source, badge: "Laptop cao cấp",
}));

export const expandedProducts: Product[] = [...newIphones, ...classicIphones, ...newMacbooks, ...additionalMacbooks, ...newIpads, ...newAndroids, ...premiumLaptops];
