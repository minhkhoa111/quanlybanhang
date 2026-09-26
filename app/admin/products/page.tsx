import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/app/admin-auth";
import { getManagedProducts } from "@/db/products";
import AdminBulkProducts from "../AdminBulkProducts";
import { toggleAdminProductAction } from "../actions";
import { statusLabel } from "../utils";
import { filterProducts, productSummary, pageHref, pagination, type ProductListQuery } from "./product-list-utils";

export const dynamic = "force-dynamic";
const pageSize = 12;
const categoryNames: Record<string, string> = { iphone: "iPhone", android: "Android", ipad: "iPad", tablet: "Máy tính bảng", macbook: "MacBook", "macbook-air": "MacBook Air", "macbook-pro": "MacBook Pro", laptop: "Laptop", "laptop-cu": "Laptop đã qua sử dụng", "may-anh": "Máy ảnh", "phu-kien": "Phụ kiện", audio: "Âm thanh", smartwatch: "Đồng hồ", imac: "iMac", "mac-mini-studio": "Mac mini & Studio" };
const number = (value: number) => new Intl.NumberFormat("vi-VN").format(value);
const money = (value: number) => value ? `${number(value)} ₫` : "Liên hệ";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<ProductListQuery> }) {
  const [query, user] = await Promise.all([searchParams, requireAdminPage("/admin/products")]);
  if (user.role === "inventory") redirect("/admin/inventory");
  const allProducts = await getManagedProducts();
  const feedback = ["saved", "updated", "deleted"].includes(query.status ?? "") ? query.status : "";
  const selectedStatus = feedback ? "" : query.status ?? "";
  const cleanQuery = { ...query, status: selectedStatus };
  const products = filterProducts(allProducts, cleanQuery);
  const pageCount = Math.max(1, Math.ceil(products.length / pageSize));
  const requestedPage = Number(query.page);
  const page = Math.min(pageCount, Math.max(1, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1));
  const visible = products.slice((page - 1) * pageSize, page * pageSize);
  const categories = [...new Set(allProducts.map((product) => product.category))].sort();
  const summaries = allProducts.map(productSummary);
  const active = summaries.filter((item) => item.status === "active").length;
  const lowStock = summaries.filter((item) => item.stock > 0 && item.stock <= 3).length;
  const outOfStock = summaries.filter((item) => item.stock <= 0).length;
  const totalStock = summaries.reduce((sum, item) => sum + item.stock, 0);
  const activePercent = allProducts.length ? Math.round(active / allProducts.length * 100) : 0;
  const hasFilters = Boolean(query.q || query.category || selectedStatus || query.stock);
  const pages = pagination(page, pageCount);

  return (
    <div className="products-premium">
      <nav className="pp-breadcrumb" aria-label="Đường dẫn quản trị"><Link href="/admin">Quản trị</Link><span>/</span><span>Sản phẩm</span></nav>
      <header className="pp-heading">
        <div><span className="pp-eyebrow">INFINITY · CATALOG MANAGEMENT</span><h1>Danh mục sản phẩm<span>.</span></h1><p>Mọi sản phẩm, cấu hình và tồn kho. Trong một không gian.</p></div>
        <Link className="pp-button pp-button-primary" href="/admin/products/new"><span aria-hidden="true">＋</span> Thêm sản phẩm</Link>
      </header>
      {feedback && <p className="pp-feedback" role="status">✓ {feedback === "deleted" ? "Đã xóa sản phẩm được chọn." : feedback === "updated" ? "Đã cập nhật trạng thái sản phẩm." : "Đã lưu sản phẩm."}</p>}
      <section className="pp-overview" aria-label="Tổng quan toàn bộ danh mục">
        <div className="pp-overview-feature"><span className="pp-eyebrow">TỔNG QUAN DANH MỤC</span><div className="pp-total"><strong>{number(allProducts.length)}</strong><span>model sản phẩm</span></div><div className="pp-catalog-health"><span>{categories.length} danh mục</span><span>{activePercent}% đang bán</span></div><div className="pp-health-track" aria-hidden="true"><span style={{ width: `${activePercent}%` }} /></div></div>
        <Link href="/admin/products?status=active" className="pp-stat"><span className="pp-stat-label"><i className="pp-dot pp-dot-green" />Đang kinh doanh<span aria-hidden="true">↗</span></span><strong>{number(active)}</strong><small>Model hiển thị để bán</small></Link>
        <Link href="/admin/products?stock=low" className="pp-stat"><span className="pp-stat-label"><i className="pp-dot pp-dot-amber" />Sắp hết hàng<span aria-hidden="true">↗</span></span><strong>{number(lowStock)}</strong><small>Còn từ 1 đến 3 sản phẩm</small></Link>
        <Link href="/admin/products?stock=out" className="pp-stat"><span className="pp-stat-label"><i className="pp-dot pp-dot-red" />Đã hết hàng<span aria-hidden="true">↗</span></span><strong>{number(outOfStock)}</strong><small>Cần kiểm tra và bổ sung kho</small></Link>
      </section>
      <section className="pp-workspace" aria-labelledby="pp-list-title">
        <div className="pp-workspace-heading"><div><h2 id="pp-list-title">Thư viện sản phẩm <span>{number(products.length)}</span></h2><p>Quản lý theo model · Tồn kho cộng theo cấu hình đang hoạt động</p></div><span className="pp-stock-total">Tổng tồn <strong>{number(totalStock)}</strong></span></div>
        <nav className="pp-status-tabs" aria-label="Trạng thái sản phẩm">
          {[["", "Tất cả"], ["active", "Đang bán"], ["inactive", "Tạm ẩn"], ["draft", "Bản nháp"]].map(([value, label]) => <Link key={value} href={pageHref(cleanQuery, 1, value)} aria-current={selectedStatus === value ? "page" : undefined}>{label}<span>{value ? summaries.filter((item) => item.status === value).length : allProducts.length}</span></Link>)}
        </nav>
        <form className="pp-filters" action="/admin/products" key={JSON.stringify(cleanQuery)}>
          {selectedStatus && <input type="hidden" name="status" value={selectedStatus} />}
          <label className="pp-search"><span>Tìm sản phẩm</span><input name="q" type="search" defaultValue={query.q} placeholder="Tên sản phẩm, SKU hoặc thương hiệu…" /></label>
          <label><span>Danh mục</span><select name="category" defaultValue={query.category ?? ""}><option value="">Tất cả danh mục</option>{categories.map((category) => <option key={category} value={category}>{categoryNames[category] || category}</option>)}</select></label>
          <label><span>Tồn kho</span><select name="stock" defaultValue={query.stock ?? ""}><option value="">Mọi mức tồn</option><option value="out">Hết hàng</option><option value="low">Sắp hết · 1–3 sản phẩm</option></select></label>
          <label><span>Sắp xếp</span><select name="sort" defaultValue={query.sort ?? "updated"}><option value="updated">Mới cập nhật</option><option value="name">Tên A–Z</option><option value="price">Giá cao đến thấp</option><option value="stock">Tồn kho thấp nhất</option></select></label>
          <button className="pp-button pp-filter-submit" type="submit">Áp dụng</button>
        </form>
        {hasFilters && <div className="pp-applied-filters"><span>Đang lọc:</span>{query.q && <b>“{query.q}”</b>}{query.category && <b>{categoryNames[query.category] || query.category}</b>}{selectedStatus && <b>{statusLabel(selectedStatus)}</b>}{query.stock && <b>{query.stock === "out" ? "Hết hàng" : "Sắp hết hàng"}</b>}<Link href="/admin/products">Xóa bộ lọc ×</Link></div>}
        <AdminBulkProducts key={`${page}-${visible.map((product) => product.id).join("-")}`}>
          <div className="admin-table-wrap pp-table-wrap" tabIndex={0} role="region" aria-label="Bảng sản phẩm, cuộn ngang để xem thêm cột">
            <table className="admin-table admin-product-model-table pp-table">
              <thead><tr><th scope="col"><span className="pp-sr-only">Chọn sản phẩm</span></th><th scope="col">Sản phẩm / Model</th><th scope="col">Cấu hình</th><th scope="col">Giá bán từ</th><th scope="col">Tồn kho</th><th scope="col">Trạng thái</th><th scope="col">Thao tác</th></tr></thead>
              <tbody>{visible.map((product) => {
                const { variants, stock, price, status } = productSummary(product);
                return <tr key={product.id}>
                  <td><input type="checkbox" name="ids" value={product.id} aria-label={`Chọn ${product.name}`} /></td>
                  <td><div className="admin-product-model-cell pp-product-cell"><div className="pp-product-image">{product.image ? <Image src={product.image} alt="" width={56} height={56} unoptimized /> : <span aria-hidden="true">◇</span>}</div><div><span className="pp-product-brand">{product.brand || categoryNames[product.category] || product.category}</span><Link href={`/admin/products/${product.id}`}>{product.name}</Link><small>{product.sku || product.slug}</small></div></div></td>
                  <td><span className="pp-variant-count">{variants.length || 1} cấu hình</span><small className="pp-variant-detail">{variants.length ? variants.slice(0, 2).map((variant) => [variant.ram, variant.storage, variant.color].filter(Boolean).join(" / ")).join(" · ") : "Cấu hình tiêu chuẩn"}</small></td>
                  <td><strong className="pp-price">{money(price)}</strong><small>{variants.length > 1 ? "Thấp nhất trong các cấu hình" : "Giá bán hiện tại"}</small></td>
                  <td><span className={`pp-stock ${stock <= 0 ? "pp-stock-out" : stock <= 3 ? "pp-stock-low" : ""}`}><i aria-hidden="true" />{number(stock)} <small>sản phẩm</small></span><small>{stock <= 0 ? "Cần bổ sung" : stock <= 3 ? "Sắp hết hàng" : "Sẵn sàng kinh doanh"}</small></td>
                  <td><span className={`pp-status pp-status-${status}`}><i aria-hidden="true" />{statusLabel(status)}</span></td>
                  <td><div className="pp-row-actions"><Link href={`/admin/products/${product.id}`} aria-label={`Chỉnh sửa ${product.name}`}>Chỉnh sửa <span aria-hidden="true">↗</span></Link><form action={toggleAdminProductAction}><input type="hidden" name="id" value={product.id} /><input type="hidden" name="slug" value={product.slug} /><input type="hidden" name="active" value={String(!product.active)} /><button type="submit" aria-label={`${product.active ? "Ẩn" : "Hiện"} ${product.name}`}>{product.active ? "Ẩn" : "Hiện"}</button></form></div></td>
                </tr>;
              })}</tbody>
            </table>
            {!visible.length && <div className="pp-empty"><span aria-hidden="true">◇</span><h3>{hasFilters ? "Không tìm thấy sản phẩm phù hợp" : "Danh mục đang chờ sản phẩm đầu tiên"}</h3><p>{hasFilters ? "Thử từ khóa khác hoặc mở rộng bộ lọc của bạn." : "Thêm sản phẩm để bắt đầu quản lý cấu hình, giá bán và tồn kho."}</p><Link className="pp-button" href={hasFilters ? "/admin/products" : "/admin/products/new"}>{hasFilters ? "Xóa bộ lọc" : "Thêm sản phẩm"}</Link></div>}
          </div>
        </AdminBulkProducts>
        <footer className="pp-table-footer"><p>Hiển thị <strong>{products.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, products.length)}</strong> trong {number(products.length)} sản phẩm</p><nav className="pp-pagination" aria-label="Phân trang sản phẩm">{page > 1 && <Link href={pageHref(cleanQuery, page - 1)} aria-label="Trang trước">←</Link>}{pages.map((value, index) => <span key={value}>{index > 0 && value - pages[index - 1] > 1 && <span className="pp-page-gap">…</span>}<Link href={pageHref(cleanQuery, value)} aria-current={page === value ? "page" : undefined} aria-label={`Trang ${value}`}>{value}</Link></span>)}{page < pageCount && <Link href={pageHref(cleanQuery, page + 1)} aria-label="Trang tiếp">→</Link>}</nav></footer>
      </section>
      <p className="pp-footnote">INFINITY RETAIL <span>Danh mục thống nhất. Vận hành liền mạch.</span></p>
    </div>
  );
}
