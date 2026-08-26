"use client";

import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startAuthentication,
  startRegistration,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Flow = "registration" | "authentication";

export default function BiometricAttendance({
  registeredDevices,
  checkedIn,
  checkedOut,
}: {
  registeredDevices: number;
  checkedIn: boolean;
  checkedOut: boolean;
}) {
  const router = useRouter();
  const [deviceCount, setDeviceCount] = useState(registeredDevices);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<"register" | "in" | "out" | "remove" | "">("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    const supportCheck = browserSupportsWebAuthn() ? platformAuthenticatorIsAvailable() : Promise.resolve(false);
    void supportCheck.then((available) => { if (active) setSupported(available); }).catch(() => { if (active) setSupported(false); });
    return () => { active = false; };
  }, []);

  async function registerDevice() {
    setBusy("register");
    setMessage("");
    setSuccess(false);
    try {
      const { options, challengeId } = await requestOptions<PublicKeyCredentialCreationOptionsJSON>("registration");
      const response = await startRegistration({ optionsJSON: options });
      await verify({ flow: "registration", challengeId, response });
      setDeviceCount((count) => count + 1);
      setSuccess(true);
      setMessage("Đã đăng ký sinh trắc học trên thiết bị này. Bạn có thể chấm công ngay.");
    } catch (error) {
      setMessage(errorMessage(error, "Không thể đăng ký thiết bị."));
    } finally { setBusy(""); }
  }

  async function check(mode: "in" | "out") {
    setBusy(mode);
    setMessage("");
    setSuccess(false);
    try {
      const { options, challengeId } = await requestOptions<PublicKeyCredentialRequestOptionsJSON>("authentication");
      const response = await startAuthentication({ optionsJSON: options });
      const result = await verify({ flow: "authentication", challengeId, response, mode }) as { status?: string };
      setSuccess(true);
      setMessage(result.status === "checked-out" ? "Đã xác thực và chấm công ra thành công." : "Đã xác thực và chấm công vào thành công.");
      router.refresh();
    } catch (error) {
      setMessage(errorMessage(error, "Không thể chấm công bằng sinh trắc học."));
    } finally { setBusy(""); }
  }

  async function removeDevices() {
    if (!window.confirm("Gỡ toàn bộ thiết bị sinh trắc học đã đăng ký cho tài khoản này?")) return;
    setBusy("remove");
    setMessage("");
    setSuccess(false);
    try {
      const response = await fetch("/api/admin/attendance/passkey", { method: "DELETE" });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "Không thể gỡ thiết bị.");
      setDeviceCount(0);
      setSuccess(true);
      setMessage("Đã gỡ các thiết bị sinh trắc học. Bạn có thể đăng ký lại trên điện thoại mới.");
    } catch (error) { setMessage(errorMessage(error, "Không thể gỡ thiết bị.")); }
    finally { setBusy(""); }
  }

  if (supported === false) {
    return <section className="admin-card biometric-attendance biometric-unsupported">
      <div className="biometric-mark" aria-hidden="true">×</div>
      <div><span>Thiết bị chưa hỗ trợ</span><h2>Không tìm thấy Face ID hoặc sinh trắc học</h2><p>Hãy mở trang này bằng Safari trên iPhone hoặc Chrome trên Android có khóa màn hình, Face ID hay vân tay.</p></div>
    </section>;
  }

  return <section className="admin-card biometric-attendance">
    <div className="biometric-heading">
      <div className="biometric-mark" aria-hidden="true"><i /><i /><i /><i /></div>
      <div><span>Xác thực trên thiết bị cá nhân</span><h2>Chấm công bằng Face ID / sinh trắc học</h2><p>Điện thoại tự xác minh khuôn mặt, vân tay hoặc mã khóa. Huy Apple chỉ nhận chữ ký xác thực, không nhận hay lưu ảnh khuôn mặt.</p></div>
      <em className={deviceCount ? "is-ready" : ""}>{supported === null ? "Đang kiểm tra..." : deviceCount ? `${deviceCount} thiết bị đã đăng ký` : "Chưa đăng ký"}</em>
    </div>

    {supported && deviceCount === 0 ? <div className="biometric-setup">
      <div><strong>Bước đầu tiên trên điện thoại này</strong><p>Nhấn đăng ký và làm theo yêu cầu Face ID/vân tay của thiết bị. Chỉ cần thực hiện một lần.</p></div>
      <button type="button" className="admin-button admin-button-primary" onClick={registerDevice} disabled={Boolean(busy)}>{busy === "register" ? "Đang mở xác thực..." : "Đăng ký Face ID / sinh trắc học"}</button>
    </div> : supported && <div className="biometric-actions">
      <button type="button" className="biometric-check-in" onClick={() => check("in")} disabled={Boolean(busy) || checkedIn}><span aria-hidden="true">→</span><strong>{busy === "in" ? "Đang xác thực..." : checkedIn ? "Đã chấm công vào" : "Quét để chấm công vào"}</strong><small>{checkedIn ? "Giờ vào đã được ghi nhận" : "Xác nhận Face ID / sinh trắc học"}</small></button>
      <button type="button" className="biometric-check-out" onClick={() => check("out")} disabled={Boolean(busy) || !checkedIn || checkedOut}><span aria-hidden="true">←</span><strong>{busy === "out" ? "Đang xác thực..." : checkedOut ? "Đã chấm công ra" : "Quét để chấm công ra"}</strong><small>{checkedOut ? "Ngày công đã hoàn tất" : !checkedIn ? "Cần chấm công vào trước" : "Xác nhận Face ID / sinh trắc học"}</small></button>
      <button type="button" className="biometric-remove" onClick={removeDevices} disabled={Boolean(busy)}>{busy === "remove" ? "Đang gỡ..." : "Gỡ thiết bị"}</button>
    </div>}

    {message && <p className={success ? "biometric-message is-success" : "biometric-message is-error"} role="status">{message}</p>}
    <footer><span>✓ Yêu cầu đăng nhập tài khoản nhân viên</span><span>✓ Phiên xác thực hết hạn sau 5 phút</span><span>✓ Không lưu dữ liệu khuôn mặt</span></footer>
  </section>;
}

async function requestOptions<T>(flow: Flow) {
  const response = await fetch("/api/admin/attendance/passkey/options", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ flow }) });
  const result = await response.json() as { options?: T; challengeId?: string; message?: string };
  if (!response.ok || !result.options || !result.challengeId) throw new Error(result.message || "Không thể bắt đầu xác thực.");
  return { options: result.options, challengeId: result.challengeId };
}

async function verify(payload: Record<string, unknown>) {
  const response = await fetch("/api/admin/attendance/passkey/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const result = await response.json() as { message?: string; status?: string };
  if (!response.ok) throw new Error(result.message || "Xác thực không thành công.");
  return result;
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.name === "NotAllowedError") return "Bạn đã hủy hoặc thiết bị không hoàn tất xác thực. Vui lòng thử lại.";
  return error instanceof Error ? error.message : fallback;
}
