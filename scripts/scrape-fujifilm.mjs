import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outputImgDir = path.join(rootDir, "public", "products", "cameras", "fujifilm");
fs.mkdirSync(outputImgDir, { recursive: true });

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchPage(pageUrl) {
  const res = await fetch(pageUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${pageUrl}: ${res.status}`);
  return await res.text();
}

async function downloadImage(url, filepath) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      },
    });
    if (!res.ok) return false;
    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(arrayBuffer));
    return true;
  } catch (err) {
    console.error(`Error downloading ${url}:`, err.message);
    return false;
  }
}

async function main() {
  console.log("Starting scraping Fujifilm products from mayanhhoangto.com...");
  const scrapedProducts = [];
  const seenSlugs = new Set();

  for (let page = 1; page <= 4; page++) {
    const url = page === 1
      ? "https://mayanhhoangto.com/mirrorless/mirrorless-fujifirm/"
      : `https://mayanhhoangto.com/mirrorless/mirrorless-fujifirm/page/${page}/`;
    console.log(`Fetching page ${page}: ${url}...`);
    try {
      const html = await fetchPage(url);
      
      // Match each product container: <div class="product-small col ..."> ... </div></div></div>
      const productBlocks = html.split('<div class="product-small col');
      for (let i = 1; i < productBlocks.length; i++) {
        const block = productBlocks[i];
        
        // Extract title & link
        const titleMatch = block.match(/woocommerce-loop-product__title[^>]*><a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/i) ||
                           block.match(/<a\s+href="([^"]+)"[^>]*class="[^"]*woocommerce-LoopProduct-link[^"]*"[^>]*>([^<]+)<\/a>/i);
        if (!titleMatch) continue;

        const productLink = titleMatch[1];
        let rawName = titleMatch[2]
          .replace(/&#8211;/g, "-")
          .replace(/&#8217;/g, "'")
          .replace(/&amp;/g, "&")
          .trim();

        // Clean up title
        const cleanName = rawName.trim();
        let slug = slugify(cleanName);
        if (!slug || seenSlugs.has(slug)) {
          slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        }
        seenSlugs.add(slug);

        // Extract image
        let imgUrl = "";
        const imgMatch = block.match(/<img[^>]+src="([^">]+\.(?:jpg|jpeg|png|webp))"/i);
        if (imgMatch) {
          imgUrl = imgMatch[1];
        }

        // Extract price
        let price = "Liên hệ";
        let salePrice = "";
        
        // Check for ins/del (sale price)
        const insMatch = block.match(/<ins[^>]*>.*?<bdi>([\d,.]+).*?<\/bdi>/is);
        const delMatch = block.match(/<del[^>]*>.*?<bdi>([\d,.]+).*?<\/bdi>/is);
        if (insMatch && delMatch) {
          salePrice = `${insMatch[1].replace(/,/g, ".")}đ`;
          price = `${delMatch[1].replace(/,/g, ".")}đ`;
        } else {
          const singlePriceMatch = block.match(/<span class="woocommerce-Price-amount amount".*?<bdi>([\d,.]+).*?<\/bdi>/is);
          if (singlePriceMatch) {
            price = `${singlePriceMatch[1].replace(/,/g, ".")}đ`;
            salePrice = price;
          }
        }

        scrapedProducts.push({
          slug,
          name: cleanName,
          price,
          salePrice: salePrice || price,
          originalImgUrl: imgUrl,
          productLink,
        });
      }
    } catch (err) {
      console.error(`Failed on page ${page}:`, err.message);
    }
  }

  console.log(`Found ${scrapedProducts.length} Fujifilm cameras. Downloading images...`);

  const finalFujifilmProducts = [];
  for (let i = 0; i < scrapedProducts.length; i++) {
    const item = scrapedProducts[i];
    const ext = item.originalImgUrl.toLowerCase().endsWith(".png") ? ".png" : ".jpg";
    const filename = `${item.slug}${ext}`;
    const localFilePath = path.join(outputImgDir, filename);
    const publicPath = `/products/cameras/fujifilm/${filename}`;

    console.log(`[${i + 1}/${scrapedProducts.length}] Downloading image for ${item.name}...`);
    let downloaded = false;
    if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).size > 1000) {
      downloaded = true;
    } else if (item.originalImgUrl) {
      downloaded = await downloadImage(item.originalImgUrl, localFilePath);
    }

    finalFujifilmProducts.push({
      slug: item.slug,
      name: item.name,
      brand: "FUJIFILM",
      category: "may-anh",
      image: downloaded ? publicPath : (item.originalImgUrl || "/placeholder.png"),
      images: [downloaded ? publicPath : (item.originalImgUrl || "/placeholder.png")],
      badge: "Fujifilm Chính Hãng",
      tagline: `${item.name} chính hãng tại Infinity Store. Cảm biến X-Trans, giả lập màu phim Film Simulation huyền thoại.`,
      description: `Sản phẩm ${item.name} phân phối chính hãng. Bảo hành 12 - 24 tháng, hỗ trợ trả góp 0%, giao nhanh 2 giờ, đổi mới trong 30 ngày. Đầy đủ hóa đơn VAT và bảo hành điện tử chính hãng.`,
      price: item.price,
      sellingPrice: item.salePrice || item.price,
      salePrice: item.salePrice || item.price,
      stock: 15,
      status: "active",
      active: true,
      colors: ["#111111", "#银色"],
      colorOptions: [
        { name: "Đen (Black)", hex: "#111111" },
        { name: "Bạc (Silver)", hex: "#d1d5db" }
      ],
      specs: [
        "Chính hãng bảo hành 12 tháng",
        "Cảm biến X-Trans cao cấp",
        "Film Simulation màu phim",
        "Quay video 4K / 6.2K"
      ],
      source: item.productLink,
    });
  }

  const jsonOut = path.join(__dirname, "scraped-fujifilm.json");
  fs.writeFileSync(jsonOut, JSON.stringify(finalFujifilmProducts, null, 2), "utf8");
  console.log(`Done! Scraped ${finalFujifilmProducts.length} items saved to ${jsonOut}`);
}

main().catch(console.error);

