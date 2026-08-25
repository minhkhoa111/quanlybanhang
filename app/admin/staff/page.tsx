import { requireOwnerPage } from "@/app/admin-auth";
import { getAdminUsers } from "@/db/admin-users";
import { createStaffAction, toggleStaffAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  await requireOwnerPage("/admin/staff");
  const query = await searchParams;
  const users = await getAdminUsers().catch(() => []);

  return (
    <>
      <div className="admin-topline">
        <div><span>Phân quyền chi nhánh</span><h1>Nhân viên quản lý</h1></div>
      </div>

      {query.status === "created" && <p className="admin-alert success">Đã tạo tài khoản nhân viên.</p>}
      {query.status === "updated" && <p className="admin-alert success">Đã cập nhật trạng thái tài khoản.</p>}
      {query.error && <p className="admin-alert error">{query.error}</p>}

      <section className="admin-card admin-staff-create">
        <div className="admin-card-head"><div><span>Tài khoản mới</span><h2>Cấp quyền cho nhân viên</h2></div></div>
        <form action={createStaffAction} className="admin-staff-form">
          <label className="admin-field"><span>Họ và tên</span><input name="name" required placeholder="Nguyễn Văn An" /></label>
          <label className="admin-field"><span>Tên đăng nhập</span><input name="username" required minLength={4} placeholder="nhanvien.quan1" autoComplete="off" /></label>
          <label className="admin-field"><span>Mật khẩu ban đầu</span><input name="password" type="password" required minLength={8} autoComplete="new-password" /></label>
          <label className="admin-field"><span>Vai trò</span><select name="role" defaultValue="staff"><option value="staff">Nhân viên</option><option value="manager">Quản lý chi nhánh</option></select></label>
          <label className="admin-field"><span>Chi nhánh</span><input name="branch" required placeholder="122/4 Cô Giang, Quận 1" /></label>
          <button className="admin-button admin-button-primary" type="submit">Tạo tài khoản</button>
        </form>
      </section>

      <section className="admin-card admin-staff-list">
        <div className="admin-card-head"><div><span>{users.length} tài khoản</span><h2>Danh sách nhân viên</h2></div></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Nhân viên</th><th>Tên đăng nhập</th><th>Vai trò</th><th>Chi nhánh</th><th>Ngày tạo</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>{users.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.name}</strong></td><td>{user.username}</td>
                <td>{user.role === "manager" ? "Quản lý" : "Nhân viên"}</td>
                <td>{user.branch || "Chưa phân chi nhánh"}</td>
                <td>{new Date(user.createdAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</td>
                <td><span className={`admin-badge ${user.active ? "status-active" : "status-inactive"}`}>{user.active ? "Đang hoạt động" : "Đã khóa"}</span></td>
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
