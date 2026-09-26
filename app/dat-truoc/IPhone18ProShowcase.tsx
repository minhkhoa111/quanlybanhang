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
  modelName: string;
  storage: string;
  colorName: string;
};

interface IPhone18ProShowcaseProps {
  branches: Branch[];
  customer?: CustomerInfo;
  allProducts: PreorderProduct[];
}

interface ColorOption {
  id: string;
  apiColor: "Burgundy" | "Glacier" | "Black" | "Silver" | "Đỏ Burgundy" | "Băng Thanh" | "Đen" | "Bạc";
  name: string;
  enName: string;
  hex: string;
  accent: string;
  description: string;
  image: string;
}

interface ApertureStop {
  stop: string;
  diameterPercent: number;
  lightGain: string;
  lightPercent: number;
  dofPercent: number;
  role: string;
  focusType: string;
  description: string;
  scenario: string;
}

const COLOR_OPTIONS: ColorOption[] = [
  {
    id: "burgundy",
    apiColor: "Burgundy",
    name: "Titan Đỏ Rượu",
    enName: "Burgundy Titanium",
    hex: "#713744",
    accent: "#b85c72",
    description: "Sắc đỏ Burgundy trầm quyến rũ kết hợp bề mặt titan chải vi mô, phản chiếu ánh sáng sang trọng và làm nổi bật cụm camera Pro.",
    image: "/apple-iphone-18-pro/contrast-18pro.jpg",
  },
  {
    id: "glacier",
    apiColor: "Glacier",
    name: "Titan Băng",
    enName: "Glacier Titanium",
    hex: "#b8c8dc",
    accent: "#7f9dbf",
    description: "Tông xanh băng thanh tao trong trẻo, hoàn thiện khung Titan cấp 5 mờ cho cảm giác mát lạnh và khác biệt đỉnh cao.",
    image: "/campaigns/apple-iphone-18-pro-colors-official.jpg",
  },
  {
    id: "black",
    apiColor: "Black",
    name: "Titan Đen",
    enName: "Space Black Titanium",
    hex: "#2b2b2e",
    accent: "#77777c",
    description: "Lớp phủ PVD titan đen không gian sâu thẳm, chống bám vân tay vượt trội, mạnh mẽ và đậm chất chuyên nghiệp.",
    image: "/campaigns/apple-iphone-18-pro-colors-official.jpg",
  },
  {
    id: "silver",
    apiColor: "Silver",
    name: "Titan Bạc",
    enName: "Silver Titanium",
    hex: "#dedfdf",
    accent: "#ffffff",
    description: "Vẻ đẹp thuần khiết nguyên bản của kim loại titan tự nhiên sáng bóng, bền chắc và vĩnh cửu với thời gian.",
    image: "/apple-iphone-18-pro/hero-iphone-18-pro.jpg",
  },
];

const MODELS = [
  {
    id: "iphone-18-pro",
    name: "iPhone 18 Pro",
    screen: '6.3" Super Retina XDR OLED',
    dimensions: "149.6 × 71.5 × 8.25 mm",
    weight: "199 gram",
    battery: "Lên đến 29 giờ xem video",
    priceStarts: "32.990.000₫",
  },
  {
    id: "iphone-18-pro-max",
    name: "iPhone 18 Pro Max",
    screen: '6.9" Super Retina XDR OLED',
    dimensions: "163.0 × 77.6 × 8.25 mm",
    weight: "225 gram",
    battery: "Lên đến 33 giờ xem video",
    priceStarts: "36.990.000₫",
  },
];

const STORAGE_TIERS = [
  { size: "256GB", note: "Tiêu chuẩn Pro", pricePro: "32.990.000₫", priceMax: "36.990.000₫" },
  { size: "512GB", note: "Phổ biến nhất", pricePro: "37.990.000₫", priceMax: "41.990.000₫" },
  { size: "1TB", note: "ProRes 4K LOG", pricePro: "43.990.000₫", priceMax: "47.990.000₫" },
  { size: "2TB", note: "Cực đại dung lượng", pricePro: "50.990.000₫", priceMax: "54.990.000₫" },
];

