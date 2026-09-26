"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { formatOrderMoney } from "../order-pricing";
import {
  calculateCreditCardPlan,
  calculateInstallmentPlan,
  CREDIT_CARD_BANKS,
  DOWN_PAYMENT_OPTIONS,
  FINANCE_COMPANIES,
  generateAmortizationSchedule,
  INSTALLMENT_TERMS,
  MIN_INSTALLMENT_TOTAL,
} from "../installment";
import type { SimulatorProductItem } from "./page";

interface BranchOption {
  id: string;
  name: string;
  address: string;
  phone: string;
}

interface InstallmentSimulatorProps {
  products: SimulatorProductItem[];
  branches: BranchOption[];
  initialSlug?: string;
  initialAmount?: number;
  initialCategory?: string;
}

export type EnrichedSimulatorProductItem = SimulatorProductItem & {
  normalizedBrand: string;
};

function normalizeBrand(raw?: string): string {
  if (!raw) return "Khác";
  const lower = raw.toLowerCase().trim();
  if (lower.includes("apple")) return "Apple";
  if (lower.includes("asus")) return "ASUS";
  if (lower.includes("sony")) return "Sony";
  if (lower.includes("fujifilm")) return "Fujifilm";
  if (lower.includes("canon")) return "Canon";
  if (lower.includes("dji")) return "DJI";
  if (lower.includes("oppo")) return "OPPO";
  if (lower.includes("xiaomi") || lower.includes("redmi")) return "Xiaomi";
  if (lower.includes("dell")) return "Dell";
  if (lower.includes("lenovo") || lower.includes("thinkpad")) return "Lenovo";
  if (lower.includes("hp")) return "HP";
  if (lower.includes("acer")) return "Acer";
  if (lower.includes("msi")) return "MSI";
  return raw.trim();
}

const BRAND_ICONS: Record<string, string> = {
  Apple: "",
  ASUS: "⚡",
  Sony: "📷",
  Fujifilm: "🎞️",
  OPPO: "🤖",
  Xiaomi: "📱",
  Dell: "💻",
  Canon: "🔴",
  DJI: "🛸",
  Lenovo: "💻",
  HP: "💻",
  Acer: "💻",
  MSI: "🎮",
  Khác: "✦",
};

const CATEGORY_TABS = [
  { id: "all", label: "Tất cả danh mục", icon: "✦" },
  { id: "iphone", label: "iPhone", icon: "📱" },
  { id: "macbook", label: "MacBook", icon: "💻" },
  { id: "ipad", label: "iPad", icon: "📟" },
  { id: "laptop", label: "Laptop & Gaming", icon: "🎮" },
  { id: "may-anh", label: "Máy ảnh & Flycam", icon: "📷" },
  { id: "android", label: "Android", icon: "🤖" },
  { id: "phu-kien", label: "Phụ kiện", icon: "🎧" },
];

const FAQS = [
  {
    q: "Mua trả góp tại Infinity Store cần những giấy tờ gì?",
    a: "Với hình thức qua Công ty Tài chính, bạn chỉ cần CCCD gắn chip chính chủ (từ 18 đến 60 tuổi). Không cần chứng minh thu nhập hay công chứng sổ hộ khẩu. Với hình thức Thẻ Tín Dụng 0%, bạn chỉ cần thẻ tín dụng Visa/Mastercard/JCB còn đủ hạn mức thanh toán.",
  },
  {
    q: "Trả góp qua thẻ tín dụng 0% có phát sinh chi phí gì không?",
    a: "Chương trình trả góp 0% lãi suất hoàn toàn không tính lãi hàng tháng. Tùy từng ngân hàng phát hành thẻ, có thể có một khoản phí chuyển đổi giao dịch trả góp nhỏ (từ 1.5% - 3.5% tính trên toàn kỳ hạn) được hiển thị minh bạch tại bảng tính của Infinity Store.",
  },
  {
    q: "Tôi có thể trả trước 0 đồng (không cần trả trước) được không?",
    a: "Hoàn toàn ĐƯỢC! Khi thanh toán qua Thẻ tín dụng 0% hoặc qua đối tác Kredivo, bạn có thể chọn tỷ lệ trả trước 0% (0đ), nhận máy ngay hôm nay và bắt đầu trả dần từ kỳ sao kê tháng tiếp theo.",
  },
  {
    q: "Sinh viên hoặc người mới đi làm chưa có bảng lương có mua được không?",
    a: "Được bạn nhé! Các công ty tài chính đối tác như FE Credit, Home Credit, HD Saison và Kredivo tại Infinity Store đều hỗ trợ gói xét duyệt online tự động, tỷ lệ duyệt lên đến 98% chỉ cần CCCD gắn chip và số điện thoại chính chủ.",
  },
  {
    q: "Máy mua trả góp có được bảo hành và đổi trả như máy mua thẳng không?",
    a: "100% chế độ bảo hành là như nhau! Mọi sản phẩm mua trả góp tại Infinity Store vẫn được hưởng đầy đủ chính sách: Bảo hành 12 - 24 tháng chính hãng, 1 đổi 1 trong 30 ngày nếu có lỗi phần cứng, và bảo trì phần mềm trọn đời.",
  },
];

