import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const fujifilmJsonPath = path.join(__dirname, "scraped-fujifilm.json");
const fujifilmProducts = JSON.parse(fs.readFileSync(fujifilmJsonPath, "utf8"));

async function downloadImage(url, filepath) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" }
    });
    if (!res.ok) return false;
    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(arrayBuffer));
    return true;
  } catch (err) {
    console.error(`Download failed: ${url} - ${err.message}`);
    return false;
  }
}

const otherCameras = [
  // SONY
  {
    slug: "sony-alpha-a7-iv",
    name: "Máy ảnh Sony Alpha A7 IV (ILCE-7M4 / Body)",
    brand: "SONY",
    price: "58.990.000đ",
    salePrice: "52.990.000đ",
    remoteImg: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/o/sony-alpha-7-iv.png",
    localFile: "public/products/cameras/sony/sony-alpha-a7-iv.png",
    publicImg: "/products/cameras/sony/sony-alpha-a7-iv.png",
    badge: "Sony Alpha",
    specs: ["Cảm biến Full-Frame 33MP Exmor R", "Bộ xử lý BIONZ XR AI", "Quay 4K 60p 10-bit 4:2:2", "Lấy nét Real-time Eye AF"]
  },
  {
    slug: "sony-alpha-a7c-ii",
    name: "Máy ảnh Sony Alpha A7C II (ILCE-7CM2 / Body)",
    brand: "SONY",
    price: "52.990.000đ",
    salePrice: "47.990.000đ",
    remoteImg: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/o/sony-a7c-ii.png",
    localFile: "public/products/cameras/sony/sony-alpha-a7c-ii.png",
    publicImg: "/products/cameras/sony/sony-alpha-a7c-ii.png",
    badge: "Full-frame nhỏ gọn",
    specs: ["Cảm biến Full-Frame 33MP", "Trọng lượng chỉ 514g", "Chống rung 5 trục 7.0 stops", "Quay 4K 60p Super35"]
  },
  {
    slug: "sony-alpha-a6700",
    name: "Máy ảnh Sony Alpha A6700 (ILCE-6700 / Body)",
    brand: "SONY",
    price: "37.990.000đ",
    salePrice: "33.990.000đ",
    remoteImg: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/o/sony-a6700.png",
    localFile: "public/products/cameras/sony/sony-alpha-a6700.png",
    publicImg: "/products/cameras/sony/sony-alpha-a6700.png",
    badge: "Flagship APS-C",
    specs: ["Cảm biến APS-C 26MP BSI", "AI Processing Unit nhận diện", "Quay 4K 120p mượt mà", "Chống rung IBIS 5 trục"]
  },
  {
    slug: "sony-zv-e10-ii",
    name: "Máy ảnh Vlog Sony ZV-E10 Mark II kèm kit 16-50mm",
    brand: "SONY",
    price: "26.990.000đ",
    salePrice: "24.490.000đ",
    remoteImg: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/o/sony-zv-e10-ii.png",
    localFile: "public/products/cameras/sony/sony-zv-e10-ii.png",
    publicImg: "/products/cameras/sony/sony-zv-e10-ii.png",
    badge: "Vlog Chuyên Nghiệp",
    specs: ["Cảm biến APS-C 26MP", "Pin dung lượng cao NP-FZ100", "Micro 3 đầu thu định hướng", "Quay 4K 60p oversampled 5.6K"]
  },
  {
    slug: "sony-alpha-a7r-v",
    name: "Máy ảnh Sony Alpha A7R V (ILCE-7RM5 / Body)",
    brand: "SONY",
    price: "92.990.000đ",
    salePrice: "84.990.000đ",
    remoteImg: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/o/sony-a7r-v.png",
    localFile: "public/products/cameras/sony/sony-alpha-a7r-v.png",
    publicImg: "/products/cameras/sony/sony-alpha-a7r-v.png",
    badge: "Siêu phân giải 61MP",
    specs: ["Cảm biến Full-Frame 61MP", "Bộ xử lý AI nhận diện xe/người/chim", "Quay video 8K 24p", "Màn hình lật 4 trục đa hướng"]
  },
  {
    slug: "sony-cinema-fx3",
    name: "Máy quay phim Cinema Sony FX3 (ILME-FX3)",
    brand: "SONY",
    price: "102.000.000đ",
    salePrice: "93.990.000đ",
    remoteImg: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/o/sony-fx3.png",
    localFile: "public/products/cameras/sony/sony-cinema-fx3.png",
    publicImg: "/products/cameras/sony/sony-cinema-fx3.png",
    badge: "Cinema Line",
    specs: ["Cảm biến Full-Frame 12.1MP", "Quạt tản nhiệt quay 4K 120p không ngắt", "Hồ sơ màu S-Cinetone chuẩn điện ảnh", "Tay cầm âm thanh XLR kép"]
  },

  // CANON
  {
    slug: "canon-eos-r5-ii",
    name: "Máy ảnh Canon EOS R5 Mark II (Body)",
    brand: "CANON",
    price: "105.000.000đ",
    salePrice: "96.990.000đ",
    remoteImg: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/c/a/canon-eos-r5-mark-ii.png",
    localFile: "public/products/cameras/canon/canon-eos-r5-ii.png",
    publicImg: "/products/cameras/canon/canon-eos-r5-ii.png",
    badge: "Flagship 8K",
    specs: ["Cảm biến Stacked Full-Frame 45MP", "Bộ đôi chip DIGIC Accelerator + DIGIC X", "Quay video 8K 60p RAW", "Eye Control AF thế hệ mới"]
  },
  {
    slug: "canon-eos-r6-ii",
    name: "Máy ảnh Canon EOS R6 Mark II (Body)",
    brand: "CANON",
    price: "60.990.000đ",
    salePrice: "54.990.000đ",
    remoteImg: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/c/a/canon-eos-r6-mark-ii.png",
    localFile: "public/products/cameras/canon/canon-eos-r6-ii.png",
    publicImg: "/products/cameras/canon/canon-eos-r6-ii.png",
    badge: "Bestseller Full-frame",
    specs: ["Cảm biến Full-Frame 24.2MP", "Tốc độ chụp 40 fps điện tử", "Quay 4K 60p không crop", "Chống rung IBIS lên đến 8 stops"]
  },
  {
    slug: "canon-eos-r8",
    name: "Máy ảnh Canon EOS R8 kèm ống kính RF 24-50mm",
    brand: "CANON",
    price: "39.990.000đ",
    salePrice: "35.990.000đ",
    remoteImg: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/c/a/canon-eos-r8.png",
    localFile: "public/products/cameras/canon/canon-eos-r8.png",
    publicImg: "/products/cameras/canon/canon-eos-r8.png",
    badge: "Nhỏ nhẹ 461g",
    specs: ["Cảm biến Full-Frame 24.2MP", "Trọng lượng nhẹ nhất dòng R Full-frame", "Quay 4K 60p 10-bit Canon Log 3", "Dual Pixel CMOS AF II"]
  },
  {
    slug: "canon-eos-r50",
    name: "Máy ảnh Canon EOS R50 kèm ống kính RF-S 18-45mm",
    brand: "CANON",
    price: "18.990.000đ",
    salePrice: "16.990.000đ",
    remoteImg: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/c/a/canon-eos-r50.png",
    localFile: "public/products/cameras/canon/canon-eos-r50.png",
    publicImg: "/products/cameras/canon/canon-eos-r50.png",
    badge: "Nhập môn Vlog",
    specs: ["Cảm biến APS-C 24.2MP", "Quay 4K 30p oversampled 6K", "Chế độ Close-up Demo thông minh", "Màn hình xoay lật cảm ứng"]
  },
  {
    slug: "canon-eos-r10",
    name: "Máy ảnh Canon EOS R10 kèm ống kính RF-S 18-45mm",
    brand: "CANON",
    price: "24.990.000đ",
    salePrice: "22.990.000đ",
    remoteImg: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/c/a/canon-eos-r10.png",
    localFile: "public/products/cameras/canon/canon-eos-r10.png",
    publicImg: "/products/cameras/canon/canon-eos-r10.png",
    badge: "Tốc độ cao 23fps",
    specs: ["Cảm biến APS-C 24.2MP", "Tốc độ chụp 23 fps màn trập điện tử", "Quay 4K 60p (crop) hoặc 4K 30p sắc nét", "Lấy nét bám dính chủ thể AI"]
  },
  {
    slug: "canon-powershot-v10",
    name: "Máy quay Vlog bỏ túi Canon PowerShot V10",
    brand: "CANON",
    price: "11.500.000đ",
    salePrice: "9.990.000đ",
    remoteImg: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/c/a/canon-powershot-v10.png",
    localFile: "public/products/cameras/canon/canon-powershot-v10.png",
    publicImg: "/products/cameras/canon/canon-powershot-v10.png",
    badge: "Bỏ túi gọn gàng",
    specs: ["Cảm biến 1 inch 13.1MP", "Ống kính góc rộng 19mm tương đương", "Chân đế dựng tích hợp sẵn", "Microphone kép lọc ồn thông minh"]
  },

  // DJI
  {
    slug: "dji-osmo-pocket-3",
    name: "Camera chống rung DJI Osmo Pocket 3 Creator Combo",
    brand: "DJI",
    price: "17.490.000đ",
    salePrice: "15.890.000đ",
    remoteImg: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/j/dji-osmo-pocket-3.png",
    localFile: "public/products/cameras/dji/dji-osmo-pocket-3.png",
    publicImg: "/products/cameras/dji/dji-osmo-pocket-3.png",
    badge: "Cực Hot",
    specs: ["Cảm biến 1 inch CMOS sắc nét", "Quay 4K 120fps mượt mà", "Màn hình xoay cảm ứng OLED 2 inch", "Kèm mic không dây DJI Mic 2"]
  },
  {
    slug: "dji-osmo-action-5-pro",
    name: "Camera hành trình DJI Osmo Action 5 Pro Adventure Combo",
    brand: "DJI",
    price: "14.500.000đ",
    salePrice: "12.990.000đ",
    remoteImg: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/j/dji-action-5-pro.png",
    localFile: "public/products/cameras/dji/dji-osmo-action-5-pro.png",
    publicImg: "/products/cameras/dji/dji-osmo-action-5-pro.png",
    badge: "Thế hệ 2026",
    specs: ["Cảm biến 1/1.3 inch thế hệ mới 4nm", "Dải tương phản động Dynamic Range 13.5 stops", "Chống nước sâu 20m không cần vỏ", "Pin hoạt động đến 4 giờ liên tục"]
  },
  {
    slug: "dji-osmo-action-4",
    name: "Camera hành trình DJI Osmo Action 4 Standard Combo",
    brand: "DJI",
    price: "7.990.000đ",
    salePrice: "6.990.000đ",
    remoteImg: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/j/dji-action-4.png",
    localFile: "public/products/cameras/dji/dji-osmo-action-4.png",
    publicImg: "/products/cameras/dji/dji-osmo-action-4.png",
    badge: "Hành động đỉnh cao",
    specs: ["Cảm biến 1/1.3 inch quay đêm vượt trội", "Màu sắc 10-bit D-Log M", "Chống rung RockSteady 3.0+", "Chống đóng băng đến -20°C"]
  },
  {
    slug: "dji-avata-2",
    name: "Flycam DJI Avata 2 Fly More Combo (3 Pin)",
    brand: "DJI",
    price: "28.990.000đ",
    salePrice: "25.590.000đ",
    remoteImg: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/j/dji-avata-2.png",
    localFile: "public/products/cameras/dji/dji-avata-2.png",
    publicImg: "/products/cameras/dji/dji-avata-2.png",
    badge: "FPV Đỉnh Cao",
    specs: ["Góc siêu rộng 155° 4K 60fps HDR", "Kính DJI Goggles 3 & Điều khiển RC Motion 3", "Cảm biến định vị quang học nâng cao", "Thời gian bay 23 phút/pin"]
  },
  {
    slug: "dji-mini-4-pro",
    name: "Flycam DJI Mini 4 Pro (Kèm tay điều khiển DJI RC 2)",
    brand: "DJI",
    price: "23.990.000đ",
    salePrice: "21.690.000đ",
    remoteImg: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/j/dji-mini-4-pro.png",
    localFile: "public/products/cameras/dji/dji-mini-4-pro.png",
    publicImg: "/products/cameras/dji/dji-mini-4-pro.png",
    badge: "Dưới 249g",
    specs: ["Trọng lượng siêu nhẹ dưới 249g", "Cảm biến tránh vật cản đa hướng 360°", "Quay video dọc True Vertical Shooting 4K 60fps HDR", "Truyền hình ảnh DJI O4 xa đến 20km"]
  },
  {
    slug: "dji-mic-2",
    name: "Bộ micro thu âm không dây DJI Mic 2 (2 TX + 1 RX)",
    brand: "DJI",
    price: "9.500.000đ",
    salePrice: "8.490.000đ",
    remoteImg: "https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/j/dji-mic-2.png",
    localFile: "public/products/cameras/dji/dji-mic-2.png",
    publicImg: "/products/cameras/dji/dji-mic-2.png",
    badge: "Thu âm 32-bit Float",
    specs: ["Ghi âm nội bộ 32-bit Float chống vỡ tiếng", "Lọc ồn thông minh Intelligent Noise Cancelling", "Khoảng cách truyền 250m", "Thời lượng pin đến 18 giờ kèm hộp sạc"]
  }
];

