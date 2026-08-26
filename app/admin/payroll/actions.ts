"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwnerAction } from "@/app/admin-auth";
import { getEmployeeProfile } from "@/db/hr";
import { savePayrollRecord } from "@/db/payroll";

export async function savePayrollAction(formData: FormData) {
  await requireOwnerAction();
  const month = value(formData, "payrollMonth");
  try {
    const adminUserId = value(formData, "adminUserId");
    const employee = await getEmployeeProfile(adminUserId);
    if (!employee) throw new Error("Không tìm thấy nhân viên.");
    await savePayrollRecord({ adminUserId, payrollMonth: month, baseSalary: employee.monthlySalary, bonusAmount: amount(formData, "bonusAmount"), socialInsuranceAmount: amount(formData, "socialInsuranceAmount"), personalIncomeTaxAmount: amount(formData, "personalIncomeTaxAmount"), workDays: amount(formData, "workDays"), status: value(formData, "status"), note: value(formData, "note") });
  } catch (error) {
    redirect(`/admin/payroll?month=${encodeURIComponent(month)}&branch=${encodeURIComponent(value(formData, "branch"))}&error=${encodeURIComponent(error instanceof Error ? error.message : "Không thể lưu kiểm kê lương.")}`);
  }
  revalidatePath("/admin/payroll");
  redirect(`/admin/payroll?month=${encodeURIComponent(month)}&branch=${encodeURIComponent(value(formData, "branch"))}&status=saved`);
}
function value(formData: FormData, key: string) { const item = formData.get(key); return typeof item === "string" ? item.trim() : ""; }
function amount(formData: FormData, key: string) { const parsed = Number(value(formData, key).replace(/[^0-9.-]/g, "")); return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0; }
