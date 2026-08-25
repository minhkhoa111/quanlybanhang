import Image from "next/image";
import Link from "next/link";
import { getManagedOrders } from "@/db/orders";
import { getManagedProducts } from "@/db/products";
import { formatMoney, orderTotalNumber, productPriceNumber, statusLabel } from "./utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [products, orders] = await Promise.all([
    getManagedProducts(),
    getManagedOrders().catch(() => []),
  ]);
  const delivered = orders.filter((order) => order.status === "delivered");
  const revenue = delivered.reduce((sum, order) => sum + orderTotalNumber(order, products), 0);
  const todayKey = new Date().toLocaleDateString("vi-VN");
  const todayRevenue = delivered
    .filter((order) => new Date(order.createdAt).toLocaleDateString("vi-VN") === todayKey)
    .reduce((sum, order) => sum + orderTotalNumber(order, products), 0);
  const processing = orders.filter((order) => ["pending", "confirmed", "processing", "shipping"].includes(order.status)).length;
  const lowStock = products.filter((product) => (product.stock ?? 0) <= 3).length;
  const topProducts = [...products].sort((a, b) => productPriceNumber(b) - productPriceNumber(a)).slice(0, 5);
  const chartSeed = buildChart(orders, products);

  return (
    <>
      <div className="admin-topline">
        <div><span>Dashboard</span><h1>Tổng quan cửa hàng</h1></div>
        <Link className="admin-button admin-button-primary" href="/admin/products/new">Thêm sản phẩm</Link>
      </div>
      <section className="admin-metrics">
        <Metric label="Tổng doanh thu" value={formatMoney(revenue)} />
        <Metric label="Doanh thu hôm nay" value={formatMoney(todayRevenue)} />
        <Metric label="Tổng đơn hàng" value={String(orders.length)} />
        <Metric label="Đơn đang xử lý" value={String(processing)} />
        <Metric label="Tổng sản phẩm" value={String(products.length)} />
        <Metric label="Sắp hết hàng" value={String(lowStock)} tone={lowStock ? "warn" : "ok"} />
      </section>
      <section className="admin-dashboard-grid">
        <div className="admin-card">
          <div className="admin-card-head"><div><span>Revenue</span><h2>Doanh thu 7 ngày</h2></div></div>
          <div className="admin-chart">
            {chartSeed.map((item) => <div key={item.label} style={{ height: `${Math.max(8, item.percent)}%` }}><span>{formatMoney(item.value)}</span><small>{item.label}</small></div>)}
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-card-head"><div><span>Orders</span><h2>Đơn hàng mới nhất</h2></div><Link href="/admin/orders">Xem tất cả</Link></div>
          <div className="admin-list">
            {orders.slice(0, 6).map((order) => (
              <Link href={`/admin/orders/${order.id}`} key={order.id}>
                <strong>{order.customerName}</strong>
                <span>{order.productName}</span>
                <em className={`admin-badge status-${order.status}`}>{statusLabel(order.status)}</em>
              </Link>
            ))}
            {!orders.length && <p className="admin-empty-state">Chưa có đơn hàng.</p>}
          </div>
        </div>
        <div className="admin-card admin-span-2">
          <div className="admin-card-head"><div><span>Products</span><h2>Sản phẩm bán chạy / giá trị cao</h2></div></div>
          <div className="admin-top-products">
            {topProducts.map((product) => (
              <Link href={`/admin/products/${product.id}`} key={product.id}>
                <Image src={product.image} alt="" width={58} height={58} unoptimized />
                <div><strong>{product.name}</strong><span>{product.sku || product.slug}</span></div>
                <em>{product.salePrice || product.sellingPrice || product.price}</em>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return <article className={`admin-metric ${tone ? `tone-${tone}` : ""}`}><span>{label}</span><strong>{value}</strong></article>;
}

function buildChart(orders: Awaited<ReturnType<typeof getManagedOrders>>, products: Awaited<ReturnType<typeof getManagedProducts>>) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return { label: date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }), key: date.toLocaleDateString("vi-VN"), value: 0 };
  });
  for (const order of orders.filter((item) => item.status === "delivered")) {
    const key = new Date(order.createdAt).toLocaleDateString("vi-VN");
    const day = days.find((item) => item.key === key);
    if (day) day.value += orderTotalNumber(order, products);
  }
  const max = Math.max(1, ...days.map((item) => item.value));
  return days.map((item) => ({ ...item, percent: Math.round((item.value / max) * 100) }));
}
