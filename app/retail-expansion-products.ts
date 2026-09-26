import type { Product, ProductVariant } from "./products";
import laptopImageManifest from "./laptop-image-manifest.json";

type LaptopTier = "office" | "creator" | "gaming" | "workstation";
type LaptopSeed = {
  slug: string;
  name: string;
  brand: string;
  price: number;
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  display: string;
  tier: LaptopTier;
  source: string;
};

const laptopImages: Record<LaptopTier, string> = {
  office: "/products/expanded/aorus-master16.jpg",
  creator: "/products/expanded/rog-duo.jpg",
  gaming: "/products/expanded/rog-scar18.jpg",
  workstation: "/products/expanded/msi-raider18.jpg",
};

type VerifiedLaptopImage = { path?: string; gallery?: string[]; curated?: boolean };

const verifiedLaptopImages = laptopImageManifest as Record<string, VerifiedLaptopImage>;

function laptopImage(slug: string, tier: LaptopTier) {
  const verified = verifiedLaptopImages[slug];
  return verified?.curated ? verified.path ?? laptopImages[tier] : laptopImages[tier];
}

function laptopGallery(slug: string, image: string) {
  const gallery = verifiedLaptopImages[slug]?.gallery ?? [];
  return [...new Set([image, ...gallery])];
}

const formatPrice = (value: number) => `${new Intl.NumberFormat("vi-VN").format(value)}đ`;

const ASUS_SOURCE = "https://www.asus.com/vn/laptops/";
const LENOVO_SOURCE = "https://www.lenovo.com/vn/vi/laptops/";
const DELL_SOURCE = "https://www.dell.com/en-vn/shop/cty/sc/laptops";
const HP_SOURCE = "https://www.hp.com/vn-en/shop/laptops-tablets.html";
const ACER_SOURCE = "https://www.acer.com/vn-vi/laptops";
const MSI_SOURCE = "https://vn.msi.com/Laptops";

