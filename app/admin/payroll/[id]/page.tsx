import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwnerPage } from "@/app/admin-auth";
import { getEmployeeProfile } from "@/db/hr";
import { getPayrollRecord } from "@/db/payroll";
import PayrollPrintButton from "./PayrollPrintButton";

export const dynamic = "force-dynamic";

export default async function PayrollReceiptPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ month?: string }> }) {
  await requireOwnerPage("/admin/payroll");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(query.month || "") ? query.month! : "";
  const [employee, record] = await Promise.all([getEmployeeProfile(id), getPayrollRecord(id, month).catch(() => undefined)]);
  if (!employee || !record) notFound();
  const gross = record.baseSalary + record.bonusAmount;

  return <>
    <div className="admin-topline admin-payroll-toolbar"><div><span>Chứng từ nhân sự</span><h1>Phiếu lương nhân viên</h1><p className="admin-subtitle">Phiếu đối soát và xác nhận khoản lương thực nhận.</p></div><div className="admin-actions-row"><Link className="admin-button" href={`/admin/payroll?month=${month}&branch=${employee.branchId}`}>← Bảng lương</Link><PayrollPrintButton/></div></div>
    <article className="admin-payroll-receipt">
      <header><div><span>HUY APPLE</span><h2>PHIẾU LƯƠNG / XÁC NHẬN NHẬN LƯƠNG</h2><p>Kỳ lương {monthLabel(month)}</p></div><dl><div><dt>Mã phiếu</dt><dd>PAY-{month.replace("-", "")}-{record.id.slice(0, 8).toUpperCase()}</dd></div><div><dt>Trạng thái</dt><dd>{record.status === "paid" ? "ĐÃ THANH TOÁN" : "CHƯA THANH TOÁN"}</dd></div><div><dt>Ngày thanh toán</dt><dd>{record.paidAt ? formatDate(record.paidAt) : "Chưa xác nhận"}</dd></div></dl></header>
      <section className="admin-payroll-receipt-person"><div><span>Người nhận</span><strong>{employee.name}</strong><p>{roleLabel(employee.role)}</p></div><div><span>Chi nhánh</span><strong>{employee.branch || "Chưa phân chi nhánh"}</strong><p>{record.workDays} ngày công trong kỳ</p></div><div><span>Tài khoản nhận lương</span><strong>{employee.bankName || "Chưa cập nhật"}</strong><p>{mask(employee.bankAccountNumber)} · {employee.bankAccountName || employee.name}</p></div></section>
      <section className="admin-payroll-receipt-lines"><div><span>Lương cơ bản</span><strong>{money(record.baseSalary)}</strong></div><div><span>Thưởng lương</span><strong className="is-plus">+ {money(record.bonusAmount)}</strong></div><div><span>Khấu trừ BHXH</span><strong className="is-minus">− {money(record.socialInsuranceAmount)}</strong></div><div><span>Khấu trừ thuế TNCN</span><strong className="is-minus">− {money(record.personalIncomeTaxAmount)}</strong></div><div className="is-gross"><span>Tổng thu nhập trước khấu trừ</span><strong>{money(gross)}</strong></div><div className="is-net"><span>Thực nhận</span><strong>{money(record.payableAmount)}</strong></div></section>
      {record.note && <section className="admin-payroll-receipt-note"><span>Ghi chú</span><p>{record.note}</p></section>}
      <p className="admin-payroll-receipt-disclaimer">Phiếu này là chứng từ đối soát lương nội bộ, không phải hóa đơn giá trị gia tăng hoặc tờ khai thuế. Khoản BHXH và thuế TNCN được ghi nhận theo số liệu đã được bộ phận phụ trách xác nhận.</p>
      <footer><div><strong>Người lập phiếu</strong><span>Ký và ghi rõ họ tên</span></div><div><strong>Người nhận lương</strong><span>Ký và ghi rõ họ tên</span></div><div><strong>Chủ hệ thống</strong><span>Ký và ghi rõ họ tên</span></div></footer>
    </article>
  </>;
}

function money(value: number) { return `${Math.max(0, Math.round(value)).toLocaleString("vi-VN")} đồng`; }
function monthLabel(value: string) { const [year, month] = value.split("-"); return `tháng ${Number(month)}/${year}`; }
function formatDate(timestamp: number) { return new Date(timestamp).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }); }
function mask(value: string) { return value ? `${"•".repeat(Math.max(4, value.length - 4))}${value.slice(-4)}` : "Chưa cập nhật số tài khoản"; }
function roleLabel(role: string) { if (role === "manager") return "Quản lý chi nhánh"; if (role === "consultant") return "Nhân viên tư vấn"; if (role === "warranty") return "Nhân viên bảo hành"; if (role === "repair") return "Nhân viên sửa chữa"; return "Nhân viên bán hàng"; }
