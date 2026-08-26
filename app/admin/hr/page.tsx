import Image from "next/image";
import Link from "next/link";
import { requireHrManagerPage } from "@/app/admin-auth";
import { getEmployeeDirectory } from "@/db/hr";

export const dynamic = "force-dynamic";

type HrQuery = { error?: string; keyword?: string; role?: string; branch?: string; status?: string };

export default async function HrPage({ searchParams }: { searchParams: Promise<HrQuery> }) {
  const [user, allEmployees, query] = await Promise.all([requireHrManagerPage("/admin/hr"), getEmployeeDirectory().catch(() => []), searchParams]);
  const scopeEmployees = user.role === "owner" ? allEmployees : allEmployees.filter((item) => item.branchId === user.branchId || (!item.branchId && item.branch === user.branch));
  const allowedRoles = user.role === "owner" ? ["manager", "sales", "consultant", "warranty", "repair"] : ["sales", "consultant", "warranty", "repair"];
  const selectedRole = allowedRoles.includes(query.role || "") ? query.role! : "";
  const selectedStatus = ["active", "inactive", "incomplete"].includes(query.status || "") ? query.status! : "";
  const selectedBranch = user.role === "owner" && scopeEmployees.some((item) => item.branchId === query.branch) ? query.branch || "" : "";
  const keyword = (query.keyword || "").trim().toLocaleLowerCase("vi-VN").slice(0, 80);
  const branches = uniqueBranches(scopeEmployees);
  const employees = scopeEmployees.filter((item) => {
    if (selectedRole && item.role !== selectedRole) return false;
    if (selectedBranch && item.branchId !== selectedBranch) return false;
    if (selectedStatus === "active" && !item.active) return false;
    if (selectedStatus === "inactive" && item.active) return false;
    if (selectedStatus === "incomplete" && item.profileScore === 100) return false;
    if (keyword && !`${item.name} ${item.username}`.toLocaleLowerCase("vi-VN").includes(keyword)) return false;
    return true;
  }).sort((left, right) => roleOrder(left.role) - roleOrder(right.role) || left.name.localeCompare(right.name, "vi"));
  const todayWorking = employees.filter((item) => item.todayStatus === "present" || item.todayStatus === "late").length;
  const completeProfiles = employees.filter((item) => item.profileScore === 100).length;

  return (
    <>
      <div className="admin-topline admin-hr-heading">
        <div><span>Human Resources</span><h1>Hồ sơ nhân sự</h1><p className="admin-subtitle">{user.role === "owner" ? "Góc nhìn Giám đốc: quản lý chi nhánh được ưu tiên hiển thị ở đầu danh sách." : `Quản lý ảnh và thông tin nhân viên tại ${user.branch}.`}</p></div>
        <div className="admin-actions-row"><Link className="admin-button" href="/admin/attendance">Bảng chấm công</Link>{user.role === "owner" && <Link className="admin-button admin-button-primary" href="/admin/staff">＋ Tạo tài khoản nhân viên</Link>}</div>
      </div>
      {query.error && <p className="admin-alert error">{query.error}</p>}

      <form className="admin-report-filters admin-hr-filters">
        <label className="admin-hr-search"><span>Tìm nhân viên</span><input name="keyword" defaultValue={query.keyword || ""} placeholder="Tên hoặc tài khoản đăng nhập" /></label>
        <label><span>Nhóm nhân viên</span><select name="role" defaultValue={selectedRole}><option value="">Tất cả nhóm</option>{user.role === "owner" && <option value="manager">Quản lý chi nhánh</option>}<option value="sales">Nhân viên bán hàng</option><option value="warranty">Nhân viên bảo hành</option><option value="repair">Nhân viên sửa chữa</option><option value="consultant">Nhân viên tư vấn</option></select></label>
        {user.role === "owner" ? <label><span>Chi nhánh</span><select name="branch" defaultValue={selectedBranch}><option value="">Toàn hệ thống</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label> : <label><span>Phạm vi quản lý</span><input value={user.branch} disabled /></label>}
        <label><span>Trạng thái hồ sơ</span><select name="status" defaultValue={selectedStatus}><option value="">Tất cả trạng thái</option><option value="active">Đang làm việc</option><option value="inactive">Đã khóa</option><option value="incomplete">Cần bổ sung hồ sơ</option></select></label>
        <button className="admin-button admin-button-primary" type="submit">Lọc danh sách</button>
        <Link className="admin-button" href="/admin/hr">Đặt lại</Link>
      </form>

      <section className="admin-report-kpis admin-hr-kpis">
        <HrMetric icon="♧" label="Tổng nhân sự" value={String(employees.length)} note={`${employees.filter((item) => item.active).length} đang hoạt động`} />
        <HrMetric icon="✓" label="Có mặt hôm nay" value={String(todayWorking)} note={`${employees.filter((item) => item.todayStatus === "late").length} đi trễ`} />
        <HrMetric icon="▣" label="Hồ sơ hoàn chỉnh" value={`${completeProfiles}/${employees.length}`} note={`${employees.filter((item) => item.profileScore < 100).length} hồ sơ cần bổ sung`} />
        <HrMetric icon="⌘" label="Đã có tài khoản lương" value={String(employees.filter((item) => item.bankAccountNumber).length)} note="Thông tin được mã hóa" />
      </section>

      <section className="admin-card admin-hr-directory">
        <div className="admin-card-head"><div><span>Hiển thị {employees.length}/{scopeEmployees.length} nhân sự</span><h2>Danh sách hồ sơ nhân viên</h2></div><small>Dữ liệu CCCD và tài khoản được che trên danh sách</small></div>
        <div className="admin-table-wrap">
          <table className="admin-table admin-hr-table">
            <thead><tr><th>Nhân viên</th><th>Vai trò</th><th>Chi nhánh</th><th>Ngày tham gia</th><th>CCCD</th><th>Tài khoản lương</th><th>Chấm công hôm nay</th><th>Hồ sơ</th><th>Thao tác</th></tr></thead>
            <tbody>{employees.map((employee) => <tr key={employee.adminUserId}>
              <td><div className="admin-hr-person">{employee.photoKey ? <Image src={`/api/admin/hr-photo/${employee.adminUserId}`} alt="" width={42} height={42} unoptimized /> : <b>{employee.name.slice(0, 1).toUpperCase()}</b>}<span><strong>{employee.name}</strong><small>@{employee.username} · {employee.active ? "Đang làm việc" : "Đã khóa"}</small></span></div></td>
              <td>{roleLabel(employee.role)}</td>
              <td>{employee.branch || "Chưa phân chi nhánh"}</td>
              <td>{formatDate(employee.joinedDate)}</td>
              <td><span className="admin-sensitive-value">{employee.citizenIdMasked}</span></td>
              <td><strong>{employee.bankName || "Chưa cập nhật"}</strong><span>{employee.bankAccountMasked}</span></td>
              <td><span className={`admin-badge hr-attendance-${employee.todayStatus || "none"}`}>{attendanceLabel(employee.todayStatus)}</span>{employee.todayCheckIn && <span>Vào lúc {employee.todayCheckIn}</span>}</td>
              <td><div className="admin-profile-progress"><span><i style={{ width: `${employee.profileScore}%` }} /></span><b>{employee.profileScore}%</b></div></td>
              <td><Link className="admin-table-link" href={`/admin/hr/${employee.adminUserId}`}>Mở hồ sơ</Link></td>
            </tr>)}</tbody>
          </table>
          {!employees.length && <div className="admin-empty-state">Không có nhân viên phù hợp với bộ lọc hiện tại.</div>}
        </div>
      </section>
    </>
  );
}

