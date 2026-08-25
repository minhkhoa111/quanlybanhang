import type { ManagedProduct } from "@/db/products";

export type EditableCategory = "iphone" | "samsung" | "android" | "ipad" | "macbook" | "mac-mini-studio" | "imac" | "laptop";

export type TechnicalField = {
  key: string;
  label: string;
  placeholder: string;
  suggestions?: string[];
};

export type ProductFieldConfig = {
  title: string;
  description: string;
  storageLabel: string;
  storagePlaceholder: string;
  storageOptions: string[];
  ramLabel: string;
  ramPlaceholder: string;
  ramOptions: string[];
  versionLabel: string;
  versionPlaceholder: string;
  versionOptions: string[];
  sizeLabel: string;
  sizePlaceholder: string;
  sizeOptions: string[];
  technicalFields: TechnicalField[];
};

export const CATEGORY_OPTIONS: Array<[EditableCategory, string]> = [
  ["iphone", "iPhone"],
  ["samsung", "Samsung"],
  ["android", "Android khác"],
  ["ipad", "iPad"],
  ["macbook", "MacBook"],
  ["mac-mini-studio", "Mac mini & Mac Studio"],
  ["imac", "iMac"],
  ["laptop", "Laptop Windows"],
];

const phoneStorage = ["64GB", "128GB", "256GB", "512GB", "1TB", "2TB"];
const computerStorage = ["256GB", "512GB", "1TB", "2TB", "4TB", "8TB"];

