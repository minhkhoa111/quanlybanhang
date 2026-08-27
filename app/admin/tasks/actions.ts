"use server";

import { env } from "cloudflare:workers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAction } from "@/app/admin-auth";
import { getAdminUsers } from "@/db/admin-users";
import { addWorkReport, canAccessTask, completeWorkTask, createWorkTask, getWorkTask } from "@/db/tasks";

type Bindings = { PRODUCT_IMAGES?: R2Bucket };

export async function createTaskAction(formData: FormData) {
  const actor = await requireAdminAction();
  if (actor.role !== "owner" && actor.role !== "manager") redirect("/admin/tasks?error=Bạn không có quyền giao việc.");
  const taskId = crypto.randomUUID();
  let uploadedKey = "";
  try {
    const assignee = (await getAdminUsers()).find((item) => item.id === value(formData, "assignedTo") && item.active);
    if (!assignee) throw new Error("Không tìm thấy nhân viên nhận việc.");
    if (actor.role === "manager" && (assignee.branchId !== actor.branchId || assignee.role === "manager")) throw new Error("Quản lý chỉ được giao việc cho nhân viên cấp dưới cùng chi nhánh.");
    const title = value(formData, "title");
    if (title.length < 3) throw new Error("Vui lòng nhập tên công việc rõ ràng.");
    const upload = await saveFile(formData.get("attachment"), `task-files/${taskId}`);
    uploadedKey = upload.key;
    await createWorkTask({
      id: taskId, title, description: value(formData, "description"), priority: value(formData, "priority"), dueDate: value(formData, "dueDate"),
      status: "assigned", branchId: assignee.branchId, branchName: assignee.branch, assignedTo: assignee.id, assignedName: assignee.name,
      createdBy: actor.id, createdByName: actor.name, attachmentKey: upload.key, attachmentName: upload.name, attachmentType: upload.type,
    });
  } catch (error) {
    if (uploadedKey) await (env as unknown as Bindings).PRODUCT_IMAGES?.delete(uploadedKey);
    redirect(`/admin/tasks?error=${encodeURIComponent(message(error, "Không thể tạo công việc."))}`);
  }
  revalidatePath("/admin/tasks"); revalidatePath("/manager"); revalidatePath("/staff");
  redirect("/admin/tasks?status=created");
}

export async function reportTaskAction(formData: FormData) {
  const actor = await requireAdminAction();
  const taskId = value(formData, "taskId");
  let uploadedKey = "";
  try {
    const task = await getWorkTask(taskId);
    if (!task || !canAccessTask(actor, task)) throw new Error("Bạn không có quyền báo cáo công việc này.");
    if (task.status === "completed") throw new Error("Công việc đã hoàn tất và không nhận thêm báo cáo.");
    const reportMessage = value(formData, "message");
    const upload = await saveFile(formData.get("reportAttachment"), `task-reports/${taskId}`);
    uploadedKey = upload.key;
    if (!reportMessage && !upload.key) throw new Error("Vui lòng nhập nội dung hoặc đính kèm file báo cáo.");
    await addWorkReport({
      id: crypto.randomUUID(), taskId, authorId: actor.id, authorName: actor.name, message: reportMessage || "Đã gửi file báo cáo.",
      progress: Number(value(formData, "progress")) || 0, taskStatus: value(formData, "taskStatus"),
      attachmentKey: upload.key, attachmentName: upload.name, attachmentType: upload.type,
    });
  } catch (error) {
    if (uploadedKey) await (env as unknown as Bindings).PRODUCT_IMAGES?.delete(uploadedKey);
    redirect(`/admin/tasks?error=${encodeURIComponent(message(error, "Không thể gửi báo cáo."))}`);
  }
  revalidatePath("/admin/tasks"); revalidatePath("/manager"); revalidatePath("/staff");
  redirect("/admin/tasks?status=reported");
}

export async function completeTaskAction(formData: FormData) {
  const actor = await requireAdminAction();
  const taskId = value(formData, "taskId");
  const task = await getWorkTask(taskId);
  if (!task || !canAccessTask(actor, task) || (actor.role !== "owner" && actor.role !== "manager")) redirect("/admin/tasks?error=Bạn không có quyền duyệt công việc này.");
  await completeWorkTask(taskId);
  revalidatePath("/admin/tasks"); revalidatePath("/manager"); revalidatePath("/staff");
  redirect("/admin/tasks?status=completed");
}

async function saveFile(input: FormDataEntryValue | null, prefix: string) {
  if (!(input instanceof File) || input.size === 0) return { key: "", name: "", type: "" };
  if (input.size > 15 * 1024 * 1024) throw new Error("File công việc phải nhỏ hơn 15 MB.");
  const allowed = new Set([
    "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain", "image/jpeg", "image/png", "image/webp", "application/zip", "application/x-zip-compressed",
  ]);
  if (!allowed.has(input.type)) throw new Error("Chỉ nhận PDF, Office, TXT, ZIP hoặc ảnh JPG/PNG/WEBP.");
  const bucket = (env as unknown as Bindings).PRODUCT_IMAGES;
  if (!bucket) throw new Error("Kho file công việc chưa sẵn sàng.");
  const extension = safeExtension(input.name);
  const key = `${prefix}/${crypto.randomUUID()}${extension ? `.${extension}` : ""}`;
  await bucket.put(key, await input.arrayBuffer(), { httpMetadata: { contentType: input.type } });
  return { key, name: input.name.trim().slice(0, 180), type: input.type };
}
function safeExtension(name: string) { const ext = name.split(".").pop()?.toLowerCase() || ""; return /^[a-z0-9]{1,8}$/.test(ext) ? ext : ""; }
function value(formData: FormData, key: string) { const item = formData.get(key); return typeof item === "string" ? item.trim() : ""; }
function message(error: unknown, fallback: string) { return error instanceof Error ? error.message : fallback; }
