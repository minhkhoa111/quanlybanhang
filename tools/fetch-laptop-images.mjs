import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, "app/retail-expansion-products.ts");
const outputDirectory = path.join(projectRoot, "public/products/laptops");
const manifestPath = path.join(projectRoot, "app/laptop-image-manifest.json");
const curatedSourcesPath = path.join(projectRoot, "tools/laptop-image-sources.json");
const source = await readFile(sourcePath, "utf8");
const seedBlock = source.match(/expandedLaptopSeeds:[\s\S]*?= \[([\s\S]*?)\n\];\n\nexport const retailLaptopProducts/)?.[1] ?? "";
const products = [...seedBlock.matchAll(/\{ slug: "([^"]+)", name: "([^"]+)", brand: "([^"]+)"[^\n]+\}/g)]
  .map(([, slug, name, brand]) => ({ slug, name, brand }));

if (products.length !== 57) throw new Error(`Expected 57 laptop seeds, found ${products.length}.`);
await mkdir(outputDirectory, { recursive: true });
const curatedSources = JSON.parse(await readFile(curatedSourcesPath, "utf8"));

const commonTokens = new Set(["laptop", "gaming", "edition", "oled", "plus", "pro", "ai", "studio", "mobile", "workstation"]);

function normalize(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function decodeAttribute(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function candidatesFromHtml(html) {
  return [...html.matchAll(/class="iusc"[^>]*\sm="([^"]+)"/g)].flatMap(([, encoded]) => {
    try {
      const value = JSON.parse(decodeAttribute(encoded));
      return value.murl && value.t ? [{ imageUrl: value.murl, thumbnailUrl: value.turl, sourcePage: value.purl, title: value.t }] : [];
    } catch {
      return [];
    }
  });
}

function scoreCandidate(product, candidate) {
  const title = normalize(candidate.title);
  const haystack = normalize(`${candidate.title} ${candidate.sourcePage} ${candidate.imageUrl}`);
  const name = normalize(product.name);
  const brand = normalize(product.brand);
  const tokens = name.split(" ").filter((token) => token.length >= 2 && !commonTokens.has(token));
  const modelTokens = tokens.filter((token) => /\d/.test(token) && token.length >= 3);
  let score = title.includes(name) ? 120 : 0;
  if (haystack.includes(brand)) score += 18;
  for (const token of tokens) if (haystack.includes(token)) score += /\d/.test(token) ? 14 : 4;
  const hasModelMatch = modelTokens.length === 0 || modelTokens.some((token) => haystack.includes(token));
  if (!hasModelMatch || !haystack.includes(brand)) return -1;
  if (/logo|icon|accessor|bag|case|charger|desktop|monitor/.test(title)) score -= 80;
  return score;
}

function extensionFor(contentType, url) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("avif")) return "avif";
  if (contentType.includes("gif")) return "gif";
  const fromUrl = url.match(/\.(jpe?g|png|webp|avif)(?:\?|$)/i)?.[1]?.toLowerCase();
  return fromUrl === "jpeg" ? "jpg" : fromUrl || "jpg";
}

async function search(product, suffix = "") {
  const query = `\"${product.name}\" ${product.brand} laptop ${suffix}`.trim();
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1&mkt=vi-VN`;
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131 Safari/537.36" }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Search failed: ${response.status}`);
  return candidatesFromHtml(await response.text())
    .map((candidate) => ({ ...candidate, score: scoreCandidate(product, candidate) }))
    .filter((candidate) => candidate.score >= 20)
    .sort((left, right) => right.score - left.score);
}

async function downloadCandidate(product, candidate, filenameSuffix = "") {
  for (const url of [candidate.imageUrl, candidate.thumbnailUrl].filter(Boolean)) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", Referer: candidate.sourcePage || "https://www.bing.com/" }, signal: AbortSignal.timeout(20_000) });
      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || !contentType.startsWith("image/")) continue;
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 12_000) continue;
      const extension = extensionFor(contentType, url);
      const filename = `${product.slug}${filenameSuffix}.${extension}`;
      await writeFile(path.join(outputDirectory, filename), bytes);
      return {
        path: `/products/laptops/${filename}`,
        verifiedTitle: candidate.title,
        sourcePage: candidate.sourcePage,
        originalImage: candidate.imageUrl,
        bytes: bytes.length,
        score: candidate.score,
      };
    } catch {
      // Try the next candidate or Bing thumbnail.
    }
  }
  return null;
}

