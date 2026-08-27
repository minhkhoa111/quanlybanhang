import { env } from "cloudflare:workers";
import type { AdminUser } from "@/db/admin-users";
import { ensureAdminUserStore } from "@/db/admin-users";

type Bindings = { DB: D1Database };

export type WorkTask = {
  id: string; title: string; description: string; priority: string; dueDate: string; status: string;
  branchId: string; branchName: string; assignedTo: string; assignedName: string;
  createdBy: string; createdByName: string; attachmentKey: string; attachmentName: string; attachmentType: string;
  createdAt: number; updatedAt: number;
};
export type WorkReport = {
  id: string; taskId: string; authorId: string; authorName: string; message: string; progress: number;
  attachmentKey: string; attachmentName: string; attachmentType: string; createdAt: number;
};

const database = () => {
  const value = (env as unknown as Bindings).DB;
  if (!value) throw new Error("Cơ sở dữ liệu công việc chưa sẵn sàng.");
  return value;
};

let ready: Promise<void> | null = null;
export function ensureTaskStore() {
  if (!ready) ready = initialize().catch((error) => { ready = null; throw error; });
  return ready;
}

async function initialize() {
  await ensureAdminUserStore();
  await database().batch([
    database().prepare(`CREATE TABLE IF NOT EXISTS work_tasks (
      id TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',priority TEXT NOT NULL DEFAULT 'normal',
      due_date TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'assigned',branch_id TEXT NOT NULL DEFAULT '',branch_name TEXT NOT NULL DEFAULT '',
      assigned_to TEXT NOT NULL,assigned_name TEXT NOT NULL,created_by TEXT NOT NULL,created_by_name TEXT NOT NULL,
      attachment_key TEXT NOT NULL DEFAULT '',attachment_name TEXT NOT NULL DEFAULT '',attachment_type TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL
    )`),
    database().prepare("CREATE INDEX IF NOT EXISTS work_tasks_assignee_idx ON work_tasks(assigned_to,status,due_date)"),
    database().prepare("CREATE INDEX IF NOT EXISTS work_tasks_branch_idx ON work_tasks(branch_id,status,due_date)"),
    database().prepare(`CREATE TABLE IF NOT EXISTS work_task_reports (
      id TEXT PRIMARY KEY,task_id TEXT NOT NULL,author_id TEXT NOT NULL,author_name TEXT NOT NULL,message TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,attachment_key TEXT NOT NULL DEFAULT '',attachment_name TEXT NOT NULL DEFAULT '',
      attachment_type TEXT NOT NULL DEFAULT '',created_at INTEGER NOT NULL
    )`),
    database().prepare("CREATE INDEX IF NOT EXISTS work_task_reports_task_idx ON work_task_reports(task_id,created_at)"),
  ]);
}

export async function createWorkTask(input: Omit<WorkTask, "createdAt" | "updatedAt">) {
  await ensureTaskStore();
  const now = Date.now();
  await database().prepare(`INSERT INTO work_tasks (
    id,title,description,priority,due_date,status,branch_id,branch_name,assigned_to,assigned_name,created_by,created_by_name,
    attachment_key,attachment_name,attachment_type,created_at,updated_at
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
    input.id, clean(input.title, 160), clean(input.description, 3000), normalizePriority(input.priority), cleanDate(input.dueDate),
    "assigned", input.branchId, clean(input.branchName, 140), input.assignedTo, clean(input.assignedName, 120), input.createdBy,
    clean(input.createdByName, 120), input.attachmentKey, clean(input.attachmentName, 180), clean(input.attachmentType, 100), now, now,
  ).run();
}

export async function getWorkTasks(user: AdminUser) {
  await ensureTaskStore();
  const query = user.role === "owner"
    ? database().prepare("SELECT * FROM work_tasks ORDER BY CASE status WHEN 'review' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'assigned' THEN 2 ELSE 3 END,due_date,created_at DESC")
    : user.role === "manager"
      ? database().prepare("SELECT * FROM work_tasks WHERE branch_id=? OR (branch_id='' AND LOWER(branch_name)=LOWER(?)) OR assigned_to=? ORDER BY CASE status WHEN 'review' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'assigned' THEN 2 ELSE 3 END,due_date,created_at DESC").bind(user.branchId, user.branch, user.id)
      : database().prepare("SELECT * FROM work_tasks WHERE assigned_to=? ORDER BY CASE status WHEN 'review' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'assigned' THEN 2 ELSE 3 END,due_date,created_at DESC").bind(user.id);
  const rows = await query.all<Record<string, unknown>>();
  return rows.results.map(mapTask);
}

export async function getWorkTask(id: string) {
  await ensureTaskStore();
  const row = await database().prepare("SELECT * FROM work_tasks WHERE id=? LIMIT 1").bind(id).first<Record<string, unknown>>();
  return row ? mapTask(row) : undefined;
}

export function canAccessTask(user: AdminUser, task: WorkTask) {
  if (user.role === "owner") return true;
  if (user.role === "manager") return task.branchId === user.branchId || (!task.branchId && task.branchName.trim().toLocaleLowerCase("vi-VN") === user.branch.trim().toLocaleLowerCase("vi-VN")) || task.assignedTo === user.id;
  return task.assignedTo === user.id;
}

export async function addWorkReport(input: Omit<WorkReport, "createdAt"> & { taskStatus: string }) {
  await ensureTaskStore();
  const now = Date.now();
  const progress = Math.min(100, Math.max(0, Math.round(input.progress)));
  const status = input.taskStatus === "review" || progress >= 100 ? "review" : "in_progress";
  await database().batch([
    database().prepare(`INSERT INTO work_task_reports (
      id,task_id,author_id,author_name,message,progress,attachment_key,attachment_name,attachment_type,created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(input.id, input.taskId, input.authorId, clean(input.authorName, 120), clean(input.message, 3000), progress, input.attachmentKey, clean(input.attachmentName, 180), clean(input.attachmentType, 100), now),
    database().prepare("UPDATE work_tasks SET status=?,updated_at=? WHERE id=?").bind(status, now, input.taskId),
  ]);
}

