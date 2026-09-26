import type { getManagedProducts } from "@/db/products";

type ManagedProduct = Awaited<ReturnType<typeof getManagedProducts>>[number];
export type ProductListQuery = { q?: string; category?: string; status?: string; stock?: string; sort?: string; page?: string };

export function moneyValue(value?: string) {
  return Number(value?.replace(/[^0-9]/g, "")) || 0;
}

export function productSummary(product: ManagedProduct) {
  const variants = (product.variants ?? []).filter((variant) => variant.status !== "inactive");
  const stock = variants.length ? variants.reduce((sum, variant) => sum + Number(variant.stock ?? 0), 0) : Number(product.stock ?? 0);
  const prices = variants.map((variant) => moneyValue(variant.salePrice || variant.price)).filter((price) => price > 0);
  const price = prices.length ? Math.min(...prices) : moneyValue(product.salePrice || product.sellingPrice || product.price);
  return { variants, stock, price, status: product.status ?? (product.active ? "active" : "inactive") };
}

export function filterProducts(products: ManagedProduct[], query: ProductListQuery) {
  const q = query.q?.trim().toLocaleLowerCase("vi");
  const list = products.filter((product) => {
    const summary = productSummary(product);
    return (!q || [product.name, product.sku, product.brand, product.slug].some((value) => value?.toLocaleLowerCase("vi").includes(q))) &&
      (!query.category || product.category === query.category) &&
      (!query.status || summary.status === query.status) &&
      (!query.stock || (query.stock === "out" ? summary.stock <= 0 : summary.stock > 0 && summary.stock <= 3));
  });
  if (query.sort === "name") return list.sort((a, b) => a.name.localeCompare(b.name, "vi"));
  if (query.sort === "price") return list.sort((a, b) => productSummary(b).price - productSummary(a).price);
  if (query.sort === "stock") return list.sort((a, b) => productSummary(a).stock - productSummary(b).stock);
  return list.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function pageHref(query: ProductListQuery, page: number, status = query.status ?? "") {
  const params = new URLSearchParams();
  for (const key of ["q", "category", "stock", "sort"] as const) if (query[key]) params.set(key, query[key]!);
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  return `/admin/products${params.size ? `?${params}` : ""}`;
}

export function pagination(current: number, count: number) {
  return [...new Set([1, current - 1, current, current + 1, count])].filter((page) => page >= 1 && page <= count).sort((a, b) => a - b);
}
