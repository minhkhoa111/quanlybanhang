import Link from "next/link";
import Image from "next/image";
import "./IPhone18ProAdBanner.css";

interface IPhone18ProAdBannerProps {
  variant?: "full" | "compact";
}

export default function IPhone18ProAdBanner({ variant = "full" }: IPhone18ProAdBannerProps) {
  if (variant === "compact") {
    return (
      <aside className="apple-iphone-ad-compact" aria-label="Quảng cáo iPhone 18 Pro chính hãng">
        <div className="apple-iphone-ad-compact-inner">
          <div className="apple-iphone-ad-compact-left">
            <div className="apple-iphone-ad-thumb">
              <Image
                src="/apple-iphone-18-pro/contrast-18pro.jpg"
                alt="iPhone 18 Pro Titan Đỏ Rượu"
                fill
                sizes="64px"
                className="apple-iphone-ad-thumb-img"
              />
            </div>
            <div>
              <div className="apple-iphone-ad-compact-tag">
                <span> FLAGSHIP 2026</span>
                <span className="apple-iphone-ad-badge-dot">●</span>
                <span style={{ color: "#ff6b87" }}>MÀU MỚI: TITAN ĐỎ RƯỢU</span>
              </div>
              <strong className="apple-iphone-ad-compact-title">
                iPhone 18 Pro: Một nâng cấp quan trọng. Khẩu độ cơ học 4 bước ƒ/1.48–ƒ/4.0.
              </strong>
            </div>
          </div>

          <div className="apple-iphone-ad-compact-actions">
            <Link href="/dat-truoc?device=iphone" className="apple-iphone-ad-btn-secondary">
              Xem thêm về iPhone 18 Pro ›
            </Link>
            <Link href="/dat-truoc?device=iphone#configurator" className="apple-iphone-ad-btn-primary">
              Đặt trước 0đ cọc
            </Link>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <section className="apple-iphone-ad-billboard" aria-label="Quảng cáo iPhone 18 Pro Apple Flagship">
      <div className="apple-iphone-ad-halo" aria-hidden="true" />
      
      <div className="apple-iphone-ad-container">
        {/* Left Side: Editorial & Value Proposition */}
        <div className="apple-iphone-ad-copy">
          <div className="apple-iphone-ad-eyebrow">
            <span className="apple-logo-mark"></span>
            <span>APPLE KEYNOTE FLAGSHIP · ĐẶT TRƯỚC 0Đ</span>
          </div>

          <h2 className="apple-iphone-ad-title">
            iPhone 18 Pro
            <span className="apple-iphone-ad-headline">Một nâng cấp quan trọng.</span>
          </h2>

          <p className="apple-iphone-ad-desc">
            Thiết kế Titan Cấp 5 với màu <strong>Titan Đỏ Rượu (Burgundy)</strong> hoàn toàn mới.
            Lần đầu tiên trang bị <strong>khẩu độ biến thiên cơ học 4 bước ƒ/1.48–ƒ/4.0</strong>,
            chip <strong>Apple A20 Pro 2nm</strong> tản nhiệt buồng hơi Vapor Chamber và zoom quang học 8x Tetraprism.
          </p>

          {/* Key specs row */}
          <div className="apple-iphone-ad-specs-row">
            <div className="apple-iphone-ad-spec-box">
              <span className="apple-iphone-ad-spec-val">ƒ/1.48–ƒ/4.0</span>
              <span className="apple-iphone-ad-spec-lbl">Khẩu độ cơ học 4 bước</span>
            </div>
            <div className="apple-iphone-ad-spec-box">
              <span className="apple-iphone-ad-spec-val">A20 Pro</span>
              <span className="apple-iphone-ad-spec-lbl">Chip 2nm tản buồng hơi</span>
            </div>
            <div className="apple-iphone-ad-spec-box">
              <span className="apple-iphone-ad-spec-val">8× Zoom</span>
              <span className="apple-iphone-ad-spec-lbl">Tetraprism tiềm vọng 200mm</span>
            </div>
            <div className="apple-iphone-ad-spec-box">
              <span className="apple-iphone-ad-spec-val">0đ Cọc</span>
              <span className="apple-iphone-ad-spec-lbl">Bảo lưu suất giao đợt 1</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="apple-iphone-ad-actions">
            <Link href="/dat-truoc?device=iphone" className="apple-iphone-ad-btn-primary">
              Xem thêm về iPhone 18 Pro ›
            </Link>
            <Link href="/dat-truoc?device=iphone#configurator" className="apple-iphone-ad-btn-secondary">
              Đặt trước 0đ cọc (Cấu hình máy)
            </Link>
          </div>

          <div className="apple-iphone-ad-guarantee">
            <span style={{ color: "#30d158" }}>✓</span>
            <span>Không thu tiền cọc · Thoải mái đổi ý · Nhận máy kiểm tra mới thanh toán tại các chi nhánh</span>
          </div>
        </div>

        {/* Right Side: Product Visual Showcase */}
        <div className="apple-iphone-ad-media">
          <Link href="/dat-truoc?device=iphone" className="apple-iphone-ad-media-link" aria-label="Xem chi tiết iPhone 18 Pro">
            <div className="apple-iphone-ad-image-wrap">
              <Image
                src="/apple-iphone-18-pro/hero-iphone-18-pro.jpg"
                alt="Quảng cáo iPhone 18 Pro và iPhone 18 Pro Max chính thức từ Apple"
                width={720}
                height={540}
                priority
                className="apple-iphone-ad-product-img"
              />
              <div className="apple-iphone-ad-float-tag">
                <span>Khẩu độ biến thiên ƒ/1.48–ƒ/4.0</span>
                <strong>Mới nhất từ Apple</strong>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
