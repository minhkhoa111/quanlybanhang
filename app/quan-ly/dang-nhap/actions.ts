"use server";

import { redirect } from "next/navigation";
import { createAdminSession } from "../../admin-auth";

export async function loginAdminAction(formData: FormData) {
  const username = value(formData, "username");
  const password = value(formData, "password");
  const returnTo = safeReturnTo(value(formData, "returnTo"));

  const user = await createAdminSession(username, password);
  if (user) {
    redirect(returnTo !== "/admin" ? returnTo : user.role === "owner" ? "/admin" : user.role === "manager" ? "/manger" : "/staff");
  }

  redirect(`/admin-login?error=invalid&returnTo=${encodeURIComponent(returnTo)}`);
}

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function safeReturnTo(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/admin";
  try {
    const url = new URL(value, "https://huy.local");
    if (url.origin !== "https://huy.local") return "/admin";
    if (!url.pathname.startsWith("/admin")) return "/admin";
    if (url.pathname === "/admin-login") return "/admin";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/admin";
  }
}
