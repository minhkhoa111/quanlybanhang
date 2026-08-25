import { env } from "cloudflare:workers";
import { products as seedProducts, type Product } from "@/app/products";
import catalogEnrichment from "@/app/catalog-enrichment.json";
import { applyCurrentCatalogOverride } from "@/app/current-catalog";
import { buildDisplaySpecs } from "@/db/product-specs";

type Bindings = {
  DB: D1Database;
};

export type ManagedProduct = Product & {
  id: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
};

type ProductInput = Omit<ManagedProduct, "createdAt" | "updatedAt">;
type ProductStatus = NonNullable<Product["status"]>;

// Managed desktop categories remain available alongside imported used-stock categories:
// 'mac-mini-studio' and 'imac'.

const catalogImageOverrides: Record<string, string> = {
  "oppo-a3-pro": "/products/oppo-a3-pro.png",
  "oppo-find-x8-pro": "/products/oppo-find-x8-pro.png",
  "oppo-reno-13-pro": "/products/oppo-reno-13-pro.png",
  "xiaomi-14t-pro": "/products/xiaomi-14t-pro.png",
  "xiaomi-15": "/products/xiaomi-15.png",
  "xiaomi-15-ultra": "/products/xiaomi-15-ultra.png",
  "redmi-14c": "/products/redmi-14c.jpg",
  "redmi-note-14-pro": "/products/redmi-note-14-pro.png",
};

const catalogSeedProducts = seedProducts.map((product) => ({
  ...product,
  ...((catalogEnrichment as Record<string, Partial<Product>>)[product.slug] ?? {}),
}));

function db(): D1Database {
  const binding = (env as unknown as Bindings).DB;
  if (!binding) throw new Error("Cơ sở dữ liệu sản phẩm chưa sẵn sàng.");
  return binding;
}

let readyPromise: Promise<void> | null = null;

export function ensureProductStore(): Promise<void> {
  if (!readyPromise) {
    readyPromise = initializeProductStore().catch((error) => {
      readyPromise = null;
      throw error;
    });
  }
  return readyPromise;
}

