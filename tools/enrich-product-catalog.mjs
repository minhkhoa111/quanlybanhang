import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const recoverOnly = process.argv.includes("--recover-only");
const databaseArgument = process.argv.find((argument) => argument.endsWith(".sqlite"));
const databasePath = databaseArgument || path.join(root, ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/faaf2b0445ab934c3aac48ddf0cdfade8f9bac050be98993748742cdd2cb05fb.sqlite");
const outputPath = path.join(root, "app/catalog-enrichment.json");
const imageRoot = path.join(root, "public/products/details");
const pageCache = new Map();
const sourceOverrides = {
  "galaxy-s25-plus": "https://cellphones.com.vn/dien-thoai-samsung-galaxy-s25-plus-512gb.html",
};
const storagePriceOverrides = {
  "iphone-15": { "128GB": "18.890.000đ", "256GB": "20.890.000đ" },
  "iphone-15-256gb": { "128GB": "18.890.000đ", "256GB": "20.890.000đ" },
  "iphone-16": { "128GB": "20.290.000đ", "256GB": "22.190.000đ", "512GB": "26.990.000đ" },
  "iphone-16-pro-max": { "256GB": "30.990.000đ", "512GB": "38.990.000đ" },
  "iphone-16-pro-max-512gb": { "256GB": "30.990.000đ", "512GB": "38.990.000đ" },
  "iphone-17-256gb": { "256GB": "24.490.000đ", "512GB": "29.790.000đ" },
  "iphone-17-512gb": { "256GB": "24.490.000đ", "512GB": "29.790.000đ" },
  "iphone-17-pro": { "256GB": "31.990.000đ", "512GB": "38.490.000đ" },
  "iphone-17-pro-512gb": { "256GB": "31.990.000đ", "512GB": "38.490.000đ" },
  "iphone-17-pro-max": { "256GB": "34.590.000đ", "512GB": "41.490.000đ", "1TB": "47.990.000đ", "2TB": "60.490.000đ" },
  "iphone-17-pro-max-512gb": { "256GB": "34.590.000đ", "512GB": "41.490.000đ", "1TB": "47.990.000đ", "2TB": "60.490.000đ" },
  "iphone-17-pro-max-1tb": { "256GB": "34.590.000đ", "512GB": "41.490.000đ", "1TB": "47.990.000đ", "2TB": "60.490.000đ" },
  "iphone-17-pro-max-2tb": { "256GB": "34.590.000đ", "512GB": "41.490.000đ", "1TB": "47.990.000đ", "2TB": "60.490.000đ" },
};

const rows = recoverOnly ? [] : JSON.parse(execFileSync("sqlite3", ["-json", databasePath, "SELECT slug,name,source,image,price FROM products WHERE active=1 AND source LIKE 'https://cellphones.com.vn/%' ORDER BY slug"], { encoding: "utf8" }) || "[]");
const existing = await readJson(outputPath, {});
const enrichment = { ...existing };

for (const [index, row] of rows.entries()) {
  process.stdout.write(`[${index + 1}/${rows.length}] ${row.slug}\n`);
  try {
    const primary = await loadPage(sourceOverrides[row.slug] || row.source);
    if (!primary) continue;
    const related = storageLinks(primary.html, row.source);
    const pages = [primary];
    for (const item of related.slice(0, 5)) {
      const page = await loadPage(item.url);
      if (page) pages.push({ ...page, storageHint: item.storage });
    }

    const variants = [];
    for (const page of uniqueBy(pages, (item) => item.url)) {
      const storage = page.storageHint || page.data.storage || inferStorage(page.data.name || row.name);
      const colors = parseColors(page.html);
      if (colors.length) {
        for (const color of colors) {
          const localImage = color.image ? await downloadImage(color.image, row.slug, `color-${slugify(color.name)}`) : "";
          variants.push({
            id: `${row.slug}-${slugify(storage || "base")}-${slugify(color.name)}`,
            name: [storage, color.name].filter(Boolean).join(" · "),
            storage,
            color: color.name,
            colorHex: colorHex(color.name),
            price: color.price || page.data.price || row.price,
            stock: 1,
            image: localImage,
          });
        }
      } else if (storage) {
        variants.push({
          id: `${row.slug}-${slugify(storage)}`,
          name: storage,
          storage,
          price: page.data.price || row.price,
          stock: 1,
          image: "",
        });
      }
    }

    const remoteImages = parseGallery(primary.html).slice(0, 8);
    const images = [];
    for (const [imageIndex, url] of remoteImages.entries()) {
      const local = await downloadImage(url, row.slug, `detail-${imageIndex + 1}`);
      if (local) images.push(local);
    }
    for (const variant of variants) if (variant.image && !images.includes(variant.image)) images.push(variant.image);

    const dedupedVariants = uniqueBy(variants, (item) => `${normalize(item.storage)}|${normalize(item.color)}`);
    const specs = primary.data.specs.length ? primary.data.specs : existing[row.slug]?.specs ?? [];
    const price = primary.data.price || row.price;
    enrichment[row.slug] = {
      price,
      sellingPrice: price,
      image: images[0] || row.image,
      images: images.length ? images : [row.image],
      specs,
      variants: dedupedVariants,
      colors: uniqueBy(dedupedVariants.filter((item) => item.color).map((item) => item.colorHex), String),
      colorOptions: uniqueBy(dedupedVariants.filter((item) => item.color).map((item) => ({ name: item.color, hex: item.colorHex })), (item) => normalize(item.name)),
      storageOptions: uniqueBy(dedupedVariants.map((item) => item.storage).filter(Boolean), normalize),
      source: primary.url,
      checkedAt: new Date().toISOString(),
    };
    await writeFile(outputPath, `${JSON.stringify(enrichment, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`  Bỏ qua: ${error instanceof Error ? error.message : String(error)}\n`);
  }
}

for (const [slug, item] of Object.entries(enrichment)) enrichment[slug] = await recoverDownloadedAssets(slug, item);
await writeFile(outputPath, `${JSON.stringify(enrichment, null, 2)}\n`);

const statements = Object.entries(enrichment).map(([slug, item]) => `UPDATE products SET price=${sql(item.price)}, selling_price=${sql(item.sellingPrice || item.price)}, image=${sql(item.image)}, images_json=${sql(JSON.stringify(item.images || []))}, specs_json=${sql(JSON.stringify(item.specs || []))}, variants_json=${sql(JSON.stringify(item.variants || []))}, colors_json=${sql(JSON.stringify(item.colors?.length ? item.colors : ["#111111"]))}, source=${sql(item.source || "")}, updated_at=${Date.now()} WHERE slug=${sql(slug)};`);
const applied = spawnSync("sqlite3", [databasePath], { input: `BEGIN;\n${statements.join("\n")}\nCOMMIT;\n`, encoding: "utf8" });
if (applied.status !== 0) throw new Error(applied.stderr || "Không cập nhật được D1 local.");
process.stdout.write(`Đã cập nhật ${Object.keys(enrichment).length} sản phẩm.\n`);

async function loadPage(url) {
  const normalizedUrl = new URL(url, "https://cellphones.com.vn").href.split("?")[0];
  if (pageCache.has(normalizedUrl)) return pageCache.get(normalizedUrl);
  const promise = (async () => {
    let finalUrl = normalizedUrl;
    let document = await fetchDocument(finalUrl);
    if ((!document.response.ok || !isProductPage(document.html)) && !new URL(finalUrl).pathname.startsWith("/dien-thoai-")) {
      const parsedUrl = new URL(finalUrl);
      finalUrl = `${parsedUrl.origin}/dien-thoai-${parsedUrl.pathname.slice(1)}`;
      document = await fetchDocument(finalUrl);
    }
    if (!document.response.ok) throw new Error(`${document.response.status} ${normalizedUrl}`);
    if (!isProductPage(document.html)) throw new Error(`Nguồn không trả dữ liệu sản phẩm: ${normalizedUrl}`);
    return { url: finalUrl, html: document.html, data: parseProduct(document.html) };
  })();
  pageCache.set(normalizedUrl, promise);
  return promise;
}

async function fetchDocument(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "accept-language": "vi-VN,vi;q=0.9,en;q=0.7",
    },
    signal: AbortSignal.timeout(20000),
  });
  return { response, html: await response.text() };
}

function isProductPage(html) {
  return /box-product-price|box-product-variants|"@type"\s*:\s*"Product"|media\/catalog\/product/i.test(html);
}

function parseProduct(html) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  let product = {};
  for (const match of scripts) {
    try {
      const parsed = JSON.parse(decode(match[1]));
      const candidates = Array.isArray(parsed) ? parsed : parsed?.["@graph"] || [parsed];
      const found = candidates.find((item) => item?.["@type"] === "Product" || (Array.isArray(item?.["@type"]) && item["@type"].includes("Product")));
      if (found) { product = found; break; }
    } catch {}
  }
  const properties = Array.isArray(product.additionalProperty) ? product.additionalProperty : [];
  const specs = properties.slice(0, 24).map((item) => `${clean(item.name)}: ${clean(item.value)}`).filter((item) => item !== ": ");
  const storageProperty = properties.find((item) => /bộ nhớ trong|dung lượng/i.test(String(item.name)));
  const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
  return {
    name: clean(product.name),
    price: formatPrice(offer?.price || offer?.lowPrice),
    storage: inferStorage(clean(storageProperty?.value) || clean(product.name)),
    specs,
  };
}

function storageLinks(html, currentUrl) {
  const result = [];
  const segmentIndex = html.indexOf("class=\"box-linked\"");
  const segment = segmentIndex >= 0 ? html.slice(segmentIndex, segmentIndex + 12000) : html;
  for (const match of segment.matchAll(/<a\s+href="([^"]+)"\s+class="item-linked[^"]*"[\s\S]{0,300}?<strong[^>]*>([^<]+)<\/strong>/gi)) {
    const storage = clean(match[2]).replace(/\s+/g, "");
    if (/\d+\s*(?:GB|TB)/i.test(storage)) result.push({ url: new URL(match[1], currentUrl).href.split("?")[0], storage });
  }
  return uniqueBy(result, (item) => item.url);
}

function parseColors(html) {
  const start = html.indexOf("box-product-variants");
  if (start < 0) return [];
  const segment = html.slice(start, start + 100000);
  const colors = [];
  for (const item of segment.matchAll(/<li[^>]+class="item-variant"[^>]*>([\s\S]*?)<\/li>/gi)) {
    const body = item[1];
    const title = body.match(/<a[^>]+title="([^"]+)"/i)?.[1] || body.match(/class="item-variant-name"[^>]*>([^<]+)/i)?.[1];
    const image = body.match(/<img[^>]+(?:media\/catalog\/product)[^>]+src="([^"]+)"/i)?.[1] || body.match(/<img[^>]+src="([^"]*media\/catalog\/product[^"]+)"/i)?.[1];
    const price = body.match(/class="item-variant-price"[^>]*>([\s\S]*?)<\/span>/i)?.[1];
    if (title) colors.push({ name: clean(title), image: fullImageUrl(decode(image || "")), price: formatPrice(clean(price)) });
  }
  return uniqueBy(colors, (item) => normalize(item.name));
}

function parseGallery(html) {
  const urls = [];
  const decoded = decode(html).replaceAll("\\/", "/");
  for (const match of decoded.matchAll(/https:\/\/cdn2\.cellphones\.com\.vn\/x\/media\/catalog\/product\/[a-z0-9_./%-]+\.(?:png|jpe?g|webp)/gi)) urls.push(match[0]);
  return uniqueBy(urls, String);
}

function fullImageUrl(url) {
  const marker = "cellphones.com.vn/media/catalog/product/";
  const index = url.indexOf(marker);
  if (index >= 0) return `https://cdn2.cellphones.com.vn/x/media/catalog/product/${url.slice(index + marker.length)}`;
  return url;
}

async function downloadImage(url, slug, label) {
  if (!url) return "";
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 InfinityCompanyCatalog/1.0" }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) return "";
  const type = response.headers.get("content-type") || "image/webp";
  if (!type.startsWith("image/")) return "";
  const extension = type.includes("png") ? "png" : type.includes("jpeg") ? "jpg" : type.includes("avif") ? "avif" : "webp";
  const folder = path.join(imageRoot, slug);
  await mkdir(folder, { recursive: true });
  const filename = `${label}-${createHash("sha1").update(url).digest("hex").slice(0, 8)}.${extension}`;
  await writeFile(path.join(folder, filename), Buffer.from(await response.arrayBuffer()));
  return `/products/details/${slug}/${filename}`;
}

async function recoverDownloadedAssets(slug, item) {
  let files = [];
  try { files = await readdir(path.join(imageRoot, slug)); } catch { return item; }
  const localImages = files.filter((file) => /\.(?:png|jpe?g|webp|avif)$/i.test(file)).map((file) => `/products/details/${slug}/${file}`);
  if (!localImages.length) return item;
  const detailImages = localImages.filter((image) => /\/detail-/.test(image));
  const colorImages = localImages.filter((image) => /\/color-/.test(image));
  const images = uniqueBy([...detailImages, ...colorImages, ...(item.images || [])], String).slice(0, 24);
  let variants = item.variants || [];
  if (!variants.some((variant) => variant.color) && colorImages.length) {
    const storage = item.storageOptions?.[0] || variants[0]?.storage || "";
    const recoveredColors = uniqueBy(colorImages.map((image) => {
      const filename = path.basename(image);
      const nameSlug = filename.replace(/^color-/, "").replace(/-[a-f0-9]{8}\.[^.]+$/i, "");
      const name = humanizeColor(nameSlug);
      return { name, image };
    }), (color) => normalize(color.name));
    variants = recoveredColors.map((color) => ({
      id: `${slug}-${slugify(storage || "base")}-${slugify(color.name)}`,
      name: [storage, color.name].filter(Boolean).join(" · "),
      storage,
      color: color.name,
      colorHex: colorHex(color.name),
      price: item.price,
      stock: 1,
      image: color.image,
    }));
  }
  const storagePrices = storagePriceOverrides[slug];
  if (storagePrices) {
    const colorVariants = variants.filter((variant) => variant.color);
    variants = Object.entries(storagePrices).flatMap(([storage, price]) => {
      if (!colorVariants.length) return [{ id: `${slug}-${slugify(storage)}`, name: storage, storage, price, stock: 1, image: detailImages[0] || item.image }];
      return colorVariants.map((variant) => ({
        ...variant,
        id: `${slug}-${slugify(storage)}-${slugify(variant.color)}`,
        name: `${storage} · ${variant.color}`,
        storage,
        price,
      }));
    });
  }
  const colorOptions = uniqueBy(variants.filter((variant) => variant.color).map((variant) => ({ name: variant.color, hex: variant.colorHex || colorHex(variant.color) })), (color) => normalize(color.name));
  return {
    ...item,
    image: detailImages[0] || item.image,
    images,
    variants,
    storageOptions: uniqueBy(variants.map((variant) => variant.storage).filter(Boolean), normalize),
    colors: colorOptions.length ? colorOptions.map((color) => color.hex) : item.colors,
    colorOptions: colorOptions.length ? colorOptions : item.colorOptions,
  };
}

function humanizeColor(value) {
  const known = {
    "xanh-mong-ket": "Xanh Mòng Két",
    "xanh-luu-ly": "Xanh Lưu Ly",
    "xanh-duong": "Xanh Dương",
    "xanh-la": "Xanh Lá",
    "titan-tu-nhien": "Titan Tự Nhiên",
    "titan-sa-mac": "Titan Sa Mạc",
    "titan-den": "Titan Đen",
    "titan-trang": "Titan Trắng",
    "trang": "Trắng",
    "den": "Đen",
    "hong": "Hồng",
    "vang": "Vàng",
    "tim": "Tím",
    "cam": "Cam",
    "bac": "Bạc",
    "xam": "Xám",
  };
  return known[value] || value.split("-").map((part) => part ? part[0].toUpperCase() + part.slice(1) : "").join(" ");
}

function inferStorage(value) {
  const matches = [...String(value).matchAll(/\b(\d+(?:\.\d+)?)\s*(TB|GB)\b/gi)]
    .map((match) => `${match[1]}${match[2].toUpperCase()}`)
    .filter((item) => item.endsWith("TB") || Number(item.replace(/\D/g, "")) >= 128);
  return matches[0] ?? "";
}

function colorHex(name) {
  const value = normalize(name);
  if (/trắng|white|bạc|silver/.test(value)) return "#e7e7e5";
  if (/đen|black|graphite/.test(value)) return "#202124";
  if (/hồng|pink/.test(value)) return "#e8b6bd";
  if (/đỏ|red/.test(value)) return "#b6232d";
  if (/vàng|gold/.test(value)) return "#d5c29f";
  if (/tím|purple/.test(value)) return "#9c8fac";
  if (/xanh lá|green|mòng két/.test(value)) return "#789f98";
  if (/xanh dương|blue|xanh biển/.test(value)) return "#738aa0";
  if (/xám|gray|grey|titan tự nhiên/.test(value)) return "#8b8d8d";
  if (/cam|orange/.test(value)) return "#d7774e";
  return "#a8adb4";
}

function formatPrice(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? `${new Intl.NumberFormat("vi-VN").format(Number(digits))}đ` : "";
}

function clean(value) {
  return decode(String(value ?? "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function decode(value) {
  return String(value ?? "").replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&nbsp;", " ").replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function normalize(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "").trim();
}

function slugify(value) {
  return normalize(value).replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
}

function uniqueBy(items, key) {
  const seen = new Set();
  return items.filter((item) => { const value = key(item); if (seen.has(value)) return false; seen.add(value); return true; });
}

function sql(value) {
  return `'${String(value ?? "").replaceAll("'", "''")}'`;
}

async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(file, "utf8")); } catch { return fallback; }
}
