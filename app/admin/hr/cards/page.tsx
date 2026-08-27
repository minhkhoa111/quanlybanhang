import Image from "next/image";
import Link from "next/link";
import { requireHrManagerPage } from "@/app/admin-auth";
import { getEmployeeDirectory } from "@/db/hr";
import EmployeeCardPreview from "./EmployeeCardPreview";

export const dynamic = "force-dynamic";

export default async function EmployeeCardsPage({ searchParams }: { searchParams: Promise<{ employee?: string; keyword?: string }> }) {
  const [user, allEmployees, query] = await Promise.all([requireHrManagerPage("/admin/hr/cards"), getEmployeeDirectory().catch(() => []), searchParams]);
  const scoped = (user.role === "owner" ? allEmployees : allEmployees.filter((item) => item.branchId === user.branchId || (!item.branchId && item.branch === user.branch)))
    .filter((item) => item.active)
    .sort((left, right) => roleOrder(left.role) - roleOrder(right.role) || left.name.localeCompare(right.name, "vi"));
  const keyword = (query.keyword || "").trim().toLocaleLowerCase("vi-VN").slice(0, 80);
  const employees = keyword ? scoped.filter((item) => `${item.name} ${item.username} ${item.branch}`.toLocaleLowerCase("vi-VN").includes(keyword)) : scoped;
  const selected = scoped.find((item) => item.adminUserId === query.employee) || employees[0] || scoped[0];

  return <>
    <div className="admin-topline employee-cards-heading"><div><span>NHẬN DIỆN NHÂN SỰ</span><h1>Tạo thẻ nhân viên</h1><p className="admin-subtitle">{user.role === "owner" ? "Tạo và in thẻ cho nhân sự trên toàn hệ thống." : `Chỉ tạo thẻ cho nhân sự thuộc ${user.branch}.`}</p></div><Link className="admin-button" href="/admin/hr">← Hồ sơ nhân sự</Link></div>
    <section className="employee-cards-layout">
      <aside className="admin-card employee-card-directory">
        <div><span>{scoped.length} NHÂN SỰ ĐANG LÀM VIỆC</span><h2>Chọn nhân viên</h2></div>
        <form><label><span aria-hidden="true">⌕</span><input name="keyword" defaultValue={query.keyword || ""} placeholder="Tìm tên, tài khoản, chi nhánh" /></label><button type="submit">Tìm</button></form>
        <nav>{employees.map((employee) => <Link key={employee.adminUserId} href={`/admin/hr/cards?employee=${encodeURIComponent(employee.adminUserId)}${query.keyword ? `&keyword=${encodeURIComponent(query.keyword)}` : ""}`} className={selected?.adminUserId === employee.adminUserId ? "is-active" : ""}>
          <span className="employee-card-list-avatar">{employee.photoKey ? <Image src={`/api/admin/hr-photo/${employee.adminUserId}`} alt="" width={42} height={42} unoptimized /> : employee.name.slice(0, 1).toUpperCase()}</span>
          <span><strong>{employee.name}</strong><small>{roleLabel(employee.role)} · {employee.branch}</small></span><b>›</b>
        </Link>)}</nav>
        {!employees.length && <p className="admin-empty-state">Không tìm thấy nhân viên phù hợp.</p>}
      </aside>
      <section className="admin-card employee-card-studio">
        <div className="employee-card-studio-title"><div><span>XEM TRƯỚC HAI MẶT</span><h2>{selected ? `Thẻ của ${selected.name}` : "Chưa có nhân viên"}</h2></div><small>QR và mã vạch được tạo cục bộ, không gửi dữ liệu ra ngoài.</small></div>
        {selected ? <EmployeeCardPreview employee={selected} /> : <div className="admin-empty-state">Chưa có nhân sự đang hoạt động trong phạm vi quản lý.</div>}
      </section>
    </section>
  </>;
}

function roleLabel(role: string) { if (role === "manager") return "Quản lý chi nhánh"; if (role === "consultant") return "Tư vấn"; if (role === "warranty") return "Bảo hành"; if (role === "repair") return "Sửa chữa"; return "Bán hàng"; }
function roleOrder(role: string) { return role === "manager" ? 0 : role === "sales" ? 1 : role === "consultant" ? 2 : role === "warranty" ? 3 : role === "repair" ? 4 : 5; }
