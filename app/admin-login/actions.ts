"use server";

import { redirect } from "next/navigation";
import { createAdminSession } from "@/app/admin-auth";

export async function loginAdminAction(formData: FormData) {
  const username = fieldValue(formData, "username");
  const password = fieldValue(formData, "password");
  const returnTo = safeReturnTo(fieldValue(formData, "returnTo"));

  if (await createAdminSession(username, password)) {
    redirect(returnTo);
  }

  redirect(`/admin-login?error=invalid&returnTo=${encodeURIComponent(returnTo)}`);
}

function fieldValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function safeReturnTo(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/admin";
  try {
    const url = new URL(value, "https://huy.local");
    if (url.origin !== "https://huy.local") return "/admin";
    if (!url.pathname.startsWith("/admin") || url.pathname === "/admin-login") return "/admin";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/admin";
  }
}
