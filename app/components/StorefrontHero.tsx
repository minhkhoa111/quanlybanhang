"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import "./StorefrontHero.css";

const slides = [
  {
    id: 1,
    tabTitle: "IPHONE 18 PRO",
    tabSub: "Flagship mới",
    image: "/hero-products/iphone-18-pro-cutout-v2.png",
    imageAlt: "iPhone 18 Pro màu Titan Đỏ Rượu trên nền chữ Pro",
    title: "iPhone 18 Pro",
    subtitle: "Pro hơn hẳn.",
    availability: "Có hàng từ ngày 18 tháng 9",
    description: "Khẩu độ biến thiên cơ học 4 bước, chip A20 Pro 2nm và thiết kế Titan Cấp 5.",
    cta: "Xem thêm về iPhone 18 Pro",
    primaryAction: { label: "Tìm hiểu thêm", href: "/dat-truoc?device=iphone" },
    secondaryAction: { label: "Đặt trước", href: "/dat-truoc?device=iphone#configurator" },
    artLabel: "PRO",
    tone: "blue",
  },
  {
    id: 2,
    tabTitle: "MACBOOK PRO MỚI",
    tabSub: "Apple M5",
    image: "/apple-macbook-pro/product-viewer-hero.jpg",
    imageAlt: "MacBook Pro mới với màn hình Liquid Retina XDR",
    title: "MacBook Pro mới",
    subtitle: "Sức mạnh đi trước.",
    availability: "Apple M5 · M4 Pro · M4 Max",
    description: "Màn hình Liquid Retina XDR Nano-texture, hiệu năng chuyên nghiệp và pin đến 24 giờ.",
    cta: "Xem thêm về MacBook Pro",
    primaryAction: { label: "Tìm hiểu thêm", href: "/dat-truoc?device=macbook" },
    secondaryAction: { label: "Đặt trước", href: "/dat-truoc?device=macbook#configurator" },
    artLabel: "M5",
    tone: "cyan",
  },
  {
    id: 4,
    tabTitle: "LAPTOP GAMING",
    tabSub: "RTX 50 Series",
    image: "/products/expanded/rog-scar18-2025.png",
    imageAlt: "Laptop gaming ROG Strix Scar 18 hiệu năng cao",
    title: "Trạm AI thế hệ mới",
    subtitle: "Chơi lớn. Làm lớn.",
    availability: "Laptop Gaming 2026",
    description: "Màn hình OLED 240Hz, đồ họa RTX 50 Series và hệ thống tản nhiệt buồng hơi.",
    primaryAction: { label: "Khám phá", href: "/laptop" },
    secondaryAction: { label: "Xem sản phẩm", href: "/laptop?filter=gaming" },
    artLabel: "RTX",
    tone: "violet",
  },
  {
    id: 5,
    tabTitle: "MÁY ẢNH",
    tabSub: "Fujifilm · Sony · DJI",
    image: "/hero-products/fujifilm-xm5-cutout-v3.png",
    imageAlt: "Máy ảnh mirrorless Fujifilm X-M5 nền trong suốt",
    title: "Công cụ của người kể chuyện",
    subtitle: "Bắt trọn chất riêng.",
    availability: "Mirrorless & thiết bị ghi hình",
    description: "Máy ảnh và thiết bị sáng tạo chính hãng cho từng khung hình giàu cảm xúc.",
    primaryAction: { label: "Khám phá", href: "/may-anh" },
    secondaryAction: { label: "Xem sản phẩm", href: "/may-anh" },
    artLabel: "CREATE",
    tone: "navy",
  },
] as const;

