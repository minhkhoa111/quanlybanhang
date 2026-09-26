"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface DeviceColor {
  name: string;
  hex: string;
  halo: string;
}

interface HeroDevice {
  id: string;
  slug: string;
  kicker: string;
  title: string;
  accent: string;
  description: string;
  price: string;
  image: string;
  haloColor: string;
  badges: string[];
  specs: { icon: string; label: string }[];
  colors: DeviceColor[];
  floatingBadges: { title: string; subtitle: string; icon: string }[];
}

const HERO_DEVICES: HeroDevice[] = [
  {
    id: "iphone",
    slug: "iphone-17-pro-max",
    kicker: "Apple Flagship · Titan Grade 5",
    title: "iPhone 17 Pro Max",
    accent: "Titanium Hoàn Hảo",
    description:
      "Khung viền Titan cấp hàng không vũ trụ siêu bền, siêu nhẹ. Chip A19 Pro 3nm mạnh mẽ dẫn đầu kỉ nguyên Apple Intelligence. Phím Camera Control thế hệ mới.",
    price: "Từ 34.990.000₫",
    image: "/hero-products/iphone-17-pro-cutout.png",
    haloColor: "rgba(201, 160, 112, 0.45)",
    badges: ["Titanium Grade 5", "A19 Pro 3nm", "ProMotion 120Hz", "Apple Intelligence"],
    specs: [
      { icon: "⚡", label: "Chip A19 Pro 3nm" },
      { icon: "✦", label: "Camera 48MP Fusion" },
      { icon: "🛡️", label: "Titanium Grade 5" },
      { icon: "🔋", label: "Pin trâu 33 giờ" },
    ],
    colors: [
      { name: "Titan Sa Mạc", hex: "#c9a070", halo: "rgba(201, 160, 112, 0.3)" },
      { name: "Titan Tự Nhiên", hex: "#9a958e", halo: "rgba(33, 172, 224, 0.22)" },
      { name: "Titan Đen", hex: "#232426", halo: "rgba(0, 136, 204, 0.22)" },
      { name: "Titan Trắng", hex: "#f0eee9", halo: "rgba(33, 172, 224, 0.2)" },
    ],
    floatingBadges: [
      { title: "Apple Intelligence", subtitle: "Tích hợp sâu trong iOS", icon: "✦" },
      { title: "Camera Control 48MP", subtitle: "Chụp và quay chuẩn Pro", icon: "📸" },
    ],
  },
  {
    id: "macbook",
    slug: "macbook-pro-14-inch-m5-16gb-1tb",
    kicker: "Apple Pro Workstation · M4 Max & M5",
    title: "MacBook Pro M4 Max / M5",
    accent: "Quái Vật Đồ Họa & Code AI",
    description:
      "Màn hình Liquid Retina XDR Tandem OLED đỉnh cao với độ sáng cực đại 2000 nits. Kiến trúc GPU thế hệ mới với Dynamic Caching và Ray Tracing bằng phần cứng.",
    price: "Từ 49.990.000₫",
    image: "/hero-products/macbook-air-13-m5-cutout.png",
    haloColor: "rgba(41, 151, 255, 0.35)",
    badges: ["M4 Max 16-Core", "Liquid Retina XDR", "128GB Unified Memory", "Pin 24 giờ"],
    specs: [
      { icon: "⚡", label: "M4 Max / M5 Pro" },
      { icon: "🖥️", label: "XDR Tandem OLED" },
      { icon: "🚀", label: "Băng thông 546GB/s" },
      { icon: "🔋", label: "Pin đến 24 giờ" },
    ],
    colors: [
      { name: "Space Black (Đen Không Gian)", hex: "#1e1e21", halo: "rgba(0, 136, 204, 0.25)" },
      { name: "Silver (Bạc Ánh Kim)", hex: "#e2e3e5", halo: "rgba(33, 172, 224, 0.2)" },
    ],
    floatingBadges: [
      { title: "Liquid Retina XDR", subtitle: "2000 nits đỉnh cao", icon: "🖥️" },
      { title: "Unified Memory", subtitle: "Tốc độ băng thông 546GB/s", icon: "⚡" },
    ],
  },
  {
    id: "ipad",
    slug: "ipad-pro-11-m5",
    kicker: "Siêu Mỏng Đột Phá · M5 Ultra-Thin",
    title: "iPad Pro M5 Tandem OLED",
    accent: "Độ Mỏng Không Tưởng 5.1mm",
    description:
      "Thiết bị mỏng nhất trong lịch sử Apple nhưng ẩn chứa sức mạnh khổng lồ của chip M5. Màn hình Ultra Retina XDR Tandem OLED đột phá kết hợp cùng Apple Pencil Pro.",
    price: "Từ 27.990.000₫",
    image: "/hero-products/ipad-pro-11-m5-cutout.png",
    haloColor: "rgba(33, 172, 224, 0.3)",
    badges: ["Mỏng 5.1mm", "Chip M5 Siêu Cấp", "Tandem OLED 120Hz", "Apple Pencil Pro"],
    specs: [
      { icon: "📐", label: "Độ mỏng 5.1mm" },
      { icon: "⚡", label: "Chip M5 thế hệ mới" },
      { icon: "✏️", label: "Apple Pencil Pro" },
      { icon: "✨", label: "Ultra Retina XDR" },
    ],
    colors: [
      { name: "Đen Không Gian", hex: "#1c1d20", halo: "rgba(0, 136, 204, 0.22)" },
      { name: "Bạc Ánh Kim", hex: "#e5e5ea", halo: "rgba(33, 172, 224, 0.2)" },
    ],
    floatingBadges: [
      { title: "Kỉ lục mỏng 5.1mm", subtitle: "Nhẹ nhàng và cứng cáp", icon: "📐" },
      { title: "Apple Pencil Pro", subtitle: "Cảm ứng bóp Haptic Engine", icon: "✏️" },
    ],
  },
  {
    id: "gaming-laptop",
    slug: "laptop",
    kicker: "Extreme Tech · RTX 5090 GDDR7",
    title: "ASUS ROG Strix Scar & Razer Pro",
    accent: "Sức Mạnh Đồ Họa Tối Thượng",
    description:
      "Trang bị card đồ họa NVIDIA GeForce RTX 5090 24GB VRAM GDDR7 mới nhất, vi xử lý Intel Core Ultra 9 / AMD Ryzen AI 9. Màn hình 4K Mini-LED 240Hz chuẩn màu đồ họa.",
    price: "Từ 54.990.000₫",
    image: "/products/laptops/asus-rog-strix-scar-18-g835lx.png",
    haloColor: "rgba(16, 185, 129, 0.3)",
    badges: ["RTX 5090 24GB GDDR7", "Core Ultra 9 AI", "Mini-LED 240Hz", "Buồng hơi Vapor Chamber"],
    specs: [
      { icon: "🎮", label: "RTX 5090 GDDR7" },
      { icon: "⚡", label: "Core Ultra 9 / Ryzen AI" },
      { icon: "🖥️", label: "Mini-LED 240Hz 4K" },
      { icon: "❄️", label: "Kim loại lỏng Conductonaut" },
    ],
    colors: [
      { name: "Eclipse Stealth Black", hex: "#1a1c22", halo: "rgba(16, 185, 129, 0.25)" },
      { name: "Cyberpunk Titanium", hex: "#353942", halo: "rgba(0, 136, 204, 0.25)" },
    ],
    floatingBadges: [
      { title: "NVIDIA RTX 5090", subtitle: "24GB VRAM GDDR7 cực khủng", icon: "🎮" },
      { title: "Vapor Chamber 3 Fans", subtitle: "Tản nhiệt mát lạnh êm ái", icon: "❄️" },
    ],
  },
];

