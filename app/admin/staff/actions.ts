"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwnerAction } from "@/app/admin-auth";
import { createAdminUser, setAdminUserActive, type AdminRole } from "@/db/admin-users";
import { getBranches } from "@/db/branches";

export async function createStaffAction(formData: FormData) {
  await requireOwnerAction();
  try {
    const branchId=value(formData,"branchId");
    const branch=(await getBranches(false)).find(item=>item.id===branchId);
    if(!branch) throw new Error("Vui lòng chọn một chi nhánh đang hoạt động.");
    await createAdminUser({
      username: value(formData, "username"),
      name: value(formData, "name"),
      password: value(formData, "password"),
      role: roleValue(formData),
      branch: branch.name,
      branchId,
    });
  } catch (error) {
    redirect(`/admin/staff?error=${encodeURIComponent(error instanceof Error ? error.message : "Không thể tạo tài khoản.")}`);
  }
  revalidatePath("/admin/staff");
  redirect("/admin/staff?status=created");
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
