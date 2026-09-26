import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { clearCustomerSession } from "@/app/customer-auth";
import { adminUserFromSession, authenticateAdminUser, createAdminUserSession, deleteAdminUserSession, type AdminUser } from "@/db/admin-users";

const ADMIN_COOKIE = "admin";

type Bindings = {
  ADMIN_PASSWORD?: string;
};

export function portalPathForRole(role: AdminUser["role"]) {
  if (role === "owner") return "/admin";
  if (role === "manager") return "/manager";
  return "/staff";
}

export function adminRedirectUrl(path: string) {
  if (process.env.NODE_ENV !== "production") return path;
  return new URL(path, "https://infinityshop.click").toString();
}

export function canManageProducts(user?: Pick<AdminUser, "role">) {
  return user?.role === "owner" || user?.role === "manager";
}

export async function requireAdminPage(returnTo = "/admin") {
  const user = await adminUserFromCookie();
  if (user) return user;
  redirect(adminRedirectUrl(`/admin-login?returnTo=${encodeURIComponent(returnTo)}`));
}

export async function requireAdminAction() {
  const user = await currentAdminUser();
  if (!user) {
    throw new Error("Bạn không có quyền quản lý sản phẩm.");
  }
  return user;
}

export async function requireOwnerPage(returnTo = "/admin/staff") {
  const user = await requireAdminPage(returnTo);
  if (user.role !== "owner") redirect("/admin?error=owner-required");
  return user;
}

export async function requireOwnerAction() {
  const user = await requireAdminAction();
  if (user.role !== "owner") throw new Error("Chỉ tài khoản Giám đốc được thực hiện chức năng này.");
  return user;
}

export async function requireHrManagerPage(returnTo = "/admin/hr") {
  const user = await requireAdminPage(returnTo);
  if (user.role !== "owner" && user.role !== "manager") redirect("/admin?error=hr-manager-required");
  return user;
}

export async function requireHrManagerAction() {
  const user = await requireAdminAction();
  if (user.role !== "owner" && user.role !== "manager") {
    throw new Error("Chỉ Giám đốc hoặc quản lý chi nhánh được cập nhật hồ sơ nhân viên.");
  }
  return user;
}

export async function requireInventoryPage(returnTo = "/admin/inventory") {
  const user = await requireAdminPage(returnTo);
  if (user.role !== "owner" && user.role !== "manager" && user.role !== "inventory") {
    redirect(`${portalPathForRole(user.role)}?error=inventory-required`);
  }
  return user;
}

export async function requireInventoryAction() {
  const user = await requireAdminAction();
  if (user.role !== "owner" && user.role !== "manager" && user.role !== "inventory") {
    throw new Error("Chỉ Giám đốc, quản lý chi nhánh hoặc nhân viên kho được điều chỉnh tồn kho.");
  }
  return user;
}

export function canManageEmployee(
  user: Pick<AdminUser, "role" | "branchId" | "branch">,
  employee: Pick<AdminUser, "branchId" | "branch">,
) {
  if (user.role === "owner") return true;
  if (user.role !== "manager") return false;
  if (user.branchId && employee.branchId) return user.branchId === employee.branchId;
  return Boolean(user.branch && employee.branch && normalizeBranch(user.branch) === normalizeBranch(employee.branch));
}

export async function createAdminSession(username: string, password: string) {
  const normalizedUsername = username.trim().toLowerCase();
  let token = "";
  let authenticatedUser: AdminUser | undefined;
  const configuredOwnerPassword = getAdminPassword();
  if ((!normalizedUsername || normalizedUsername === "admin" || normalizedUsername === "owner") && configuredOwnerPassword && password === configuredOwnerPassword) {
    token = (await ownerSessionToken(configuredOwnerPassword))!;
    authenticatedUser = { id: "owner", username: "admin", name: "Giám đốc", role: "owner", branch: "Toàn hệ thống", branchId: "", active: true, createdAt: 0 };
  } else {
    try {
      const user = await authenticateAdminUser(normalizedUsername, password);
      if (!user) return undefined;
      token = await createAdminUserSession(user.id);
      authenticatedUser = user;
    } catch {
      return undefined;
    }
  }

  await clearCustomerSession();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return authenticatedUser;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const ownerToken = await ownerSessionToken();
  if (token && token !== ownerToken) {
    try { await deleteAdminUserSession(token); } catch { /* database may be unavailable during logout */ }
  }
  cookieStore.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function currentAdminUser(): Promise<AdminUser | undefined> {
  return adminUserFromCookie();
}

async function adminUserFromCookie(): Promise<AdminUser | undefined> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!session) return undefined;
  const ownerToken = await ownerSessionToken();
  if (ownerToken && session === ownerToken) {
    return { id: "owner", username: "admin", name: "Giám đốc", role: "owner", branch: "Toàn hệ thống", branchId: "", active: true, createdAt: 0 };
  }
  try { return await adminUserFromSession(session); } catch { return undefined; }
}

async function ownerSessionToken(password = getAdminPassword()) {
  if (!password) return undefined;
  const bytes = new TextEncoder().encode(`infinity-admin:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getAdminPassword() {
  const cloudflarePassword = (env as unknown as Bindings).ADMIN_PASSWORD;
  if (typeof cloudflarePassword === "string" && cloudflarePassword.trim()) {
    return cloudflarePassword.trim();
  }

  if (process.env.ADMIN_PASSWORD?.trim()) {
    return process.env.ADMIN_PASSWORD.trim();
  }

  return undefined;
}

function normalizeBranch(value: string) {
  return value.trim().toLocaleLowerCase("vi-VN").replace(/\s+/g, " ");
}
