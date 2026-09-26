import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/app/components/ProductCard";
import { getPublicProducts } from "@/db/products";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Tìm kiếm sản phẩm",
  description: "Tìm điện thoại, máy tính và phụ kiện tại Infinity Store.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = cleanQuery((await searchParams).q);
  const products = await getPublicProducts();
  const normalizedQuery = normalize(query);
  const results = normalizedQuery
    ? products.filter((product) => normalize([
        product.name,
        product.slug,
        product.brand,
        product.category,
        product.tagline,
        ...(product.specs ?? []),
      ].filter(Boolean).join(" ")).includes(normalizedQuery))
    : [];

  return (
    <main className="store-search-page">
      <div className="store-search-shell">
        <nav className="store-search-breadcrumb" aria-label="Đường dẫn">
          <Link href="/">Trang chủ</Link><span>›</span><span>Tìm kiếm</span>
        </nav>

        <section className="store-search-heading">
          <p>TÌM SẢN PHẨM INFINITY STORE</p>
          <h1>{query ? `Kết quả cho “${query}”` : "Bạn đang tìm sản phẩm nào?"}</h1>
          <form action="/tim-kiem" role="search">
            <input name="q" defaultValue={query} placeholder="iPhone, MacBook, laptop, máy ảnh..." autoFocus={!query} />
            <button type="submit">Tìm kiếm</button>
          </form>
          {query && <small>Tìm thấy {results.length} sản phẩm phù hợp.</small>}
        </section>

        {query && results.length > 0 ? (
          <section className="store-search-grid" aria-label="Kết quả tìm kiếm">
            {results.map((product) => <ProductCard key={product.slug} product={product} />)}
          </section>
        ) : query ? (
          <section className="store-search-empty">
            <span aria-hidden="true">⌕</span>
            <h2>Chưa tìm thấy sản phẩm</h2>
            <p>Thử tên model ngắn hơn hoặc xem theo danh mục sản phẩm.</p>
            <Link href="/">Khám phá sản phẩm nổi bật</Link>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function cleanQuery(value: string | undefined) {
  return String(value || "").trim().slice(0, 80);
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
