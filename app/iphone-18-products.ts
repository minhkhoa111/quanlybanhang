import type { Product } from "./products";

// Retail list prices checked 2026-09-22. No trade-in, payment or membership discount.
// Stock remains zero until Infinity Store confirms its own inventory.
const colors = [
  { key: "do", name: "Đỏ Burgundy", hex: "#4d1822" },
  { key: "xanh", name: "Băng Thanh", hex: "#dceaf4" },
  { key: "bac", name: "Bạc", hex: "#dededc" },
  { key: "den", name: "Đen", hex: "#303134" },
];
const storages = ["256GB", "512GB", "1TB", "2TB"];
export const iphone18Products: Product[] = [
  { model: "pro", name: "iPhone 18 Pro", screen: "6,3", video: 34, prices: [38990000, 45490000, 58490000, 77990000] },
  { model: "pro-max", name: "iPhone 18 Pro Max", screen: "6,9", video: 43, prices: [41990000, 48490000, 61490000, 80990000] },
].map(({ model, name, screen, video, prices }) => {
  const slug = `iphone-18-${model}`;
  const image = (key: string) => `/products/iphone-18/${model}-${key}.png`;
  const money = (value: number) => `${value.toLocaleString("vi-VN")}đ`;
  return {
    slug, name, brand: "Apple", category: "iphone", condition: "new", status: "active", active: true,
    image: image("do"), images: colors.map((color) => image(color.key)),
    badge: "Chính thức mở bán", stock: 0, featured: true,
    tags: ["iphone-18-official"],
    price: money(prices[0]), sellingPrice: money(prices[0]),
    tagline: `${screen} inch · A20 Pro · 4 màu · 256GB đến 2TB.`,
    description: `${name} với chip A20 Pro, màn hình ${screen} inch và bốn màu sắc. Chọn dung lượng từ 256GB đến 2TB phù hợp nhu cầu của bạn.`,
    colors: colors.map((color) => color.hex), colorOptions: colors.map(({ name, hex }) => ({ name, hex })), storageOptions: storages,
    variants: storages.flatMap((storage, index) => colors.map((color) => ({
      id: `${slug}-${storage.toLowerCase()}-${color.key}`, name: `${storage} / ${color.name}`,
      storage, color: color.name, colorHex: color.hex, price: money(prices[index]), image: image(color.key), status: "active" as const,
      // Unknown variant inventory: keep selectable for browsing, product stock blocks checkout.
    }))),
    specs: [`Màn hình: Super Retina XDR OLED ${screen} inch, ProMotion đến 120Hz`, "Chip xử lý: Apple A20 Pro", "Camera sau: Hệ thống Fusion 48MP; camera chính khẩu độ thay đổi", "Camera trước: 18MP Center Stage", `Pin: Xem video đến ${video} giờ (theo Apple)`, "Thiết kế: Nhôm nguyên khối, Ceramic Shield", "Dung lượng: 256GB, 512GB, 1TB, 2TB", "Màu sắc: Đỏ Burgundy, Băng Thanh, Bạc, Đen"],
    source: `https://fptshop.com.vn/dien-thoai/${slug}`,
    mediaLinks: [],
  };
});
