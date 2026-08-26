import { requireOwnerPage } from "@/app/admin-auth";
import { getBranches } from "@/db/branches";
import { getEmployeeAttendance, getEmployeeDirectory } from "@/db/hr";
import { getPayrollRecords } from "@/db/payroll";
import PayrollEditorForm from "./PayrollEditorForm";

export const dynamic = "force-dynamic";

export default async function PayrollPage({ searchParams }: { searchParams: Promise<{ month?: string; branch?: string; error?: string; status?: string }> }) {
  await requireOwnerPage("/admin/payroll");
  const query = await searchParams;
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(query.month || "") ? query.month! : currentMonth();
  const [allEmployees, records, branches] = await Promise.all([getEmployeeDirectory().catch(() => []), getPayrollRecords(month).catch(() => []), getBranches().catch(() => [])]);
  const selectedBranch = branches.some((branch) => branch.id === query.branch) ? query.branch! : "";
  const employees = selectedBranch ? allEmployees.filter((employee) => employee.branchId === selectedBranch) : allEmployees;
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
  const grouped = groupByBranch(rows, branches);
  const total = rows.reduce((sum, row) => sum + row.payable, 0);
  const paid = rows.reduce((sum, row) => sum + (row.record?.status === "paid" ? row.payable : 0), 0);

  return <>
    <div className="admin-topline"><div><span>Tài chính nhân sự</span><h1>Kiểm kê lương theo chi nhánh</h1><p className="admin-subtitle">Đối chiếu ngày công, thưởng, BHXH, thuế TNCN và số tiền thực nhận của từng nhân viên.</p></div></div>
    {query.status === "saved" && <p className="admin-alert success">Đã lưu bảng lương. Bạn có thể mở phiếu lương để in hoặc xác nhận với nhân viên.</p>}{query.error && <p className="admin-alert error">{query.error}</p>}
    <form className="admin-report-filters admin-payroll-filters"><label><span>Tháng kiểm kê</span><input type="month" name="month" defaultValue={month}/></label><label><span>Chi nhánh</span><select name="branch" defaultValue={selectedBranch}><option value="">Tất cả chi nhánh</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label><button className="admin-button admin-button-primary">Xem bảng lương</button></form>
    <section className="admin-report-kpis"><Metric label="Tổng thực nhận" value={money(total)} note={`${rows.length} nhân sự trong phạm vi`}/><Metric label="Đã thanh toán" value={money(paid)} note={`${rows.filter((row) => row.record?.status === "paid").length} phiếu đã chi`}/><Metric label="Chưa thanh toán" value={money(total - paid)} note="Theo trạng thái bảng lương"/><Metric label="Thiếu tài khoản" value={String(rows.filter((row) => !row.employee.bankAccountNumber).length)} note="Cần bổ sung trước khi chuyển lương"/></section>
    <p className="admin-ledger-note"><strong>Đối soát TNCN:</strong> Hệ thống cảnh báo nội bộ khi lương cộng thưởng trên 12 triệu theo yêu cầu của cửa hàng, nhưng không tự kết luận số thuế phải nộp. Từ kỳ tính thuế 2026, giảm trừ bản thân là 15,5 triệu đồng/tháng và còn phụ thuộc BHXH, người phụ thuộc cùng các khoản giảm trừ; số thuế thực tế do kế toán xác nhận và nhập vào.</p>
    <div className="admin-payroll-branches">{grouped.map((group) => <section className="admin-card admin-payroll-list" key={group.id}><div className="admin-card-head admin-payroll-branch-head"><div><span>{group.code} · {group.rows.length} nhân sự</span><h2>{group.name}</h2><p>{group.address}</p></div><strong>{money(group.rows.reduce((sum, row) => sum + row.payable, 0))}<small>Tổng thực nhận</small></strong></div><div className="admin-payroll-rows">{group.rows.map(({ employee, record, workDays, lateDays }) => <PayrollEditorForm key={employee.adminUserId} employee={{ id: employee.adminUserId, name: employee.name, role: employee.role, branch: employee.branch, monthlySalary: employee.monthlySalary, bankName: employee.bankName, bankAccountMasked: employee.bankAccountMasked }} month={month} selectedBranch={selectedBranch} workDays={workDays} lateDays={lateDays} record={record}/>)}</div></section>)}{!rows.length && <section className="admin-card admin-empty-state">Không có nhân viên trong chi nhánh hoặc kỳ lương đã chọn.</section>}</div>
  </>;
}

type PayrollRow = { employee: { branchId: string; branch: string }; payable: number };
function groupByBranch<T extends PayrollRow>(rows: T[], branches: Array<{ id: string; code: string; name: string; address: string }>) {
  const known = branches.map((branch) => ({ ...branch, rows: rows.filter((row) => row.employee.branchId === branch.id) })).filter((group) => group.rows.length);
  const unassigned = rows.filter((row) => !branches.some((branch) => branch.id === row.employee.branchId));
  return unassigned.length ? [...known, { id: "unassigned", code: "CHƯA GÁN", name: "Nhân sự chưa phân chi nhánh", address: "Cần cập nhật hồ sơ nhân sự", rows: unassigned }] : known;
}
function Metric({ label, value, note }: { label: string; value: string; note: string }) { return <article><i>₫</i><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>; }
function currentMonth() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit" }).format(new Date()); }
function money(value: number) { return `${Math.max(0, Math.round(value)).toLocaleString("vi-VN")}đ`; }
