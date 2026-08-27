import Link from "next/link";
import type { AdminUser } from "@/db/admin-users";
import InfinityBrandMark from "@/app/components/InfinityBrandMark";
import { portalPathForRole } from "@/app/admin-auth";
import { logoutAdminAction } from "@/app/admin-login/actions";
import AdminNavigation from "@/app/admin/AdminNavigation";

export default function BusinessPortalShell({ user, children }: { user: AdminUser; children: React.ReactNode }) {
  const home = portalPathForRole(user.role);
  return <main className="admin-console role-unified-console">
    <aside className="admin-sidebar">
      <Link href={home} className="admin-brand"><span className="admin-brand-mark"><InfinityBrandMark compact /></span><div><strong>Infinity Company</strong><small>{user.role === "manager" ? "Cổng quản lý chi nhánh" : "Cổng làm việc nhân viên"}</small></div></Link>
      <AdminNavigation role={user.role} homeHref={home} />
      <div className="admin-user-summary"><span className="admin-user-avatar">{user.name.charAt(0).toUpperCase()}</span><div><strong>{user.name}</strong><span>{roleLabel(user.role)} · {user.branch}</span></div></div>
      <div className="admin-sidebar-actions"><Link href="/" className="admin-store-link">↗ Xem cửa hàng</Link><form action={logoutAdminAction}><button type="submit">⇥ Đăng xuất</button></form></div>
    </aside>
    <section className="admin-content role-unified-content">
      <header className="admin-mobile-header">
        <Link href={home}><span><InfinityBrandMark compact /></span><strong>Infinity Company</strong></Link>
        <div><p><strong>{user.name}</strong><small>{roleLabel(user.role)} · {user.branch}</small></p><form action={logoutAdminAction}><button type="submit">Đăng xuất</button></form></div>
      </header>
      {children}
    </section>
    <nav className="admin-mobile-nav" aria-label="Truy cập nhanh">
      <Link href={home}><span aria-hidden="true">⌂</span>Tổng quan</Link>
      <Link href="/admin/attendance" className="admin-mobile-add"><span aria-hidden="true">◎</span>Chấm công</Link>
      {user.role === "consultant" ? <Link href="/admin/live-chat"><span aria-hidden="true">✦</span>Tư vấn</Link> : <Link href="/admin/orders"><span aria-hidden="true">▤</span>Công việc</Link>}
    </nav>
  </main>;
}

function roleLabel(role: string) { if (role === "manager") return "Quản lý chi nhánh"; if (role === "consultant") return "Nhân viên tư vấn"; if (role === "warranty") return "Nhân viên bảo hành"; if (role === "repair") return "Nhân viên sửa chữa"; return "Nhân viên bán hàng"; }
