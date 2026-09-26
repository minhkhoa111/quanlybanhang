"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useCart } from "@/app/cart";
import { formatOrderMoney } from "@/app/order-pricing";
import ProductCard from "@/app/components/ProductCard";
import type { Product } from "@/app/products";

const BANK_PAYMENT = "Chuyển khoản Techcombank 24/7 - 6820102010";
const MOMO_PAYMENT = "MoMo - 0869275642";
const APPLE_PAYMENT = "Apple Pay - xác nhận với cửa hàng";
const INSTALLMENT_PAYMENT = "Trả góp qua công ty tài chính";
const STORE_VISIT = "Đến cửa hàng xem máy";

type Customer = { name: string; email: string; phone: string };
type VoucherQuote = { code: string; discount: number; subtotal: number };
type Branch = { id: string; name: string; address: string; phone: string; hours: string };

export default function CartCheckout({ branches, recommendations = [] }: { branches: Branch[]; recommendations?: Product[] }) {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [purchaseMode, setPurchaseMode] = useState<"online" | "store">("online");
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState<VoucherQuote | null>(null);
  const [voucherMessage, setVoucherMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(BANK_PAYMENT);

  // Meticulous Add-ons
  const [includeAppleCare, setIncludeAppleCare] = useState(false);
  const [includeVAT, setIncludeVAT] = useState(false);
  const [vatCompany, setVatCompany] = useState("");
  const [vatTaxId, setVatTaxId] = useState("");
  const [vatAddress, setVatAddress] = useState("");

  // Stepper state: 1: Giỏ hàng & Tùy chọn, 2: Nhận hàng, 3: Thanh toán
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // VietQR & Copy feedback
  const [copiedSTK, setCopiedSTK] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes

  // Apple Pay Simulated Sheet
  const [showApplePaySheet, setShowApplePaySheet] = useState(false);
  const [applePayAuthenticated, setApplePayAuthenticated] = useState(false);

  // Submission state
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [submittedTotal, setSubmittedTotal] = useState(0);

  // Calculate pricing
  const appleCarePrice = includeAppleCare ? 990000 : 0;
  const activeVoucher = purchaseMode === "online" && voucher?.subtotal === subtotal ? voucher : null;
  const total = Math.max(0, subtotal + appleCarePrice - (activeVoucher?.discount ?? 0));
  const selectedBranch = branches.find((branch) => branch.id === branchId) ?? branches[0];

  useEffect(() => {
    void fetch("/api/account/me")
      .then((res) => res.json())
      .then((data) => setCustomer(data.customer))
      .catch(() => undefined);
  }, []);

  // Countdown timer for QR payment
  useEffect(() => {
    if (activeStep !== 3 && status !== "success") return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeStep, status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const copyToClipboard = (text: string, type: "stk" | "amount" | "content") => {
    navigator.clipboard.writeText(text);
    if (type === "stk") {
      setCopiedSTK(true);
      setTimeout(() => setCopiedSTK(false), 2000);
    } else if (type === "amount") {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } else {
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    }
  };

  function chooseMode(mode: "online" | "store") {
    setPurchaseMode(mode);
    setMessage("");
    if (mode === "store") {
      setPaymentMethod("");
      setVoucher(null);
      setVoucherMessage("");
    } else {
      setPaymentMethod(BANK_PAYMENT);
    }
  }

  async function applyVoucher() {
    setVoucherMessage("");
    try {
      const response = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucherInput, subtotal }),
      });
      const result = (await response.json()) as { code?: string; discount?: number; message?: string };
      if (!response.ok) throw new Error(result.message || "Voucher không hợp lệ.");
      setVoucher({ code: result.code || "", discount: Number(result.discount) || 0, subtotal });
      setVoucherInput(result.code || voucherInput.toUpperCase());
      setVoucherMessage(`Đã áp dụng giảm ${formatOrderMoney(Number(result.discount) || 0)}.`);
    } catch (error) {
      setVoucher(null);
      setVoucherMessage(error instanceof Error ? error.message : "Voucher không hợp lệ.");
    }
  }

  // Trigger Apple Pay simulation
  const handleApplePayClick = () => {
    setShowApplePaySheet(true);
    setApplePayAuthenticated(false);
    setTimeout(() => {
      setApplePayAuthenticated(true);
      setTimeout(() => {
        setShowApplePaySheet(false);
        setPaymentMethod(APPLE_PAYMENT);
      }, 1200);
    }, 1800);
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) return;
    if (purchaseMode === "store" && !selectedBranch) {
      setStatus("error");
      setMessage("Vui lòng chọn chi nhánh muốn đến xem máy.");
      return;
    }
    if (purchaseMode === "online" && !paymentMethod) {
      setStatus("error");
      setMessage("Vui lòng chọn phương thức thanh toán online.");
      return;
    }

    setStatus("sending");
    setMessage("");
    const data = new FormData(event.currentTarget);

    let finalNote = String(data.get("note") || "");
    if (includeAppleCare) {
      finalNote += " [Kèm AppleCare+ 1 Đổi 1 Trong 24 Tháng]";
    }
    if (includeVAT && vatTaxId) {
      finalNote += ` [VAT: ${vatCompany} - MST: ${vatTaxId} - Đ/C: ${vatAddress}]`;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: data.get("name"),
          phone: data.get("phone"),
          email: data.get("email"),
          deliveryMethod: purchaseMode === "store" ? STORE_VISIT : "Giao hàng tận nơi",
          branchId: purchaseMode === "store" ? branchId : "",
          address: purchaseMode === "online" ? data.get("address") : "",
          paymentMethod: purchaseMode === "online" ? paymentMethod : "",
          note: finalNote,
          voucherCode: activeVoucher?.code || "",
          items: items.map(({ productSlug, ram, storage, color, quantity }) => ({
            productSlug,
            ram,
            storage,
            color,
            quantity,
          })),
        }),
      });

      const result = (await response.json()) as { ok?: boolean; orderCode?: string; message?: string };
      if (!response.ok || !result.ok) throw new Error(result.message || "Không thể tạo đơn hàng.");

      setOrderCode(result.orderCode || "");
      setExpiresAt(Date.now() + 10 * 60 * 1000);
      setSubmittedTotal(total);
      setStatus("success");
      clearCart();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Không thể tạo đơn hàng.");
    }
  }

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const isStoreVisit = purchaseMode === "store";

  const generatedQRUrl =
    paymentMethod === MOMO_PAYMENT
      ? `/api/momo-qr?orderCode=${encodeURIComponent(orderCode || "ORDER")}&expiresAt=${expiresAt}`
      : `/api/payment-qr?orderCode=${encodeURIComponent(orderCode || "ORDER")}&expiresAt=${expiresAt}`;

  // =========================================================================
  // SUCCESS RECEIPT SCREEN (CHỈNH CHU CHUẨN APPLE INVOICE)
  // =========================================================================
  if (status === "success") {
    return (
      <div className="apple-checkout-container">
        <section className="apple-invoice-receipt" aria-labelledby="receipt-title">
          <div className="apple-invoice-check">✓</div>
          <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#34c759", fontWeight: 800 }}>
            XÁC NHẬN CHÍNH THỨC · INFINITY STORE
          </span>
          <h1 id="receipt-title" style={{ fontSize: "28px", fontWeight: 800, margin: "8px 0 10px", color: "#1d1d1f" }}>
            {isStoreVisit ? "Đã Đặt Lịch Xem Máy Thành Công" : "Đơn Hàng Đã Được Tiếp Nhận"}
          </h1>
          <p style={{ color: "#86868b", fontSize: "15px", maxWidth: "480px", margin: "0 auto 16px" }}>
            Cảm ơn bạn đã tin chọn thiết bị Apple &amp; Công nghệ chính hãng tại Infinity Store.
          </p>

          <div className="apple-invoice-order-code">
            MÃ ĐƠN HÀNG: <strong>{orderCode}</strong>
          </div>

          {/* Progress Timeline */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "8px",
              margin: "24px 0 32px",
              padding: "18px",
              background: "#f9f9fb",
              borderRadius: "18px",
              textAlign: "center",
            }}
          >
            <div>
              <span style={{ fontSize: "18px" }}>📋</span>
              <strong style={{ display: "block", fontSize: "11px", color: "#0071e3", marginTop: "4px" }}>
                Đã tiếp nhận
              </strong>
            </div>
            <div>
              <span style={{ fontSize: "18px" }}>🔍</span>
              <strong style={{ display: "block", fontSize: "11px", color: "#86868b", marginTop: "4px" }}>
                Kiểm tra IMEI
              </strong>
            </div>
            <div>
              <span style={{ fontSize: "18px" }}>📦</span>
              <strong style={{ display: "block", fontSize: "11px", color: "#86868b", marginTop: "4px" }}>
                Đóng niêm phong
              </strong>
            </div>
            <div>
              <span style={{ fontSize: "18px" }}>🚀</span>
              <strong style={{ display: "block", fontSize: "11px", color: "#86868b", marginTop: "4px" }}>
                {isStoreVisit ? "Sẵn sàng tại Store" : "Giao tận tay"}
              </strong>
            </div>
          </div>

          {/* QR Payment info if bank transfer */}
          {!isStoreVisit && (paymentMethod === BANK_PAYMENT || paymentMethod === MOMO_PAYMENT) && (
            <div className="vietqr-instant-box" style={{ maxWidth: "480px", margin: "0 auto 28px" }}>
              <div className="vietqr-header-timer">
                <strong style={{ fontSize: "14px", color: "#1d1d1f" }}>
                  {paymentMethod === MOMO_PAYMENT ? "Quét mã MoMo" : "Quét mã VietQR Napas 24/7"}
                </strong>
                <span className="vietqr-timer-badge">⏱ {formatTime(countdown)}</span>
              </div>

              <div style={{ textAlign: "center", margin: "16px 0" }}>
                <Image
                  src={generatedQRUrl}
                  alt={`QR thanh toán đơn ${orderCode}`}
                  width={240}
                  height={240}
                  style={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
                  unoptimized
                />
              </div>

              <div className="vietqr-copy-row">
                <span>Số tài khoản</span>
                <strong>6820102010 (Techcombank)</strong>
                <button
                  type="button"
                  className={`vietqr-copy-btn ${copiedSTK ? "copied" : ""}`}
                  onClick={() => copyToClipboard("6820102010", "stk")}
                >
                  {copiedSTK ? "Đã chép ✓" : "Sao chép"}
                </button>
              </div>

              <div className="vietqr-copy-row">
                <span>Số tiền chính xác</span>
                <strong>{formatOrderMoney(submittedTotal)}</strong>
                <button
                  type="button"
                  className={`vietqr-copy-btn ${copiedAmount ? "copied" : ""}`}
                  onClick={() => copyToClipboard(String(submittedTotal), "amount")}
                >
                  {copiedAmount ? "Đã chép ✓" : "Sao chép"}
                </button>
              </div>

              <div className="vietqr-copy-row">
                <span>Nội dung chuyển</span>
                <strong>{orderCode}</strong>
                <button
                  type="button"
                  className={`vietqr-copy-btn ${copiedContent ? "copied" : ""}`}
                  onClick={() => copyToClipboard(orderCode, "content")}
                >
                  {copiedContent ? "Đã chép ✓" : "Sao chép"}
                </button>
              </div>
            </div>
          )}

          {isStoreVisit && (
            <div
              style={{
                padding: "20px",
                borderRadius: "16px",
                background: "#f2f2f7",
                textAlign: "left",
                marginBottom: "28px",
              }}
            >
              <strong style={{ display: "block", fontSize: "16px", color: "#1d1d1f" }}>
                Chi nhánh tiếp nhận: {selectedBranch.name}
              </strong>
              <span style={{ display: "block", color: "#6e6e73", fontSize: "13px", marginTop: "4px" }}>
                {selectedBranch.address} · Hotline: {selectedBranch.phone}
              </span>
              <p style={{ fontSize: "12px", color: "#86868b", margin: "8px 0 0" }}>
                Chuyên viên Infinity Store sẽ liên hệ xác nhận máy trước khi bạn ghé cửa hàng. Chưa phát sinh thanh toán trước.
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link className="apple-hero-btn-primary" href="/" style={{ padding: "12px 28px" }}>
              Tiếp tục mua sắm
            </Link>
            <Link
              className="apple-hero-btn-secondary"
              href="/bao-hanh"
              style={{ padding: "12px 24px", color: "#1d1d1f", borderColor: "#d2d2d7" }}
            >
              Tra cứu bảo hành
            </Link>
          </div>
        </section>
      </div>
    );
  }

  // =========================================================================
  // EMPTY CART (Infinity Store STYLE)
  // =========================================================================
  if (!items.length) {
    return (
      <div className="cps-cart-page">
        <div className="cps-cart-container">
          {/* Topbar: Tiếp tục mua sắm + Freeship */}
          <div className="cps-cart-topbar">
            <Link href="/" className="cps-cart-back">
              <span>‹ Tiếp tục mua sắm</span>
              <span style={{ color: "#cbd5e1" }}>|</span>
              <span style={{ color: "#475569" }}>Giỏ hàng của bạn</span>
            </Link>
            <div className="cps-freeship-pill">
              Miễn phí vận chuyển với đơn hàng từ 0đ
            </div>
          </div>

          {/* Controls Bar */}
          <div className="cps-cart-ctrl-bar">
            <label className="cps-cart-check-all">
              <input type="checkbox" defaultChecked disabled />
              <span>Tất cả</span>
            </label>
            <button type="button" className="cps-cart-ctrl-btn">
              Mặc định
            </button>
          </div>

          {/* Main Empty State Grid */}
          <div className="cps-cart-empty-grid">
            <div className="cps-cart-empty-card">
              <Image
                src="/cart/empty-cart.svg"
                alt="Giỏ hàng trống"
                width={140}
                height={140}
                className="cps-empty-mascot"
                unoptimized
                priority
              />
              <h3>Giỏ hàng của bạn đang trống.</h3>
              <p>Hãy chọn thêm sản phẩm để mua sắm nhé</p>
              <Link href="/" className="cps-empty-cta-link">
                Xem thêm sản phẩm ›
              </Link>
            </div>

            <aside className="cps-qr-promo-card">
              <Image
                src="/cart/qr-app.png"
                alt="QR Infinity Store App"
                width={80}
                height={80}
                className="cps-qr-img"
                unoptimized
              />
              <p className="cps-qr-text">
                Tải ứng dụng Infinity Store để tận hưởng thêm nhiều ưu đãi độc quyền
              </p>
            </aside>
          </div>

          {recommendations.length > 0 && (
            <section className="cps-recommend-section">
              <h2 className="cps-recommend-title">Có thể bạn cũng thích</h2>
              <div className="cps-recommend-grid">
                {recommendations.map((product) => <ProductCard key={product.slug} product={product} />)}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN 3-STEP LUXURY CHECKOUT EXPERIENCE
  // =========================================================================
  return (
    <div className="apple-checkout-container">
      {/* Topbar: Tiếp tục mua sắm + Freeship */}
      <div className="cps-cart-topbar" style={{ marginBottom: "20px" }}>
        <Link href="/" className="cps-cart-back">
          <span>‹ Tiếp tục mua sắm</span>
          <span style={{ color: "#cbd5e1" }}>|</span>
          <span style={{ color: "#475569" }}>Giỏ hàng ({itemCount} sản phẩm)</span>
        </Link>
        <div className="cps-freeship-pill">
          Miễn phí vận chuyển với đơn hàng từ 0đ
        </div>
      </div>

      {/* 3-Step Stepper Navigation */}
      <nav className="apple-checkout-stepper" aria-label="Các bước đặt hàng">
        <div
          className={`apple-step-item ${activeStep >= 1 ? "is-active" : ""}`}
          onClick={() => setActiveStep(1)}
          style={{ cursor: "pointer" }}
        >
          <span className="apple-step-number">{activeStep > 1 ? "✓" : "1"}</span>
          <span>Giỏ Hàng ({itemCount})</span>
        </div>

        <div className="apple-step-divider" />

        <div
          className={`apple-step-item ${activeStep >= 2 ? "is-active" : ""}`}
          onClick={() => setActiveStep(2)}
          style={{ cursor: "pointer" }}
        >
          <span className="apple-step-number">{activeStep > 2 ? "✓" : "2"}</span>
          <span>Nhận Hàng</span>
        </div>

        <div className="apple-step-divider" />

        <div className={`apple-step-item ${activeStep === 3 ? "is-active" : ""}`}>
          <span className="apple-step-number">3</span>
          <span>Thanh Toán &amp; Bảo Mật</span>
        </div>
      </nav>

      <form onSubmit={submit} className="apple-checkout-grid">
        {/* Left Column: Flow steps */}
        <div>
          {/* STEP 1: ITEMS IN CART & APPLECARE+ */}
          <div className="apple-checkout-card">
            <div className="apple-checkout-card-header">
              <h2>
                <span>01.</span> Danh Sách Sản Phẩm Đã Chọn
              </h2>
              <span style={{ fontSize: "13px", color: "#0071e3", fontWeight: 700 }}>
                {itemCount} Thiết bị
              </span>
            </div>

            <div className="apple-cart-items-list">
              {items.map((item) => (
                <article className="apple-cart-line-luxury" key={item.key}>
                  <div className="apple-cart-item-thumb">
                    <Image src={item.image} alt={item.productName} width={76} height={76} unoptimized />
                  </div>

                  <div>
                    <h3 className="apple-cart-item-title">{item.productName}</h3>
                    <div className="apple-cart-item-meta">
                      {[item.ram && `${item.ram} RAM`, item.storage, item.color].filter(Boolean).join(" · ")}
                    </div>
                    <div className="apple-cart-item-qty-ctrl">
                      <button
                        type="button"
                        className="apple-qty-btn"
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        aria-label="Giảm số lượng"
                      >
                        −
                      </button>
                      <span style={{ fontSize: "13px", fontWeight: 700 }}>{item.quantity}</span>
                      <button
                        type="button"
                        className="apple-qty-btn"
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        aria-label="Tăng số lượng"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        style={{
                          background: "none",
                          border: "0",
                          color: "#ff3b30",
                          fontSize: "12px",
                          marginLeft: "14px",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <strong style={{ fontSize: "16px", color: "#1d1d1f", fontWeight: 800 }}>
                      {formatOrderMoney(item.unitPrice * item.quantity)}
                    </strong>
                    <span style={{ display: "block", fontSize: "11px", color: "#86868b", marginTop: "2px" }}>
                      Đơn giá: {formatOrderMoney(item.unitPrice)}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {/* AppleCare+ 1-to-1 Warranty Toggle */}
            <div
              className="applecare-warranty-addon"
              onClick={() => setIncludeAppleCare(!includeAppleCare)}
            >
              <input
                type="checkbox"
                className="applecare-checkbox"
                checked={includeAppleCare}
                onChange={(e) => setIncludeAppleCare(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="applecare-info">
                <strong>
                  <span>🛡️</span> Gói AppleCare+ 1 Đổi 1 Trong 24 Tháng (Khuyên chọn)
                </strong>
                <p>
                  Bảo hành rơi vỡ, vô nước, thay mới linh kiện chính hãng Apple 100%. Đổi máy mới tương đương nếu gặp lỗi nhà sản xuất.
                </p>
              </div>
              <div className="applecare-price">+990.000₫</div>
            </div>
          </div>

          {/* STEP 2: DELIVERY MODE & CONTACT INFO */}
          <div className="apple-checkout-card">
            <div className="apple-checkout-card-header">
              <h2>
                <span>02.</span> Hình Thức Nhận Hàng &amp; Thông Tin
              </h2>
              {customer ? (
                <span style={{ fontSize: "12px", color: "#34c759", fontWeight: 700 }}>
                  ✓ Member: {customer.email}
                </span>
              ) : (
                <Link href="/member" style={{ fontSize: "12px", color: "#0071e3", fontWeight: 600 }}>
                  Đăng nhập nhận ưu đãi VIP
                </Link>
              )}
            </div>

            {/* Delivery Switcher: Online Ship vs Store Pickup */}
            <div className="apple-delivery-toggle">
              <div
                className={`apple-delivery-card-radio ${purchaseMode === "online" ? "is-selected" : ""}`}
                onClick={() => chooseMode("online")}
              >
                <input
                  type="radio"
                  name="purchase_mode"
                  checked={purchaseMode === "online"}
                  onChange={() => chooseMode("online")}
                  style={{ accentColor: "#0071e3" }}
                />
                <div>
                  <strong>Đặt hàng online · Giao tận nơi</strong>
                  <small>Giao nhanh trong 2h nội thành, đồng kiểm khi nhận máy, miễn phí vận chuyển toàn quốc.</small>
                </div>
              </div>

              <div
                className={`apple-delivery-card-radio ${purchaseMode === "store" ? "is-selected" : ""}`}
                onClick={() => chooseMode("store")}
              >
                <input
                  type="radio"
                  name="purchase_mode"
                  checked={purchaseMode === "store"}
                  onChange={() => chooseMode("store")}
                  style={{ accentColor: "#0071e3" }}
                />
                <div>
                  <strong>Đến cửa hàng Infinity xem máy</strong>
                  <small>Chọn chi nhánh gần nhất, chuyên viên tư vấn hỗ trợ sao lưu dữ liệu và kiểm tra máy miễn phí.</small>
                </div>
              </div>
            </div>

            {/* Recipient Form */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <label style={{ display: "grid", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#1d1d1f" }}>
                Họ và tên người nhận *
                <input
                  name="name"
                  required
                  defaultValue={customer?.name}
                  placeholder="Nguyễn Văn A"
                  style={{
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1.5px solid #d2d2d7",
                    fontSize: "14px",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#1d1d1f" }}>
                Số điện thoại liên hệ *
                <input
                  name="phone"
                  required
                  type="tel"
                  defaultValue={customer?.phone}
                  pattern="[0-9 +]{9,15}"
                  placeholder="0901234567"
                  style={{
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1.5px solid #d2d2d7",
                    fontSize: "14px",
                  }}
                />
              </label>
            </div>

            <label style={{ display: "grid", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#1d1d1f", marginBottom: "16px" }}>
              Email nhận hóa đơn điện tử
              <input
                name="email"
                type="email"
                defaultValue={customer?.email}
                placeholder="email@domain.com"
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1.5px solid #d2d2d7",
                  fontSize: "14px",
                }}
              />
            </label>

            {isStoreVisit ? (
              <label style={{ display: "grid", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#1d1d1f", marginBottom: "16px" }}>
                Chọn chi nhánh Apple Store để xem máy *
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  required
                  style={{
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1.5px solid #0071e3",
                    fontSize: "14px",
                    background: "#f0f7ff",
                    fontWeight: 600,
                  }}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} — {b.address}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label style={{ display: "grid", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#1d1d1f", marginBottom: "16px" }}>
                Địa chỉ giao hàng chi tiết *
                <textarea
                  name="address"
                  rows={2}
                  required
                  placeholder="Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành..."
                  style={{
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1.5px solid #d2d2d7",
                    fontSize: "14px",
                  }}
                />
              </label>
            )}

            {/* VAT Invoice Toggle */}
            <div style={{ marginTop: "16px", padding: "14px", borderRadius: "12px", background: "#fbfbfd", border: "1px solid #e5e5ea" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={includeVAT}
                  onChange={(e) => setIncludeVAT(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "#0071e3" }}
                />
                <span>Yêu cầu xuất hóa đơn điện tử VAT (Doanh nghiệp / Cá nhân)</span>
              </label>

              {includeVAT && (
                <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
                  <input
                    placeholder="Tên công ty / Đơn vị"
                    value={vatCompany}
                    onChange={(e) => setVatCompany(e.target.value)}
                    style={{ padding: "10px", borderRadius: "8px", border: "1px solid #d2d2d7", fontSize: "13px" }}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <input
                      placeholder="Mã số thuế (MST)"
                      value={vatTaxId}
                      onChange={(e) => setVatTaxId(e.target.value)}
                      style={{ padding: "10px", borderRadius: "8px", border: "1px solid #d2d2d7", fontSize: "13px" }}
                    />
                    <input
                      placeholder="Địa chỉ ghi trên hóa đơn"
                      value={vatAddress}
                      onChange={(e) => setVatAddress(e.target.value)}
                      style={{ padding: "10px", borderRadius: "8px", border: "1px solid #d2d2d7", fontSize: "13px" }}
                    />
                  </div>
                </div>
              )}
            </div>

            <label style={{ display: "grid", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#1d1d1f", marginTop: "16px" }}>
              Ghi chú thêm cho đơn hàng
              <textarea
                name="note"
                rows={2}
                placeholder={isStoreVisit ? "Thời gian dự kiến ghé, cấu hình màu muốn xem..." : "Giao giờ hành chính, gọi trước khi đến..."}
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1.5px solid #d2d2d7",
                  fontSize: "14px",
                }}
              />
            </label>
          </div>

          {/* STEP 3: PAYMENT METHOD */}
          {!isStoreVisit && (
            <div className="apple-checkout-card">
              <div className="apple-checkout-card-header">
                <h2>
                  <span>03.</span> Phương Thức Thanh Toán An Toàn
                </h2>
                <span style={{ fontSize: "12px", color: "#34c759", fontWeight: 700 }}>
                  🔒 Bảo Mật 256-bit SSL
                </span>
              </div>

              <div className="apple-payment-grid">
                {/* Method 1: VietQR Napas 24/7 */}
                <label
                  className={`apple-payment-option ${paymentMethod === BANK_PAYMENT ? "is-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === BANK_PAYMENT}
                    onChange={() => setPaymentMethod(BANK_PAYMENT)}
                  />
                  <div className="apple-payment-icon-box">🏦</div>
                  <div className="apple-payment-details">
                    <strong>Chuyển khoản VietQR Napas 24/7 (Khuyên chọn)</strong>
                    <small>Tự động điền số tiền và nội dung, quét bằng mọi app ngân hàng Vietcombank, Techcombank, MB, BIDV...</small>
                  </div>
                </label>

                {/* Method 2: Apple Pay */}
                <label
                  className={`apple-payment-option ${paymentMethod === APPLE_PAYMENT ? "is-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === APPLE_PAYMENT}
                    onChange={() => setPaymentMethod(APPLE_PAYMENT)}
                  />
                  <div className="apple-payment-icon-box" style={{ background: "#000", color: "#fff" }}>
                    
                  </div>
                  <div className="apple-payment-details">
                    <strong>Apple Pay</strong>
                    <small>Thanh toán nhanh chóng, xác thực sinh trắc học Face ID / Touch ID bảo mật cao nhất.</small>
                  </div>
                </label>

                {/* Method 3: MoMo */}
                <label
                  className={`apple-payment-option ${paymentMethod === MOMO_PAYMENT ? "is-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === MOMO_PAYMENT}
                    onChange={() => setPaymentMethod(MOMO_PAYMENT)}
                  />
                  <div className="apple-payment-icon-box" style={{ background: "#a50064", color: "#fff" }}>
                    M
                  </div>
                  <div className="apple-payment-details">
                    <strong>Ví Điện Tử MoMo</strong>
                    <small>Quét mã QR MoMo thanh toán tức thì trên điện thoại.</small>
                  </div>
                </label>

                {/* Method 4: Installment */}
                <label
                  className={`apple-payment-option ${paymentMethod === INSTALLMENT_PAYMENT ? "is-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === INSTALLMENT_PAYMENT}
                    onChange={() => setPaymentMethod(INSTALLMENT_PAYMENT)}
                  />
                  <div className="apple-payment-icon-box">💳</div>
                  <div className="apple-payment-details">
                    <strong>Trả Góp 0% Lãi Suất Qua Công Ty Tài Chính</strong>
                    <small>Hỗ trợ qua FE Credit, HD Saison, Kredivo, Shinhan Finance. Chỉ cần CCCD gắn chip.</small>
                  </div>
                </label>
              </div>

              {/* VietQR Preview Box */}
              {paymentMethod === BANK_PAYMENT && (
                <div className="vietqr-instant-box">
                  <div className="vietqr-header-timer">
                    <strong style={{ fontSize: "14px", color: "#1d1d1f" }}>
                      Thông Tin Chuyển Khoản Techcombank
                    </strong>
                    <span className="vietqr-timer-badge">⏱ Thời gian giữ hàng: 10:00</span>
                  </div>

                  <div className="vietqr-copy-row">
                    <span>Số tài khoản</span>
                    <strong>6820102010 (Techcombank)</strong>
                    <button
                      type="button"
                      className={`vietqr-copy-btn ${copiedSTK ? "copied" : ""}`}
                      onClick={() => copyToClipboard("6820102010", "stk")}
                    >
                      {copiedSTK ? "Đã chép ✓" : "Sao chép"}
                    </button>
                  </div>

                  <div className="vietqr-copy-row">
                    <span>Chủ tài khoản</span>
                    <strong>CÔNG TY TNHH CÔNG NGHỆ INFINITY STORE</strong>
                  </div>

                  <div className="vietqr-copy-row">
                    <span>Số tiền cần thanh toán</span>
                    <strong>{formatOrderMoney(total)}</strong>
                    <button
                      type="button"
                      className={`vietqr-copy-btn ${copiedAmount ? "copied" : ""}`}
                      onClick={() => copyToClipboard(String(total), "amount")}
                    >
                      {copiedAmount ? "Đã chép ✓" : "Sao chép"}
                    </button>
                  </div>

                  <small style={{ color: "#64748b", display: "block", marginTop: "10px" }}>
                    * Mã QR động chính thức sẽ hiển thị ngay khi bấm Đặt Hàng Online.
                  </small>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Sticky Meticulous Order Summary */}
        <aside className="apple-order-summary-box">
          <h2 className="apple-order-summary-title">Tóm Tắt Đơn Hàng</h2>

          {/* Voucher Box */}
          {!isStoreVisit && (
            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="checkout-voucher" style={{ display: "block", marginBottom: "7px", color: "#334155", fontSize: "12px", fontWeight: 750 }}>
                Mã voucher
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  id="checkout-voucher"
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                  placeholder="Nhập mã ưu đãi..."
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #d2d2d7",
                    fontSize: "13px",
                    textTransform: "uppercase",
                  }}
                />
                <button
                  type="button"
                  onClick={applyVoucher}
                  disabled={!voucherInput.trim()}
                  style={{
                    padding: "0 16px",
                    borderRadius: "10px",
                    border: 0,
                    background: "#1d1d1f",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Áp dụng
                </button>
              </div>
              {voucherMessage && (
                <p
                  style={{
                    fontSize: "12px",
                    marginTop: "6px",
                    color: activeVoucher ? "#34c759" : "#ff3b30",
                    fontWeight: 600,
                  }}
                >
                  {voucherMessage}
                </p>
              )}
            </div>
          )}

          {/* Pricing Lines */}
          <div className="apple-summary-line">
            <span>Tạm tính ({itemCount} sản phẩm)</span>
            <strong>{formatOrderMoney(subtotal)}</strong>
          </div>

          {includeAppleCare && (
            <div className="apple-summary-line">
              <span>Bảo hành AppleCare+ 24T</span>
              <strong>+{formatOrderMoney(appleCarePrice)}</strong>
            </div>
          )}

          {activeVoucher && (
            <div className="apple-summary-line apple-summary-discount">
              <span>Mã giảm giá ({activeVoucher.code})</span>
              <strong>-{formatOrderMoney(activeVoucher.discount)}</strong>
            </div>
          )}

          <div className="apple-summary-line">
            <span>Phí vận chuyển</span>
            <strong style={{ color: "#34c759" }}>MIỄN PHÍ</strong>
          </div>

          <div className="apple-summary-line">
            <span>Ưu đãi hội viên VIP</span>
            <strong style={{ color: "#34c759" }}>Tặng dán màn hình &amp; ốp</strong>
          </div>

          <div className="apple-summary-line total-line">
            <span>{isStoreVisit ? "Tổng dự kiến" : "Tổng thanh toán"}</span>
            <strong>{formatOrderMoney(total)}</strong>
          </div>

          {message && (
            <p
              style={{
                color: "#ff3b30",
                fontSize: "13px",
                margin: "12px 0 0",
                padding: "8px 12px",
                background: "#fef2f2",
                borderRadius: "8px",
                border: "1px solid #fca5a5",
              }}
            >
              {message}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="apple-checkout-submit-btn"
            disabled={status === "sending"}
          >
            {status === "sending"
              ? "Đang thiết lập đơn hàng..."
              : isStoreVisit
              ? "Xác Nhận Lịch Xem Máy Tại Store"
              : "Hoàn Tất Đặt Hàng & Thanh Toán"}
          </button>

          {/* Apple Pay Direct Biometric trigger button */}
          {!isStoreVisit && (
            <button
              type="button"
              className="apple-pay-direct-btn"
              onClick={handleApplePayClick}
            >
              <span>Thanh toán với</span>
              <span style={{ fontWeight: 800 }}>Pay</span>
            </button>
          )}

          {/* Apple Commitments */}
          <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #f2f2f7", fontSize: "12px", color: "#86868b", display: "grid", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>✓</span> Sản phẩm chính hãng 100% nguyên seal Apple VN/A
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>✓</span> Đổi trả miễn phí 30 ngày nếu có lỗi nhà sản xuất
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>✓</span> Xuất hóa đơn VAT điện tử đầy đủ theo quy định
            </div>
          </div>
        </aside>
      </form>

      {/* Apple Pay Simulated Modal */}
      {showApplePaySheet && (
        <div className="apple-pay-sheet-modal">
          <div className="apple-pay-sheet-card">
            <div className="apple-pay-faceid-icon">
              {applePayAuthenticated ? "✓" : "👤"}
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>
              {applePayAuthenticated ? "Đã Xác Thực Face ID" : "Nhấp đúp để thanh toán"}
            </h3>
            <p style={{ fontSize: "14px", color: "#86868b", margin: "0 0 20px" }}>
              {applePayAuthenticated
                ? "Thẻ Visa Platinum đã sẵn sàng."
                : "Giữ điện thoại trước mặt hoặc nhấn nút sườn."}
            </p>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#2997ff" }}>
              {formatOrderMoney(total)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
