"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwnerAction } from "@/app/admin-auth";
import { createAdminUser, setAdminUserActive, type AdminRole } from "@/db/admin-users";

export async function createStaffAction(formData: FormData) {
  await requireOwnerAction();
  try {
    await createAdminUser({
      username: value(formData, "username"),
      name: value(formData, "name"),
      password: value(formData, "password"),
      role: roleValue(formData),
      branch: value(formData, "branch"),
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
  return value(formData, "role") === "manager" ? "manager" : "staff";
}
