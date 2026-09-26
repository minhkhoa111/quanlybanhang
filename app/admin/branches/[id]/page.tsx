import Link from "next/link";
import { notFound } from "next/navigation";
import { canManageEmployee, requireHrManagerPage } from "@/app/admin-auth";
import { getAdminUsers } from "@/db/admin-users";
import { getBranchById } from "@/db/branches";
import { createStaffAction } from "@/app/admin/staff/actions";
import { updateBranchAction } from "@/app/admin/branches/actions";

export const dynamic = "force-dynamic";

export default async function BranchPeoplePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; status?: string }> }) {
  const [{ id }, query, actor] = await Promise.all([params, searchParams, requireHrManagerPage("/admin/branches")]);
  const branch = await getBranchById(id).catch(() => undefined);
  if (!branch || (actor.role === "manager" && actor.branchId !== branch.id)) notFound();
  const employees = (await getAdminUsers().catch(() => [])).filter((employee) => employee.branchId === branch.id && canManageEmployee(actor, employee));
  const isServiceBranch = branch.code.toUpperCase().startsWith("BH") || branch.name.toLocaleUpperCase("vi-VN").includes("BẢO HÀNH");

  return <>
    <div className="admin-topline"><div><span>{branch.code} · {branch.active ? "Đang hoạt động" : "Tạm ngưng"}</span><h1>{branch.name}</h1><p className="admin-subtitle">{branch.address} · {branch.hours}</p></div><Link className="admin-button" href={actor.role === "owner" ? "/admin/branches" : "/manager"}>← Quay lại</Link></div>
    {query.status === "created" && <p className="admin-alert success">Đã thêm nhân sự vào {branch.name}.</p>}
    {query.status === "updated" && <p className="admin-alert success">Đã cập nhật thông tin chi nhánh {branch.name}.</p>}
    {query.error && <p className="admin-alert error">{query.error}</p>}
    {!branch.active && <p className="admin-alert error">Chi nhánh đang tạm ngưng. Chỉ có thể thêm nhân sự khi chi nhánh hoạt động.</p>}

    <section className="admin-branch-summary"><article><span>Tổng nhân sự</span><strong>{employees.length}</strong></article><article><span>Đang làm việc</span><strong>{employees.filter((item) => item.active).length}</strong></article><article><span>Nhân sự cấp dưới</span><strong>{employees.filter((item) => item.role !== "manager").length}</strong></article></section>

    {actor.role === "owner" && <section className="admin-card admin-branch-edit">
      <div className="admin-card-head"><div><span>Thông tin chi nhánh</span><h2>Chỉnh sửa tên và thông tin cửa hàng</h2></div><small>Thay đổi tên sẽ được đồng bộ sang nhân sự và dữ liệu vận hành liên quan.</small></div>
      <form action={updateBranchAction} className="admin-branch-edit-form">
        <input type="hidden" name="id" value={branch.id}/>
        <label className="admin-field"><span>Mã chi nhánh</span><input name="code" required minLength={2} maxLength={20} defaultValue={branch.code}/></label>
        <label className="admin-field"><span>Tên chi nhánh</span><input name="name" required minLength={2} maxLength={100} defaultValue={branch.name}/></label>
        <label className="admin-field admin-branch-edit-address"><span>Địa chỉ</span><input name="address" required minLength={5} maxLength={180} defaultValue={branch.address}/></label>
        <label className="admin-field"><span>Điện thoại</span><input name="phone" inputMode="tel" maxLength={15} defaultValue={branch.phone}/></label>
        <label className="admin-field"><span>Giờ hoạt động</span><input name="hours" maxLength={30} defaultValue={branch.hours}/></label>
        <button className="admin-button admin-button-primary" type="submit">Lưu thông tin chi nhánh</button>
      </form>
    </section>}

    <section className="admin-card admin-staff-create" id="branch-staff">
      <div className="admin-card-head"><div><span>Tạo tại chi nhánh</span><h2>Thêm nhân sự mới</h2></div><small>{actor.role === "manager" ? "Quản lý chỉ được tạo tài khoản cấp dưới" : "Giám đốc được tạo mọi vai trò"}</small></div>
      <form action={createStaffAction} className="admin-staff-form">
        <input type="hidden" name="branchId" value={branch.id}/><input type="hidden" name="returnTo" value={`/admin/branches/${branch.id}`}/>
        <label className="admin-field"><span>Họ và tên</span><input name="name" required placeholder="Nguyễn Văn An"/></label>
        <label className="admin-field"><span>Tên đăng nhập</span><input name="username" required minLength={4} placeholder="nhanvien.chinhanh" autoComplete="off"/></label>
        <label className="admin-field"><span>Mật khẩu ban đầu</span><input name="password" type="password" required minLength={8} autoComplete="new-password"/></label>
        <label className="admin-field"><span>Vai trò</span><select name="role" defaultValue={isServiceBranch ? "warranty" : "sales"}>{!isServiceBranch && <option value="sales">Nhân viên bán hàng</option>}{!isServiceBranch && <option value="consultant">Nhân viên tư vấn</option>}<option value="inventory">Nhân viên kho · kiểm tra &amp; xuất nhập hàng</option>{isServiceBranch && <option value="warranty">Nhân viên bảo hành</option>}{isServiceBranch && <option value="repair">Nhân viên sửa chữa</option>}{actor.role === "owner" && <option value="manager">Quản lý chi nhánh</option>}</select></label>
        <label className="admin-field"><span>Chi nhánh</span><input value={branch.name} disabled/></label>
        <button className="admin-button admin-button-primary" type="submit" disabled={!branch.active}>Tạo tài khoản</button>
      </form>
    </section>

    <section className="admin-card admin-staff-list"><div className="admin-card-head"><div><span>{employees.length} tài khoản</span><h2>Nhân sự tại chi nhánh</h2></div><Link className="admin-button" href="/admin/hr">Mở hồ sơ nhân sự</Link></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Nhân viên</th><th>Tài khoản</th><th>Vai trò</th><th>Trạng thái</th><th>Ngày tạo</th><th>Hồ sơ</th></tr></thead><tbody>{employees.map((employee) => <tr key={employee.id}><td><strong>{employee.name}</strong></td><td>@{employee.username}</td><td>{roleLabel(employee.role)}</td><td><span className={`admin-badge ${employee.active ? "status-active" : "status-inactive"}`}>{employee.active ? "Đang hoạt động" : "Đã khóa"}</span></td><td>{new Date(employee.createdAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</td><td><Link className="admin-table-link" href={`/admin/hr/${employee.id}`}>Cập nhật</Link></td></tr>)}</tbody></table>{!employees.length && <div className="admin-empty-state">Chi nhánh chưa có nhân sự.</div>}</div></section>
  </>;
}

function roleLabel(role: string) { if (role === "manager") return "Quản lý chi nhánh"; if (role === "consultant") return "Nhân viên tư vấn"; if (role === "warranty") return "Nhân viên bảo hành"; if (role === "repair") return "Nhân viên sửa chữa"; if (role === "inventory") return "Nhân viên kho"; return "Nhân viên bán hàng"; }
