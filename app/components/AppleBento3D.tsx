"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AppleBento3D() {
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 28, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="apple-bento-section" aria-label="Khuyến mãi nổi bật và Đột phá công nghệ">
      <div className="shell">
        <header className="apple-bento-header">
          <p className="apple-bento-eyebrow">Tuấn Digi · Ưu Đãi &amp; Công Nghệ Đỉnh Cao</p>
          <h2 className="apple-bento-title">Sản Phẩm Apple &amp; Laptop Chính Hãng</h2>
          <p className="apple-bento-subtitle">
            Hệ sinh thái Apple chính hãng kết hợp cùng các dòng Laptop Gaming &amp; Đồ họa mạnh mẽ nhất với giá tốt nhất thị trường.
          </p>
        </header>

        <div className="apple-bento-grid">
          {/* Card 1: Sale Hot Giờ Vàng (Tuấn Digi Signature Banner) */}
          <article className="apple-bento-card card-siri">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontSize: "20px" }}>⚡</span>
                <strong style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 900 }}>
                  SALE HOT GIỜ VÀNG
                </strong>
              </div>
              <h3 style={{ margin: "0 0 10px", fontSize: "28px", fontWeight: 900 }}>
                Giảm Đến 5.000.000₫ Hôm Nay
              </h3>
              <p style={{ fontSize: "15px", maxWidth: "460px", lineHeight: 1.5 }}>
                Áp dụng cho các dòng iPhone 16/17 Series, MacBook Pro M4/M5 và Laptop Gaming cao cấp. Số lượng ưu đãi có hạn.
              </p>
            </div>

            {/* Countdown Box */}
            <div style={{ marginTop: "24px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.9 }}>
                Thời gian còn lại:
              </span>
              <div className="tdg-countdown-box">
                <div className="tdg-countdown-unit">
                  <b>{String(timeLeft.hours).padStart(2, "0")}</b>
                  <small>Giờ</small>
                </div>
                <div className="tdg-countdown-unit">
                  <b>{String(timeLeft.minutes).padStart(2, "0")}</b>
                  <small>Phút</small>
                </div>
                <div className="tdg-countdown-unit">
                  <b>{String(timeLeft.seconds).padStart(2, "0")}</b>
                  <small>Giây</small>
                </div>
              </div>
            </div>
          </article>

          {/* Card 2: Trả Góp 0% Lãi Suất */}
          <article className="apple-bento-card card-tradein">
            <div>
              <span className="apple-bento-badge" style={{ color: "#0284c7" }}>
                <span>💳</span> Infinity Tài Chính
              </span>
              <h3 style={{ color: "#0369a1", fontSize: "24px", fontWeight: 900 }}>
                Trả Góp 0% Lãi Suất Linh Hoạt
              </h3>
              <p style={{ color: "#075985", fontSize: "14px", lineHeight: 1.5 }}>
                Thủ tục online nhanh gọn chỉ trong 5 phút, hỗ trợ tất cả dòng máy iPhone, iPad, MacBook chính hãng với 0% lãi suất.
              </p>
            </div>

            <div style={{ marginTop: "20px" }}>
              <div style={{ fontSize: "36px", fontWeight: 900, color: "#0284c7" }}>0%</div>
              <small style={{ color: "#0369a1", fontWeight: 700 }}>Duyệt online siêu tốc 5 phút</small>
              <div style={{ marginTop: "12px" }}>
                <Link
                  href="/tra-gop"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#0284c7",
                    textDecoration: "none",
                  }}
                >
                  Mô phỏng khoản góp ngay <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </article>

          {/* Card 3: Apple Intelligence & Titan Grade 5 */}
          <article className="apple-bento-card card-mchip">
            <div>
              <span className="apple-bento-badge">
                <span></span> Apple Intelligence
              </span>
              <h3>Trí Tuệ Nhân Tạo &amp; Titan Grade 5</h3>
              <p>
                Khung Titan siêu nhẹ, độ bền vượt trội cùng chip A19 Pro và M4/M5 thế hệ mới hỗ trợ xử lý AI trực tiếp trên máy.
              </p>
            </div>
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "30px", fontWeight: 900, color: "#0088cc" }}>3nm Pro</div>
              <small style={{ color: "#64748b", fontWeight: 600 }}>Tiến trình chip mạnh mẽ nhất</small>
            </div>
          </article>

          {/* Card 4: Laptop RTX 5090 GDDR7 */}
          <article className="apple-bento-card card-gaming">
            <div>
              <span className="apple-bento-badge" style={{ color: "#10b981" }}>
                <span>🎮</span> Gaming &amp; Đồ Họa AI
              </span>
              <h3>RTX 5090 24GB VRAM GDDR7</h3>
              <p>
                Sức mạnh tối thượng từ kiến trúc NVIDIA Blackwell và Intel Core Ultra 9, màn hình 4K Mini-LED 240Hz.
              </p>
            </div>
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "30px", fontWeight: 900, color: "#10b981" }}>240Hz 4K</div>
              <small style={{ color: "#64748b", fontWeight: 600 }}>Tần số quét siêu mượt chuẩn Esports</small>
            </div>
          </article>

          {/* Card 5: Trả Góp 0% Linh Hoạt */}
          <article className="apple-bento-card card-titanium">
            <div>
              <span className="apple-bento-badge" style={{ color: "#e8790a" }}>
                <span>%</span> Tài Chính Tiện Lợi
              </span>
              <h3>Trả Góp 0% Lãi Suất</h3>
              <p>
                Liên kết FE Credit, HD Saison, Kredivo, Shinhan Finance. Chỉ cần CCCD, duyệt hồ sơ 15 phút, nhận máy ngay.
              </p>
            </div>
            <div style={{ marginTop: "16px" }}>
              <Link
                href="/tra-gop"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#0088cc",
                  textDecoration: "none",
                }}
              >
                Mô phỏng khoản góp ngay <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
