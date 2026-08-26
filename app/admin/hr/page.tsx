import Image from "next/image";
import Link from "next/link";
import { requireHrManagerPage } from "@/app/admin-auth";
import { getEmployeeDirectory } from "@/db/hr";

export const dynamic = "force-dynamic";

export default async function HrPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [user, allEmployees, query] = await Promise.all([requireHrManagerPage("/admin/hr"), getEmployeeDirectory().catch(() => []), searchParams]);
  const employees = user.role === "owner" ? allEmployees : allEmployees.filter((item) => item.branchId === user.branchId || (!item.branchId && item.branch === user.branch));
  const todayWorking = employees.filter((item) => item.todayStatus === "present" || item.todayStatus === "late").length;
  const completeProfiles = employees.filter((item) => item.profileScore === 100).length;

  return (
    <>
      <div className="admin-topline admin-hr-heading">
        <div><span>Human Resources</span><h1>Hồ sơ nhân sự</h1><p className="admin-subtitle">{user.role === "owner" ? "Quản lý hồ sơ nhân viên trên toàn hệ thống." : `Quản lý ảnh và thông tin nhân viên tại ${user.branch}.`}</p></div>
        <div className="admin-actions-row"><Link className="admin-button" href="/admin/attendance">Bảng chấm công</Link>{user.role === "owner" && <Link className="admin-button admin-button-primary" href="/admin/staff">＋ Tạo tài khoản nhân viên</Link>}</div>
      </div>
      {query.error && <p className="admin-alert error">{query.error}</p>}

      <section className="admin-report-kpis admin-hr-kpis">
        <HrMetric icon="♧" label="Tổng nhân sự" value={String(employees.length)} note={`${employees.filter((item) => item.active).length} đang hoạt động`} />
        <HrMetric icon="✓" label="Có mặt hôm nay" value={String(todayWorking)} note={`${employees.filter((item) => item.todayStatus === "late").length} đi trễ`} />
        <HrMetric icon="▣" label="Hồ sơ hoàn chỉnh" value={`${completeProfiles}/${employees.length}`} note={`${employees.filter((item) => item.profileScore < 100).length} hồ sơ cần bổ sung`} />
        <HrMetric icon="⌘" label="Đã có tài khoản lương" value={String(employees.filter((item) => item.bankAccountNumber).length)} note="Thông tin được mã hóa" />
      </section>

      <section className="admin-card admin-hr-directory">
        <div className="admin-card-head"><div><span>{employees.length} nhân sự</span><h2>Danh sách hồ sơ nhân viên</h2></div><small>Dữ liệu CCCD và tài khoản được che trên danh sách</small></div>
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
          {!employees.length && <div className="admin-empty-state">Chưa có nhân viên. Hãy tạo tài khoản nhân viên trước.</div>}
        </div>
      </section>
    </>
  );
}

function HrMetric({ icon, label, value, note }: { icon: string; label: string; value: string; note: string }) { return <article><i>{icon}</i><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>; }
function roleLabel(role: string) { if (role === "manager") return "Quản lý chi nhánh"; if (role === "consultant") return "Tư vấn viên"; if (role === "warranty") return "Nhân viên bảo hành"; if (role === "repair") return "Nhân viên sửa chữa"; return "Nhân viên bán hàng"; }
function formatDate(value: string) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN") : "Chưa cập nhật"; }
function attendanceLabel(value: string) { if (value === "present") return "Có mặt"; if (value === "late") return "Đi trễ"; if (value === "leave") return "Nghỉ phép"; if (value === "absent") return "Vắng"; return "Chưa chấm công"; }
