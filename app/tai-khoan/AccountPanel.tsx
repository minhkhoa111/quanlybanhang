"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";

type Customer = {
  username: string;
  avatarUrl: string;
  name: string;
  email: string;
  phone: string;
  provider: "password" | "google";
  verified: boolean;
  profileComplete: boolean;
};

type AuthResult = {
  customer?: Customer;
  message?: string;
};

export default function AccountPanel() {
  const params = useSearchParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState(errorMessage(params.get("error")));
  const [sending, setSending] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");

  const refresh = useCallback(async () => {
    const result = await fetch("/api/account/me").then((response) => response.json()) as { customer?: Customer };
    setCustomer(result.customer || null);
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(task);
  }, [refresh]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setMessage("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch(`/api/account/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json() as AuthResult;
    setSending(false);
    if (!response.ok) { setMessage(result.message || "Không thể xử lý tài khoản."); return; }
    finishLogin(result.customer || null);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setMessage("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json() as AuthResult;
    setSending(false);
    if (!response.ok) { setMessage(result.message || "Không thể cập nhật hồ sơ."); return; }
    setCustomer(result.customer || null);
    setMessage("Thông tin member đã được cập nhật.");
    window.dispatchEvent(new Event("huy-account-change"));
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setMessage("");
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) { setMessage("Vui lòng chọn ảnh JPG, PNG hoặc WebP."); return; }
    if (file.size > 3 * 1024 * 1024) { setMessage("Ảnh đại diện phải nhỏ hơn 3 MB."); return; }

    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
    setUploadingAvatar(true);
    const data = new FormData();
    data.set("avatar", file);
    const response = await fetch("/api/account/avatar", { method: "POST", body: data });
    const result = await response.json() as AuthResult;
    setUploadingAvatar(false);
    input.value = "";
    if (!response.ok) { setAvatarPreview(""); setMessage(result.message || "Không thể cập nhật ảnh đại diện."); return; }
    setCustomer(result.customer || null);
    setAvatarPreview("");
    setMessage("Ảnh đại diện đã được cập nhật.");
    window.dispatchEvent(new Event("huy-account-change"));
  }

  async function removeAvatar() {
    setUploadingAvatar(true);
    setMessage("");
    const response = await fetch("/api/account/avatar", { method: "DELETE" });
    const result = await response.json() as AuthResult;
    setUploadingAvatar(false);
    if (!response.ok) { setMessage(result.message || "Không thể gỡ ảnh đại diện."); return; }
    setCustomer(result.customer || null);
    setAvatarPreview("");
    setMessage("Ảnh đại diện đã được gỡ.");
    window.dispatchEvent(new Event("huy-account-change"));
  }

  function finishLogin(nextCustomer: Customer | null) {
    setCustomer(nextCustomer);
    setMessage("");
    window.dispatchEvent(new Event("huy-account-change"));
  }

  async function logout() {
    await fetch("/api/account/logout", { method: "POST" });
    setCustomer(null);
    setMessage("");
    window.dispatchEvent(new Event("huy-account-change"));
  }

  if (customer) {
    const avatar = avatarPreview || customer.avatarUrl;
    const initials = customer.name.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase() || "HA";
    return <section className="account-panel account-member">
      <aside className="member-summary">
        <div className="member-avatar-wrap">
          <div className="member-avatar">{avatar ? <Image src={avatar} alt={`Ảnh đại diện của ${customer.name}`} fill sizes="180px" unoptimized /> : <span>{initials}</span>}</div>
          <div className="member-avatar-controls"><label className="member-avatar-button">{uploadingAvatar ? "Đang xử lý..." : "Đổi ảnh"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar} disabled={uploadingAvatar} /></label>{customer.avatarUrl && <button type="button" onClick={removeAvatar} disabled={uploadingAvatar}>Gỡ ảnh</button>}</div>
          <small>JPG, PNG hoặc WebP · tối đa 3 MB</small>
        </div>
        <div className="member-identity"><span>HUY APPLE MEMBER</span><h1>{customer.name || "Thành viên mới"}</h1><p>@{customer.username || "google-member"}</p></div>
        <div className="member-shortcuts"><Link className="button button-primary" href="/gio-hang">Xem giỏ hàng</Link><Link className="button button-secondary" href="/tu-van">Đặt hàng</Link></div>
      </aside>
      <div className="member-details">
        <header><span>{customer.profileComplete ? "HỒ SƠ CÁ NHÂN" : "HOÀN THIỆN HỒ SƠ"}</span><h2>Thông tin member</h2><p>Cập nhật thông tin để cửa hàng xác nhận và giao đơn nhanh hơn.</p></header>
        <form className="member-profile-form" onSubmit={saveProfile}>
          <label>Họ và tên<input name="name" required defaultValue={customer.name} autoComplete="name" /></label>
          <label>Số điện thoại<input name="phone" required type="tel" defaultValue={customer.phone} pattern="[0-9 +]{9,15}" autoComplete="tel" /></label>
          <label className="member-field-wide">Email<input value={customer.email} disabled /></label>
          <div className="member-meta member-field-wide"><span>Phương thức đăng nhập</span><strong>{customer.provider === "google" ? "Google" : "Tên đăng nhập & mật khẩu"}</strong></div>
          {message && <p className={message.includes("đã được") ? "account-success member-field-wide" : "account-error member-field-wide"}>{message}</p>}
          <div className="member-form-actions member-field-wide"><button className="button button-primary" disabled={sending}>{sending ? "Đang lưu..." : "Lưu thay đổi"}</button><button type="button" className="button button-secondary" onClick={logout}>Đăng xuất</button></div>
        </form>
      </div>
    </section>;
  }

  return <section className="account-panel">
    <div className="account-intro"><span>HUY APPLE MEMBER</span><h1>Mua hàng nhanh hơn.</h1><p>Đăng nhập để tự động điền thông tin nhận hàng, lưu giỏ hàng và liên kết đơn mua với tài khoản của bạn.</p></div>
    <div className="account-form-wrap">
      <a className="google-auth-button" href="/api/account/google/start"><span aria-hidden="true">G</span>Tiếp tục với Google</a>
      <div className="account-divider"><span>hoặc</span></div>
      <div className="account-tabs"><button type="button" className={mode === "login" ? "is-active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>Đăng nhập</button><button type="button" className={mode === "register" ? "is-active" : ""} onClick={() => { setMode("register"); setMessage(""); }}>Đăng ký</button></div>
      <form onSubmit={submitAuth}>
        {mode === "register" && <><label>Tên đăng nhập<input name="username" required minLength={4} maxLength={24} pattern="[a-zA-Z0-9._]+" autoComplete="username" placeholder="huyapple_member" /></label><label>Họ và tên<input name="name" required autoComplete="name" /></label><label>Số điện thoại<input name="phone" required type="tel" pattern="[0-9 +]{9,15}" autoComplete="tel" /></label><label>Email<input name="email" type="email" required autoComplete="email" /></label></>}
        {mode === "login" && <label>Tên đăng nhập hoặc email<input name="identifier" required autoComplete="username" /></label>}
        <label>Mật khẩu<input name="password" type="password" minLength={8} required autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
        {message && <p className="account-error">{message}</p>}
        <button className="button button-primary" disabled={sending}>{sending ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</button>
      </form>
    </div>
  </section>;
}

function errorMessage(error: string | null) {
  if (error === "admin-only") {
    return "Khu vực quản lý chỉ dành cho chủ cửa hàng và nhân viên được cấp quyền.";
  }
  if (error === "google-config") return "Đăng nhập Google chưa được cấu hình trên hệ thống.";
  if (error === "google") return "Không thể đăng nhập Google. Vui lòng thử lại.";
  return "";
}
