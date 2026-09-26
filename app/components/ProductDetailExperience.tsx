"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Product, ProductColor, ProductVariant } from "@/app/products";
import { formatOrderMoney, productUnitPrice } from "@/app/order-pricing";
import { useCart } from "@/app/cart";

function normalize(value?: string) {
  return (value ?? "").trim().toLocaleLowerCase("vi");
}

function matchingVariants(product: Product, storage: string, ram = "") {
  const variants = product.variants ?? [];
  return variants.filter((variant) =>
    variant.status !== "inactive" &&
    (!storage || normalize(variant.storage) === normalize(storage)) &&
    (!ram || normalize(variant.ram) === normalize(ram)),
  );
}

function colorsForConfiguration(product: Product, storage: string, ram: string): ProductColor[] {
  const variants = matchingVariants(product, storage, ram).filter((variant) => variant.color && variant.stock !== 0);
  const variantColors = variants
    .filter((variant, index, list) => list.findIndex((item) => normalize(item.color) === normalize(variant.color)) === index)
    .map((variant) => ({ name: variant.color as string, hex: variant.colorHex || "#111111" }));

  if (variantColors.length) return variantColors;
  if (product.colorOptions?.length) return product.colorOptions;
  if (product.colors && product.colors.length > 0) {
    return product.colors.map((hex, index) => ({ name: `Màu ${index + 1}`, hex }));
  }
  return [{ name: "Tiêu chuẩn", hex: "#0088cc" }];
}

function findVariant(product: Product, storage: string, ram: string, color: string): ProductVariant | undefined {
  const candidates = matchingVariants(product, storage, ram);
  return candidates.find((variant) => normalize(variant.color) === normalize(color)) ?? candidates[0];
}

function uniqueImages(images: Array<string | undefined>) {
  return images.filter((image): image is string => Boolean(image)).filter((image, index, list) => list.indexOf(image) === index);
}

// Map Vietnamese category slugs to friendly display names
const CATEGORY_NAMES: Record<string, string> = {
  iphone: "iPhone",
  ipad: "iPad",
  macbook: "MacBook",
  "macbook-air": "MacBook Air",
  "macbook-pro": "MacBook Pro",
  "mac-mini-studio": "Mac mini & Mac Studio",
  imac: "iMac",
  android: "Điện thoại Android",
  laptop: "Laptop",
  "laptop-cu": "Laptop Like New",
  smartwatch: "Apple Watch & Smartwatch",
  audio: "Tai nghe & Âm thanh",
  "phu-kien": "Phụ kiện cao cấp",
};

// Helper to intelligently extract highlights from specs
function parseSpecHighlights(specs: string[]) {
  if (!specs || specs.length === 0) return [];

  return specs.slice(0, 4).map((spec) => {
    const text = spec.trim();
    // Check common tech specs keywords
    if (/a19|a18|a17|a16|m4|m5|m3|snapdragon|intel|ryzen/i.test(text)) {
      const match = text.match(/(a\d+\s*pro|m\d+\s*max|m\d+\s*pro|m\d+|snapdragon\s*[\w\d]+|intel\s*[\w\d]+|core\s*ultra\s*\d+|ryzen\s*\w+)/i);
      return {
        badge: match ? match[0].toUpperCase() : "CHIP MẠNH MẼ",
        title: "Hiệu Năng Vượt Trội",
        desc: text,
        icon: "⚡",
      };
    }
    if (/120hz|promotion|oled|retina|xdr|amoled|mini-led/i.test(text)) {
      const match = text.match(/(120hz\s*promotion|120hz|oled\s*tandem|ultra\s*retina\s*xdr|retina\s*xdr|amoled|mini-led)/i);
      return {
        badge: match ? match[0].toUpperCase() : "MÀN HÌNH",
        title: "Hiển Thị Đỉnh Cao",
        desc: text,
        icon: "✨",
      };
    }
    if (/camera|48mp|108mp|telephoto|fusion|lens|quang học/i.test(text)) {
      const match = text.match(/(\d+mp|fusion|telephoto|zoom\s*\d+x)/i);
      return {
        badge: match ? match[0].toUpperCase() : "CAMERA PRO",
        title: "Nhiếp Ảnh Chuyên Nghiệp",
        desc: text,
        icon: "📸",
      };
    }
    if (/titan|nhôm|ceramic|ip68|chống nước|thép/i.test(text)) {
      return {
        badge: "TITANIUM",
        title: "Vật Liệu Cao Cấp",
        desc: text,
        icon: "🛡️",
      };
    }
    if (/pin|sạc|magsafe|mah|giờ/i.test(text)) {
      return {
        badge: "PIN BỀN BỈ",
        title: "Thời Lượng Vượt Trội",
        desc: text,
        icon: "🔋",
      };
    }
    return {
      badge: "CÔNG NGHỆ",
      title: "Tính Năng Nổi Bật",
      desc: text,
      icon: "✦",
    };
  });
}

