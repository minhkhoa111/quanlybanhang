import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/app/admin-auth";
import BusinessPortalShell from "@/app/components/BusinessPortalShell";
import { getAdminUsers } from "@/db/admin-users";
import { getBranchById } from "@/db/branches";
import { getEmployeeAttendance, getEmployeeProfile, vietnamDate } from "@/db/hr";
import { getReportingOrders } from "@/db/orders";
import { getWorkTasks } from "@/db/tasks";
import { orderTotalNumber } from "@/app/admin/utils";

export const dynamic = "force-dynamic";

export default async function ManagerPortal() {
  const user = await requireAdminPage("/manager");
  if (user.role === "owner") redirect("/admin");
  if (user.role !== "manager") redirect("/staff");
  const [branch, staff, orders, workTasks, profile, attendance] = await Promise.all([
    getBranchById(user.branchId).catch(() => undefined),
    getAdminUsers().then((items) => items.filter((item) => item.branchId === user.branchId)).catch(() => []),
    getReportingOrders().then((items) => items.filter((item) => item.branchId === user.branchId)).catch(() => []),
    getWorkTasks(user).catch(() => []),
    getEmployeeProfile(user.id).catch(() => undefined),
    getEmployeeAttendance(user.id, 31).catch(() => []),
  ]);
  const delivered = orders.filter((item) => item.status === "delivered");
  const open = orders.filter((item) => ["new", "pending", "confirmed", "processing", "shipping"].includes(item.status));
  const today = attendance.find((item) => item.workDate === vietnamDate());
  const shiftState = today?.checkOut ? "Đã kết thúc ca" : today?.checkIn ? "Đang trong ca" : "Chưa vào ca";
  const branchName = branch?.name || profile?.branch || user.branch || "Chưa phân chi nhánh";

  return <BusinessPortalShell user={user}><section className="staff-shell staff-shell-unified manager-profile-portal">
    <header className="staff-profile-topline">
      <div><span>Không gian quản lý cá nhân</span><h1>Hồ sơ quản lý chi nhánh</h1><p>{fullDate()} · Thông tin đang làm việc của bạn</p></div>
      <span className="staff-employment-status"><i /> {profile?.active !== false ? "Đang làm việc" : "Đã ngừng làm việc"}</span>
    </header>

    <section className="staff-profile-hero">
      <div className="staff-profile-identity">
        <div className="staff-profile-photo">
          {profile?.photoKey ? <Image src={`/api/admin/hr-photo/${user.id}`} alt={`Ảnh quản lý ${user.name}`} width={180} height={210} unoptimized /> : <span>{user.name.charAt(0).toUpperCase()}</span>}
        </div>
        <div className="staff-profile-copy">
          <span className="staff-profile-kicker">Mã nhân viên · {shortEmployeeId(user.id)}</span>
          <h2>{profile?.name || user.name}</h2>
          <p>Quản lý chi nhánh <i /> {branchName}</p>
          <div className="staff-profile-tags"><span><b>✓</b> Hồ sơ đã xác thực</span><span><b>●</b> Tài khoản quản lý hoạt động</span></div>
          <div className="staff-profile-actions">
            <Link href="/admin/attendance" className="is-primary">◎ {today?.checkIn && !today?.checkOut ? "Chấm công ra về" : today?.checkOut ? "Xem chấm công" : "Chấm công vào ca"}</Link>
            <Link href="/staff/card">▣ Xem thẻ nhân sự</Link>
            <Link href="/admin/tasks">✓ Công việc của tôi</Link>
            <Link href={`/admin/branches/${user.branchId}`}>＋ Thêm nhân sự</Link>
          </div>
        </div>
      </div>

      <aside className="staff-profile-shift">
        <div className="staff-profile-shift-head"><span>Ca làm việc hôm nay</span><i className={today?.checkIn && !today?.checkOut ? "is-live" : ""}>{shiftState}</i></div>
        <div className="staff-profile-shift-state"><span className={today?.checkIn ? "is-active" : ""}>◎</span><div><small>Trạng thái chấm công</small><strong>{today ? attendanceLabel(today.status) : "Chưa ghi nhận"}</strong></div></div>
        <div className="staff-profile-shift-times">
          <div><span>Giờ vào</span><strong>{today?.checkIn || "--:--"}</strong></div><i>→</i><div><span>Giờ ra</span><strong>{today?.checkOut || "--:--"}</strong></div>
        </div>
        <Link href="/admin/attendance">Mở camera chấm công <span>→</span></Link>
      </aside>
    </section>

    <section className="staff-personnel-card">
      <div className="staff-section-heading"><div><span>Thông tin từ hồ sơ nhân sự</span><h2>Thông tin cá nhân và công việc</h2></div><small>Giám đốc quản lý và cập nhật hồ sơ này</small></div>
      <dl className="staff-personnel-grid">
        <ProfileField label="Họ và tên" value={profile?.name || user.name} />
        <ProfileField label="Chức vụ" value="Quản lý chi nhánh" />
        <ProfileField label="Chi nhánh" value={branchName} />
        <ProfileField label="Ngày tham gia" value={formatDate(profile?.joinedDate)} />
        <ProfileField label="Ngày sinh" value={formatDate(profile?.dateOfBirth)} />
        <ProfileField label="Số CCCD" value={maskValue(profile?.citizenId)} privateValue />
        <ProfileField label="Tài khoản nội bộ" value={`@${profile?.username || user.username}`} />
        <ProfileField label="Trạng thái nhân sự" value={profile?.active !== false ? "Đang làm việc" : "Đã ngừng làm việc"} active={profile?.active !== false} />
        <ProfileField label="Địa chỉ thường trú" value={profile?.permanentAddress || "Chưa cập nhật"} wide />
        <ProfileField label="Địa chỉ tạm trú" value={profile?.temporaryAddress || "Không có / chưa cập nhật"} wide />
        <ProfileField label="Lương cơ bản" value={formatMoney(profile?.monthlySalary)} />
        <ProfileField label="Ngân hàng" value={profile?.bankName || "Chưa cập nhật"} />
        <ProfileField label="Số tài khoản" value={maskValue(profile?.bankAccountNumber)} privateValue />
        <ProfileField label="Chủ tài khoản" value={profile?.bankAccountName || "Chưa cập nhật"} />
      </dl>
    </section>

    <section className="manager-operations-heading">
      <div><span>Điều hành chi nhánh</span><h2>Tổng quan {branchName}</h2><p>Đơn hàng, nhân sự, báo cáo và công việc trong phạm vi quản lý của bạn.</p></div>
      <Link href={`/admin/branches/${user.branchId}`}>＋ Thêm nhân sự cấp dưới</Link>
    </section>
    <section className="role-metrics"><article><span>Đơn cần xử lý</span><strong>{open.length}</strong><small>{orders.length} tổng đơn tại chi nhánh</small></article><article><span>Công việc đang mở</span><strong>{workTasks.filter((item) => item.status !== "completed").length}</strong><small>{workTasks.filter((item) => item.status === "review").length} báo cáo chờ duyệt</small></article><article><span>Doanh thu đã giao</span><strong>{money(delivered.reduce((sum, item) => sum + orderTotalNumber(item), 0))}</strong><small>{delivered.length} đơn hoàn tất</small></article><article><span>Nhân sự hoạt động</span><strong>{staff.filter((item) => item.active).length}</strong><small>{staff.length} tài khoản được phân bổ</small></article></section>
    <section className="role-tool-grid" aria-label="Công cụ quản lý chi nhánh">
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
function ProfileField({ label, value, wide = false, active = false, privateValue = false }: { label: string; value: string; wide?: boolean; active?: boolean; privateValue?: boolean }) { return <div className={wide ? "is-wide" : ""}><dt>{label}</dt><dd className={active ? "is-active" : ""}>{active && <i />}{value}{privateValue && <small>Riêng tư</small>}</dd></div>; }
function attendanceLabel(status: string) { if (status === "present") return "Đã vào ca"; if (status === "late") return "Đi trễ"; if (status === "leave") return "Nghỉ phép"; return "Vắng"; }
function fullDate() { return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date()); }
function shortEmployeeId(value: string) { return value.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase() || "NV000000"; }
function formatDate(value?: string) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN") : "Chưa cập nhật"; }
function maskValue(value?: string) { if (!value) return "Chưa cập nhật"; const clean = value.replace(/\s/g, ""); return clean.length <= 4 ? clean : `${"•".repeat(Math.min(8, clean.length - 4))} ${clean.slice(-4)}`; }
function formatMoney(value?: number) { return value ? `${new Intl.NumberFormat("vi-VN").format(value)} ₫` : "Chưa cập nhật"; }
function money(value: number) { return `${Math.round(value).toLocaleString("vi-VN")}đ`; }
