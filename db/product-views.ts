import { env } from "cloudflare:workers";

type Bindings = { DB: D1Database };
type ProductViewRow = { slug: string; name: string; views: number; visitors: number };

function db() {
  const binding = (env as unknown as Bindings).DB;
  if (!binding) throw new Error("Cơ sở dữ liệu chưa sẵn sàng.");
  return binding;
}

let storeReady: Promise<void> | null = null;

export async function ensureProductViewStore() {
  if (storeReady) return storeReady;
  storeReady = initializeProductViewStore().catch((error) => { storeReady = null; throw error; });
  return storeReady;
}

async function initializeProductViewStore() {
  await db().batch([
    db().prepare(`CREATE TABLE IF NOT EXISTS product_views (
      id TEXT PRIMARY KEY,
      product_slug TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      viewed_at INTEGER NOT NULL
    )`),
    db().prepare("CREATE INDEX IF NOT EXISTS product_views_slug_date_idx ON product_views(product_slug, viewed_at)"),
    db().prepare("CREATE INDEX IF NOT EXISTS product_views_visitor_idx ON product_views(visitor_id, product_slug, viewed_at)"),
  ]);
}

export async function recordProductView(productSlug: string, visitorId: string) {
  await ensureProductViewStore();
  const cutoff = Date.now() - 30 * 60 * 1000;
  const recent = await db().prepare(
    "SELECT id FROM product_views WHERE product_slug = ? AND visitor_id = ? AND viewed_at >= ? LIMIT 1",
  ).bind(productSlug, visitorId, cutoff).first();
  if (recent) return false;
  await db().prepare("INSERT INTO product_views (id, product_slug, visitor_id, viewed_at) VALUES (?, ?, ?, ?)")
    .bind(crypto.randomUUID(), productSlug, visitorId, Date.now()).run();
  return true;
}

export async function getProductViewStats() {
  try {
    await ensureProductViewStore();
    const day = 24 * 60 * 60 * 1000;
    const vietnamOffset = 7 * 60 * 60 * 1000;
    const startOfToday = Math.floor((Date.now() + vietnamOffset) / day) * day - vietnamOffset;
    const [summary, today, products] = await Promise.all([
      db().prepare("SELECT COUNT(*) views, COUNT(DISTINCT visitor_id) visitors FROM product_views").first<{ views: number; visitors: number }>(),
      db().prepare("SELECT COUNT(*) views, COUNT(DISTINCT visitor_id) visitors FROM product_views WHERE viewed_at >= ?").bind(startOfToday).first<{ views: number; visitors: number }>(),
      db().prepare(`SELECT pv.product_slug slug, COALESCE(p.name, pv.product_slug) name,
        COUNT(*) views, COUNT(DISTINCT pv.visitor_id) visitors
        FROM product_views pv LEFT JOIN products p ON p.slug = pv.product_slug
        GROUP BY pv.product_slug, p.name ORDER BY views DESC LIMIT 8`).all<ProductViewRow>(),
    ]);
    return {
      totalViews: Number(summary?.views || 0),
      uniqueVisitors: Number(summary?.visitors || 0),
      todayViews: Number(today?.views || 0),
      todayVisitors: Number(today?.visitors || 0),
      products: products.results.map((row) => ({ ...row, views: Number(row.views), visitors: Number(row.visitors) })),
    };
  } catch {
    return { totalViews: 0, uniqueVisitors: 0, todayViews: 0, todayVisitors: 0, products: [] as ProductViewRow[] };
  }
}
