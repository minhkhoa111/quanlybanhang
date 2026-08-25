"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { products } from "../products";

const featuredSlugs = ["iphone-17-pro", "macbook-air-13-m5", "ipad-pro-11-m5"];

const categoryMeta: Record<string, { label: string; href: string; index: string }> = {
  iphone: { label: "iPhone", href: "/iphone", index: "01" },
  macbook: { label: "MacBook", href: "/macbook", index: "02" },
  ipad: { label: "iPad", href: "/ipad", index: "03" },
};

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const slides = useMemo(
    () =>
      featuredSlugs.flatMap((slug) => {
        const product = products.find((item) => item.slug === slug);
        return product ? [product] : [];
      }),
    [],
  );

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % slides.length),
      6500,
    );
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;

  const active = slides[index];
  const meta = categoryMeta[active.category] ?? {
    label: active.category,
    href: `/${active.category}`,
    index: String(index + 1).padStart(2, "0"),
  };
  const price = active.sellingPrice ?? active.salePrice ?? active.price;

  const move = (direction: number) => {
    setIndex((current) => (current + direction + slides.length) % slides.length);
  };

  return (
    <section className="vibe-hero shell" aria-label="Sản phẩm nổi bật">
      <div className="vibe-hero-stage" key={active.slug}>
        <div className="vibe-hero-copy">
          <div className="vibe-hero-status">
            <span>HUY APPLE / SẢN PHẨM NỔI BẬT</span>
            <span>{meta.index} / 03</span>
          </div>

          <p className="vibe-hero-kicker">{meta.label} · {active.badge ?? "Chính hãng"}</p>
          <h1>{active.name}</h1>
          <p className="vibe-hero-description">
            {active.tagline ?? "Thiết bị nổi bật, cấu hình rõ ràng và đầy đủ lựa chọn màu sắc."}
          </p>

          <div className="vibe-hero-price">
            <div>
              <span>Giá tham khảo</span>
              <strong>{price}</strong>
            </div>
            <div>
              <span>Tình trạng</span>
              <strong>{typeof active.stock === "number" && active.stock > 0 ? "Còn hàng" : "Liên hệ tồn kho"}</strong>
            </div>
          </div>

          <div className="vibe-hero-actions">
            <Link className="vibe-hero-primary" href={`/san-pham/${active.slug}`}>
              Xem sản phẩm <span aria-hidden="true">↗</span>
            </Link>
            <Link className="vibe-hero-secondary" href={meta.href}>
              Xem tất cả {meta.label}
            </Link>
          </div>
        </div>

        <div className="vibe-hero-visual">
          <div className="vibe-hero-frame" aria-hidden="true" />
          <Image
            src={active.image}
            alt={active.name}
            width={920}
            height={760}
            priority
            unoptimized
          />
          <div className="vibe-hero-note">
            <span className="vibe-hero-online" aria-hidden="true" />
            <div>
              <strong>Tư vấn cấu hình</strong>
              <span>Màu sắc · bộ nhớ · giao hàng</span>
            </div>
          </div>
        </div>

        <div className="vibe-hero-controls">
          <div className="vibe-hero-arrows">
            <button type="button" onClick={() => move(-1)} aria-label="Sản phẩm trước">←</button>
            <button type="button" onClick={() => move(1)} aria-label="Sản phẩm tiếp theo">→</button>
          </div>
          <div className="vibe-hero-tabs" role="tablist" aria-label="Chọn dòng sản phẩm nổi bật">
            {slides.map((slide, slideIndex) => {
              const slideMeta = categoryMeta[slide.category] ?? {
                label: slide.category,
                index: String(slideIndex + 1).padStart(2, "0"),
              };
              return (
                <button
                  key={slide.slug}
                  type="button"
                  role="tab"
                  aria-selected={slideIndex === index}
                  className={slideIndex === index ? "active" : ""}
                  onClick={() => setIndex(slideIndex)}
                >
                  <span>{slideMeta.index}</span>
                  <Image src={slide.image} alt="" width={58} height={58} unoptimized />
                  <strong>{slideMeta.label}</strong>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