async function initializeProductStore() {
  const database = db();
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      category TEXT NOT NULL,
      sku TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL,
      images_json TEXT NOT NULL DEFAULT '[]',
      badge TEXT NOT NULL,
      tagline TEXT NOT NULL,
      price TEXT NOT NULL,
      cost_price TEXT NOT NULL DEFAULT '',
      selling_price TEXT NOT NULL DEFAULT '',
      sale_price TEXT NOT NULL DEFAULT '',
      stock INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      tags_json TEXT NOT NULL DEFAULT '[]',
      seo_title TEXT NOT NULL DEFAULT '',
      seo_description TEXT NOT NULL DEFAULT '',
      variants_json TEXT NOT NULL DEFAULT '[]',
      colors_json TEXT NOT NULL,
      specs_json TEXT NOT NULL,
      featured INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      source TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`),
    database.prepare(
      "CREATE INDEX IF NOT EXISTS products_category_active_idx ON products(category, active)",
    ),
  ]);
  await ensureProductColumns(database);

  const now = Date.now();
  await database.batch(
    catalogSeedProducts.map((product) =>
      database
        .prepare(`INSERT OR IGNORE INTO products
          (id, slug, name, brand, category, image, images_json, badge, tagline, price, selling_price,
           variants_json, colors_json, specs_json, featured, active, source, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`)
        .bind(
          `seed-${product.slug}`,
          product.slug,
          product.name,
          product.brand,
          product.category,
          product.image,
          JSON.stringify(product.images?.length ? product.images : [product.image]),
          product.badge,
          product.tagline,
          product.price,
          product.sellingPrice ?? product.price,
          JSON.stringify(product.variants ?? []),
          JSON.stringify(product.colors),
          JSON.stringify(product.specs),
          product.featured ? 1 : 0,
          product.source,
          now,
          now,
        ),
    ),
  );
}

export async function getPublicProducts(
  category?: Product["category"],
): Promise<ManagedProduct[]> {
  try {
    await ensureProductStore();
    const statement = category === "macbook"
      ? db().prepare(
          "SELECT * FROM products WHERE active = 1 AND category IN ('macbook', 'macbook-air', 'macbook-pro') ORDER BY featured DESC, created_at ASC",
        )
      : category
        ? db().prepare(
            "SELECT * FROM products WHERE active = 1 AND category = ? ORDER BY featured DESC, created_at ASC",
          ).bind(category)
        : db().prepare(
            "SELECT * FROM products WHERE active = 1 AND category NOT IN ('tablet') ORDER BY featured DESC, created_at ASC",
          );
    const result = await statement.all<Record<string, unknown>>();
    return consolidatePublicProducts(result.results.map(mapRow).map(enrichProduct));
  } catch {
    return consolidatePublicProducts(catalogSeedProducts
      .filter((product) => {
        if (!category) return product.category !== "tablet";
        if (category === "macbook") return product.category.startsWith("macbook");
        return product.category === category;
      })
      .map((product, index) => ({
        ...product,
        id: `seed-${product.slug}`,
        active: true,
        createdAt: index,
        updatedAt: index,
      }))
      .map(enrichProduct));
  }
}

// Dev helper: reset the product table and re-seed from `app/products.ts`.
// This is intended for local development only. It deletes all rows and then
// reinserts the seed products, ensuring the D1 store matches `app/products.ts`.
export async function reseedProductStore() {
  const database = db();
  await ensureProductStore();
  // Delete all rows so we can insert fresh seeds.
  await database.prepare("DELETE FROM products").run();

  const now = Date.now();
  await database.batch(
    catalogSeedProducts.map((product) =>
      database
        .prepare(`INSERT OR REPLACE INTO products
          (id, slug, name, brand, category, image, images_json, badge, tagline, price, selling_price,
           variants_json, colors_json, specs_json, featured, active, source, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(
          `seed-${product.slug}`,
          product.slug,
          product.name,
          product.brand,
          product.category,
          product.image,
          JSON.stringify(product.images?.length ? product.images : [product.image]),
          product.badge,
          product.tagline,
          product.price,
          product.sellingPrice ?? product.price,
          JSON.stringify(product.variants ?? []),
          JSON.stringify(product.colors),
          JSON.stringify(product.specs),
          product.featured ? 1 : 0,
          1,
          product.source,
          now,
          now,
        ),
    ),
  );
}

export async function getProductBySlug(
  slug: string,
): Promise<ManagedProduct | undefined> {
  try {
    await ensureProductStore();
    const row = await db()
      .prepare("SELECT * FROM products WHERE slug = ? AND active = 1 LIMIT 1")
      .bind(slug)
      .first<Record<string, unknown>>();
    let target = row ? enrichProduct(mapRow(row)) : undefined;
    if (!target) {
      const candidates = await db()
        .prepare("SELECT * FROM products WHERE active = 1 AND slug LIKE ? ORDER BY created_at ASC")
        .bind(`${slug}-%`)
        .all<Record<string, unknown>>();
      target = candidates.results
        .map(mapRow)
        .map(enrichProduct)
        .find((item) => publicFamilyKey(item.slug) === slug);
    }
    if (!target) return undefined;
    const family = publicFamilyKey(target.slug);
    const related = await db()
      .prepare("SELECT * FROM products WHERE active = 1 AND category = ? ORDER BY created_at ASC")
      .bind(target.category)
      .all<Record<string, unknown>>();
    return consolidatePublicProducts(related.results.map(mapRow).map(enrichProduct))
      .find((product) => publicFamilyKey(product.slug) === family);
  } catch {
    const target = catalogSeedProducts.find((item) => item.slug === slug || publicFamilyKey(item.slug) === slug);
    if (!target) return undefined;
    return consolidatePublicProducts(catalogSeedProducts
      .filter((item) => item.category === target.category)
      .map((product, index) => enrichProduct({ ...product, id: `seed-${product.slug}`, active: true, createdAt: index, updatedAt: index })))
      .find((product) => publicFamilyKey(product.slug) === publicFamilyKey(slug));
  }
}