const APERTURE_STOPS: ApertureStop[] = [
  {
    stop: "ƒ/1.48",
    diameterPercent: 95,
    lightGain: "+320%",
    lightPercent: 100,
    dofPercent: 15,
    role: "Khẩu độ lớn kỷ lục · Chân dung đêm",
    focusType: "Bokeh quang học cực mịn",
    description: "Các lá khẩu cơ học mở cực đại để đón lượng ánh sáng chưa từng có. Tách bạch chủ thể với phông nền mờ nhòe tự nhiên 100% bằng quang học thật, không phụ thuộc thuật toán AI.",
    scenario: "Tiệc đêm thiếu sáng, ảnh chân dung xóa phông nghệ thuật, hoàng hôn tĩnh lặng.",
  },
  {
    stop: "ƒ/1.8",
    diameterPercent: 74,
    lightGain: "+180%",
    lightPercent: 78,
    dofPercent: 40,
    role: "Khẩu độ cân bằng · Đa dụng hàng ngày",
    focusType: "Sắc nét tức thì mọi góc",
    description: "Khẩu độ lý tưởng cho tốc độ màn trập 1/8000s, chụp bắt trọn mọi chuyển động siêu tốc với độ sắc nét đồng đều từ tâm ống kính ra đến rìa ảnh.",
    scenario: "Nhiếp ảnh đường phố, thể thao, khoảnh khắc gia đình chuyển động nhanh.",
  },
  {
    stop: "ƒ/2.8",
    diameterPercent: 52,
    lightGain: "Cân bằng tối ưu",
    lightPercent: 55,
    dofPercent: 70,
    role: "Mở rộng chiều sâu · Ảnh nhóm & Du lịch",
    focusType: "Vùng nét sâu (Deep Field)",
    description: "Tăng khoảng cách trường ảnh rõ nét. Đảm bảo mọi khuôn mặt từ hàng trước đến hàng sau đều sắc nét hoàn hảo mà không bị nhòe mờ.",
    scenario: "Chụp nhóm bạn bè, ảnh kỷ niệm gia đình, phong cảnh có tiền cảnh hoa cỏ.",
  },
  {
    stop: "ƒ/4.0",
    diameterPercent: 32,
    lightGain: "Kiểm soát phơi sáng",
    lightPercent: 35,
    dofPercent: 98,
    role: "Độ sâu tối đa · Siêu chi tiết phong cảnh",
    focusType: "Toàn cảnh sắc nét vô cực",
    description: "Khép khẩu tối đa để giữ độ nét tuyệt đối cho từng vân đá, gân lá và tòa nhà cao tầng từ cự ly cận cảnh 10cm cho đến tận chân trời vô cực.",
    scenario: "Kiến trúc đại cảnh, kỳ quan thiên nhiên, ảnh Macro cận cảnh siêu thực.",
  },
];