function HrMetric({ icon, label, value, note }: { icon: string; label: string; value: string; note: string }) { return <article><i>{icon}</i><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>; }
function roleLabel(role: string) { if (role === "manager") return "Quản lý chi nhánh"; if (role === "consultant") return "Tư vấn viên"; if (role === "warranty") return "Nhân viên bảo hành"; if (role === "repair") return "Nhân viên sửa chữa"; return "Nhân viên bán hàng"; }
function formatDate(value: string) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN") : "Chưa cập nhật"; }
function attendanceLabel(value: string) { if (value === "present") return "Có mặt"; if (value === "late") return "Đi trễ"; if (value === "leave") return "Nghỉ phép"; if (value === "absent") return "Vắng"; return "Chưa chấm công"; }
function uniqueBranches(employees: Array<{ branchId: string; branch: string }>) {
  const branches = new Map<string, string>();
  employees.forEach((employee) => { if (employee.branchId && employee.branch) branches.set(employee.branchId, employee.branch); });
  return [...branches].map(([id, name]) => ({ id, name })).sort((left, right) => left.name.localeCompare(right.name, "vi"));
}
function roleOrder(role: string) { return role === "manager" ? 0 : role === "sales" ? 1 : role === "consultant" ? 2 : role === "warranty" ? 3 : role === "repair" ? 4 : 5; }
