"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHrManagerAction, requireOwnerAction } from "@/app/admin-auth";
import { createAdminUser, setAdminUserActive, type AdminRole } from "@/db/admin-users";
import { getBranches } from "@/db/branches";

export async function createStaffAction(formData: FormData) {
  const actor = await requireHrManagerAction();
  const returnTo = safeReturnTo(value(formData, "returnTo"));
  let selectedBranchId = actor.branchId;
  try {
    const branchId=actor.role === "manager" ? actor.branchId : value(formData,"branchId");
    selectedBranchId = branchId;
    const branch=(await getBranches(false)).find(item=>item.id===branchId);
    if(!branch) throw new Error("Vui lòng chọn một chi nhánh đang hoạt động.");
    const role = roleValue(formData);
    if (actor.role === "manager" && role === "manager") throw new Error("Quản lý chi nhánh chỉ được thêm nhân sự cấp dưới.");
    await createAdminUser({
      username: value(formData, "username"),
      name: value(formData, "name"),
      password: value(formData, "password"),
      role,
      branch: branch.name,
      branchId,
    });
  } catch (error) {
    redirect(`${returnTo}?error=${encodeURIComponent(error instanceof Error ? error.message : "Không thể tạo tài khoản.")}`);
  }
  revalidatePath("/admin/staff");
  if (selectedBranchId) revalidatePath(`/admin/branches/${selectedBranchId}`);
  redirect(`${returnTo}?status=created`);
}

export async function toggleStaffAction(formData: FormData) {
  await requireOwnerAction();
  const id = value(formData, "id");
  if (!id) redirect("/admin/staff?error=Không tìm thấy tài khoản nhân viên.");
  await setAdminUserActive(id, value(formData, "active") === "true");
  revalidatePath("/admin/staff");
  redirect("/admin/staff?status=updated");
}

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function roleValue(formData: FormData): AdminRole {
  const role=value(formData,"role");
  return role === "manager" || role === "consultant" || role === "warranty" || role === "repair" ? role : "sales";
}

function safeReturnTo(value:string){
  if(value === "/admin/staff") return value;
  if(/^\/admin\/branches\/[a-zA-Z0-9-]+$/.test(value)) return value;
  return "/admin/staff";
}