export default function AppleHero3D() {
  const [activeDeviceIndex, setActiveDeviceIndex] = useState(0);
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const device = HERO_DEVICES[activeDeviceIndex];
  const activeColor = device.colors[activeColorIndex] ?? device.colors[0];

  // Switch device and reset color
  const selectDevice = (index: number) => {
    setActiveDeviceIndex(index);
    setActiveColorIndex(0);
  };

  // 3D Tilt calculation based on mouse coordinates
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -16;
    const rotateY = ((x - centerX) / centerX) * 18;

    card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
    card.style.setProperty("--mouse-x", `${(x / rect.width) * 100}%`);
    card.style.setProperty("--mouse-y", `${(y / rect.height) * 100}%`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  // Touch event handlers for mobile touchscreens
  const handleTouchStart = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card || !e.touches[0]) return;

    const touch = e.touches[0];
    const rect = card.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = Math.max(-14, Math.min(14, ((y - centerY) / centerY) * -14));
    const rotateY = Math.max(-16, Math.min(16, ((x - centerX) / centerX) * 16));

    card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    card.style.setProperty("--mouse-x", `${(x / rect.width) * 100}%`);
    card.style.setProperty("--mouse-y", `${(y / rect.height) * 100}%`);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsHovered(false);
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  }, []);

  // Auto rotate devices when not interacting
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveDeviceIndex((prev) => (prev + 1) % HERO_DEVICES.length);
      setActiveColorIndex(0);
    }, 8000);
    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <section
      className="apple-hero-3d-stage"
      ref={stageRef}
      aria-label="Sân khấu giới thiệu sản phẩm Apple & Laptop 3D"
      style={{
        background: "radial-gradient(circle at 50% 18%, #eaf4fd 0%, #ffffff 60%, #f1f5f9 100%)",
        color: "#0f172a",
      }}
    >
      <div className="apple-hero-bg-lights">
        <div
          className="apple-light-orb apple-light-orb-1"
          style={{ background: `radial-gradient(circle, ${activeColor.halo} 0%, transparent 70%)` }}
        />
        <div className="apple-light-orb apple-light-orb-2" />
      </div>

      <div className="shell">
        <div className="apple-hero-grid">
          {/* Left Column: Product Information & Specs */}
          <div className="apple-hero-info">
            <div
              className="apple-hero-badge-strip"
              style={{
                background: "#ffffff",
                border: "1.5px solid #d0e6f9",
                boxShadow: "0 4px 14px rgba(0, 136, 204, 0.1)",
              }}
            >
              <span className="apple-icon" style={{ color: "#0088cc" }}></span>
              <span style={{ color: "#0088cc" }}>{device.kicker}</span>
            </div>

            <h1 className="apple-hero-title" style={{ color: "#0f172a" }}>
              <span className="apple-hero-title-gradient" style={{ color: "#0f172a" }}>{device.title}</span>
              <span
                className="apple-hero-title-accent"
                style={{
                  background: "linear-gradient(90deg, #0088cc 0%, #21ace0 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {device.accent}
              </span>
            </h1>

            <p className="apple-hero-desc" style={{ color: "#475569" }}>{device.description}</p>

            {/* Spec Pills */}
            <div className="apple-hero-specs-row">
              {device.specs.map((spec, i) => (
                <div
                  className="apple-spec-pill"
                  key={i}
                  style={{
                    background: "#ffffff",
                    border: "1.5px solid #e2e8f0",
                    color: "#334155",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <span>{spec.icon}</span>
                  <span>{spec.label}</span>
                </div>
              ))}
            </div>

            {/* Color Switcher */}
            <div className="apple-hero-colors">
              <span className="apple-hero-colors-label" style={{ color: "#475569" }}>
                Màu sắc: {activeColor.name}
              </span>
              <div style={{ display: "flex", gap: "10px" }}>
                {device.colors.map((color, i) => (
                  <button
                    key={color.name}
                    type="button"
                    className={`apple-color-btn ${i === activeColorIndex ? "is-active" : ""}`}
                    style={{ backgroundColor: color.hex }}
                    onClick={() => setActiveColorIndex(i)}
                    aria-label={color.name}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Pricing & Call to Actions */}
            <div className="apple-hero-cta-box">
              <div className="apple-hero-price-display">
                <span style={{ color: "#64748b" }}>Giá niêm yết ưu đãi</span>
                <strong style={{ color: "#e8790a" }}>{device.price}</strong>
              </div>

              <Link
                className="apple-hero-btn-primary"
                href={device.slug === "laptop" ? "/laptop" : `/san-pham/${device.slug}`}
                style={{
                  background: "linear-gradient(135deg, #0088cc 0%, #0072aa 100%)",
                  color: "#ffffff",
                  boxShadow: "0 8px 22px rgba(0, 136, 204, 0.35)",
                }}
              >
                <span>Mua ngay với Apple Pay</span>
                <span aria-hidden="true">→</span>
              </Link>

              <Link
                className="apple-hero-btn-secondary"
                href="/tu-van"
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #cbd5e1",
                  color: "#0f172a",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                }}
              >
                <span>Tư vấn đặt trước</span>
              </Link>
            </div>
          </div>

          {/* Right Column: 3D Interactive Device Showcase */}
          <div
            className="apple-hero-visual-3d"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="apple-3d-card-stage" ref={cardRef}>
              {/* Specular Glare Effect following cursor */}
              <div className="apple-specular-glare" />

              {/* Halo Glow behind the device */}
              <div
                className="apple-device-halo"
                style={{
                  background: `radial-gradient(circle, ${activeColor.halo} 0%, transparent 70%)`,
                }}
              />

              {/* Floating 3D Badges */}
              {device.floatingBadges[0] && (
                <div
                  className="apple-3d-floating-badge badge-top-left"
                  style={{
                    background: "rgba(255, 255, 255, 0.95)",
                    border: "1.5px solid #d0e6f9",
                    color: "#0f172a",
                    boxShadow: "0 10px 30px rgba(0, 136, 204, 0.15)",
                  }}
                >
                  <div
                    className="apple-badge-icon"
                    style={{ background: "#e8f4fd", color: "#0088cc" }}
                  >
                    {device.floatingBadges[0].icon}
                  </div>
                  <div>
                    <strong style={{ color: "#0f172a" }}>{device.floatingBadges[0].title}</strong>
                    <span style={{ color: "#64748b" }}>{device.floatingBadges[0].subtitle}</span>
                  </div>
                </div>
              )}

              {device.floatingBadges[1] && (
                <div
                  className="apple-3d-floating-badge badge-bottom-right"
                  style={{
                    background: "rgba(255, 255, 255, 0.95)",
                    border: "1.5px solid #d0e6f9",
                    color: "#0f172a",
                    boxShadow: "0 10px 30px rgba(0, 136, 204, 0.15)",
                  }}
                >
                  <div
                    className="apple-badge-icon"
                    style={{ background: "#e8f4fd", color: "#0088cc" }}
                  >
                    {device.floatingBadges[1].icon}
                  </div>
                  <div>
                    <strong style={{ color: "#0f172a" }}>{device.floatingBadges[1].title}</strong>
                    <span style={{ color: "#64748b" }}>{device.floatingBadges[1].subtitle}</span>
                  </div>
                </div>
              )}

              {/* 3D Device Cutout Image */}
              <div className="apple-device-image-wrap">
                <Image
                  src={device.image}
                  alt={device.title}
                  width={680}
                  height={560}
                  priority
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Carousel Device Selector */}
        <div className="apple-hero-devices-nav" role="tablist" aria-label="Chọn thiết bị trưng bày 3D">
          {HERO_DEVICES.map((d, index) => {
            const isActive = index === activeDeviceIndex;
            return (
              <button
                key={d.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`apple-hero-device-tab ${isActive ? "is-active" : ""}`}
                onClick={() => selectDevice(index)}
                style={{
                  background: "#ffffff",
                  border: isActive ? "2px solid #0088cc" : "1.5px solid #e2e8f0",
                  color: isActive ? "#0088cc" : "#334155",
                  boxShadow: isActive
                    ? "0 6px 20px rgba(0, 136, 204, 0.2)"
                    : "0 2px 6px rgba(0, 0, 0, 0.03)",
                }}
              >
                <span style={{ fontSize: "20px" }}>
                  {d.id === "iphone" ? "📱" : d.id === "macbook" ? "💻" : d.id === "ipad" ? "📋" : "⚡"}
                </span>
                <div>
                  <strong style={{ color: isActive ? "#0088cc" : "#0f172a" }}>{d.title}</strong>
                  <span style={{ color: "#e8790a" }}>{d.price}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

