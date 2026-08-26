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

type MemberPurchase = {
  id: string;
  orderCode: string;
  productName: string;
  items: Array<{ productSlug: string; productName: string; ram: string; storage: string; color: string; quantity: number; unitPrice: number; image: string }>;
  quantity: number;
  total: string;
  status: string;
  paymentStatus: string;
  invoiceStatus: string;
  invoiceNumber: string;
  invoiceDate: string;
  warrantyMonths: number;
  warrantyStartDate: string;
  warrantySerials: string;
  branchName: string;
  createdAt: number;
};

export default function AccountPanel() {
  const params = useSearchParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState(errorMessage(params.get("error")));
  const [sending, setSending] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [purchases, setPurchases] = useState<MemberPurchase[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);

  const refresh = useCallback(async () => {
    const result = await fetch("/api/account/me").then((response) => response.json()) as { customer?: Customer };
    const nextCustomer = result.customer || null;
    setCustomer(nextCustomer);
    if (!nextCustomer) { setPurchases([]); return; }
    setPurchasesLoading(true);
    const purchaseResult = await fetch("/api/account/purchases").then((response) => response.json()) as { purchases?: MemberPurchase[] };
    setPurchases(purchaseResult.purchases || []);
    setPurchasesLoading(false);
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
    if (nextCustomer) void refresh();
  }

  async function logout() {
    await fetch("/api/account/logout", { method: "POST" });
    setCustomer(null);
    setPurchases([]);
    setMessage("");
    window.dispatchEvent(new Event("huy-account-change"));
  }

  if (customer) {
    const avatar = avatarPreview || customer.avatarUrl;
    const initials = customer.name.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase() || "HA";
    const invoiceCount = purchases.filter((purchase) => purchase.invoiceStatus === "issued" || purchase.invoiceStatus === "ready").length;
    const warrantyCount = purchases.filter((purchase) => Boolean(purchase.warrantyStartDate)).length;
    return <div className="member-account-shell"><section className="account-panel account-member">
      <aside className="member-summary">
        <div className="member-avatar-wrap">
          <div className="member-avatar">{avatar ? <Image src={avatar} alt={`Ảnh đại diện của ${customer.name}`} fill sizes="180px" unoptimized /> : <span>{initials}</span>}</div>
          <div className="member-avatar-controls"><label className="member-avatar-button">{uploadingAvatar ? "Đang xử lý..." : "Đổi ảnh"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar} disabled={uploadingAvatar} /></label>{customer.avatarUrl && <button type="button" onClick={removeAvatar} disabled={uploadingAvatar}>Gỡ ảnh</button>}</div>
          <small>JPG, PNG hoặc WebP · tối đa 3 MB</small>
        </div>
        <div className="member-identity"><span>HUY APPLE MEMBER</span><h1>{customer.name || "Thành viên mới"}</h1><p>@{customer.username || "google-member"}</p></div>
        <div className="member-shortcuts"><Link className="button button-primary" href="/gio-hang">Giỏ hàng</Link><Link className="button button-secondary" href="/bao-hanh">Tra bảo hành</Link><Link className="button button-secondary member-shortcut-wide" href="#member-purchases">Hóa đơn đã mua</Link></div>
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
    </section>

    <section className="member-purchases" id="member-purchases">
      <header className="member-purchases-heading"><div><span>LỊCH SỬ MEMBER</span><h2>Hóa đơn &amp; bảo hành</h2><p>Mọi đơn hàng được đặt khi đăng nhập sẽ tự động lưu vào tài khoản này.</p></div><div className="member-purchase-stats"><p><strong>{purchases.length}</strong><span>Đơn mua</span></p><p><strong>{invoiceCount}</strong><span>Hóa đơn</span></p><p><strong>{warrantyCount}</strong><span>Bảo hành</span></p></div></header>
      {purchasesLoading ? <div className="member-purchases-empty"><strong>Đang tải lịch sử mua hàng...</strong></div> : purchases.length === 0 ? <div className="member-purchases-empty"><span aria-hidden="true">▤</span><strong>Chưa có đơn hàng trong tài khoản</strong><p>Hãy đăng nhập member trước khi đặt hàng để hóa đơn và bảo hành được lưu tự động.</p><Link className="button button-primary" href="/iphone">Xem sản phẩm</Link></div> : <div className="member-purchase-list">{purchases.map((purchase) => {
        const products = purchase.items.length ? purchase.items : [{ productSlug: "", productName: purchase.productName, ram: "", storage: "", color: "", quantity: purchase.quantity, unitPrice: Number(purchase.total), image: "" }];
        return <article className="member-purchase-card" key={purchase.id}>
          <header><div><span>{purchase.orderCode}</span><time>{formatTimestamp(purchase.createdAt)}</time></div><div><i className={`member-order-status status-${purchase.status}`}>{orderStatusLabel(purchase.status)}</i><i className={`member-invoice-status invoice-${purchase.invoiceStatus}`}>{invoiceStatusLabel(purchase.invoiceStatus)}</i></div></header>
          <div className="member-purchase-products">{products.slice(0, 3).map((item, index) => <div key={`${item.productSlug}-${index}`}>{item.image ? <Image src={item.image} alt="" width={58} height={58} unoptimized /> : <span aria-hidden="true">HA</span>}<p><strong>{item.productName}</strong><small>{[item.ram && `RAM ${item.ram}`, item.storage, item.color].filter(Boolean).join(" · ") || "Theo đơn hàng"}</small></p><b>x{item.quantity}</b></div>)}{products.length > 3 && <small className="member-purchase-more">+{products.length - 3} sản phẩm khác</small>}</div>
          <div className="member-purchase-meta"><p><span>Tổng thanh toán</span><strong>{formatMoney(Number(purchase.total))}</strong></p><p><span>Bảo hành</span><strong>{purchase.warrantyStartDate ? `${purchase.warrantyMonths || 12} tháng · từ ${formatDate(purchase.warrantyStartDate)}` : "Chờ cửa hàng kích hoạt"}</strong></p><p><span>Serial / IMEI</span><strong>{purchase.warrantySerials || "Chưa cập nhật"}</strong></p></div>
          <footer><span>{purchase.branchName || "Huy Apple"}</span><Link href={`/tai-khoan/hoa-don/${purchase.id}`}>Xem hóa đơn &amp; bảo hành →</Link></footer>
        </article>;
      })}</div>}
    </section></div>;
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

function formatMoney(value: number) { return `${Math.max(0, Math.round(value || 0)).toLocaleString("vi-VN")}đ`; }
function formatTimestamp(value: number) { return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)); }
function formatDate(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return ""; return value.split("-").reverse().join("/"); }
function orderStatusLabel(status: string) { return ({ pending: "Chờ xác nhận", confirmed: "Đã xác nhận", processing: "Đang xử lý", shipping: "Đang giao", completed: "Hoàn tất", cancelled: "Đã hủy" } as Record<string, string>)[status] || status; }
function invoiceStatusLabel(status: string) { return ({ not_created: "Chưa lập hóa đơn", draft: "Hóa đơn nháp", ready: "Sẵn sàng xuất", issued: "Đã xuất hóa đơn", cancelled: "Hóa đơn đã hủy" } as Record<string, string>)[status] || "Chưa lập hóa đơn"; }
