import Link from "next/link";
import { requireAdminPage } from "@/app/admin-auth";
import { getAdminUsers } from "@/db/admin-users";
import { getWorkReports, getWorkTasks } from "@/db/tasks";
import { completeTaskAction, createTaskAction, reportTaskAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const [user, query] = await Promise.all([requireAdminPage("/admin/tasks"), searchParams]);
  const canAssign = user.role === "owner" || user.role === "manager";
  const [tasks, allUsers] = await Promise.all([getWorkTasks(user).catch(() => []), canAssign ? getAdminUsers().catch(() => []) : Promise.resolve([])]);
  const reports = await getWorkReports(tasks.map((task) => task.id)).catch(() => []);
  const assignees = allUsers.filter((item) => item.active && item.role !== "owner" && (user.role === "owner" || (item.branchId === user.branchId && item.role !== "manager")));
  const reportMap = new Map<string, typeof reports>();
  reports.forEach((report) => reportMap.set(report.taskId, [...(reportMap.get(report.taskId) || []), report]));
  const active = tasks.filter((task) => task.status !== "completed").length;
  const reviewing = tasks.filter((task) => task.status === "review").length;
  const overdue = tasks.filter((task) => task.status !== "completed" && task.dueDate && task.dueDate < today()).length;

  return <>
    <div className="admin-topline"><div><span>WORK MANAGEMENT</span><h1>Giao việc & báo cáo</h1><p className="admin-subtitle">{user.role === "owner" ? "Theo dõi công việc và báo cáo của toàn hệ thống." : user.role === "manager" ? `Điều phối công việc tại ${user.branch}.` : "Xem nhiệm vụ được giao và gửi báo cáo tiến độ."}</p></div>{user.role !== "owner" && <Link className="admin-button" href={user.role === "manager" ? "/manager" : "/staff"}>← Trang làm việc</Link>}</div>
    {query.status === "created" && <p className="admin-alert success">Đã giao việc và thông báo trong hệ thống.</p>}
    {query.status === "reported" && <p className="admin-alert success">Đã gửi báo cáo tiến độ.</p>}
    {query.status === "completed" && <p className="admin-alert success">Đã duyệt hoàn thành công việc.</p>}
    {query.error && <p className="admin-alert error">{query.error}</p>}

    <section className="work-task-kpis"><TaskMetric label="Tổng công việc" value={tasks.length} note={`${active} đang thực hiện`} /><TaskMetric label="Chờ duyệt" value={reviewing} note="Báo cáo mới từ nhân viên" /><TaskMetric label="Quá hạn" value={overdue} note="Cần ưu tiên xử lý" /></section>

    {canAssign && <section className="admin-card work-task-create">
      <div className="admin-card-head"><div><span>GIAO NHIỆM VỤ MỚI</span><h2>Thông tin công việc</h2></div><small>File tối đa 15 MB · PDF, Office, ZIP hoặc hình ảnh</small></div>
      <form action={createTaskAction}>
        <label className="admin-field work-task-title"><span>Tên công việc</span><input name="title" minLength={3} maxLength={160} placeholder="Ví dụ: Kiểm kê kho iPhone cuối tháng" required /></label>
        <label className="admin-field"><span>Nhân viên thực hiện</span><select name="assignedTo" required><option value="">Chọn nhân viên</option>{assignees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} · {roleLabel(employee.role)} · {employee.branch}</option>)}</select></label>
        <label className="admin-field"><span>Mức ưu tiên</span><select name="priority" defaultValue="normal"><option value="low">Thấp</option><option value="normal">Bình thường</option><option value="high">Cao</option><option value="urgent">Khẩn cấp</option></select></label>
        <label className="admin-field"><span>Hạn hoàn thành</span><input type="date" name="dueDate" min={today()} /></label>
        <label className="admin-field work-task-description"><span>Mô tả và yêu cầu</span><textarea name="description" rows={4} maxLength={3000} placeholder="Mục tiêu, yêu cầu bàn giao, tiêu chí hoàn thành..." /></label>
        <label className="admin-field work-task-file"><span>File công việc</span><input type="file" name="attachment" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.jpg,.jpeg,.png,.webp" /><small>Tài liệu hướng dẫn, biểu mẫu, bảng tính hoặc hình ảnh.</small></label>
        <button className="admin-button admin-button-primary" type="submit">＋ Giao việc</button>
      </form>
    </section>}

    <section className="work-task-list">
      <div className="work-task-section-title"><div><span>{tasks.length} NHIỆM VỤ</span><h2>{canAssign ? "Theo dõi công việc" : "Công việc của tôi"}</h2></div></div>
      {tasks.map((task) => {
        const taskReports = reportMap.get(task.id) || [];
        return <article className={`admin-card work-task-card priority-${task.priority}`} key={task.id}>
          <header><div><span className={`work-task-priority priority-${task.priority}`}>{priorityLabel(task.priority)}</span><span className={`admin-badge work-status-${task.status}`}>{statusLabel(task.status)}</span></div><time>{task.dueDate ? `Hạn ${formatDate(task.dueDate)}` : "Không đặt hạn"}</time></header>
          <div className="work-task-main"><div><h3>{task.title}</h3><p>{task.description || "Không có mô tả bổ sung."}</p><div className="work-task-meta"><span>♙ <strong>{task.assignedName}</strong></span><span>⌂ {task.branchName || "Chưa phân chi nhánh"}</span><span>↗ Giao bởi {task.createdByName}</span></div>{task.attachmentKey && <Link className="work-file-link" href={`/api/admin/task-files/task/${task.id}`}>▤ Tải file công việc · {task.attachmentName}</Link>}</div><strong className="work-task-progress">{taskReports[0]?.progress ?? 0}<small>%</small></strong></div>
          {taskReports.length > 0 && <section className="work-report-history"><h4>Báo cáo gần nhất</h4>{taskReports.slice(0, 3).map((report) => <article key={report.id}><span>{report.authorName.slice(0, 1).toUpperCase()}</span><div><strong>{report.authorName}<small>{new Date(report.createdAt).toLocaleString("vi-VN")}</small></strong><p>{report.message}</p>{report.attachmentKey && <Link href={`/api/admin/task-files/report/${report.id}`}>↧ {report.attachmentName}</Link>}</div><b>{report.progress}%</b></article>)}</section>}
          {task.status !== "completed" && <footer><form action={reportTaskAction} className="work-report-form"><input type="hidden" name="taskId" value={task.id} /><label className="admin-field"><span>Báo cáo tiến độ</span><textarea name="message" rows={2} placeholder="Nội dung đã thực hiện, khó khăn hoặc kết quả..." /></label><label className="admin-field"><span>Hoàn thành (%)</span><input type="number" name="progress" min="0" max="100" defaultValue={taskReports[0]?.progress ?? 0} /></label><label className="admin-field"><span>Trạng thái gửi</span><select name="taskStatus" defaultValue="in_progress"><option value="in_progress">Đang thực hiện</option><option value="review">Gửi duyệt</option></select></label><label className="admin-field"><span>File báo cáo</span><input type="file" name="reportAttachment" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.jpg,.jpeg,.png,.webp" /></label><button className="admin-button admin-button-primary" type="submit">Gửi báo cáo</button></form>{canAssign && <form action={completeTaskAction} className="work-complete-form"><input type="hidden" name="taskId" value={task.id} /><button className="admin-button" type="submit">✓ Duyệt hoàn thành</button></form>}</footer>}
        </article>;
      })}
      {!tasks.length && <div className="admin-card admin-empty-state">Chưa có công việc nào trong phạm vi tài khoản.</div>}
    </section>
  </>;
}

function TaskMetric({ label, value, note }: { label: string; value: number; note: string }) { return <article><span>{label}</span><strong>{value}</strong><small>{note}</small></article>; }
function roleLabel(role: string) { if (role === "manager") return "Quản lý"; if (role === "consultant") return "Tư vấn"; if (role === "warranty") return "Bảo hành"; if (role === "repair") return "Sửa chữa"; return "Bán hàng"; }
function priorityLabel(value: string) { if (value === "urgent") return "Khẩn cấp"; if (value === "high") return "Ưu tiên cao"; if (value === "low") return "Ưu tiên thấp"; return "Bình thường"; }
function statusLabel(value: string) { if (value === "in_progress") return "Đang thực hiện"; if (value === "review") return "Chờ duyệt"; if (value === "completed") return "Hoàn thành"; return "Đã giao"; }
function formatDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN"); }
function today() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date()); }
