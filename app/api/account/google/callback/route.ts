import { cookies } from "next/headers";
import { googleOAuthConfig } from "@/app/account-providers";
import { createCustomerSession, upsertGoogleCustomer } from "@/db/customers";
import { CUSTOMER_COOKIE, GOOGLE_STATE_COOKIE, customerCookieOptions, shortLivedCookieOptions } from "@/app/customer-auth";
import { clearAdminSession } from "@/app/admin-auth";

type GoogleUser = { sub?: string; email?: string; email_verified?: boolean; name?: string };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const store = await cookies();
  const expectedState = store.get(GOOGLE_STATE_COOKIE)?.value || "";
  store.set(GOOGLE_STATE_COOKIE, "", shortLivedCookieOptions(0));
  try {
    const code = url.searchParams.get("code") || "";
    const state = url.searchParams.get("state") || "";
    if (!code || !state || state !== expectedState) throw new Error("Google OAuth state không hợp lệ.");
    const config = googleOAuthConfig(origin);
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenResponse.json() as { access_token?: string; error_description?: string };
    if (!tokenResponse.ok || !tokens.access_token) throw new Error(tokens.error_description || "Google không trả về access token.");
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileResponse.json() as GoogleUser;
    if (!profileResponse.ok) throw new Error("Không thể đọc hồ sơ Google.");
    const customer = await upsertGoogleCustomer({
      googleSub: profile.sub || "",
      email: profile.email || "",
      name: profile.name || "",
      emailVerified: profile.email_verified === true,
    });
    const session = await createCustomerSession(customer.id);
    await clearAdminSession();
    store.set(CUSTOMER_COOKIE, session, customerCookieOptions());
    return Response.redirect(new URL(customer.profileComplete ? "/tai-khoan" : "/tai-khoan?complete=1", origin));
  } catch {
    return Response.redirect(new URL("/tai-khoan?error=google", origin));
  }
}
