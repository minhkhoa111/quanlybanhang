import { canManageEmployee, requireHrManagerPage } from "@/app/admin-auth";
import { getAdminUsers } from "@/db/admin-users";
import FaceTestConsole from "./FaceTestConsole";

export const dynamic = "force-dynamic";

export default async function FaceTestPage() {
  const manager = await requireHrManagerPage("/admin/face-test");
  const allEmployees = await getAdminUsers().catch(() => []);
  const employees = manager.role === "owner" ? allEmployees : allEmployees.filter((employee) => canManageEmployee(manager, employee));

  return (
    <>
      <div className="admin-topline face-test-topline">
        <div>
          <span>AI &amp; sinh trắc học</span>
          <h1>Đăng ký khuôn mặt nhân sự</h1>
          <p className="admin-subtitle">{manager.role === "owner" ? "Đăng ký khuôn mặt nhân viên toàn hệ thống." : `Đăng ký khuôn mặt nhân sự thuộc ${manager.branch}.`}</p>
        </div>
        <div className="face-test-model"><i>AI</i><span><small>Mô hình nhận diện</small><strong>Facenet512 · DeepFace</strong></span></div>
      </div>
      <FaceTestConsole employees={employees.map(({ id, name, role, branch, active }) => ({ id, name, role, branch, active }))} scopeLabel={manager.role === "owner" ? "Toàn hệ thống" : manager.branch} />
    </>
  );
}