export async function completeWorkTask(id: string) {
  await ensureTaskStore();
  await database().prepare("UPDATE work_tasks SET status='completed',updated_at=? WHERE id=?").bind(Date.now(), id).run();
}

export async function getWorkReports(taskIds: string[]) {
  await ensureTaskStore();
  if (!taskIds.length) return [];
  const placeholders = taskIds.map(() => "?").join(",");
  const rows = await database().prepare(`SELECT * FROM work_task_reports WHERE task_id IN (${placeholders}) ORDER BY created_at DESC`).bind(...taskIds).all<Record<string, unknown>>();
  return rows.results.map(mapReport);
}

export async function getTaskFile(kind: "task" | "report", id: string) {
  await ensureTaskStore();
  if (kind === "task") {
    const row = await database().prepare("SELECT * FROM work_tasks WHERE id=? LIMIT 1").bind(id).first<Record<string, unknown>>();
    if (!row) return undefined;
    const task = mapTask(row);
    return { task, key: task.attachmentKey, name: task.attachmentName, type: task.attachmentType };
  }
  const row = await database().prepare(`SELECT r.*,t.branch_id task_branch_id,t.assigned_to task_assigned_to,t.id linked_task_id
    FROM work_task_reports r JOIN work_tasks t ON t.id=r.task_id WHERE r.id=? LIMIT 1`).bind(id).first<Record<string, unknown>>();
  if (!row) return undefined;
  const report = mapReport(row);
  const task = await getWorkTask(String(row.linked_task_id || report.taskId));
  if (!task) return undefined;
  return { task, key: report.attachmentKey, name: report.attachmentName, type: report.attachmentType };
}

function mapTask(row: Record<string, unknown>): WorkTask { return {
  id: String(row.id || ""), title: String(row.title || ""), description: String(row.description || ""), priority: String(row.priority || "normal"),
  dueDate: String(row.due_date || ""), status: String(row.status || "assigned"), branchId: String(row.branch_id || ""), branchName: String(row.branch_name || ""),
  assignedTo: String(row.assigned_to || ""), assignedName: String(row.assigned_name || ""), createdBy: String(row.created_by || ""), createdByName: String(row.created_by_name || ""),
  attachmentKey: String(row.attachment_key || ""), attachmentName: String(row.attachment_name || ""), attachmentType: String(row.attachment_type || ""),
  createdAt: Number(row.created_at || 0), updatedAt: Number(row.updated_at || 0),
}; }
function mapReport(row: Record<string, unknown>): WorkReport { return {
  id: String(row.id || ""), taskId: String(row.task_id || ""), authorId: String(row.author_id || ""), authorName: String(row.author_name || ""),
  message: String(row.message || ""), progress: Number(row.progress || 0), attachmentKey: String(row.attachment_key || ""),
  attachmentName: String(row.attachment_name || ""), attachmentType: String(row.attachment_type || ""), createdAt: Number(row.created_at || 0),
}; }
function clean(value: string, max: number) { return value.trim().replace(/\s+/g, " ").slice(0, max); }
function cleanDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ""; }
function normalizePriority(value: string) { return value === "urgent" || value === "high" || value === "low" ? value : "normal"; }
