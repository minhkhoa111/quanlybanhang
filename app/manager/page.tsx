import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/app/admin-auth";
import BusinessPortalShell from "@/app/components/BusinessPortalShell";
import { getAdminUsers } from "@/db/admin-users";
import { getBranchById } from "@/db/branches";
import { getReportingOrders } from "@/db/orders";
import { getWorkTasks } from "@/db/tasks";
import { orderTotalNumber } from "@/app/admin/utils";

export const dynamic = "force-dynamic";

export default async function ManagerPortal() {
  const user = await requireAdminPage("/manager");
  if (user.role === "owner") redirect("/admin");
  if (user.role !== "manager") redirect("/staff");
  const [branch, staff, orders, workTasks] = await Promise.all([
    getBranchById(user.branchId).catch(() => undefined),
    getAdminUsers().then((items) => items.filter((item) => item.branchId === user.branchId)).catch(() => []),
    getReportingOrders().then((items) => items.filter((item) => item.branchId === user.branchId)).catch(() => []),
    getWorkTasks(user).catch(() => []),
  ]);
  const delivered = orders.filter((item) => item.status === "delivered");
  const open = orders.filter((item) => ["new", "pending", "confirmed", "processing", "shipping"].includes(item.status));
  return <BusinessPortalShell user={user}><section className="role-portal-shell role-portal-shell-unified">
    <section className="role-welcome"><div><span>QUẢN LÝ CHI NHÁNH</span><h1>Chào {user.name}</h1><p>Điều hành đơn hàng, nhân sự, tư vấn và doanh thu trong đúng phạm vi {branch?.name || user.branch}.</p></div><Link href={`/admin/branches/${user.branchId}`}>＋ Thêm nhân sự cấp dưới</Link></section>
    <section className="role-metrics"><article><span>Đơn cần xử lý</span><strong>{open.length}</strong><small>{orders.length} tổng đơn tại chi nhánh</small></article><article><span>Công việc đang mở</span><strong>{workTasks.filter((item) => item.status !== "completed").length}</strong><small>{workTasks.filter((item) => item.status === "review").length} báo cáo chờ duyệt</small></article><article><span>Doanh thu đã giao</span><strong>{money(delivered.reduce((sum, item) => sum + orderTotalNumber(item), 0))}</strong><small>{delivered.length} đơn hoàn tất</small></article><article><span>Nhân sự hoạt động</span><strong>{staff.filter((item) => item.active).length}</strong><small>{staff.length} tài khoản được phân bổ</small></article></section>
    <section className="role-tool-grid">
      <Tool href="/admin/orders" icon="▤" title="Đơn hàng chi nhánh" note="Tiếp nhận, phân công và theo dõi đơn"/>
      <Tool href="/admin/tasks" icon="✓" title="Giao việc & báo cáo" note="Giao nhiệm vụ, nhận file và duyệt báo cáo"/>
      <Tool href="/admin/live-chat" icon="✦" title="Tư vấn trực tiếp" note="Kết nối khách với tư vấn viên"/>
      <Tool href="/admin/products" icon="▦" title="Sản phẩm & tồn kho" note="Kiểm tra hàng hóa và giá bán"/>
      <Tool href={`/admin/branches/${user.branchId}`} icon="♧" title="Nhân sự chi nhánh" note="Xem danh sách và thêm nhân sự cấp dưới"/>
      <Tool href="/admin/hr" icon="⌘" title="Hồ sơ nhân viên" note="Cập nhật ảnh và thông tin nhân sự"/>
      <Tool href="/admin/hr/cards" icon="▣" title="Tạo thẻ nhân sự" note="Tạo QR, mã vạch và in thẻ nhân viên"/>
      <Tool href="/staff/card" icon="♙" title="Thẻ nhân sự của tôi" note="Xem thẻ ảo và mã xác thực cá nhân"/>
      <Tool href="/admin/attendance" icon="◷" title="Chấm công" note="Theo dõi ngày công của đội ngũ"/>
      <Tool href="/admin/face-test" icon="◎" title="Đăng ký khuôn mặt" note="Đăng ký nhân sự thuộc chi nhánh để chấm công"/>
      <Tool href="/admin/reports" icon="↗" title="Báo cáo chi nhánh" note="Doanh thu và hiệu suất nhân viên"/>
      <Tool href="/admin/cameras" icon="◉" title="Camera được cấp quyền" note="Giám sát camera theo phân quyền"/>
    </section>
  </section></BusinessPortalShell>;
}

function Tool({ href, icon, title, note }: { href: string; icon: string; title: string; note: string }) { return <Link href={href}><i>{icon}</i><span><strong>{title}</strong><small>{note}</small></span><b>→</b></Link>; }
function money(value: number) { return `${Math.round(value).toLocaleString("vi-VN")}đ`; }