export const expandedLaptopSeeds: LaptopSeed[] = [
  { slug: "asus-vivobook-go-15-e1504", name: "ASUS Vivobook Go 15 E1504", brand: "ASUS", price: 12000000, cpu: "AMD Ryzen 5 7520U", gpu: "AMD Radeon 610M", ram: "16GB", storage: "512GB", display: "15,6 inch FHD", tier: "office", source: ASUS_SOURCE },
  { slug: "asus-vivobook-15-x1504", name: "ASUS Vivobook 15 X1504", brand: "ASUS", price: 12990000, cpu: "Intel Core i3-1315U", gpu: "Intel UHD", ram: "8GB", storage: "512GB", display: "15,6 inch FHD", tier: "office", source: ASUS_SOURCE },
  { slug: "asus-vivobook-16-x1605", name: "ASUS Vivobook 16 X1605", brand: "ASUS", price: 16490000, cpu: "Intel Core i5-13420H", gpu: "Intel UHD", ram: "16GB", storage: "512GB", display: "16 inch WUXGA", tier: "office", source: ASUS_SOURCE },
  { slug: "asus-vivobook-s14-oled-m5406", name: "ASUS Vivobook S 14 OLED M5406", brand: "ASUS", price: 24990000, cpu: "AMD Ryzen AI 7", gpu: "AMD Radeon", ram: "24GB", storage: "1TB", display: "14 inch 3K OLED 120Hz", tier: "creator", source: ASUS_SOURCE },
  { slug: "asus-zenbook-14-oled-ux3405", name: "ASUS Zenbook 14 OLED UX3405", brand: "ASUS", price: 29290000, cpu: "Intel Core Ultra 7", gpu: "Intel Arc", ram: "16GB", storage: "1TB", display: "14 inch 3K OLED 120Hz", tier: "creator", source: ASUS_SOURCE },
  { slug: "asus-zenbook-a14-ux3407", name: "ASUS Zenbook A14 UX3407", brand: "ASUS", price: 31990000, cpu: "Snapdragon X Elite", gpu: "Qualcomm Adreno", ram: "32GB", storage: "1TB", display: "14 inch OLED", tier: "creator", source: ASUS_SOURCE },
  { slug: "asus-zenbook-s16-um5606", name: "ASUS Zenbook S 16 UM5606", brand: "ASUS", price: 42990000, cpu: "AMD Ryzen AI 9 HX", gpu: "AMD Radeon 890M", ram: "32GB", storage: "1TB", display: "16 inch 3K OLED 120Hz", tier: "creator", source: ASUS_SOURCE },
  { slug: "asus-tuf-gaming-a15-fa507", name: "ASUS TUF Gaming A15 FA507", brand: "ASUS", price: 25990000, cpu: "AMD Ryzen 7 7435HS", gpu: "NVIDIA GeForce RTX 4050", ram: "16GB", storage: "512GB", display: "15,6 inch FHD 144Hz", tier: "gaming", source: ASUS_SOURCE },
  { slug: "asus-tuf-gaming-f16-fx607", name: "ASUS TUF Gaming F16 FX607", brand: "ASUS", price: 39990000, cpu: "Intel Core i7-14650HX", gpu: "NVIDIA GeForce RTX 5060", ram: "32GB", storage: "1TB", display: "16 inch 2.5K 165Hz", tier: "gaming", source: ASUS_SOURCE },
  { slug: "asus-rog-strix-g16-g615", name: "ASUS ROG Strix G16 G615", brand: "ASUS", price: 59990000, cpu: "Intel Core Ultra 9", gpu: "NVIDIA GeForce RTX 5070", ram: "32GB", storage: "1TB", display: "16 inch 2.5K 240Hz", tier: "gaming", source: ASUS_SOURCE },
  { slug: "asus-proart-p16-h7606", name: "ASUS ProArt P16 H7606", brand: "ASUS", price: 79990000, cpu: "AMD Ryzen AI 9 HX", gpu: "NVIDIA GeForce RTX 5070", ram: "64GB", storage: "2TB", display: "16 inch 4K OLED", tier: "workstation", source: ASUS_SOURCE },
  { slug: "asus-rog-strix-scar-18-g835lx", name: "ASUS ROG Strix SCAR 18 G835LX", brand: "ASUS", price: 199990000, cpu: "Intel Core Ultra 9 HX", gpu: "NVIDIA GeForce RTX 5090", ram: "64GB", storage: "4TB", display: "18 inch Mini LED 240Hz", tier: "gaming", source: ASUS_SOURCE },

  { slug: "lenovo-ideapad-slim-3-14irh10", name: "Lenovo IdeaPad Slim 3 14IRH10", brand: "Lenovo", price: 12990000, cpu: "Intel Core i5-13420H", gpu: "Intel UHD", ram: "16GB", storage: "512GB", display: "14 inch WUXGA", tier: "office", source: LENOVO_SOURCE },
  { slug: "lenovo-ideapad-slim-3-15abr8", name: "Lenovo IdeaPad Slim 3 15ABR8", brand: "Lenovo", price: 16990000, cpu: "AMD Ryzen 7 7730U", gpu: "AMD Radeon", ram: "16GB", storage: "512GB", display: "15,6 inch FHD", tier: "office", source: LENOVO_SOURCE },
  { slug: "lenovo-ideapad-slim-5-14-oled", name: "Lenovo IdeaPad Slim 5 14 OLED", brand: "Lenovo", price: 21990000, cpu: "AMD Ryzen 7 8845HS", gpu: "AMD Radeon 780M", ram: "16GB", storage: "1TB", display: "14 inch OLED", tier: "creator", source: LENOVO_SOURCE },
  { slug: "lenovo-yoga-slim-7i-aura", name: "Lenovo Yoga Slim 7i Aura Edition", brand: "Lenovo", price: 34990000, cpu: "Intel Core Ultra 7", gpu: "Intel Arc", ram: "32GB", storage: "1TB", display: "15,3 inch 2.8K 120Hz", tier: "creator", source: LENOVO_SOURCE },
  { slug: "lenovo-thinkbook-14-g7", name: "Lenovo ThinkBook 14 G7", brand: "Lenovo", price: 22990000, cpu: "Intel Core Ultra 5", gpu: "Intel Graphics", ram: "16GB", storage: "512GB", display: "14 inch WUXGA", tier: "office", source: LENOVO_SOURCE },
  { slug: "lenovo-thinkpad-e14-gen-6", name: "Lenovo ThinkPad E14 Gen 6", brand: "Lenovo", price: 26990000, cpu: "Intel Core Ultra 5", gpu: "Intel Graphics", ram: "16GB", storage: "512GB", display: "14 inch WUXGA", tier: "office", source: LENOVO_SOURCE },
  { slug: "lenovo-thinkpad-t14-gen-6", name: "Lenovo ThinkPad T14 Gen 6", brand: "Lenovo", price: 44990000, cpu: "Intel Core Ultra 7", gpu: "Intel Arc", ram: "32GB", storage: "1TB", display: "14 inch 2.8K OLED", tier: "workstation", source: LENOVO_SOURCE },
  { slug: "lenovo-loq-15irx10", name: "Lenovo LOQ 15IRX10", brand: "Lenovo", price: 26990000, cpu: "Intel Core i7-13650HX", gpu: "NVIDIA GeForce RTX 4050", ram: "16GB", storage: "512GB", display: "15,6 inch FHD 144Hz", tier: "gaming", source: LENOVO_SOURCE },
  { slug: "lenovo-legion-5-15irx10", name: "Lenovo Legion 5 15IRX10", brand: "Lenovo", price: 39990000, cpu: "Intel Core i7-14700HX", gpu: "NVIDIA GeForce RTX 5060", ram: "32GB", storage: "1TB", display: "15,6 inch 2.5K 165Hz", tier: "gaming", source: LENOVO_SOURCE },
  { slug: "lenovo-legion-pro-7i-gen-10", name: "Lenovo Legion Pro 7i Gen 10", brand: "Lenovo", price: 129990000, cpu: "Intel Core Ultra 9 HX", gpu: "NVIDIA GeForce RTX 5090", ram: "64GB", storage: "2TB", display: "16 inch OLED 240Hz", tier: "gaming", source: LENOVO_SOURCE },

  { slug: "dell-inspiron-15-3530", name: "Dell Inspiron 15 3530", brand: "Dell", price: 13490000, cpu: "Intel Core i5-1334U", gpu: "Intel Iris Xe", ram: "16GB", storage: "512GB", display: "15,6 inch FHD 120Hz", tier: "office", source: DELL_SOURCE },
  { slug: "dell-inspiron-14-plus-7440", name: "Dell Inspiron 14 Plus 7440", brand: "Dell", price: 27990000, cpu: "Intel Core Ultra 7", gpu: "Intel Arc", ram: "16GB", storage: "1TB", display: "14 inch 2.5K", tier: "creator", source: DELL_SOURCE },
  { slug: "dell-plus-14-db14250", name: "Dell Plus 14 DB14250", brand: "Dell", price: 30990000, cpu: "Intel Core Ultra 7", gpu: "Intel Arc", ram: "32GB", storage: "1TB", display: "14 inch QHD+", tier: "creator", source: DELL_SOURCE },
  { slug: "dell-latitude-3450", name: "Dell Latitude 3450", brand: "Dell", price: 19990000, cpu: "Intel Core i5-1335U", gpu: "Intel Iris Xe", ram: "16GB", storage: "512GB", display: "14 inch FHD", tier: "office", source: DELL_SOURCE },
  { slug: "dell-latitude-5450", name: "Dell Latitude 5450", brand: "Dell", price: 32990000, cpu: "Intel Core Ultra 7", gpu: "Intel Graphics", ram: "32GB", storage: "1TB", display: "14 inch FHD+", tier: "workstation", source: DELL_SOURCE },
  { slug: "dell-xps-13-9345", name: "Dell XPS 13 9345", brand: "Dell", price: 39990000, cpu: "Snapdragon X Elite", gpu: "Qualcomm Adreno", ram: "32GB", storage: "1TB", display: "13,4 inch 3K OLED", tier: "creator", source: DELL_SOURCE },
  { slug: "dell-pro-14-premium-pa14250", name: "Dell Pro 14 Premium PA14250", brand: "Dell", price: 48990000, cpu: "Intel Core Ultra 7 vPro", gpu: "Intel Arc", ram: "32GB", storage: "1TB", display: "14 inch QHD+", tier: "workstation", source: DELL_SOURCE },
  { slug: "dell-alienware-m16-r2", name: "Dell Alienware m16 R2", brand: "Dell", price: 69990000, cpu: "Intel Core Ultra 9", gpu: "NVIDIA GeForce RTX 4070", ram: "32GB", storage: "1TB", display: "16 inch QHD+ 240Hz", tier: "gaming", source: DELL_SOURCE },
  { slug: "dell-precision-7780", name: "Dell Precision 7780 Mobile Workstation", brand: "Dell", price: 139990000, cpu: "Intel Core i9 HX", gpu: "NVIDIA RTX 5000 Ada", ram: "64GB", storage: "2TB", display: "17,3 inch UHD", tier: "workstation", source: DELL_SOURCE },

  { slug: "hp-15-fd0234tu", name: "HP 15 fd0234TU", brand: "HP", price: 12490000, cpu: "Intel Core i3-1315U", gpu: "Intel UHD", ram: "8GB", storage: "512GB", display: "15,6 inch FHD", tier: "office", source: HP_SOURCE },
  { slug: "hp-pavilion-14-dv2074tu", name: "HP Pavilion 14 dv2074TU", brand: "HP", price: 17490000, cpu: "Intel Core i5-1235U", gpu: "Intel Iris Xe", ram: "16GB", storage: "512GB", display: "14 inch FHD", tier: "office", source: HP_SOURCE },
  { slug: "hp-pavilion-plus-14-ew", name: "HP Pavilion Plus 14 OLED", brand: "HP", price: 26990000, cpu: "Intel Core Ultra 7", gpu: "Intel Arc", ram: "16GB", storage: "1TB", display: "14 inch 2.8K OLED 120Hz", tier: "creator", source: HP_SOURCE },
  { slug: "hp-envy-x360-14-fc", name: "HP Envy x360 14", brand: "HP", price: 29990000, cpu: "Intel Core Ultra 7", gpu: "Intel Graphics", ram: "16GB", storage: "1TB", display: "14 inch 2.8K OLED cảm ứng", tier: "creator", source: HP_SOURCE },
  { slug: "hp-omnibook-ultra-flip-14", name: "HP OmniBook Ultra Flip 14", brand: "HP", price: 39990000, cpu: "Intel Core Ultra 7", gpu: "Intel Arc", ram: "32GB", storage: "1TB", display: "14 inch 3K OLED cảm ứng", tier: "creator", source: HP_SOURCE },
  { slug: "hp-victus-15-fa", name: "HP Victus 15", brand: "HP", price: 25990000, cpu: "Intel Core i7-13620H", gpu: "NVIDIA GeForce RTX 4050", ram: "16GB", storage: "512GB", display: "15,6 inch FHD 144Hz", tier: "gaming", source: HP_SOURCE },
  { slug: "hp-omen-16-ap", name: "HP OMEN 16", brand: "HP", price: 49990000, cpu: "AMD Ryzen AI 9", gpu: "NVIDIA GeForce RTX 5070", ram: "32GB", storage: "1TB", display: "16 inch 2.5K 240Hz", tier: "gaming", source: HP_SOURCE },
  { slug: "hp-zbook-fury-16-g11", name: "HP ZBook Fury 16 G11", brand: "HP", price: 149990000, cpu: "Intel Core i9 HX", gpu: "NVIDIA RTX 4000 Ada", ram: "64GB", storage: "2TB", display: "16 inch UHD DreamColor", tier: "workstation", source: HP_SOURCE },

  { slug: "acer-aspire-lite-15-al15", name: "Acer Aspire Lite 15 AL15", brand: "Acer", price: 12290000, cpu: "Intel Core i5-1235U", gpu: "Intel Iris Xe", ram: "16GB", storage: "512GB", display: "15,6 inch FHD", tier: "office", source: ACER_SOURCE },
  { slug: "acer-aspire-5-14-a514", name: "Acer Aspire 5 14 A514", brand: "Acer", price: 16990000, cpu: "Intel Core i5-13420H", gpu: "Intel UHD", ram: "16GB", storage: "512GB", display: "14 inch WUXGA", tier: "office", source: ACER_SOURCE },
  { slug: "acer-swift-go-14-oled-sfg14", name: "Acer Swift Go 14 OLED", brand: "Acer", price: 23990000, cpu: "Intel Core Ultra 5", gpu: "Intel Arc", ram: "16GB", storage: "512GB", display: "14 inch 2.8K OLED 120Hz", tier: "creator", source: ACER_SOURCE },
  { slug: "acer-swift-x-14-sfx14", name: "Acer Swift X 14", brand: "Acer", price: 36990000, cpu: "Intel Core Ultra 7", gpu: "NVIDIA GeForce RTX 4050", ram: "32GB", storage: "1TB", display: "14,5 inch 2.8K OLED", tier: "creator", source: ACER_SOURCE },
  { slug: "acer-nitro-v-15-anv15", name: "Acer Nitro V 15", brand: "Acer", price: 24490000, cpu: "Intel Core i5-13420H", gpu: "NVIDIA GeForce RTX 4050", ram: "16GB", storage: "512GB", display: "15,6 inch FHD 144Hz", tier: "gaming", source: ACER_SOURCE },
  { slug: "acer-predator-helios-neo-16", name: "Acer Predator Helios Neo 16", brand: "Acer", price: 54990000, cpu: "Intel Core Ultra 9 HX", gpu: "NVIDIA GeForce RTX 5070", ram: "32GB", storage: "1TB", display: "16 inch 2.5K 240Hz", tier: "gaming", source: ACER_SOURCE },
  { slug: "acer-predator-helios-18-ai", name: "Acer Predator Helios 18 AI", brand: "Acer", price: 139990000, cpu: "Intel Core Ultra 9 HX", gpu: "NVIDIA GeForce RTX 5090", ram: "64GB", storage: "2TB", display: "18 inch Mini LED 250Hz", tier: "gaming", source: ACER_SOURCE },

  { slug: "msi-modern-14-f13mg", name: "MSI Modern 14 F13MG", brand: "MSI", price: 12990000, cpu: "Intel Core i5-1335U", gpu: "Intel Iris Xe", ram: "16GB", storage: "512GB", display: "14 inch FHD", tier: "office", source: MSI_SOURCE },
  { slug: "msi-modern-15-h-ai", name: "MSI Modern 15 H AI", brand: "MSI", price: 14990000, cpu: "Intel Core Ultra 5", gpu: "Intel Graphics", ram: "16GB", storage: "512GB", display: "15,6 inch FHD", tier: "office", source: MSI_SOURCE },
  { slug: "msi-prestige-13-ai-evo", name: "MSI Prestige 13 AI Evo", brand: "MSI", price: 29990000, cpu: "Intel Core Ultra 7", gpu: "Intel Arc", ram: "32GB", storage: "1TB", display: "13,3 inch 2.8K OLED", tier: "creator", source: MSI_SOURCE },
  { slug: "msi-katana-15-b13v", name: "MSI Katana 15 B13V", brand: "MSI", price: 32990000, cpu: "Intel Core i7-13620H", gpu: "NVIDIA GeForce RTX 4060", ram: "16GB", storage: "1TB", display: "15,6 inch QHD 165Hz", tier: "gaming", source: MSI_SOURCE },
  { slug: "msi-cyborg-15-ai-a2r", name: "MSI Cyborg 15 AI", brand: "MSI", price: 38990000, cpu: "Intel Core Ultra 7", gpu: "NVIDIA GeForce RTX 5060", ram: "32GB", storage: "1TB", display: "15,6 inch QHD 165Hz", tier: "gaming", source: MSI_SOURCE },
  { slug: "msi-stealth-18-ai-studio", name: "MSI Stealth 18 AI Studio", brand: "MSI", price: 99990000, cpu: "Intel Core Ultra 9", gpu: "NVIDIA GeForce RTX 5080", ram: "64GB", storage: "2TB", display: "18 inch UHD+ Mini LED", tier: "gaming", source: MSI_SOURCE },
  { slug: "msi-titan-18-hx-ai", name: "MSI Titan 18 HX AI", brand: "MSI", price: 179990000, cpu: "Intel Core Ultra 9 HX", gpu: "NVIDIA GeForce RTX 5090", ram: "96GB", storage: "4TB", display: "18 inch UHD+ Mini LED", tier: "gaming", source: MSI_SOURCE },

  { slug: "gigabyte-g6-kf", name: "Gigabyte G6 KF", brand: "Gigabyte", price: 29990000, cpu: "Intel Core i7-13620H", gpu: "NVIDIA GeForce RTX 4060", ram: "16GB", storage: "1TB", display: "16 inch WUXGA 165Hz", tier: "gaming", source: "https://www.gigabyte.com/Laptop" },
  { slug: "razer-blade-16-rtx5090", name: "Razer Blade 16 RTX 5090", brand: "Razer", price: 169990000, cpu: "AMD Ryzen AI 9 HX", gpu: "NVIDIA GeForce RTX 5090", ram: "64GB", storage: "2TB", display: "16 inch OLED 240Hz", tier: "gaming", source: "https://www.razer.com/gaming-laptops" },
  { slug: "lg-gram-pro-17-17z90", name: "LG gram Pro 17", brand: "LG", price: 49990000, cpu: "Intel Core Ultra 7", gpu: "NVIDIA GeForce RTX 4050", ram: "32GB", storage: "1TB", display: "17 inch WQXGA", tier: "creator", source: "https://www.lg.com/vn/laptop" },
  { slug: "microsoft-surface-laptop-7", name: "Microsoft Surface Laptop 7", brand: "Microsoft", price: 42990000, cpu: "Snapdragon X Elite", gpu: "Qualcomm Adreno", ram: "32GB", storage: "1TB", display: "13,8 inch PixelSense 120Hz", tier: "office", source: "https://www.microsoft.com/surface/devices/surface-laptop-7th-edition" },
];

