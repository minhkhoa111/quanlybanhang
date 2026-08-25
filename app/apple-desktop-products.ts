import type { Product, ProductColor, ProductVariant } from "./products";

type ColorAsset = ProductColor & { image: string };
type Configuration = { ram: string; storage: string; price: string };

function desktopVariants(slug: string, configurations: Configuration[], colors: ColorAsset[]): ProductVariant[] {
  return configurations.flatMap((configuration) => colors.map((color) => ({
    id: `${slug}-${configuration.ram}-${configuration.storage}-${color.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: `${configuration.ram} / ${configuration.storage} / ${color.name}`,
    ram: configuration.ram,
    storage: configuration.storage,
    color: color.name,
    colorHex: color.hex,
    price: configuration.price,
    stock: 10,
    image: color.image,
  })));
}

function desktopProduct(seed: {
  slug: string;
  name: string;
  category: "mac-mini-studio" | "imac";
  image: string;
  gallery: string[];
  badge: string;
  tagline: string;
  description: string;
  configurations: Configuration[];
  colors: ColorAsset[];
  specs: string[];
  appleUrl: string;
  tuanDigiUrl: string;
  featured?: boolean;
}): Product {
  return {
    slug: seed.slug,
    name: seed.name,
    brand: "Apple",
    category: seed.category,
    image: seed.image,
    images: Array.from(new Set([seed.image, ...seed.colors.map((color) => color.image), ...seed.gallery])),
    badge: seed.badge,
    tagline: seed.tagline,
    description: seed.description,
    price: `Từ ${seed.configurations[0].price}`,
    sellingPrice: seed.configurations[0].price,
    colors: seed.colors.map((color) => color.hex),
    colorOptions: seed.colors,
    storageOptions: Array.from(new Set(seed.configurations.map((configuration) => configuration.storage))),
    variants: desktopVariants(seed.slug, seed.configurations, seed.colors),
    specs: seed.specs,
    mediaLinks: [
      { label: "Xem thông số chính thức từ Apple", url: seed.appleUrl },
      { label: "Tham khảo sản phẩm tại Tuấn Digi", url: seed.tuanDigiUrl },
    ],
    featured: seed.featured,
    active: true,
    source: seed.tuanDigiUrl,
  };
}

const silverMini: ColorAsset[] = [
  { name: "Bạc", hex: "#c8c9ca", image: "/products/apple/mac-mini/product.jpg" },
];

const silverStudio: ColorAsset[] = [
  { name: "Bạc", hex: "#d4d5d6", image: "/products/apple/mac-studio/front.jpg" },
];

const imacColors: ColorAsset[] = [
  { name: "Xanh Dương", hex: "#8eb6d4", image: "/products/apple/imac/blue.jpg" },
  { name: "Xanh Lá", hex: "#a9c59a", image: "/products/apple/imac/green.jpg" },
  { name: "Vàng", hex: "#e9d26c", image: "/products/apple/imac/yellow.jpg" },
  { name: "Cam", hex: "#e7a26d", image: "/products/apple/imac/orange.jpg" },
  { name: "Hồng", hex: "#d8a1ad", image: "/products/apple/imac/pink.jpg" },
  { name: "Tím", hex: "#aaa0c8", image: "/products/apple/imac/purple.jpg" },
  { name: "Bạc", hex: "#d8d8d8", image: "/products/apple/imac/silver.jpg" },
];

const miniUrl = "https://tuandigi.vn/imac-macmini/";
const imacUrl = "https://tuandigi.vn/imac-macmini/";

export const appleDesktopProducts: Product[] = [
  desktopProduct({
    slug: "mac-mini-m4",
    name: "Mac mini M4",
    category: "mac-mini-studio",
    image: "/products/mac-mini-m4-2024-16gb-512gb.png",
    gallery: ["/products/apple/mac-mini/hero.jpg", "/products/apple/mac-mini/product.jpg"],
    badge: "M4",
    tagline: "Thiết kế vuông 12,7 cm nhỏ gọn với chip M4 và kết nối hiện đại.",
    description: "Mac mini M4 phù hợp bàn làm việc gọn nhẹ, lập trình, văn phòng và sáng tạo nội dung với RAM hợp nhất và SSD theo từng cấu hình.",
    configurations: [
      { ram: "16GB", storage: "256GB", price: "14.490.000đ" },
      { ram: "16GB", storage: "512GB", price: "19.190.000đ" },
      { ram: "24GB", storage: "256GB", price: "19.890.000đ" },
      { ram: "24GB", storage: "512GB", price: "24.290.000đ" },
    ],
    colors: silverMini,
    specs: ["Chip Apple M4", "CPU 10 lõi và GPU 10 lõi", "RAM hợp nhất từ 16GB", "SSD từ 256GB", "Ba cổng Thunderbolt 4", "HDMI, Gigabit Ethernet và USB-C phía trước", "Hỗ trợ tối đa ba màn hình", "Hệ điều hành macOS"],
    appleUrl: "https://www.apple.com/vn/mac-mini/specs/",
    tuanDigiUrl: miniUrl,
    featured: true,
  }),
  desktopProduct({
    slug: "mac-mini-m4-pro",
    name: "Mac mini M4 Pro",
    category: "mac-mini-studio",
    image: "/products/mac-mini-m4-2024-24gb-512gb.png",
    gallery: ["/products/apple/mac-mini/hero.jpg", "/products/apple/mac-mini/product.jpg"],
    badge: "M4 Pro",
    tagline: "Mac mini nhỏ gọn với M4 Pro, Thunderbolt 5 và hiệu năng chuyên nghiệp.",
    description: "Mac mini M4 Pro dành cho lập trình, dựng nội dung và quy trình chuyên sâu cần băng thông cao trong một thân máy rất nhỏ.",
    configurations: [{ ram: "24GB", storage: "512GB", price: "34.690.000đ" }],
    colors: silverMini,
    specs: ["Chip Apple M4 Pro", "CPU 12 lõi và GPU 16 lõi", "RAM hợp nhất 24GB", "SSD 512GB", "Ba cổng Thunderbolt 5", "HDMI, Gigabit Ethernet và USB-C phía trước", "Hỗ trợ tối đa ba màn hình", "Hệ điều hành macOS"],
    appleUrl: "https://www.apple.com/vn/mac-mini/specs/",
    tuanDigiUrl: miniUrl,
  }),
  desktopProduct({
    slug: "mac-studio-m4-max",
    name: "Mac Studio M4 Max",
    category: "mac-mini-studio",
    image: "/products/apple/mac-studio/front.jpg",
    gallery: ["/products/apple/mac-studio/back.jpg"],
    badge: "M4 Max",
    tagline: "Máy trạm để bàn mạnh mẽ cho video, 3D, âm thanh và quy trình AI.",
    description: "Mac Studio M4 Max mang hiệu năng chuyên nghiệp, nhiều cổng kết nối và khả năng điều khiển nhiều màn hình trong thiết kế để bàn nhỏ gọn.",
    configurations: [{ ram: "36GB", storage: "512GB", price: "57.890.000đ" }],
    colors: silverStudio,
    specs: ["Chip Apple M4 Max", "CPU 14 lõi và GPU 32 lõi", "RAM hợp nhất 36GB", "SSD 512GB", "Thunderbolt 5", "HDMI, 10Gb Ethernet và khe thẻ SDXC", "Hỗ trợ tối đa năm màn hình", "Hệ điều hành macOS"],
    appleUrl: "https://www.apple.com/vn/mac-studio/specs/",
    tuanDigiUrl: miniUrl,
    featured: true,
  }),
  desktopProduct({
    slug: "mac-studio-m3-ultra",
    name: "Mac Studio M3 Ultra",
    category: "mac-mini-studio",
    image: "/products/apple/mac-studio/front.jpg",
    gallery: ["/products/apple/mac-studio/back.jpg"],
    badge: "M3 Ultra",
    tagline: "Hiệu năng máy trạm cực cao cho mô hình AI, 3D và hậu kỳ chuyên nghiệp.",
    description: "Mac Studio M3 Ultra dành cho khối lượng công việc lớn với bộ nhớ hợp nhất dung lượng cao và hệ thống cổng Thunderbolt 5.",
    configurations: [{ ram: "96GB", storage: "1TB", price: "115.890.000đ" }],
    colors: silverStudio,
    specs: ["Chip Apple M3 Ultra", "CPU 28 lõi và GPU 60 lõi", "RAM hợp nhất 96GB", "SSD 1TB", "Thunderbolt 5", "HDMI, 10Gb Ethernet và khe thẻ SDXC", "Hỗ trợ tối đa tám màn hình", "Hệ điều hành macOS"],
    appleUrl: "https://www.apple.com/vn/mac-studio/specs/",
    tuanDigiUrl: miniUrl,
  }),
  desktopProduct({
    slug: "imac-24-m4-8cpu-8gpu",
    name: "iMac 24 inch M4 8CPU 8GPU",
    category: "imac",
    image: "/products/apple/imac/hero.jpg",
    gallery: ["/products/apple/imac/blue-product.jpg"],
    badge: "M4",
    tagline: "Máy tính all-in-one 24 inch Retina 4.5K với thiết kế mỏng và bảy màu.",
    description: "iMac M4 kết hợp màn hình 4.5K, camera Center Stage và hệ thống máy tính hoàn chỉnh trong thân máy mỏng gọn.",
    configurations: [
      { ram: "16GB", storage: "256GB", price: "34.890.000đ" },
      { ram: "16GB", storage: "512GB", price: "39.890.000đ" },
    ],
    colors: imacColors,
    specs: ["Chip Apple M4", "CPU 8 lõi và GPU 8 lõi", "RAM hợp nhất 16GB", "SSD từ 256GB", "Màn hình Retina 4.5K 24 inch", "Camera 12MP Center Stage", "Hệ thống sáu loa", "Hai cổng Thunderbolt / USB 4", "Hệ điều hành macOS"],
    appleUrl: "https://www.apple.com/vn/imac/specs/",
    tuanDigiUrl: imacUrl,
    featured: true,
  }),
  desktopProduct({
    slug: "imac-24-m4-10cpu-10gpu",
    name: "iMac 24 inch M4 10CPU 10GPU",
    category: "imac",
    image: "/products/apple/imac/hero.jpg",
    gallery: ["/products/apple/imac/blue-product.jpg"],
    badge: "M4 10GPU",
    tagline: "iMac M4 hiệu năng cao hơn với GPU 10 lõi và kết nối mở rộng.",
    description: "Phiên bản iMac M4 10CPU 10GPU phù hợp thiết kế, chỉnh sửa ảnh và video với màn hình Retina 4.5K sắc nét.",
    configurations: [
      { ram: "16GB", storage: "256GB", price: "39.890.000đ" },
      { ram: "16GB", storage: "512GB", price: "44.890.000đ" },
    ],
    colors: imacColors,
    specs: ["Chip Apple M4", "CPU 10 lõi và GPU 10 lõi", "RAM hợp nhất 16GB", "SSD từ 256GB", "Màn hình Retina 4.5K 24 inch", "Camera 12MP Center Stage", "Hệ thống sáu loa", "Bốn cổng USB-C, gồm hai cổng Thunderbolt", "Hệ điều hành macOS"],
    appleUrl: "https://www.apple.com/vn/imac/specs/",
    tuanDigiUrl: imacUrl,
  }),
  desktopProduct({
    slug: "imac-24-m3-8cpu-8gpu",
    name: "iMac 24 inch M3 8CPU 8GPU",
    category: "imac",
    image: "/products/apple/imac/hero.jpg",
    gallery: ["/products/apple/imac/blue-product.jpg"],
    badge: "M3",
    tagline: "iMac M3 24 inch cân bằng giữa thiết kế all-in-one và hiệu năng hằng ngày.",
    description: "iMac M3 phù hợp làm việc tại nhà, văn phòng và sáng tạo cơ bản với màn hình Retina 4.5K và bảy màu hoàn thiện.",
    configurations: [{ ram: "8GB", storage: "256GB", price: "35.390.000đ" }],
    colors: imacColors,
    specs: ["Chip Apple M3", "CPU 8 lõi và GPU 8 lõi", "RAM hợp nhất 8GB", "SSD 256GB", "Màn hình Retina 4.5K 24 inch", "Camera FaceTime HD 1080p", "Hệ thống sáu loa", "Hai cổng Thunderbolt / USB 4", "Hệ điều hành macOS"],
    appleUrl: "https://support.apple.com/vi-vn/111833",
    tuanDigiUrl: imacUrl,
  }),
  desktopProduct({
    slug: "imac-24-m3-8cpu-10gpu",
    name: "iMac 24 inch M3 8CPU 10GPU",
    category: "imac",
    image: "/products/apple/imac/hero.jpg",
    gallery: ["/products/apple/imac/blue-product.jpg"],
    badge: "M3 10GPU",
    tagline: "iMac M3 với GPU 10 lõi, nhiều cổng hơn và màn hình Retina 4.5K.",
    description: "Phiên bản iMac M3 10GPU tăng hiệu năng đồ họa và dung lượng SSD để phục vụ tốt hơn các công việc sáng tạo.",
    configurations: [
      { ram: "8GB", storage: "256GB", price: "39.890.000đ" },
      { ram: "8GB", storage: "512GB", price: "46.890.000đ" },
    ],
    colors: imacColors,
    specs: ["Chip Apple M3", "CPU 8 lõi và GPU 10 lõi", "RAM hợp nhất 8GB", "SSD từ 256GB", "Màn hình Retina 4.5K 24 inch", "Camera FaceTime HD 1080p", "Hệ thống sáu loa", "Bốn cổng USB-C, gồm hai cổng Thunderbolt", "Hệ điều hành macOS"],
    appleUrl: "https://support.apple.com/vi-vn/111833",
    tuanDigiUrl: imacUrl,
  }),
];
