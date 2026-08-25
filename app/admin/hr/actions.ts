"use server";

import { env } from "cloudflare:workers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAction, requireOwnerAction } from "@/app/admin-auth";
import { employeeCheck, getEmployeeProfile, saveAttendance, saveEmployeeProfile, vietnamDate } from "@/db/hr";

type Bindings = { PRODUCT_IMAGES?: R2Bucket };

export async function saveEmployeeProfileAction(formData: FormData) {
  await requireOwnerAction();
  const adminUserId = value(formData, "adminUserId");
  const current = await getEmployeeProfile(adminUserId);
  if (!current) redirect("/admin/hr?error=Không tìm thấy nhân viên.");
  let photoKey = current.photoKey;
  let uploadedKey = "";
  try {
    const photo = formData.get("photo");
    if (photo instanceof File && photo.size > 0) {
      if (photo.size > 5 * 1024 * 1024) throw new Error("Ảnh nhân sự phải nhỏ hơn 5 MB.");
      const bytes = new Uint8Array(await photo.arrayBuffer());
      const type = detectImageType(bytes);
      if (!type) throw new Error("Ảnh nhân sự phải là tệp JPG, PNG hoặc WEBP hợp lệ.");
      const bucket = (env as unknown as Bindings).PRODUCT_IMAGES;
      if (!bucket) throw new Error("Kho ảnh nhân sự chưa sẵn sàng.");
      uploadedKey = `hr-${adminUserId}-${crypto.randomUUID()}.${extension(type)}`;
      await bucket.put(uploadedKey, bytes, { httpMetadata: { contentType: type } });
      photoKey = uploadedKey;
    }

    await saveEmployeeProfile({
      adminUserId,
      dateOfBirth: value(formData, "dateOfBirth"),
      joinedDate: value(formData, "joinedDate"),
      citizenId: value(formData, "citizenId"),
      permanentAddress: value(formData, "permanentAddress"),
      temporaryAddress: value(formData, "temporaryAddress"),
      photoKey,
      bankName: value(formData, "bankName"),
      bankAccountName: value(formData, "bankAccountName"),
      bankAccountNumber: value(formData, "bankAccountNumber"),
      monthlySalary: Number(value(formData, "monthlySalary").replace(/\D/g, "")) || 0,
    });
    if (uploadedKey && current.photoKey && current.photoKey !== uploadedKey) {
      await (env as unknown as Bindings).PRODUCT_IMAGES?.delete(current.photoKey);
    }
  } catch (error) {
    if (uploadedKey) await (env as unknown as Bindings).PRODUCT_IMAGES?.delete(uploadedKey);
    redirect(`/admin/hr/${adminUserId}?error=${encodeURIComponent(error instanceof Error ? error.message : "Không thể lưu hồ sơ nhân sự.")}`);
  }
  revalidatePath("/admin/hr");
  revalidatePath(`/admin/hr/${adminUserId}`);
  redirect(`/admin/hr/${adminUserId}?status=profile-saved`);
}

export async function saveAttendanceAction(formData: FormData) {
  const owner = await requireOwnerAction();
  const adminUserId = value(formData, "adminUserId");
  try {
    if (!await getEmployeeProfile(adminUserId)) throw new Error("Không tìm thấy nhân viên.");
    await saveAttendance({
      adminUserId,
      workDate: value(formData, "workDate") || vietnamDate(),
      checkIn: value(formData, "checkIn"),
      checkOut: value(formData, "checkOut"),
      status: value(formData, "attendanceStatus"),
      note: value(formData, "note"),
      recordedBy: owner.name,
    });
  } catch (error) {
    redirect(`/admin/hr/${adminUserId}?error=${encodeURIComponent(error instanceof Error ? error.message : "Không thể lưu chấm công.")}`);
  }
  revalidatePath("/admin/hr");
  revalidatePath("/admin/attendance");
  revalidatePath(`/admin/hr/${adminUserId}`);
  redirect(`/admin/hr/${adminUserId}?status=attendance-saved`);
}

export async function selfAttendanceAction(formData: FormData) {
  const user = await requireAdminAction();
  if (user.role === "owner") redirect("/admin/attendance");
  const mode = value(formData, "mode") === "out" ? "out" : "in";
  try {
    await employeeCheck(user.id, mode, user.name);
  } catch (error) {
    redirect(`/admin/attendance?error=${encodeURIComponent(error instanceof Error ? error.message : "Không thể chấm công.")}`);
  }
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/hr");
  redirect(`/admin/attendance?status=${mode === "in" ? "checked-in" : "checked-out"}`);
}

function value(formData: FormData, key: string) { const item = formData.get(key); return typeof item === "string" ? item.trim() : ""; }
function extension(type: string) { return type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg"; }
function detectImageType(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return "";
}