export default function ProductDetailExperience({
  product,
  relatedProducts = [],
}: {
  product: Product;
  relatedProducts?: Product[];
  canManage?: boolean;
}) {
  const { addItem, isLoggedIn, openLoginModal } = useCart();
  const galleryDialog = useRef<HTMLDialogElement>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);

  const handleBuyNow = (e: React.MouseEvent) => {
    if (!canAddToCart) {
      e.preventDefault();
      return;
    }
    if (!isLoggedIn) {
      e.preventDefault();
      openLoginModal();
    }
  };

  // Variant matching
  const sellableVariants = useMemo(() => (product.variants ?? []).filter((variant) => variant.status !== "inactive"), [product]);
  const storageOptions = useMemo(
    () => Array.from(new Set([...sellableVariants.map((variant) => variant.storage), ...(product.storageOptions ?? [])].filter((item): item is string => Boolean(item)))),
    [product.storageOptions, sellableVariants]
  );
  const ramOptions = useMemo(
    () => Array.from(new Set(sellableVariants.map((variant) => variant.ram).filter((ram): ram is string => Boolean(ram)))),
    [sellableVariants]
  );
  const allColorOptions = useMemo(() => {
    const variantColors = sellableVariants
      .filter((variant) => variant.color)
      .filter((variant, index, list) => list.findIndex((item) => normalize(item.color) === normalize(variant.color)) === index)
      .map((variant) => ({ name: variant.color as string, hex: variant.colorHex || "#111111" }));
    return variantColors.length
      ? variantColors
      : product.colorOptions?.length
      ? product.colorOptions
      : (product.colors && product.colors.length > 0)
      ? product.colors.map((hex, index) => ({ name: `Màu ${index + 1}`, hex }))
      : [{ name: "Tiêu chuẩn", hex: "#0088cc" }];
  }, [product.colorOptions, product.colors, sellableVariants]);

  // Selections
  const [ram, setRam] = useState(ramOptions.find((option) => matchingVariants(product, "", option).some((variant) => variant.stock !== 0)) ?? ramOptions[0] ?? "");
  const availableStorageOptions = useMemo(() => {
    if (!ram) return storageOptions;
    return Array.from(new Set(matchingVariants(product, "", ram).filter((variant) => variant.stock !== 0).map((variant) => variant.storage).filter((item): item is string => Boolean(item))));
  }, [product, ram, storageOptions]);

  const [storage, setStorage] = useState(availableStorageOptions[0] ?? storageOptions[0] ?? "");
  const activeStorage = availableStorageOptions.includes(storage) ? storage : availableStorageOptions[0] ?? storage;
  const availableColors = useMemo(() => colorsForConfiguration(product, activeStorage, ram), [activeStorage, product, ram]);
  const [color, setColor] = useState(availableColors[0]?.name ?? "");
  const activeColor = availableColors.find((item) => normalize(item.name) === normalize(color))?.name ?? availableColors[0]?.name ?? "";
  const selectedVariant = useMemo(() => findVariant(product, activeStorage, ram, activeColor), [activeColor, activeStorage, product, ram]);
  const selectedStock = selectedVariant?.stock ?? product.stock;
  const canAddToCart = selectedStock !== 0 && (!(product.variants?.length) || Boolean(selectedVariant && selectedVariant.status !== "inactive" && selectedVariant.stock !== 0));

  // Gallery
  const gallery = useMemo(
    () => uniqueImages([selectedVariant?.image, product.image, ...(product.images ?? []), ...(product.variants ?? []).map((variant) => variant.image)]),
    [product, selectedVariant?.image]
  );
  const [chosenImage, setChosenImage] = useState("");
  const activeImage = gallery.includes(chosenImage) ? chosenImage : selectedVariant?.image || gallery[0] || product.image;
  const currentImageIndex = gallery.indexOf(activeImage);

  const changeImage = (direction: number) => {
    if (gallery.length > 1) setChosenImage(gallery[(currentImageIndex + direction + gallery.length) % gallery.length]);
  };

  // Pricing
  const selectedPrice = productUnitPrice(product, activeStorage, activeColor, ram);
  const selectedPriceFormatted = selectedPrice ? formatOrderMoney(selectedPrice) : product.price;

  // URLs
  const orderHref = `/dat-hang?may=${encodeURIComponent(product.slug)}${ram ? `&ram=${encodeURIComponent(ram)}` : ""}${activeStorage ? `&dung-luong=${encodeURIComponent(activeStorage)}` : ""}${activeColor ? `&mau=${encodeURIComponent(activeColor)}` : ""}`;
  const installmentHref = `/tra-gop?may=${encodeURIComponent(product.slug)}&gia=${selectedPrice}`;

  // Specs highlights
  const specHighlights = useMemo(() => parseSpecHighlights(product.specs || []), [product.specs]);

  // Sticky Bar Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 480) {
        setStickyVisible(true);
      } else {
        setStickyVisible(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    addItem({
      productSlug: product.slug,
      productName: product.name,
      image: activeImage,
      ram,
      storage: activeStorage,
      color: activeColor,
      unitPrice: selectedPrice,
    });
    if (!isLoggedIn) return;
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2400);
  };

  const categoryName = CATEGORY_NAMES[product.category] || "Thiết bị công nghệ";
  const configurationSummary = [ram, activeStorage, activeColor].filter(Boolean).join(" · ") || "Cấu hình tiêu chuẩn";

  return (
    <div className="pdp-container pdp-refined">
      <dialog ref={galleryDialog} className="pdp-image-dialog" aria-label={`Hình ảnh ${product.name}`} onClick={(event) => { if (event.target === event.currentTarget) galleryDialog.current?.close(); }} onKeyDown={(event) => {
        if (event.key === "ArrowRight") { event.preventDefault(); changeImage(1); }
        if (event.key === "ArrowLeft") { event.preventDefault(); changeImage(-1); }
      }}>
        <div className="pdp-dialog-toolbar"><span>{product.name}</span><button type="button" onClick={() => galleryDialog.current?.close()} aria-label="Đóng ảnh lớn">✕</button></div>
        <div className="pdp-dialog-image"><Image src={activeImage} alt={product.name} fill unoptimized sizes="90vw" /></div>
        <div className="pdp-dialog-controls"><button type="button" disabled={gallery.length < 2} onClick={() => changeImage(-1)} aria-label="Ảnh trước">←</button><span aria-live="polite">{currentImageIndex + 1} / {gallery.length}</span><button type="button" disabled={gallery.length < 2} onClick={() => changeImage(1)} aria-label="Ảnh tiếp theo">→</button></div>
      </dialog>
      {/* Sticky Purchase Bar */}
      <aside className={`pdp-sticky-bar ${stickyVisible ? "is-visible" : ""}`} aria-label="Thanh mua hàng nhanh" inert={!stickyVisible}>
        <div className="pdp-sticky-inner">
          <div className="pdp-sticky-left">
            <div className="pdp-sticky-thumb">
              <Image src={activeImage} alt="" fill unoptimized style={{ objectFit: "contain" }} sizes="44px" />
            </div>
            <div className="pdp-sticky-info">
              <h4 className="pdp-sticky-title">{product.name}</h4>
              <p className="pdp-sticky-variant">{configurationSummary}</p>
            </div>
          </div>
          <div className="pdp-sticky-right">
            <span className="pdp-sticky-price">{selectedPriceFormatted}</span>
            <button
              type="button"
              className="pdp-sticky-btn-cart"
              disabled={!canAddToCart}
              onClick={handleAddToCart}
            >
              {addedToCart ? "✓ Đã thêm" : "+ Giỏ hàng"}
            </button>
            <Link
              href={orderHref}
              className={`pdp-sticky-btn-buy ${!canAddToCart ? "is-disabled" : ""}`}
              aria-disabled={!canAddToCart}
              onClick={handleBuyNow}
            >
              {canAddToCart ? "Mua ngay" : "Hết hàng"}
            </Link>
          </div>
        </div>
      </aside>

      {/* Breadcrumb Navigation */}
      <nav className="pdp-breadcrumb" aria-label="Đường dẫn">
        <Link href="/">Trang chủ</Link>
        <span className="sep">/</span>
        <Link href={`/${product.category}`}>{categoryName}</Link>
        <span className="sep">/</span>
        <span className="current">{product.name}</span>
      </nav>

      {/* ====================================================================
          HERO SECTION: 2-COLUMN GRID (LEFT GALLERY / RIGHT INFO)
          ==================================================================== */}
      <section id="pdp-overview" className="pdp-hero-grid" aria-labelledby="pdp-product-title">
        {/* LEFT: GALLERY */}
        <div className="pdp-gallery-column">
          <div className="pdp-gallery-main">
            <button type="button" className="pdp-zoom-button" onClick={() => galleryDialog.current?.showModal()} aria-label="Mở ảnh sản phẩm kích thước lớn">⤢ Xem ảnh lớn</button>
            {gallery.length > 1 && <div className="pdp-gallery-arrows"><button type="button" onClick={() => changeImage(-1)} aria-label="Ảnh trước">←</button><button type="button" onClick={() => changeImage(1)} aria-label="Ảnh tiếp theo">→</button></div>}
            {product.badge && (
              <span className="pdp-gallery-badge">
                <span aria-hidden="true"></span> {product.badge}
              </span>
            )}
            {gallery.length > 1 && (
              <span className="pdp-gallery-counter">
                {String(currentImageIndex + 1).padStart(2, "0")} / {String(gallery.length).padStart(2, "0")}
              </span>
            )}
            <Image
              src={activeImage}
              alt={`${product.name}${activeColor ? ` - ${activeColor}` : ""}`}
              fill
              priority
              unoptimized
              sizes="(max-width: 900px) 100vw, 700px"
              className="pdp-gallery-main-img"
            />
          </div>

          {/* Thumbnails */}
          {gallery.length > 1 && (
            <div className="pdp-thumbnails-wrap" aria-label="Danh sách hình ảnh sản phẩm">
              {gallery.map((image, idx) => (
                <button
                  key={`${image}-${idx}`}
                  type="button"
                  className={`pdp-thumb-btn ${activeImage === image ? "is-active" : ""}`}
                  onClick={() => setChosenImage(image)}
                  aria-label={`Xem ảnh số ${idx + 1}`}
                  aria-pressed={activeImage === image}
                >
                  <Image src={image} alt="" fill unoptimized sizes="76px" className="pdp-thumb-img" />
                </button>
              ))}
            </div>
          )}
          <p className="pdp-gallery-note">
            Hình ảnh sản phẩm chính hãng · Cam kết đúng mẫu mã và màu sắc thực tế khi nhận máy.
          </p>
        </div>

        {/* RIGHT: PRODUCT INFO & CONFIGURATION */}
        <div className="pdp-info-column">
          {/* Kicker */}
          <div className="pdp-kicker-row">
            <span className="pdp-kicker-badge">
              {product.brand ? product.brand.toUpperCase() : "THIẾT BỊ CÔNG NGHỆ"}
            </span>
            {product.condition === "like-new" ? (
              <span
                className="pdp-condition-badge pdp-condition-likenew"
                style={{
                  background: "#fff7ed",
                  color: "#c2410c",
                  border: "1px solid #fed7aa",
                  padding: "3px 9px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                🔄 Like New - Đã qua sử dụng
              </span>
            ) : product.condition === "new" ? (
              <span
                className="pdp-condition-badge pdp-condition-new"
                style={{
                  background: "#ecfdf5",
                  color: "#047857",
                  border: "1px solid #a7f3d0",
                  padding: "3px 9px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                ✨ Máy Mới (New 100%)
              </span>
            ) : null}
            {product.sku && <span className="pdp-sku-badge">Mã: {product.sku}</span>}
          </div>

          {/* Product Name */}
          <h1 id="pdp-product-title" className="pdp-title">
            {product.name}
          </h1>

          {/* Tagline */}
          {product.tagline && <p className="pdp-tagline">{product.tagline}</p>}

          {/* Price Card */}
          <div className="pdp-price-card">
            <span className="pdp-price-label">GIÁ CẤU HÌNH ĐÃ CHỌN</span>
            <div className="pdp-price-row">
              <strong className="pdp-current-price">{selectedPriceFormatted}</strong>
              {product.salePrice && product.price && product.salePrice !== product.price && (
                <>
                  <span className="pdp-compare-price">{product.price}</span>
                  <span className="pdp-save-badge">Tiết kiệm ưu đãi</span>
                </>
              )}
            </div>
            <p className="pdp-price-caption">
              <span>✓ Đã bao gồm thuế VAT</span>
              <span>•</span>
              <span>Hóa đơn điện tử đầy đủ</span>
              <span>•</span>
              <span>Bảo hành chính hãng 12-24 tháng</span>
            </p>
          </div>

          {/* RAM Selector (MacBook / Laptop) */}
          {ramOptions.length > 0 && (
            <div className="pdp-option-group">
              <div className="pdp-option-header">
                <h3 className="pdp-option-title">Bộ Nhớ RAM</h3>
                <span className="pdp-option-selected-label">{ram}</span>
              </div>
              <div className="pdp-chips-grid">
                {ramOptions.map((option) => {
                  const firstStorage = matchingVariants(product, "", option).find((v) => v.storage && v.stock !== 0)?.storage ?? "";
                  const available = matchingVariants(product, "", option).some((v) => v.stock !== 0);
                  const isActive = ram === option;
                  const priceDelta = productUnitPrice(product, firstStorage, "", option);
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={!available}
                      aria-pressed={isActive}
                      className={`pdp-chip-card ${isActive ? "is-active" : ""}`}
                      onClick={() => {
                        setRam(option);
                        setStorage(firstStorage);
                        setColor(colorsForConfiguration(product, firstStorage, option)[0]?.name ?? "");
                        setChosenImage("");
                      }}
                    >
                      <strong className="pdp-chip-title">{option}</strong>
                      <span className="pdp-chip-subtitle">
                        {priceDelta ? formatOrderMoney(priceDelta) : "Tiêu chuẩn"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Storage / SSD Selector */}
          {storageOptions.length > 0 && (
            <div className="pdp-option-group">
              <div className="pdp-option-header">
                <h3 className="pdp-option-title">{ramOptions.length > 0 ? "Ổ cứng SSD" : "Dung Lượng"}</h3>
                <span className="pdp-option-selected-label">{activeStorage}</span>
              </div>
              <div className="pdp-chips-grid">
                {storageOptions.map((option) => {
                  const available = matchingVariants(product, option, ram).some((v) => v.stock !== 0) || !sellableVariants.length;
                  const isActive = activeStorage === option;
                  const optionPrice = productUnitPrice(product, option, "", ram);
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={!available}
                      aria-pressed={isActive}
                      className={`pdp-chip-card ${isActive ? "is-active" : ""}`}
                      onClick={() => {
                        setStorage(option);
                        setColor(colorsForConfiguration(product, option, ram)[0]?.name ?? "");
                        setChosenImage("");
                      }}
                    >
                      <strong className="pdp-chip-title">{option}</strong>
                      <span className="pdp-chip-subtitle">
                        {optionPrice ? formatOrderMoney(optionPrice) : "Theo cấu hình"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color Selector */}
          {allColorOptions.length > 0 && (
            <div className="pdp-option-group">
              <div className="pdp-option-header">
                <h3 className="pdp-option-title">Màu Sắc</h3>
                <span className="pdp-option-selected-label">{activeColor}</span>
              </div>
              <div className="pdp-colors-list">
                {allColorOptions.map((option) => {
                  const variant = findVariant(product, activeStorage, ram, option.name);
                  const available = !sellableVariants.length || Boolean(variant && normalize(variant.color) === normalize(option.name) && variant.stock !== 0);
                  const isActive = normalize(activeColor) === normalize(option.name);
                  return (
                    <button
                      key={option.name}
                      type="button"
                      disabled={!available}
                      aria-pressed={isActive}
                      className={`pdp-color-swatch-btn ${isActive ? "is-active" : ""}`}
                      onClick={() => {
                        setColor(option.name);
                        setChosenImage(variant?.image ?? "");
                      }}
                    >
                      <span className="pdp-color-dot" style={{ backgroundColor: option.hex }} />
                      <span>{option.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock & Availability Indicator */}
          <div className={`pdp-stock-banner ${canAddToCart ? "in-stock" : "out-of-stock"}`}>
            <div className="pdp-stock-left">
              <span className="pdp-stock-indicator-dot" />
              <span>
                {canAddToCart ? "Còn hàng - Sẵn sàng giao ngay hoặc nhận tại cửa hàng" : "Cấu hình hiện đang tạm hết hàng"}
              </span>
            </div>
            {selectedStock !== undefined && selectedStock > 0 && (
              <span className="pdp-stock-count">
                {selectedStock <= 3 ? `Chỉ còn ${selectedStock} máy` : `Còn ${selectedStock} sản phẩm`}
              </span>
            )}
          </div>

          <div className="pdp-selection-summary" aria-live="polite"><span>Lựa chọn của bạn</span><strong>{configurationSummary}</strong></div>
          {/* Conversion CTA Block */}
          <div className="pdp-cta-block">
            {canAddToCart ? (
              <Link href={orderHref} className="pdp-btn-buy-now" onClick={handleBuyNow}>
                <span>Mua ngay</span>
                <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <button type="button" disabled className="pdp-btn-buy-now is-disabled">
                Cấu hình tạm hết hàng
              </button>
            )}

            <div className="pdp-cta-secondary-row">
              <button
                type="button"
                className={`pdp-btn-add-cart ${addedToCart ? "added" : ""}`}
                disabled={!canAddToCart}
                onClick={handleAddToCart}
              >
                <span>{addedToCart ? "✓ Đã thêm vào giỏ" : "🛒 Thêm vào giỏ"}</span>
              </button>
              <Link href={installmentHref} className="pdp-btn-installment">
                <span>% Trả góp 0%</span>
              </Link>
            </div>

            <p className="pdp-hotline-consultation">
              Cần tư vấn trực tiếp cấu hình? Gọi{" "}
              <a href="tel:0839745735">0839 745 735</a> hoặc{" "}
              <a href="https://zalo.me/02879797999" target="_blank" rel="noreferrer">
                Chat Zalo 24/7
              </a>
            </p>
          </div>

          {/* Trust & Commitments Micro-Grid (2x2) */}
          <div className="pdp-trust-grid">
            <div className="pdp-trust-item">
              <div className="pdp-trust-icon"></div>
              <div className="pdp-trust-text">
                <strong>100% Chính Hãng</strong>
                <span>Nguyên seal, hóa đơn VAT đầy đủ</span>
              </div>
            </div>
            <div className="pdp-trust-item">
              <div className="pdp-trust-icon">⚡</div>
              <div className="pdp-trust-text">
                <strong>Giao Hỏa Tốc 2H</strong>
                <span>Kiểm tra serial/IMEI trước thanh toán</span>
              </div>
            </div>
            <div className="pdp-trust-item">
              <div className="pdp-trust-icon">↺</div>
              <div className="pdp-trust-icon">💳</div>
              <div className="pdp-trust-text">
                <strong>Thu Cũ Đổi Mới Đến 95%</strong>
                <span>Trợ giá lên đời cao nhất thị trường</span>
                <strong>Trả Góp 0% Lãi Suất</strong>
                <span>Thủ tục duyệt online trong 5 phút</span>
              </div>
            </div>
            <div className="pdp-trust-item">
              <div className="pdp-trust-icon">🛡️</div>
              <div className="pdp-trust-text">
                <strong>Bảo Hành 1 Đổi 1</strong>
                <span>Hỗ trợ phần cứng trong 30 ngày đầu</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION: ĐIỂM NỔI BẬT (HIGHLIGHTS GRID)
          ==================================================================== */}
      <nav className="pdp-section-nav" aria-label="Khám phá sản phẩm">
        <a href="#pdp-overview">Tổng quan</a>
        {specHighlights.length > 0 && <a href="#pdp-highlights">Điểm nổi bật</a>}
        {Boolean(product.specs?.length) && <a href="#pdp-specifications">Thông số kỹ thuật</a>}
        <a href="#pdp-services">Dịch vụ &amp; hỗ trợ</a>
      </nav>
      {specHighlights.length > 0 && (
        <section id="pdp-highlights" className="pdp-section-wrap" aria-labelledby="pdp-highlights-heading">
          <header className="pdp-section-header">
            <span className="pdp-section-eyebrow">CÔNG NGHỆ ĐỘT PHÁ</span>
            <h2 id="pdp-highlights-heading" className="pdp-section-title">
              Điểm Nổi Bật Trên {product.name}
            </h2>
            <p className="pdp-section-desc">
              Những nâng cấp phần cứng và trải nghiệm cao cấp được thiết kế để phục vụ hoàn hảo mọi nhu cầu.
            </p>
          </header>

          <div className="pdp-highlights-grid">
            {specHighlights.map((hl, i) => (
              <article key={i} className="pdp-highlight-card">
                <div className="pdp-highlight-icon-wrap">{hl.icon}</div>
                <span className="pdp-section-eyebrow">{hl.badge}</span>
                <h3 className="pdp-highlight-title">{hl.title}</h3>
                <p className="pdp-highlight-detail">{hl.desc}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ====================================================================
          SECTION: THÔNG SỐ KỸ THUẬT (SPECIFICATIONS)
          ==================================================================== */}
      {product.specs && product.specs.length > 0 && (
        <section id="pdp-specifications" className="pdp-section-wrap" aria-labelledby="pdp-specs-heading">
          <header className="pdp-section-header">
            <span className="pdp-section-eyebrow">CHI TIẾT KỸ THUẬT</span>
            <h2 id="pdp-specs-heading" className="pdp-section-title">
              Thông Số Kỹ Thuật
            </h2>
          </header>

          <div className="pdp-specs-container">
            {product.specs.map((spec, i) => {
              const parts = spec.split(/:\s*/);
              const label = parts.length > 1 ? parts[0] : `Đặc tính ${i + 1}`;
              const value = parts.length > 1 ? parts.slice(1).join(" ") : spec;
              return (
                <div key={i} className="pdp-spec-row">
                  <span className="pdp-spec-key">{label}</span>
                  <span className="pdp-spec-val">{value}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ====================================================================
          SECTION: MUA SẮM TẠI INFINITY STORE
          ==================================================================== */}
      <section id="pdp-services" className="pdp-section-wrap" aria-labelledby="pdp-commitments-heading">
        <header className="pdp-section-header">
          <span className="pdp-section-eyebrow">DỊCH VỤ ĐẲNG CẤP</span>
          <h2 id="pdp-commitments-heading" className="pdp-section-title">
            Mua Sắm Tại Infinity Store
          </h2>
          <p className="pdp-section-desc">
            Trải nghiệm mua sắm thiết bị công nghệ chính hãng với chế độ hậu mãi chuẩn mực và tận tâm.
          </p>
        </header>

        <div className="pdp-commitments-grid">
          <article className="pdp-commitment-card">
            <div className="pdp-commitment-icon"></div>
            <h4>Sản Phẩm Chính Hãng</h4>
            <p>Nguồn gốc xuất xứ rõ ràng, 100% nguyên seal, kích hoạt bảo hành điện tử chính hãng từ ngày nhận máy.</p>
          </article>
          <article className="pdp-commitment-card">
            <div className="pdp-commitment-icon">⚡</div>
            <h4>Giao Hỏa Tốc 2 Giờ</h4>
            <p>Kiểm tra kỹ serial/IMEI và đóng gói chống sốc chuyên dụng trước khi giao tận tay khách hàng nội thành.</p>
          </article>
          <article className="pdp-commitment-card">
            <div className="pdp-commitment-icon">↺</div>
            <h4>Thu Cũ Đổi Mới</h4>
            <p>Định giá máy cũ nhanh chóng trong 5 phút, trợ giá thu cũ lên đến 95% không phân biệt xuất xứ máy.</p>
            <div className="pdp-commitment-icon">🛡️</div>
            <h4>Bảo Hành 1 Đổi 1</h4>
            <p>Hỗ trợ 1 đổi 1 trong 30 ngày nếu phát sinh lỗi phần cứng từ nhà sản xuất, bảo hành chính hãng tới 24 tháng.</p>
          </article>
          <article className="pdp-commitment-card">
            <div className="pdp-commitment-icon">💳</div>
            <h4>Trả Góp 0% Linh Hoạt</h4>
            <p>Hỗ trợ trả góp qua thẻ tín dụng và CCCD qua các đối tác tài chính uy tín, xét duyệt hồ sơ trong 15 phút.</p>
          </article>
        </div>
      </section>

      {/* ====================================================================
          SECTION: INSTALLMENT BANNER
          ==================================================================== */}
      <section className="pdp-section-wrap" aria-label="Mô phỏng trả góp">
        <div className="pdp-installment-banner">
          <div className="pdp-installment-info">
            <span className="pdp-section-eyebrow" style={{ color: "#38bdf8" }}>TÀI CHÍNH THÔNG MINH</span>
            <h3>Thanh Toán Linh Hoạt &amp; Trả Góp 0%</h3>
            <p>
              Sở hữu ngay <strong>{product.name}</strong> với phương án trả góp phù hợp ngân sách cá nhân. Chỉ cần trả trước từ 10% đến 30% giá trị máy.
            </p>
          </div>
          <Link href={installmentHref} className="pdp-installment-cta">
            <span>Mô Phỏng Khoản Góp Ngay →</span>
          </Link>
        </div>
      </section>

      {/* ====================================================================
          SECTION: SẢN PHẨM CÙNG DÒNG / CÓ THỂ BẠN QUAN TÂM
          ==================================================================== */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="pdp-section-wrap" aria-labelledby="pdp-related-heading">
          <header className="pdp-section-header">
            <span className="pdp-section-eyebrow">KHÁM PHÁ THÊM</span>
            <h2 id="pdp-related-heading" className="pdp-section-title">
              Sản Phẩm Cùng Dòng Bạn Có Thể Quan Tâm
            </h2>
          </header>

          <div className="pdp-related-grid">
            {relatedProducts.map((rel) => {
              const relPrice = rel.salePrice || rel.sellingPrice || rel.price;
              const formattedRelPrice = relPrice.toLowerCase().startsWith("từ") ? relPrice : `Từ ${relPrice}`;
              return (
                <article key={rel.slug} className="product-card" aria-labelledby={`rel-title-${rel.slug}`}>
                  <div className="product-image-wrapper">
                    {rel.badge && <span className="product-badge badge-pro">{rel.badge}</span>}
                    <Link
                      href={`/san-pham/${rel.slug}`}
                      className="product-image"
                      style={{ width: "100%", height: "100%", position: "relative", display: "block" }}
                    >
                      <Image
                        src={rel.image}
                        alt={rel.name}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 280px"
                        style={{ objectFit: "contain", padding: "16px" }}
                      />
                    </Link>
                  </div>
                  <div className="product-body">
                    <p className="product-brand" style={{ color: "#0088cc", fontWeight: 700, fontSize: "11.5px" }}>
                      {rel.brand || "Apple Chính Hãng"}
                    </p>
                    <h3 id={`rel-title-${rel.slug}`} style={{ minHeight: "42px" }}>
                      <Link href={`/san-pham/${rel.slug}`} style={{ color: "#0f172a", fontWeight: 700 }}>
                        {rel.name}
                      </Link>
                    </h3>
                    <div className="product-meta">
                      <div>
                        <strong className="product-price-highlight">{formattedRelPrice}</strong>
                      </div>
                    </div>
                    <div className="product-actions" style={{ marginTop: "auto", paddingTop: "10px" }}>
                      <Link
                        href={`/san-pham/${rel.slug}`}
                        className="mini-cta"
                        style={{ background: "#0088cc", color: "#fff", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 700, width: "100%", textAlign: "center" }}
                      >
                        Xem chi tiết &amp; Đặt mua →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
