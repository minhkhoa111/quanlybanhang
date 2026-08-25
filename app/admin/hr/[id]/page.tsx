import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwnerPage } from "@/app/admin-auth";
import { getEmployeeAttendance, getEmployeeProfile, vietnamDate } from "@/db/hr";
import { formatMoney } from "../../utils";
import { saveAttendanceAction, saveEmployeeProfileAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EmployeeProfilePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string; error?: string }> }) {
  await requireOwnerPage("/admin/hr");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [employee, attendance] = await Promise.all([getEmployeeProfile(id), getEmployeeAttendance(id).catch(() => [])]);
  if (!employee) notFound();
  const monthKey = vietnamDate().slice(0, 7);
  const monthRecords = attendance.filter((item) => item.workDate.startsWith(monthKey));
  const workedDays = monthRecords.filter((item) => item.status === "present" || item.status === "late").length;
  const totalMinutes = monthRecords.reduce((sum, item) => sum + workMinutes(item.checkIn, item.checkOut), 0);

  return (
    <>
      <div className="admin-topline admin-hr-profile-heading">
        <div><span>Hồ sơ nhân sự</span><h1>{employee.name}</h1><p className="admin-subtitle">{roleLabel(employee.role)} · {employee.branch || "Chưa phân chi nhánh"}</p></div>
        <Link className="admin-button" href="/admin/hr">← Danh sách nhân sự</Link>
      </div>
      {query.status === "profile-saved" && <p className="admin-alert success">Đã lưu hồ sơ nhân sự và thông tin nhận lương.</p>}
      {query.status === "attendance-saved" && <p className="admin-alert success">Đã cập nhật chấm công.</p>}
      {query.error && <p className="admin-alert error">{query.error}</p>}

      <section className="admin-employee-identity">
        <article className="admin-card admin-employee-profile-card">
          <div className="admin-employee-photo">{employee.photoKey ? <Image src={`/api/admin/hr-photo/${employee.adminUserId}`} alt={`Ảnh ${employee.name}`} width={150} height={150} unoptimized /> : <span>{employee.name.slice(0, 1).toUpperCase()}</span>}</div>
          <h2>{employee.name}</h2><p>@{employee.username}</p>
          <dl><div><dt>Vai trò</dt><dd>{roleLabel(employee.role)}</dd></div><div><dt>Chi nhánh</dt><dd>{employee.branch || "Chưa phân"}</dd></div><div><dt>Trạng thái</dt><dd>{employee.active ? "Đang hoạt động" : "Đã khóa"}</dd></div><div><dt>Ngày tham gia</dt><dd>{formatDate(employee.joinedDate)}</dd></div></dl>
        </article>
        <div className="admin-employee-month-stats">
          <article><span>Ngày công tháng này</span><strong>{workedDays}</strong><small>{monthRecords.length} ngày đã ghi nhận</small></article>
          <article><span>Tổng giờ làm</span><strong>{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</strong><small>Tính từ giờ vào và giờ ra</small></article>
          <article><span>Đi trễ</span><strong>{monthRecords.filter((item) => item.status === "late").length}</strong><small>Chấm vào sau 09:00</small></article>
          <article><span>Lương cơ bản</span><strong>{employee.monthlySalary ? formatMoney(employee.monthlySalary) : "Chưa đặt"}</strong><small>{employee.bankName || "Chưa có ngân hàng nhận lương"}</small></article>
        </div>
      </section>

      <form action={saveEmployeeProfileAction} className="admin-card admin-hr-profile-form">
        <input type="hidden" name="adminUserId" value={employee.adminUserId} />
        <div className="admin-card-head"><div><span>Thông tin cá nhân</span><h2>Cập nhật hồ sơ nhân sự</h2></div><strong className="admin-private-data-badge">Dữ liệu riêng tư · Đã mã hóa</strong></div>
        <fieldset><legend>Nhận diện và công việc</legend><div className="admin-hr-form-grid">
          <label className="admin-field"><span>Họ và tên</span><input value={employee.name} disabled /></label>
          <label className="admin-field"><span>Ngày sinh</span><input type="date" name="dateOfBirth" defaultValue={employee.dateOfBirth} /></label>
          <label className="admin-field"><span>Ngày tham gia</span><input type="date" name="joinedDate" defaultValue={employee.joinedDate} /></label>
          <label className="admin-field"><span>Số CCCD</span><input name="citizenId" defaultValue={employee.citizenId} inputMode="numeric" maxLength={20} autoComplete="off" /></label>
          <label className="admin-field admin-hr-wide"><span>Hình ảnh nhân sự</span><input type="file" name="photo" accept="image/jpeg,image/png,image/webp" /><small>JPG, PNG hoặc WEBP, tối đa 5 MB. Ảnh không được công khai.</small></label>
        </div></fieldset>
        <fieldset><legend>Thông tin cư trú</legend><div className="admin-hr-form-grid">
          <label className="admin-field admin-hr-wide"><span>Hộ khẩu thường trú</span><textarea name="permanentAddress" rows={3} defaultValue={employee.permanentAddress} placeholder="Địa chỉ thường trú đầy đủ" /></label>
          <label className="admin-field admin-hr-wide"><span>Địa chỉ tạm trú (nếu có)</span><textarea name="temporaryAddress" rows={3} defaultValue={employee.temporaryAddress} placeholder="Để trống nếu giống địa chỉ thường trú" /></label>
        </div></fieldset>
        <fieldset><legend>Tài khoản nhận lương</legend><div className="admin-hr-form-grid">
          <label className="admin-field"><span>Ngân hàng</span><input name="bankName" defaultValue={employee.bankName} placeholder="VD: Techcombank" /></label>
          <label className="admin-field"><span>Số tài khoản</span><input name="bankAccountNumber" defaultValue={employee.bankAccountNumber} inputMode="numeric" autoComplete="off" /></label>
          <label className="admin-field"><span>Tên chủ tài khoản</span><input name="bankAccountName" defaultValue={employee.bankAccountName} placeholder="NGUYEN VAN AN" /></label>
          <label className="admin-field"><span>Lương cơ bản hàng tháng</span><input name="monthlySalary" type="number" min="0" step="100000" defaultValue={employee.monthlySalary || ""} placeholder="12000000" /></label>
        </div></fieldset>
        <div className="admin-form-actions"><button className="admin-button admin-button-primary" type="submit">Lưu hồ sơ nhân sự</button></div>
      </form>

      <section className="admin-hr-attendance-layout">
        <article className="admin-card">
          <div className="admin-card-head"><div><span>Timekeeping</span><h2>Ghi nhận chấm công</h2></div></div>
          <form action={saveAttendanceAction} className="admin-attendance-form">
            <input type="hidden" name="adminUserId" value={employee.adminUserId} />
            <label className="admin-field"><span>Ngày làm việc</span><input type="date" name="workDate" defaultValue={vietnamDate()} required /></label>
            <label className="admin-field"><span>Trạng thái</span><select name="attendanceStatus" defaultValue="present"><option value="present">Có mặt</option><option value="late">Đi trễ</option><option value="leave">Nghỉ phép</option><option value="absent">Vắng mặt</option></select></label>
            <label className="admin-field"><span>Giờ vào</span><input type="time" name="checkIn" /></label>
            <label className="admin-field"><span>Giờ ra</span><input type="time" name="checkOut" /></label>
            <label className="admin-field admin-hr-wide"><span>Ghi chú</span><input name="note" placeholder="Ca làm, lý do đi trễ hoặc nghỉ phép..." /></label>
            <button className="admin-button admin-button-primary" type="submit">Lưu chấm công</button>
          </form>
        </article>
        <article className="admin-card admin-attendance-history">
          <div className="admin-card-head"><div><span>{attendance.length} bản ghi gần nhất</span><h2>Lịch sử chấm công</h2></div></div>
          <div>{attendance.slice(0, 31).map((record) => <article key={record.id}><time>{formatDate(record.workDate)}</time><span className={`admin-badge hr-attendance-${record.status}`}>{attendanceLabel(record.status)}</span><strong>{record.checkIn || "--:--"} → {record.checkOut || "--:--"}</strong><small>{record.note || `Cập nhật bởi ${record.recordedBy}`}</small></article>)}{!attendance.length && <p className="admin-empty-state">Chưa có dữ liệu chấm công.</p>}</div>
        </article>
      </section>
    </>
  );
}

function workMinutes(start: string, end: string) { if (!start || !end) return 0; const [sh, sm] = start.split(":").map(Number); const [eh, em] = end.split(":").map(Number); return Math.max(0, eh * 60 + em - sh * 60 - sm); }
function roleLabel(role: string) { if (role === "manager") return "Quản lý chi nhánh"; if (role === "consultant") return "Tư vấn viên"; return "Nhân viên bán hàng"; }
function formatDate(value: string) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN") : "Chưa cập nhật"; }
function attendanceLabel(value: string) { if (value === "present") return "Có mặt"; if (value === "late") return "Đi trễ"; if (value === "leave") return "Nghỉ phép"; return "Vắng mặt"; }
