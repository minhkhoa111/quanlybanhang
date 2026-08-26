import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/app/admin-auth";
import { getAdminUsers } from "@/db/admin-users";
import { getBranches } from "@/db/branches";
import { getAdminConversations } from "@/db/live-chat";
import { getReportingOrders } from "@/db/orders";
import { getManagedProducts } from "@/db/products";
import { buildBusinessAnalytics } from "../business-analytics";
import { formatMoney } from "../utils";
import ReportPrintButton from "./ReportPrintButton";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ period?: string; branch?: string }> }) {
  const user = await requireAdminPage("/admin/reports");
  if (user.role !== "owner" && user.role !== "manager") redirect("/admin?error=report-access");
  const query = await searchParams;
  const period = [7, 30, 90, 365].includes(Number(query.period)) ? Number(query.period) : 30;
  const [orders, products, branches, staff, conversations] = await Promise.all([
    getReportingOrders().catch(() => []),
    getManagedProducts(),
    getBranches().catch(() => []),
    getAdminUsers().catch(() => []),
    getAdminConversations().catch(() => []),
  ]);
  const requestedBranch = user.role === "manager" ? user.branchId : query.branch || "";
  const branchScopeId = branches.some((item) => item.id === requestedBranch) ? requestedBranch : "";
  const analytics = buildBusinessAnalytics({ orders, products, branches, staff, conversations, periodDays: period, branchScopeId });
  const maxBranchRevenue = Math.max(1, ...analytics.branchRows.map((item) => item.revenue));

  return (
    <>
      <div className="admin-topline admin-report-heading">
        <div><span>Business Intelligence</span><h1>Báo cáo vận hành</h1><p className="admin-subtitle">Doanh thu ghi nhận từ đơn đã giao; hiệu suất dựa trên đơn được phân công và hội thoại tư vấn trong kỳ.</p></div>
        <div className="admin-actions-row"><ReportPrintButton /></div>
      </div>

      <form className="admin-report-filters">
        <label><span>Kỳ báo cáo</span><select name="period" defaultValue={String(period)}><option value="7">7 ngày gần nhất</option><option value="30">30 ngày gần nhất</option><option value="90">90 ngày gần nhất</option><option value="365">12 tháng gần nhất</option></select></label>
        {user.role === "owner" && <label><span>Phạm vi chi nhánh</span><select name="branch" defaultValue={branchScopeId}><option value="">Toàn hệ thống</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>}
        <button className="admin-button admin-button-primary" type="submit">Áp dụng</button>
      </form>

      <section className="admin-report-kpis">
        <ReportMetric icon="↗" label="Doanh thu ghi nhận" value={money(analytics.revenue)} note={`${analytics.deliveredCount} đơn đã giao`} />
        <ReportMetric icon="▤" label="Tổng đơn trong kỳ" value={String(analytics.orderCount)} note={`${analytics.activeOrders} đơn đang xử lý`} />
        <ReportMetric icon="◎" label="Tỷ lệ hoàn tất" value={`${analytics.completionRate}%`} note={`${analytics.cancelled} đơn hủy / hoàn`} />
        <ReportMetric icon="◈" label="Giá trị đơn trung bình" value={money(analytics.averageOrder)} note={`${analytics.unassignedOrders} đơn chưa phân bổ`} />
      </section>

      <section className="admin-report-grid">
        <article className="admin-card admin-report-branch-chart">
          <div className="admin-card-head"><div><span>Chi nhánh</span><h2>Phân bổ doanh thu</h2></div><small>{period} ngày gần nhất</small></div>
          <div>{analytics.branchRows.map((branch) => <div className="admin-branch-bar" key={branch.id}><header><span><strong>{branch.name}</strong><small>{branch.orders} đơn · {branch.completionRate}% hoàn tất</small></span><b>{money(branch.revenue)}</b></header><div><i style={{ width: `${Math.max(branch.revenue ? 4 : 0, branch.revenue / maxBranchRevenue * 100)}%` }} /></div></div>)}{!analytics.branchRows.length && <p className="admin-empty-state">Chưa có dữ liệu chi nhánh.</p>}</div>
        </article>

        <article className="admin-card admin-report-attention">
          <div className="admin-card-head"><div><span>Điều hành</span><h2>Cần chú ý</h2></div></div>
          <Link href="/admin/orders"><i className="tone-orange">!</i><span><strong>{analytics.activeOrders} đơn đang xử lý</strong><small>Theo dõi tiến độ xác nhận, chuẩn bị và giao hàng</small></span><b>→</b></Link>
          <Link href="/admin/orders"><i className="tone-blue">⌁</i><span><strong>{analytics.unassignedOrders} đơn chưa phân bổ</strong><small>Cần giao chi nhánh để ghi nhận doanh thu chính xác</small></span><b>→</b></Link>
          <Link href={user.role === "owner" ? "/admin/staff" : "/admin/reports#employee-performance"}><i className="tone-green">✓</i><span><strong>{analytics.employeeRows.filter((item) => item.active).length} nhân sự hoạt động</strong><small>Kiểm tra bảng hiệu suất và khối lượng công việc</small></span><b>→</b></Link>
        </article>
      </section>

      <section className="admin-card admin-report-table-card">
        <div className="admin-card-head"><div><span>Branch P&amp;L</span><h2>Doanh thu từng chi nhánh</h2></div></div>
        <div className="admin-table-wrap"><table className="admin-table admin-report-table"><thead><tr><th>Chi nhánh</th><th>Đơn hàng</th><th>Đã giao</th><th>Đang xử lý</th><th>Doanh thu</th><th>Đơn trung bình</th><th>Tỷ trọng</th><th>Hoàn tất</th></tr></thead><tbody>{analytics.branchRows.map((branch) => <tr key={branch.id}><td><strong>{branch.name}</strong><span>{branch.code}</span></td><td>{branch.orders}</td><td>{branch.delivered}</td><td>{branch.open}</td><td><strong>{money(branch.revenue)}</strong></td><td>{money(branch.averageOrder)}</td><td>{branch.revenueShare}%</td><td><span className={`admin-performance-rate ${branch.completionRate >= 70 ? "is-good" : branch.completionRate >= 40 ? "is-medium" : ""}`}>{branch.completionRate}%</span></td></tr>)}</tbody></table></div>
      </section>

      <section className="admin-card admin-report-table-card" id="employee-performance">
        <div className="admin-card-head"><div><span>People Performance</span><h2>Hiệu suất nhân viên</h2></div><small>Điểm = hoàn tất đơn 50% · đóng góp doanh thu 30% · xử lý chat 20%</small></div>
        <div className="admin-table-wrap"><table className="admin-table admin-report-table"><thead><tr><th>Nhân viên</th><th>Chi nhánh</th><th>Vai trò</th><th>Đơn phụ trách</th><th>Đã giao</th><th>Đang xử lý</th><th>Doanh thu</th><th>Chat đã xử lý</th><th>Hiệu suất</th></tr></thead><tbody>{analytics.employeeRows.map((employee, index) => <tr key={employee.id}><td><div className="admin-employee-cell"><b>{index + 1}</b><span><strong>{employee.name}</strong><small>{employee.active ? "Đang hoạt động" : "Đã khóa"}</small></span></div></td><td>{employee.branch}</td><td>{roleLabel(employee.role)}</td><td>{employee.orders}</td><td>{employee.delivered}</td><td>{employee.open}</td><td><strong>{money(employee.revenue)}</strong></td><td>{employee.closedChats}/{employee.chats}</td><td><span className={`admin-score ${employee.score >= 70 ? "is-good" : employee.score >= 40 ? "is-medium" : ""}`}>{employee.score}</span></td></tr>)}</tbody></table>{!analytics.employeeRows.length && <div className="admin-empty-state">Chưa có nhân viên trong phạm vi báo cáo.</div>}</div>
      </section>
    </>
  );
}

function ReportMetric({ icon, label, value, note }: { icon: string; label: string; value: string; note: string }) {
  return <article><i>{icon}</i><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

function roleLabel(role: string) {
  if (role === "manager") return "Quản lý chi nhánh";
  if (role === "consultant") return "Tư vấn viên";
  if (role === "warranty") return "Nhân viên bảo hành";
  if (role === "repair") return "Nhân viên sửa chữa";
  return "Nhân viên bán hàng";
}

function money(value: number) { return value ? formatMoney(value) : "0đ"; }
