"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import type { PreorderProduct } from "@/app/preorder-products";
import "./macbook-pro-apple.css";

type Branch = { id: string; name: string; address: string; phone: string; hours: string };
type CustomerInfo = { name: string; phone: string; email: string };
type SubmitResult = {
  orderCode: string;
  branch: Branch;
};

interface MacBookProShowcaseProps {
  branches: Branch[];
  customer?: CustomerInfo;
  allProducts: PreorderProduct[];
}

const MBP_VARIANTS = [
  {
    id: "14-m5",
    size: "14",
    chip: "m5",
    chipName: "Chip M5",
    name: "MacBook Pro 14 inch · M5",
    screen: '14.2" Liquid Retina XDR (3024 × 1964)',
    specs: "10-Core CPU · 10-Core GPU · 16GB RAM · 512GB SSD",
    battery: "Lên đến 24 giờ",
    weight: "1.55 kg",
    ports: "3x Thunderbolt 5, HDMI, SDXC, MagSafe 3",
    priceEstimate: "Dự kiến từ 39.990.000₫",
  },
  {
    id: "14-m5-pro",
    size: "14",
    chip: "m5-pro",
    chipName: "Chip M5 Pro",
    name: "MacBook Pro 14 inch · M5 Pro",
    screen: '14.2" Liquid Retina XDR (3024 × 1964)',
    specs: "14-Core CPU · 20-Core GPU · 24GB RAM · 1TB SSD",
    battery: "Lên đến 22 giờ",
    weight: "1.60 kg",
    ports: "3x Thunderbolt 5, HDMI, SDXC, MagSafe 3",
    priceEstimate: "Dự kiến từ 49.990.000₫",
  },
  {
    id: "16-m5-pro",
    size: "16",
    chip: "m5-pro",
    chipName: "Chip M5 Pro",
    name: "MacBook Pro 16 inch · M5 Pro",
    screen: '16.2" Liquid Retina XDR (3456 × 2234)',
    specs: "14-Core CPU · 20-Core GPU · 24GB RAM · 1TB SSD",
    battery: "Lên đến 24 giờ",
    weight: "2.14 kg",
    ports: "3x Thunderbolt 5, HDMI, SDXC, MagSafe 3",
    priceEstimate: "Dự kiến từ 59.990.000₫",
  },
  {
    id: "16-m5-max",
    size: "16",
    chip: "m5-max",
    chipName: "Chip M5 Max",
    name: "MacBook Pro 16 inch · M5 Max",
    screen: '16.2" Liquid Retina XDR (3456 × 2234)',
    specs: "16-Core CPU · 40-Core GPU · 48GB RAM · 1TB SSD",
    battery: "Lên đến 24 giờ",
    weight: "2.16 kg",
    ports: "3x Thunderbolt 5, HDMI, SDXC, MagSafe 3",
    priceEstimate: "Dự kiến từ 84.990.000₫",
  },
];

const COLORS = [
  { name: "Space Black", viName: "Đen Không Gian", hex: "#29292b" },
  { name: "Silver", viName: "Bạc", hex: "#d9d9d7" },
];

