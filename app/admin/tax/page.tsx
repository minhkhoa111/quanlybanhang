import Link from "next/link";
import { requireOwnerPage } from "@/app/admin-auth";
import { orderTotalNumber } from "@/app/admin/utils";
import { getReportingOrders, type ManagedOrder } from "@/db/orders";

export const dynamic = "force-dynamic";

export default async function TaxReportPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireOwnerPage("/admin/tax");
  const query = await searchParams;
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(query.month || "") ? query.month! : currentMonth();
  const orders = (await getReportingOrders().catch(() => [])).filter((order) => monthFor(order.createdAt) === month && order.paymentStatus !== "not_required" && !["cancelled", "returned"].includes(order.status));
  const collected = orders.filter((order) => order.paymentStatus === "paid" || order.status === "delivered");
  const rows = collected.map((order) => ({ order, ...taxFor(order) }));
  const revenue = rows.reduce((sum, row) => sum + row.orderTotal, 0);
  const collectedVat = rows.reduce((sum, row) => sum + row.vat, 0);
  const declaredVat = rows.filter((row) => row.order.invoiceStatus === "issued").reduce((sum, row) => sum + row.vat, 0);
  const pendingRows = rows.filter((row) => row.order.invoiceStatus !== "issued");

  return <>
    <div className="admin-topline"><div><span>Đối soát tài chính</span><h1>Báo cáo thuế doanh nghiệp</h1><p className="admin-subtitle">Tổng hợp doanh thu đã thu, VAT đã ghi nhận và phần hóa đơn cần kiểm tra để khai báo.</p></div></div>
    <form className="admin-report-filters"><label><span>Kỳ báo cáo</span><input type="month" name="month" defaultValue={month}/></label><button className="admin-button admin-button-primary">Lập báo cáo</button></form>
    <section className="admin-report-kpis"><Metric label="Doanh thu đã thu" value={money(revenue)} note={`${rows.length} đơn đủ điều kiện`}/><Metric label="VAT đã thu ước tính" value={money(collectedVat)} note="Theo thuế suất lưu trên đơn"/><Metric label="VAT có hóa đơn đã phát hành" value={money(declaredVat)} note={`${rows.filter((row) => row.order.invoiceStatus === "issued").length} hóa đơn`}/><Metric label="Cần kiểm tra khai báo" value={money(Math.max(0, collectedVat - declaredVat))} note={`${pendingRows.length} đơn chưa phát hành hóa đơn`}/></section>
    <p className="admin-ledger-note"><strong>Lưu ý:</strong> Đây là bảng đối soát nội bộ dựa trên dữ liệu đơn hàng và hóa đơn điện tử đã nhập trong hệ thống, không thay thế tờ khai thuế hoặc tư vấn của kế toán thuế.</p>
    <section className="admin-card admin-report-table-card"><div className="admin-card-head"><div><span>{monthLabel(month)} · {rows.length} giao dịch</span><h2>Chi tiết thuế đầu ra</h2></div><small>Loại trừ đơn tại cửa hàng chưa thanh toán, đơn hủy và hoàn trả</small></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Đơn hàng</th><th>Ngày thu</th><th>Chi nhánh</th><th>Doanh thu</th><th>Thuế suất</th><th>Giá chưa VAT</th><th>VAT ước tính</th><th>Hóa đơn</th><th>Kiểm tra</th></tr></thead><tbody>{rows.map(({ order, orderTotal, taxable, vat }) => <tr key={order.id}><td><strong>{order.orderCode}</strong><span>{order.customerName}</span></td><td>{new Date(order.createdAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</td><td>{order.branchName || "Chưa phân bổ"}</td><td><strong>{money(orderTotal)}</strong></td><td>{order.invoiceTaxRate}% {order.invoiceTaxIncluded ? "(đã gồm)" : "(chưa gồm)"}</td><td>{money(taxable)}</td><td><strong>{money(vat)}</strong></td><td><span className={`admin-badge ${order.invoiceStatus === "issued" ? "status-active" : "status-inactive"}`}>{invoiceLabel(order.invoiceStatus)}</span></td><td><Link className="admin-table-link" href={`/admin/orders/${order.id}`}>Mở đơn</Link></td></tr>)}</tbody></table>{!rows.length && <div className="admin-empty-state">Chưa có giao dịch đã thu trong kỳ báo cáo này.</div>}</div></section>
  </>;
}

function taxFor(order: ManagedOrder) { const orderTotal = orderTotalNumber(order); const rate = Math.max(0, order.invoiceTaxRate); const taxable = rate > 0 && order.invoiceTaxIncluded ? Math.round(orderTotal / (1 + rate / 100)) : orderTotal; const vat = rate > 0 ? order.invoiceTaxIncluded ? orderTotal - taxable : Math.round(taxable * rate / 100) : 0; return { orderTotal, taxable, vat }; }
function Metric({ label, value, note }: { label: string; value: string; note: string }) { return <article><i>％</i><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>; }
function monthFor(timestamp: number) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit" }).format(new Date(timestamp)); }
function currentMonth() { return monthFor(Date.now()); }
function monthLabel(value: string) { const [year, month] = value.split("-"); return `Tháng ${Number(month)}/${year}`; }
function money(value: number) { return `${Math.max(0, Math.round(value)).toLocaleString("vi-VN")}đ`; }
function invoiceLabel(value: string) { if (value === "issued") return "Đã phát hành"; if (value === "draft") return "Bản nháp"; if (value === "cancelled") return "Đã hủy"; return "Chưa tạo"; }