export const retailLaptopProducts: Product[] = expandedLaptopSeeds.map((seed, index) => {
  const price = formatPrice(seed.price);
  const image = laptopImage(seed.slug, seed.tier);
  const variant: ProductVariant = {
    id: `${seed.slug}-${seed.ram}-${seed.storage}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: `${seed.ram} / ${seed.storage}`,
    ram: seed.ram,
    storage: seed.storage,
    price,
    stock: 4 + (index % 8),
    image,
  };
  return {
    slug: seed.slug,
    name: seed.name,
    brand: seed.brand,
    category: "laptop",
    image,
    images: laptopGallery(seed.slug, image),
    badge: seed.tier === "office" ? "Học tập · Văn phòng" : seed.tier === "creator" ? "Sáng tạo" : seed.tier === "workstation" ? "Máy trạm" : "Gaming",
    tagline: `${seed.cpu}, ${seed.gpu}, RAM ${seed.ram} và SSD ${seed.storage}.`,
    description: `Laptop ${seed.name} với ${seed.display}. Giá hiển thị là giá tham khảo và được nhân viên xác nhận lại theo cấu hình, chương trình khuyến mãi và tồn kho.`,
    price,
    sellingPrice: price,
    stock: variant.stock,
    variants: [variant],
    colors: [seed.tier === "office" ? "#c9cdd3" : "#24272d"],
    specs: [seed.cpu, seed.gpu, `RAM ${seed.ram}`, `SSD ${seed.storage}`, seed.display, "Wi-Fi tốc độ cao", "Windows 11", "Bảo hành chính hãng"],
    tags: [seed.brand, seed.tier, "laptop", "giá tham khảo", "catalog expansion"],
    active: true,
    source: seed.source,
  };
});

const macImage = "/products/apple/macbook-pro/space-black.jpg";
const macSilverImage = "/products/apple/macbook-pro/silver.jpg";

type MacConfiguration = { ram: string; storage: string; price: number };

function macbookProduct(slug: string, name: string, chip: string, configurations: MacConfiguration[]): Product {
  const variants = configurations.map(({ ram, storage, price }, index) => {
    return {
      id: `${slug}-${ram}-${storage}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: `${chip} / ${ram} / ${storage}`,
      ram,
      storage,
      version: chip,
      price: formatPrice(price),
      stock: 5,
      image: index % 2 ? macSilverImage : macImage,
    };
  });
  const ramOptions = [...new Set(configurations.map((configuration) => configuration.ram))];
  const storageOptions = [...new Set(configurations.map((configuration) => configuration.storage))];
  const startingPrice = Math.min(...configurations.map((configuration) => configuration.price));
  return {
    slug,
    name,
    brand: "Apple",
    category: "macbook",
    image: macImage,
    images: [macImage, macSilverImage],
    badge: chip,
    tagline: `${chip} cho hiệu năng chuyên nghiệp với nhiều lựa chọn RAM hợp nhất và SSD.`,
    description: `${name} phù hợp lập trình, sáng tạo nội dung, dựng phim và xử lý công việc chuyên sâu.`,
    price: `Từ ${formatPrice(startingPrice)}`,
    sellingPrice: formatPrice(startingPrice),
    stock: variants.reduce((total, variant) => total + (variant.stock ?? 0), 0),
    variants,
    colors: ["#272729", "#d6d7d8"],
    colorOptions: [{ name: "Đen Không Gian", hex: "#272729" }, { name: "Bạc", hex: "#d6d7d8" }],
    storageOptions,
    specs: [chip, `RAM hợp nhất ${ramOptions.join(" / ")}`, `SSD ${storageOptions.join(" / ")}`, name.includes("16 inch") ? "Màn hình Liquid Retina XDR 16,2 inch" : "Màn hình Liquid Retina XDR 14,2 inch", "ProMotion 120Hz", "Thunderbolt 5", "HDMI và SDXC", "Thời lượng pin cả ngày"],
    tags: ["macbook", chip, "catalog expansion"],
    active: true,
    source: "https://www.apple.com/vn/macbook-pro/",
  };
}

