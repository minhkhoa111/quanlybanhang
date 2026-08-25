import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Đăng nhập quản lý",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string; status?: string }>;
}) {
  const query = await searchParams;
  const returnTo = query.returnTo?.startsWith("/admin")
    ? query.returnTo
    : "/admin";
  const params = new URLSearchParams();
  params.set("returnTo", returnTo);
  if (query.error) params.set("error", query.error);
  if (query.status) params.set("status", query.status);
  redirect(`/admin-login?${params.toString()}`);
}