export default function StorefrontHero() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [direction, setDirection] = useState("next");
  const [paused, setPaused] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isInteractingRef = useRef(false);
  const slide = slides[activeSlide];

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (!isInteractingRef.current && !document.hidden && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setDirection("next");
        setActiveSlide((current) => (current + 1) % slides.length);
      }
    }, 6500);
    return () => window.clearInterval(timer);
  }, [paused]);

  useEffect(() => () => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const updateParallax = (event: React.PointerEvent<HTMLElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || event.pointerType !== "mouse" || !window.matchMedia("(pointer: fine)").matches) return;
    const element = heroRef.current;
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = window.requestAnimationFrame(() => {
      element.style.setProperty("--hero-x", x.toFixed(3));
      element.style.setProperty("--hero-y", y.toFixed(3));
    });
  };

  const resetParallax = () => {
    const element = heroRef.current;
    if (!element) return;
    element.style.setProperty("--hero-x", "0");
    element.style.setProperty("--hero-y", "0");
  };

  const selectSlide = (index: number, travel = index > activeSlide ? "next" : "previous") => {
    setDirection(travel);
    setActiveSlide((index + slides.length) % slides.length);
  };

  return (
    <section
      ref={heroRef}
      className={`product-launch-hero product-launch-hero-${slide.tone}`}
      data-slide-direction={direction}
      aria-roledescription="carousel"
      aria-label="Sản phẩm nổi bật"
      onPointerMove={updateParallax}
      onPointerEnter={() => { isInteractingRef.current = true; }}
      onPointerLeave={() => {
        isInteractingRef.current = false;
        resetParallax();
      }}
      onFocusCapture={() => { isInteractingRef.current = true; }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          isInteractingRef.current = false;
        }
      }}
    >
      <div className="product-launch-hero-inner">
        <div className="product-launch-copy" key={`copy-${slide.id}`}>
          <span className="product-launch-kicker">INFINITY SHOP · NEW ARRIVAL</span>
          <h1>{slide.title}</h1>
          <p className="product-launch-subtitle">{slide.subtitle}</p>
          <p className="product-launch-availability">{slide.availability}</p>
          <p className="product-launch-description">{slide.description}</p>
          <div className="product-launch-actions">
            <Link className="product-launch-button product-launch-button-primary" href={slide.primaryAction.href}>
              {slide.primaryAction.label}
            </Link>
            <Link className="product-launch-button product-launch-button-secondary" href={slide.secondaryAction.href}>
              {slide.secondaryAction.label}
            </Link>
          </div>
        </div>

        <div className="product-launch-visual" key={`visual-${slide.id}`}>
          <div className="product-launch-ambient" aria-hidden="true" />
          <div className="product-launch-art" aria-hidden="true">{slide.artLabel}</div>
          <div className="product-launch-product">
            <Image
              src={slide.image}
              alt={slide.imageAlt}
              fill
              priority={activeSlide === 0}
              sizes="(max-width: 767px) 140vw, (max-width: 1100px) 90vw, 1100px"
              className="product-launch-image"
            />
          </div>
        </div>

        <div className="shop-hero-navigation" aria-label="Điều khiển banner">
          <button type="button" onClick={() => selectSlide(activeSlide - 1, "previous")} aria-label="Sản phẩm nổi bật trước">←</button>
          <span><b>{String(activeSlide + 1).padStart(2, "0")}</b> / {String(slides.length).padStart(2, "0")}</span>
          <button type="button" onClick={() => selectSlide(activeSlide + 1, "next")} aria-label="Sản phẩm nổi bật tiếp theo">→</button>
        </div>
        <span className="shop-sr-only" aria-live={paused ? "polite" : "off"}>{slide.title}</span>
        <button type="button" className="shop-carousel-pause" onClick={() => setPaused(!paused)} aria-label={paused ? "Tiếp tục trình chiếu" : "Tạm dừng trình chiếu"}>{paused ? "▶ Tiếp tục" : "Ⅱ Tạm dừng"}</button>
        <div className="product-launch-controls" aria-label="Chọn sản phẩm quảng cáo">
          {slides.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === activeSlide ? "is-active" : ""}
              onClick={() => selectSlide(index)}
              aria-pressed={index === activeSlide}
              aria-label={`${item.tabTitle}: ${item.tabSub}`}
            >
              <span>{item.tabTitle}</span>
              <small>{item.tabSub}</small>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