export default function IPhone18ProShowcase({
  branches,
  customer,
  allProducts,
}: IPhone18ProShowcaseProps) {
  // Configurator state
  const [selectedModelId, setSelectedModelId] = useState("iphone-18-pro-max");
  const [selectedStorage, setSelectedStorage] = useState("256GB");
  const [selectedColor, setSelectedColor] = useState<ColorOption>(COLOR_OPTIONS[0]);

  // Aperture Simulator state
  const [activeAperture, setActiveAperture] = useState<ApertureStop>(APERTURE_STOPS[0]);

  // Pre-order form state
  const [branchId, setBranchId] = useState(branches[0]?.id || "");
  const [branchQuery, setBranchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);

  const selectedModel = MODELS.find((m) => m.id === selectedModelId) || MODELS[1];
  const selectedBranch = branches.find((b) => b.id === branchId) || branches[0];

  const currentPriceEstimate = useMemo(() => {
    const tier = STORAGE_TIERS.find((t) => t.size === selectedStorage);
    if (!tier) return selectedModel.priceStarts;
    return selectedModelId === "iphone-18-pro-max" ? tier.priceMax : tier.pricePro;
  }, [selectedModelId, selectedStorage, selectedModel.priceStarts]);

  const filteredBranches = useMemo(() => {
    const q = branchQuery.toLowerCase().trim();
    if (!q) return branches;
    return branches.filter(
      (b) => b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q)
    );
  }, [branches, branchQuery]);

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
          productId: selectedModelId,
          configuration: selectedStorage,
          color: selectedColor.apiColor,
          branchId,
          customerName: formData.get("customerName"),
          phone: formData.get("phone"),
          email: formData.get("email"),
          quantity: formData.get("quantity") || "1",
          contactTime: formData.get("contactTime"),
          note: formData.get("note"),
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.orderCode) {
        throw new Error(payload.message || "Không thể gửi yêu cầu đặt trước.");
      }

      setResult({
        orderCode: payload.orderCode,
        branch: payload.branch || selectedBranch,
        modelName: selectedModel.name,
        storage: selectedStorage,
        colorName: selectedColor.name,
      });

      window.dispatchEvent(new Event("huy-account-change"));

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
    <div className="apple-iphone-root">
      {/* 0. APPLE GLOBAL BRAND RIBBON */}
      <header className="apple-global-ribbon" aria-label="Infinity Store Apple Navigation">
        <div className="apple-global-ribbon-inner">
          <Link href="/" className="apple-global-brand" title="Về trang chủ Infinity Store">
            <span className="apple-global-brand-apple-mark"></span>
            <span>Infinity Store</span>
          </Link>
          <ul className="apple-global-nav-links">
            <li><Link href="/" className="apple-global-nav-link">Cửa hàng</Link></li>
            <li><Link href="/iphone" className="apple-global-nav-link">iPhone</Link></li>
            <li><Link href="/macbook" className="apple-global-nav-link">MacBook</Link></li>
            <li><Link href="/ipad" className="apple-global-nav-link">iPad</Link></li>
            <li><Link href="/phu-kien" className="apple-global-nav-link">Phụ kiện</Link></li>
            <li><span className="apple-global-nav-link active">iPhone 18 Pro</span></li>
            <li><Link href="/dat-truoc?device=macbook" className="apple-global-nav-link" style={{ color: "#2997ff" }}>💻 MacBook Pro M5 ›</Link></li>
          </ul>
          <Link href="/" className="apple-global-nav-back">
            <span>← Quay lại shop</span>
          </Link>
        </div>
      </header>

      {/* 1. APPLE LOCALNAV BAR */}
      <nav className="apple-iphone-localnav" aria-label="Điều hướng sản phẩm iPhone 18 Pro">
        <div className="apple-iphone-localnav-inner">
          <div className="apple-iphone-localnav-title">
            <h2>iPhone 18 Pro</h2>
            <span className="apple-iphone-localnav-badge">Bứt Phá Mọi Chuẩn Mực</span>
          </div>
          <ul className="apple-iphone-localnav-links">
            <li><a href="#overview">Tổng quan</a></li>
            <li><a href="#finish-design">Thiết kế &amp; màu sắc</a></li>
            <li><a href="#camera-aperture">Khẩu độ biến thiên</a></li>
            <li><a href="#chip-a20pro">Chip A20 Pro</a></li>
            <li><a href="#compare">So sánh</a></li>
            <li><a href="#configurator">Cấu hình</a></li>
            <li><Link href="/dat-truoc?device=macbook" style={{ color: "#2997ff", fontWeight: 600 }}>💻 MacBook Pro M5 ›</Link></li>
          </ul>
          <a href="#configurator" className="apple-iphone-localnav-cta">
            Đặt trước 0đ cọc ›
          </a>
        </div>
      </nav>

      {/* 2. CINEMATIC HERO SECTION */}
      <header id="overview" className="apple-iphone-hero">
        <div className="apple-iphone-hero-glow" aria-hidden="true" />
        <div className="apple-iphone-hero-copy">
          <span className="apple-iphone-eyebrow">iPhone 18 Pro &amp; iPhone 18 Pro Max</span>
          <h1 className="apple-iphone-hero-title">Một nâng cấp quan trọng.</h1>
          <p className="apple-iphone-hero-headline">
            Khẩu độ biến thiên cơ học 4 bước ƒ/1.48–ƒ/4.0 đầu tiên.
            <br />
            Chip A20 Pro 2nm siêu đẳng cấp.
          </p>
          <p className="apple-iphone-hero-desc">
            Thiết kế khung Titanium Cấp 5 nguyên khối siêu bền chắc với viền màn hình mỏng nhất thế giới và mặt trước Ceramic Shield 2.
            Trải nghiệm trọn vẹn sức mạnh Apple Intelligence chạy trực tiếp trên thiết bị.
          </p>

          <div className="apple-iphone-hero-actions">
            <a href="#configurator" className="apple-iphone-btn-primary">
              Đặt trước ngay (Cọc 0đ) ›
            </a>
            <a href="#camera-aperture" className="apple-iphone-btn-secondary">
              Khám phá Khẩu độ biến thiên ↓
            </a>
          </div>

          <div className="apple-iphone-hero-stage">
            <div className="apple-iphone-hero-img-wrap">
              <Image
                src="/apple-iphone-18-pro/hero-iphone-18-pro.jpg"
                alt="iPhone 18 Pro và iPhone 18 Pro Max với bốn màu chính hãng Apple"
                width={1440}
                height={1080}
                priority
                className="apple-iphone-hero-img"
              />
            </div>
          </div>

          {/* Quick specs pills */}
          <div className="apple-iphone-hero-pills">
            <span className="apple-iphone-hero-pill">
              <span className="apple-iphone-hero-pill-icon">🔘</span>
              Khẩu độ cơ học 4 bước ƒ/1.48–ƒ/4.0
            </span>
            <span className="apple-iphone-hero-pill">
              <span className="apple-iphone-hero-pill-icon">⚡</span>
              Chip Apple A20 Pro 2nm thế hệ đầu
            </span>
            <span className="apple-iphone-hero-pill">
              <span className="apple-iphone-hero-pill-icon">🔭</span>
              Zoom quang học 8x Tetraprism (200mm)
            </span>
            <span className="apple-iphone-hero-pill">
              <span className="apple-iphone-hero-pill-icon">🛡️</span>
              Titan Cấp 5 · Ceramic Shield 2
            </span>
            <span className="apple-iphone-hero-pill">
              <span className="apple-iphone-hero-pill-icon">✨</span>
              Màu mới: Đỏ Burgundy
            </span>
          </div>
        </div>
      </header>

      {/* 3. VARIABLE APERTURE SIMULATOR (Marquee Apple Feature) */}
      <section id="camera-aperture" className="apple-aperture-section">
        <div className="apple-aperture-header">
          <span className="apple-iphone-eyebrow">Đột Phá Quang Học Đầu Tiên Trên iPhone</span>
          <h2>Khẩu Độ Biến Thiên Cơ Học 4 Bước.</h2>
          <p>
            Lần đầu tiên trong lịch sử, iPhone sở hữu cụm lá khẩu cơ học vật lý thật
            có thể đóng mở linh hoạt từ <strong>ƒ/1.48</strong> đến <strong>ƒ/4.0</strong>,
            mang lại khả năng kiểm soát độ sâu trường ảnh và lượng ánh sáng như máy ảnh điện ảnh chuyên nghiệp.
          </p>
        </div>

        <div className="apple-aperture-interactive-box">
          <div className="apple-aperture-layout">
            {/* Left Col: Iris Diaphragm Interactive Simulator */}
            <div className="apple-aperture-simulator-col">
              <div className="apple-aperture-iris-container">
                <div className="apple-aperture-outer-ring" />
                <div
                  className="apple-aperture-opening"
                  style={{
                    width: `${activeAperture.diameterPercent}%`,
                    height: `${activeAperture.diameterPercent}%`,
                  }}
                >
                  <span className="apple-aperture-f-label">{activeAperture.stop}</span>
                </div>
              </div>

              <div className="apple-aperture-stops-picker">
                {APERTURE_STOPS.map((stop) => (
                  <button
                    key={stop.stop}
                    type="button"
                    onClick={() => setActiveAperture(stop)}
                    className={`apple-aperture-stop-btn ${activeAperture.stop === stop.stop ? "active" : ""}`}
                    aria-label={`Chọn khẩu độ ${stop.stop}`}
                  >
                    {stop.stop}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: "12px", color: "#86868b", marginTop: "14px" }}>
                Chạm vào từng khẩu độ để mô phỏng mở/khép lá khẩu quang học
              </span>
            </div>

            {/* Right Col: Optical Characteristics & Live Metrics */}
            <div className="apple-aperture-detail-col">
              <span className="apple-aperture-role-badge">{activeAperture.role}</span>
              <h3 className="apple-aperture-stop-title">Khẩu độ quang học {activeAperture.stop}</h3>

              <div className="apple-aperture-meters">
                <div className="apple-aperture-meter-row">
                  <div className="apple-aperture-meter-head">
                    <span>Lượng ánh sáng đi vào cảm biến</span>
                    <span className="apple-aperture-meter-val">{activeAperture.lightGain}</span>
                  </div>
                  <div className="apple-aperture-meter-track">
                    <div
                      className="apple-aperture-meter-fill"
                      style={{ width: `${activeAperture.lightPercent}%` }}
                    />
                  </div>
                </div>

                <div className="apple-aperture-meter-row">
                  <div className="apple-aperture-meter-head">
                    <span>Độ sâu trường ảnh (Vùng rõ nét)</span>
                    <span className="apple-aperture-meter-val">{activeAperture.focusType}</span>
                  </div>
                  <div className="apple-aperture-meter-track">
                    <div
                      className="apple-aperture-meter-fill"
                      style={{
                        width: `${activeAperture.dofPercent}%`,
                        background: "linear-gradient(90deg, #30d158 0%, #2997ff 100%)",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="apple-aperture-desc-box">
                {activeAperture.description}
              </div>

              <div className="apple-aperture-scenario">
                <span>🎯</span>
                <div>
                  <strong style={{ color: "#ffffff" }}>Tình huống chụp tối ưu:</strong>{" "}
                  {activeAperture.scenario}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. UNIBODY DESIGN & OFFICIAL COLOR SELECTOR */}
      <section id="finish-design" className="apple-titanium-section">
        <div className="apple-titanium-header">
          <span className="apple-iphone-eyebrow">Thiết Kế Titanium Cấp 5 Nguyên Khối</span>
          <h2>Bốn Màu Chính Thức. Đúng Chuẩn Apple.</h2>
          <p style={{ color: "#86868b", fontSize: "16px" }}>
            Hoàn thiện khung Titanium Cấp 5 nguyên khối siêu bền bỉ và nhẹ với bốn màu Đen, Bạc, Băng Thanh và
            <strong> Đỏ Burgundy</strong> theo tên gọi chính thức của Apple Việt Nam.
          </p>
        </div>

        <div className="apple-titanium-viewer-card">
          {/* Left: Device Visual Showcase */}
          <div className="apple-titanium-preview-stage">
            <div
              className="apple-titanium-halo"
              style={{ background: selectedColor.hex }}
            />
            <div className="apple-titanium-img-wrap">
              <Image
                src={selectedColor.image}
                alt={`${selectedModel.name} - ${selectedColor.name}`}
                width={700}
                height={700}
                className="apple-titanium-product-img"
              />
            </div>
          </div>

          {/* Right: Interactive Model & Color Selector */}
          <div className="apple-titanium-controls">
            {/* Model switch */}
            <div className="apple-titanium-control-group">
              <span className="apple-titanium-label">1. Kích thước màn hình Super Retina XDR</span>
              <div className="apple-model-pills">
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => setSelectedModelId(model.id)}
                    className={`apple-model-btn ${selectedModelId === model.id ? "active" : ""}`}
                  >
                    <span className="apple-model-btn-name">{model.name}</span>
                    <span className="apple-model-btn-sub">{model.screen}</span>
                    <span style={{ fontSize: "11px", color: "#ff6b87", marginTop: "2px" }}>
                      Từ {model.priceStarts}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color swatches */}
            <div className="apple-titanium-control-group">
              <span className="apple-titanium-label">2. Màu sắc hoàn thiện</span>
              <div className="apple-color-swatches-grid">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`apple-color-swatch-card ${selectedColor.id === color.id ? "active" : ""}`}
                  >
                    <div
                      className="apple-color-dot"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="apple-color-swatch-title">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Color Story */}
            <div className="apple-color-story">
              <h4 className="apple-color-story-title">
                {selectedColor.name} · {selectedColor.enName}
              </h4>
              <p className="apple-color-story-desc">
                {selectedColor.description}
              </p>
            </div>

            {/* Live Model Specs */}
            <div className="apple-mini-specs-grid">
              <div style={{ background: "#141418", padding: "10px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: "11px", color: "#86868b", display: "block" }}>Trọng lượng</span>
                <strong style={{ fontSize: "14px", color: "#ffffff" }}>{selectedModel.weight}</strong>
              </div>
              <div style={{ background: "#141418", padding: "10px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: "11px", color: "#86868b", display: "block" }}>Thời lượng pin</span>
                <strong style={{ fontSize: "14px", color: "#30d158" }}>{selectedModel.battery.split(" ")[2]} giờ</strong>
              </div>
              <div style={{ background: "#141418", padding: "10px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: "11px", color: "#86868b", display: "block" }}>Độ sáng tối đa</span>
                <strong style={{ fontSize: "14px", color: "#ff6b87" }}>3.000 nits</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BENTO GRID - PRO HARDWARE INNOVATIONS */}
      <section id="chip-a20pro" className="apple-iphone-bento-section">
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span className="apple-iphone-eyebrow">Sức Mạnh Vượt Xa Tưởng Tượng</span>
          <h2 style={{ fontSize: "clamp(34px, 5vw, 48px)", fontWeight: 800, margin: "0 0 16px" }}>
            Đỉnh Cao Công Nghệ Pro.
          </h2>
          <p style={{ color: "#86868b", fontSize: "16px", maxWidth: "700px", margin: "0 auto" }}>
            Từng linh kiện bên trong iPhone 18 Pro đều được tái định nghĩa để mang lại hiệu năng cao nhất,
            khả năng xử lý trí tuệ nhân tạo mượt mà nhất và thời lượng pin bền bỉ nhất.
          </p>
        </div>

        <div className="apple-iphone-bento-grid">
          {/* Card 1: A20 Pro Chip (Span 8) */}
          <div className="apple-iphone-bento-card span-8">
            <div>
              <span className="apple-iphone-bento-tag">Quy trình 2nm đầu tiên trên thế giới</span>
              <h3>Chip Apple A20 Pro. Quái thú hiệu năng.</h3>
              <p>
                Được chế tạo trên tiến trình 2nm tối tân với cấu trúc tản nhiệt buồng hơi đồng Vapor Chamber
                kết hợp lớp dẫn nhiệt Graphene mở rộng. GPU 6 lõi với công nghệ Ray Tracing bằng phần cứng thế hệ 3
                mang lại đồ họa game AAA trung thực đến kinh ngạc, không bao giờ lo tụt xung nhịp vì nhiệt độ.
              </p>
            </div>
            <div className="apple-bento-metrics-grid">
              <div style={{ background: "rgba(255,255,255,0.04)", padding: "16px", borderRadius: "16px" }}>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#ff6b87" }}>+40%</div>
                <div style={{ fontSize: "12px", color: "#86868b" }}>Hiệu năng Ray Tracing gaming AAA</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", padding: "16px", borderRadius: "16px" }}>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#30d158" }}>45 TOPS</div>
                <div style={{ fontSize: "12px", color: "#86868b" }}>Neural Engine AI on-device</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", padding: "16px", borderRadius: "16px" }}>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#2997ff" }}>-30%</div>
                <div style={{ fontSize: "12px", color: "#86868b" }}>Điện năng tiêu thụ ở tác vụ nặng</div>
              </div>
            </div>
          </div>

          {/* Card 2: 8x Telephoto (Span 4) */}
          <div className="apple-iphone-bento-card span-4">
            <div>
              <span className="apple-iphone-bento-tag">Tetraprism Zoom 8x</span>
              <h3>Ống kính tiềm vọng 200mm.</h3>
              <p>
                Công nghệ phản xạ ánh sáng 4 lần thế hệ 2 cho phép tiêu cự quang học vươn tới 200mm,
                chụp cận cảnh sân khấu âm nhạc hay động vật hoang dã rõ nét từng sợi lông mao.
              </p>
            </div>
            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <span style={{ fontSize: "56px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.04em" }}>8×</span>
              <span style={{ display: "block", fontSize: "13px", color: "#86868b" }}>Zoom quang học không giảm chất lượng</span>
            </div>
          </div>

          {/* Card 3: Camera Fusion System (Span 6) */}
          <div className="apple-iphone-bento-card span-6">
            <div>
              <span className="apple-iphone-bento-tag">Hệ thống 3 Camera Pro 48MP</span>
              <h3>Bộ ba cảm biến Fusion Pro 48MP.</h3>
              <p>
                Cả 3 camera: Main biến thiên ƒ/1.48–ƒ/4.0, Ultra Wide macro 2cm, và Telephoto 8x
                đều đạt độ phân giải 48MP siêu sắc nét, cho phép chụp ảnh ProRAW và quay video ProRes LOG 4K 120fps.
              </p>
            </div>
            <div className="apple-iphone-bento-media">
              <Image
                src="/apple-iphone-18-pro/camera-system.jpg"
                alt="Hệ thống camera Fusion Pro iPhone 18 Pro"
                width={800}
                height={400}
              />
            </div>
          </div>

          {/* Card 4: Apple Intelligence (Span 6) */}
          <div className="apple-iphone-bento-card span-6">
            <div>
              <span className="apple-iphone-bento-tag">Apple Intelligence</span>
              <h3>Trí tuệ cá nhân. Riêng tư tuyệt đối.</h3>
              <p>
                Siri mới hiểu ngữ cảnh cá nhân sâu sắc hơn, hỗ trợ biên tập văn bản,
                tạo ảnh Genmoji tức thì và tìm kiếm hình ảnh tự nhiên bằng tiếng Việt.
                Mọi tác vụ đều xử lý trực tiếp trên chip A20 Pro hoặc qua Điện Toán Đám Mây Riêng Tư an toàn.
              </p>
            </div>
            <div style={{ marginTop: "24px", background: "rgba(226, 59, 93, 0.08)", border: "1px solid rgba(226, 59, 93, 0.2)", borderRadius: "16px", padding: "20px" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#ff6b87", marginBottom: "6px" }}>
                🔒 Bảo mật cấp độ phần cứng
              </div>
              <div style={{ fontSize: "13px", color: "#a1a1a6" }}>
                Dữ liệu cá nhân không bao giờ được lưu trữ hay chia sẻ với Apple. Bạn nắm quyền kiểm soát 100%.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. COMPARISON TABLE: IPHONE 18 PRO VS IPHONE 17 PRO */}
      <section id="compare" className="apple-compare-section">
        <div className="apple-compare-header">
          <span className="apple-iphone-eyebrow">Tại Sao Nên Nâng Cấp Ngay?</span>
          <h2>So Sánh iPhone 18 Pro & iPhone 17 Pro</h2>
        </div>

        <div className="apple-compare-table-wrap">
          <table className="apple-compare-table">
            <thead>
              <tr>
                <th style={{ width: "34%" }}>Tính năng kỹ thuật</th>
                <th className="col-new" style={{ width: "33%" }}>
                  iPhone 18 Pro Series
                  <span className="apple-compare-pill">Mới nhất</span>
                </th>
                <th className="col-old" style={{ width: "33%" }}>iPhone 17 Pro Series</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="apple-compare-feature-label">Khẩu độ Camera chính</td>
                <td className="apple-compare-new-val">Cơ học biến thiên 4 bước ƒ/1.48–ƒ/4.0</td>
                <td className="apple-compare-old-val">Cố định ƒ/1.78</td>
              </tr>
              <tr>
                <td className="apple-compare-feature-label">Bộ vi xử lý</td>
                <td className="apple-compare-new-val">Chip Apple A20 Pro (2nm)</td>
                <td className="apple-compare-old-val">Chip Apple A18 Pro (3nm)</td>
              </tr>
              <tr>
                <td className="apple-compare-feature-label">Hệ thống tản nhiệt</td>
                <td className="apple-compare-new-val">Buồng hơi đồng Vapor Chamber + Graphene</td>
                <td className="apple-compare-old-val">Tấm nhôm tiêu chuẩn</td>
              </tr>
              <tr>
                <td className="apple-compare-feature-label">Ống kính Telephoto</td>
                <td className="apple-compare-new-val">8x Tetraprism (200mm) · 48MP</td>
                <td className="apple-compare-old-val">5x Tetraprism (120mm) · 12MP</td>
              </tr>
              <tr>
                <td className="apple-compare-feature-label">Viền màn hình</td>
                <td className="apple-compare-new-val">1.15 mm (Mỏng nhất thế giới)</td>
                <td className="apple-compare-old-val">1.44 mm</td>
              </tr>
              <tr>
                <td className="apple-compare-feature-label">Độ sáng màn hình ngoài trời</td>
                <td className="apple-compare-new-val">3.000 nits đỉnh sáng</td>
                <td className="apple-compare-old-val">2.000 nits</td>
              </tr>
              <tr>
                <td className="apple-compare-feature-label">Thời lượng pin (Pro Max)</td>
                <td className="apple-compare-new-val">Lên đến 33 giờ</td>
                <td className="apple-compare-old-val">Lên đến 29 giờ</td>
              </tr>
              <tr>
                <td className="apple-compare-feature-label">Dung lượng bộ nhớ</td>
                <td className="apple-compare-new-val">256GB · 512GB · 1TB · 2TB</td>
                <td className="apple-compare-old-val">128GB · 256GB · 512GB · 1TB</td>
              </tr>
              <tr>
                <td className="apple-compare-feature-label">Màu sắc độc quyền</td>
                <td className="apple-compare-new-val">Đỏ Burgundy, Băng Thanh</td>
                <td className="apple-compare-old-val">Titan Sa Mạc, Titan Tự Nhiên</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. CONFIGURATOR & PRE-ORDER FORM SECTION */}
      <section id="configurator" className="apple-mbp-config-section">
        <div className="apple-mbp-config-container">
          <div className="apple-mbp-config-header">
            <span className="apple-iphone-eyebrow">Chương Trình Đặt Trước Chính Hãng</span>
            <h2 className="apple-mbp-config-title">Đặt Trước iPhone 18 Pro. Cọc 0đ.</h2>
            <p className="apple-mbp-config-subtitle">
              Không cần thanh toán trước bất kỳ chi phí nào. Giữ trọn quyền ưu tiên nhận máy đợt 1
              ngay khi Apple mở bán tại Việt Nam kèm bộ quà độc quyền trị giá 5.000.000₫.
            </p>
          </div>

          <div className="apple-mbp-config-grid">
            {/* Left Column: Live Config Summary Card */}
            <div className="apple-mbp-summary-card">
              <div className="apple-mbp-summary-preview">
                <Image
                  src={selectedColor.image}
                  alt={selectedModel.name}
                  width={380}
                  height={380}
                  className="apple-mbp-summary-img"
                />
              </div>

              <div className="apple-mbp-summary-info">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#ff6b87", letterSpacing: "0.08em" }}>
                    Cấu hình đã chọn
                  </span>
                  <span style={{ fontSize: "12px", color: "#30d158", fontWeight: 600 }}>● Cọc 0đ giữ suất</span>
                </div>

                <h3 className="apple-mbp-summary-title">{selectedModel.name}</h3>
                <p className="apple-mbp-summary-specs">
                  {selectedStorage} · {selectedColor.name} · {selectedModel.screen}
                </p>

                <div className="apple-mbp-summary-price-box">
                  <span className="apple-mbp-summary-price-label">Giá dự kiến mở bán:</span>
                  <span className="apple-mbp-summary-price-value">{currentPriceEstimate}</span>
                  <span className="apple-mbp-summary-price-note">
                    * Giá chính thức theo quy định Apple Việt Nam tại thời điểm mở bán. Khách hàng nhận máy kiểm tra mới thanh toán.
                  </span>
                </div>

                <div className="apple-mbp-perks-list">
                  <div className="apple-mbp-perk-item">
                    <span className="apple-mbp-perk-icon">✓</span>
                    <span><strong>0đ Tiền cọc</strong>: Thoải mái thay đổi ý định hoặc hủy bất kỳ lúc nào</span>
                  </div>
                  <div className="apple-mbp-perk-item">
                    <span className="apple-mbp-perk-icon">✓</span>
                    <span><strong>Ưu tiên đợt 1</strong>: Cam kết nhận máy trong ngày mở bán đầu tiên</span>
                  </div>
                  <div className="apple-mbp-perk-item">
                    <span className="apple-mbp-perk-icon">✓</span>
                    <span><strong>Thu cũ đổi mới</strong>: Trợ giá thêm đến 5.000.000₫ lên đời iPhone 18</span>
                  </div>
                  <div className="apple-mbp-perk-item">
                    <span className="apple-mbp-perk-icon">✓</span>
                    <span><strong>Bảo hành chính hãng</strong>: 12 tháng Apple Care Việt Nam (VN/A)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Selection & Form */}
            <div className="apple-mbp-form-card">
              <form onSubmit={handleSubmit}>
                {/* Step 1: Choose Model */}
                <div className="apple-mbp-form-step">
                  <label className="apple-mbp-step-title">
                    <span className="apple-mbp-step-num">1</span>
                    Chọn dòng máy iPhone 18 Pro
                  </label>
                  <div className="apple-model-pills">
                    {MODELS.map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => setSelectedModelId(model.id)}
                        className={`apple-model-btn ${selectedModelId === model.id ? "active" : ""}`}
                      >
                        <span className="apple-model-btn-name">{model.name}</span>
                        <span className="apple-model-btn-sub">{model.screen}</span>
                        <span style={{ fontSize: "11px", color: "#ff6b87", marginTop: "2px" }}>
                          Từ {model.priceStarts}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Choose Storage */}
                <div className="apple-mbp-form-step" style={{ marginTop: "24px" }}>
                  <label className="apple-mbp-step-title">
                    <span className="apple-mbp-step-num">2</span>
                    Chọn dung lượng bộ nhớ
                  </label>
                  <div className="apple-storage-options-grid">
                    {STORAGE_TIERS.map((tier) => (
                      <button
                        key={tier.size}
                        type="button"
                        onClick={() => setSelectedStorage(tier.size)}
                        style={{
                          padding: "12px 6px",
                          borderRadius: "14px",
                          background: selectedStorage === tier.size ? "rgba(226, 59, 93, 0.12)" : "#141418",
                          border: `1px solid ${selectedStorage === tier.size ? "#ff6b87" : "rgba(255,255,255,0.1)"}`,
                          color: selectedStorage === tier.size ? "#ffffff" : "#86868b",
                          cursor: "pointer",
                          textAlign: "center",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <strong style={{ display: "block", fontSize: "14px", color: selectedStorage === tier.size ? "#ffffff" : "#d1d1d6" }}>
                          {tier.size}
                        </strong>
                        <span style={{ fontSize: "10px", color: "#86868b", display: "block", marginTop: "2px" }}>
                          {tier.note}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 3: Choose Color */}
                <div className="apple-mbp-form-step" style={{ marginTop: "24px" }}>
                  <label className="apple-mbp-step-title">
                    <span className="apple-mbp-step-num">3</span>
                    Chọn màu sắc hoàn thiện
                  </label>
                  <div className="apple-color-swatches-grid">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`apple-color-swatch-card ${selectedColor.id === color.id ? "active" : ""}`}
                      >
                        <div
                          className="apple-color-dot"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="apple-color-swatch-title">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 4: Branch Selection */}
                <div className="apple-mbp-form-step" style={{ marginTop: "24px" }}>
                  <label className="apple-mbp-step-title">
                    <span className="apple-mbp-step-num">4</span>
                    Chọn chi nhánh Infinity Store nhận máy
                  </label>

                  <div className="apple-mbp-branch-search">
                    <input
                      type="text"
                      value={branchQuery}
                      onChange={(e) => setBranchQuery(e.target.value)}
                      placeholder="Tìm theo tên đường, quận, thành phố..."
                      className="apple-mbp-input"
                    />
                  </div>

                  <div className="apple-mbp-branch-list">
                    {filteredBranches.map((branch) => (
                      <label
                        key={branch.id}
                        className={`apple-mbp-branch-option ${branchId === branch.id ? "active" : ""}`}
                      >
                        <input
                          type="radio"
                          name="branchSelection"
                          value={branch.id}
                          checked={branchId === branch.id}
                          onChange={() => setBranchId(branch.id)}
                          className="apple-mbp-radio"
                        />
                        <div className="apple-mbp-branch-content">
                          <strong className="apple-mbp-branch-name">{branch.name}</strong>
                          <span className="apple-mbp-branch-addr">{branch.address}</span>
                          <div className="apple-mbp-branch-meta">
                            <span>📞 {branch.phone}</span>
                            <span>⏰ {branch.hours}</span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Step 5: Customer Contact Info */}
                <div className="apple-mbp-form-step" style={{ marginTop: "24px" }}>
                  <label className="apple-mbp-step-title">
                    <span className="apple-mbp-step-num">5</span>
                    Thông tin liên hệ nhận máy
                  </label>

                  <div className="apple-mbp-input-grid">
                    <div>
                      <label className="apple-mbp-field-label">Họ và tên *</label>
                      <input
                        type="text"
                        name="customerName"
                        defaultValue={customer?.name || ""}
                        required
                        placeholder="Nguyễn Văn A"
                        className="apple-mbp-input"
                      />
                    </div>
                    <div>
                      <label className="apple-mbp-field-label">Số điện thoại nhận tin *</label>
                      <input
                        type="tel"
                        name="phone"
                        defaultValue={customer?.phone || ""}
                        required
                        placeholder="0912 345 678"
                        className="apple-mbp-input"
                      />
                    </div>
                  </div>

                  <div className="apple-mbp-input-grid" style={{ marginTop: "14px" }}>
                    <div>
                      <label className="apple-mbp-field-label">Email xác nhận (không bắt buộc)</label>
                      <input
                        type="email"
                        name="email"
                        defaultValue={customer?.email || ""}
                        placeholder="email@example.com"
                        className="apple-mbp-input"
                      />
                    </div>
                    <div>
                      <label className="apple-mbp-field-label">Khung giờ tiện liên hệ</label>
                      <select name="contactTime" className="apple-mbp-input" defaultValue="Bất kỳ thời gian nào">
                        <option value="Bất kỳ thời gian nào">Bất kỳ thời gian nào</option>
                        <option value="Buổi sáng (8h00 - 12h00)">Buổi sáng (8h00 - 12h00)</option>
                        <option value="Buổi chiều (13h30 - 17h30)">Buổi chiều (13h30 - 17h30)</option>
                        <option value="Buổi tối (18h00 - 21h00)">Buổi tối (18h00 - 21h00)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: "14px" }}>
                    <label className="apple-mbp-field-label">Ghi chú thêm (Thu cũ đổi mới, trả góp...)</label>
                    <textarea
                      name="note"
                      rows={2}
                      placeholder="Ví dụ: Mình muốn mang iPhone 15 Pro Max cũ đến thẩm định trợ giá lên đời..."
                      className="apple-mbp-input"
                    />
                  </div>
                </div>

                {/* Error Box */}
                {error && (
                  <div className="apple-mbp-error-box" role="alert">
                    <span>⚠️ {error}</span>
                  </div>
                )}

                {/* Submit Action Button */}
                <div style={{ marginTop: "32px" }}>
                  <button
                    type="submit"
                    disabled={sending}
                    className="apple-iphone-btn-primary"
                    style={{ width: "100%", justifyContent: "center", padding: "16px", fontSize: "16px", cursor: sending ? "not-allowed" : "pointer" }}
                  >
                    {sending ? "Đang xử lý đăng ký..." : "Xác nhận Đặt Trước 0đ Tiền Cọc ›"}
                  </button>
                  <p style={{ textAlign: "center", fontSize: "12px", color: "#86868b", marginTop: "12px" }}>
                    🔒 Cam kết bảo mật thông tin theo tiêu chuẩn Apple Store. Không thu phí trước.
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Submission Result / Confirmation */}
          {result && (
            <div id="preorder-result" className="apple-mbp-result-card" style={{ marginTop: "48px" }}>
              <div className="apple-mbp-result-icon">✓</div>
              <h3 className="apple-mbp-result-title">Đăng Ký Đặt Trước Thành Công!</h3>
              <p className="apple-mbp-result-desc">
                Chúc mừng bạn đã giữ thành công suất nhận <strong>{result.modelName} ({result.storage} · {result.colorName})</strong> đợt 1.
              </p>

              <div className="apple-mbp-result-code-box">
                <span className="apple-mbp-result-code-label">MÃ ĐẶT TRƯỚC ƯU TIÊN</span>
                <span className="apple-mbp-result-code">{result.orderCode}</span>
              </div>

              <div className="apple-mbp-result-branch-info">
                <h4>Chi nhánh nhận máy đã chọn:</h4>
                <p><strong>{result.branch.name}</strong></p>
                <p>{result.branch.address}</p>
                <p>Hotline hỗ trợ: <strong>{result.branch.phone}</strong> · Giờ phục vụ: {result.branch.hours}</p>
              </div>

              <div className="apple-mbp-result-actions">
                <Link href="/" className="apple-mbp-btn-secondary">
                  Về trang chủ
                </Link>
                <a href="#overview" className="apple-iphone-btn-primary">
                  Khám phá thêm tính năng ›
                </a>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
