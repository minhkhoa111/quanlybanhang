import Link from "next/link";
import { getManagedOrders } from "@/db/orders";
import { getManagedProducts } from "@/db/products";
import { formatDate, formatMoney, orderTotalNumber, statusLabel } from "../utils";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; paymentStatus?: string; paymentMethod?: string; from?: string; to?: string }>;
}) {
  const query = await searchParams;
  const [orders, products] = await Promise.all([getManagedOrders().catch(() => []), getManagedProducts()]);
  const visible = filterOrders(orders, query);
  const paymentMethods = [...new Set(orders.map((order) => order.paymentMethod).filter(Boolean))];

  return (
    <>
      <div className="admin-topline">
        <div><span>Đơn hàng</span><h1>Quản lý đơn hàng</h1></div>
      </div>
      <form className="admin-toolbar">
        <input name="q" defaultValue={query.q} placeholder="Mã đơn, khách hàng, số điện thoại..." />
        <select name="status" defaultValue={query.status ?? ""}><option value="">Tất cả trạng thái</option>{["pending", "confirmed", "processing", "shipping", "delivered", "cancelled", "returned"].map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select>
        <select name="paymentStatus" defaultValue={query.paymentStatus ?? ""}><option value="">Thanh toán</option>{["unpaid", "paid", "refunded", "failed"].map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select>
        <select name="paymentMethod" defaultValue={query.paymentMethod ?? ""}><option value="">Phương thức</option>{paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}</select>
        <input type="date" name="from" defaultValue={query.from} />
        <input type="date" name="to" defaultValue={query.to} />
        <button className="admin-button" type="submit">Lọc</button>
      </form>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Order ID</th><th>Customer</th><th>Products</th><th>Total</th><th>Payment</th><th>Payment status</th><th>Order status</th><th>Hóa đơn</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {visible.map((order) => (
              <tr key={order.id}>
                <td><strong>{order.orderCode}</strong><span>#{order.id.slice(0, 8)}</span></td>
                <td><strong>{order.customerName}</strong><span>{order.phone}</span></td>
                <td>{order.items.length > 1 ? `${order.items.length} dòng sản phẩm` : order.productName}<span>{order.quantity} sản phẩm{order.voucherCode ? ` · Voucher ${order.voucherCode}` : ""}</span></td>
                <td>{formatMoney(orderTotalNumber(order, products))}</td>
                <td>{order.paymentMethod || "Chưa chọn"}{order.financeCompany && <span>{order.financeCompany} · {order.installmentTerm} tháng</span>}</td>
                <td><span className={`admin-badge status-${order.paymentStatus}`}>{statusLabel(order.paymentStatus)}</span></td>
                <td><span className={`admin-badge status-${order.status}`}>{statusLabel(order.status)}</span></td>
                <td><span className={`admin-badge invoice-${order.invoiceStatus}`}>{invoiceStatusLabel(order.invoiceStatus)}</span></td>
                <td>{formatDate(order.createdAt)}</td>
                <td><Link className="admin-table-link" href={`/admin/orders/${order.id}`}>Chi tiết</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && <div className="admin-empty-state">Không có đơn hàng phù hợp bộ lọc.</div>}
      </div>
    </>
  );
}

function invoiceStatusLabel(status: string) {
  if (status === "draft") return "Bản nháp";
  if (status === "ready") return "Sẵn sàng";
  if (status === "issued") return "Đã xuất";
  if (status === "cancelled") return "Đã hủy";
  return "Chưa lập";
}

function filterOrders(orders: Awaited<ReturnType<typeof getManagedOrders>>, query: { q?: string; status?: string; paymentStatus?: string; paymentMethod?: string; from?: string; to?: string }) {
  const q = query.q?.trim().toLowerCase();
  return orders.filter((order) => {
    const matchesSearch = !q || [order.id, order.orderCode, order.customerName, order.phone].some((value) => value.toLowerCase().includes(q));
    const matchesStatus = !query.status || order.status === query.status;
    const matchesPaymentStatus = !query.paymentStatus || order.paymentStatus === query.paymentStatus;
    const matchesPayment = !query.paymentMethod || order.paymentMethod === query.paymentMethod;
    const created = new Date(order.createdAt).getTime();
    const from = query.from ? new Date(query.from).getTime() : 0;
    const to = query.to ? new Date(query.to).getTime() + 86_399_999 : Number.POSITIVE_INFINITY;
    return matchesSearch && matchesStatus && matchesPaymentStatus && matchesPayment && created >= from && created <= to;
  });
}