export default function MacBookProShowcase({
  branches,
  customer,
  allProducts,
}: MacBookProShowcaseProps) {
  // Config state
  const [selectedSize, setSelectedSize] = useState<"14" | "16">("14");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedVariantId, setSelectedVariantId] = useState("14-m5-pro");
  const [selectedChipTab, setSelectedChipTab] = useState<"m5" | "m5-pro" | "m5-max">("m5-pro");

  // Form submission state
  const [branchId, setBranchId] = useState(branches[0]?.id || "");
  const [branchQuery, setBranchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);

  // Filtered branches
  const filteredBranches = useMemo(() => {
    const q = branchQuery.toLowerCase().trim();
    if (!q) return branches;
    return branches.filter(
      (b) => b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q)
    );
  }, [branches, branchQuery]);

  const selectedBranch = branches.find((b) => b.id === branchId) || branches[0];
  const selectedVariant = MBP_VARIANTS.find((v) => v.id === selectedVariantId) || MBP_VARIANTS[1];

  function handleSizeChange(size: "14" | "16") {
    setSelectedSize(size);
    const candidate = MBP_VARIANTS.find((v) => v.size === size);
    if (candidate) {
      setSelectedVariantId(candidate.id);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    setResult(null);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/preorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: "macbook-pro-m5-new",
          configuration: `${selectedVariant.name} · ${selectedVariant.specs}`,
          color: selectedColor.name,
          branchId,
          customerName: formData.get("customerName"),
          phone: formData.get("phone"),
          email: formData.get("email"),
          quantity: formData.get("quantity") || "1",
          contactTime: formData.get("contactTime"),
          note: formData.get("note"),
        }),
      });

      const payload = (await response.json()) as SubmitResult & { message?: string };
      if (!response.ok || !payload.orderCode) {
        throw new Error(payload.message || "Không thể gửi yêu cầu đặt trước.");
      }

      setResult(payload);
      window.dispatchEvent(new Event("huy-account-change"));

      // Scroll to result
      const resultEl = document.getElementById("preorder-result");
      if (resultEl) {
        resultEl.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="apple-mbp-root">
      {/* 0. APPLE GLOBAL BRAND RIBBON */}
      <header className="apple-global-ribbon" aria-label="Infinity Store Apple Navigation">
        <div className="apple-global-ribbon-inner">
          <Link href="/" className="apple-global-brand" title="Về trang chủ Infinity Store">
            <span className="apple-global-brand-apple-mark"></span>
            <span>Infinity Store</span>
          </Link>
          <ul className="apple-global-nav-links">
            <li><Link href="/" className="apple-global-nav-link">Cửa hàng</Link></li>
            <li><Link href="/macbook" className="apple-global-nav-link">MacBook</Link></li>
            <li><Link href="/iphone" className="apple-global-nav-link">iPhone</Link></li>
            <li><Link href="/ipad" className="apple-global-nav-link">iPad</Link></li>
            <li><Link href="/phu-kien" className="apple-global-nav-link">Phụ kiện</Link></li>
            <li><span className="apple-global-nav-link active">MacBook Pro M5</span></li>
            <li><Link href="/dat-truoc?device=iphone" className="apple-global-nav-link" style={{ color: "#ff6b87" }}>📱 iPhone 18 Pro ›</Link></li>
          </ul>
          <Link href="/" className="apple-global-nav-back">
            <span>← Quay lại shop</span>
          </Link>
        </div>
      </header>

      {/* 1. STICKY LOCALNAV */}
      <nav className="apple-mbp-localnav" aria-label="Điều hướng sản phẩm MacBook Pro">
        <div className="apple-mbp-localnav-inner">
          <div className="apple-mbp-localnav-title">
            <h2>MacBook Pro</h2>
            <span className="apple-mbp-localnav-badge">Thế hệ mới</span>
          </div>

          <ul className="apple-mbp-localnav-links">
            <li><a href="#overview">Tổng quan</a></li>
            <li><a href="#highlights">Điểm nổi bật</a></li>
            <li><a href="#product-viewer">Cận cảnh &amp; Màu sắc</a></li>
            <li><a href="#performance">Hiệu năng Chip</a></li>
            <li><a href="#configurator">Thông số &amp; Cấu hình</a></li>
            <li><Link href="/dat-truoc?device=iphone" style={{ color: "#ff6b87", fontWeight: 600 }}>📱 iPhone 18 Pro ›</Link></li>
          </ul>

          <a href="#configurator" className="apple-mbp-localnav-cta">
            <span>Đặt trước ngay</span>
            <small style={{ opacity: 0.85, fontSize: "10px" }}>(0đ cọc)</small>
          </a>
        </div>
      </nav>

      {/* 2. CINEMATIC HERO SECTION */}
      <section id="overview" className="apple-mbp-hero">
        <div className="apple-mbp-hero-copy">
          <span className="apple-mbp-eyebrow">Apple MacBook Pro</span>
          <h1 className="apple-mbp-hero-title">MacBook Pro</h1>
          <p className="apple-mbp-hero-headline">
            Đỉnh cao hiệu năng. Bứt phá mọi giới hạn.
          </p>
          <p className="apple-mbp-hero-desc">
            Sức mạnh vô song từ thế hệ chip M5, M5 Pro và M5 Max mới nhất.
            Màn hình Liquid Retina XDR sáng đến 1600 nits với tùy chọn mặt kính Nano-texture chống lóa.
            Thời lượng pin lên đến 24 giờ bền bỉ kỷ lục. Sẵn sàng cho Apple Intelligence.
          </p>

          <div className="apple-mbp-hero-actions">
            <a href="#configurator" className="apple-mbp-btn-primary">
              Giữ suất nhận máy đầu tiên (0đ)
            </a>
            <a href="#product-viewer" className="apple-mbp-btn-secondary">
              Xem cận cảnh 14” & 16”
            </a>
          </div>
        </div>

        {/* Hero Stage Visual with Screen Glow */}
        <div className="apple-mbp-hero-stage">
          <div className="apple-mbp-hero-screen-glow" />
          <div className="apple-mbp-hero-img-wrap">
            <Image
              src="/apple-macbook-pro/hero-macbook-pro.jpg"
              alt="Apple MacBook Pro mở góc chữ V khoe màn hình Liquid Retina XDR"
              width={1080}
              height={580}
              priority
              className="apple-mbp-hero-img"
            />
          </div>
        </div>

        {/* Floating Highlights Row */}
        <div className="apple-mbp-hero-pills">
          <div className="apple-mbp-hero-pill">
            <span className="apple-mbp-hero-pill-icon">⚡</span>
            <span>Ba chip: M5 · M5 Pro · M5 Max</span>
          </div>
          <div className="apple-mbp-hero-pill">
            <span className="apple-mbp-hero-pill-icon">🖥️</span>
            <span>Màn hình Liquid Retina XDR Nano-texture</span>
          </div>
          <div className="apple-mbp-hero-pill">
            <span className="apple-mbp-hero-pill-icon">🔋</span>
            <span>Thời lượng pin lên đến 24 giờ</span>
          </div>
          <div className="apple-mbp-hero-pill">
            <span className="apple-mbp-hero-pill-icon">✦</span>
            <span>Được thiết kế cho Apple Intelligence</span>
          </div>
          <div className="apple-mbp-hero-pill">
            <span className="apple-mbp-hero-pill-icon">🔌</span>
            <span>Thunderbolt 5 lên đến 120Gb/s</span>
          </div>
        </div>
      </section>

      {/* 3. BENTO HIGHLIGHTS GRID ("CÁC ĐIỂM NỔI BẬT") */}
      <section id="highlights" className="apple-mbp-section">
        <div className="apple-mbp-section-header">
          <span className="apple-mbp-eyebrow">Trải nghiệm vượt bậc</span>
          <h2 className="apple-mbp-section-title">Các điểm nổi bật.</h2>
          <p className="apple-mbp-section-sub">
            Mỗi chi tiết trên MacBook Pro đều được kiến tạo để định nghĩa lại tiêu chuẩn máy trạm di động chuyên nghiệp.
          </p>
        </div>

        <div className="apple-mbp-bento">
          {/* Card 1: Chips */}
          <div className="apple-mbp-bento-card apple-mbp-bento-col-8">
            <div className="apple-mbp-bento-content">
              <span className="apple-mbp-bento-kicker">Hiệu Năng Chip</span>
              <h3 className="apple-mbp-bento-title">Ba chip. Tiềm năng bất tận.</h3>
              <p className="apple-mbp-bento-desc">
                Trang bị CPU thế hệ mới nhanh nhất thế giới và kiến trúc GPU với Ray Tracing bằng phần cứng,
                mang đến bước nhảy vọt cho đồ họa 3D phức tạp, biên tập video 8K ProRes và huấn luyện mô hình AI tại chỗ.
              </p>
            </div>
            <div className="apple-mbp-bento-media">
              <Image
                src="/apple-macbook-pro/chip-m5-family.jpg"
                alt="Bộ ba vi xử lý M5, M5 Pro và M5 Max"
                width={720}
                height={320}
                className="apple-mbp-hero-img"
              />
            </div>
          </div>

          {/* Card 2: Battery */}
          <div className="apple-mbp-bento-card apple-mbp-bento-col-4">
            <div className="apple-mbp-bento-content">
              <span className="apple-mbp-bento-kicker">Thời Lượng Pin</span>
              <h3 className="apple-mbp-bento-title">Lên đến 24 giờ. Bền bỉ kỷ lục.</h3>
              <p className="apple-mbp-bento-desc">
                Thời lượng pin dài nhất từ trước đến nay trên máy Mac. Làm việc, giải trí và sáng tạo suốt ngày dài dù cắm sạc hay dùng pin.
              </p>
            </div>
            <div className="apple-mbp-bento-media">
              <Image
                src="/apple-macbook-pro/battery-highlight.jpg"
                alt="MacBook Pro cho thời lượng pin đến 24 giờ"
                width={400}
                height={260}
                className="apple-mbp-hero-img"
              />
            </div>
          </div>

          {/* Card 3: Apple Intelligence */}
          <div className="apple-mbp-bento-card apple-mbp-bento-col-4">
            <div className="apple-mbp-bento-content">
              <span className="apple-mbp-bento-kicker">Trí Tuệ Nhân Tạo</span>
              <h3 className="apple-mbp-bento-title">Apple Intelligence. Giao việc là được việc ngay.</h3>
              <p className="apple-mbp-bento-desc">
                Hệ thống trí tuệ cá nhân hóa được tích hợp sâu trong macOS, hỗ trợ bạn diễn đạt, tóm tắt và sáng tạo trong khi vẫn bảo vệ quyền riêng tư tuyệt đối.
              </p>
            </div>
            <div className="apple-mbp-bento-media">
              <Image
                src="/apple-macbook-pro/ai-highlight.jpg"
                alt="Apple Intelligence trên macOS"
                width={400}
                height={260}
                className="apple-mbp-hero-img"
              />
            </div>
          </div>

          {/* Card 4: Liquid Retina XDR */}
          <div className="apple-mbp-bento-card apple-mbp-bento-col-8">
            <div className="apple-mbp-bento-content">
              <span className="apple-mbp-bento-kicker">Màn Hình XDR</span>
              <h3 className="apple-mbp-bento-title">Màn hình Liquid Retina XDR. Tùy chọn Nano-texture.</h3>
              <p className="apple-mbp-bento-desc">
                Độ sáng cực đại 1600 nits cho nội dung HDR cùng tỷ lệ tương phản 1.000.000:1.
                Tùy chọn mặt kính Nano-texture khắc chính xác đến từng nanomet giúp tán xạ ánh sáng, triệt tiêu hiện tượng lóa khi làm việc ngoài trời hoặc dưới đèn studio.
              </p>
            </div>
            <div className="apple-mbp-bento-media">
              <Image
                src="/apple-macbook-pro/product-viewer-hero.jpg"
                alt="Màn hình Liquid Retina XDR Nano-texture"
                width={720}
                height={320}
                className="apple-mbp-hero-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE PRODUCT VIEWER & COLOR / SIZE SWITCHER ("NGẮM NHÌN CẬN CẢNH") */}
      <section id="product-viewer" className="apple-mbp-section">
        <div className="apple-mbp-section-header text-center">
          <span className="apple-mbp-eyebrow">Thiết Kế Tinh Xảo</span>
          <h2 className="apple-mbp-section-title">Ngắm nhìn cận cảnh.</h2>
          <p className="apple-mbp-section-sub">
            Khung nhôm nguyên khối tái chế 100%, hoàn thiện cao cấp với hai phiên bản kích thước và màu sắc huyền bí.
          </p>
        </div>

        <div className="apple-mbp-viewer-stage">
          {/* Controls: Size & Color */}
          <div className="apple-mbp-viewer-controls">
            {/* Size Switch */}
            <div className="apple-mbp-size-switch" role="tablist" aria-label="Chọn kích thước màn hình">
              <button
                type="button"
                className={`apple-mbp-size-btn${selectedSize === "14" ? " is-active" : ""}`}
                onClick={() => handleSizeChange("14")}
              >
                14-inch
              </button>
              <button
                type="button"
                className={`apple-mbp-size-btn${selectedSize === "16" ? " is-active" : ""}`}
                onClick={() => handleSizeChange("16")}
              >
                16-inch
              </button>
            </div>

            {/* Color Swatch Picker */}
            <div className="apple-mbp-color-picker" aria-label="Chọn màu sắc MacBook Pro">
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className={`apple-mbp-color-swatch-item${selectedColor.name === c.name ? " is-active" : ""}`}
                  onClick={() => setSelectedColor(c)}
                >
                  <span
                    className="apple-mbp-color-circle"
                    style={{ backgroundColor: c.hex }}
                    aria-hidden="true"
                  />
                  <span>{c.viName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Viewer Visual Display */}
          <div className="apple-mbp-viewer-visual">
            <div className="apple-mbp-viewer-img-wrap">
              <Image
                src="/apple-macbook-pro/product-viewer-hero.jpg"
                alt={`MacBook Pro ${selectedSize}-inch màu ${selectedColor.viName}`}
                width={820}
                height={420}
                className="apple-mbp-hero-img"
              />
            </div>
          </div>

          {/* Real-time Specs Bar */}
          <div className="apple-mbp-viewer-specs-bar">
            <div className="apple-mbp-spec-item">
              <strong>{selectedSize === "14" ? "14.2 inch" : "16.2 inch"}</strong>
              <span>Liquid Retina XDR Nano-texture</span>
            </div>
            <div className="apple-mbp-spec-item">
              <strong>{selectedSize === "14" ? "1.55 kg" : "2.14 kg"}</strong>
              <span>Khung nhôm nguyên khối</span>
            </div>
            <div className="apple-mbp-spec-item">
              <strong>{selectedSize === "14" ? "24 giờ" : "24 giờ"}</strong>
              <span>Thời lượng pin tối đa</span>
            </div>
            <div className="apple-mbp-spec-item">
              <strong>3x Thunderbolt 5</strong>
              <span>HDMI, SDXC, MagSafe 3</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CHIP MATRIX / DEEP DIVE ("BA CHIP. TIỀM NĂNG BẤT TẬN") */}
      <section id="performance" className="apple-mbp-section">
        <div className="apple-mbp-section-header text-center">
          <span className="apple-mbp-eyebrow">Kiến Trúc Đột Phá</span>
          <h2 className="apple-mbp-section-title">Sức mạnh vượt bậc từ dòng chip M5.</h2>
          <p className="apple-mbp-section-sub">
            Chọn con chip tương xứng với tầm vóc dự án và khối lượng công việc của bạn.
          </p>
        </div>

        {/* Chip Tabs */}
        <div className="apple-mbp-chip-tabs" role="tablist">
          <button
            type="button"
            className={`apple-mbp-chip-tab${selectedChipTab === "m5" ? " is-active" : ""}`}
            onClick={() => setSelectedChipTab("m5")}
          >
            Chip M5
          </button>
          <button
            type="button"
            className={`apple-mbp-chip-tab${selectedChipTab === "m5-pro" ? " is-active" : ""}`}
            onClick={() => setSelectedChipTab("m5-pro")}
          >
            Chip M5 Pro
          </button>
          <button
            type="button"
            className={`apple-mbp-chip-tab${selectedChipTab === "m5-max" ? " is-active" : ""}`}
            onClick={() => setSelectedChipTab("m5-max")}
          >
            Chip M5 Max
          </button>
        </div>

        {/* Chip Card Content */}
        <div className="apple-mbp-chip-card">
          <div>
            <h3>
              {selectedChipTab === "m5" && "Chip M5: Tốc độ ngoạn mục cho mọi tác vụ."}
              {selectedChipTab === "m5-pro" && "Chip M5 Pro: Sức mạnh đồ họa đỉnh cao."}
              {selectedChipTab === "m5-max" && "Chip M5 Max: Quái vật máy trạm tối thượng."}
            </h3>
            <p>
              {selectedChipTab === "m5" &&
                "Lý tưởng cho lập trình viên, nhà sáng tạo nội dung và doanh nhân cần hiệu năng nhanh gấp 3.4x so với chip Intel thế hệ trước, xử lý ảnh RAW và đa nhiệm mượt mà."}
              {selectedChipTab === "m5-pro" &&
                "Dành cho chuyên gia hiệu ứng âm thanh, biên tập phim và kỹ sư dữ liệu xử lý các luồng công việc phức tạp trong Logic Pro, Final Cut Pro và MATLAB."}
              {selectedChipTab === "m5-max" &&
                "Được thiết kế cho các nhà phát triển mô hình ngôn ngữ lớn (LLM), dựng hình 3D thời gian thực trong Cinema 4D và mô phỏng khoa học với băng thông bộ nhớ khổng lồ."}
            </p>
            <a href="#configurator" className="apple-mbp-btn-primary">
              Cấu hình phiên bản {selectedChipTab.toUpperCase()}
            </a>
          </div>

          <div className="apple-mbp-chip-stats">
            <div className="apple-mbp-chip-stat-box">
              <b>{selectedChipTab === "m5" ? "10 nhân" : selectedChipTab === "m5-pro" ? "14 nhân" : "16 nhân"}</b>
              <span>CPU mạnh mẽ với nhân hiệu năng cao</span>
            </div>
            <div className="apple-mbp-chip-stat-box">
              <b>{selectedChipTab === "m5" ? "10 nhân" : selectedChipTab === "m5-pro" ? "20 nhân" : "40 nhân"}</b>
              <span>GPU Ray Tracing phần cứng</span>
            </div>
            <div className="apple-mbp-chip-stat-box">
              <b>{selectedChipTab === "m5" ? "Đến 32GB" : selectedChipTab === "m5-pro" ? "Đến 64GB" : "Đến 128GB"}</b>
              <span>Bộ nhớ thống nhất Unified Memory</span>
            </div>
            <div className="apple-mbp-chip-stat-box">
              <b>{selectedChipTab === "m5" ? "150 GB/s" : selectedChipTab === "m5-pro" ? "273 GB/s" : "546 GB/s"}</b>
              <span>Băng thông bộ nhớ siêu tốc</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PRE-ORDER CONFIGURATOR SECTION (TÙY CHỌN CẤU HÌNH & ĐẶT TRƯỚC) */}
      <section id="configurator" className="apple-mbp-configurator-section">
        <div className="apple-mbp-configurator-wrap">
          <div className="apple-mbp-section-header text-center">
            <span className="apple-mbp-eyebrow">Đặt Trước · 0đ Tiền Cọc</span>
            <h2 className="apple-mbp-section-title">Tùy chỉnh & Đặt trước MacBook Pro mới.</h2>
            <p className="apple-mbp-section-sub">
              Giữ suất nhận máy chính hãng đợt mở bán đầu tiên tại chi nhánh Infinity Store gần bạn nhất.
            </p>
          </div>

          {result ? (
            <div id="preorder-result" className="apple-mbp-success-shell" aria-live="polite">
              <div className="apple-mbp-success-badge">✓</div>
              <h2>Đã ghi nhận yêu cầu đặt trước!</h2>
              <p style={{ color: "var(--apple-text-secondary)", fontSize: "15px" }}>
                Mã đặt trước chính thức của bạn trên hệ thống Infinity Store:
              </p>
              <strong className="apple-mbp-success-code">{result.orderCode}</strong>
              <div style={{ margin: "20px 0", color: "#e5e5ea", fontSize: "14px" }}>
                Chi nhánh tiếp nhận: <b>{result.branch.name}</b> · {result.branch.address}
              </div>
              <p style={{ color: "var(--apple-text-secondary)", fontSize: "13px" }}>
                Chuyên viên tư vấn của Infinity Store sẽ liên hệ xác nhận lịch hàng và phiên bản cấu hình qua số điện thoại của bạn.
              </p>
              <div style={{ marginTop: "28px" }}>
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="apple-mbp-btn-secondary"
                >
                  Đặt thêm thiết bị khác
                </button>
              </div>
            </div>
          ) : (
            <div className="apple-mbp-config-grid">
              {/* Left Column: Live Summary Card */}
              <div className="apple-mbp-summary-card">
                <span className="apple-mbp-summary-badge">✓ Giữ suất 0đ không cần thanh toán</span>
                <h3>{selectedVariant.name}</h3>
                <p>Màu: <strong>{selectedColor.viName}</strong></p>

                <div className="apple-mbp-summary-preview">
                  <Image
                    src="/apple-macbook-pro/product-viewer-hero.jpg"
                    alt={selectedVariant.name}
                    width={320}
                    height={190}
                  />
                </div>

                <div className="apple-mbp-summary-specs">
                  <div className="apple-mbp-summary-spec-row">
                    <span>Màn hình:</span>
                    <strong>{selectedVariant.screen}</strong>
                  </div>
                  <div className="apple-mbp-summary-spec-row">
                    <span>Cấu hình:</span>
                    <strong>{selectedVariant.specs}</strong>
                  </div>
                  <div className="apple-mbp-summary-spec-row">
                    <span>Thời lượng pin:</span>
                    <strong>{selectedVariant.battery}</strong>
                  </div>
                  <div className="apple-mbp-summary-spec-row">
                    <span>Màu sắc:</span>
                    <strong>{selectedColor.viName}</strong>
                  </div>
                  <div className="apple-mbp-summary-spec-row">
                    <span>Chi nhánh:</span>
                    <strong>{selectedBranch?.name || "Toàn hệ thống"}</strong>
                  </div>
                </div>

                <ul className="apple-mbp-guarantees">
                  <li>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Không thu tiền cọc trước</span>
                  </li>
                  <li>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Đến cửa hàng xem máy trực tiếp mới thanh toán</span>
                  </li>
                  <li>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Thu cũ đổi mới trợ giá thêm đến 3.000.000₫</span>
                  </li>
                  <li>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Hỗ trợ trả góp 0% lãi suất qua thẻ hoặc CCCD</span>
                  </li>
                </ul>
              </div>

              {/* Right Column: Interactive Config Form */}
              <div className="apple-mbp-form-card">
                <form onSubmit={handleSubmit}>
                  {/* Step 1: Kích thước & Cấu hình */}
                  <div className="apple-mbp-options-group">
                    <h3 className="apple-mbp-step-title">
                      <span className="apple-mbp-step-num">1</span>
                      Chọn kích thước và cấu hình máy
                    </h3>

                    <div className="apple-mbp-choice-grid">
                      {MBP_VARIANTS.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          className={`apple-mbp-choice-btn${selectedVariantId === v.id ? " is-active" : ""}`}
                          onClick={() => {
                            setSelectedVariantId(v.id);
                            setSelectedSize(v.size as "14" | "16");
                          }}
                        >
                          <strong>{v.name}</strong>
                          <small>{v.specs}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Màu sắc */}
                  <div className="apple-mbp-options-group">
                    <h3 className="apple-mbp-step-title">
                      <span className="apple-mbp-step-num">2</span>
                      Chọn màu sắc hoàn thiện
                    </h3>

                    <div className="apple-mbp-choice-grid">
                      {COLORS.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          className={`apple-mbp-choice-btn${selectedColor.name === c.name ? " is-active" : ""}`}
                          onClick={() => setSelectedColor(c)}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span
                              className="apple-mbp-color-circle"
                              style={{ backgroundColor: c.hex, width: "20px", height: "20px" }}
                            />
                            <strong>{c.viName}</strong>
                          </div>
                          <small>{c.name}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 3: Chọn chi nhánh nhận máy */}
                  <div className="apple-mbp-options-group">
                    <h3 className="apple-mbp-step-title">
                      <span className="apple-mbp-step-num">3</span>
                      Chọn chi nhánh nhận máy thuận tiện
                    </h3>

                    <div className="apple-mbp-field" style={{ marginBottom: "12px" }}>
                      <input
                        type="text"
                        placeholder="Tìm theo quận, đường hoặc tên chi nhánh..."
                        value={branchQuery}
                        onChange={(e) => setBranchQuery(e.target.value)}
                      />
                    </div>

                    <div className="apple-mbp-branch-selector">
                      {filteredBranches.map((b) => (
                        <label
                          key={b.id}
                          className={`apple-mbp-branch-item${branchId === b.id ? " is-selected" : ""}`}
                        >
                          <input
                            type="radio"
                            name="branchIdChoice"
                            value={b.id}
                            checked={branchId === b.id}
                            onChange={() => setBranchId(b.id)}
                          />
                          <div>
                            <strong>{b.name}</strong>
                            <small>{b.address} · Giờ mở cửa: {b.hours}</small>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Step 4: Thông tin người nhận */}
                  <div className="apple-mbp-options-group">
                    <h3 className="apple-mbp-step-title">
                      <span className="apple-mbp-step-num">4</span>
                      Thông tin liên hệ nhận máy
                    </h3>

                    <div className="apple-mbp-input-grid">
                      <div className="apple-mbp-field">
                        <label htmlFor="customerName">Họ và tên *</label>
                        <input
                          id="customerName"
                          name="customerName"
                          type="text"
                          required
                          defaultValue={customer?.name || ""}
                          placeholder="Ví dụ: Nguyễn Văn An"
                        />
                      </div>
                      <div className="apple-mbp-field">
                        <label htmlFor="phone">Số điện thoại *</label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          required
                          defaultValue={customer?.phone || ""}
                          placeholder="Ví dụ: 0987 654 321"
                        />
                      </div>
                    </div>

                    <div className="apple-mbp-input-grid full">
                      <div className="apple-mbp-field">
                        <label htmlFor="email">Email nhận thông báo lịch hàng (tùy chọn)</label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          defaultValue={customer?.email || ""}
                          placeholder="name@example.com"
                        />
                      </div>
                    </div>

                    <div className="apple-mbp-input-grid full">
                      <div className="apple-mbp-field">
                        <label htmlFor="note">Ghi chú thêm (khung giờ gọi tiện nhất, xuất hóa đơn công ty...)</label>
                        <textarea
                          id="note"
                          name="note"
                          rows={2}
                          placeholder="Ví dụ: Gọi xác nhận sau 18h hoặc hỗ trợ thủ tục trả góp..."
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(255, 69, 58, 0.15)", border: "1px solid rgba(255, 69, 58, 0.3)", color: "#ff453a", marginBottom: "16px", fontSize: "13.5px" }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className="apple-mbp-submit-btn"
                  >
                    {sending ? "Đang ghi nhận yêu cầu..." : "Hoàn tất đặt trước (Không cần thanh toán) →"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 7. OTHER APPLE PRODUCTS PREORDER FOOTER */}
      <section className="apple-mbp-section" style={{ borderTop: "1px solid var(--apple-card-border)", paddingTop: "60px", paddingBottom: "80px" }}>
        <div className="apple-mbp-section-header text-center">
          <span className="apple-mbp-eyebrow">Dòng Sản Phẩm Khác</span>
          <h2 className="apple-mbp-section-title">Bạn cũng muốn giữ chỗ thiết bị Apple khác?</h2>
          <p className="apple-mbp-section-sub">
            Infinity Store cũng mở cổng đăng ký iPhone 18 Series và iPad mới nhất với chính sách 0đ tiền cọc.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", maxWidth: "960px", margin: "0 auto" }}>
          {allProducts
            .filter((p) => p.family !== "macbook")
            .slice(0, 3)
            .map((p) => (
              <div
                key={p.id}
                style={{
                  background: "var(--apple-card-bg)",
                  border: "1px solid var(--apple-card-border)",
                  borderRadius: "20px",
                  padding: "24px",
                  textAlign: "center",
                }}
              >
                <div style={{ position: "relative", height: "160px", marginBottom: "16px" }}>
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="280px"
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <h4 style={{ fontSize: "18px", color: "#fff", margin: "0 0 8px" }}>{p.name}</h4>
                <p style={{ color: "var(--apple-text-secondary)", fontSize: "13px", margin: "0 0 16px" }}>
                  {p.description}
                </p>
                <a
                  href="#configurator"
                  className="apple-mbp-btn-secondary"
                  style={{ width: "100%", justifyContent: "center", boxSizing: "border-box" }}
                >
                  Đăng ký nhận thông tin
                </a>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
