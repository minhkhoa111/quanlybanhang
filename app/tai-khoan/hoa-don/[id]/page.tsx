import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentCustomer } from "@/app/customer-auth";
import { getCustomerOrderById } from "@/db/orders";
import DocumentStamp from "@/app/components/DocumentStamp";
import MemberPrintButton from "./MemberPrintButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Hóa đơn & bảo hành member", robots: { index: false, follow: false } };

export default async function MemberInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const customer = await currentCustomer();
  if (!customer) redirect("/tai-khoan");
  const { id } = await params;
  const order = await getCustomerOrderById(id, customer.id);
  if (!order) notFound();

  const items = order.items.length ? order.items : [{ productSlug: order.productSlug, productName: order.productName, ram: "", storage: order.storage, color: order.color, quantity: order.quantity, unitPrice: Number(order.total) / Math.max(1, order.quantity), image: "" }];
  const startDate = order.warrantyStartDate || order.invoiceDate;
  const endDate = warrantyEndDate(startDate, order.warrantyMonths);

  return <main className="member-invoice-page shell">
    <div className="member-invoice-toolbar"><Link href="/tai-khoan">← Tài khoản member</Link><MemberPrintButton /></div>
    <article className="member-invoice-document">
      <header><div><span>INFINITY COMPANY</span><h1>Hóa đơn mua hàng</h1><p>Thông tin điện tử được lưu theo tài khoản member</p></div><dl><div><dt>Mã đơn</dt><dd>{order.orderCode}</dd></div><div><dt>Số hóa đơn</dt><dd>{order.invoiceNumber || "Chưa phát hành"}</dd></div><div><dt>Ngày</dt><dd>{formatDate(order.invoiceDate || new Date(order.createdAt).toISOString().slice(0, 10))}</dd></div></dl></header>
      {order.invoiceStatus === "not_created" && <p className="member-invoice-pending">Cửa hàng chưa phát hành hóa đơn. Thông tin đơn mua và bảo hành vẫn được lưu trong tài khoản của bạn.</p>}
      <section className="member-invoice-parties"><div><span>Bên bán</span><strong>{order.invoiceSellerName || "INFINITY COMPANY"}</strong><p>{order.invoiceSellerAddress || "122/4 Cô Giang, P. Cầu Kiệu, TP.HCM"}</p><p>{order.invoiceSellerPhone || "02879797999"}</p></div><div><span>Người mua</span><strong>{order.invoiceCompanyName || order.invoiceBuyerName || order.customerName}</strong><p>{order.invoiceAddress || order.address || "Nhận tại cửa hàng"}</p><p>{order.invoiceEmail || order.email}</p></div></section>
      <div className="member-invoice-table-wrap"><table><thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>{items.map((item, index) => <tr key={`${item.productSlug}-${index}`}><td><strong>{item.productName}</strong><small>{[item.ram && `RAM ${item.ram}`, item.storage, item.color].filter(Boolean).join(" · ")}</small></td><td>{item.quantity}</td><td>{formatMoney(item.unitPrice)}</td><td>{formatMoney(item.unitPrice * item.quantity)}</td></tr>)}</tbody></table></div>
      <section className="member-invoice-total"><span>Tổng thanh toán</span><strong>{formatMoney(Number(order.total))}</strong></section>
      {order.paymentStatus === "paid" && <div className="document-stamp-row member-invoice-stamp"><DocumentStamp kind="collected" date={formatDate(order.invoiceDate || new Date(order.createdAt).toISOString().slice(0, 10))} /></div>}
      <section className="member-invoice-warranty"><header><div><span>Bảo hành điện tử</span><h2>{startDate ? "Đã ghi nhận bảo hành" : "Chờ cửa hàng kích hoạt"}</h2></div><b>{order.warrantyMonths || 12} tháng</b></header><div className="member-invoice-warranty-grid"><p><span>Bắt đầu</span><strong>{formatDate(startDate) || "Chưa cập nhật"}</strong></p><p><span>Hết hạn</span><strong>{formatDate(endDate) || "Chưa xác định"}</strong></p><p><span>Serial / IMEI</span><strong>{order.warrantySerials || "Chưa cập nhật"}</strong></p><p><span>Nơi tiếp nhận</span><strong>{order.branchName || "Infinity Company"}</strong></p></div><p className="member-invoice-policy">{order.warrantyPolicy || "Sản phẩm được bảo hành theo chính sách nhà sản xuất hoặc nhà cung cấp. Vui lòng mang theo sản phẩm và mã đơn hàng khi cần hỗ trợ."}</p></section>
      <footer><p>Hóa đơn và bảo hành này chỉ hiển thị cho tài khoản member sở hữu đơn hàng.</p><Link href="/bao-hanh">Tra cứu bảo hành bằng mã đơn →</Link></footer>
    </article>
  </main>;
}

function formatMoney(value: number) { return `${Math.max(0, Math.round(value || 0)).toLocaleString("vi-VN")}đ`; }
function formatDate(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return ""; return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)); }
function warrantyEndDate(startDate: string, months: number) { if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || months <= 0) return ""; const date = new Date(`${startDate}T00:00:00Z`); date.setUTCMonth(date.getUTCMonth() + months); return date.toISOString().slice(0, 10); }
