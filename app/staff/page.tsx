import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/app/admin-auth";
import BusinessPortalShell from "@/app/components/BusinessPortalShell";
import { getEmployeeAttendance, getEmployeeProfile, vietnamDate } from "@/db/hr";
import { getReportingOrders } from "@/db/orders";
import { getWorkTasks } from "@/db/tasks";

export const dynamic = "force-dynamic";

export default async function StaffPortal() {
  const user = await requireAdminPage("/staff");
  if (user.role === "owner") redirect("/admin");
  if (user.role === "manager") redirect("/manager");

  const [profile, attendance, orders, workTasks] = await Promise.all([
    getEmployeeProfile(user.id).catch(() => undefined),
    getEmployeeAttendance(user.id, 31).catch(() => []),
    getReportingOrders().then((items) => items.filter((item) => item.assignedAdminId === user.id)).catch(() => []),
    getWorkTasks(user).catch(() => []),
  ]);
  const today = attendance.find((item) => item.workDate === vietnamDate());
  const open = orders.filter((item) => ["new", "pending", "confirmed", "processing", "shipping"].includes(item.status));
  const completed = orders.filter((item) => item.status === "delivered");
  const tools = staffTools(user.role);
  const role = roleLabel(user.role);
  const monthKey = vietnamDate().slice(0, 7);
  const monthRecords = attendance.filter((item) => item.workDate.startsWith(monthKey));
  const workedDays = monthRecords.filter((item) => item.status === "present" || item.status === "late").length;
  const shiftState = today?.checkOut ? "Đã kết thúc ca" : today?.checkIn ? "Đang trong ca" : "Chưa vào ca";

  return <BusinessPortalShell user={user}>
    <section className="staff-shell staff-shell-unified">
      <header className="staff-profile-topline">
        <div><span>Hồ sơ làm việc cá nhân</span><h1>Thông tin nhân viên</h1><p>{fullDate()} · Dữ liệu chỉ hiển thị cho tài khoản của bạn</p></div>
        <span className="staff-employment-status"><i /> {profile?.active !== false ? "Đang làm việc" : "Đã ngừng làm việc"}</span>
      </header>

      <section className="staff-profile-hero">
        <div className="staff-profile-identity">
          <div className="staff-profile-photo">
            {profile?.photoKey ? <Image src={`/api/admin/hr-photo/${user.id}`} alt={`Ảnh nhân viên ${user.name}`} width={180} height={210} unoptimized /> : <span>{user.name.charAt(0).toUpperCase()}</span>}
          </div>
          <div className="staff-profile-copy">
            <span className="staff-profile-kicker">Mã nhân viên · {shortEmployeeId(user.id)}</span>
            <h2>{user.name}</h2>
            <p>{role} <i /> {user.branch || "Chưa phân chi nhánh"}</p>
            <div className="staff-profile-tags"><span><b>✓</b> Hồ sơ đã xác thực</span><span><b>●</b> Tài khoản hoạt động</span></div>
            <div className="staff-profile-actions">
              <Link href="/admin/attendance" className="is-primary">◎ {today?.checkIn && !today?.checkOut ? "Chấm công ra về" : today?.checkOut ? "Xem chấm công" : "Chấm công vào ca"}</Link>
              <Link href="/staff/card">▣ Xem thẻ nhân sự</Link>
              <Link href="/admin/tasks">✓ Công việc của tôi</Link>
            </div>
          </div>
        </div>

        <aside className="staff-profile-shift">
          <div className="staff-profile-shift-head"><span>Ca làm việc hôm nay</span><i className={today?.checkIn && !today?.checkOut ? "is-live" : ""}>{shiftState}</i></div>
          <div className="staff-profile-shift-state"><span className={today?.checkIn ? "is-active" : ""}>◎</span><div><small>Trạng thái chấm công</small><strong>{today ? attendanceLabel(today.status) : "Chưa ghi nhận"}</strong></div></div>
          <div className="staff-profile-shift-times">
            <div><span>Giờ vào</span><strong>{today?.checkIn || "--:--"}</strong></div>
            <i>→</i>
            <div><span>Giờ ra</span><strong>{today?.checkOut || "--:--"}</strong></div>
          </div>
          <Link href="/admin/attendance">Mở camera chấm công <span>→</span></Link>
        </aside>
      </section>

      <section className="staff-personnel-card">
        <div className="staff-section-heading"><div><span>Thông tin từ hồ sơ nhân sự</span><h2>Thông tin cá nhân và công việc</h2></div><small>Cập nhật bởi Giám đốc hoặc quản lý chi nhánh</small></div>
        <dl className="staff-personnel-grid">
          <ProfileField label="Họ và tên" value={profile?.name || user.name} />
          <ProfileField label="Chức vụ" value={role} />
          <ProfileField label="Chi nhánh" value={profile?.branch || user.branch || "Chưa phân bổ"} />
          <ProfileField label="Ngày tham gia" value={formatDate(profile?.joinedDate)} />
          <ProfileField label="Ngày sinh" value={formatDate(profile?.dateOfBirth)} />
          <ProfileField label="Số CCCD" value={maskValue(profile?.citizenId)} privateValue />
          <ProfileField label="Tài khoản nội bộ" value={`@${profile?.username || user.username}`} />
          <ProfileField label="Trạng thái nhân sự" value={profile?.active !== false ? "Đang làm việc" : "Đã ngừng làm việc"} active={profile?.active !== false} />
          <ProfileField label="Địa chỉ thường trú" value={profile?.permanentAddress || "Chưa cập nhật"} wide />
          <ProfileField label="Địa chỉ tạm trú" value={profile?.temporaryAddress || "Không có / chưa cập nhật"} wide />
        </dl>
      </section>

      <section className="staff-metrics" aria-label="Tổng quan công việc">
        <Metric icon="◷" label="Chấm công" value={today ? attendanceLabel(today.status) : "Chưa vào ca"} note={today?.checkIn ? `${today.checkIn}${today.checkOut ? ` — ${today.checkOut}` : " — đang làm việc"}` : "Quét khuôn mặt để bắt đầu"} tone="blue" />
        <Metric icon="▣" label="Ngày công tháng này" value={String(workedDays).padStart(2, "0")} note={`${monthRecords.filter((item) => item.status === "late").length} ngày đi trễ`} tone="green" />
        <Metric icon="▤" label="Công việc đang mở" value={String(open.length + workTasks.filter((item) => item.status !== "completed").length).padStart(2, "0")} note={`${completed.length} đơn hàng đã hoàn thành`} tone="violet" />
        <Metric icon="⌂" label="Chi nhánh làm việc" value={user.branch || "Chưa phân bổ"} note={role} tone="gold" />
      </section>

      <section className="staff-workspace">
        <div className="staff-tools-panel">
          <div className="staff-section-heading"><div><span>Truy cập nhanh</span><h2>Công cụ của bạn</h2></div><small>Đã lọc theo quyền {role.toLocaleLowerCase("vi-VN")}</small></div>
          <div className="staff-tool-grid">{tools.map((item, index) => <Tool key={item.href} {...item} index={index} />)}</div>
        </div>

        <aside className="staff-employment-card">
          <div><span>Thông tin nhận lương</span><h2>Hồ sơ tài chính</h2><p>Thông tin được mã hóa và chỉ dùng cho nghiệp vụ nhân sự.</p></div>
          <dl><div><dt>Lương cơ bản</dt><dd>{formatMoney(profile?.monthlySalary)}</dd></div><div><dt>Ngân hàng</dt><dd>{profile?.bankName || "Chưa cập nhật"}</dd></div><div><dt>Số tài khoản</dt><dd>{maskValue(profile?.bankAccountNumber)}</dd></div><div><dt>Chủ tài khoản</dt><dd>{profile?.bankAccountName || "Chưa cập nhật"}</dd></div></dl>
          <Link href="/staff/card">Xem thẻ nhân sự của tôi <span>→</span></Link>
        </aside>
      </section>

      <section className="staff-tasks-panel">
        <div className="staff-section-heading"><div><span>Công việc gần đây</span><h2>Đơn hàng được phân công</h2></div><Link href="/admin/orders">Xem tất cả <span>→</span></Link></div>
        <div className="staff-task-list">
          {orders.slice(0, 5).map((order) => <Link href={`/admin/orders/${order.id}`} key={order.id}><span className={`staff-task-icon status-${order.status}`}>▤</span><div><strong>{order.customerName}</strong><small>{order.productName}</small></div><time>{new Date(order.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</time><em className={`status-${order.status}`}>{statusLabel(order.status)}</em><b>→</b></Link>)}
          {!orders.length && <div className="staff-empty-tasks"><span>✓</span><div><strong>Chưa có công việc mới</strong><small>Khi quản lý phân công, đơn hàng sẽ xuất hiện tại đây.</small></div></div>}
        </div>
      </section>

      <footer className="staff-footer"><span>Infinity Company · Internal Workspace</span><small>Dữ liệu được giới hạn theo tài khoản và chi nhánh của bạn.</small></footer>
    </section>
  </BusinessPortalShell>;
}

function Metric({ icon, label, value, note, tone }: { icon: string; label: string; value: string; note: string; tone: string }) {
  return <article><i className={`tone-${tone}`}>{icon}</i><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

function ProfileField({ label, value, wide = false, active = false, privateValue = false }: { label: string; value: string; wide?: boolean; active?: boolean; privateValue?: boolean }) {
  return <div className={wide ? "is-wide" : ""}><dt>{label}</dt><dd className={active ? "is-active" : ""}>{active && <i />}{value}{privateValue && <small>Riêng tư</small>}</dd></div>;
}

function staffTools(role: string) {
  const common = [{ href: "/admin/attendance", icon: "◎", eyebrow: "Sinh trắc học", title: "Chấm công khuôn mặt", note: "Tự động nhận diện để vào ca và ra ca an toàn." }, { href: "/admin/tasks", icon: "✓", eyebrow: "Nhiệm vụ", title: "Báo cáo công việc", note: "Xem việc được giao, cập nhật tiến độ và gửi file báo cáo." }, { href: "/staff/card", icon: "▣", eyebrow: "Hồ sơ", title: "Thẻ nhân sự của tôi", note: "Xem thẻ ảo, QR và mã vạch xác thực cá nhân." }];
  if (role === "consultant") return [...common, { href: "/admin/live-chat", icon: "✦", eyebrow: "Khách hàng", title: "Tư vấn trực tiếp", note: "Tiếp nhận và trả lời khách đang chờ tại chi nhánh." }];
  if (role === "warranty") return [...common, { href: "/admin/orders", icon: "✓", eyebrow: "Dịch vụ", title: "Công việc bảo hành", note: "Theo dõi thiết bị và phiếu bảo hành được phân công." }];
  if (role === "repair") return [...common, { href: "/admin/orders", icon: "⌘", eyebrow: "Kỹ thuật", title: "Công việc sửa chữa", note: "Cập nhật tiến độ xử lý thiết bị được bàn giao." }];
  return [...common, { href: "/admin/orders", icon: "▤", eyebrow: "Bán hàng", title: "Đơn hàng của tôi", note: "Tiếp nhận và cập nhật đơn hàng đang phụ trách." }, { href: "/admin/products", icon: "▦", eyebrow: "Tra cứu", title: "Sản phẩm & tồn kho", note: "Kiểm tra nhanh giá bán và hàng còn tại cửa hàng." }];
}

function Tool({ href, icon, eyebrow, title, note, index }: { href: string; icon: string; eyebrow: string; title: string; note: string; index: number }) {
  return <Link href={href} className={`tone-${["blue", "violet", "green"][index % 3]}`}><span className="staff-tool-icon">{icon}</span><div><small>{eyebrow}</small><strong>{title}</strong><p>{note}</p></div><b>↗</b></Link>;
}

function roleLabel(role: string) { if (role === "consultant") return "Tư vấn viên"; if (role === "warranty") return "Nhân viên bảo hành"; if (role === "repair") return "Nhân viên sửa chữa"; return "Nhân viên bán hàng"; }
function attendanceLabel(status: string) { if (status === "present") return "Đã vào ca"; if (status === "late") return "Đi trễ"; if (status === "leave") return "Nghỉ phép"; return "Vắng"; }
function statusLabel(status: string) { if (status === "delivered") return "Hoàn thành"; if (status === "shipping") return "Đang giao"; if (status === "processing") return "Đang xử lý"; if (status === "confirmed") return "Đã xác nhận"; if (status === "cancelled") return "Đã hủy"; return "Chờ tiếp nhận"; }
function fullDate() { return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date()); }
function shortEmployeeId(value: string) { return value.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase() || "NV000000"; }
function formatDate(value?: string) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN") : "Chưa cập nhật"; }
function maskValue(value?: string) { if (!value) return "Chưa cập nhật"; const clean = value.replace(/\s/g, ""); return clean.length <= 4 ? clean : `${"•".repeat(Math.min(8, clean.length - 4))} ${clean.slice(-4)}`; }
function formatMoney(value?: number) { return value ? `${new Intl.NumberFormat("vi-VN").format(value)} ₫` : "Chưa cập nhật"; }
