import { env } from "cloudflare:workers";

type AuthBindings = {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_VERIFY_SERVICE_SID?: string;
};

function bindings() {
  return env as unknown as AuthBindings;
}

export function googleOAuthConfig(origin: string) {
  const values = bindings();
  if (!values.GOOGLE_CLIENT_ID || !values.GOOGLE_CLIENT_SECRET) {
    throw new Error("Đăng nhập Google chưa được cấu hình.");
  }
  return {
    clientId: values.GOOGLE_CLIENT_ID,
    clientSecret: values.GOOGLE_CLIENT_SECRET,
    redirectUri: values.GOOGLE_REDIRECT_URI || `${origin}/api/account/google/callback`,
  };
}

export async function startOtpVerification(destinationInput: string, channel: "email" | "sms") {
  const destination = channel === "sms" ? vietnamPhone(destinationInput) : destinationInput.trim().toLowerCase();
  const response = await twilioVerifyRequest("Verifications", { To: destination, Channel: channel });
  if (response.status !== "pending") throw new Error("Không thể gửi mã xác minh lúc này.");
  return destination;
}

export async function checkOtpVerification(destinationInput: string, code: string) {
  const destination = destinationInput.includes("@") ? destinationInput : vietnamPhone(destinationInput);
  const response = await twilioVerifyRequest("VerificationCheck", { To: destination, Code: code });
  return response.status === "approved";
}

async function twilioVerifyRequest(resource: "Verifications" | "VerificationCheck", values: Record<string, string>) {
  const config = bindings();
  if (!config.TWILIO_ACCOUNT_SID || !config.TWILIO_AUTH_TOKEN || !config.TWILIO_VERIFY_SERVICE_SID) {
    throw new Error("Dịch vụ xác minh email/SMS chưa được cấu hình.");
  }
  const body = new URLSearchParams(values);
  const response = await fetch(`https://verify.twilio.com/v2/Services/${encodeURIComponent(config.TWILIO_VERIFY_SERVICE_SID)}/${resource}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${config.TWILIO_ACCOUNT_SID}:${config.TWILIO_AUTH_TOKEN}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const result = await response.json() as { status?: string; message?: string };
  if (!response.ok) throw new Error(result.message || "Dịch vụ xác minh đang tạm gián đoạn.");
  return result;
}

function vietnamPhone(value: string) {
  const phone = value.replace(/[^\d+]/g, "");
  if (/^0\d{9,10}$/.test(phone)) return `+84${phone.slice(1)}`;
  if (/^84\d{9,10}$/.test(phone)) return `+${phone}`;
  if (/^\+\d{10,15}$/.test(phone)) return phone;
  throw new Error("Số điện thoại phải đúng định dạng để nhận SMS.");
}
