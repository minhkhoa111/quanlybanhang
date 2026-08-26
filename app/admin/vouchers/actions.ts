"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwnerAction } from "@/app/admin-auth";
import { deleteVoucher, saveVoucher, setVoucherActive, type VoucherType } from "@/db/vouchers";

export async function saveVoucherAction(formData: FormData) {
  await requireOwnerAction();
  try {
    const startsAt = dateValue(formData, "startsAt", 0);
    const expiresAt = dateValue(formData, "expiresAt", 0, true);
    if (startsAt && expiresAt && startsAt > expiresAt) throw new Error("Ngày kết thúc phải sau ngày bắt đầu.");
    await saveVoucher({
      id: value(formData, "id") || crypto.randomUUID(), code: value(formData, "code"),
      type: value(formData, "type") as VoucherType, value: numberValue(formData, "value"),
      minOrder: numberValue(formData, "minOrder"), maxDiscount: numberValue(formData, "maxDiscount"),
      usageLimit: numberValue(formData, "usageLimit"), startsAt, expiresAt, active: formData.get("active") === "on",
    });
  } catch (error) { redirect(`/admin/vouchers?error=${encodeURIComponent(error instanceof Error ? error.message : "Không thể lưu voucher.")}`); }
  revalidatePath("/admin/vouchers"); redirect("/admin/vouchers?status=saved");
}

export async function toggleVoucherAction(formData: FormData) { await requireOwnerAction(); await setVoucherActive(value(formData, "id"), value(formData, "active") === "true"); revalidatePath("/admin/vouchers"); }
export async function deleteVoucherAction(formData: FormData) { await requireOwnerAction(); await deleteVoucher(value(formData, "id")); revalidatePath("/admin/vouchers"); }
function value(data: FormData, key: string) { const item = data.get(key); return typeof item === "string" ? item.trim() : ""; }
function numberValue(data: FormData, key: string) { return Math.max(0, Math.floor(Number(value(data, key).replace(/\D/g, ""))) || 0); }
function dateValue(data: FormData, key: string, fallback: number, endOfDay = false) { const raw = value(data, key); if (!raw) return fallback; const time = new Date(`${raw}T${endOfDay ? "23:59:59.999" : "00:00:00"}+07:00`).getTime(); return Number.isFinite(time) ? time : fallback; }
