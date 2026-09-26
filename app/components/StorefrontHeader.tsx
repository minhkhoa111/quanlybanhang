"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/app/cart";

const quickTags = ["MacBook Pro", "MacBook Air", "iPhone 17 Pro", "OPPO Find X8", "Fujifilm X-T5", "Sony A7 IV", "Laptop Gaming"];

type HeaderCustomer = {
  name?: string;
  username?: string;
  avatarUrl?: string;
};

export default function StorefrontHeader() {
  const pathname = usePathname();
  const { count } = useCart();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Hồ Chí Minh");
  const [customer, setCustomer] = useState<HeaderCustomer | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let requestVersion = 0;

    const refreshAccount = async () => {
      const version = ++requestVersion;
      try {
        const response = await fetch("/api/account/me", { cache: "no-store", credentials: "same-origin" });
        const data = await response.json() as { customer?: HeaderCustomer };
        if (version === requestVersion) setCustomer(data.customer || null);
      } catch {
        if (version === requestVersion) setCustomer(null);
      }
    };

    const handleAccountChange = (event: Event) => {
      const detail = event instanceof CustomEvent ? event.detail as { customer?: HeaderCustomer | null } | undefined : undefined;
      if (detail && Object.prototype.hasOwnProperty.call(detail, "customer")) {
        requestVersion += 1;
        setCustomer(detail.customer || null);
        return;
      }
      void refreshAccount();
    };

    void refreshAccount();
    window.addEventListener("huy-account-change", handleAccountChange);
    return () => window.removeEventListener("huy-account-change", handleAccountChange);
  }, []);

  const customerName = customer?.name?.trim() || customer?.username?.trim() || "";

  if (pathname.startsWith("/admin") || pathname.startsWith("/quan-ly") || pathname.startsWith("/dat-truoc")) {
    return null;
  }

  return (
    <header className="cps-header">
      {/* Top Ticker / Benefits Bar */}
      <div className="cps-top-ticker">
        <div className="cps-container cps-top-ticker-inner">
          <div className="cps-ticker-items">
            <span className="cps-ticker-badge">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.5 6a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z"/>
                <path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m8.5 10 2.267 3.927 1.065-2.156 2.399.155L11.964 8M5.035 8l-2.267 3.927 2.399-.156 1.065 2.155L8.499 10"/>
              </svg>
              Sản phẩm <strong>Chính hãng - Xuất VAT</strong> đầy đủ
            </span>
            <span className="cps-ticker-badge">
              <svg width="14" height="14" fill="none" viewBox="0 0 17 16">
                <path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.833 11.333a1.333 1.333 0 1 0 2.667 0 1.333 1.333 0 0 0-2.667 0ZM10.5 11.333a1.333 1.333 0 1 0 2.667 0 1.333 1.333 0 0 0-2.667 0Z"/>
                <path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.833 11.333H2.5V8.667m-.667-5.334h7.334v8m-2.667 0h4m2.667 0H14.5v-4m0 0H9.167m5.333 0L12.5 4H9.167M2.5 6h2.667"/>
              </svg>
              <strong>Giao nhanh 2h - Miễn phí</strong> cho đơn từ 300k
            </span>
            <span className="cps-ticker-badge">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="3" width="12" height="10" rx="2" stroke="#fff" strokeWidth="1.5"/>
                <path d="M2 7h12" stroke="#fff" strokeWidth="1.5"/>
              </svg>
              <strong>Trả góp 0%</strong> - Xét duyệt siêu tốc
            </span>
          </div>

          <div className="cps-ticker-links">
            <Link className="cps-ticker-link" href="/bao-hanh">
              <svg width="14" height="14" fill="none" viewBox="0 0 16 16">
                <path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 1.5l5 2.5v4c0 3.5-3 6.5-5 7-2-.5-5-3.5-5-7v-4l5-2.5z"/>
              </svg>
              Tra cứu bảo hành
            </Link>
            <Link className="cps-ticker-link" href="/member">
              <svg width="14" height="14" fill="none" viewBox="0 0 16 16">
                <path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5 6a5 5 0 0 1 10 0H3Z"/>
              </svg>
              Infinity Member
            </Link>
            <a className="cps-ticker-link" href="tel:02879797999">
              <svg width="14" height="14" fill="none" viewBox="0 0 16 16">
                <path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.5 3.5a1 1 0 0 1 1-1h2.2a1 1 0 0 1 1 .78l.6 2.4a1 1 0 0 1-.28 1L5.6 7.9a9 9 0 0 0 4.5 4.5l1.22-1.42a1 1 0 0 1 1-.28l2.4.6a1 1 0 0 1 .78 1v2.2a1 1 0 0 1-1 1A12.5 12.5 0 0 1 2.5 3.5Z"/>
              </svg>
              Hotline: 028.7979.7999
            </a>
          </div>
        </div>
      </div>

      {/* Main Red Bar */}
      <div className="cps-main-header">
        <div className="cps-container cps-main-header-inner">
          {/* Logo */}
          <Link href="/" className="cps-brand-logo" aria-label="IF TECHSHOP - Trang chủ">
            <Image
              src="/brand/if-techshop-logo.png"
              alt="IF TECHSHOP"
              width={160}
              height={44}
              className="cps-brand-logo-img"
              priority
              unoptimized
            />
          </Link>

          {/* Button: Danh muc */}
          <button
            type="button"
            className="cps-header-btn"
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            aria-label="Danh mục sản phẩm"
          >
            <span className="cps-header-btn-icon">☰</span>
            <span>Danh mục</span>
          </button>

          {/* Button: Xem gia tai */}
          <button
            type="button"
            className="cps-header-btn"
            onClick={() => setSelectedCity(selectedCity === "Hồ Chí Minh" ? "Hà Nội" : "Hồ Chí Minh")}
            title="Đổi khu vực xem giá"
          >
            <span className="cps-header-btn-icon">📍</span>
            <div className="cps-header-btn-col">
              <small>Xem giá tại</small>
              <strong>{selectedCity} ▾</strong>
            </div>
          </button>

          {/* Search Bar with live quick suggestions */}
          <div className="cps-search-wrap" ref={searchRef}>
            <form
              className="cps-search-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  router.push(`/tim-kiem?q=${encodeURIComponent(searchQuery.trim())}`);
                  setShowDropdown(false);
                }
              }}
            >
              <span className="cps-search-icon">🔍</span>
              <input
                type="text"
                className="cps-search-input"
                placeholder="Bạn muốn mua gì hôm nay? (iPhone, MacBook, OPPO...)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
              />
            </form>

            {showDropdown && (
              <div className="cps-search-dropdown">
                <span className="cps-search-dropdown-title">Gợi ý tìm kiếm phổ biến</span>
                <div className="cps-search-tag-list">
                  {quickTags.map((tag) => (
                    <Link
                      key={tag}
                      href={
                        tag.includes("iPhone")
                          ? "/iphone"
                          : tag.includes("MacBook")
                          ? "/macbook"
                          : tag.includes("OPPO")
                          ? "/android"
                          : tag.includes("Fujifilm") || tag.includes("Sony") || tag.includes("DJI") || tag.includes("Canon")
                          ? "/may-anh"
                          : tag.includes("Laptop")
                          ? "/laptop"
                          : "/phu-kien"
                      }
                      className="cps-search-tag"
                      onClick={() => setShowDropdown(false)}
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="cps-header-actions">
            {/* Hotline */}
            <a href="tel:02879797999" className="cps-action-link">
              <span className="cps-action-link-icon">📞</span>
              <div className="cps-header-btn-col">
                <small>Gọi mua hàng</small>
                <strong>028.7979.7999</strong>
              </div>
            </a>

            {/* Tra cuu don hang */}
            <Link href="/member" className="cps-action-link">
              <span className="cps-action-link-icon">📦</span>
              <div className="cps-header-btn-col">
                <small>Tra cứu</small>
                <strong>Đơn hàng</strong>
              </div>
            </Link>

            {/* Gio hang */}
            <Link href="/gio-hang" className="cps-action-link" aria-label="Giỏ hàng">
              <span className="cps-action-link-icon">
                🛒
                {count > 0 && <span className="cps-cart-badge">{count}</span>}
              </span>
              <div className="cps-header-btn-col">
                <small>Giỏ</small>
                <strong>Hàng</strong>
              </div>
            </Link>

            {/* Dang nhap / Member */}
            <Link
              href="/member"
              className="cps-action-link cps-member-action"
              aria-label={customerName ? `Tài khoản của ${customerName}` : "Đăng nhập Infinity Member"}
              title={customerName || "Đăng nhập Infinity Member"}
            >
              {customer?.avatarUrl ? (
                <Image className="cps-member-avatar" src={customer.avatarUrl} alt="" width={28} height={28} unoptimized />
              ) : (
                <span className="cps-action-link-icon">👤</span>
              )}
              <div className="cps-header-btn-col">
                <small>{customerName ? "Xin chào" : "Thành viên"}</small>
                <strong className="cps-member-name">{customerName || "Đăng nhập"}</strong>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Category Mega Dropdown */}
      {showCategoryMenu && (
        <div
          className="cps-header-cat-dropdown"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#ffffff",
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.18)",
            borderBottom: "3px solid #0071e3",
            zIndex: 1000,
            padding: "20px 0",
          }}
        >
          <div
            className="cps-container"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "12px",
            }}
          >
            {[
              { label: "Đặt trước Apple mới", href: "/dat-truoc", icon: "✨", sub: "iPhone 18, MacBook mới, iPad mới · Không thu cọc" },
              { label: "Điện thoại, iPhone", href: "/iphone", icon: "📱", sub: "Apple Titan, Pro Max, VN/A" },
              { label: "MacBook Apple", href: "/macbook", icon: "💻", sub: "Pro M5/M4, Air, New & Like New" },
              { label: "Laptop Windows, AI", href: "/laptop", icon: "🖥️", sub: "ASUS, Dell, Gaming RTX 50" },
              { label: "Máy ảnh, Flycam", href: "/may-anh", icon: "📷", sub: "FUJIFILM, SONY, CANON, DJI" },
              { label: "Máy tính bảng, iPad", href: "/ipad", icon: "📟", sub: "iPad Pro M4, Air, mini" },
              { label: "iMac, Mac mini, Studio", href: "/mac-mini-studio", icon: "🖥️", sub: "Apple Desktop M4" },
              { label: "Âm thanh, Tai nghe", href: "/audio", icon: "🎧", sub: "AirPods, Marshall, Sony" },
              { label: "Đồng hồ thông minh", href: "/smartwatch", icon: "⌚", sub: "Apple Watch, Ultra 2" },
              { label: "Phụ kiện công nghệ", href: "/phu-kien", icon: "🔌", sub: "Cáp sạc, sạc nhanh, ốp lưng" },
              { label: "Android, Xiaomi, OPPO", href: "/android", icon: "🤖", sub: "Flagship Leica, Hasselblad" },
              { label: "Laptop cũ giá rẻ", href: "/laptop-cu", icon: "🔄", sub: "Nguyên bản, bảo hành 12T" },
            ].map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                onClick={() => setShowCategoryMenu(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: "24px" }}>{cat.icon}</span>
                <div>
                  <strong style={{ display: "block", color: "#0f172a", fontSize: "13px" }}>{cat.label}</strong>
                  <small style={{ color: "#64748b", fontSize: "11px" }}>{cat.sub}</small>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
