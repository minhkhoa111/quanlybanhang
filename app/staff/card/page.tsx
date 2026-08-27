import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/app/admin-auth";
import BusinessPortalShell from "@/app/components/BusinessPortalShell";
import EmployeeCardPreview from "@/app/admin/hr/cards/EmployeeCardPreview";
import { getEmployeeProfile } from "@/db/hr";

export const dynamic = "force-dynamic";

export default async function MyEmployeeCardPage() {
  const user = await requireAdminPage("/staff/card");
  if (user.role === "owner") redirect("/admin/hr/cards");
  const employee = await getEmployeeProfile(user.id);
  if (!employee) redirect(`${user.role === "manager" ? "/manager" : "/staff"}?error=Chưa có hồ sơ nhân sự để tạo thẻ.`);
  return <BusinessPortalShell user={user}>
    <div className="admin-topline"><div><span>THẺ NHÂN SỰ ĐIỆN TỬ</span><h1>Thẻ của tôi</h1><p className="admin-subtitle">Dùng QR hoặc mã vạch để xác thực thông tin nhân sự trong hệ thống.</p></div><div className="admin-actions-row">{user.role === "manager" && <Link className="admin-button admin-button-primary" href={`/admin/hr/${user.id}`}>Cập nhật hồ sơ thẻ</Link>}<Link className="admin-button" href={user.role === "manager" ? "/manager" : "/staff"}>← Trang làm việc</Link></div></div>
    <p className="admin-alert my-card-readonly">Thẻ được tạo từ hồ sơ nhân sự. Nhân viên chỉ có quyền xem; Giám đốc hoặc quản lý chi nhánh mới được cập nhật thông tin.</p>
    <section className="admin-card my-employee-card"><EmployeeCardPreview employee={employee} /></section>
  </BusinessPortalShell>;
}