export const PRODUCT_FIELD_CONFIG: Record<EditableCategory, ProductFieldConfig> = {
  iphone: {
    title: "Cấu hình iPhone",
    description: "Nhập dung lượng, phiên bản phân phối, màu và giá riêng cho từng lựa chọn.",
    storageLabel: "Dung lượng",
    storagePlaceholder: "256GB",
    storageOptions: phoneStorage,
    ramLabel: "RAM (nếu cần)",
    ramPlaceholder: "8GB",
    ramOptions: ["4GB", "6GB", "8GB", "12GB"],
    versionLabel: "Phiên bản",
    versionPlaceholder: "Chính hãng VN/A",
    versionOptions: ["Chính hãng VN/A", "Quốc tế", "eSIM", "SIM vật lý + eSIM"],
    sizeLabel: "Kích thước màn hình",
    sizePlaceholder: "6.3 inch",
    sizeOptions: ["4.7 inch", "5.4 inch", "6.1 inch", "6.3 inch", "6.5 inch", "6.7 inch", "6.9 inch"],
    technicalFields: [
      { key: "screen", label: "Màn hình", placeholder: "Super Retina XDR OLED, 120Hz" },
      { key: "chip", label: "Chip xử lý", placeholder: "Apple A18 Pro" },
      { key: "camera", label: "Camera", placeholder: "Camera chính 48MP, tele 5x" },
      { key: "battery", label: "Pin / sạc", placeholder: "MagSafe, USB-C, xem video đến 27 giờ" },
      { key: "os", label: "Hệ điều hành", placeholder: "iOS" },
    ],
  },
  samsung: {
    title: "Cấu hình Samsung Galaxy",
    description: "Quản lý RAM, bộ nhớ, phiên bản SIM, màu và giá của từng cấu hình Galaxy.",
    storageLabel: "Bộ nhớ trong",
    storagePlaceholder: "256GB",
    storageOptions: phoneStorage,
    ramLabel: "RAM",
    ramPlaceholder: "12GB",
    ramOptions: ["4GB", "6GB", "8GB", "12GB", "16GB"],
    versionLabel: "Phiên bản",
    versionPlaceholder: "Chính hãng Việt Nam",
    versionOptions: ["Chính hãng Việt Nam", "Quốc tế", "1 SIM + eSIM", "2 SIM"],
    sizeLabel: "Kích thước màn hình",
    sizePlaceholder: "6.8 inch",
    sizeOptions: ["6.1 inch", "6.2 inch", "6.4 inch", "6.6 inch", "6.7 inch", "6.8 inch", "6.9 inch"],
    technicalFields: [
      { key: "screen", label: "Màn hình", placeholder: "Dynamic AMOLED 2X, 120Hz" },
      { key: "chip", label: "Chip xử lý", placeholder: "Snapdragon / Exynos" },
      { key: "camera", label: "Camera", placeholder: "Camera chính, tele, góc siêu rộng" },
      { key: "battery", label: "Pin / sạc", placeholder: "5000mAh, sạc nhanh 45W" },
      { key: "os", label: "Hệ điều hành", placeholder: "Android, One UI" },
    ],
  },
  android: {
    title: "Cấu hình điện thoại Android",
    description: "Nhập RAM, bộ nhớ, mạng di động, màu và giá theo từng phiên bản.",
    storageLabel: "Bộ nhớ trong",
    storagePlaceholder: "256GB",
    storageOptions: phoneStorage,
    ramLabel: "RAM",
    ramPlaceholder: "12GB",
    ramOptions: ["4GB", "6GB", "8GB", "12GB", "16GB", "24GB"],
    versionLabel: "Phiên bản",
    versionPlaceholder: "Chính hãng Việt Nam",
    versionOptions: ["Chính hãng Việt Nam", "Quốc tế", "4G", "5G", "2 SIM"],
    sizeLabel: "Kích thước màn hình",
    sizePlaceholder: "6.67 inch",
    sizeOptions: ["6.1 inch", "6.4 inch", "6.5 inch", "6.67 inch", "6.7 inch", "6.78 inch", "6.8 inch"],
    technicalFields: [
      { key: "screen", label: "Màn hình", placeholder: "AMOLED, 120Hz, độ sáng tối đa" },
      { key: "chip", label: "Chip xử lý", placeholder: "Snapdragon / Dimensity / Kirin" },
      { key: "camera", label: "Camera", placeholder: "Camera chính và các tiêu cự hỗ trợ" },
      { key: "battery", label: "Pin / sạc", placeholder: "Dung lượng pin và công suất sạc" },
      { key: "os", label: "Hệ điều hành", placeholder: "Android / HyperOS / ColorOS / EMUI" },
    ],
  },
  ipad: {
    title: "Cấu hình iPad",
    description: "Nhập dung lượng, kết nối Wi-Fi/Cellular, kích thước, màu và giá.",
    storageLabel: "Dung lượng",
    storagePlaceholder: "256GB",
    storageOptions: ["64GB", "128GB", "256GB", "512GB", "1TB", "2TB"],
    ramLabel: "RAM (nếu công bố)",
    ramPlaceholder: "8GB",
    ramOptions: ["4GB", "6GB", "8GB", "16GB"],
    versionLabel: "Kết nối",
    versionPlaceholder: "Wi-Fi",
    versionOptions: ["Wi-Fi", "Wi-Fi + Cellular 5G", "Nano-SIM + eSIM"],
    sizeLabel: "Kích thước màn hình",
    sizePlaceholder: "11 inch",
    sizeOptions: ["8.3 inch", "10.9 inch", "11 inch", "12.9 inch", "13 inch"],
    technicalFields: [
      { key: "screen", label: "Màn hình", placeholder: "Liquid Retina / Ultra Retina XDR" },
      { key: "chip", label: "Chip xử lý", placeholder: "Apple M4 / A16" },
      { key: "camera", label: "Camera", placeholder: "Camera sau và camera trước Center Stage" },
      { key: "accessory", label: "Phụ kiện hỗ trợ", placeholder: "Apple Pencil Pro, Magic Keyboard" },
      { key: "os", label: "Hệ điều hành", placeholder: "iPadOS" },
    ],
  },
  macbook: {
    title: "Cấu hình MacBook",
    description: "Nhập RAM hợp nhất, SSD, chip, kích thước, màu và giá cho từng cấu hình.",
    storageLabel: "SSD",
    storagePlaceholder: "512GB",
    storageOptions: computerStorage,
    ramLabel: "RAM hợp nhất",
    ramPlaceholder: "16GB",
    ramOptions: ["8GB", "16GB", "18GB", "24GB", "32GB", "36GB", "48GB", "64GB", "96GB", "128GB"],
    versionLabel: "Chip / phiên bản",
    versionPlaceholder: "Apple M5",
    versionOptions: ["Apple M1", "Apple M2", "Apple M3", "Apple M4", "Apple M4 Pro", "Apple M4 Max", "Apple M5", "Apple M5 Pro", "Apple M5 Max"],
    sizeLabel: "Kích thước màn hình",
    sizePlaceholder: "14.2 inch",
    sizeOptions: ["13.3 inch", "13.6 inch", "14.2 inch", "15.3 inch", "16.2 inch"],
    technicalFields: [
      { key: "screen", label: "Màn hình", placeholder: "Liquid Retina / Liquid Retina XDR" },
      { key: "cpuGpu", label: "CPU / GPU", placeholder: "CPU 10 lõi, GPU 10 lõi" },
      { key: "ports", label: "Cổng kết nối", placeholder: "Thunderbolt, HDMI, MagSafe, SDXC" },
      { key: "battery", label: "Pin", placeholder: "Thời lượng sử dụng và công suất sạc" },
      { key: "os", label: "Hệ điều hành", placeholder: "macOS" },
    ],
  },
  "mac-mini-studio": {
    title: "Cấu hình Mac mini / Mac Studio",
    description: "Nhập RAM hợp nhất, SSD, chip và giá riêng cho từng cấu hình máy bàn Apple.",
    storageLabel: "SSD",
    storagePlaceholder: "512GB",
    storageOptions: computerStorage,
    ramLabel: "RAM hợp nhất",
    ramPlaceholder: "24GB",
    ramOptions: ["16GB", "24GB", "32GB", "36GB", "48GB", "64GB", "96GB", "128GB", "192GB", "256GB", "512GB"],
    versionLabel: "Chip / phiên bản",
    versionPlaceholder: "Apple M4",
    versionOptions: ["Apple M2", "Apple M2 Pro", "Apple M2 Max", "Apple M2 Ultra", "Apple M3 Ultra", "Apple M4", "Apple M4 Pro", "Apple M4 Max"],
    sizeLabel: "Dòng máy",
    sizePlaceholder: "Mac mini",
    sizeOptions: ["Mac mini", "Mac Studio"],
    technicalFields: [
      { key: "cpuGpu", label: "CPU / GPU", placeholder: "CPU 14 lõi, GPU 32 lõi" },
      { key: "ports", label: "Cổng kết nối", placeholder: "Thunderbolt 5, HDMI, Ethernet, USB-C" },
      { key: "display", label: "Màn hình hỗ trợ", placeholder: "Hỗ trợ tối đa năm màn hình" },
      { key: "network", label: "Kết nối mạng", placeholder: "Wi-Fi 6E, Bluetooth 5.3, 10Gb Ethernet" },
      { key: "os", label: "Hệ điều hành", placeholder: "macOS" },
    ],
  },
  imac: {
    title: "Cấu hình iMac",
    description: "Nhập RAM hợp nhất, SSD, chip, màu và giá cho từng phiên bản iMac.",
    storageLabel: "SSD",
    storagePlaceholder: "256GB",
    storageOptions: computerStorage,
    ramLabel: "RAM hợp nhất",
    ramPlaceholder: "16GB",
    ramOptions: ["8GB", "16GB", "24GB", "32GB"],
    versionLabel: "Chip / phiên bản",
    versionPlaceholder: "Apple M4 10CPU 10GPU",
    versionOptions: ["Apple M1", "Apple M3 8CPU 8GPU", "Apple M3 8CPU 10GPU", "Apple M4 8CPU 8GPU", "Apple M4 10CPU 10GPU"],
    sizeLabel: "Kích thước màn hình",
    sizePlaceholder: "24 inch",
    sizeOptions: ["21.5 inch", "24 inch", "27 inch"],
    technicalFields: [
      { key: "screen", label: "Màn hình", placeholder: "Retina 4.5K 24 inch, 500 nit" },
      { key: "cpuGpu", label: "CPU / GPU", placeholder: "CPU 10 lõi, GPU 10 lõi" },
      { key: "camera", label: "Camera", placeholder: "Camera 12MP Center Stage" },
      { key: "ports", label: "Cổng kết nối", placeholder: "Thunderbolt / USB 4, USB-C, Ethernet" },
      { key: "os", label: "Hệ điều hành", placeholder: "macOS" },
    ],
  },
  laptop: {
    title: "Cấu hình Laptop Windows",
    description: "Nhập CPU, RAM, SSD, GPU, màn hình và giá cho từng cấu hình bán.",
    storageLabel: "SSD",
    storagePlaceholder: "1TB",
    storageOptions: computerStorage,
    ramLabel: "RAM",
    ramPlaceholder: "32GB",
    ramOptions: ["8GB", "16GB", "24GB", "32GB", "48GB", "64GB", "96GB", "128GB"],
    versionLabel: "CPU / phiên bản",
    versionPlaceholder: "Intel Core Ultra 9",
    versionOptions: ["Intel Core Ultra 7", "Intel Core Ultra 9", "AMD Ryzen 9", "AMD Ryzen AI 9", "Intel Core i9"],
    sizeLabel: "Kích thước màn hình",
    sizePlaceholder: "16 inch",
    sizeOptions: ["13.3 inch", "14 inch", "15.6 inch", "16 inch", "17.3 inch", "18 inch"],
    technicalFields: [
      { key: "screen", label: "Màn hình", placeholder: "OLED/Mini LED, độ phân giải, tần số quét" },
      { key: "gpu", label: "Card đồ họa", placeholder: "NVIDIA GeForce RTX 5080" },
      { key: "ports", label: "Cổng kết nối", placeholder: "Thunderbolt, HDMI, USB-A, LAN" },
      { key: "battery", label: "Pin / sạc", placeholder: "Dung lượng pin và công suất adapter" },
      { key: "os", label: "Hệ điều hành", placeholder: "Windows 11 Home" },
    ],
  },
};

export function editableCategory(category?: ManagedProduct["category"]): EditableCategory {
  if (category === "ipad" || category === "tablet") return "ipad";
  if (category === "mac-mini-studio" || category === "imac") return category;
  if (category?.startsWith("macbook")) return "macbook";
  if (category === "laptop") return "laptop";
  if (category === "samsung" || category === "android") return category;
  return "iphone";
}

export function technicalValuesFromSpecs(specs: string[] = []) {
  const values: Record<string, string> = {};
  for (const config of Object.values(PRODUCT_FIELD_CONFIG)) {
    for (const field of config.technicalFields) {
      if (values[field.key]) continue;
      const prefix = `${field.label}:`;
      const line = specs.find((item) => item.toLocaleLowerCase("vi").startsWith(prefix.toLocaleLowerCase("vi")));
      if (line) values[field.key] = line.slice(prefix.length).trim();
    }
  }
  return values;
}
