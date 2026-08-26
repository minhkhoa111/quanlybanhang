import Link from "next/link";
import { requireAdminPage } from "@/app/admin-auth";
import { getAdminUsers } from "@/db/admin-users";
import { getAttendanceForDate, getEmployeeAttendance, vietnamDate } from "@/db/hr";
import { selfAttendanceAction } from "../hr/actions";

export const dynamic = "force-dynamic";

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ date?: string; status?: string; error?: string }> }) {
  const [user, query] = await Promise.all([requireAdminPage("/admin/attendance"), searchParams]);
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(query.date || "") ? query.date! : vietnamDate();
  const isSupervisor = user.role === "owner" || user.role === "manager";
  const [allStaff, dateRecords, ownRecords] = await Promise.all([
    isSupervisor ? getAdminUsers().catch(() => []) : Promise.resolve([]),
    isSupervisor ? getAttendanceForDate(selectedDate).catch(() => []) : Promise.resolve([]),
    user.role !== "owner" ? getEmployeeAttendance(user.id, 31).catch(() => []) : Promise.resolve([]),
  ]);
  const staff = user.role === "owner" ? allStaff : allStaff.filter((item) => item.branchId === user.branchId);
  const records = user.role === "owner" ? dateRecords : dateRecords.filter((item) => staff.some((employee) => employee.id === item.adminUserId));
  const ownToday = ownRecords.find((item) => item.workDate === vietnamDate());

  return (
    <>
      <div className="admin-topline">
        <div><span>Timekeeping</span><h1>Chấm công nhân viên</h1><p className="admin-subtitle">{isSupervisor ? `Theo dõi tình hình làm việc ${user.role === "owner" ? "toàn hệ thống" : `tại ${user.branch}`}.` : "Chấm công vào, ra và xem lịch sử làm việc của bạn."}</p></div>
        {user.role === "owner" && <Link className="admin-button" href="/admin/hr">Quản lý hồ sơ nhân sự</Link>}
      </div>
      {query.status === "checked-in" && <p className="admin-alert success">Đã chấm công vào thành công.</p>}
      {query.status === "checked-out" && <p className="admin-alert success">Đã chấm công ra thành công.</p>}
      {query.error && <p className="admin-alert error">{query.error}</p>}

      {!isSupervisor && <section className="admin-attendance-self">
        <article className="admin-card"><span>Ngày làm việc</span><strong>{formatDate(vietnamDate())}</strong><small>{ownToday ? attendanceLabel(ownToday.status) : "Chưa chấm công"}</small></article>
        <article className="admin-card"><span>Giờ vào</span><strong>{ownToday?.checkIn || "--:--"}</strong><small>{ownToday?.checkIn ? "Đã ghi nhận" : "Chưa ghi nhận"}</small></article>
        <article className="admin-card"><span>Giờ ra</span><strong>{ownToday?.checkOut || "--:--"}</strong><small>{ownToday?.checkOut ? "Đã hoàn thành ngày công" : "Chưa ghi nhận"}</small></article>
        <article className="admin-card admin-attendance-actions"><form action={selfAttendanceAction}><input type="hidden" name="mode" value="in" /><button className="admin-button admin-button-primary" disabled={Boolean(ownToday?.checkIn)}>Chấm công vào</button></form><form action={selfAttendanceAction}><input type="hidden" name="mode" value="out" /><button className="admin-button" disabled={!ownToday?.checkIn || Boolean(ownToday?.checkOut)}>Chấm công ra</button></form></article>
      </section>}

      {isSupervisor ? <>
        <form className="admin-report-filters admin-attendance-filter"><label><span>Ngày theo dõi</span><input type="date" name="date" defaultValue={selectedDate} /></label><button className="admin-button admin-button-primary">Xem chấm công</button></form>
        <section className="admin-report-kpis admin-attendance-kpis">
          <AttendanceMetric label="Tổng nhân viên" value={staff.length} note="Trong phạm vi quản lý" />
          <AttendanceMetric label="Có mặt" value={records.filter((item) => item.status === "present").length} note="Đúng giờ" />
          <AttendanceMetric label="Đi trễ" value={records.filter((item) => item.status === "late").length} note="Sau 09:00" />
          <AttendanceMetric label="Vắng / nghỉ phép" value={records.filter((item) => item.status === "absent" || item.status === "leave").length} note={`${staff.length - records.length} người chưa ghi nhận`} />
        </section>
        <section className="admin-card admin-attendance-board">
          <div className="admin-card-head"><div><span>{formatDate(selectedDate)}</span><h2>Bảng chấm công trong ngày</h2></div></div>
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Nhân viên</th><th>Chi nhánh</th><th>Vai trò</th><th>Giờ vào</th><th>Giờ ra</th><th>Trạng thái</th><th>Ghi chú</th><th>Hồ sơ</th></tr></thead><tbody>{staff.map((employee) => { const record = records.find((item) => item.adminUserId === employee.id); return <tr key={employee.id}><td><strong>{employee.name}</strong><span>@{employee.username}</span></td><td>{employee.branch}</td><td>{roleLabel(employee.role)}</td><td>{record?.checkIn || "--:--"}</td><td>{record?.checkOut || "--:--"}</td><td><span className={`admin-badge hr-attendance-${record?.status || "none"}`}>{record ? attendanceLabel(record.status) : "Chưa ghi nhận"}</span></td><td>{record?.note || "—"}</td><td>{user.role === "owner" ? <Link className="admin-table-link" href={`/admin/hr/${employee.id}`}>Cập nhật</Link> : "—"}</td></tr>; })}</tbody></table></div>
        </section>
      </> : <section className="admin-card admin-attendance-history admin-self-history"><div className="admin-card-head"><div><span>31 ngày gần nhất</span><h2>Lịch sử của tôi</h2></div></div><div>{ownRecords.map((record) => <article key={record.id}><time>{formatDate(record.workDate)}</time><span className={`admin-badge hr-attendance-${record.status}`}>{attendanceLabel(record.status)}</span><strong>{record.checkIn || "--:--"} → {record.checkOut || "--:--"}</strong><small>{record.note || "Không có ghi chú"}</small></article>)}</div></section>}
    </>
  );
}

function AttendanceMetric({ label, value, note }: { label: string; value: number; note: string }) { return <article><i>◷</i><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>; }
function formatDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }); }
function attendanceLabel(value: string) { if (value === "present") return "Có mặt"; if (value === "late") return "Đi trễ"; if (value === "leave") return "Nghỉ phép"; return "Vắng mặt"; }
function roleLabel(role: string) { if (role === "manager") return "Quản lý"; if (role === "consultant") return "Tư vấn"; if (role === "warranty") return "Bảo hành"; if (role === "repair") return "Sửa chữa"; return "Bán hàng"; }
