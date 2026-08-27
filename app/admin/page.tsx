import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/app/admin-auth";
import { getAdminUsers } from "@/db/admin-users";
import { getBranches } from "@/db/branches";
import { getAdminConversations } from "@/db/live-chat";
import { getReportingOrders } from "@/db/orders";
import { getManagedProducts } from "@/db/products";
import { getProductViewStats } from "@/db/product-views";
import { buildBusinessAnalytics } from "./business-analytics";
import { formatMoney, orderTotalNumber, productPriceNumber, statusLabel } from "./utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const currentUser = await requireAdminPage("/admin");
  if (currentUser.role === "manager") redirect("/manager");
  if (currentUser.role !== "owner") redirect("/staff");
  const [products, orders, viewStats, branches, staff, conversations] = await Promise.all([
    getManagedProducts(),
    getReportingOrders().catch(() => []),
    getProductViewStats(),
    getBranches().catch(() => []),
    getAdminUsers().catch(() => []),
    getAdminConversations().catch(() => []),
  ]);
  const isOrderWorker = currentUser.role === "sales" || currentUser.role === "warranty" || currentUser.role === "repair";
  const analyticsOrders = currentUser.role === "owner" ? orders : currentUser.role === "manager" ? orders.filter((item) => item.branchId === currentUser.branchId) : isOrderWorker ? orders.filter((item) => item.assignedAdminId === currentUser.id) : [];
  const analyticsBranches = currentUser.role === "owner" ? branches : branches.filter((item) => item.id === currentUser.branchId);
  const analyticsStaff = currentUser.role === "owner" ? staff : currentUser.role === "manager" ? staff.filter((item) => item.branchId === currentUser.branchId) : isOrderWorker ? staff.filter((item) => item.id === currentUser.id) : [];
  const branchScopeId = currentUser.role === "owner" ? "" : currentUser.branchId;
  const analytics = buildBusinessAnalytics({ orders: analyticsOrders, products, branches: analyticsBranches, staff: analyticsStaff, conversations, periodDays: 30, branchScopeId });
  const visibleOrders = currentUser.role === "owner" ? orders : currentUser.role === "manager" ? orders.filter((item) => item.branchId === currentUser.branchId) : isOrderWorker ? orders.filter((item) => item.assignedAdminId === currentUser.id) : [];
  const processing = visibleOrders.filter((order) => ["pending", "confirmed", "processing", "shipping"].includes(order.status)).length;
  const lowStock = products.filter((product) => (product.stock ?? 0) <= 3).length;
  const topProducts = [...products].sort((a, b) => productPriceNumber(b) - productPriceNumber(a)).slice(0, 5);
  const chartSeed = buildChart(visibleOrders, products);
  const canViewReports = currentUser.role === "owner" || currentUser.role === "manager";

  return (
    <>
      <div className="admin-topline admin-dashboard-heading">
        <div><span>Trung tâm điều hành</span><h1>Xin chào, {currentUser.name}</h1><p className="admin-subtitle">{fullDate()} · {currentUser.branch || "Toàn hệ thống"}</p></div>
        <div className="admin-actions-row">{canViewReports && <Link className="admin-button" href="/admin/reports">Xem báo cáo</Link>}{(currentUser.role === "owner" || currentUser.role === "manager") && <Link className="admin-button admin-button-primary" href="/admin/products/new">＋ Thêm sản phẩm</Link>}</div>
      </div>

      <section className="admin-executive-kpis">
        <ExecutiveMetric icon="↗" label="Doanh thu 30 ngày" value={money(analytics.revenue)} note={`${analytics.deliveredCount} đơn đã giao`} tone="blue" />
        <ExecutiveMetric icon="▤" label="Đơn hàng trong kỳ" value={String(analytics.orderCount)} note={`${analytics.activeOrders} đơn đang xử lý`} tone="violet" />
        <ExecutiveMetric icon="◎" label="Tỷ lệ hoàn tất" value={`${analytics.completionRate}%`} note={`Giá trị TB ${money(analytics.averageOrder)}`} tone="green" />
        <ExecutiveMetric icon="◌" label="Khách xem hôm nay" value={viewStats.todayVisitors.toLocaleString("vi-VN")} note={`${viewStats.totalViews.toLocaleString("vi-VN")} tổng lượt xem`} tone="orange" />
      </section>

      <section className="admin-operational-strip">
        <article><i className="is-blue">▤</i><span><small>Đơn cần xử lý</small><strong>{processing}</strong></span><Link href="/admin/orders">Kiểm tra →</Link></article>
        <article><i className="is-orange">△</i><span><small>Sản phẩm sắp hết</small><strong>{lowStock}</strong></span><Link href="/admin/products?stock=low">Xem kho →</Link></article>
        {currentUser.role === "warranty" || currentUser.role === "repair" ? <article><i className="is-green">✓</i><span><small>Đơn được phân công</small><strong>{visibleOrders.length}</strong></span><Link href="/admin/orders">Mở công việc →</Link></article> : <article><i className="is-green">✦</i><span><small>Khách chờ tư vấn</small><strong>{conversations.filter((item) => item.status === "waiting").length}</strong></span><Link href="/admin/live-chat">Mở hộp thư →</Link></article>}
        <article><i className="is-violet">⌘</i><span><small>Chi nhánh hoạt động</small><strong>{branches.filter((item) => item.active).length}/{branches.length}</strong></span>{currentUser.role === "owner" ? <Link href="/admin/branches">Quản lý →</Link> : <small>{currentUser.branch}</small>}</article>
      </section>

      <section className="admin-card admin-quick-actions admin-business-actions">
        <div><span>Truy cập nhanh</span><strong>Công việc thường dùng</strong></div>
        <nav>
          <Link href="/admin/tasks">✓ Giao việc & báo cáo</Link>
          {(currentUser.role === "owner" || currentUser.role === "manager" || isOrderWorker) && <Link href="/admin/orders">▤ Xử lý đơn hàng</Link>}
          {(currentUser.role === "owner" || currentUser.role === "manager" || currentUser.role === "consultant") && <Link href="/admin/live-chat">✦ Tư vấn khách hàng</Link>}
          {(currentUser.role === "owner" || currentUser.role === "manager" || currentUser.role === "sales") && <Link href="/admin/products">▦ Quản lý sản phẩm</Link>}
          {currentUser.role === "owner" && <Link href="/admin/staff">♧ Quản lý nhân sự</Link>}
          {canViewReports && <Link href="/admin/reports">↗ Phân tích kinh doanh</Link>}
        </nav>
      </section>

      <section className="admin-dashboard-grid admin-business-grid">
        <article className="admin-card admin-revenue-panel">
          <div className="admin-card-head"><div><span>Revenue</span><h2>Doanh thu 7 ngày</h2></div>{canViewReports && <Link href="/admin/reports?period=7">Chi tiết</Link>}</div>
          <div className="admin-chart admin-blue-chart">
            {chartSeed.map((item) => <div key={item.label} style={{ height: `${Math.max(8, item.percent)}%` }}><span>{money(item.value)}</span><small>{item.label}</small></div>)}
          </div>
        </article>

        <article className="admin-card admin-recent-orders">
          <div className="admin-card-head"><div><span>Orders</span><h2>Đơn hàng mới nhất</h2></div><Link href="/admin/orders">Xem tất cả</Link></div>
          <div className="admin-list">
            {visibleOrders.slice(0, 6).map((order) => <Link href={`/admin/orders/${order.id}`} key={order.id}><strong>{order.customerName}</strong><span>{order.productName} · {order.branchName || "Chưa phân chi nhánh"}</span><em className={`admin-badge status-${order.status}`}>{statusLabel(order.status)}</em></Link>)}
            {!visibleOrders.length && <p className="admin-empty-state">Chưa có đơn hàng trong phạm vi của bạn.</p>}
          </div>
        </article>

        {canViewReports && <article className="admin-card admin-span-2 admin-dashboard-branches">
          <div className="admin-card-head"><div><span>Branch Performance</span><h2>Hiệu quả chi nhánh · 30 ngày</h2></div><Link href="/admin/reports">Báo cáo đầy đủ</Link></div>
          <div>{analytics.branchRows.slice(0, 5).map((branch, index) => <article key={branch.id}><b>{String(index + 1).padStart(2, "0")}</b><span><strong>{branch.name}</strong><small>{branch.orders} đơn · {branch.completionRate}% hoàn tất</small></span><div><strong>{money(branch.revenue)}</strong><i><em style={{ width: `${branch.revenueShare}%` }} /></i></div></article>)}{!analytics.branchRows.length && <p className="admin-empty-state">Chưa có dữ liệu chi nhánh.</p>}</div>
        </article>}

        {canViewReports && <article className="admin-card admin-dashboard-people">
          <div className="admin-card-head"><div><span>People</span><h2>Nhân viên nổi bật</h2></div><Link href="/admin/reports">Xem hiệu suất</Link></div>
          <div>{analytics.employeeRows.slice(0, 5).map((employee) => <article key={employee.id}><b>{employee.name.slice(0, 1).toUpperCase()}</b><span><strong>{employee.name}</strong><small>{employee.branch} · {employee.delivered}/{employee.orders} đơn hoàn tất</small></span><em>{employee.score}</em></article>)}</div>
        </article>}

        <article className={`admin-card ${canViewReports ? "" : "admin-span-2"}`}>
          <div className="admin-card-head"><div><span>Catalog</span><h2>Sản phẩm giá trị cao</h2></div><Link href="/admin/products">Danh mục</Link></div>
          <div className="admin-top-products">
            {topProducts.map((product) => <Link href={`/admin/products/${product.id}`} key={product.id}><Image src={product.image} alt="" width={52} height={52} unoptimized /><div><strong>{product.name}</strong><span>{product.stock ?? 0} sản phẩm trong kho</span></div><em>{product.salePrice || product.sellingPrice || product.price}</em></Link>)}
          </div>
        </article>

        <article className="admin-card admin-span-2">
          <div className="admin-card-head"><div><span>Customer Interest</span><h2>Sản phẩm được quan tâm</h2></div><strong>{viewStats.uniqueVisitors.toLocaleString("vi-VN")} khách duy nhất</strong></div>
          <div className="admin-view-ranking">{viewStats.products.map((item, index) => <Link href={`/san-pham/${item.slug}`} key={item.slug}><b>{String(index + 1).padStart(2, "0")}</b><div><strong>{item.name}</strong><span>{item.visitors.toLocaleString("vi-VN")} khách đã xem</span></div><em>{item.views.toLocaleString("vi-VN")} lượt</em></Link>)}{!viewStats.products.length && <p className="admin-empty-state">Chưa có dữ liệu lượt xem sản phẩm.</p>}</div>
        </article>
      </section>
    </>
  );
}

function ExecutiveMetric({ icon, label, value, note, tone }: { icon: string; label: string; value: string; note: string; tone: string }) {
  return <article><i className={`tone-${tone}`}>{icon}</i><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

function buildChart(orders: Awaited<ReturnType<typeof getReportingOrders>>, products: Awaited<ReturnType<typeof getManagedProducts>>) {
  const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (6 - index)); return { label: date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }), key: date.toLocaleDateString("vi-VN"), value: 0 }; });
  for (const order of orders.filter((item) => item.status === "delivered")) { const day = days.find((item) => item.key === new Date(order.createdAt).toLocaleDateString("vi-VN")); if (day) day.value += orderTotalNumber(order, products); }
  const max = Math.max(1, ...days.map((item) => item.value));
  return days.map((item) => ({ ...item, percent: Math.round(item.value / max * 100) }));
}

function money(value: number) { return value ? formatMoney(value) : "0đ"; }
function fullDate() { return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date()); }
