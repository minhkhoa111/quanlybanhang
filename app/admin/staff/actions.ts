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
    const role = roleValue(formData);
    const branchId=actor.role === "manager" ? actor.branchId : value(formData,"branchId");
    const branches=await getBranches(false);
    const requestedBranch=branches.find(item=>item.id===branchId);
    const serviceBranch=branches.find(item=>item.code.toUpperCase().startsWith("BH") || item.name.toLocaleUpperCase("vi-VN").includes("BẢO HÀNH"));
    const serviceRole=role === "warranty" || role === "repair";
    const branch=serviceRole ? serviceBranch : requestedBranch;
    if(serviceRole && !serviceBranch) throw new Error("Chưa có chi nhánh bảo hành đang hoạt động.");
    if(!branch) throw new Error("Vui lòng chọn một chi nhánh đang hoạt động.");
    if(actor.role === "manager" && serviceRole && actor.branchId !== serviceBranch?.id) throw new Error("Nhân viên bảo hành và sửa chữa chỉ được tạo tại chi nhánh bảo hành.");
    if (actor.role === "manager" && role === "manager") throw new Error("Quản lý chi nhánh chỉ được thêm nhân sự cấp dưới.");
    selectedBranchId = branch.id;
    await createAdminUser({
      username: value(formData, "username"),
      name: value(formData, "name"),
      password: value(formData, "password"),
      role,
      branch: branch.name,
      branchId: branch.id,
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
