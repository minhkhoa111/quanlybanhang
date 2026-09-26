import type { Metadata } from "next";
import Link from "next/link";
import { portalPathForRole, requireAdminPage } from "@/app/admin-auth";
import InfinityBrandMark from "@/app/components/InfinityBrandMark";
import RoleCrownAvatar from "@/app/components/RoleCrownAvatar";
import AdminNavigation from "./AdminNavigation";
import AdminMobileOrbitNav from "@/app/components/AdminMobileOrbitNav";
import { logoutAdminAction } from "@/app/admin-login/actions";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage("/admin");
  const portalHome = portalPathForRole(user.role);

  return (
    <main className="admin-console">
      <aside className="admin-sidebar">
        <Link href={portalHome} className="admin-brand"><span className="admin-brand-mark"><InfinityBrandMark size={44} /></span><div><strong>Infinity Company</strong><small>Business Management</small></div></Link>
        <AdminNavigation role={user.role} homeHref={portalHome} />
        <div className="admin-user-summary"><RoleCrownAvatar role={user.role} /><div><strong>{user.name}</strong><span>{roleLabel(user.role)} · {user.branch}</span></div></div>
        <div className="admin-sidebar-actions">
          <Link href="/" className="admin-store-link">↗ Xem cửa hàng</Link>
          <form action={logoutAdminAction}><button type="submit">⇥ Đăng xuất</button></form>
        </div>
      </aside>
      <section className="admin-content">
        <header className="admin-commandbar">
          <div><i aria-hidden="true" /><span>Infinity Retail Operations</span><b>{user.branch || "Toàn hệ thống"}</b></div>
          <nav aria-label="Tiện ích quản trị">
            {(user.role === "owner" || user.role === "manager") && <Link href="/admin/reports">Báo cáo điều hành</Link>}
            <span>{roleLabel(user.role)}</span>
          </nav>
        </header>
        <header className="admin-mobile-header">
          <Link href={portalHome}><span><InfinityBrandMark compact /></span><strong>Infinity Company</strong></Link>
          <div><p><strong>{user.name}</strong><small>{roleLabel(user.role)} · {user.branch}</small></p><form action={logoutAdminAction}><button type="submit">Đăng xuất</button></form></div>
        </header>
        {children}
      </section>
      <AdminMobileOrbitNav role={user.role} homeHref={portalHome} />
    </main>
  );
}

function roleLabel(role:string){if(role==="owner")return "Giám đốc";if(role==="manager")return "Quản lý";if(role==="consultant")return "Tư vấn viên";if(role==="warranty")return "Nhân viên bảo hành";if(role==="repair")return "Nhân viên sửa chữa";if(role==="inventory")return "Nhân viên kho";return "Nhân viên bán hàng"}
