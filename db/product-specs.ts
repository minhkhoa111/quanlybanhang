import type { Product } from "@/app/products";

type SpecProduct = Pick<Product, "slug" | "name" | "category" | "specs">;

function firstMatch(specs: string[], pattern: RegExp) {
  return specs.find((spec) => pattern.test(spec));
}

function storageFrom(product: SpecProduct) {
  const fromName = product.name.match(/\b(\d+\s?(?:GB|TB))\b/i)?.[1];
  if (fromName) return fromName.replace(/\s+/g, "").toUpperCase();
  const values = product.specs.filter((spec) => /^\d+\s?(?:GB|TB)$/i.test(spec.trim()));
  return values.at(-1)?.replace(/\s+/g, "").toUpperCase();
}

function ramFrom(product: SpecProduct) {
  const storage = storageFrom(product);
  return product.specs
    .filter((spec) => /^\d+\s?GB$/i.test(spec.trim()))
    .map((spec) => spec.replace(/\s+/g, "").toUpperCase())
    .find((value) => value !== storage);
}

function compactPhoneSpecs(product: SpecProduct) {
  const screen = firstMatch(product.specs, /inch/i);
  const processor = firstMatch(product.specs, /snapdragon|dimensity|exynos|helio|\bSD\s/i);
  const camera = firstMatch(product.specs, /MP|Leica|Hasselblad/i);
  const storage = storageFrom(product);
  const ram = ramFrom(product);

  return [
    screen && `Màn hình ${screen.replace(/inches?/i, "inch")}`,
    processor && `Vi xử lý ${processor}`,
    ram && `RAM ${ram}`,
    storage && `Bộ nhớ trong ${storage}`,
    camera && (/MP/i.test(camera) ? `Camera chính ${camera}` : `Hệ thống camera ${camera}`),
    product.category === "samsung" ? "Hệ điều hành Android với giao diện One UI" : "Hệ điều hành Android",
  ].filter((spec): spec is string => Boolean(spec));
}

