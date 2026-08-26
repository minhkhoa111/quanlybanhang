"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { savePayrollAction } from "./actions";

type Props = {
  employee: { id: string; name: string; role: string; branch: string; monthlySalary: number; bankName: string; bankAccountMasked: string };
  month: string;
  selectedBranch: string;
  workDays: number;
  lateDays: number;
  record?: { bonusAmount: number; socialInsuranceAmount: number; personalIncomeTaxAmount: number; status: string; note: string };
};

export default function PayrollEditorForm({ employee, month, selectedBranch, workDays, lateDays, record }: Props) {
  const [bonus, setBonus] = useState(record?.bonusAmount || 0);
  const [socialInsurance, setSocialInsurance] = useState(record?.socialInsuranceAmount || 0);
  const [personalIncomeTax, setPersonalIncomeTax] = useState(record?.personalIncomeTaxAmount || 0);
  const gross = employee.monthlySalary + bonus;
  const net = useMemo(() => Math.max(0, gross - socialInsurance - personalIncomeTax), [gross, socialInsurance, personalIncomeTax]);

  return <form action={savePayrollAction} className="admin-payroll-row">
    <input type="hidden" name="adminUserId" value={employee.id}/><input type="hidden" name="payrollMonth" value={month}/><input type="hidden" name="workDays" value={workDays}/><input type="hidden" name="branch" value={selectedBranch}/>
    <div className="admin-payroll-person"><b>{employee.name.slice(0, 1).toUpperCase()}</b><div><strong>{employee.name}</strong><span>{roleLabel(employee.role)}</span><small>{employee.branch || "Chưa phân chi nhánh"}</small></div></div>
    <div className="admin-payroll-attendance"><span>Ngày công</span><strong>{workDays}</strong><small>{lateDays} ngày đi trễ</small></div>
    <div className="admin-payroll-base"><span>Lương cơ bản</span><strong>{money(employee.monthlySalary)}</strong><small>{employee.bankName || "Chưa có ngân hàng"} · {employee.bankAccountMasked}</small></div>
    <label><span>Thưởng lương</span><input name="bonusAmount" type="number" min="0" step="1000" value={bonus} onChange={(event) => setBonus(numberValue(event.target.value))}/></label>
    <label><span>BHXH khấu trừ</span><input name="socialInsuranceAmount" type="number" min="0" step="1000" value={socialInsurance} onChange={(event) => setSocialInsurance(numberValue(event.target.value))}/></label>
    <label><span>Thuế TNCN</span><input name="personalIncomeTaxAmount" type="number" min="0" step="1000" value={personalIncomeTax} onChange={(event) => setPersonalIncomeTax(numberValue(event.target.value))}/></label>
    <div className="admin-payroll-net"><span>Thực nhận</span><strong>{money(net)}</strong><small>{gross > 12_000_000 ? "Cần rà soát TNCN" : "Dưới ngưỡng rà soát nội bộ"}</small></div>
    <label><span>Trạng thái</span><select name="status" defaultValue={record?.status || "draft"}><option value="draft">Chưa thanh toán</option><option value="paid">Đã thanh toán</option></select></label>
    <label className="admin-payroll-note"><span>Ghi chú</span><input name="note" defaultValue={record?.note || ""} placeholder="Thưởng, khấu trừ, lý do..."/></label>
    <div className="admin-payroll-actions"><button className="admin-button admin-button-primary">Lưu bảng lương</button>{record && <Link className="admin-button" href={`/admin/payroll/${employee.id}?month=${month}`}>Phiếu lương</Link>}</div>
  </form>;
}

function numberValue(value: string) { const parsed = Number(value); return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0; }
function money(value: number) { return `${Math.max(0, Math.round(value)).toLocaleString("vi-VN")}đ`; }
function roleLabel(role: string) { if (role === "manager") return "Quản lý chi nhánh"; if (role === "consultant") return "Nhân viên tư vấn"; if (role === "warranty") return "Nhân viên bảo hành"; if (role === "repair") return "Nhân viên sửa chữa"; return "Nhân viên bán hàng"; }
