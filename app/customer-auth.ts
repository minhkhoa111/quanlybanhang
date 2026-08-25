import { cookies } from "next/headers";
import { customerFromSession, deleteCustomerSession } from "@/db/customers";

export const CUSTOMER_COOKIE = "huy_customer";
export const CUSTOMER_VERIFICATION_COOKIE = "huy_customer_verification";
export const GOOGLE_STATE_COOKIE = "huy_google_state";

export async function currentCustomer() {
  const store = await cookies();
  return customerFromSession(store.get(CUSTOMER_COOKIE)?.value);
}

export async function clearCustomerSession() {
  const store = await cookies();
  const token = store.get(CUSTOMER_COOKIE)?.value;
  if (token) {
    try { await deleteCustomerSession(token); } catch { /* database may be unavailable during session cleanup */ }
  }
  store.set(CUSTOMER_COOKIE, "", customerCookieOptions(0));
  store.set(CUSTOMER_VERIFICATION_COOKIE, "", shortLivedCookieOptions(0));
}

export function customerCookieOptions(maxAge = 30 * 24 * 60 * 60) {
  return { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge };
}

export function shortLivedCookieOptions(maxAge = 10 * 60) {
  return { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge };
}
