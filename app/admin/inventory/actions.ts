"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireInventoryAction } from "@/app/admin-auth";
import { getBranches } from "@/db/branches";
import { adjustBranchInventory, type InventoryOperation } from "@/db/inventory";
import { getManagedProductById } from "@/db/products";

export async function adjustInventoryAction(formData: FormData) {
  const actor = await requireInventoryAction();
  let target = "/admin/inventory";
  try {
    const branches = await getBranches(false);
    const requestedBranchId = value(formData, "branchId");
    const branchId = actor.role === "owner" ? requestedBranchId : actor.branchId;
    const branch = branches.find((item) => item.id === branchId);
    if (!branch) throw new Error("Không tìm thấy chi nhánh đang hoạt động.");
    if (actor.role !== "owner" && branch.id !== actor.branchId) throw new Error("Bạn chỉ được điều chỉnh kho tại chi nhánh của mình.");

    const product = await getManagedProductById(value(formData, "productId"));
    if (!product) throw new Error("Không tìm thấy sản phẩm cần điều chỉnh.");
    const operation = operationValue(formData);
    const quantity = Number(value(formData, "quantity"));
    await adjustBranchInventory({
      branchId: branch.id,
      product,
      operation,
      quantity,
      note: value(formData, "note"),
      actorId: actor.id,
      actorName: actor.name,
    });
    target = `/admin/inventory?${actor.role === "owner" ? `branch=${encodeURIComponent(branch.id)}&` : ""}status=${operation}`;
  } catch (error) {
    target = `/admin/inventory?${actor.role === "owner" && value(formData, "branchId") ? `branch=${encodeURIComponent(value(formData, "branchId"))}&` : ""}error=${encodeURIComponent(error instanceof Error ? error.message : "Không thể điều chỉnh tồn kho.")}`;
  }
  revalidatePath("/admin/inventory");
  redirect(target);
}

function operationValue(formData: FormData): InventoryOperation {
  const operation = value(formData, "operation");
  if (operation === "issue" || operation === "count") return operation;
  return "receive";
}
function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}
