"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "../products";
import ProductQuickViewModal from "./ProductQuickViewModal";

export default function ProductCard({
  product,
  canManage = false,
}: {
  product: Product;
  canManage?: boolean;
}) {
  const router = useRouter();
  const needsStockConfirmation = product?.stock === 0;
  const [showQuickView, setShowQuickView] = useState(false);
  const [activeColorIndex, setActiveColorIndex] = useState(0);

  if (!product) return null;

  const rawColorOptions = Array.isArray(product.colorOptions) && product.colorOptions.length > 0
    ? product.colorOptions
    : Array.isArray(product.colors) && product.colors.length > 0
    ? product.colors.map((hex, index) => ({ name: `Màu ${index + 1}`, hex: typeof hex === "string" ? hex : "#0071e3" }))
    : [{ name: "Tiêu chuẩn", hex: "#0071e3" }];

  const colorOptions = rawColorOptions.map((c, i) => {
    if (typeof c === "string") return { name: c, hex: "#0071e3" };
    return {
      name: (c && typeof c === "object" && "name" in c && c.name) ? String(c.name) : `Màu ${i + 1}`,
      hex: (c && typeof c === "object" && "hex" in c && c.hex) ? String(c.hex) : "#0071e3",
    };
  });

  const activeColor = colorOptions[activeColorIndex] ?? colorOptions[0] ?? { name: "Tiêu chuẩn", hex: "#0071e3" };
  const variantImage = activeColor?.name
    ? product.variants?.find(
        (v) => v && v.color && typeof v.color === "string" && v.color.toLowerCase() === activeColor.name.toLowerCase(),
      )?.image
    : undefined;
  const displayImage = variantImage || product.image || "";

  const isApple =
    (product.brand && product.brand.toLowerCase() === "apple") ||
    /iphone|macbook|ipad|imac|watch|apple/i.test(product.slug || "");

  const currentPrice = product.salePrice || product.sellingPrice || product.price || "";
  const formattedPrice = currentPrice
    ? currentPrice.toLowerCase().startsWith("từ")
      ? currentPrice
      : currentPrice.endsWith("đ") || currentPrice.endsWith("₫")
      ? currentPrice
      : `${currentPrice}₫`
    : "Liên hệ";

  // Show a discount only when the catalog supplies a higher original price.
  const numCurrent = Number(currentPrice.replace(/\D/g, "")) || 0;
  const numOriginal = Number((product.price || "").replace(/\D/g, "")) || 0;
  let discountPercent = 0;
  let oldPrice = "";

  if (numOriginal > numCurrent && numCurrent > 0) {
    discountPercent = Math.round(((numOriginal - numCurrent) / numOriginal) * 100);
    oldPrice = product.price;
  }

  return (
    <>
      <article
        className="product-card cps-product-card"
        aria-labelledby={`product-title-${product.slug}`}
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.05)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        }}
      >
        {/* Badges: Discount & Installment */}
        <div
          className="cps-card-badges"
          style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            zIndex: 3,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            alignItems: "flex-start",
          }}
        >
          {product.condition === "like-new" ? (
            <span
              className="cps-badge-condition cps-badge-condition-likenew"
              style={{
                background: "#f97316",
                color: "#ffffff",
                fontSize: "10px",
                fontWeight: 800,
                padding: "2px 6px",
                borderRadius: "4px",
                lineHeight: "1.2",
                boxShadow: "0 1px 3px rgba(249, 115, 22, 0.3)",
              }}
            >
              🔄 LIKE NEW
            </span>
          ) : product.condition === "new" ? (
            <span
              className="cps-badge-condition cps-badge-condition-new"
              style={{
                background: "#10b981",
                color: "#ffffff",
                fontSize: "10px",
                fontWeight: 800,
                padding: "2px 6px",
                borderRadius: "4px",
                lineHeight: "1.2",
                boxShadow: "0 1px 3px rgba(16, 185, 129, 0.3)",
              }}
            >
              ✨ MỚI (NEW)
            </span>
          ) : null}
          {discountPercent > 0 && (
            <span
              className="cps-badge-discount"
              style={{
                background: "#0071e3",
                color: "#ffffff",
                fontSize: "10.5px",
                fontWeight: 800,
                padding: "2px 6px",
                borderRadius: "4px",
                lineHeight: "1.2",
              }}
            >
              Giảm {discountPercent}%
            </span>
          )}
          <span
            className="cps-badge-installment"
            style={{
              background: "#f0f7ff",
              color: "#0071e3",
              border: "1px solid #bae6fd",
              fontSize: "10px",
              fontWeight: 700,
              padding: "1px 5px",
              borderRadius: "4px",
              lineHeight: "1.2",
            }}
          >
            Trả góp 0%
          </span>
        </div>

        {/* Admin Quick Edit Button */}
        {canManage && (
          <Link
            className="storefront-product-edit"
            href={`/admin/products/edit?slug=${encodeURIComponent(product.slug)}`}
            aria-label={`Sửa ${product.name}`}
            title="Sửa sản phẩm"
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              zIndex: 10,
              background: "#0071e3",
              color: "#fff",
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
              textDecoration: "none",
            }}
          >
            <span aria-hidden="true">✎</span>
          </Link>
        )}

        {/* Image Container with Guaranteed Aspect Ratio */}
        <div
          className="product-image-wrapper cps-card-media"
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1 / 1",
            minHeight: "180px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
            borderRadius: "8px",
            overflow: "hidden",
            margin: "0 0 10px",
          }}
        >
          <Link
            className="product-image"
            href={`/san-pham/${product.slug}`}
            aria-label={`Xem ${product.name}`}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {displayImage ? (
              <Image
                src={displayImage}
                alt={product.name}
                fill
                unoptimized
                sizes="(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 30vw"
                style={{ objectFit: "contain", padding: "12px" }}
              />
            ) : (
              <div style={{ color: "#94a3b8", fontSize: "12px" }}>Chưa có hình</div>
            )}
          </Link>

          {/* Quick View Button */}
          <button
            type="button"
            className="product-quick-view-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (needsStockConfirmation) { router.push(`/san-pham/${product.slug}`); return; }
              setShowQuickView(true);
            }}
            title="Xem nhanh thông tin"
            style={{
              position: "absolute",
              bottom: "6px",
              right: "6px",
              zIndex: 4,
              background: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #cbd5e1",
              color: "#0071e3",
              borderRadius: "6px",
              padding: "3px 7px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
            }}
          >
            <span>Xem nhanh ↗</span>
          </button>
        </div>

        {/* Card Body */}
        <div className="product-body cps-card-body" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <p
            className="product-brand"
            style={{
              color: "#0071e3",
              fontWeight: 700,
              fontSize: "11px",
              textTransform: "uppercase",
              margin: "0 0 4px",
              letterSpacing: "0.02em",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "4px",
            }}
          >
            <span>{product.brand || (isApple ? "Apple Chính Hãng" : "Phụ Kiện Chính Hãng")}</span>
            {product.conditionLabel && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: product.condition === "like-new" ? "#c2410c" : "#047857",
                  background: product.condition === "like-new" ? "#fff7ed" : "#ecfdf5",
                  border: product.condition === "like-new" ? "1px solid #fed7aa" : "1px solid #a7f3d0",
                  padding: "1px 5px",
                  borderRadius: "4px",
                  textTransform: "none",
                  letterSpacing: "normal",
                  whiteSpace: "nowrap",
                }}
              >
                {product.condition === "like-new" ? "Like New" : "New"}
              </span>
            )}
          </p>

          <h3
            id={`product-title-${product.slug}`}
            className="cps-card-name"
            style={{
              fontSize: "13.5px",
              fontWeight: 700,
              lineHeight: 1.4,
              margin: "0 0 6px",
              minHeight: "38px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            <Link
              href={`/san-pham/${product.slug}`}
              style={{ color: "#1e293b", textDecoration: "none" }}
            >
              {product.name}
            </Link>
          </h3>

          {Boolean(product.specs?.length) && <ul className="catalog-card-specs" aria-label="Thông số nổi bật">{product.specs.slice(0, 2).map((spec, index) => <li key={index} title={spec}>{spec}</li>)}</ul>}
          {/* Price Row: Current + Old */}
          <div
            className="cps-card-prices"
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "8px",
              margin: "4px 0 6px",
              flexWrap: "wrap",
            }}
          >
            <span
              className="cps-price-current"
              style={{
                color: "#0071e3",
                fontSize: "16px",
                fontWeight: 800,
              }}
            >
              {formattedPrice}
            </span>
            {oldPrice ? (
              <del
                className="cps-price-old"
                style={{
                  color: "#94a3b8",
                  fontSize: "12px",
                  textDecoration: "line-through",
                }}
              >
                {oldPrice}
              </del>
            ) : null}
          </div>

          {/* Infinity Store Member Benefit Pill */}
          <div
            className="cps-member-box"
            style={{
              background: "#f0f7ff",
              border: "1px dashed #bae6fd",
              borderRadius: "6px",
              padding: "4px 8px",
              fontSize: "11px",
              color: "#0071e3",
              fontWeight: 600,
              margin: "4px 0 8px",
              lineHeight: 1.3,
            }}
          >
            <span>👑 Infinity Member giảm thêm đến 1%</span>
          </div>

          {/* Color Dots if Available */}
          {colorOptions.length > 1 && (
            <div
              className="color-dots"
              aria-label="Màu sắc tham khảo"
              style={{
                display: "flex",
                gap: "6px",
                margin: "4px 0 8px",
                alignItems: "center",
              }}
            >
              {colorOptions.map((color, index) => (
                <button
                  key={`${color.name || "color"}-${index}`}
                  type="button"
                  title={color.name || `Màu ${index + 1}`}
                  onClick={() => setActiveColorIndex(index)}
                  style={{
                    backgroundColor: color.hex || "#0071e3",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    border: index === activeColorIndex ? "2px solid #0071e3" : "1px solid rgba(0,0,0,0.2)",
                    boxShadow: index === activeColorIndex ? "0 0 0 2px rgba(0,113,227,0.3)" : "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                  aria-label={color.name || `Màu ${index + 1}`}
                  aria-pressed={index === activeColorIndex}
                />
              ))}
            </div>
          )}

          <div className="catalog-card-availability">
          <span>{product.stock === 0 ? "Tạm hết hàng" : product.stock !== undefined ? "Có sẵn tại cửa hàng" : "Liên hệ kiểm tra hàng"}</span>
          <button type="button" onClick={() => { if (needsStockConfirmation) router.push(`/san-pham/${product.slug}`); else setShowQuickView(true); }}>Xem nhanh ↗</button>
        </div>

        {/* Actions: Chi tiết & Xem cấu hình / Đặt hàng */}
          <div
            className="product-actions"
            style={{
              marginTop: "auto",
              paddingTop: "8px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Link
              href={`/san-pham/${product.slug}`}
              style={{
                color: "#0071e3",
                fontWeight: 700,
                fontSize: "12.5px",
                textDecoration: "none",
              }}
            >
              Chi tiết →
            </Link>
            <Link
              className="mini-cta"
              href={`/san-pham/${product.slug}`}
              style={{
                background: "#0071e3",
                color: "#ffffff",
                borderRadius: "6px",
                padding: "5px 12px",
                fontSize: "11.5px",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Xem ngay
            </Link>
          </div>
        </div>
      </article>

      {/* Quick View Modal */}
      {showQuickView && (
        <ProductQuickViewModal
          product={{
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            category: product.category,
            image: displayImage,
            badge: product.badge,
            price: product.price,
            sellingPrice: product.sellingPrice,
            salePrice: product.salePrice,
            stock: product.stock,
            specs: product.specs,
            colors: product.colors,
            colorOptions: product.colorOptions,
            storageOptions: product.storageOptions,
            tagline: product.tagline,
            variants: product.variants,
          }}
          onClose={() => setShowQuickView(false)}
        />
      )}
    </>
  );
}