async function main() {
  console.log("Downloading other cameras (Sony, Canon, DJI)...");
  const processedOther = [];

  for (const item of otherCameras) {
    const localPath = path.join(rootDir, item.localFile);
    console.log(`Downloading ${item.name}...`);
    let downloaded = false;
    if (fs.existsSync(localPath) && fs.statSync(localPath).size > 1000) {
      downloaded = true;
    } else {
      downloaded = await downloadImage(item.remoteImg, localPath);
    }

    processedOther.push({
      slug: item.slug,
      name: item.name,
      brand: item.brand,
      category: "may-anh",
      image: downloaded ? item.publicImg : item.remoteImg,
      images: [downloaded ? item.publicImg : item.remoteImg],
      badge: item.badge,
      tagline: `${item.name} chính hãng tại Infinity Store. Đầy đủ phụ kiện, bảo hành 12 - 24 tháng chính hãng.`,
      description: `Sản phẩm ${item.name} được phân phối chính hãng. Bảo hành toàn quốc, hỗ trợ trả góp 0%, giao nhanh 2 giờ, hỗ trợ tư vấn cài đặt và cân chỉnh thông số thiết bị chuyên nghiệp.`,
      price: item.price,
      sellingPrice: item.salePrice,
      salePrice: item.salePrice,
      stock: 20,
      status: "active",
      active: true,
      colors: ["#111111"],
      specs: item.specs,
      source: "https://cellphones.com.vn",
    });
  }

  // Combine FUJIFILM (48 items) + SONY/CANON/DJI (18 items)
  const allCameras = [...fujifilmProducts, ...processedOther];
  console.log(`Total cameras assembled: ${allCameras.length} (Fujifilm: ${fujifilmProducts.length}, Others: ${processedOther.length})`);

  // Write TypeScript file app/camera-products.ts
  const code = `import type { Product } from "./products";

export const cameraProducts: Product[] = ${JSON.stringify(allCameras, null, 2)};
`;

  const tsOut = path.join(rootDir, "app", "camera-products.ts");
  fs.writeFileSync(tsOut, code, "utf8");
  console.log(`Successfully generated ${tsOut}!`);
}

main().catch(console.error);

