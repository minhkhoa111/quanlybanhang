import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/app/admin-auth";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const nav = [
  ["Dashboard", "/admin"],
  ["Sản phẩm", "/admin/products"],
  ["Danh mục", "/admin/products?group=categories"],
  ["Đơn hàng", "/admin/orders"],
  ["Khách hàng", "/admin/customers"],
  ["Nhân viên", "/admin/staff"],
  ["Kho hàng", "/admin/products?stock=low"],
  ["Voucher", "/admin/vouchers"],
  ["Thêm sản phẩm", "/admin/products/new"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage("/admin");

  return (
    <main className="admin-console">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand"><strong>Huy</strong><span>Admin</span></Link>
        <nav>
          {nav
            .filter(([label]) => label !== "Nhân viên" || user.role === "owner")
            .map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}
        </nav>
        <div className="admin-user-summary"><strong>{user.name}</strong><span>{user.branch}</span></div>
        <Link href="/" className="admin-store-link">Xem cửa hàng</Link>
      </aside>
      <section className="admin-content">{children}</section>
      <nav className="admin-mobile-nav" aria-label="Quản lý nhanh">
        <Link href="/admin"><span aria-hidden="true">⌂</span>Tổng quan</Link>
        <Link href="/admin/products"><span aria-hidden="true">▦</span>Sản phẩm</Link>
        <Link href="/admin/products/new" className="admin-mobile-add"><span aria-hidden="true">＋</span>Thêm mới</Link>
        <Link href="/admin/orders"><span aria-hidden="true">▤</span>Đơn hàng</Link>
        <Link href="/admin/customers"><span aria-hidden="true">♙</span>Khách hàng</Link>
      </nav>
    </main>
  );
}