export const expandedMacbookConfigurations: Product[] = [
  macbookProduct("macbook-pro-14-m5-pro", "MacBook Pro 14 inch M5 Pro", "Apple M5 Pro", [
    { ram: "24GB", storage: "1TB", price: 64990000 },
    { ram: "24GB", storage: "2TB", price: 74990000 },
    { ram: "48GB", storage: "2TB", price: 89990000 },
    { ram: "64GB", storage: "4TB", price: 121990000 },
  ]),
  macbookProduct("macbook-pro-14-m5-max", "MacBook Pro 14 inch M5 Max", "Apple M5 Max", [
    { ram: "36GB", storage: "2TB", price: 94990000 },
    { ram: "48GB", storage: "2TB", price: 106990000 },
    { ram: "64GB", storage: "4TB", price: 138990000 },
    { ram: "128GB", storage: "8TB", price: 202990000 },
  ]),
  macbookProduct("macbook-pro-16-m5-max", "MacBook Pro 16 inch M5 Max", "Apple M5 Max", [
    { ram: "36GB", storage: "2TB", price: 109990000 },
    { ram: "48GB", storage: "2TB", price: 121990000 },
    { ram: "64GB", storage: "4TB", price: 153990000 },
    { ram: "128GB", storage: "8TB", price: 217990000 },
  ]),
];

