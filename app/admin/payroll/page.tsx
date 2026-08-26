import { requireOwnerPage } from "@/app/admin-auth";
import { getEmployeeAttendance, getEmployeeDirectory } from "@/db/hr";
import { getPayrollRecords } from "@/db/payroll";
import { savePayrollAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function PayrollPage({ searchParams }: { searchParams: Promise<{ month?: string; error?: string; status?: string }> }) {
  await requireOwnerPage("/admin/payroll");
  const query = await searchParams;
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(query.month || "") ? query.month! : currentMonth();
  const [employees, records] = await Promise.all([getEmployeeDirectory().catch(() => []), getPayrollRecords(month).catch(() => [])]);
  const attendance = new Map(await Promise.all(employees.map(async (employee) => {
    const rows = await getEmployeeAttendance(employee.adminUserId, 366).catch(() => []);
    return [employee.adminUserId, rows.filter((row) => row.workDate.startsWith(`${month}-`))] as const;
  })));
  const recordMap = new Map(records.map((record) => [record.adminUserId, record]));
  const rows = employees.map((employee) => {
    const monthAttendance = attendance.get(employee.adminUserId) || [];
    const workDays = monthAttendance.filter((item) => item.status === "present" || item.status === "late").length;
    const record = recordMap.get(employee.adminUserId);
    return { employee, record, workDays, lateDays: monthAttendance.filter((item) => item.status === "late").length, payable: record?.payableAmount ?? employee.monthlySalary };
  });
  const total = rows.reduce((sum, row) => sum + row.payable, 0);
  const paid = rows.reduce((sum, row) => sum + (row.record?.status === "paid" ? row.payable : 0), 0);

  return <>
    <div className="admin-topline"><div><span>Tài chính nhân sự</span><h1>Kiểm kê lương tháng</h1><p className="admin-subtitle">Đối chiếu ngày công, tài khoản nhận lương, số tiền thực chi và trạng thái thanh toán.</p></div></div>
    {query.status === "saved" && <p className="admin-alert success">Đã lưu kiểm kê lương nhân viên.</p>}{query.error && <p className="admin-alert error">{query.error}</p>}
    <form className="admin-report-filters"><label><span>Tháng kiểm kê</span><input type="month" name="month" defaultValue={month}/></label><button className="admin-button admin-button-primary">Xem kỳ lương</button></form>
    <section className="admin-report-kpis"><Metric label="Tổng dự kiến chi" value={money(total)} note={`${rows.length} nhân sự trong danh sách`}/><Metric label="Đã xác nhận thanh toán" value={money(paid)} note={`${rows.filter((row) => row.record?.status === "paid").length} nhân sự đã chi`}/><Metric label="Còn cần thanh toán" value={money(total - paid)} note="Theo trạng thái kiểm kê hiện tại"/><Metric label="Hồ sơ thiếu tài khoản" value={String(rows.filter((row) => !row.employee.bankAccountNumber).length)} note="Cần bổ sung trước khi chuyển lương"/></section>
    <p className="admin-ledger-note">Ngày công được đưa ra để đối chiếu. Hệ thống không tự chia lương theo ngày vì lịch làm việc có thể khác nhau; chủ hệ thống xác nhận số tiền thực trả cho từng nhân viên.</p>
    <section className="admin-card admin-payroll-list"><div className="admin-card-head"><div><span>Kỳ {monthLabel(month)}</span><h2>Sổ lương nhân sự</h2></div><small>Dữ liệu tài khoản ngân hàng được che</small></div><div className="admin-payroll-rows">{rows.map(({ employee, record, workDays, lateDays }) => <form action={savePayrollAction} className="admin-payroll-row" key={employee.adminUserId}>
      <input type="hidden" name="adminUserId" value={employee.adminUserId}/><input type="hidden" name="payrollMonth" value={month}/><input type="hidden" name="baseSalary" value={employee.monthlySalary}/><input type="hidden" name="workDays" value={workDays}/>
      <div className="admin-payroll-person"><b>{employee.name.slice(0,1).toUpperCase()}</b><span><strong>{employee.name}</strong><small>{roleLabel(employee.role)} · {employee.branch}</small></span></div>
      <div><span>Ngày công</span><strong>{workDays}</strong><small>{lateDays} ngày đi trễ</small></div>
      <div><span>Lương hồ sơ</span><strong>{money(employee.monthlySalary)}</strong><small>{employee.bankName || "Chưa có ngân hàng"} · {employee.bankAccountMasked}</small></div>
      <label><span>Thực trả</span><input name="payableAmount" type="number" min="0" step="1000" defaultValue={record?.payableAmount ?? employee.monthlySalary}/></label>
      <label><span>Trạng thái</span><select name="status" defaultValue={record?.status || "draft"}><option value="draft">Chưa thanh toán</option><option value="paid">Đã thanh toán</option></select></label>
      <label><span>Ghi chú</span><input name="note" defaultValue={record?.note || ""} placeholder="Thưởng, khấu trừ..."/></label>
      <button className="admin-button admin-button-primary">Lưu</button>
    </form>)}{!rows.length && <div className="admin-empty-state">Chưa có nhân viên để lập kiểm kê lương.</div>}</div></section>
  </>;
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) { return <article><i>₫</i><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>; }
function currentMonth() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit" }).format(new Date()); }
function monthLabel(value: string) { const [year, month] = value.split("-"); return `tháng ${Number(month)}/${year}`; }
function money(value: number) { return `${Math.max(0, Math.round(value)).toLocaleString("vi-VN")}đ`; }
function roleLabel(role: string) { if (role === "manager") return "Quản lý"; if (role === "consultant") return "Tư vấn"; if (role === "warranty") return "Bảo hành"; if (role === "repair") return "Sửa chữa"; return "Bán hàng"; }
