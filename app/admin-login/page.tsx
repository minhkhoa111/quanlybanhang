import type { Metadata } from "next";
import Link from "next/link";
import { currentAdminUser } from "@/app/admin-auth";
import { redirect } from "next/navigation";
import { loginAdminAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Đăng nhập quản trị",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string; status?: string }>;
}) {
  const currentUser = await currentAdminUser();
  if (currentUser) redirect(currentUser.role === "owner" ? "/admin" : currentUser.role === "manager" ? "/manger" : "/staff");
  const query = await searchParams;
  const returnTo = query.returnTo?.startsWith("/admin") ? query.returnTo : "/admin";

  return (
    <main className="admin-login-page shell">
      <section className="admin-login-shell">
        <aside className="admin-login-intro">
          <Link href="/" className="admin-login-brand"><span>H</span><div><strong>Huy Apple</strong><small>Retail Console</small></div></Link>
          <div>
            <p className="eyebrow">Cổng vận hành nội bộ</p>
            <h1>Quản lý cửa hàng ở một nơi.</h1>
            <p>Đơn hàng, sản phẩm, khách hàng, tư vấn trực tiếp, nhân sự và camera chi nhánh được bảo vệ theo từng vai trò.</p>
          </div>
          <ul>
            <li><i>✓</i><span><strong>Giám đốc</strong><small>Quản lý toàn bộ chi nhánh và phân quyền nhân viên</small></span></li>
            <li><i>✓</i><span><strong>Nhân viên cửa hàng</strong><small>Chỉ sử dụng chức năng và dữ liệu được phép truy cập</small></span></li>
          </ul>
          <p className="admin-login-secure"><i /> Phiên đăng nhập được bảo vệ bằng cookie HTTP-only</p>
        </aside>

        <div className="admin-login-panel">
          <div>
            <p className="eyebrow">Giám đốc &amp; nhân viên</p>
            <h2>Đăng nhập</h2>
            <p>Sử dụng tài khoản quản trị hoặc tài khoản nhân viên do Giám đốc cấp.</p>
          </div>

          {query.status === "signed-out" && (
            <p className="admin-notice admin-login-success">Bạn đã đăng xuất an toàn khỏi hệ thống.</p>
          )}
          {query.error === "invalid" && (
            <p className="admin-notice admin-error">Tên đăng nhập hoặc mật khẩu chưa đúng, hoặc tài khoản đã bị khóa.</p>
          )}

          <form action={loginAdminAction} className="admin-login-form">
            <input type="hidden" name="returnTo" value={returnTo} />
            <label>
              <span>Tên đăng nhập</span>
              <input name="username" type="text" autoComplete="username" placeholder="Nhập tên đăng nhập" required autoFocus />
            </label>
            <label>
              <span>Mật khẩu</span>
              <input name="password" type="password" autoComplete="current-password" placeholder="Nhập mật khẩu" required />
            </label>
            <button type="submit" className="button button-primary">Đăng nhập hệ thống <span>→</span></button>
          </form>

          <div className="admin-login-help"><span>Nhân viên chưa có tài khoản?</span><small>Liên hệ Giám đốc để được tạo tài khoản và phân chi nhánh.</small></div>
          <Link className="text-link admin-login-back" href="/">← Quay lại cửa hàng</Link>
        </div>
      </section>
    </main>
  );
}
