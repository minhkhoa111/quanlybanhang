import Image from "next/image";
import Link from "next/link";
import { requireInventoryPage } from "@/app/admin-auth";
import { getBranches } from "@/db/branches";
import { getBranchInventory, getInventoryMovements } from "@/db/inventory";
import { adjustInventoryAction } from "./actions";

export const dynamic = "force-dynamic";
const pageSize = 24;

type InventoryQuery = { branch?: string; q?: string; stock?: string; page?: string; status?: string; error?: string };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<InventoryQuery> }) {
  const [user, query, branches] = await Promise.all([requireInventoryPage(), searchParams, getBranches(false).catch(() => [])]);
  const selectedBranchId = user.role === "owner" ? (branches.some((item) => item.id === query.branch) ? query.branch! : branches[0]?.id || "") : user.branchId;
  const branch = branches.find((item) => item.id === selectedBranchId);
  const [allItems, movements] = branch
    ? await Promise.all([getBranchInventory(branch.id), getInventoryMovements(branch.id)])
    : [[], []];
  const keyword = (query.q || "").trim().toLocaleLowerCase("vi-VN").slice(0, 100);
  const stockFilter = query.stock === "out" || query.stock === "low" || query.stock === "available" ? query.stock : "";
  const filtered = allItems.filter(({ product, quantity }) => {
    if (keyword && !`${product.name} ${product.sku || ""} ${product.brand}`.toLocaleLowerCase("vi-VN").includes(keyword)) return false;
    if (stockFilter === "out" && quantity !== 0) return false;
    if (stockFilter === "low" && (quantity <= 0 || quantity > 3)) return false;
    if (stockFilter === "available" && quantity <= 0) return false;
    return true;
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(pageCount, Math.max(1, Number(query.page) || 1));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalUnits = allItems.reduce((sum, item) => sum + item.quantity, 0);
  const statusMessage = query.status === "receive" ? "Đã nhập hàng vào kho chi nhánh." : query.status === "issue" ? "Đã xuất hàng khỏi kho chi nhánh." : query.status === "count" ? "Đã cập nhật số kiểm kê thực tế." : "";

  return <>
    <div className="admin-topline inventory-heading">
      <div><span>Kiểm tra &amp; xuất nhập hàng</span><h1>Kho sản phẩm chi nhánh</h1><p className="admin-subtitle">Điều chỉnh số lượng theo phiếu nhập, phiếu xuất hoặc kết quả kiểm kê. Nhân viên kho chỉ thao tác trong chi nhánh được phân công.</p></div>
      {branch && <div className="inventory-branch-chip"><span>Kho đang thao tác</span><strong>{branch.code} · {branch.name}</strong></div>}
    </div>
    {statusMessage && <p className="admin-alert success">{statusMessage}</p>}
    {query.error && <p className="admin-alert error">{query.error}</p>}
    {!branch && <p className="admin-alert error">Tài khoản chưa được gán vào một chi nhánh đang hoạt động.</p>}

    <form className="admin-toolbar inventory-toolbar">
      {user.role === "owner" && <select name="branch" defaultValue={selectedBranchId}>{branches.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select>}
      <input name="q" defaultValue={query.q || ""} placeholder="Tìm tên, SKU hoặc hãng..." />
      <select name="stock" defaultValue={stockFilter}><option value="">Tất cả tồn kho</option><option value="available">Đang có hàng</option><option value="low">Sắp hết (1–3)</option><option value="out">Hết hàng</option></select>
      <button className="admin-button" type="submit">Lọc kho</button>
      <Link className="admin-button" href={user.role === "owner" && selectedBranchId ? `/admin/inventory?branch=${encodeURIComponent(selectedBranchId)}` : "/admin/inventory"}>Đặt lại</Link>
    </form>

    <section className="admin-report-kpis inventory-kpis">
      <InventoryMetric icon="▦" label="Mã sản phẩm" value={String(allItems.length)} note="Danh mục có thể nhập kho" />
      <InventoryMetric icon="■" label="Tổng số lượng" value={totalUnits.toLocaleString("vi-VN")} note={`Tại ${branch?.name || "chi nhánh"}`} />
      <InventoryMetric icon="△" label="Sắp hết" value={String(allItems.filter((item) => item.quantity > 0 && item.quantity <= 3).length)} note="Cần kiểm tra hoặc nhập thêm" />
      <InventoryMetric icon="×" label="Hết hàng" value={String(allItems.filter((item) => item.quantity === 0).length)} note="Chưa có hàng tại chi nhánh" />
    </section>

    <section className="admin-card inventory-directory">
      <div className="admin-card-head"><div><span>{filtered.length} sản phẩm phù hợp</span><h2>Danh sách tồn kho</h2></div><small>Nhập (+) · Xuất (−) · Kiểm kê (=)</small></div>
      <div className="admin-table-wrap"><table className="admin-table inventory-table"><thead><tr><th>Sản phẩm</th><th>SKU</th><th>Tồn hệ thống</th><th>Tồn chi nhánh</th><th>Cập nhật cuối</th><th>Điều chỉnh kho</th></tr></thead><tbody>{visible.map(({ product, quantity, updatedAt }) => <tr key={product.id}>
        <td><div className="inventory-product"><Image src={product.image} alt="" width={48} height={48} unoptimized /><span><strong>{product.name}</strong><small>{product.brand} · {product.category}</small></span></div></td>
        <td>{product.sku || product.slug}</td>
        <td>{product.stock ?? 0}</td>
        <td><strong className={`inventory-quantity ${quantity === 0 ? "is-out" : quantity <= 3 ? "is-low" : ""}`}>{quantity}</strong></td>
        <td>{updatedAt ? formatTimestamp(updatedAt) : "Chưa kiểm kê"}</td>
        <td><form action={adjustInventoryAction} className="inventory-adjust-form"><input type="hidden" name="branchId" value={selectedBranchId}/><input type="hidden" name="productId" value={product.id}/><select name="operation" aria-label={`Thao tác kho ${product.name}`}><option value="receive">Nhập hàng (+)</option><option value="issue">Xuất hàng (−)</option><option value="count">Kiểm kê (=)</option></select><input name="quantity" type="number" min="0" max="100000" step="1" defaultValue="1" required aria-label={`Số lượng ${product.name}`}/><input name="note" maxLength={240} placeholder="Mã phiếu / ghi chú" aria-label={`Ghi chú ${product.name}`}/><button type="submit">Cập nhật</button></form></td>
      </tr>)}</tbody></table>{!visible.length && <div className="admin-empty-state">Không có sản phẩm phù hợp với bộ lọc kho.</div>}</div>
      {pageCount > 1 && <div className="admin-pagination">{Array.from({ length: pageCount }, (_, index) => <Link key={index} className={page === index + 1 ? "is-active" : ""} href={pageHref(query, selectedBranchId, index + 1)}>{index + 1}</Link>)}</div>}
    </section>

    <section className="admin-card inventory-history">
      <div className="admin-card-head"><div><span>{movements.length} giao dịch gần nhất</span><h2>Lịch sử xuất nhập &amp; kiểm kê</h2></div><small>Mọi điều chỉnh đều lưu người thực hiện và số lượng trước/sau</small></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Thời gian</th><th>Sản phẩm</th><th>Nghiệp vụ</th><th>Số lượng</th><th>Trước → Sau</th><th>Người thực hiện</th><th>Ghi chú</th></tr></thead><tbody>{movements.map((item) => <tr key={item.id}><td>{formatTimestamp(item.createdAt)}</td><td><strong>{item.productName}</strong></td><td><span className={`inventory-operation is-${item.operation}`}>{operationLabel(item.operation)}</span></td><td>{item.quantity}</td><td><strong>{item.beforeQuantity} → {item.afterQuantity}</strong></td><td>{item.actorName}</td><td>{item.note || "—"}</td></tr>)}</tbody></table>{!movements.length && <div className="admin-empty-state">Chưa có giao dịch kho tại chi nhánh này.</div>}</div>
    </section>
  </>;
}

function InventoryMetric({ icon, label, value, note }: { icon: string; label: string; value: string; note: string }) { return <article><i>{icon}</i><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>; }
function operationLabel(value: string) { if (value === "issue") return "Xuất hàng"; if (value === "count") return "Kiểm kê"; return "Nhập hàng"; }
function formatTimestamp(value: number) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value)); }
function pageHref(query: InventoryQuery, branchId: string, page: number) { const params = new URLSearchParams(); if (branchId) params.set("branch", branchId); if (query.q) params.set("q", query.q); if (query.stock) params.set("stock", query.stock); params.set("page", String(page)); return `/admin/inventory?${params.toString()}`; }