export async function getManagedProducts(): Promise<ManagedProduct[]> {
  await ensureProductStore();
  const result = await db()
    .prepare("SELECT * FROM products ORDER BY active DESC, updated_at DESC")
    .all<Record<string, unknown>>();
  return result.results.map(mapRow).map(enrichProduct);
}

export async function getManagedProductById(id: string): Promise<ManagedProduct | undefined> {
  await ensureProductStore();
  const row = await db()
    .prepare("SELECT * FROM products WHERE id = ? LIMIT 1")
    .bind(id)
    .first<Record<string, unknown>>();
  return row ? enrichProduct(mapRow(row)) : undefined;
}

export async function saveManagedProduct(input: ProductInput) {
  await ensureProductStore();
  const now = Date.now();
  await db()
    .prepare(`INSERT INTO products
      (id, slug, name, brand, category, sku, description, image, images_json, badge, tagline, price,
       cost_price, selling_price, sale_price, stock, status, tags_json, seo_title, seo_description,
       variants_json, colors_json, specs_json, featured, active, source, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        slug = excluded.slug,
        name = excluded.name,
        brand = excluded.brand,
        category = excluded.category,
        sku = excluded.sku,
        description = excluded.description,
        image = excluded.image,
        images_json = excluded.images_json,
        badge = excluded.badge,
        tagline = excluded.tagline,
        price = excluded.price,
        cost_price = excluded.cost_price,
        selling_price = excluded.selling_price,
        sale_price = excluded.sale_price,
        stock = excluded.stock,
        status = excluded.status,
        tags_json = excluded.tags_json,
        seo_title = excluded.seo_title,
        seo_description = excluded.seo_description,
        variants_json = excluded.variants_json,
        colors_json = excluded.colors_json,
        specs_json = excluded.specs_json,
        featured = excluded.featured,
        active = excluded.active,
        source = excluded.source,
        updated_at = excluded.updated_at`)
    .bind(
      input.id,
      input.slug,
      input.name,
      input.brand,
      input.category,
      input.sku ?? "",
      input.description ?? "",
      input.image,
      JSON.stringify(input.images?.length ? input.images : [input.image]),
      input.badge,
      input.tagline,
      input.price,
      input.costPrice ?? "",
      input.sellingPrice ?? input.price,
      input.salePrice ?? "",
      Number(input.stock ?? 0),
      input.status ?? (input.active ? "active" : "inactive"),
      JSON.stringify(input.tags ?? []),
      input.seoTitle ?? "",
      input.seoDescription ?? "",
      JSON.stringify(input.variants ?? []),
      JSON.stringify(input.colors),
      JSON.stringify(input.specs),
      input.featured ? 1 : 0,
      input.active ? 1 : 0,
      input.source,
      now,
      now,
    )
    .run();
}

export async function setProductActive(id: string, active: boolean) {
  await ensureProductStore();
  await db()
    .prepare("UPDATE products SET active = ?, status = ?, updated_at = ? WHERE id = ?")
    .bind(active ? 1 : 0, active ? "active" : "inactive", Date.now(), id)
    .run();
}

export async function deleteManagedProducts(ids: string[]) {
  await Promise.all(ids.filter(Boolean).map((id) => deleteManagedProduct(id)));
}

export async function deleteManagedProduct(id: string) {
  await ensureProductStore();
  if (id.startsWith("seed-")) {
    await setProductActive(id, false);
    return;
  }

  await db().prepare("DELETE FROM products WHERE id = ?").bind(id).run();
}

