import { requireOwnerPage } from "@/app/admin-auth";
import { getAdminUsers } from "@/db/admin-users";
import { createStaffAction, toggleStaffAction } from "./actions";
import { getBranches } from "@/db/branches";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  await requireOwnerPage("/admin/staff");
  const query = await searchParams;
  const [users,branches] = await Promise.all([getAdminUsers().catch(() => []),getBranches(false).catch(()=>[])]);

  return (
    <>
      <div className="admin-topline">
        <div><span>Đội ngũ cửa hàng</span><h1>Tài khoản nhân viên</h1><p className="admin-subtitle">Tạo tài khoản đăng nhập, phân quyền và phân chi nhánh cho nhân viên.</p></div>
        <Link className="admin-button" href="/admin/hr">Hồ sơ nhân sự</Link>
      </div>

      {query.status === "created" && <p className="admin-alert success">Đã tạo tài khoản nhân viên.</p>}
      {query.status === "updated" && <p className="admin-alert success">Đã cập nhật trạng thái tài khoản.</p>}
      {query.error && <p className="admin-alert error">{query.error}</p>}
      {!branches.length && <p className="admin-alert error">Bạn cần <Link href="/admin/branches"><strong>tạo chi nhánh</strong></Link> trước khi thêm nhân viên.</p>}

      <section className="admin-branch-summary admin-staff-summary">
        <article><span>Đang hoạt động</span><strong>{users.filter((user) => user.active).length}</strong></article>
        <article><span>Quản lý chi nhánh</span><strong>{users.filter((user) => user.role === "manager" && user.active).length}</strong></article>
        <article><span>Nhân viên bán hàng</span><strong>{users.filter((user) => user.role === "sales" && user.active).length}</strong></article>
        <article><span>Nhân viên tư vấn</span><strong>{users.filter((user) => user.role === "consultant" && user.active).length}</strong></article>
        <article><span>Nhân viên bảo hành</span><strong>{users.filter((user) => user.role === "warranty" && user.active).length}</strong></article>
        <article><span>Nhân viên sửa chữa</span><strong>{users.filter((user) => user.role === "repair" && user.active).length}</strong></article>
      </section>

      <section className="admin-card admin-staff-create">
        <div className="admin-card-head"><div><span>Tài khoản mới</span><h2>Cấp quyền cho nhân viên</h2></div></div>
        <form action={createStaffAction} className="admin-staff-form">
          <input type="hidden" name="returnTo" value="/admin/staff" />
          <label className="admin-field"><span>Họ và tên</span><input name="name" required placeholder="Nguyễn Văn An" /></label>
          <label className="admin-field"><span>Tên đăng nhập</span><input name="username" required minLength={4} placeholder="nhanvien.quan1" autoComplete="off" /></label>
          <label className="admin-field"><span>Mật khẩu ban đầu</span><input name="password" type="password" required minLength={8} autoComplete="new-password" /></label>
          <label className="admin-field"><span>Vai trò</span><select name="role" defaultValue="sales"><option value="sales">Nhân viên bán hàng</option><option value="consultant">Nhân viên tư vấn</option><option value="warranty">Nhân viên bảo hành</option><option value="repair">Nhân viên sửa chữa</option><option value="manager">Quản lý chi nhánh</option></select></label>
          <label className="admin-field"><span>Chi nhánh</span><select name="branchId" required defaultValue=""><option value="" disabled>Chọn chi nhánh</option>{branches.map(branch=><option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
          <button className="admin-button admin-button-primary" type="submit" disabled={!branches.length}>Tạo tài khoản</button>
        </form>
        <p className="admin-form-note">Nhân viên bảo hành và sửa chữa luôn được hệ thống đưa về Trung tâm bảo hành sửa chữa Apple.</p>
      </section>

      <section className="admin-card admin-staff-list">
        <div className="admin-card-head"><div><span>{users.length} tài khoản</span><h2>Danh sách nhân viên</h2></div></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Nhân viên</th><th>Tên đăng nhập</th><th>Vai trò</th><th>Chi nhánh</th><th>Ngày tạo</th><th>Trạng thái</th><th>Hồ sơ</th><th>Thao tác</th></tr></thead>
            <tbody>{users.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.name}</strong></td><td>{user.username}</td>
                <td>{roleLabel(user.role)}</td>
                <td>{branches.find(branch=>branch.id===user.branchId)?.name||user.branch||"Chưa phân chi nhánh"}</td>
                <td>{new Date(user.createdAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</td>
                <td><span className={`admin-badge ${user.active ? "status-active" : "status-inactive"}`}>{user.active ? "Đang hoạt động" : "Đã khóa"}</span></td>
                <td><Link className="admin-table-link" href={`/admin/hr/${user.id}`}>Cập nhật</Link></td>
                <td><form action={toggleStaffAction}><input type="hidden" name="id" value={user.id} /><input type="hidden" name="active" value={String(!user.active)} /><button className={`admin-button ${user.active ? "admin-button-danger" : "admin-button-muted"}`} type="submit">{user.active ? "Khóa" : "Mở khóa"}</button></form></td>
              </tr>
            ))}</tbody>
          </table>
          {!users.length && <div className="admin-empty-state">Chưa có tài khoản nhân viên. Hãy tạo tài khoản đầu tiên ở biểu mẫu phía trên.</div>}
        </div>
      </section>
    </>
  );
}

function roleLabel(role:string){if(role==="manager")return "Quản lý chi nhánh";if(role==="consultant")return "Nhân viên tư vấn";if(role==="warranty")return "Nhân viên bảo hành";if(role==="repair")return "Nhân viên sửa chữa";if(role==="owner")return "Giám đốc";return "Nhân viên bán hàng"}
