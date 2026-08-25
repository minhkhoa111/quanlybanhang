import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { requireAdminPage } from "@/app/admin-auth";
import AdminNavigation from "./AdminNavigation";
import { logoutAdminAction } from "@/app/admin-login/actions";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage("/admin");

  return (
    <main className="admin-console">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand"><span className="admin-brand-mark"><Image src="/huy-apple-logo.png" alt="" width={42} height={42} unoptimized /></span><div><strong>Huy Apple</strong><small>Business Management</small></div></Link>
        <AdminNavigation role={user.role} />
        <div className="admin-user-summary"><span className="admin-user-avatar">{user.name.charAt(0).toUpperCase()}</span><div><strong>{user.name}</strong><span>{roleLabel(user.role)} · {user.branch}</span></div></div>
        <div className="admin-sidebar-actions">
          <Link href="/" className="admin-store-link">↗ Xem cửa hàng</Link>
          <form action={logoutAdminAction}><button type="submit">⇥ Đăng xuất</button></form>
        </div>
      </aside>
      <section className="admin-content">
        <header className="admin-mobile-header">
          <Link href="/admin"><span><Image src="/huy-apple-logo.png" alt="" width={28} height={28} unoptimized /></span><strong>Huy Apple</strong></Link>
          <div><p><strong>{user.name}</strong><small>{roleLabel(user.role)} · {user.branch}</small></p><form action={logoutAdminAction}><button type="submit">Đăng xuất</button></form></div>
        </header>
        {children}
      </section>
      <nav className="admin-mobile-nav" aria-label="Quản lý nhanh">
        <Link href="/admin"><span aria-hidden="true">⌂</span>Tổng quan</Link>
        <Link href="/admin/products"><span aria-hidden="true">▦</span>Sản phẩm</Link>
        <Link href="/admin/live-chat" className="admin-mobile-add"><span aria-hidden="true">✦</span>Tư vấn</Link>
        <Link href="/admin/orders"><span aria-hidden="true">▤</span>Đơn hàng</Link>
        <Link href="/admin/customers"><span aria-hidden="true">♙</span>Khách hàng</Link>
      </nav>
    </main>
  );
}

function roleLabel(role:string){if(role==="owner")return "Chủ cửa hàng";if(role==="manager")return "Quản lý";if(role==="consultant")return "Tư vấn viên";return "Nhân viên bán hàng"}