function iphoneSpecs(product: SpecProduct) {
  const storage = storageFrom(product);
  const withStorage = (specs: string[]) => [
    ...specs,
    storage ? `Bộ nhớ trong ${storage}` : "",
  ].filter(Boolean);

  if (product.slug === "iphone-13") {
    return withStorage([
      "Màn hình Super Retina XDR OLED 6,1 inch",
      "Chip A15 Bionic, CPU 6 lõi và GPU 4 lõi",
      "Neural Engine 16 lõi",
      "Hệ thống camera kép 12MP: Chính và Ultra Wide",
      "RAM 4GB theo thông tin nhà cung cấp",
      "Kháng nước và bụi IP68",
      "Kết nối 5G, Wi-Fi 6 và cổng Lightning",
      "Hệ điều hành iOS",
    ]);
  }

  if (product.slug === "iphone-14") {
    return withStorage([
      "Màn hình Super Retina XDR OLED 6,1 inch",
      "Chip A15 Bionic, CPU 6 lõi và GPU 5 lõi",
      "Neural Engine 16 lõi",
      "Hệ thống camera kép 12MP: Chính và Ultra Wide",
      "RAM 6GB theo thông tin nhà cung cấp",
      "Kháng nước và bụi IP68",
      "Kết nối 5G, Wi-Fi 6 và cổng Lightning",
      "Hệ điều hành iOS",
    ]);
  }

  if (product.slug.startsWith("iphone-15-plus")) {
    return withStorage([
      "Màn hình Super Retina XDR OLED 6,7 inch với Dynamic Island",
      "Chip A16 Bionic, CPU 6 lõi và GPU 5 lõi",
      "Hệ thống camera kép với camera chính 48MP và Ultra Wide 12MP",
      "Telephoto 2x đạt chất lượng quang học",
      "RAM 6GB theo thông tin nhà cung cấp",
      "Kháng nước và bụi IP68",
      "Kết nối 5G, Wi-Fi 6 và cổng USB-C",
      "Hệ điều hành iOS",
    ]);
  }

  if (product.slug === "iphone-15" || product.slug.startsWith("iphone-15-")) {
    return withStorage([
      "Màn hình Super Retina XDR OLED 6,1 inch với Dynamic Island",
      "Chip A16 Bionic, CPU 6 lõi và GPU 5 lõi",
      "Hệ thống camera kép với camera chính 48MP và Ultra Wide 12MP",
      "Telephoto 2x đạt chất lượng quang học",
      "RAM 6GB theo thông tin nhà cung cấp",
      "Kháng nước và bụi IP68",
      "Kết nối 5G, Wi-Fi 6 và cổng USB-C",
      "Hệ điều hành iOS",
    ]);
  }

  if (product.slug.startsWith("iphone-16-pro-max")) {
    return withStorage([
      "Màn hình Super Retina XDR OLED 6,9 inch, ProMotion 120Hz",
      "Chip A18 Pro, CPU 6 lõi và GPU 6 lõi",
      "Neural Engine 16 lõi và hỗ trợ Apple Intelligence",
      "Camera Fusion 48MP, Ultra Wide 48MP và Telephoto 5x 12MP",
      "RAM 8GB theo thông tin nhà cung cấp",
      "Kháng nước và bụi IP68",
      "Kết nối 5G, Wi-Fi 7 và cổng USB-C hỗ trợ USB 3",
      "Hệ điều hành iOS",
    ]);
  }

  if (product.slug === "iphone-16e") {
    return withStorage([
      "Màn hình Super Retina XDR OLED 6,1 inch",
      "Chip A18, CPU 6 lõi và GPU 4 lõi",
      "Neural Engine 16 lõi và hỗ trợ Apple Intelligence",
      "Camera Fusion 48MP tích hợp Telephoto 2x",
      "Kháng nước và bụi IP68",
      "Kết nối 5G, Wi-Fi 6 và cổng USB-C",
      "Thời gian xem video lên đến 26 giờ",
      "Hệ điều hành iOS",
    ]);
  }

  if (product.slug === "iphone-16" || product.slug.startsWith("iphone-16-plus")) {
    const plus = product.slug.includes("plus");
    return withStorage([
      `Màn hình Super Retina XDR OLED ${plus ? "6,7" : "6,1"} inch với Dynamic Island`,
      "Chip A18, CPU 6 lõi và GPU 5 lõi",
      "Neural Engine 16 lõi và hỗ trợ Apple Intelligence",
      "Camera Fusion 48MP, Telephoto 2x và Ultra Wide 12MP",
      "RAM 8GB theo thông tin nhà cung cấp",
      "Kháng nước và bụi IP68",
      "Kết nối 5G, Wi-Fi 7 và cổng USB-C",
      "Hệ điều hành iOS",
    ]);
  }

  if (product.slug === "iphone-air-256gb") {
    return withStorage([
      "Màn hình Super Retina XDR OLED 6,5 inch, ProMotion 120Hz",
      "Chip A19 Pro với Neural Accelerators",
      "Camera Fusion 48MP",
      "Thiết kế titan dày 5,64mm, trọng lượng 165g",
      "Hỗ trợ Apple Intelligence",
      "Kháng nước và bụi IP68",
      "Kết nối 5G, Wi-Fi 7 và cổng USB-C",
      "Hệ điều hành iOS",
    ]);
  }

  if (product.slug === "iphone-17e") {
    return withStorage([
      "Màn hình Super Retina XDR OLED 6,1 inch",
      "Chip A19, CPU 6 lõi và GPU 4 lõi với Neural Accelerators",
      "Neural Engine 16 lõi và hỗ trợ Apple Intelligence",
      "Camera Fusion 48MP tích hợp Telephoto 2x",
      "Kháng nước và bụi IP68",
      "MagSafe và sạc không dây Qi2 lên đến 15W",
      "Kết nối 5G, Wi-Fi 6 và cổng USB-C",
      "Hệ điều hành iOS",
    ]);
  }

  if (product.slug.startsWith("iphone-17-pro-max")) {
    return withStorage([
      "Màn hình Super Retina XDR OLED 6,9 inch, ProMotion 120Hz",
      "Chip A19 Pro, CPU 6 lõi và GPU 6 lõi với Neural Accelerators",
      "Neural Engine 16 lõi và hỗ trợ Apple Intelligence",
      "Hệ thống ba camera Fusion 48MP",
      "Thời gian xem video lên đến 37 giờ",
      "Kháng nước và bụi IP68",
      "Kết nối 5G, Wi-Fi 7, Bluetooth 6 và cổng USB-C hỗ trợ USB 3",
      "Hệ điều hành iOS",
    ]);
  }

  if (product.slug.startsWith("iphone-17-pro")) {
    return withStorage([
      "Màn hình Super Retina XDR OLED 6,3 inch, ProMotion 120Hz",
      "Chip A19 Pro, CPU 6 lõi và GPU 6 lõi với Neural Accelerators",
      "Neural Engine 16 lõi và hỗ trợ Apple Intelligence",
      "Hệ thống ba camera Fusion 48MP",
      "Kháng nước và bụi IP68",
      "Kết nối 5G, Wi-Fi 7, Bluetooth 6 và cổng USB-C hỗ trợ USB 3",
      "Hệ điều hành iOS",
    ]);
  }

  if (product.slug.startsWith("iphone-17")) {
    return withStorage([
      "Màn hình Super Retina XDR OLED 6,3 inch, ProMotion 120Hz",
      "Chip A19, CPU 6 lõi và GPU 5 lõi với Neural Accelerators",
      "Neural Engine 16 lõi và hỗ trợ Apple Intelligence",
      "Hệ thống camera 48MP Dual Fusion",
      "Kháng nước và bụi IP68",
      "Kết nối 5G, Wi-Fi 7 và cổng USB-C",
      "Hệ điều hành iOS",
    ]);
  }

  return null;
}

export function buildDisplaySpecs(product: SpecProduct) {
  if (product.specs.length >= 8) return product.specs;
  const appleSpecs = iphoneSpecs(product);
  if (appleSpecs) return appleSpecs;
  if (product.category === "android" || product.category === "samsung") {
    return compactPhoneSpecs(product);
  }
  return product.specs;
}
