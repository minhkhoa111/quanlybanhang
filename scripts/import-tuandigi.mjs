import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const inputs = [
  ["ipad", 5],
  ["laptop-cu", 5],
  ["phu-kien", 4],
].flatMap(([category, pageCount]) => Array.from({ length: pageCount }, (_, index) => [
  `/tmp/tuandigi-${category}-${index + 1}.html`,
  category,
]));

function decode(value) {
  return value
    .replace(/&#8211;|&#x2013;/gi, "-")
    .replace(/&#8212;|&#x2014;/gi, "-")
    .replace(/&#8217;|&#x2019;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#\d+;/g, "")
    .trim();
}

function text(value = "") {
  return decode(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " "));
}

function pick(block, pattern) {
  const match = block.match(pattern);
  return text(match?.[1] ?? "");
}

function slugify(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}

function number(value) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

function brandFor(category, title) {
  if (category === "phu-kien") {
    return title.match(/^(Apple|Logitech|Baseus|Samsung|Anker|Belkin|UGREEN|JBL|Sony)/i)?.[1] ?? "Phụ kiện";
  }
  return title.match(/^(iPhone|iPad|MacBook|Mac|Samsung|Dell|HP|Lenovo|Asus|Acer|MSI|Huawei|Xiaomi|Redmi|Oppo)/i)?.[1] ?? "Apple";
}

function specsFor(category, block) {
  const rows = [...block.matchAll(/tdgc-sp-row">([\s\S]*?)<\/span>/g)].map((match) => text(match[1])).filter(Boolean);
  return rows.slice(0, 5);
}

const records = [];
for (const [file, category] of inputs) {
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  const blocks = html.match(/<a class="tdgc"[\s\S]*?<\/a>/g) ?? [];
  for (const block of blocks) {
    const href = pick(block, /<a class="tdgc" href="([^"]+)/);
    const title = pick(block, /tdgc-title">([^<]+)/);
    const image = pick(block, /data-src="([^"]+)/);
    const priceText = pick(block, /tdgc-price">([^<]+)/);
    const regularPriceText = pick(block, /tdgc-regular">([^<]+)/);
    if (!href || !title || !image || !priceText) continue;
    const slug = `${category}-${slugify(title)}`;
    const extension = path.extname(new URL(image).pathname).toLowerCase() || ".jpg";
    const localName = `${slug}${extension}`;
    records.push({
      slug,
      name: title,
      brand: brandFor(category, title),
      category,
      imageUrl: image,
      image: `/products/tuandigi/${localName}`,
      price: priceText,
      regularPrice: regularPriceText || undefined,
      numericPrice: number(priceText),
      specs: specsFor(category, block),
      source: href,
    });
  }
}

const unique = Array.from(new Map(records.map((record) => [record.slug, record])).values());
const output = path.join(root, "app", "tuandigi-imported-products.json");
fs.writeFileSync(output, `${JSON.stringify(unique, null, 2)}\n`);
console.log(`Wrote ${unique.length} products to ${output}`);
for (const category of [...new Set(unique.map((item) => item.category))]) {
  console.log(`${category}: ${unique.filter((item) => item.category === category).length}`);
}
