import Image from "next/image";
import Link from "next/link";
import { getManagedProducts } from "@/db/products";
import AdminBulkProducts from "../AdminBulkProducts";
import { toggleAdminProductAction } from "../actions";
import { formatDate, statusLabel } from "../utils";

export const dynamic = "force-dynamic";

const pageSize = 12;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; status?: string; stock?: string; sort?: string; page?: string }>;
}) {
  const query = await searchParams;
  const allProducts = await getManagedProducts();
  const feedback = query.status === "saved" || query.status === "updated" || query.status === "deleted" ? query.status : "";
  const selectedStatus = feedback ? "" : query.status ?? "";
  const products = filterProducts(allProducts, { ...query, status: selectedStatus });
  const page = Math.max(1, Number(query.page) || 1);
  const pageCount = Math.max(1, Math.ceil(products.length / pageSize));
  const visible = products.slice((page - 1) * pageSize, page * pageSize);
  const categories = [...new Set(allProducts.map((product) => product.category))];

  return (
    <>
      <div className="admin-topline">
        <div><span>Sản phẩm</span><h1>Quản lý sản phẩm</h1></div>
        <Link className="admin-button admin-button-primary" href="/admin/products/new">Thêm sản phẩm</Link>
      </div>
      {feedback && <p className="admin-alert success">{feedback === "deleted" ? "Đã xóa sản phẩm được chọn." : feedback === "updated" ? "Đã cập nhật trạng thái sản phẩm." : "Đã lưu sản phẩm."}</p>}
      <form className="admin-toolbar">
        <input name="q" defaultValue={query.q} placeholder="Tìm tên, SKU hoặc hãng..." />
        <select name="category" defaultValue={query.category ?? ""}><option value="">Tất cả danh mục</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
        <select name="status" defaultValue={selectedStatus}><option value="">Tất cả trạng thái</option><option value="active">Đang bán</option><option value="inactive">Tạm ẩn</option><option value="draft">Bản nháp</option></select>
        <select name="stock" defaultValue={query.stock ?? ""}><option value="">Tồn kho</option><option value="out">Hết hàng</option><option value="low">Sắp hết hàng</option></select>
        <select name="sort" defaultValue={query.sort ?? "updated"}><option value="updated">Mới cập nhật</option><option value="name">Tên A-Z</option><option value="price">Giá cao</option><option value="stock">Tồn kho thấp</option></select>
        <button className="admin-button" type="submit">Lọc</button>
      </form>
      <AdminBulkProducts>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th></th><th>Ảnh</th><th>Tên sản phẩm</th><th>SKU</th><th>Danh mục</th><th>Giá bán</th><th>Giá khuyến mãi</th><th>Tồn kho</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead>
            <tbody>
              {visible.map((product) => (
                <tr key={product.id}>
                  <td><input type="checkbox" name="ids" value={product.id} /></td>
                  <td><Image src={product.image} alt="" width={52} height={52} unoptimized /></td>
                  <td><strong>{product.name}</strong><span>{product.brand}</span></td>
                  <td>{product.sku || product.slug}</td>
                  <td>{product.category}</td>
                  <td>{product.sellingPrice || product.price}</td>
                  <td>{product.salePrice || "-"}</td>
                  <td className={(product.stock ?? 0) <= 0 ? "is-danger" : (product.stock ?? 0) <= 3 ? "is-warn" : ""}>{product.stock ?? 0}</td>
                  <td><span className={`admin-badge status-${product.status}`}>{statusLabel(product.status ?? "active")}</span></td>
                  <td>{formatDate(product.createdAt)}</td>
                  <td>
                    <div className="admin-row-actions">
                      <Link href={`/admin/products/${product.id}`}>Sửa</Link>
                      <form action={toggleAdminProductAction}>
                        <input type="hidden" name="id" value={product.id} />
                        <input type="hidden" name="slug" value={product.slug} />
                        <input type="hidden" name="active" value={String(!product.active)} />
                        <button type="submit">{product.active ? "Ẩn" : "Hiện"}</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && <div className="admin-empty-state">Không có sản phẩm phù hợp bộ lọc.</div>}
        </div>
      </AdminBulkProducts>
      <div className="admin-pagination">
        {Array.from({ length: pageCount }, (_, index) => <Link className={page === index + 1 ? "is-active" : ""} key={index} href={pageHref(query, index + 1, selectedStatus)}>{index + 1}</Link>)}
      </div>
    </>
  );
}

function pageHref(query: { q?: string; category?: string; stock?: string; sort?: string }, page: number, status: string) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("category", query.category);
  if (status) params.set("status", status);
  if (query.stock) params.set("stock", query.stock);
  if (query.sort) params.set("sort", query.sort);
  params.set("page", String(page));
  return `/admin/products?${params.toString()}`;
}

function filterProducts(products: Awaited<ReturnType<typeof getManagedProducts>>, query: { q?: string; category?: string; status?: string; stock?: string; sort?: string }) {
  const q = query.q?.trim().toLowerCase();
  let list = products.filter((product) => {
    const matchesSearch = !q || [product.name, product.sku, product.brand, product.slug].some((value) => value?.toLowerCase().includes(q));
    const matchesCategory = !query.category || product.category === query.category;
    const matchesStatus = !query.status || product.status === query.status;
    const stock = product.stock ?? 0;
    const matchesStock = !query.stock || (query.stock === "out" ? stock <= 0 : stock <= 3);
    return matchesSearch && matchesCategory && matchesStatus && matchesStock;
  });
  if (query.sort === "name") list = list.sort((a, b) => a.name.localeCompare(b.name));
  if (query.sort === "price") list = list.sort((a, b) => (Number(b.sellingPrice?.replace(/\D/g, "")) || 0) - (Number(a.sellingPrice?.replace(/\D/g, "")) || 0));
  if (query.sort === "stock") list = list.sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
  return list;
}
