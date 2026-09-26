"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  items: Array<{
    productSlug: string;
    productName: string;
    ram: string;
    storage: string;
    color: string;
    quantity: number;
    unitPrice: number;
    image: string;
  }>;
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
  warrantyPolicy: string;
  branchName: string;
  createdAt: number;
};

export default function AccountPanel() {
  const params = useSearchParams();
  const router = useRouter();
  const returnTo = safeReturnTo(params.get("returnTo"));
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [mode, setMode] = useState<"login" | "register">((params.get("mode") as "login" | "register") || "login");
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<"forgot" | "verify" | "reset" | "">("");
  const [recoveryIdentifier, setRecoveryIdentifier] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryError, setRecoveryError] = useState(false);
  const [message, setMessage] = useState(errorMessage(params.get("error")));
  const [sending, setSending] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [purchases, setPurchases] = useState<MemberPurchase[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);

  // Dashboard active tab & hash sync
  const [activeSideTab, setActiveSideTab] = useState(params.get("complete") === "1" ? "profile" : "overview");
  const [showMaskedPhone, setShowMaskedPhone] = useState(true);
  const [copiedVoucher, setCopiedVoucher] = useState<string | null>(null);

  // Address book states
  const [addresses, setAddresses] = useState<Array<{ id: string; name: string; phone: string; address: string; city: string; isDefault: boolean }>>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddrName, setNewAddrName] = useState("");
  const [newAddrPhone, setNewAddrPhone] = useState("");
  const [newAddrDetail, setNewAddrDetail] = useState("");
  const [newAddrCity, setNewAddrCity] = useState("TP. Hồ Chí Minh");
  const [newAddrDefault, setNewAddrDefault] = useState(false);

  // Student & Business form states
  const [studentRegistered, setStudentRegistered] = useState(false);
  const [studentSchool, setStudentSchool] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentMsg, setStudentMsg] = useState("");
  const [businessRegistered, setBusinessRegistered] = useState(false);
  const [businessCompany, setBusinessCompany] = useState("");
  const [businessTax, setBusinessTax] = useState("");
  const [businessMsg, setBusinessMsg] = useState("");

  // Profile update states
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileNotice, setProfileNotice] = useState("");

  // Order filters
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSearchKeyword, setOrderSearchKeyword] = useState("");
  const [overviewOrderCode, setOverviewOrderCode] = useState("");
  const [warrantyOrderCode, setWarrantyOrderCode] = useState("");

  // Referral copy state
  const [copiedReferral, setCopiedReferral] = useState(false);

  // Synchronize hash with activeSideTab
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (["overview", "orders", "warranty", "tier", "vouchers", "address", "student", "business", "refer", "profile"].includes(hash)) {
        setActiveSideTab(hash);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const switchTab = (tab: string) => {
    setActiveSideTab(tab);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${tab}`);
    }
  };

  const refresh = useCallback(async () => {
    try {
      const result = await fetch("/api/account/me").then((res) => res.json()) as { customer?: Customer };
      const nextCustomer = result.customer || null;
      setCustomer(nextCustomer);
      if (!nextCustomer) {
        setPurchases([]);
        return;
      }
      setPurchasesLoading(true);
      const purchaseResult = await fetch("/api/account/purchases").then((res) => res.json()) as { purchases?: MemberPurchase[] };
      setPurchases(purchaseResult.purchases || []);
    } catch {
      // ignore
    } finally {
      setPurchasesLoading(false);
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(task);
  }, [refresh]);

  // Load saved local data
  useEffect(() => {
    if (typeof window === "undefined") return;
    const task = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem("inf_user_addresses");
        if (saved) {
          setAddresses(JSON.parse(saved));
        } else if (customer) {
          setAddresses([
            {
              id: "addr-init",
              name: customer.name || "Khách hàng",
              phone: customer.phone || "0869275642",
              address: "122/4 Cô Giang, Phường Cầu Kiệu",
              city: "TP. Hồ Chí Minh",
              isDefault: true,
            }
          ]);
        }
        if (localStorage.getItem("inf_student_profile")) setStudentRegistered(true);
        if (localStorage.getItem("inf_business_profile")) setBusinessRegistered(true);
      } catch {}
    }, 0);
    return () => window.clearTimeout(task);
  }, [customer]);

  useEffect(() => {
    if (!customer) return;
    const task = window.setTimeout(() => {
      setProfileName(customer.name || "");
      setProfilePhone(customer.phone || "");
    }, 0);
    return () => window.clearTimeout(task);
  }, [customer]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setMessage("");
    try {
      const data = Object.fromEntries(new FormData(event.currentTarget));
      const response = await fetch(`/api/account/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json() as AuthResult;
      if (!response.ok) {
        setMessage(result.message || "Không thể xử lý tài khoản.");
        return;
      }
      finishLogin(result.customer || null);
    } catch {
      setMessage("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  }

  async function requestPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setRecoveryMessage("");
    setRecoveryError(false);
    const identifier = String(new FormData(event.currentTarget).get("identifier") || "").trim();
    const response = await fetch("/api/account/password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
    });
    const result = await response.json() as AuthResult;
    setSending(false);
    setRecoveryMessage(result.message || "Không thể gửi mã xác minh.");
    setRecoveryError(!response.ok);
    if (!response.ok) return;
    setRecoveryIdentifier(identifier);
    setRecoveryStep("verify");
  }

  async function verifyPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setRecoveryMessage("");
    setRecoveryError(false);
    const code = String(new FormData(event.currentTarget).get("code") || "");
    const response = await fetch("/api/account/password/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const result = await response.json() as AuthResult;
    setSending(false);
    setRecoveryMessage(result.message || "Không thể xác minh mã.");
    setRecoveryError(!response.ok);
    if (response.ok) setRecoveryStep("reset");
  }

  async function completePasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setRecoveryMessage("");
    setRecoveryError(false);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/account/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json() as AuthResult;
    setSending(false);
    if (!response.ok) {
      setRecoveryError(true);
      setRecoveryMessage(result.message || "Không thể đặt lại mật khẩu.");
      return;
    }
    setRecoveryStep("");
    setRecoveryMessage("");
    finishLogin(result.customer || null);
  }

  function finishLogin(nextCustomer: Customer | null) {
    setCustomer(nextCustomer);
    setMessage("");
    window.dispatchEvent(new CustomEvent("huy-account-change", { detail: { customer: nextCustomer } }));
    if (!nextCustomer) return;
    if (returnTo !== "/member") {
      router.replace(returnTo);
      router.refresh();
      return;
    }
    void refresh();
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setProfileNotice("");
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setProfileNotice("Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.");
      input.value = "";
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setProfileNotice("Ảnh đại diện phải nhỏ hơn 3 MB.");
      input.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
    setUploadingAvatar(true);
    try {
      const data = new FormData();
      data.set("avatar", file);
      const response = await fetch("/api/account/avatar", { method: "POST", body: data });
      const result = await response.json() as AuthResult;
      if (!response.ok) throw new Error(result.message || "Không thể cập nhật ảnh đại diện.");
      setCustomer(result.customer || null);
      setProfileNotice("✓ Ảnh đại diện đã được cập nhật.");
      window.dispatchEvent(new CustomEvent("huy-account-change", { detail: { customer: result.customer || null } }));
    } catch (error) {
      setProfileNotice(error instanceof Error ? error.message : "Không thể cập nhật ảnh đại diện.");
    } finally {
      setUploadingAvatar(false);
      setAvatarPreview("");
      input.value = "";
    }
  }

  async function removeAvatar() {
    setUploadingAvatar(true);
    setProfileNotice("");
    try {
      const response = await fetch("/api/account/avatar", { method: "DELETE" });
      const result = await response.json() as AuthResult;
      if (!response.ok) throw new Error(result.message || "Không thể gỡ ảnh đại diện.");
      setCustomer(result.customer || null);
      setAvatarPreview("");
      setProfileNotice("✓ Ảnh đại diện đã được gỡ.");
      window.dispatchEvent(new CustomEvent("huy-account-change", { detail: { customer: result.customer || null } }));
    } catch (error) {
      setProfileNotice(error instanceof Error ? error.message : "Không thể gỡ ảnh đại diện.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function logout() {
    try {
      const response = await fetch("/api/account/logout", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!response.ok) throw new Error("Không thể đăng xuất. Vui lòng thử lại.");
      setCustomer(null);
      setPurchases([]);
      setMessage("");
      window.dispatchEvent(new CustomEvent("huy-account-change", { detail: { customer: null } }));
      router.replace("/member");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể đăng xuất. Vui lòng thử lại.");
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedVoucher(code);
    setTimeout(() => setCopiedVoucher(null), 2000);
  };

  const copyReferral = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  // =========================================================================
  // VIEW: AUTHENTICATED MEMBER DASHBOARD
  // =========================================================================
  if (customer) {
    const avatar = avatarPreview || customer.avatarUrl;
    const initials = (customer.name || customer.username || "IF")
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "IF";

    const totalSpent = purchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
    const orderCount = purchases.length;
    const rawPhone = customer.phone || "";
    const maskedPhone = showMaskedPhone && rawPhone ? rawPhone.replace(/(\d{3})\d{4}(\d{2,3})/, "$1****$2") : (rawPhone || "Chưa cập nhật");
    const memberTier = totalSpent >= 50000000 ? "INFINITY DIAMOND" : totalSpent >= 20000000 ? "INFINITY VIP" : "INFINITY MEMBER";
    const nextTierGoal = totalSpent >= 50000000
      ? null
      : totalSpent >= 20000000
      ? { name: "INFINITY DIAMOND", needed: 50000000 - totalSpent }
      : { name: "INFINITY VIP", needed: 20000000 - totalSpent };

    // Order search and filtering strictly based on user's real purchases
    const filteredOrders = purchases.filter((ord) => {
      if (orderStatusFilter !== "all" && ord.status !== orderStatusFilter) {
        if (orderStatusFilter === "processing" && (ord.status === "processing" || ord.status === "confirmed")) return true;
        return false;
      }
      if (orderSearchKeyword.trim()) {
        const q = orderSearchKeyword.trim().toLowerCase();
        const codeMatch = (ord.orderCode || "").toLowerCase().includes(q);
        const prodMatch =
          (ord.productName || "").toLowerCase().includes(q) ||
          (ord.items || []).some((it) => (it.productName || "").toLowerCase().includes(q));
        if (!codeMatch && !prodMatch) return false;
      }
      return true;
    });
    const selectedWarrantyCode = warrantyOrderCode || purchases[0]?.orderCode || "";
    const warrantyOrder = purchases.find((order) => order.orderCode === selectedWarrantyCode) || null;
    const warrantyStart = warrantyOrder?.warrantyStartDate || warrantyOrder?.invoiceDate || "";
    const warrantyEnd = warrantyOrder
      ? calculateWarrantyEnd(warrantyStart, warrantyOrder.warrantyMonths || 12)
      : "";

    const handleOrderLookup = (event: FormEvent) => {
      event.preventDefault();
      const orderCode = overviewOrderCode.trim().replace(/^#/, "").toUpperCase();
      setOrderSearchKeyword(orderCode);
      setOrderStatusFilter("all");
      switchTab("orders");
    };

    const handleSaveAddress = (e: FormEvent) => {
      e.preventDefault();
      if (!newAddrName.trim() || !newAddrPhone.trim() || !newAddrDetail.trim()) return;
      const newAddr = {
        id: "addr-" + Date.now(),
        name: newAddrName.trim(),
        phone: newAddrPhone.trim(),
        address: newAddrDetail.trim(),
        city: newAddrCity,
        isDefault: newAddrDefault || addresses.length === 0,
      };
      const updated = newAddrDefault
        ? [newAddr, ...addresses.map((a) => ({ ...a, isDefault: false }))]
        : [...addresses, newAddr];
      setAddresses(updated);
      try {
        localStorage.setItem("inf_user_addresses", JSON.stringify(updated));
      } catch {}
      setShowAddressForm(false);
      setNewAddrName("");
      setNewAddrPhone("");
      setNewAddrDetail("");
    };

    const deleteAddress = (id: string) => {
      const updated = addresses.filter((a) => a.id !== id);
      setAddresses(updated);
      try {
        localStorage.setItem("inf_user_addresses", JSON.stringify(updated));
      } catch {}
    };

    const setDefaultAddress = (id: string) => {
      const updated = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
      setAddresses(updated);
      try {
        localStorage.setItem("inf_user_addresses", JSON.stringify(updated));
      } catch {}
    };

    const submitStudent = (e: FormEvent) => {
      e.preventDefault();
      if (!studentSchool.trim() || !studentId.trim()) return;
      setStudentRegistered(true);
      setStudentMsg("Đã gửi hồ sơ thành công! Ưu đãi Học sinh - Sinh viên giảm thêm đến 10% đã được áp dụng vào tài khoản.");
      try {
        localStorage.setItem("inf_student_profile", JSON.stringify({ school: studentSchool, id: studentId, time: Date.now() }));
      } catch {}
    };

    const submitBusiness = (e: FormEvent) => {
      e.preventDefault();
      if (!businessCompany.trim() || !businessTax.trim()) return;
      setBusinessRegistered(true);
      setBusinessMsg("Đã kích hoạt tài khoản Doanh nghiệp B2B thành công! Hệ thống sẵn sàng hỗ trợ xuất hóa đơn VAT điện tử và chiết khấu đến 8%.");
      try {
        localStorage.setItem("inf_business_profile", JSON.stringify({ company: businessCompany, tax: businessTax, time: Date.now() }));
      } catch {}
    };

    const submitProfileUpdate = async (e: FormEvent) => {
      e.preventDefault();
      setProfileNotice("");
      try {
        const res = await fetch("/api/account/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: profileName, phone: profilePhone }),
        });
        const data = await res.json() as { ok: boolean; message?: string };
        if (data.ok) {
          setProfileNotice("✓ Cập nhật thông tin tài khoản thành công!");
          if (params.get("complete") === "1" && returnTo !== "/member") {
            router.replace(returnTo);
            router.refresh();
          } else {
            void refresh();
          }
        } else {
          setProfileNotice(data.message || "Không thể cập nhật.");
        }
      } catch {
        setProfileNotice("Lỗi kết nối máy chủ.");
      }
    };

    return (
      <div className="smem-dashboard-wrap">
        <div className="smem-dash-container">
          {/* TOP SUMMARY CARD */}
          <div className="smem-dash-header-card">
            <div className="smem-user-col">
              <div className="smem-dash-avatar">
                {avatar ? <Image src={avatar} alt="" fill style={{ objectFit: "cover" }} unoptimized /> : initials}
              </div>
              <div className="smem-user-info">
                <h3>{customer.name || customer.username || "Khách hàng"}</h3>
                <div className="smem-phone-row">
                  <span className="smem-phone-text">{maskedPhone}</span>
                  {rawPhone && (
                    <button
                      type="button"
                      onClick={() => setShowMaskedPhone(!showMaskedPhone)}
                      title={showMaskedPhone ? "Hiện số điện thoại" : "Ẩn số điện thoại"}
                      style={{ border: "none", background: "none", cursor: "pointer", padding: "0 2px", color: "#64748b" }}
                    >
                      {showMaskedPhone ? "👁️" : "🙈"}
                    </button>
                  )}
                  <span className="smem-tier-badge">{memberTier}</span>
                </div>
                <p className="smem-expiry-text">🕒 Cập nhật lại sau 01/01/2027</p>
              </div>
            </div>

            <div className="smem-stat-col">
              <span className="smem-stat-icon">🛒</span>
              <div className="smem-stat-val">
                <strong>{orderCount}</strong>
                <small>Tổng số đơn hàng đã mua</small>
              </div>
            </div>

            <div className="smem-stat-col">
              <span className="smem-stat-icon" style={{ background: "#fef3c7", color: "#b45309" }}>💰</span>
              <div className="smem-spending-val">
                <strong>{formatMoney(totalSpent)}</strong>
                <small>Tổng tiền tích lũy · Từ 01/01/2025</small>
                <div className="smem-spending-progress">
                  {nextTierGoal ? (
                    <>Cần chi tiêu thêm {formatMoney(nextTierGoal.needed)} để lên hạng <strong>{nextTierGoal.name}</strong></>
                  ) : (
                    <span>Bạn đã đạt cấp bậc cao nhất <strong>{memberTier}</strong></span>
                  )}
                </div>
              </div>
            </div>

            <div className="smem-channel-col">
              <small>Hệ thống bán lẻ</small>
              <div className="smem-channel-badge" style={{ background: "transparent", border: "none", padding: 0 }}>
                <Image
                  src="/brand/if-techshop-logo.png"
                  alt="IF TECHSHOP"
                  width={110}
                  height={28}
                  style={{ objectFit: "contain", height: "26px", width: "auto" }}
                  unoptimized
                />
              </div>
              <div style={{ marginTop: "4px" }}>
                <Link href="/" style={{ fontSize: "11px", color: "#0284c7", textDecoration: "none" }}>
                  infinityshop.click
                </Link>
              </div>
            </div>
          </div>

          {/* HORIZONTAL QUICK NAV BAR */}
          <div className="smem-quick-nav-bar" role="navigation" aria-label="Thao tác nhanh">
            <button type="button" onClick={() => switchTab("overview")} className={`smem-quick-tab ${activeSideTab === "overview" ? "is-active" : ""}`}>
              🏠 Tổng quan
            </button>
            <button type="button" onClick={() => switchTab("orders")} className={`smem-quick-tab ${activeSideTab === "orders" ? "is-active" : ""}`}>
              📑 Lịch sử mua hàng {orderCount > 0 ? `(${orderCount})` : ""}
            </button>
            <button type="button" onClick={() => switchTab("warranty")} className={`smem-quick-tab ${activeSideTab === "warranty" ? "is-active" : ""}`}>
              🛡️ Tra cứu bảo hành
            </button>
            <button type="button" onClick={() => switchTab("tier")} className={`smem-quick-tab ${activeSideTab === "tier" ? "is-active" : ""}`}>
              💎 Hạng thành viên
            </button>
            <button type="button" onClick={() => switchTab("vouchers")} className={`smem-quick-tab ${activeSideTab === "vouchers" ? "is-active" : ""}`}>
              🎟️ Mã giảm giá <strong style={{ color: activeSideTab === "vouchers" ? "#fff" : "var(--smem-red)" }}>(5)</strong>
            </button>
            <button type="button" onClick={() => switchTab("address")} className={`smem-quick-tab ${activeSideTab === "address" ? "is-active" : ""}`}>
              📍 Sổ địa chỉ
            </button>
            <button type="button" onClick={() => switchTab("student")} className={`smem-quick-tab ${activeSideTab === "student" ? "is-active" : ""}`}>
              🎓 Ưu đãi HSSV
            </button>
            <button type="button" onClick={() => switchTab("business")} className={`smem-quick-tab ${activeSideTab === "business" ? "is-active" : ""}`}>
              💼 Khách hàng Doanh nghiệp
            </button>
            <button type="button" onClick={() => switchTab("refer")} className={`smem-quick-tab ${activeSideTab === "refer" ? "is-active" : ""}`}>
              👥 Giới thiệu bạn bè
            </button>
            <button type="button" onClick={() => switchTab("profile")} className={`smem-quick-tab ${activeSideTab === "profile" ? "is-active" : ""}`}>
              ⚙️ Thông tin tài khoản
            </button>
          </div>

          {/* MAIN 2-COLUMN GRID */}
          <div className="smem-dash-main-grid">
            {/* SIDEBAR MENU */}
            <aside className="smem-dash-sidebar">
              <ul className="smem-side-menu">
                <li className={`smem-side-item ${activeSideTab === "overview" ? "is-active" : ""}`}>
                  <button type="button" onClick={() => switchTab("overview")}>
                    <span>🏠</span> <span>Tổng quan</span>
                  </button>
                </li>
                <li className={`smem-side-item ${activeSideTab === "orders" ? "is-active" : ""}`}>
                  <button type="button" onClick={() => switchTab("orders")}>
                    <span>📑</span> <span>Lịch sử mua hàng</span>
                    {orderCount > 0 && (
                      <span style={{ marginLeft: "auto", fontSize: "11px", background: "#e0f2fe", color: "#0284c7", padding: "1px 6px", borderRadius: "10px", fontWeight: 700 }}>
                        {orderCount}
                      </span>
                    )}
                  </button>
                </li>
                <li className={`smem-side-item ${activeSideTab === "tier" ? "is-active" : ""}`}>
                  <button type="button" onClick={() => switchTab("tier")}>
                    <span>💎</span> <span>Hạng thành viên và ưu đãi</span>
                  </button>
                </li>
                <li className={`smem-side-item ${activeSideTab === "vouchers" ? "is-active" : ""}`}>
                  <button type="button" onClick={() => switchTab("vouchers")}>
                    <span>🎟️</span> <span>Ví voucher của bạn</span>
                    <span style={{ marginLeft: "auto", fontSize: "11px", background: "#fee2e2", color: "var(--smem-red)", padding: "1px 6px", borderRadius: "10px", fontWeight: 700 }}>5</span>
                  </button>
                </li>
                <li className={`smem-side-item ${activeSideTab === "address" ? "is-active" : ""}`}>
                  <button type="button" onClick={() => switchTab("address")}>
                    <span>📍</span> <span>Sổ địa chỉ nhận hàng</span>
                  </button>
                </li>
                <li className={`smem-side-item ${activeSideTab === "student" ? "is-active" : ""}`}>
                  <button type="button" onClick={() => switchTab("student")}>
                    <span>🎓</span> <span>Ưu đãi Học sinh &amp; Giảng viên</span>
                  </button>
                </li>
                <li className={`smem-side-item ${activeSideTab === "business" ? "is-active" : ""}`}>
                  <button type="button" onClick={() => switchTab("business")}>
                    <span>💼</span> <span>Ưu đãi Khách hàng Doanh nghiệp</span>
                  </button>
                </li>
                <li className={`smem-side-item ${activeSideTab === "refer" ? "is-active" : ""}`}>
                  <button type="button" onClick={() => switchTab("refer")}>
                    <span>👥</span> <span>Giới thiệu bạn bè</span>
                    <small style={{ background: "var(--smem-red)", color: "#fff", padding: "1px 5px", borderRadius: "4px", fontSize: "10px", marginLeft: "auto" }}>Mới</small>
                  </button>
                </li>
                <li className={`smem-side-item ${activeSideTab === "profile" ? "is-active" : ""}`}>
                  <button type="button" onClick={() => switchTab("profile")}>
                    <span>⚙️</span> <span>Thông tin tài khoản</span>
                  </button>
                </li>
                <li className={`smem-side-item ${activeSideTab === "warranty" ? "is-active" : ""}`}>
                  <button type="button" onClick={() => switchTab("warranty")}>
                    <span>🛡️</span> <span>Tra cứu bảo hành</span>
                  </button>
                </li>
                <li className="smem-side-item">
                  <Link href="/tra-gop">
                    <span>�</span> <span>Mô phỏng trả góp</span>
                  </Link>
                </li>
                <li className="smem-side-item">
                  <Link href="/tu-van">
                    <span>🏬</span> <span>Tìm kiếm cửa hàng</span>
                  </Link>
                </li>
                <li className="smem-side-item">
                  <button type="button" onClick={logout} style={{ color: "#b91c1c" }}>
                    <span>🚪</span> <span>Đăng xuất</span>
                  </button>
                </li>
              </ul>
            </aside>

            {/* CONTENT COLUMN */}
            <div className="smem-dash-content">
              {/* TAB 1: TỔNG QUAN (OVERVIEW) */}
              {activeSideTab === "overview" && (
                <div className="smem-tab-section">
                  <div className="smem-sub-grid">
                    {/* LEFT: RECENT ORDERS */}
                    <div className="smem-panel-card">
                      <div className="smem-panel-title">
                        <span>Đơn hàng gần đây</span>
                        {purchases.length > 0 && (
                          <button
                            type="button"
                            onClick={() => switchTab("orders")}
                            style={{ border: "none", background: "none", cursor: "pointer", fontSize: "12.5px", color: "#0284c7", fontWeight: 700 }}
                          >
                            Xem tất cả ({purchases.length}) ›
                          </button>
                        )}
                      </div>

                      {purchases.length === 0 ? (
                        <div className="smem-empty-box" style={{ padding: "32px 16px" }}>
                          <div className="smem-empty-icon">📦</div>
                          <h3>Bạn chưa có đơn hàng nào</h3>
                          <p>Khi bạn đặt hàng tại Infinity Store, toàn bộ đơn mua, tình trạng vận chuyển và bảo hành điện tử sẽ được lưu tự động tại đây.</p>
                          <Link href="/" className="smem-cta-btn">
                            Khám phá sản phẩm ngay 🛍️
                          </Link>
                        </div>
                      ) : (
                        <div className="smem-order-list">
                          {purchases.slice(0, 3).map((ord) => {
                            const item = ord.items?.[0];
                            const isCancelled = ord.status === "cancelled";
                            const isCompleted = ord.status === "completed";
                            return (
                              <div key={ord.id} className="smem-order-card">
                                <div className="smem-order-header">
                                  <div>
                                    <span>Đơn hàng: <strong>{ord.orderCode}</strong></span>
                                    <span style={{ margin: "0 6px" }}>•</span>
                                    <span>Ngày đặt: {formatTimestamp(ord.createdAt)}</span>
                                  </div>
                                  <span className={`smem-order-status-badge ${isCancelled ? "status-cancelled" : isCompleted ? "status-completed" : "status-processing"}`}>
                                    {isCancelled ? "Đã hủy" : isCompleted ? "Đã nhận hàng" : "Đang xử lý"}
                                  </span>
                                </div>

                                <div className="smem-order-body">
                                  <div className="smem-order-thumb">
                                    {item?.image ? (
                                      <Image src={item.image} alt="" width={44} height={44} unoptimized style={{ objectFit: "contain" }} />
                                    ) : (
                                      <span>📱</span>
                                    )}
                                  </div>

                                  <div className="smem-order-detail">
                                    <h4>{item?.productName || ord.productName}</h4>
                                    <div className="smem-order-price">{formatMoney(Number(ord.total))}</div>
                                  </div>

                                  <div className="smem-order-total">
                                    <small style={{ color: "#64748b", display: "block" }}>Tổng thanh toán:</small>
                                    <strong>{formatMoney(Number(ord.total))}</strong>
                                    <Link href={`/member/hoa-don/${ord.id}`}>Xem chi tiết ›</Link>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* RIGHT: USER VOUCHERS */}
                    <div className="smem-panel-card">
                      <div className="smem-panel-title">
                        <span>Ưu đãi của bạn</span>
                        <button
                          type="button"
                          onClick={() => switchTab("vouchers")}
                          style={{ border: "none", background: "none", cursor: "pointer", fontSize: "12px", color: "var(--smem-red)", fontWeight: 700 }}
                        >
                          Xem tất cả (5 voucher) ›
                        </button>
                      </div>

                      <div className="smem-voucher-list">
                        <div className="smem-voucher-ticket">
                          <div className="smem-voucher-icon">📱</div>
                          <div className="smem-voucher-content">
                            <strong>Ưu đãi Độc quyền iPhone 17 Series</strong>
                            <p>Giảm 1.000.000đ</p>
                            <small>HSD: 31/12/2026</small>
                          </div>
                          <button type="button" className="smem-voucher-copy" onClick={() => copyCode("INFINITY_IP17_1TR")}>
                            {copiedVoucher === "INFINITY_IP17_1TR" ? "✓ Đã chép" : "📋 Copy"}
                          </button>
                        </div>

                        <div className="smem-voucher-ticket">
                          <div className="smem-voucher-icon">💻</div>
                          <div className="smem-voucher-content">
                            <strong>Ưu đãi Hội viên Laptop &amp; MacBook</strong>
                            <p>Giảm 10% tối đa 1.000.000đ</p>
                            <small>Đơn hàng từ 10.000.000đ · HSD: 30/06/2027</small>
                          </div>
                          <button type="button" className="smem-voucher-copy" onClick={() => copyCode("INFINITY_LAPTOP_10")}>
                            {copiedVoucher === "INFINITY_LAPTOP_10" ? "✓ Đã chép" : "📋 Copy"}
                          </button>
                        </div>

                        <div className="smem-voucher-ticket">
                          <div className="smem-voucher-icon">🎂</div>
                          <div className="smem-voucher-content">
                            <strong>Voucher Sinh Nhật Thành Viên</strong>
                            <p>Giảm 500.000đ</p>
                            <small>Áp dụng đơn từ 2.000.000đ</small>
                          </div>
                          <button type="button" className="smem-voucher-copy" onClick={() => copyCode("INFINITY_BDAY_500K")}>
                            {copiedVoucher === "INFINITY_BDAY_500K" ? "✓ Đã chép" : "📋 Copy"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QUICK SERVICES SHORTCUTS */}
                  <div className="smem-section-card" style={{ marginTop: "16px" }}>
                    <div className="smem-tab-header" style={{ marginBottom: "14px", paddingBottom: "10px" }}>
                      <div>
                        <h2 style={{ fontSize: "16px" }}>⚡ Tiện ích &amp; Quyền lợi hội viên</h2>
                        <p>Các dịch vụ hỗ trợ và cổng đăng ký quyền lợi dành riêng cho bạn</p>
                      </div>
                    </div>

                    <div className="smem-benefit-shortcuts" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                      <button
                        type="button"
                        onClick={() => switchTab("student")}
                        style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "14px", borderRadius: "10px", cursor: "pointer", textAlign: "left" }}
                      >
                        <span style={{ fontSize: "24px" }}>🎓</span>
                        <div>
                          <strong style={{ display: "block", fontSize: "13.5px", color: "#0f172a" }}>Đăng ký HSSV</strong>
                          <small style={{ color: "#64748b", fontSize: "11.5px" }}>Ưu đãi giảm thêm đến 10%</small>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => switchTab("business")}
                        style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "14px", borderRadius: "10px", cursor: "pointer", textAlign: "left" }}
                      >
                        <span style={{ fontSize: "24px" }}>💼</span>
                        <div>
                          <strong style={{ display: "block", fontSize: "13.5px", color: "#0f172a" }}>Khách hàng B2B</strong>
                          <small style={{ color: "#64748b", fontSize: "11.5px" }}>Chiết khấu đến 8%, xuất VAT</small>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => switchTab("warranty")}
                        style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "14px", borderRadius: "10px", textDecoration: "none", color: "inherit" }}
                      >
                        <span style={{ fontSize: "24px" }}>🛡️</span>
                        <div>
                          <strong style={{ display: "block", fontSize: "13.5px", color: "#0f172a" }}>Tra cứu bảo hành</strong>
                          <small style={{ color: "#64748b", fontSize: "11.5px" }}>Kiểm tra serial và thời hạn</small>
                        </div>
                      </button>

                      <form className="smem-order-lookup-card" onSubmit={handleOrderLookup}>
                        <span className="smem-order-lookup-icon" aria-hidden="true">📦</span>
                        <div className="smem-order-lookup-content">
                          <label htmlFor="member-order-code">Tra cứu mã đơn hàng</label>
                          <div className="smem-order-lookup-control">
                            <input
                              id="member-order-code"
                              value={overviewOrderCode}
                              onChange={(event) => setOverviewOrderCode(event.target.value)}
                              placeholder="VD: HA12AB34CD56"
                              autoComplete="off"
                              spellCheck={false}
                              maxLength={26}
                              required
                              aria-label="Nhập mã đơn hàng của bạn"
                            />
                            <button type="submit">Tra cứu</button>
                          </div>
                        </div>
                      </form>

                      <Link
                        href="/tra-gop"
                        style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "14px", borderRadius: "10px", textDecoration: "none", color: "inherit" }}
                      >
                        <span style={{ fontSize: "24px" }}>💳</span>
                        <div>
                          <strong style={{ display: "block", fontSize: "13.5px", color: "#0f172a" }}>Trả góp 0%</strong>
                          <small style={{ color: "#64748b", fontSize: "11.5px" }}>Dự tính trả trước &amp; số tiền góp</small>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: LỊCH SỬ MUA HÀNG (ORDERS) */}
              {activeSideTab === "orders" && (
                <div className="smem-section-card">
                  <div className="smem-tab-header">
                    <div>
                      <h2>📑 Lịch sử mua hàng &amp; Tra cứu đơn hàng</h2>
                      <p>Theo dõi tiến độ giao hàng, xuất hóa đơn điện tử và kiểm tra bảo hành cho từng đơn hàng.</p>
                    </div>
                    <Link href="/" className="smem-cta-btn" style={{ padding: "8px 16px", fontSize: "12.5px" }}>
                      + Mua thêm sản phẩm
                    </Link>
                  </div>

                  {/* Toolbar: Search + Status tabs */}
                  <div className="smem-order-toolbar">
                    <div className="smem-order-search">
                      <span>🔍</span>
                      <input
                        placeholder="Tìm kiếm theo mã đơn hàng (HA...) hoặc tên sản phẩm..."
                        value={orderSearchKeyword}
                        onChange={(e) => setOrderSearchKeyword(e.target.value)}
                      />
                      {orderSearchKeyword && (
                        <button
                          type="button"
                          onClick={() => setOrderSearchKeyword("")}
                          style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b" }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="smem-order-status-tabs">
                      {[
                        { id: "all", label: `Tất cả (${purchases.length})` },
                        { id: "pending", label: `Chờ xác nhận (${purchases.filter((p) => p.status === "pending").length})` },
                        { id: "processing", label: `Đang xử lý (${purchases.filter((p) => p.status === "processing" || p.status === "confirmed").length})` },
                        { id: "shipping", label: `Đang giao (${purchases.filter((p) => p.status === "shipping").length})` },
                        { id: "completed", label: `Hoàn tất (${purchases.filter((p) => p.status === "completed").length})` },
                        { id: "cancelled", label: `Đã hủy (${purchases.filter((p) => p.status === "cancelled").length})` },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          className={`smem-status-tab ${orderStatusFilter === st.id ? "is-active" : ""}`}
                          onClick={() => setOrderStatusFilter(st.id)}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Order List */}
                  {purchasesLoading ? (
                    <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>Đang tải danh sách đơn hàng...</div>
                  ) : filteredOrders.length > 0 ? (
                    <div className="smem-order-list">
                      {filteredOrders.map((ord) => {
                        const isCancelled = ord.status === "cancelled";
                        const isCompleted = ord.status === "completed";
                        const isShipping = ord.status === "shipping";
                        const items = ord.items && ord.items.length > 0 ? ord.items : [
                          {
                            productSlug: "",
                            productName: ord.productName,
                            ram: "",
                            storage: "",
                            color: "",
                            quantity: ord.quantity || 1,
                            unitPrice: Number(ord.total),
                            image: ""
                          }
                        ];

                        return (
                          <div key={ord.id} className="smem-order-card">
                            <div className="smem-order-header">
                              <div>
                                <span>Mã đơn: <strong>{ord.orderCode}</strong></span>
                                <span style={{ margin: "0 6px" }}>•</span>
                                <span>Ngày đặt: {formatTimestamp(ord.createdAt)}</span>
                                {ord.branchName && (
                                  <>
                                    <span style={{ margin: "0 6px" }}>•</span>
                                    <span>Cửa hàng: {ord.branchName}</span>
                                  </>
                                )}
                              </div>
                              <span className={`smem-order-status-badge ${isCancelled ? "status-cancelled" : isCompleted ? "status-completed" : isShipping ? "status-shipping" : "status-processing"}`}>
                                {isCancelled ? "Đã hủy" : isCompleted ? "Đã nhận hàng" : isShipping ? "Đang giao" : "Đang xử lý"}
                              </span>
                            </div>

                            {items.map((it, idx) => (
                              <div key={idx} className="smem-order-body" style={{ borderBottom: idx < items.length - 1 ? "1px solid #f8fafc" : "none" }}>
                                <div className="smem-order-thumb">
                                  {it.image ? (
                                    <Image src={it.image} alt="" width={48} height={48} unoptimized style={{ objectFit: "contain" }} />
                                  ) : (
                                    <span>📱</span>
                                  )}
                                </div>
                                <div className="smem-order-detail">
                                  <h4>{it.productName}</h4>
                                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                                    {[it.ram && `RAM ${it.ram}`, it.storage, it.color].filter(Boolean).join(" · ")}
                                    {it.quantity > 1 && ` · Số lượng: ${it.quantity}`}
                                  </div>
                                </div>
                                <div className="smem-order-price" style={{ textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                                  {formatMoney(it.unitPrice * (it.quantity || 1))}
                                </div>
                              </div>
                            ))}

                            <div className="smem-order-summary" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid #f1f5f9", marginTop: "8px" }}>
                              <div style={{ fontSize: "12.5px", color: "#64748b" }}>
                                Thanh toán: <strong>{ord.paymentStatus === "paid" ? "Đã thanh toán" : "Chờ thanh toán"}</strong>
                              </div>
                              <div className="smem-order-summary-actions" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                <div>
                                  <span style={{ fontSize: "12px", color: "#64748b" }}>Tổng thanh toán: </span>
                                  <strong style={{ fontSize: "16px", color: "var(--smem-red)" }}>{formatMoney(Number(ord.total))}</strong>
                                </div>
                                <Link
                                  href={`/member/hoa-don/${ord.id}`}
                                  style={{ padding: "6px 12px", background: "#f1f5f9", borderRadius: "6px", fontSize: "12px", fontWeight: 700, color: "#0284c7", textDecoration: "none" }}
                                >
                                  Hóa đơn &amp; bảo hành ›
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="smem-empty-box">
                      <div className="smem-empty-icon">🛍️</div>
                      <h3>{purchases.length === 0 ? "Bạn chưa có đơn hàng nào" : "Không tìm thấy đơn hàng"}</h3>
                      <p>
                        {purchases.length === 0
                          ? "Hãy đặt mua các sản phẩm công nghệ chính hãng để tích lũy chi tiêu và nhận đặc quyền hội viên Infinity Store."
                          : "Không có đơn hàng nào khớp với điều kiện lọc hoặc từ khóa tìm kiếm của bạn."}
                      </p>
                      {purchases.length === 0 ? (
                        <Link href="/" className="smem-cta-btn">
                          Bắt đầu mua sắm ngay
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="smem-cta-btn"
                          onClick={() => { setOrderStatusFilter("all"); setOrderSearchKeyword(""); }}
                        >
                          Xóa bộ lọc tìm kiếm
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TRA CỨU BẢO HÀNH NGAY TRONG MEMBER */}
              {activeSideTab === "warranty" && (
                <div className="smem-section-card smem-member-warranty">
                  <div className="smem-tab-header">
                    <div>
                      <h2>🛡️ Tra cứu bảo hành</h2>
                      <p>Chọn mã đơn hàng của bạn để xem thời hạn, sản phẩm và serial bảo hành ngay tại đây.</p>
                    </div>
                  </div>

                  {purchasesLoading ? (
                    <div className="smem-warranty-loading">Đang tải thông tin bảo hành...</div>
                  ) : !purchases.length ? (
                    <div className="smem-empty-box">
                      <div className="smem-empty-icon">📦</div>
                      <h3>Chưa có mã đơn hàng để tra cứu</h3>
                      <p>Sau khi đặt hàng bằng tài khoản này, mã đơn và thông tin bảo hành sẽ xuất hiện tự động.</p>
                      <Link href="/" className="smem-cta-btn">Khám phá sản phẩm</Link>
                    </div>
                  ) : warrantyOrder ? (
                    <>
                      <div className="smem-warranty-picker">
                        <label htmlFor="member-warranty-order">Mã đơn hàng</label>
                        <select
                          id="member-warranty-order"
                          value={selectedWarrantyCode}
                          onChange={(event) => setWarrantyOrderCode(event.target.value)}
                        >
                          {purchases.map((order) => (
                            <option key={order.id} value={order.orderCode}>
                              {order.orderCode} · {order.productName} · {formatTimestamp(order.createdAt)}
                            </option>
                          ))}
                        </select>
                        <span>{purchases.length} đơn hàng trong tài khoản</span>
                      </div>

                      <section className="smem-warranty-result" aria-live="polite">
                        <header>
                          <div>
                            <span>Thông tin theo đơn {warrantyOrder.orderCode}</span>
                            <h3>{warrantyOrder.productName}</h3>
                          </div>
                          <strong className={warrantyOrder.status === "cancelled" ? "is-cancelled" : warrantyStart ? "is-active" : "is-pending"}>
                            {warrantyOrder.status === "cancelled"
                              ? "Đơn đã hủy"
                              : warrantyStart
                              ? "Đã kích hoạt"
                              : "Chờ kích hoạt"}
                          </strong>
                        </header>

                        <div className="smem-warranty-facts">
                          <div><span>Mã đơn hàng</span><strong>{warrantyOrder.orderCode}</strong></div>
                          <div><span>Số hóa đơn</span><strong>{warrantyOrder.invoiceNumber || "Chưa phát hành"}</strong></div>
                          <div><span>Thời hạn</span><strong>{warrantyOrder.warrantyMonths || 12} tháng</strong></div>
                          <div><span>Chi nhánh tiếp nhận</span><strong>{warrantyOrder.branchName || "Infinity Store"}</strong></div>
                          <div><span>Ngày bắt đầu</span><strong>{formatWarrantyDate(warrantyStart) || "Chưa kích hoạt"}</strong></div>
                          <div><span>Ngày hết hạn</span><strong>{formatWarrantyDate(warrantyEnd) || "Chưa xác định"}</strong></div>
                        </div>

                        <div className="smem-warranty-products">
                          <h4>Sản phẩm trong đơn</h4>
                          {(warrantyOrder.items?.length ? warrantyOrder.items : [{
                            productSlug: "",
                            productName: warrantyOrder.productName,
                            ram: "",
                            storage: "",
                            color: "",
                            quantity: warrantyOrder.quantity || 1,
                            unitPrice: Number(warrantyOrder.total),
                            image: "",
                          }]).map((item, index) => (
                            <article key={`${item.productName}-${index}`}>
                              <div className="smem-warranty-product-media">
                                {item.image ? (
                                  <Image src={item.image} alt="" width={52} height={52} unoptimized />
                                ) : (
                                  <span aria-hidden="true">📱</span>
                                )}
                              </div>
                              <div>
                                <strong>{item.productName}</strong>
                                <span>{[item.ram && `RAM ${item.ram}`, item.storage, item.color].filter(Boolean).join(" · ") || "Theo cấu hình trên đơn"}</span>
                              </div>
                              <b>x{item.quantity}</b>
                            </article>
                          ))}
                        </div>

                        <div className="smem-warranty-note-grid">
                          <div>
                            <span>Serial / IMEI</span>
                            <strong>{warrantyOrder.warrantySerials || "Cửa hàng chưa cập nhật"}</strong>
                          </div>
                          <div>
                            <span>Điều kiện bảo hành</span>
                            <p>{warrantyOrder.warrantyPolicy || "Sản phẩm được bảo hành theo chính sách của nhà sản xuất hoặc nhà cung cấp. Vui lòng mang theo sản phẩm và mã đơn khi đến cửa hàng."}</p>
                          </div>
                        </div>

                        <Link className="smem-warranty-invoice-link" href={`/member/hoa-don/${warrantyOrder.id}`}>
                          Xem hóa đơn và toàn bộ chi tiết đơn hàng →
                        </Link>
                      </section>
                    </>
                  ) : null}
                </div>
              )}

              {/* TAB 3: HẠNG THÀNH VIÊN (TIER) */}
              {activeSideTab === "tier" && (
                <div className="smem-section-card">
                  <div className="smem-tab-header">
                    <div>
                      <h2>💎 Hạng thành viên &amp; Quyền lợi tích lũy</h2>
                      <p>Chương trình chăm sóc khách hàng thân thiết của Infinity Store với nhiều ưu đãi tăng dần theo mức chi tiêu.</p>
                    </div>
                  </div>

                  {/* CURRENT PROGRESS CARD */}
                  <div className="smem-tier-progress-card" style={{ background: "linear-gradient(135deg, #0071e3 0%, #034da2 100%)", borderRadius: "14px", padding: "22px 24px", color: "#ffffff", marginBottom: "24px" }}>
                    <div className="smem-tier-progress-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                      <div>
                        <span style={{ fontSize: "12px", letterSpacing: "0.08em", opacity: 0.85, textTransform: "uppercase" }}>Hạng thành viên hiện tại</span>
                        <h3 style={{ fontSize: "24px", fontWeight: 900, margin: "4px 0" }}>{memberTier}</h3>
                        <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>
                          Tổng chi tiêu tích lũy: <strong>{formatMoney(totalSpent)}</strong>
                        </p>
                      </div>
                      <div className="smem-member-code" style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "12px", opacity: 0.85 }}>Mã thành viên</span>
                        <div style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "0.05em" }}>{customer.username.toUpperCase()}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: "20px" }}>
                      <div className="smem-tier-progress-label" style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px", opacity: 0.9 }}>
                        <span>Tiến trình thăng hạng</span>
                        <span>
                          {nextTierGoal ? `Cần thêm ${formatMoney(nextTierGoal.needed)} để lên ${nextTierGoal.name}` : "Đã đạt hạng cao nhất"}
                        </span>
                      </div>
                      <div style={{ height: "8px", background: "rgba(255,255,255,0.25)", borderRadius: "4px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            background: "#fde047",
                            width: `${Math.min(100, (totalSpent / (memberTier === "INFINITY MEMBER" ? 20000000 : 50000000)) * 100)}%`,
                            transition: "width 0.5s ease",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3 TIERS COMPARISON GRID */}
                  <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 14px", color: "#0f172a" }}>Chi tiết đặc quyền theo từng hạng</h3>
                  <div className="smem-tiers-grid">
                    {/* TIER 1: MEMBER */}
                    <div className={`smem-tier-card ${memberTier === "INFINITY MEMBER" ? "is-current" : ""}`}>
                      {memberTier === "INFINITY MEMBER" && <span className="smem-tier-card-badge">Đang đạt</span>}
                      <h3>INFINITY MEMBER</h3>
                      <div className="smem-tier-threshold">Tích lũy từ 0đ</div>
                      <ul className="smem-tier-perks">
                        <li><span>🎁</span> <span>Chiết khấu 1% khi mua phụ kiện và máy</span></li>
                        <li><span>🎂</span> <span>Voucher quà tặng sinh nhật 500.000đ</span></li>
                        <li><span></span> <span>Miễn phí giao hàng cho đơn từ 300.000đ</span></li>
                        <li><span>⭐</span> <span>Tích điểm đổi quà trên mỗi đơn hàng</span></li>
                        <li><span>🛡️</span> <span>Hỗ trợ kỹ thuật &amp; cài đặt phần mềm miễn phí</span></li>
                      </ul>
                    </div>

                    {/* TIER 2: VIP */}
                    <div className={`smem-tier-card ${memberTier === "INFINITY VIP" ? "is-current" : ""}`}>
                      {memberTier === "INFINITY VIP" && <span className="smem-tier-card-badge">Đang đạt</span>}
                      <h3>INFINITY VIP</h3>
                      <div className="smem-tier-threshold">Tích lũy từ 20.000.000đ</div>
                      <ul className="smem-tier-perks">
                        <li><span>🎁</span> <span>Chiết khấu 3% toàn bộ sản phẩm</span></li>
                        <li><span>🎉</span> <span>Voucher thăng hạng VIP 500.000đ</span></li>
                        <li><span>🎂</span> <span>Voucher quà sinh nhật 1.000.000đ</span></li>
                        <li><span>⚡</span> <span>Miễn phí giao hàng hỏa tốc trong 2H</span></li>
                        <li><span>🛡️</span> <span>Ưu tiên xử lý bảo hành và tiếp nhận máy</span></li>
                        <li><span>📦</span> <span>Mượn máy dự phòng miễn phí trong khi sửa chữa</span></li>
                      </ul>
                    </div>

                    {/* TIER 3: DIAMOND */}
                    <div className={`smem-tier-card ${memberTier === "INFINITY DIAMOND" ? "is-current" : ""}`}>
                      {memberTier === "INFINITY DIAMOND" && <span className="smem-tier-card-badge">Đang đạt</span>}
                      <h3>INFINITY DIAMOND</h3>
                      <div className="smem-tier-threshold">Tích lũy từ 50.000.000đ</div>
                      <ul className="smem-tier-perks">
                        <li><span>🎁</span> <span>Chiết khấu 5% toàn bộ sản phẩm &amp; phụ kiện</span></li>
                        <li><span>🎉</span> <span>Voucher thăng hạng Diamond 1.000.000đ</span></li>
                        <li><span>🎂</span> <span>Voucher quà sinh nhật 2.000.000đ</span></li>
                        <li><span>👑</span> <span>Chuyên viên tư vấn &amp; hỗ trợ kỹ thuật riêng 1-1</span></li>
                        <li><span>✨</span> <span>Miễn phí vệ sinh máy &amp; dán bảo vệ trọn đời</span></li>
                        <li><span>✈️</span> <span>Mời tham dự sự kiện ra mắt Apple &amp; Laptop hàng năm</span></li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: MÃ GIẢM GIÁ (VOUCHERS) */}
              {activeSideTab === "vouchers" && (
                <div className="smem-section-card">
                  <div className="smem-tab-header">
                    <div>
                      <h2>🎟️ Ví voucher &amp; Khuyến mãi của bạn</h2>
                      <p>Sử dụng các mã ưu đãi độc quyền dưới đây tại bước thanh toán để được giảm giá ngay.</p>
                    </div>
                  </div>

                  <div className="smem-voucher-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
                    {/* Voucher 1 */}
                    <div className="smem-voucher-ticket" style={{ padding: "16px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
                      <div className="smem-voucher-icon" style={{ width: "48px", height: "48px", fontSize: "22px" }}>📱</div>
                      <div className="smem-voucher-content">
                        <strong style={{ fontSize: "14px" }}>Ưu đãi Độc quyền iPhone 17 Series</strong>
                        <p style={{ fontSize: "13.5px" }}>Giảm 1.000.000đ</p>
                        <small>Áp dụng cho đơn hàng iPhone 17 Series · HSD: 31/12/2026</small>
                      </div>
                      <button type="button" className="smem-voucher-copy" onClick={() => copyCode("INFINITY_IP17_1TR")}>
                        {copiedVoucher === "INFINITY_IP17_1TR" ? "✓ Đã chép" : "📋 Copy mã"}
                      </button>
                    </div>

                    {/* Voucher 2 */}
                    <div className="smem-voucher-ticket" style={{ padding: "16px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
                      <div className="smem-voucher-icon" style={{ width: "48px", height: "48px", fontSize: "22px", background: "#e0f2fe", color: "#0284c7" }}>💻</div>
                      <div className="smem-voucher-content">
                        <strong style={{ fontSize: "14px" }}>Ưu đãi Hội viên Laptop &amp; MacBook</strong>
                        <p style={{ fontSize: "13.5px" }}>Giảm 10% tối đa 1.000.000đ</p>
                        <small>Đơn hàng Laptop từ 10.000.000đ · HSD: 30/06/2027</small>
                      </div>
                      <button type="button" className="smem-voucher-copy" onClick={() => copyCode("INFINITY_LAPTOP_10")}>
                        {copiedVoucher === "INFINITY_LAPTOP_10" ? "✓ Đã chép" : "📋 Copy mã"}
                      </button>
                    </div>

                    {/* Voucher 3 */}
                    <div className="smem-voucher-ticket" style={{ padding: "16px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
                      <div className="smem-voucher-icon" style={{ width: "48px", height: "48px", fontSize: "22px", background: "#fef3c7", color: "#b45309" }}>🎂</div>
                      <div className="smem-voucher-content">
                        <strong style={{ fontSize: "14px" }}>Voucher Sinh Nhật Thành Viên</strong>
                        <p style={{ fontSize: "13.5px" }}>Giảm 500.000đ</p>
                        <small>Áp dụng đơn từ 2.000.000đ · Có hiệu lực trong tháng sinh nhật</small>
                      </div>
                      <button type="button" className="smem-voucher-copy" onClick={() => copyCode("INFINITY_BDAY_500K")}>
                        {copiedVoucher === "INFINITY_BDAY_500K" ? "✓ Đã chép" : "📋 Copy mã"}
                      </button>
                    </div>

                    {/* Voucher 4 */}
                    <div className="smem-voucher-ticket" style={{ padding: "16px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
                      <div className="smem-voucher-icon" style={{ width: "48px", height: "48px", fontSize: "22px", background: "#dcfce7", color: "#15803d" }}>🎁</div>
                      <div className="smem-voucher-content">
                        <strong style={{ fontSize: "14px" }}>Chào Mừng Thành Viên Mới</strong>
                        <p style={{ fontSize: "13.5px" }}>Giảm 100.000đ</p>
                        <small>Áp dụng đơn hàng đầu tiên từ 500.000đ · HSD: 31/12/2026</small>
                      </div>
                      <button type="button" className="smem-voucher-copy" onClick={() => copyCode("INFINITY_CHAOMUNG")}>
                        {copiedVoucher === "INFINITY_CHAOMUNG" ? "✓ Đã chép" : "📋 Copy mã"}
                      </button>
                    </div>

                    {/* Voucher 5 */}
                    <div className="smem-voucher-ticket" style={{ padding: "16px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
                      <div className="smem-voucher-icon" style={{ width: "48px", height: "48px", fontSize: "22px", background: "#f3e8ff", color: "#7e22ce" }}>🎧</div>
                      <div className="smem-voucher-content">
                        <strong style={{ fontSize: "14px" }}>Ưu Đãi Phụ Kiện Chính Hãng</strong>
                        <p style={{ fontSize: "13.5px" }}>Giảm 20% tối đa 300.000đ</p>
                        <small>Áp dụng cho tai nghe, củ sạc, cáp sạc, pin sạc dự phòng</small>
                      </div>
                      <button type="button" className="smem-voucher-copy" onClick={() => copyCode("INFINITY_PK20")}>
                        {copiedVoucher === "INFINITY_PK20" ? "✓ Đã chép" : "📋 Copy mã"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: ƯU ĐÃI HỌC SINH - SINH VIÊN (STUDENT) */}
              {activeSideTab === "student" && (
                <div className="smem-section-card">
                  <div className="smem-tab-header">
                    <div>
                      <h2>🎓 Ưu đãi Học sinh - Sinh viên &amp; Giảng viên</h2>
                      <p>Chính sách trợ giá giáo dục của Infinity Store: giảm thêm đến 10% khi mua MacBook, iPad, Laptop và iPhone.</p>
                    </div>
                  </div>

                  {studentRegistered ? (
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "20px" }}>✅</span>
                        <strong style={{ color: "#15803d", fontSize: "15px" }}>Hồ sơ Giáo dục của bạn đã được xác thực!</strong>
                      </div>
                      <p style={{ fontSize: "13.5px", color: "#166534", margin: "0 0 14px", lineHeight: 1.5 }}>
                        Quyền lợi giảm thêm 10% (tối đa 500.000đ/máy) đã được kích hoạt trên tài khoản này. Khi bạn đặt mua các dòng máy tính xách tay hoặc máy tính bảng, hệ thống sẽ tự động trừ chiết khấu cho bạn.
                      </p>
                      <button
                        type="button"
                        onClick={() => { setStudentRegistered(false); try { localStorage.removeItem("inf_student_profile"); } catch {} }}
                        style={{ border: "1px solid #cbd5e1", background: "#ffffff", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
                      >
                        Cập nhật lại thẻ HSSV khác
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "18px", marginBottom: "20px" }}>
                        <h4 style={{ margin: "0 0 6px", color: "#1e40af", fontSize: "14px" }}>🎁 Quyền lợi khi đăng ký:</h4>
                        <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#1e3a8a", lineHeight: 1.5 }}>
                          <li>Giảm thêm đến 10% (tối đa 500.000đ/sản phẩm) cho MacBook, iPad, Laptop.</li>
                          <li>Tặng gói vệ sinh máy &amp; cài đặt phần mềm học tập miễn phí trong 12 tháng.</li>
                          <li>Hỗ trợ trả góp 0% lãi suất với thủ tục duyệt nhanh dành riêng cho sinh viên.</li>
                        </ul>
                      </div>

                      {studentMsg && (
                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 16px", borderRadius: "8px", color: "#15803d", fontSize: "13px", marginBottom: "16px" }}>
                          {studentMsg}
                        </div>
                      )}

                      <form onSubmit={submitStudent}>
                        <div className="smem-form-grid">
                          <div className="smem-input-card">
                            <label>Trường đang theo học / Giảng dạy *</label>
                            <input
                              required
                              placeholder="Ví dụ: Đại học Bách Khoa, THPT Chuyên..."
                              value={studentSchool}
                              onChange={(e) => setStudentSchool(e.target.value)}
                            />
                          </div>

                          <div className="smem-input-card">
                            <label>Mã số sinh viên / Thẻ giảng viên *</label>
                            <input
                              required
                              placeholder="Ví dụ: 2210459..."
                              value={studentId}
                              onChange={(e) => setStudentId(e.target.value)}
                            />
                          </div>

                          <div className="smem-input-card">
                            <label>Niên khóa tốt nghiệp dự kiến</label>
                            <input placeholder="Ví dụ: 2027" />
                          </div>

                          <div className="smem-input-card">
                            <label>Chuyên ngành / Khoa</label>
                            <input placeholder="Ví dụ: Công nghệ thông tin, Kinh tế..." />
                          </div>

                          <div className="smem-input-card smem-form-full">
                            <label>Ảnh chụp thẻ HSSV hoặc Căn cước công dân (Mặt trước) *</label>
                            <input type="file" accept="image/*" style={{ padding: "8px" }} />
                            <small style={{ color: "#64748b", fontSize: "11.5px" }}>Định dạng JPG, PNG hoặc PDF dưới 5MB. Thông tin được mã hóa bảo mật tuyệt đối.</small>
                          </div>
                        </div>

                        <button type="submit" className="smem-cta-btn">
                          Gửi hồ sơ xét duyệt ưu đãi HSSV
                        </button>
                      </form>
                    </>
                  )}
                </div>
              )}

              {/* TAB 6: KHÁCH HÀNG DOANH NGHIỆP (BUSINESS) */}
              {activeSideTab === "business" && (
                <div className="smem-section-card">
                  <div className="smem-tab-header">
                    <div>
                      <h2>💼 Chính sách ưu đãi Khách hàng Doanh nghiệp (B2B)</h2>
                      <p>Giải pháp mua sắm thiết bị công nghệ chính hãng cho doanh nghiệp với chính sách chiết khấu lớn và xuất hóa đơn VAT điện tử nhanh chóng.</p>
                    </div>
                  </div>

                  {businessRegistered ? (
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "20px" }}>🏢</span>
                        <strong style={{ color: "#15803d", fontSize: "15px" }}>Tài khoản Doanh nghiệp B2B đã được kích hoạt!</strong>
                      </div>
                      <p style={{ fontSize: "13.5px", color: "#166534", margin: "0 0 14px", lineHeight: 1.5 }}>
                        Tài khoản của bạn đã được liên kết thông tin xuất hóa đơn VAT tự động và chính sách chiết khấu khối lượng đến 8%. Chuyên viên doanh nghiệp sẽ đồng hành cùng mọi đơn mua của quý công ty.
                      </p>
                      <button
                        type="button"
                        onClick={() => { setBusinessRegistered(false); try { localStorage.removeItem("inf_business_profile"); } catch {} }}
                        style={{ border: "1px solid #cbd5e1", background: "#ffffff", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}
                      >
                        Cập nhật lại thông tin công ty
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "18px", marginBottom: "20px" }}>
                        <h4 style={{ margin: "0 0 6px", color: "#1e40af", fontSize: "14px" }}>🤝 Đặc quyền doanh nghiệp đối tác:</h4>
                        <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#1e3a8a", lineHeight: 1.5 }}>
                          <li>Chiết khấu trực tiếp tới 8% trên giá trị đơn hàng theo số lượng.</li>
                          <li>Xuất hóa đơn GTGT điện tử hợp lệ 100% ngay trong ngày làm việc.</li>
                          <li>Chính sách công nợ linh hoạt 30 ngày cho các doanh nghiệp ký kết định kỳ.</li>
                          <li>Giao hàng, cài đặt tận văn phòng và hỗ trợ bảo hành tận nơi.</li>
                        </ul>
                      </div>

                      {businessMsg && (
                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 16px", borderRadius: "8px", color: "#15803d", fontSize: "13px", marginBottom: "16px" }}>
                          {businessMsg}
                        </div>
                      )}

                      <form onSubmit={submitBusiness}>
                        <div className="smem-form-grid">
                          <div className="smem-input-card">
                            <label>Tên Công ty / Doanh nghiệp *</label>
                            <input
                              required
                              placeholder="Ví dụ: Công ty Cổ phần Công nghệ ABC"
                              value={businessCompany}
                              onChange={(e) => setBusinessCompany(e.target.value)}
                            />
                          </div>

                          <div className="smem-input-card">
                            <label>Mã số thuế (MST) *</label>
                            <input
                              required
                              placeholder="Ví dụ: 0312345678"
                              value={businessTax}
                              onChange={(e) => setBusinessTax(e.target.value)}
                            />
                          </div>

                          <div className="smem-input-card smem-form-full">
                            <label>Địa chỉ trụ sở công ty theo đăng ký kinh doanh *</label>
                            <input required placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" />
                          </div>

                          <div className="smem-input-card">
                            <label>Email nhận hóa đơn điện tử *</label>
                            <input type="email" required placeholder="ketoan@congty.com" />
                          </div>

                          <div className="smem-input-card">
                            <label>Người đại diện liên hệ &amp; Số điện thoại *</label>
                            <input required placeholder="Nguyễn Văn B - 0912345678" />
                          </div>
                        </div>

                        <button type="submit" className="smem-cta-btn">
                          Đăng ký đối tác Doanh nghiệp B2B
                        </button>
                      </form>
                    </>
                  )}
                </div>
              )}

              {/* TAB 7: SỔ ĐỊA CHỈ (ADDRESS) */}
              {activeSideTab === "address" && (
                <div className="smem-section-card">
                  <div className="smem-tab-header">
                    <div>
                      <h2>📍 Sổ địa chỉ nhận hàng</h2>
                      <p>Quản lý các địa chỉ giao nhận hàng của bạn để quá trình đặt hàng diễn ra thuận tiện và nhanh nhất.</p>
                    </div>
                    <button
                      type="button"
                      className="smem-cta-btn"
                      style={{ padding: "8px 16px", fontSize: "12.5px" }}
                      onClick={() => setShowAddressForm(!showAddressForm)}
                    >
                      {showAddressForm ? "Đóng biểu mẫu" : "+ Thêm địa chỉ mới"}
                    </button>
                  </div>

                  {showAddressForm && (
                    <form onSubmit={handleSaveAddress} style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
                      <h4 style={{ margin: "0 0 14px", fontSize: "15px", color: "#0f172a" }}>Thêm địa chỉ giao hàng mới</h4>
                      <div className="smem-form-grid">
                        <div className="smem-input-card">
                          <label>Họ và tên người nhận *</label>
                          <input required placeholder="Nguyễn Văn A" value={newAddrName} onChange={(e) => setNewAddrName(e.target.value)} />
                        </div>
                        <div className="smem-input-card">
                          <label>Số điện thoại nhận hàng *</label>
                          <input required type="tel" placeholder="0987654321" value={newAddrPhone} onChange={(e) => setNewAddrPhone(e.target.value)} />
                        </div>
                        <div className="smem-input-card">
                          <label>Tỉnh / Thành phố *</label>
                          <select value={newAddrCity} onChange={(e) => setNewAddrCity(e.target.value)}>
                            <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                            <option value="Hà Nội">Hà Nội</option>
                            <option value="Đà Nẵng">Đà Nẵng</option>
                            <option value="Cần Thơ">Cần Thơ</option>
                            <option value="Hải Phòng">Hải Phòng</option>
                            <option value="Bình Dương">Bình Dương</option>
                            <option value="Đồng Nai">Đồng Nai</option>
                          </select>
                        </div>
                        <div className="smem-input-card smem-form-full">
                          <label>Địa chỉ cụ thể (Số nhà, tên đường, phường/xã, quận/huyện) *</label>
                          <input required placeholder="Ví dụ: 122/4 Cô Giang, Phường Cầu Kiệu, Quận 1" value={newAddrDetail} onChange={(e) => setNewAddrDetail(e.target.value)} />
                        </div>
                        <div className="smem-form-full" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <input
                            type="checkbox"
                            id="defaultAddrCheck"
                            checked={newAddrDefault}
                            onChange={(e) => setNewAddrDefault(e.target.checked)}
                          />
                          <label htmlFor="defaultAddrCheck" style={{ fontSize: "13px", cursor: "pointer", color: "#334155" }}>
                            Đặt làm địa chỉ nhận hàng mặc định
                          </label>
                        </div>
                      </div>
                      <div className="smem-form-actions" style={{ display: "flex", gap: "10px" }}>
                        <button type="submit" className="smem-cta-btn">Lưu địa chỉ</button>
                        <button type="button" onClick={() => setShowAddressForm(false)} style={{ border: "1px solid #cbd5e1", background: "#fff", borderRadius: "8px", padding: "10px 18px", cursor: "pointer", fontSize: "13px" }}>Hủy</button>
                      </div>
                    </form>
                  )}

                  {addresses.length > 0 ? (
                    <div className="smem-address-list">
                      {addresses.map((addr) => (
                        <div key={addr.id} className={`smem-address-card ${addr.isDefault ? "is-default" : ""}`}>
                          <div className="smem-address-title-row">
                            <h4>{addr.name}</h4>
                            {addr.isDefault && <span className="smem-address-badge">Mặc định</span>}
                          </div>
                          <p><strong>SĐT:</strong> {addr.phone}</p>
                          <p><strong>Địa chỉ:</strong> {addr.address}, {addr.city}</p>
                          <div className="smem-address-actions">
                            {!addr.isDefault && (
                              <button type="button" onClick={() => setDefaultAddress(addr.id)} style={{ color: "#0284c7" }}>
                                Đặt làm mặc định
                              </button>
                            )}
                            {addresses.length > 1 && (
                              <button type="button" onClick={() => deleteAddress(addr.id)} style={{ color: "#b91c1c" }}>
                                Xóa địa chỉ
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="smem-empty-box">
                      <div className="smem-empty-icon">📍</div>
                      <h3>Chưa có địa chỉ nào được lưu</h3>
                      <p>Thêm địa chỉ giao hàng để tiện lợi khi thanh toán các đơn hàng sau này.</p>
                      <button type="button" className="smem-cta-btn" onClick={() => setShowAddressForm(true)}>
                        + Thêm địa chỉ mới
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 8: GIỚI THIỆU BẠN BÈ (REFER) */}
              {activeSideTab === "refer" && (
                <div className="smem-section-card">
                  <div className="smem-tab-header">
                    <div>
                      <h2>👥 Giới thiệu bạn bè - Nhận thưởng cùng Infinity Store</h2>
                      <p>Chia sẻ liên kết hoặc mã giới thiệu của bạn cho người thân, bạn bè để cả hai cùng nhận ưu đãi 100.000đ.</p>
                    </div>
                  </div>

                  <div className="smem-refer-card">
                    <div className="smem-refer-header">
                      <span style={{ fontSize: "36px" }}>🎁</span>
                      <div>
                        <h3 style={{ margin: "0 0 4px", fontSize: "18px", color: "#0f172a" }}>Tặng bạn bè 100.000đ · Bạn nhận 100.000đ tích lũy</h3>
                        <p style={{ margin: 0, fontSize: "13.5px", color: "#475569" }}>
                          Mỗi khi bạn bè đăng ký và hoàn tất đơn hàng đầu tiên qua mã của bạn, cả hai đều nhận được phần thưởng mua sắm.
                        </p>
                      </div>
                    </div>

                    <div className="smem-refer-options" style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
                      <div className="smem-refer-option">
                        <small style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Mã giới thiệu của bạn:</small>
                        <div className="smem-refer-code-box">
                          <span className="smem-refer-code">INF-{(customer.username || "MEMBER").toUpperCase()}</span>
                          <button
                            type="button"
                            className="smem-voucher-copy"
                            onClick={() => copyReferral(`INF-${(customer.username || "MEMBER").toUpperCase()}`)}
                          >
                            {copiedReferral ? "✓ Đã chép" : "📋 Copy mã"}
                          </button>
                        </div>
                      </div>

                      <div className="smem-refer-option">
                        <small style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Đường dẫn giới thiệu trực tiếp:</small>
                        <div className="smem-refer-code-box" style={{ background: "#ffffff" }}>
                          <span style={{ fontSize: "13px", color: "#0f172a" }}>https://infinityshop.click/?ref={customer.username}</span>
                          <button
                            type="button"
                            className="smem-voucher-copy"
                            onClick={() => copyReferral(`https://infinityshop.click/?ref=${customer.username}`)}
                          >
                            {copiedReferral ? "✓ Đã chép" : "📋 Copy link"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h4 style={{ fontSize: "15px", margin: "20px 0 14px", color: "#0f172a" }}>Cách thức hoạt động:</h4>
                  <div className="smem-refer-steps" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "10px" }}>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--smem-blue)", marginBottom: "6px" }}>1</div>
                      <strong style={{ display: "block", fontSize: "13.5px", marginBottom: "4px" }}>Gửi mã giới thiệu</strong>
                      <small style={{ color: "#64748b", fontSize: "12.5px" }}>Chia sẻ link hoặc mã qua Zalo, Facebook, Messenger cho bạn bè.</small>
                    </div>

                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "10px" }}>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--smem-blue)", marginBottom: "6px" }}>2</div>
                      <strong style={{ display: "block", fontSize: "13.5px", marginBottom: "4px" }}>Bạn bè mua hàng</strong>
                      <small style={{ color: "#64748b", fontSize: "12.5px" }}>Người được giới thiệu nhập mã để giảm ngay 100.000đ khi đặt đơn.</small>
                    </div>

                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "10px" }}>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--smem-blue)", marginBottom: "6px" }}>3</div>
                      <strong style={{ display: "block", fontSize: "13.5px", marginBottom: "4px" }}>Cùng nhận thưởng</strong>
                      <small style={{ color: "#64748b", fontSize: "12.5px" }}>Sau khi đơn hàng hoàn tất, bạn nhận 100.000đ vào ví tích lũy.</small>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 9: THÔNG TIN TÀI KHOẢN (PROFILE) */}
              {activeSideTab === "profile" && (
                <div className="smem-section-card">
                  {params.get("complete") === "1" && (
                    <div className="smem-profile-completion-note">
                      <strong>HOÀN THIỆN HỒ SƠ</strong>
                      <span>Cập nhật thông tin member để tiếp tục hành trình mua hàng.</span>
                    </div>
                  )}
                  <div className="smem-tab-header">
                    <div>
                      <h2>⚙️ Thông tin member</h2>
                      <p>Quản lý thông tin cá nhân và bảo mật tài khoản thành viên Infinity Store.</p>
                    </div>
                  </div>

                  {profileNotice && (
                    <div style={{ background: profileNotice.startsWith("✓") ? "#f0fdf4" : "#fef2f2", border: `1px solid ${profileNotice.startsWith("✓") ? "#bbf7d0" : "#fecaca"}`, padding: "12px 16px", borderRadius: "8px", color: profileNotice.startsWith("✓") ? "#15803d" : "#b91c1c", fontSize: "13px", marginBottom: "16px" }}>
                      {profileNotice}
                    </div>
                  )}

                  <div className="smem-profile-avatar-editor">
                    <div className="smem-profile-avatar-preview">
                      {avatar ? <Image src={avatar} alt={`Ảnh đại diện của ${customer.name || customer.username}`} fill unoptimized /> : initials}
                    </div>
                    <div>
                      <strong>Ảnh đại diện</strong>
                      <p>JPG, PNG hoặc WebP · tối đa 3 MB</p>
                      <div className="smem-profile-avatar-actions">
                        <label>
                          {uploadingAvatar ? "Đang xử lý..." : "Đổi ảnh"}
                          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar} disabled={uploadingAvatar} />
                        </label>
                        {customer.avatarUrl && <button type="button" onClick={removeAvatar} disabled={uploadingAvatar}>Gỡ ảnh</button>}
                      </div>
                    </div>
                  </div>

                  <form onSubmit={submitProfileUpdate}>
                    <div className="smem-form-grid">
                      <div className="smem-input-card">
                        <label>Tên đăng nhập</label>
                        <input value={customer.username} disabled style={{ background: "#f1f5f9", cursor: "not-allowed" }} />
                      </div>

                      <div className="smem-input-card">
                        <label>Email đăng ký</label>
                        <input value={customer.email || "Chưa cập nhật"} disabled style={{ background: "#f1f5f9", cursor: "not-allowed" }} />
                      </div>

                      <div className="smem-input-card">
                        <label>Họ và tên *</label>
                        <input
                          required
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                        />
                      </div>

                      <div className="smem-input-card">
                        <label>Số điện thoại liên hệ *</label>
                        <input
                          required
                          type="tel"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <button type="submit" className="smem-cta-btn" style={{ marginBottom: "24px" }}>
                      Lưu thông tin cá nhân
                    </button>
                  </form>

                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "20px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 800, margin: "0 0 6px", color: "#0f172a" }}>Bảo mật &amp; Đổi mật khẩu</h3>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 14px" }}>
                      Để bảo vệ tài khoản, hãy đặt mật khẩu có ít nhất 8 ký tự bao gồm chữ và số.
                    </p>

                    <button
                      type="button"
                      onClick={() => { setRecoveryStep("forgot"); setMessage(""); }}
                      style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer", color: "#0f172a" }}
                    >
                      🔑 Đổi hoặc khôi phục mật khẩu mới
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: UNAUTHENTICATED MEMBER LOGIN / REGISTER PORTAL
  // =========================================================================
  return (
    <div className="smem-login-wrapper">
      <div className="smem-login-container">
        {/* LEFT COLUMN: INFINITY MEMBER INVITATION & PERKS */}
        <div className="smem-intro-col">
          <div className="smem-brand-header">
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
              <Image
                src="/brand/if-techshop-logo.png"
                alt="IF TECHSHOP"
                width={160}
                height={50}
                style={{ objectFit: "contain", height: "48px", width: "auto" }}
                priority
                unoptimized
              />
            </Link>
          </div>

          <h1>
            Nhập hội khách hàng thành viên <strong>INFINITY MEMBER</strong>
          </h1>
          <p>Để không bỏ lỡ các ưu đãi độc quyền hấp dẫn từ Infinity Store</p>

          <div className="smem-benefits-card">
            <ul className="smem-benefit-list">
              <li className="smem-benefit-item">
                <span className="smem-benefit-icon">🎁</span>
                <div><strong>Chiết khấu đến 5%</strong> khi mua sắm các sản phẩm tại Infinity Store</div>
              </li>
              <li className="smem-benefit-item">
                <span className="smem-benefit-icon">🚚</span>
                <div><strong>Miễn phí giao hàng</strong> cho thành viên INFINITY MEMBER, VIP và cho đơn hàng từ 300.000đ</div>
              </li>
              <li className="smem-benefit-item">
                <span className="smem-benefit-icon">🎂</span>
                <div><strong>Tặng voucher sinh nhật đến 500.000đ</strong> cho khách hàng thành viên</div>
              </li>
              <li className="smem-benefit-item">
                <span className="smem-benefit-icon">💳</span>
                <div><strong>Trả góp 0% lãi suất</strong> xét duyệt hồ sơ nhanh</div>
              </li>
              <li className="smem-benefit-item">
                <span className="smem-benefit-icon">⭐</span>
                <div><strong>Thăng hạng</strong> nhận voucher đến 300.000đ</div>
              </li>
              <li className="smem-benefit-item">
                <span className="smem-benefit-icon">🎓</span>
                <div><strong>Đặc quyền Học sinh - Sinh viên</strong> ưu đãi thêm đến 10%</div>
              </li>
              <li className="smem-benefit-item">
                <span className="smem-benefit-icon">💼</span>
                <div><strong>Infinity Business:</strong> Chiết khấu đến 8% dành riêng cho khách hàng doanh nghiệp</div>
              </li>
            </ul>

            <a href="#" className="smem-benefit-more">
              Xem chi tiết chính sách ưu đãi Infinity Member ›
            </a>
          </div>

          <div className="smem-mascot-row">
            <Image
              src="/infinity-member/mascot-promotion.svg"
              alt="Infinity Member VIP"
              width={280}
              height={210}
              className="smem-mascot-img"
              unoptimized
              priority
            />
          </div>
        </div>

        {/* RIGHT COLUMN: LOGIN / REGISTER FORM */}
        <div className="smem-form-col">
          {!recoveryStep ? (
            <>
              <h2>{mode === "login" ? "Đăng nhập INFINITY MEMBER" : "Đăng ký INFINITY MEMBER"}</h2>

              <form onSubmit={submitAuth}>
                {mode === "register" && (
                  <>
                    <div className="smem-input-group">
                      <label>Tên đăng nhập</label>
                      <div className="smem-input-field">
                        <input name="username" required minLength={4} maxLength={24} pattern="[a-zA-Z0-9._]+" placeholder="infinity_user" autoComplete="username" />
                      </div>
                    </div>
                    <div className="smem-input-group">
                      <label>Họ và tên</label>
                      <div className="smem-input-field">
                        <input name="name" required placeholder="Nguyễn Văn A" autoComplete="name" />
                      </div>
                    </div>
                    <div className="smem-input-group">
                      <label>Số điện thoại</label>
                      <div className="smem-input-field">
                        <input name="phone" required type="tel" pattern="[0-9 +]{9,15}" placeholder="0987654321" autoComplete="tel" />
                      </div>
                    </div>
                    <div className="smem-input-group">
                      <label>Email</label>
                      <div className="smem-input-field">
                        <input name="email" type="email" required placeholder="name@example.com" autoComplete="email" />
                      </div>
                    </div>
                  </>
                )}

                {mode === "login" && (
                  <div className="smem-input-group">
                    <label>Tên đăng nhập hoặc email / số điện thoại</label>
                    <div className="smem-input-field">
                      <input name="identifier" required placeholder="Nhập số điện thoại của bạn" autoComplete="username" />
                    </div>
                  </div>
                )}

                <div className="smem-input-group">
                  <label>Mật khẩu</label>
                  <div className="smem-input-field">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      minLength={8}
                      required
                      placeholder="Nhập mật khẩu của bạn"
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                    />
                    <button
                      type="button"
                      className="smem-pwd-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {message && (
                  <p style={{ color: "#b91c1c", fontSize: "13px", margin: "8px 0 14px", fontWeight: 600 }}>
                    {message}
                  </p>
                )}

                <button type="submit" className="smem-submit-btn" disabled={sending}>
                  {sending ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký ngay"}
                </button>

                {mode === "login" && (
                  <button
                    type="button"
                    className="smem-forgot-link"
                    style={{ border: "none", background: "none", cursor: "pointer", width: "100%" }}
                    onClick={() => { setRecoveryStep("forgot"); setMessage(""); }}
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </form>

              <div className="smem-divider">
                <span>Hoặc đăng nhập bằng</span>
              </div>

              <div className="smem-social-buttons">
                <a href={`/api/account/google/start?returnTo=${encodeURIComponent(returnTo)}`} className="smem-social-btn">
                  <Image src="/infinity-member/logo-google.svg" alt="Google" width={18} height={18} unoptimized />
                  <span>Tiếp tục với Google</span>
                </a>
              </div>

              <div className="smem-switch-auth">
                {mode === "login" ? (
                  <>
                    Bạn chưa có tài khoản?{" "}
                    <button type="button" onClick={() => { setMode("register"); setMessage(""); }}>
                      Đăng ký ngay
                    </button>
                  </>
                ) : (
                  <>
                    Đã có tài khoản INFINITY MEMBER?{" "}
                    <button type="button" onClick={() => { setMode("login"); setMessage(""); }}>
                      Đăng nhập ngay
                    </button>
                  </>
                )}
              </div>

              <p className="smem-footer-note">
                Hệ thống bán lẻ thiết bị công nghệ chính hãng <strong>infinityshop.click</strong>
              </p>
            </>
          ) : (
            /* PASSWORD RECOVERY */
            <div style={{ padding: "10px 0" }}>
              <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>
                {recoveryStep === "forgot" ? "Khôi phục mật khẩu" : recoveryStep === "verify" ? "Nhập mã xác minh" : "Đặt mật khẩu mới"}
              </h2>
              <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>
                {recoveryStep === "forgot"
                  ? "Nhập số điện thoại, email hoặc tên đăng nhập để nhận mã OTP."
                  : recoveryStep === "verify"
                  ? "Kiểm tra tin nhắn hoặc email và nhập mã xác thực."
                  : "Nhập mật khẩu mới ít nhất 8 ký tự."}
              </p>

              {recoveryStep === "forgot" && (
                <form onSubmit={requestPasswordReset}>
                  <div className="smem-input-group">
                    <label>Số điện thoại hoặc email</label>
                    <div className="smem-input-field">
                      <input name="identifier" required placeholder="0987... hoặc email" autoFocus />
                    </div>
                  </div>
                  {recoveryMessage && <p style={{ color: recoveryError ? "#b91c1c" : "#15803d", fontSize: "13px" }}>{recoveryMessage}</p>}
                  <button className="smem-submit-btn" disabled={sending}>
                    {sending ? "Đang gửi..." : "Gửi mã xác minh"}
                  </button>
                </form>
              )}

              {recoveryStep === "verify" && (
                <form onSubmit={verifyPasswordReset}>
                  <div className="smem-input-group">
                    <label>Mã xác minh (OTP)</label>
                    <div className="smem-input-field">
                      <input name="code" required placeholder="Nhập 6 số OTP" inputMode="numeric" autoComplete="one-time-code" autoFocus />
                    </div>
                  </div>
                  <p className="smem-recovery-destination">Mã đang được gửi cho tài khoản: <strong>{recoveryIdentifier}</strong></p>
                  {recoveryMessage && <p style={{ color: recoveryError ? "#b91c1c" : "#15803d", fontSize: "13px" }}>{recoveryMessage}</p>}
                  <button className="smem-submit-btn" disabled={sending}>
                    {sending ? "Đang kiểm tra..." : "Xác minh mã"}
                  </button>
                </form>
              )}

              {recoveryStep === "reset" && (
                <form onSubmit={completePasswordReset}>
                  <div className="smem-input-group">
                    <label>Mật khẩu mới</label>
                    <div className="smem-input-field">
                      <input name="password" type="password" minLength={8} required placeholder="Tối thiểu 8 ký tự" autoFocus />
                    </div>
                  </div>
                  <div className="smem-input-group">
                    <label>Xác nhận mật khẩu mới</label>
                    <div className="smem-input-field">
                      <input name="confirmPassword" type="password" minLength={8} required placeholder="Nhập lại mật khẩu" />
                    </div>
                  </div>
                  {recoveryMessage && <p style={{ color: recoveryError ? "#b91c1c" : "#15803d", fontSize: "13px" }}>{recoveryMessage}</p>}
                  <button className="smem-submit-btn" disabled={sending}>
                    {sending ? "Đang đổi..." : "Cập nhật mật khẩu"}
                  </button>
                </form>
              )}

              <button
                type="button"
                className="smem-forgot-link"
                style={{ border: "none", background: "none", cursor: "pointer", width: "100%", marginTop: "16px" }}
                onClick={() => { setRecoveryStep(""); setRecoveryMessage(""); }}
              >
                ← Quay lại đăng nhập
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function errorMessage(error: string | null) {
  if (error === "admin-only") return "Khu vực quản lý chỉ dành cho Giám đốc và nhân viên được cấp quyền.";
  if (error === "google-config") return "Đăng nhập Google chưa được cấu hình trên hệ thống.";
  if (error === "google") return "Không thể đăng nhập Google. Vui lòng thử lại.";
  return "";
}

function safeReturnTo(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") && !value.startsWith("/api/")
    ? value
    : "/member";
}

function formatMoney(value: number) {
  return `${Math.max(0, Math.round(value || 0)).toLocaleString("vi-VN")}đ`;
}

function formatTimestamp(value: number) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function calculateWarrantyEnd(startDate: string, months: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || months <= 0) return "";
  const date = new Date(`${startDate}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

function formatWarrantyDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