export default function InstallmentSimulator({
  products,
  branches,
  initialSlug,
  initialAmount,
  initialCategory,
}: InstallmentSimulatorProps) {
  // Normalize brand on all products
  const enrichedProducts = useMemo(() => {
    return products.map((p) => ({
      ...p,
      normalizedBrand: normalizeBrand(p.brand),
    }));
  }, [products]);

  // Extract unique brands with counts
  const availableBrands = useMemo(() => {
    const map = new Map<string, number>();
    enrichedProducts.forEach((p) => {
      const b = p.normalizedBrand;
      map.set(b, (map.get(b) || 0) + 1);
    });

    const priorityOrder = ["Apple", "ASUS", "Sony", "Fujifilm", "OPPO", "Dell", "Canon", "DJI", "Lenovo", "HP", "MSI"];
    const list = Array.from(map.entries()).sort((a, b) => {
      const aIdx = priorityOrder.indexOf(a[0]);
      const bIdx = priorityOrder.indexOf(b[0]);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return b[1] - a[1];
    });

    return [
      { id: "all", name: "Tất cả hãng", count: enrichedProducts.length, icon: "✦" },
      ...list.map(([brand, count]) => ({
        id: brand,
        name: brand,
        count,
        icon: BRAND_ICONS[brand] || "✦",
      })),
    ];
  }, [enrichedProducts]);

  // 1. Product & Search State
  const defaultProduct = useMemo(() => {
    if (initialSlug) {
      const found = enrichedProducts.find((p) => p.slug === initialSlug);
      if (found) return found;
    }
    const flagship =
      enrichedProducts.find((p) => p.slug === "iphone-16-pro-max") ||
      enrichedProducts.find((p) => p.slug === "iphone-16-pro") ||
      enrichedProducts.find((p) => p.normalizedBrand === "Apple" && p.price >= 20_000_000) ||
      enrichedProducts.find((p) => p.price >= 20_000_000) ||
      enrichedProducts[0] ||
      null;
    return flagship;
  }, [enrichedProducts, initialSlug]);

  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || "all");
  const [selectedProduct, setSelectedProduct] = useState<EnrichedSimulatorProductItem | null>(defaultProduct);
  const [customAmountMode, setCustomAmountMode] = useState<boolean>(!defaultProduct && !!initialAmount);
  const [amount, setAmount] = useState<number>(initialAmount || defaultProduct?.price || 24_990_000);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 2. Financing Parameters
  const [mode, setMode] = useState<"finance_company" | "credit_card">("finance_company");
  const [companyId, setCompanyId] = useState<string>(FINANCE_COMPANIES[0].id);
  const [bankId, setBankId] = useState<string>(CREDIT_CARD_BANKS[0].id);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [term, setTerm] = useState<number>(12);

  // 3. UI State
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [consultSubmitted, setConsultSubmitted] = useState<boolean>(false);
  const [consultTicket, setConsultTicket] = useState<string>("");
  const [consultName, setConsultName] = useState<string>("");
  const [consultPhone, setConsultPhone] = useState<string>("");
  const [consultBranch, setConsultBranch] = useState<string>(branches[0]?.name || "Chi nhánh Quận 1");
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);

  // Active Financial Partner
  const activeCompany = useMemo(
    () => FINANCE_COMPANIES.find((c) => c.id === companyId) || FINANCE_COMPANIES[0],
    [companyId],
  );
  const activeBank = useMemo(
    () => CREDIT_CARD_BANKS.find((b) => b.id === bankId) || CREDIT_CARD_BANKS[0],
    [bankId],
  );

  // Filtered Products by Brand, Category, and Search
  const filteredProducts = useMemo(() => {
    return enrichedProducts.filter((p) => {
      // Brand match
      if (selectedBrand !== "all" && p.normalizedBrand !== selectedBrand) {
        return false;
      }

      // Category match
      if (selectedCategory !== "all") {
        if (selectedCategory === "macbook") {
          const isMac =
            p.category === "macbook" ||
            p.category === "macbook-air" ||
            p.category === "macbook-pro" ||
            p.category === "imac" ||
            p.category === "mac-mini-studio";
          if (!isMac) return false;
        } else if (selectedCategory === "laptop") {
          if (p.category !== "laptop" && p.category !== "laptop-cu") return false;
        } else if (p.category !== selectedCategory) {
          return false;
        }
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.normalizedBrand.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [enrichedProducts, selectedBrand, selectedCategory, searchQuery]);

  // Brand-filtered products specifically for the Model dropdown
  const modelDropdownProducts = useMemo(() => {
    if (selectedBrand === "all") return enrichedProducts;
    return enrichedProducts.filter((p) => p.normalizedBrand === selectedBrand);
  }, [enrichedProducts, selectedBrand]);

  // Current Calculation Plan
  const currentPlan = useMemo(() => {
    if (mode === "finance_company") {
      return calculateInstallmentPlan(amount, downPaymentPercent, term, activeCompany.monthlyRate);
    } else {
      const feeRate = activeBank.conversionFeeRate[term] ?? 2.5;
      return calculateCreditCardPlan(amount, downPaymentPercent, term, feeRate);
    }
  }, [mode, amount, downPaymentPercent, term, activeCompany.monthlyRate, activeBank]);

  // Term Comparison Cards
  const termOptions = useMemo(() => {
    const supported = mode === "finance_company" ? INSTALLMENT_TERMS : activeBank.supportedTerms;
    return supported.map((t) => {
      if (mode === "finance_company") {
        const plan = calculateInstallmentPlan(amount, downPaymentPercent, t, activeCompany.monthlyRate);
        return { term: t, monthly: plan.monthlyPayment, interest: plan.interestAmount };
      } else {
        const fee = activeBank.conversionFeeRate[t] ?? 2.5;
        const plan = calculateCreditCardPlan(amount, downPaymentPercent, t, fee);
        return { term: t, monthly: plan.monthlyPayment, interest: plan.interestAmount };
      }
    });
  }, [mode, amount, downPaymentPercent, activeCompany.monthlyRate, activeBank]);

  // Amortization Schedule
  const amortizationSchedule = useMemo(() => {
    return generateAmortizationSchedule(
      currentPlan.financedAmount,
      currentPlan.term,
      currentPlan.monthlyPayment,
      currentPlan.interestAmount,
    );
  }, [currentPlan]);

  // Handler: Select a specific product
  function handleSelectProduct(item: EnrichedSimulatorProductItem) {
    setSelectedProduct(item);
    setCustomAmountMode(false);
    setAmount(item.price);
  }

  // Handler: Brand changed from dropdown
  function handleBrandDropdownChange(newBrand: string) {
    setSelectedBrand(newBrand);
    // If current selected product does not belong to new brand, auto-pick first product of that brand
    if (newBrand !== "all") {
      const firstOfBrand = enrichedProducts.find((p) => p.normalizedBrand === newBrand);
      if (firstOfBrand) {
        handleSelectProduct(firstOfBrand);
      }
    }
  }

  // Handler: Model changed from dropdown
  function handleModelDropdownChange(slug: string) {
    if (slug === "custom") {
      setCustomAmountMode(true);
      setSelectedProduct(null);
      return;
    }
    const found = enrichedProducts.find((p) => p.slug === slug);
    if (found) {
      handleSelectProduct(found);
      // Auto-sync brand if needed
      if (selectedBrand !== "all" && found.normalizedBrand !== selectedBrand) {
        setSelectedBrand(found.normalizedBrand);
      }
    }
  }

  // Handler: Consultation submit
  function handleConsultSubmit(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!consultName.trim() || !consultPhone.trim()) return;
    const ticketId = `TG-${Date.now().toString().slice(-6)}`;
    setConsultTicket(ticketId);
    setConsultSubmitted(true);
  }

  return (
    <div className="installment-simulator-root">
      {/* 1. HERO SECTION */}
      <section className="installment-hero">
        <div className="installment-hero-glow" aria-hidden="true" />
        <div className="installment-hero-container">
          <div className="installment-badge-strip">
            <span> INFINITY STORE FINANCIAL · CHÍNH HÃNG</span>
            <span>•</span>
            <span style={{ color: "#30d158" }}>LÃI SUẤT TỪ 0%</span>
          </div>

          <h1 className="installment-hero-title">
            Mô Phỏng Trả Góp &amp; Dự Toán Khoản Vay
          </h1>

          <p className="installment-hero-subtitle">
            Tra cứu theo từng Hãng và Dòng máy chính xác. Chủ động ngân sách sở hữu thiết bị Apple, Laptop và Máy ảnh mơ ước.
            Tính toán minh bạch theo thời gian thực · Trả trước từ 0đ · Duyệt hồ sơ nhanh 15 phút.
          </p>

          {/* 4 Trust Commitments */}
          <div className="installment-trust-strip">
            <div className="installment-trust-card">
              <span className="installment-trust-icon">⚡</span>
              <div className="installment-trust-text">
                <strong>Duyệt online 15 phút</strong>
                <span>Chỉ cần CCCD gắn chip hoặc Thẻ</span>
              </div>
            </div>

            <div className="installment-trust-card">
              <span className="installment-trust-icon">💳</span>
              <div className="installment-trust-text">
                <strong>Hỗ trợ 25+ ngân hàng</strong>
                <span>Trả góp 0% qua thẻ tín dụng</span>
              </div>
            </div>

            <div className="installment-trust-card">
              <span className="installment-trust-icon">🛡️</span>
              <div className="installment-trust-text">
                <strong>Bảo mật &amp; Không giữ giấy tờ</strong>
                <span>Không gọi người thân, duyệt kín đáo</span>
              </div>
            </div>

            <div className="installment-trust-card">
              <span className="installment-trust-icon">🏬</span>
              <div className="installment-trust-text">
                <strong>Nhận máy kiểm tra ưng ý</strong>
                <span>Giao tận nhà hoặc tại chi nhánh</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAIN WORKSPACE */}
      <div className="installment-workspace">
        {/* LEFT COLUMN: PRODUCT SELECTION & CONTROLS */}
        <div className="installment-left-column">
          {/* STEP 1: CASCADING BRAND - MODEL SELECTOR */}
          <section className="installment-panel" aria-labelledby="step1-title">
            <div className="installment-panel-head">
              <div>
                <h2 id="step1-title">
                  <span className="installment-step-num">1</span>
                  Chọn thiết bị: Hãng &amp; Tên máy
                </h2>
                <div className="installment-panel-subtitle">
                  Tra cứu phân loại theo Hãng sản xuất và Dòng máy để tính khoản trả chậm chuẩn xác
                </div>
              </div>

              <button
                type="button"
                className={`installment-cat-btn ${customAmountMode ? "active" : ""}`}
                onClick={() => {
                  setCustomAmountMode(true);
                  setSelectedProduct(null);
                }}
              >
                ✎ Tự nhập số tiền khác
              </button>
            </div>

            {/* TWO-TIER CASCADING SELECTOR: BƯỚC 1 CHỌN HÃNG -> BƯỚC 2 CHỌN TÊN MÁY */}
            {!customAmountMode && (
              <div className="installment-quick-picker-row">
                {/* 1. Brand Select */}
                <div className="installment-select-group">
                  <label htmlFor="brand-select">
                    <span>🏢</span> Bước 1: Chọn Hãng
                  </label>
                  <select
                    id="brand-select"
                    value={selectedBrand}
                    onChange={(e) => handleBrandDropdownChange(e.target.value)}
                    className="installment-select-dropdown"
                  >
                    {availableBrands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.icon} {b.name} ({b.count} máy)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Model Select */}
                <div className="installment-select-group">
                  <label htmlFor="model-select">
                    <span>📱</span> Bước 2: Chọn Tên máy
                  </label>
                  <select
                    id="model-select"
                    value={selectedProduct?.slug || ""}
                    onChange={(e) => handleModelDropdownChange(e.target.value)}
                    className="installment-select-dropdown"
                  >
                    <option value="" disabled>
                      -- Chọn dòng máy cụ thể --
                    </option>
                    {modelDropdownProducts.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name} - {formatOrderMoney(p.price)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* BRAND PILLS TABS */}
            <div className="installment-category-tabs" role="tablist" aria-label="Lọc theo hãng">
              {availableBrands.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedBrand === b.id}
                  className={`installment-cat-btn ${selectedBrand === b.id ? "active" : ""}`}
                  onClick={() => {
                    handleBrandDropdownChange(b.id);
                    setCustomAmountMode(false);
                  }}
                >
                  <span>{b.icon}</span>
                  <span>{b.name}</span>
                  <span style={{ fontSize: "11px", opacity: 0.65 }}>({b.count})</span>
                </button>
              ))}
            </div>

            {/* CATEGORY SUB-TABS (Only when brand is All or Apple) */}
            {(selectedBrand === "all" || selectedBrand === "Apple") && !customAmountMode && (
              <div
                className="installment-category-tabs"
                style={{ marginBottom: "16px", borderBottom: "1px solid var(--lux-border)", paddingBottom: "12px" }}
              >
                {CATEGORY_TABS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`installment-cat-btn ${selectedCategory === cat.id ? "active" : ""}`}
                    style={{ fontSize: "12px", padding: "6px 14px" }}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* LIVE SEARCH INPUT */}
            <div className="installment-search-box">
              <span className="installment-search-icon" aria-hidden="true">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nhanh theo Hãng hoặc Tên máy (ví dụ: iPhone 16 Pro Max, MacBook M4, Sony A7, ROG...)"
                className="installment-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="installment-search-clear"
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>

            {/* PRODUCT PICKER GRID */}
            {!customAmountMode && (
              <>
                <div className="installment-product-grid">
                  {filteredProducts.map((p) => {
                    const isSelected = selectedProduct?.slug === p.slug;
                    const monthlyPreview = Math.round((p.price * 0.8) / 12);
                    const brandIcon = BRAND_ICONS[p.normalizedBrand] || "✦";

                    return (
                      <div
                        key={p.slug}
                        className={`installment-product-item ${isSelected ? "is-selected" : ""}`}
                        onClick={() => handleSelectProduct(p)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && handleSelectProduct(p)}
                      >
                        <div className="installment-item-thumb">
                          <Image
                            src={p.image}
                            alt={p.name}
                            fill
                            sizes="(max-width: 640px) 160px, 220px"
                            className="installment-item-img"
                            unoptimized={p.image.startsWith("http")}
                          />
                          {p.badge && <span className="installment-item-badge">{p.badge}</span>}
                        </div>

                        <div className="installment-item-info">
                          <span className="installment-item-cat">
                            {brandIcon} {p.normalizedBrand}
                          </span>
                          <strong className="installment-item-name" title={p.name}>
                            {p.name}
                          </strong>
                          <div className="installment-item-price">{formatOrderMoney(p.price)}</div>
                          <div className="installment-item-monthly-estimate">
                            Góp từ {formatOrderMoney(monthlyPreview)}/th
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredProducts.length === 0 && (
                  <div style={{ textAlign: "center", padding: "30px 20px", color: "var(--lux-text-secondary)" }}>
                    Không tìm thấy sản phẩm nào phù hợp với bộ lọc &ldquo;{selectedBrand !== "all" ? selectedBrand : ""}{" "}
                    {searchQuery}&rdquo;.
                    <br />
                    <button
                      type="button"
                      className="installment-cat-btn"
                      style={{ marginTop: "12px" }}
                      onClick={() => {
                        setSelectedBrand("all");
                        setSelectedCategory("all");
                        setSearchQuery("");
                      }}
                    >
                      Xem tất cả hãng &amp; dòng máy
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ACTIVE SELECTED PRODUCT SHOWCASE */}
            {selectedProduct && !customAmountMode && (
              <div className="installment-selected-hero-box">
                <div className="installment-selected-thumb">
                  <Image
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    fill
                    sizes="80px"
                    style={{ objectFit: "contain" }}
                    unoptimized={selectedProduct.image.startsWith("http")}
                  />
                </div>

                <div className="installment-selected-meta">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span
                      style={{
                        background: "rgba(41, 151, 255, 0.2)",
                        color: "var(--lux-blue)",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                      }}
                    >
                      {BRAND_ICONS[selectedProduct.normalizedBrand] || "✦"} {selectedProduct.normalizedBrand}
                    </span>
                    <span style={{ fontSize: "11.5px", color: "var(--lux-text-muted)" }}>
                      {selectedProduct.category.toUpperCase()}
                    </span>
                  </div>

                  <h3>{selectedProduct.name}</h3>
                  <p>{selectedProduct.tagline || `${selectedProduct.normalizedBrand} chính hãng nguyên seal`}</p>

                  <div className="installment-selected-price">
                    Giá niêm yết: {formatOrderMoney(selectedProduct.price)}
                  </div>
                </div>

                <Link
                  href={`/san-pham/${selectedProduct.slug}`}
                  target="_blank"
                  className="installment-btn-secondary"
                  style={{ width: "auto", padding: "0 16px", height: "38px" }}
                >
                  Xem máy ↗
                </Link>
              </div>
            )}

            {/* CUSTOM AMOUNT MODE */}
            {customAmountMode && (
              <div className="installment-custom-amount-card">
                <div>
                  <strong style={{ display: "block", fontSize: "14px", color: "#fff", marginBottom: "4px" }}>
                    Nhập giá trị sản phẩm bạn muốn vay:
                  </strong>
                  <span style={{ fontSize: "12px", color: "var(--lux-text-secondary)" }}>
                    Hỗ trợ tính toán từ {formatOrderMoney(MIN_INSTALLMENT_TOTAL)} đến 200.000.000₫
                  </span>
                </div>

                <div className="installment-custom-money-input-wrap">
                  <input
                    type="number"
                    min={MIN_INSTALLMENT_TOTAL}
                    max={200000000}
                    step={500000}
                    value={amount}
                    onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                    className="installment-custom-money-input"
                  />
                  <strong>VNĐ</strong>
                </div>
              </div>
            )}
          </section>

          {/* STEP 2: FINANCING METHOD & PARAMETERS */}
          <section className="installment-panel" aria-labelledby="step2-title">
            <div className="installment-panel-head">
              <div>
                <h2 id="step2-title">
                  <span className="installment-step-num">2</span>
                  Hình thức trả góp &amp; Đối tác tài chính
                </h2>
                <div className="installment-panel-subtitle">
                  Chọn gói tài chính phù hợp với điều kiện của bạn
                </div>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="installment-mode-tabs">
              <div
                className={`installment-mode-btn ${mode === "finance_company" ? "active" : ""}`}
                onClick={() => setMode("finance_company")}
                role="button"
                tabIndex={0}
              >
                <div className="installment-mode-top">
                  <span className="installment-mode-title">Qua Công Ty Tài Chính</span>
                  <span className="installment-mode-badge">CCCD 15 phút</span>
                </div>
                <p className="installment-mode-desc">
                  Chỉ cần CCCD gắn chip (18+ tuổi). Không cần thẻ tín dụng, không giữ giấy tờ gốc, duyệt online nhanh chóng.
                </p>
              </div>

              <div
                className={`installment-mode-btn ${mode === "credit_card" ? "active" : ""}`}
                onClick={() => {
                  setMode("credit_card");
                  if (downPaymentPercent < 0) setDownPaymentPercent(0);
                }}
                role="button"
                tabIndex={0}
              >
                <div className="installment-mode-top">
                  <span className="installment-mode-title">Qua Thẻ Tín Dụng 0%</span>
                  <span
                    className="installment-mode-badge"
                    style={{
                      color: "var(--lux-blue)",
                      borderColor: "rgba(41,151,255,0.4)",
                      background: "rgba(41,151,255,0.15)",
                    }}
                  >
                    Lãi Suất 0%
                  </span>
                </div>
                <p className="installment-mode-desc">
                  Hỗ trợ 25+ ngân hàng (Visa, Mastercard, JCB). Trả trước từ 0đ, không cần xét duyệt hồ sơ cá nhân.
                </p>
              </div>
            </div>

            {/* Partner Selector */}
            <div className="installment-param-group">
              <label className="installment-param-label">
                {mode === "finance_company" ? "Đơn vị tài chính đối tác" : "Ngân hàng phát hành thẻ tín dụng"}
              </label>

              {mode === "finance_company" ? (
                <div className="installment-partner-grid" style={{ marginTop: "10px" }}>
                  {FINANCE_COMPANIES.map((company) => (
                    <div
                      key={company.id}
                      className={`installment-partner-card ${companyId === company.id ? "active" : ""}`}
                      onClick={() => setCompanyId(company.id)}
                    >
                      <div className="installment-partner-logo-box">
                        <Image src={company.logo} alt={company.name} width={40} height={24} unoptimized />
                      </div>
                      <div>
                        <div className="installment-partner-name">{company.name}</div>
                        <div className="installment-partner-rate">Lãi ~{company.monthlyRate}%/th</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="installment-partner-grid" style={{ marginTop: "10px" }}>
                  {CREDIT_CARD_BANKS.map((bank) => (
                    <div
                      key={bank.id}
                      className={`installment-partner-card ${bankId === bank.id ? "active" : ""}`}
                      onClick={() => setBankId(bank.id)}
                    >
                      <div
                        className="installment-partner-logo-box"
                        style={{ backgroundColor: bank.color, color: "#fff", fontWeight: 800, fontSize: "11px" }}
                      >
                        {bank.shortName}
                      </div>
                      <div>
                        <div className="installment-partner-name">{bank.name}</div>
                        <div className="installment-partner-rate">0% Lãi suất</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Down Payment Slider & Quick Buttons */}
            <div className="installment-param-group">
              <div className="installment-param-header">
                <span className="installment-param-label">Mức trả trước mong muốn</span>
                <span className="installment-param-value-tag">
                  {downPaymentPercent}% ({formatOrderMoney(currentPlan.downPaymentAmount)})
                </span>
              </div>

              <input
                type="range"
                min={mode === "finance_company" ? 10 : 0}
                max={70}
                step={5}
                value={downPaymentPercent}
                onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                className="installment-range-slider"
              />

              <div className="installment-quick-chips">
                {DOWN_PAYMENT_OPTIONS.filter((p) => mode === "credit_card" || p >= 10).map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    className={`installment-chip-btn ${downPaymentPercent === percent ? "active" : ""}`}
                    onClick={() => setDownPaymentPercent(percent)}
                  >
                    {percent === 0 ? "0đ (0%)" : `${percent}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Term Length Selector */}
            <div className="installment-param-group">
              <div className="installment-param-header">
                <span className="installment-param-label">Kỳ hạn trả góp</span>
                <span
                  className="installment-param-value-tag"
                  style={{
                    color: "var(--lux-green)",
                    background: "rgba(48,209,88,0.12)",
                    borderColor: "rgba(48,209,88,0.3)",
                  }}
                >
                  {term} Tháng
                </span>
              </div>

              <div className="installment-term-cards">
                {termOptions.map((item) => (
                  <div
                    key={item.term}
                    className={`installment-term-card ${term === item.term ? "active" : ""}`}
                    onClick={() => setTerm(item.term)}
                  >
                    <span className="installment-term-months">{item.term} Tháng</span>
                    <span className="installment-term-price">{formatOrderMoney(item.monthly)}/th</span>
                    <span className="installment-term-badge">
                      {item.interest === 0 ? "Ưu đãi 0%" : `Lãi ${formatOrderMoney(item.interest)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: REAL-TIME FINANCIAL SUMMARY & ACTION */}
        <aside className="installment-right-column">
          {/* Main Financial Result Card */}
          <div className="installment-result-card">
            <div className="installment-result-eyebrow">
              <span className="installment-result-tag">Dự toán khoản vay</span>
              <span className="installment-result-pill">
                {mode === "credit_card" ? "0% LÃI SUẤT" : `${activeCompany.name} · DUYỆT 15P`}
              </span>
            </div>

            <div className="installment-main-payment">
              <span className="installment-monthly-number">
                {formatOrderMoney(currentPlan.monthlyPayment)}
              </span>
              <span className="installment-monthly-unit">/ tháng</span>
            </div>

            <div className="installment-daily-quote">
              Chỉ tương đương khoảng <strong>{formatOrderMoney(currentPlan.dailyPayment)} / ngày</strong> để sở hữu máy
            </div>

            {/* Breakdown Table */}
            <table className="installment-breakdown-table">
              <tbody>
                <tr>
                  <td>Thiết bị</td>
                  <td style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedProduct?.name || "Tùy chỉnh"}
                  </td>
                </tr>
                <tr>
                  <td>Giá trị sản phẩm</td>
                  <td>{formatOrderMoney(amount)}</td>
                </tr>
                <tr>
                  <td>Khoản trả trước ({downPaymentPercent}%)</td>
                  <td>{formatOrderMoney(currentPlan.downPaymentAmount)}</td>
                </tr>
                <tr>
                  <td>Số tiền cần vay/góp</td>
                  <td>{formatOrderMoney(currentPlan.financedAmount)}</td>
                </tr>
                <tr>
                  <td>Tiền gốc hàng tháng</td>
                  <td>{formatOrderMoney(currentPlan.monthlyPrincipal)}</td>
                </tr>
                <tr>
                  <td>{mode === "credit_card" ? "Phí chuyển đổi ngân hàng" : "Tiền lãi dự kiến/tháng"}</td>
                  <td>
                    {mode === "credit_card"
                      ? formatOrderMoney(currentPlan.interestAmount)
                      : formatOrderMoney(currentPlan.monthlyInterest)}
                  </td>
                </tr>
                <tr className="highlight">
                  <td>Chênh lệch so với mua thẳng</td>
                  <td>+{formatOrderMoney(currentPlan.differenceAmount)}</td>
                </tr>
                <tr className="total-row">
                  <td>Tổng chi phí sau hoàn tất</td>
                  <td>{formatOrderMoney(currentPlan.totalPayment)}</td>
                </tr>
              </tbody>
            </table>

            {/* Action Buttons */}
            <div className="installment-action-buttons">
              <a href="#consult-form" className="installment-btn-primary">
                Đăng ký tư vấn duyệt hồ sơ ngay ›
              </a>

              <button
                type="button"
                className="installment-btn-secondary"
                onClick={() => setShowScheduleModal(true)}
              >
                📊 Xem lịch thanh toán từng tháng
              </button>
            </div>
          </div>

          {/* Consultation Lead Capture Form */}
          <section id="consult-form" className="installment-consult-card">
            <h3>Đăng ký nhận tư vấn xét duyệt</h3>
            <p>
              Chuyên viên tài chính Infinity Store sẽ liên hệ hỗ trợ hồ sơ duyệt trước trong 5 phút.
            </p>

            {consultSubmitted ? (
              <div className="installment-consult-success">
                <strong>✓ Đã tiếp nhận thông tin thành công!</strong>
                <p>
                  Mã hồ sơ: <strong>{consultTicket}</strong>
                  <br />
                  Chuyên viên tư vấn sẽ gọi cho bạn qua số <strong>{consultPhone}</strong> trong ít phút.
                </p>
                <button
                  type="button"
                  className="installment-cat-btn"
                  style={{ marginTop: "14px" }}
                  onClick={() => setConsultSubmitted(false)}
                >
                  Tạo dự toán khác
                </button>
              </div>
            ) : (
              <div className="installment-form-container">
                <div className="installment-form-field">
                  <label htmlFor="consult-name">Họ và tên khách hàng *</label>
                  <input
                    id="consult-name"
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn An"
                    value={consultName}
                    onChange={(e) => setConsultName(e.target.value)}
                    className="installment-form-input"
                  />
                </div>

                <div className="installment-form-field">
                  <label htmlFor="consult-phone">Số điện thoại liên hệ *</label>
                  <input
                    id="consult-phone"
                    type="tel"
                    required
                    placeholder="Ví dụ: 0912 345 678"
                    value={consultPhone}
                    onChange={(e) => setConsultPhone(e.target.value)}
                    className="installment-form-input"
                  />
                </div>

                <div className="installment-form-field">
                  <label htmlFor="consult-branch">Chi nhánh nhận máy thuận tiện</label>
                  <select
                    id="consult-branch"
                    value={consultBranch}
                    onChange={(e) => setConsultBranch(e.target.value)}
                    className="installment-form-select"
                  >
                    {branches.length > 0 ? (
                      branches.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name} - {b.address}
                        </option>
                      ))
                    ) : (
                      <option value="Chi nhánh Quận 1">Infinity Store - Chi nhánh Trung tâm</option>
                    )}
                  </select>
                </div>

                <button type="button" onClick={() => handleConsultSubmit()} className="installment-btn-primary" style={{ marginTop: "16px" }}>
                  Gửi yêu cầu xét duyệt hồ sơ
                </button>

                <div style={{ textAlign: "center", marginTop: "12px" }}>
                  <span style={{ fontSize: "12px", color: "var(--lux-text-muted)" }}>
                    Hoặc liên hệ Hotline trực tiếp:{" "}
                    <a href="tel:02879797999" style={{ color: "var(--lux-blue)", fontWeight: 700 }}>
                      028 7979 7999
                    </a>
                  </span>
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>

      {/* 3. HOW IT WORKS & FAQS */}
      <section className="installment-info-section">
        {/* 4 Simple Steps */}
        <div className="installment-steps-card">
          <h2>Quy trình 4 bước trả góp đơn giản</h2>
          <div className="installment-steps-list">
            <div className="installment-step-item">
              <span className="installment-step-badge">1</span>
              <div className="installment-step-content">
                <strong>Chọn Hãng &amp; Tên máy dự toán</strong>
                <p>Dễ dàng chọn Hãng sản xuất (Apple, ASUS, Sony...) và dòng máy để có mức giá và kế hoạch tài chính tối ưu.</p>
              </div>
            </div>

            <div className="installment-step-item">
              <span className="installment-step-badge">2</span>
              <div className="installment-step-content">
                <strong>Lên hồ sơ online chỉ trong 5 phút</strong>
                <p>Chụp ảnh CCCD gắn chip qua link bảo mật hoặc xác nhận hạn mức qua thẻ tín dụng ngân hàng.</p>
              </div>
            </div>

            <div className="installment-step-item">
              <span className="installment-step-badge">3</span>
              <div className="installment-step-content">
                <strong>Hệ thống thẩm định tự động 15 phút</strong>
                <p>Công ty tài chính phản hồi kết quả duyệt nhanh qua SMS/Zalo. Không cần chứng minh thu nhập rườm rà.</p>
              </div>
            </div>

            <div className="installment-step-item">
              <span className="installment-step-badge">4</span>
              <div className="installment-step-content">
                <strong>Nhận máy đập hộp &amp; Kích hoạt bảo hành</strong>
                <p>Đến chi nhánh gần nhất kiểm tra máy hoặc nhận giao hàng miễn phí tận nơi trên toàn quốc.</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="installment-faq-card">
          <h2>Câu hỏi thường gặp</h2>
          <div className="installment-faq-list">
            {FAQS.map((faq, index) => {
              const isOpen = faqOpenIndex === index;
              return (
                <div key={faq.q} className="installment-faq-item">
                  <button
                    type="button"
                    className="installment-faq-question"
                    onClick={() => setFaqOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <span style={{ fontSize: "16px", color: "var(--lux-blue)" }}>{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && <div className="installment-faq-answer">{faq.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. AMORTIZATION SCHEDULE MODAL */}
      {showScheduleModal && (
        <div
          className="installment-schedule-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowScheduleModal(false)}
        >
          <div className="installment-schedule-content" onClick={(e) => e.stopPropagation()}>
            <div className="installment-schedule-header">
              <h3>Bảng Lịch Thanh Toán Dự Kiến ({currentPlan.term} tháng)</h3>
              <button
                type="button"
                className="installment-schedule-close"
                onClick={() => setShowScheduleModal(false)}
                title="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="installment-schedule-body">
              <p style={{ fontSize: "12.5px", color: "var(--lux-text-secondary)", marginBottom: "16px" }}>
                Thiết bị: <strong>{selectedProduct?.name || "Tùy chỉnh"}</strong> · Khoản vay:{" "}
                <strong>{formatOrderMoney(currentPlan.financedAmount)}</strong> · Trả trước:{" "}
                <strong>{formatOrderMoney(currentPlan.downPaymentAmount)}</strong> ({currentPlan.downPaymentPercent}%) · Số
                tiền góp mỗi tháng:{" "}
                <strong style={{ color: "var(--lux-green)" }}>{formatOrderMoney(currentPlan.monthlyPayment)}</strong>
              </p>

              <table className="installment-schedule-table">
                <thead>
                  <tr>
                    <th>Kỳ</th>
                    <th>Dư nợ đầu kỳ</th>
                    <th>Tiền gốc</th>
                    <th>Tiền lãi/phí</th>
                    <th>Tổng góp tháng</th>
                    <th>Dư nợ còn lại</th>
                  </tr>
                </thead>
                <tbody>
                  {amortizationSchedule.map((row) => (
                    <tr key={row.month}>
                      <td>Tháng {row.month}</td>
                      <td>{formatOrderMoney(row.beginningBalance)}</td>
                      <td>{formatOrderMoney(row.principalPaid)}</td>
                      <td>{formatOrderMoney(row.interestPaid)}</td>
                      <td style={{ fontWeight: 700, color: "var(--lux-green)" }}>
                        {formatOrderMoney(row.totalMonthly)}
                      </td>
                      <td>{formatOrderMoney(row.endingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: "16px", fontSize: "11px", color: "var(--lux-text-muted)" }}>
                * Chỉ để tham khảo. Không phải báo giá. Bảng lịch thanh toán mang tính chất tham khảo mô phỏng theo chuẩn ngân hàng. Lịch thanh toán và ngày đến
                hạn chính thức sẽ được ghi cụ thể trên hợp đồng tín dụng ký kết.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
