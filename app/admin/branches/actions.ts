"use server";
import {revalidatePath} from "next/cache";import {redirect} from "next/navigation";import {requireOwnerAction} from "@/app/admin-auth";import {createBranch,setBranchActive} from "@/db/branches";
const value=(f:FormData,k:string)=>String(f.get(k)||"").trim();
export async function createBranchAction(formData:FormData){await requireOwnerAction();try{await createBranch({code:value(formData,"code"),name:value(formData,"name"),address:value(formData,"address"),phone:value(formData,"phone"),hours:value(formData,"hours")})}catch(e){redirect(`/admin/branches?error=${encodeURIComponent(e instanceof Error?e.message:"Không thể tạo chi nhánh.")}`)}revalidatePath("/admin/branches");redirect("/admin/branches?status=created")}
export async function toggleBranchAction(formData:FormData){await requireOwnerAction();await setBranchActive(value(formData,"id"),value(formData,"active")==="true");revalidatePath("/admin/branches");redirect("/admin/branches?status=updated")}