type PartSeed = [slug: string, name: string, price: number, compatibility: string, partType: string];
const partImage = "/products/iphone-17-pro.png";
const applePartsSource = "https://support.apple.com/self-service-repair";
const partSeeds: PartSeed[] = [
  ["linh-kien-man-hinh-iphone-13", "Màn hình OLED iPhone 13", 3290000, "iPhone 13", "Màn hình"],
  ["linh-kien-man-hinh-iphone-13-pro-max", "Màn hình OLED iPhone 13 Pro Max", 5890000, "iPhone 13 Pro Max", "Màn hình"],
  ["linh-kien-man-hinh-iphone-14", "Màn hình OLED iPhone 14", 3990000, "iPhone 14", "Màn hình"],
  ["linh-kien-man-hinh-iphone-14-pro-max", "Màn hình OLED iPhone 14 Pro Max", 7490000, "iPhone 14 Pro Max", "Màn hình"],
  ["linh-kien-man-hinh-iphone-15", "Màn hình OLED iPhone 15", 5690000, "iPhone 15", "Màn hình"],
  ["linh-kien-man-hinh-iphone-15-pro", "Màn hình OLED iPhone 15 Pro", 8290000, "iPhone 15 Pro", "Màn hình"],
  ["linh-kien-man-hinh-iphone-16", "Màn hình OLED iPhone 16", 6990000, "iPhone 16", "Màn hình"],
  ["linh-kien-man-hinh-iphone-16-pro-max", "Màn hình OLED iPhone 16 Pro Max", 9990000, "iPhone 16 Pro Max", "Màn hình"],
  ["linh-kien-pin-iphone-13", "Pin thay thế iPhone 13", 1290000, "iPhone 13", "Pin"],
  ["linh-kien-pin-iphone-14", "Pin thay thế iPhone 14", 1490000, "iPhone 14", "Pin"],
  ["linh-kien-pin-iphone-15", "Pin thay thế iPhone 15", 1690000, "iPhone 15", "Pin"],
  ["linh-kien-pin-iphone-16", "Pin thay thế iPhone 16", 1890000, "iPhone 16", "Pin"],
  ["linh-kien-camera-sau-iphone-14-pro", "Cụm camera sau iPhone 14 Pro", 4290000, "iPhone 14 Pro", "Camera"],
  ["linh-kien-camera-sau-iphone-15-pro-max", "Cụm camera sau iPhone 15 Pro Max", 5890000, "iPhone 15 Pro Max", "Camera"],
  ["linh-kien-camera-truoc-true-depth-iphone-15", "Camera trước TrueDepth iPhone 15", 3490000, "iPhone 15", "Camera"],
  ["linh-kien-cum-loa-iphone-13", "Cụm loa trong và loa ngoài iPhone 13", 890000, "iPhone 13", "Âm thanh"],
  ["linh-kien-cum-loa-iphone-15", "Cụm loa trong và loa ngoài iPhone 15", 1190000, "iPhone 15", "Âm thanh"],
  ["linh-kien-cong-sac-iphone-13", "Cụm cổng sạc Lightning iPhone 13", 1390000, "iPhone 13", "Cổng sạc"],
  ["linh-kien-cong-sac-usb-c-iphone-15", "Cụm cổng sạc USB-C iPhone 15", 1890000, "iPhone 15", "Cổng sạc"],
  ["linh-kien-nap-lung-iphone-14", "Kính lưng iPhone 14", 1590000, "iPhone 14", "Vỏ máy"],
  ["linh-kien-nap-lung-iphone-15-pro", "Kính lưng iPhone 15 Pro", 2490000, "iPhone 15 Pro", "Vỏ máy"],
  ["linh-kien-khung-suon-iphone-15-pro-max", "Khung sườn iPhone 15 Pro Max", 4990000, "iPhone 15 Pro Max", "Khung sườn"],
  ["linh-kien-cuon-sac-khong-day-iphone-14", "Cuộn sạc không dây iPhone 14", 1190000, "iPhone 14", "Sạc không dây"],
  ["linh-kien-motor-rung-iphone-15", "Taptic Engine iPhone 15", 990000, "iPhone 15", "Motor rung"],
];

