import type { Metadata } from "next";
import Link from "next/link";
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
  const query = await searchParams;
  const returnTo = query.returnTo?.startsWith("/admin") ? query.returnTo : "/admin";

  return (
    <main className="admin-login-page shell">
      <section className="admin-login-panel">
        <div>
          <p className="eyebrow">Huy Apple Admin</p>
          <h1>Đăng nhập quản trị</h1>
          <p>Đăng nhập bằng tài khoản chủ cửa hàng hoặc tài khoản nhân viên được cấp.</p>
        </div>

        {query.status === "signed-out" && (
          <p className="admin-notice">Bạn đã đăng xuất khỏi trang quản trị.</p>
        )}
        {query.error === "invalid" && (
          <p className="admin-notice admin-error">Tên đăng nhập hoặc mật khẩu chưa đúng.</p>
        )}

        <form action={loginAdminAction} className="admin-login-form">
          <input type="hidden" name="returnTo" value={returnTo} />
          <label>
            Tên đăng nhập
            <input name="username" type="text" autoComplete="username" placeholder="admin hoặc tài khoản nhân viên" required autoFocus />
          </label>
          <label>
            Mật khẩu
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button type="submit" className="button button-primary">Đăng nhập</button>
        </form>

        <Link className="text-link" href="/">Quay lại cửa hàng</Link>
      </section>
    </main>
  );
}
