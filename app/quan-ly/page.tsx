import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { portalPathForRole, requireAdminPage } from "@/app/admin-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Quản lý sản phẩm",
  robots: { index: false, follow: false },
};

export default async function ProductManagementEntry() {
  const user = await requireAdminPage();
  redirect(portalPathForRole(user.role));
}
