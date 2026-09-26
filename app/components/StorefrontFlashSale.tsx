"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export interface FlashSaleItem {
  slug: string;
  name: string;
  image: string;
  price: string;
  oldPrice?: string;
  discountBadge?: string;
  soldCount?: number;
  totalCount?: number;
}

interface FlashSaleProps {
  products: FlashSaleItem[];
}

export default function StorefrontFlashSale({ products }: FlashSaleProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 28, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDigit = (num: number) => String(num).padStart(2, "0");

  if (!products || products.length === 0) return null;

  return (
    <section className="cps-container" aria-label="Khuyến mãi giờ vàng">
      <div className="cps-flashsale-section">
        {/* Header with Flame and Countdown */}
        <div className="cps-flashsale-header">
          <div className="cps-flashsale-title">
            <span className="cps-flashsale-flame" aria-hidden="true">🔥</span>
            <h2>HOT SALE GIỜ VÀNG</h2>
          </div>

          <div className="cps-countdown">
            <span className="cps-countdown-label">KẾT THÚC SAU:</span>
            <span className="cps-countdown-box">{formatDigit(timeLeft.hours)}</span>
            <span className="cps-countdown-sep">:</span>
            <span className="cps-countdown-box">{formatDigit(timeLeft.minutes)}</span>
            <span className="cps-countdown-sep">:</span>
            <span className="cps-countdown-box">{formatDigit(timeLeft.seconds)}</span>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="cps-flashsale-grid">
          {products.slice(0, 5).map((item, i) => {
            const sold = item.soldCount || 15 + i * 7;
            const total = item.totalCount || 50;
            const percent = Math.min(100, Math.round((sold / total) * 100));

            return (
              <Link
                key={item.slug}
                href={`/san-pham/${item.slug}`}
                className="cps-product-card"
              >
                <div className="cps-card-badges">
                  <span className="cps-badge-discount">{item.discountBadge || `Giảm ${10 + i * 5}%`}</span>
                  <span className="cps-badge-installment">Trả góp 0%</span>
                </div>

                <div className="cps-card-media">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={180}
                    height={180}
                    unoptimized
                  />
                </div>

                <div className="cps-card-body">
                  <h3 className="cps-card-name" title={item.name}>{item.name}</h3>

                  <div className="cps-card-prices">
                    <span className="cps-price-current">{item.price}</span>
                    {item.oldPrice && <span className="cps-price-old">{item.oldPrice}</span>}
                  </div>

                  <div className="cps-member-box">
                    <span>👑 Infinity Member giảm thêm đến 350.000₫</span>
                  </div>

                  {/* Sold Progress Bar */}
                  <div className="cps-sold-bar-wrap">
                    <div className="cps-sold-bar">
                      <div className="cps-sold-progress" style={{ width: `${percent}%` }} />
                      <span className="cps-sold-text">🔥 Đã bán {sold}/{total}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