function mapRow(row: Record<string, unknown>): ManagedProduct {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    brand: String(row.brand),
    category: String(row.category) as Product["category"],
    sku: String(row.sku ?? ""),
    description: String(row.description ?? ""),
    image: String(row.image),
    images: parseStringArray(row.images_json).length ? parseStringArray(row.images_json) : [String(row.image)],
    badge: String(row.badge),
    tagline: String(row.tagline),
    price: String(row.price),
    costPrice: String(row.cost_price ?? ""),
    sellingPrice: String(row.selling_price ?? row.price ?? ""),
    salePrice: String(row.sale_price ?? ""),
    stock: Number(row.stock ?? 0),
    status: normalizeStatus(row.status, Number(row.active) === 1),
    tags: parseStringArray(row.tags_json),
    seoTitle: String(row.seo_title ?? ""),
    seoDescription: String(row.seo_description ?? ""),
    variants: parseVariants(row.variants_json),
    colors: parseStringArray(row.colors_json),
    specs: parseStringArray(row.specs_json),
    featured: Number(row.featured) === 1,
    active: Number(row.active) === 1,
    source: String(row.source ?? ""),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

async function ensureProductColumns(database: D1Database) {
  const columns: Array<[string, string]> = [
    ["sku", "TEXT NOT NULL DEFAULT ''"],
    ["description", "TEXT NOT NULL DEFAULT ''"],
    ["images_json", "TEXT NOT NULL DEFAULT '[]'"],
    ["cost_price", "TEXT NOT NULL DEFAULT ''"],
    ["selling_price", "TEXT NOT NULL DEFAULT ''"],
    ["sale_price", "TEXT NOT NULL DEFAULT ''"],
    ["stock", "INTEGER NOT NULL DEFAULT 0"],
    ["status", "TEXT NOT NULL DEFAULT 'active'"],
    ["tags_json", "TEXT NOT NULL DEFAULT '[]'"],
    ["seo_title", "TEXT NOT NULL DEFAULT ''"],
    ["seo_description", "TEXT NOT NULL DEFAULT ''"],
    ["variants_json", "TEXT NOT NULL DEFAULT '[]'"],
  ];

  for (const [name, definition] of columns) {
    try {
      await database.prepare(`ALTER TABLE products ADD COLUMN ${name} ${definition}`).run();
    } catch {
      // Existing databases already have the column.
    }
  }
}

function parseStringArray(value: unknown): string[] {
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function parseVariants(value: unknown): NonNullable<Product["variants"]> {
  try {
    const parsed = JSON.parse(String(value ?? "[]"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeStatus(value: unknown, active: boolean): ProductStatus {
  const status = String(value ?? "");
  if (status === "draft" || status === "active" || status === "inactive") return status;
  return active ? "active" : "inactive";
}

function enrichProduct(product: ManagedProduct): ManagedProduct {
  const seed = catalogSeedProducts.find((item) => item.slug === product.slug);
  const variants = product.variants?.length ? product.variants : seed?.variants ?? [];
  const variantStorages = uniqueValues(variants.map((variant) => variant.storage));
  const inferredStorage = inferStorage(product.name, product.specs);
  const variantColors = variants
    .filter((variant) => variant.color)
    .filter((variant, index, list) => list.findIndex((item) => item.color === variant.color) === index)
    .map((variant) => ({ name: variant.color as string, hex: variant.colorHex || "#111111" }));
  return {
    ...product,
    image: catalogImageOverrides[product.slug] ?? product.image,
    images: uniqueValues([
      catalogImageOverrides[product.slug],
      product.image,
      ...(product.images ?? []),
      seed?.image,
      ...(seed?.images ?? []),
      ...variants.map((variant) => variant.image),
    ]).slice(0, 24),
    specs: buildDisplaySpecs(product),
    variants,
    colorOptions: variantColors.length ? variantColors : product.colorOptions ?? seed?.colorOptions,
    storageOptions: variantStorages.length
      ? variantStorages
      : product.storageOptions?.length
        ? product.storageOptions
        : seed?.storageOptions?.length
          ? seed.storageOptions
          : inferredStorage
            ? [inferredStorage]
            : [],
    mediaLinks: product.mediaLinks ?? seed?.mediaLinks,
  };
}

function uniqueValues(values: Array<string | undefined>) {
  return values.filter((value): value is string => Boolean(value?.trim())).filter((value, index, list) => list.indexOf(value) === index);
}

function inferStorage(name: string, specs: string[]) {
  const text = `${name} ${specs.join(" ")}`;
  const matches = [...text.matchAll(/\b(\d+(?:\.\d+)?)\s*(TB|GB)\b/gi)]
    .map((match) => `${match[1]}${match[2].toUpperCase()}`)
    .filter((value) => !/^(4|6|8|12|16|18|24|32|48|64|96)GB$/.test(value));
  return matches[0] ?? "";
}

function consolidatePublicProducts(products: ManagedProduct[]) {
  const families = new Map<string, ManagedProduct[]>();
  for (const product of products) {
    const key = publicFamilyKey(product.slug);
    families.set(key, [...(families.get(key) ?? []), product]);
  }

  return [...families.entries()].map(([family, members]) => {
    const canonical = members.find((item) => item.slug === family)
      ?? [...members].sort((left, right) => left.slug.length - right.slug.length)[0];
    const fallbackVariants = members.map((item) => ({
      id: `${item.slug}-${inferStorage(item.name, item.specs) || "base"}`,
      name: inferStorage(item.name, item.specs) || cleanPublicProductName(item.name),
      storage: inferStorage(item.name, item.specs),
      price: item.salePrice || item.sellingPrice || item.price,
      stock: item.stock,
      image: item.image,
    }));
    const variants = uniqueVariants(members.flatMap((item) => item.variants?.length ? item.variants : fallbackVariants.filter((variant) => variant.id.startsWith(`${item.slug}-`))));
    const images = uniqueValues([
      canonical.image,
      ...members.flatMap((item) => item.images ?? [item.image]),
      ...variants.map((variant) => variant.image),
    ]).slice(0, 24);
    const colorOptions = variants
      .filter((variant) => variant.color)
      .filter((variant, index, list) => list.findIndex((item) => normalizePublicOption(item.color) === normalizePublicOption(variant.color)) === index)
      .map((variant) => ({ name: variant.color as string, hex: variant.colorHex || "#a8adb4" }));
    const storageOptions = uniqueValues(variants.map((variant) => variant.storage));
    const lowestPrice = variants
      .map((variant) => moneyValue(variant.price))
      .filter((price) => price > 0)
      .sort((left, right) => left - right)[0];
    const name = cleanPublicProductName(canonical.name);

    return applyCurrentCatalogOverride(enrichProduct({
      ...canonical,
      slug: family,
      name,
      tagline: `Chọn dung lượng, màu sắc và xem giá chi tiết của ${name}.`,
      price: lowestPrice ? `${new Intl.NumberFormat("vi-VN").format(lowestPrice)}đ` : canonical.price,
      sellingPrice: lowestPrice ? `${new Intl.NumberFormat("vi-VN").format(lowestPrice)}đ` : canonical.sellingPrice,
      image: images[0] ?? canonical.image,
      images,
      variants,
      colors: colorOptions.length ? colorOptions.map((color) => color.hex) : canonical.colors,
      colorOptions: colorOptions.length ? colorOptions : canonical.colorOptions,
      storageOptions,
      stock: members.reduce((total, item) => total + Number(item.stock ?? 0), 0),
    }));
  });
}

function publicFamilyKey(slug: string) {
  return slug.replace(/-(?:128gb|256gb|512gb|1tb|2tb)$/i, "");
}

function cleanPublicProductName(name: string) {
  return name
    .replace(/^Điện thoại\s+/i, "")
    .replace(/\s*\|\s*(?:Chính hãng|Chính hãng VN\/A|Chính hãng Apple Việt Nam).*$/i, "")
    .replace(/\b(\d+)\s*(GB|TB)\b/gi, (full, amount, unit) => unit.toUpperCase() === "TB" || Number(amount) >= 128 ? "" : full)
    .replace(/\s{2,}/g, " ")
    .trim();
}

function uniqueVariants(variants: NonNullable<Product["variants"]>) {
  return variants.filter((variant, index, list) => {
    const key = [variant.storage, variant.ram, variant.version, variant.color].map(normalizePublicOption).join("|");
    return list.findIndex((item) => [item.storage, item.ram, item.version, item.color].map(normalizePublicOption).join("|") === key) === index;
  });
}

function normalizePublicOption(value?: string) {
  return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function moneyValue(value?: string) {
  return Number((value ?? "").replace(/\D/g, "")) || 0;
}
