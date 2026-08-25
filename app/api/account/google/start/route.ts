import { cookies } from "next/headers";
import { googleOAuthConfig } from "@/app/account-providers";
import { GOOGLE_STATE_COOKIE, shortLivedCookieOptions } from "@/app/customer-auth";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  try {
    const config = googleOAuthConfig(origin);
    const state = randomState();
    (await cookies()).set(GOOGLE_STATE_COOKIE, state, shortLivedCookieOptions());
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", config.redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("prompt", "select_account");
    return Response.redirect(url);
  } catch {
    return Response.redirect(new URL("/tai-khoan?error=google-config", origin));
  }
}

function randomState() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