export const iphoneRepairParts: Product[] = partSeeds.map(([slug, name, price, compatibility, partType], index) => ({
  slug,
  name,
  brand: "Apple Service Parts",
  category: "phu-kien",
  image: partImage,
  badge: "Linh kiện sửa chữa",
  tagline: `${partType} tương thích ${compatibility}; kỹ thuật viên kiểm tra trước khi lắp đặt.`,
  description: `Linh kiện ${partType.toLowerCase()} dành cho ${compatibility}. Giá chưa bao gồm công lắp đặt và có thể thay đổi theo chất lượng linh kiện, tình trạng máy và chính sách bảo hành.`,
  price: formatPrice(price),
  sellingPrice: formatPrice(price),
  stock: 3 + (index % 7),
  colors: ["#d9dde3"],
  specs: [partType, `Tương thích ${compatibility}`, "Kiểm tra máy trước khi thay", "Kỹ thuật viên lắp đặt", "Bảo hành linh kiện theo phiếu sửa chữa"],
  tags: ["linh kiện", "sửa chữa", partType, compatibility, "catalog expansion"],
  active: true,
  source: applePartsSource,
}));

export const retailExpansionProducts: Product[] = [
  ...retailLaptopProducts,
  ...expandedMacbookConfigurations,
  ...iphoneRepairParts,
];
