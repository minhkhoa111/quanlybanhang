import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/app/admin-auth";
import { logoutAdminAction } from "@/app/admin-login/actions";
import { getEmployeeAttendance, vietnamDate } from "@/db/hr";
import { getReportingOrders } from "@/db/orders";

export const dynamic = "force-dynamic";

export default async function StaffPortal() {
  const user = await requireAdminPage("/staff");
  if (user.role === "owner") redirect("/admin");
  if (user.role === "manager") redirect("/manger");
  const [attendance, orders] = await Promise.all([
    getEmployeeAttendance(user.id, 31).catch(() => []),
    getReportingOrders().then((items) => items.filter((item) => item.assignedAdminId === user.id)).catch(() => []),
  ]);
  const today = attendance.find((item) => item.workDate === vietnamDate());
  const open = orders.filter((item) => ["new", "pending", "confirmed", "processing", "shipping"].includes(item.status));
  const tools = staffTools(user.role);
  return <main className="role-portal admin-console"><section className="role-portal-shell">
    <header><Link href="/staff"><Image src="/huy-apple-logo.png" alt="Huy Apple" width={48} height={48} unoptimized/><span><strong>Huy Apple</strong><small>Cổng làm việc nhân viên</small></span></Link><div><span><strong>{user.name}</strong><small>{roleLabel(user.role)} · {user.branch}</small></span><form action={logoutAdminAction}><button>Đăng xuất</button></form></div></header>
    <section className="role-welcome"><div><span>KHÔNG GIAN LÀM VIỆC</span><h1>Chào {user.name}</h1><p>Các công cụ dưới đây đã được lọc theo vai trò {roleLabel(user.role).toLocaleLowerCase("vi-VN")} của bạn.</p></div><Link href="/admin/attendance">Chấm công ngay →</Link></section>
    <section className="role-metrics"><article><span>Chấm công hôm nay</span><strong>{today ? attendanceLabel(today.status) : "Chưa vào ca"}</strong><small>{today?.checkIn ? `Vào ${today.checkIn}${today.checkOut ? ` · Ra ${today.checkOut}` : ""}` : "Dùng khuôn mặt trên thiết bị cá nhân"}</small></article><article><span>Công việc đang mở</span><strong>{open.length}</strong><small>{orders.length} đơn được phân công</small></article><article><span>Chi nhánh</span><strong>{user.branch || "Chưa phân bổ"}</strong><small>Phạm vi dữ liệu của tài khoản</small></article></section>
    <section className="role-tool-grid">{tools.map((item) => <Tool key={item.href} {...item}/>)}</section>
  </section></main>;
}

function staffTools(role: string) {
  const common = [{ href: "/admin/attendance", icon: "◷", title: "Chấm công khuôn mặt", note: "Vào ca và ra ca bằng thiết bị cá nhân" }];
  if (role === "consultant") return [...common, { href: "/admin/live-chat", icon: "✦", title: "Tư vấn trực tiếp", note: "Nhận và trả lời hội thoại khách hàng" }];
  if (role === "warranty") return [...common, { href: "/admin/orders", icon: "✓", title: "Công việc bảo hành", note: "Theo dõi đơn và thông tin bảo hành được giao" }];
  if (role === "repair") return [...common, { href: "/admin/orders", icon: "⌘", title: "Công việc sửa chữa", note: "Xử lý thiết bị và đơn được phân công" }];
  return [...common, { href: "/admin/orders", icon: "▤", title: "Đơn hàng của tôi", note: "Tiếp nhận và cập nhật đơn được phân công" }, { href: "/admin/products", icon: "▦", title: "Sản phẩm & tồn kho", note: "Tra cứu giá bán và hàng tại cửa hàng" }];
}
function Tool({ href, icon, title, note }: { href: string; icon: string; title: string; note: string }) { return <Link href={href}><i>{icon}</i><span><strong>{title}</strong><small>{note}</small></span><b>→</b></Link>; }
function roleLabel(role: string) { if (role === "consultant") return "Tư vấn viên"; if (role === "warranty") return "Nhân viên bảo hành"; if (role === "repair") return "Nhân viên sửa chữa"; return "Nhân viên bán hàng"; }
function attendanceLabel(status: string) { if (status === "present") return "Đã vào ca"; if (status === "late") return "Đi trễ"; if (status === "leave") return "Nghỉ phép"; return "Vắng"; }
