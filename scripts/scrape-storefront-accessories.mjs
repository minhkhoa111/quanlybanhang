import fs from "fs";

const urls = [
  "https://cellphones.com.vn/phu-kien/apple.html",
  "https://cellphones.com.vn/phu-kien/cu-cap-sac.html",
  "https://cellphones.com.vn/phu-kien/pin-du-phong.html",
  "https://cellphones.com.vn/phu-kien/bao-da-op-lung.html"
];

async function run() {
  const allProducts = [];
  const seenSlugs = new Set();

  for (const url of urls) {
    console.log("Fetching:", url);
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      const html = await res.text();

      // Find all product__link blocks
      const regex = /<a[^>]*href="([^"]+)"[^>]*class="product__link[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
      let match;
      while ((match = regex.exec(html)) !== null) {
        const href = match[1];
        const content = match[2];

        // Slug from href: https://cellphones.com.vn/apple-airpods-4.html -> apple-airpods-4
        const slugMatch = href.match(/cellphones\.com\.vn\/([^.]+)\.html/);
        if (!slugMatch) continue;
        const slug = slugMatch[1];
        if (seenSlugs.has(slug)) continue;

        // Name
        const nameMatch = content.match(/<div[^>]*class="product__name"[^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/);
        const name = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, "").trim() : "";
        if (!name) continue;

        // Image
        const imgMatch = content.match(/src="([^"]+)"/);
        let image = imgMatch ? imgMatch[1] : "";
        if (!image || image.includes("placehoder") || image.includes("placeholder")) {
          const dataSrcMatch = content.match(/data-src="([^"]+)"/);
          if (dataSrcMatch) image = dataSrcMatch[1];
        }

        // Price
        const priceMatch = content.match(/<p[^>]*class="product__price--show"[^>]*>([\s\S]*?)<\/p>/);
        const price = priceMatch ? priceMatch[1].replace(/<[^>]+>/g, "").trim() : "590.000đ";

        // Brand heuristic
        let brand = "Apple";
        const lowerName = name.toLowerCase();
        if (lowerName.includes("anker")) brand = "Anker";
        else if (lowerName.includes("samsung")) brand = "Samsung";
        else if (lowerName.includes("uag")) brand = "UAG";
        else if (lowerName.includes("spigen")) brand = "Spigen";
        else if (lowerName.includes("baseus")) brand = "Baseus";
        else if (lowerName.includes("ugreen")) brand = "Ugreen";
        else if (lowerName.includes("xiaomi")) brand = "Xiaomi";
        else if (lowerName.includes("jbl")) brand = "JBL";
        else if (lowerName.includes("sony")) brand = "Sony";
        else if (lowerName.includes("jcpal")) brand = "JCPAL";
        else if (lowerName.includes("belkin")) brand = "Belkin";
        else if (lowerName.includes("tomtoc")) brand = "Tomtoc";

        seenSlugs.add(slug);
        allProducts.push({
          slug,
          name,
          brand,
          category: "phu-kien",
          image: image || "/brand/infinity-store-logo.png",
          price,
          salePrice: price,
          sellingPrice: price,
          badge: "Chính hãng",
          tagline: `${name} chính hãng tại Infinity Store. Bảo hành 12 tháng, giao nhanh 2h.`,
          description: `Sản phẩm ${name} phân phối chính hãng bởi Infinity Store. Cam kết chất lượng, đầy đủ hóa đơn VAT, hỗ trợ đổi mới theo tiêu chuẩn.`,
          colors: ["#111111"],
          specs: ["Chính hãng", "Bảo hành 12 tháng", "1 đổi 1 30 ngày"],
          source: href
        });

        if (allProducts.length >= 50) break;
      }
    } catch (e) {
      console.error("Error fetching", url, e.message);
    }
    if (allProducts.length >= 50) break;
  }

  console.log(`Successfully scraped ${allProducts.length} accessories!`);
  fs.writeFileSync("scripts/scraped-accessories.json", JSON.stringify(allProducts, null, 2));
}

run();