async function curatedCandidate(product) {
  const source = curatedSources[product.slug];
  if (!source) return null;
  let imageUrl = source.image;
  let title = product.name;
  if (!imageUrl) {
    const page = await fetch(source.page, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36" },
      signal: AbortSignal.timeout(20_000),
      redirect: "follow",
    });
    if (!page.ok) throw new Error(`Curated product page failed: ${page.status}`);
    const html = await page.text();
    imageUrl = metaContent(html, "og:image") || metaContent(html, "twitter:image");
    title = metaContent(html, "og:title") || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || product.name;
  }
  if (!imageUrl) throw new Error("Curated source has no product image");
  return {
    imageUrl: new URL(imageUrl, source.page).href,
    sourcePage: source.page,
    title,
    score: 999,
  };
}

function duckDuckGoResultUrls(html) {
  return [...html.matchAll(/class="result__a"[^>]+href="([^"]+)"/g)].flatMap(([, rawUrl]) => {
    const decoded = decodeAttribute(rawUrl);
    try {
      const url = new URL(decoded, "https://duckduckgo.com");
      const target = url.searchParams.get("uddg");
      return [target ? decodeURIComponent(target) : decoded];
    } catch {
      return [];
    }
  });
}

function metaContent(html, property) {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, "i"),
  ];
  return patterns.map((pattern) => html.match(pattern)?.[1]).find(Boolean)?.replaceAll("&amp;", "&");
}

async function pageCandidates(product) {
  const query = `\"${product.name}\" ${product.brand}`;
  const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) return [];
  const urls = duckDuckGoResultUrls(await response.text()).slice(0, 10);
  const candidates = [];
  for (const sourcePage of urls) {
    try {
      const page = await fetch(sourcePage, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(15_000), redirect: "follow" });
      const contentType = page.headers.get("content-type") ?? "";
      if (!page.ok || !contentType.includes("text/html")) continue;
      const html = await page.text();
      const title = metaContent(html, "og:title") || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "";
      const imageUrl = metaContent(html, "og:image") || metaContent(html, "twitter:image");
      if (!imageUrl) continue;
      const candidate = { imageUrl: new URL(imageUrl, sourcePage).href, sourcePage, title };
      const score = scoreCandidate(product, candidate);
      if (score >= 20) candidates.push({ ...candidate, score });
    } catch {
      // Ignore inaccessible product pages.
    }
  }
  return candidates.sort((left, right) => right.score - left.score);
}

async function fetchProduct(product) {
  try {
    const candidate = await curatedCandidate(product);
    if (candidate) {
      const downloaded = await downloadCandidate(product, candidate);
      if (downloaded) {
        const gallery = [];
        const gallerySources = curatedSources[product.slug]?.gallery ?? [];
        for (const [index, imageUrl] of gallerySources.entries()) {
          const galleryImage = await downloadCandidate(product, { ...candidate, imageUrl, thumbnailUrl: null }, `-${index + 2}`);
          if (galleryImage?.path) gallery.push(galleryImage.path);
        }
        return [product.slug, {
          name: product.name,
          brand: product.brand,
          ...downloaded,
          ...(gallery.length ? { gallery } : {}),
          curated: true,
        }];
      }
    }
  } catch (error) {
    return [product.slug, { name: product.name, brand: product.brand, error: error instanceof Error ? error.message : "Curated image failed" }];
  }
  const searches = ["product photo", "official", "review"];
  const seen = new Set();
  for (const suffix of searches) {
    let candidates = [];
    try {
      candidates = await search(product, suffix);
    } catch {
      continue;
    }
    for (const candidate of candidates.slice(0, 10)) {
      if (seen.has(candidate.imageUrl)) continue;
      seen.add(candidate.imageUrl);
      const downloaded = await downloadCandidate(product, candidate);
      if (downloaded) return [product.slug, { name: product.name, brand: product.brand, ...downloaded }];
    }
  }
  try {
    for (const candidate of await pageCandidates(product)) {
      const downloaded = await downloadCandidate(product, candidate);
      if (downloaded) return [product.slug, { name: product.name, brand: product.brand, ...downloaded }];
    }
  } catch {
    // Report the product as unresolved below.
  }
  return [product.slug, { name: product.name, brand: product.brand, error: "No verified image found" }];
}

let manifest = {};
try {
  manifest = JSON.parse(await readFile(manifestPath, "utf8"));
} catch {
  // First run: start with an empty manifest.
}
const queue = products;
const workers = Array.from({ length: 4 }, async () => {
  while (queue.length) {
    const product = queue.shift();
    if (!product) return;
    const [slug, result] = await fetchProduct(product);
    manifest[slug] = result;
    process.stdout.write(`${result.path ? "✓" : "✗"} ${product.name}\n`);
  }
});

await Promise.all(workers);
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
const completed = Object.values(manifest).filter((item) => item.path).length;
console.log(`Saved ${completed}/${products.length} verified product images.`);
if (completed !== products.length) process.exitCode = 2;
