"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/app/cart";
import type { ProductVariant } from "../products";

export interface QuickViewProduct {
  slug: string;
  name: string;
  brand?: string;
  category: string;
  image: string;
  badge?: string;
  price: string;
  sellingPrice?: string;
  salePrice?: string;
  stock?: number;
  specs?: string[];
  colors?: string[];
  colorOptions?: { name: string; hex: string; image?: string }[];
  storageOptions?: string[];
  tagline?: string;
  variants?: ProductVariant[];
}

interface QuickViewProps {
  product: QuickViewProduct | null;
  onClose: () => void;
}

export default function ProductQuickViewModal({ product, onClose }: QuickViewProps) {
  const { addItem, isLoggedIn } = useCart();
  const [mounted, setMounted] = useState(false);
  const [selectedStorage, setSelectedStorage] = useState(product?.storageOptions?.[0] || "");
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [addedMessage, setAddedMessage] = useState(false);

  useEffect(() => {
    const mountTask = window.setTimeout(() => setMounted(true), 0);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(mountTask);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!product || !mounted) return null;

  const colorOptions = product.colorOptions?.length
    ? product.colorOptions
    : (product.colors && product.colors.length > 0 ? product.colors : ["#1d1d1f", "#e5e5ea"]).map((hex, i) => ({
        name: `Màu ${i + 1}`,
        hex,
      }));

  const activeColor = colorOptions[selectedColorIndex] ?? colorOptions[0] ?? { name: "Tiêu chuẩn", hex: "#0088cc" };

  // Lookup matching variant if available
  const matchingVariant = product.variants?.find((v) => {
    const matchStorage = !selectedStorage || v.storage === selectedStorage;
    const matchColor = !activeColor?.name || (v.color && v.color.toLowerCase() === activeColor.name.toLowerCase());
    return matchStorage && matchColor;
  });

  const variantImage =
    matchingVariant?.image ||
    (activeColor && "image" in activeColor && typeof (activeColor as { image?: unknown }).image === "string"
      ? (activeColor as { image: string }).image
      : undefined);

  const activeImage = variantImage || product.image;
  const currentPrice =
    matchingVariant?.price || product.salePrice || product.sellingPrice || product.price || "";

  const handleAddToCart = () => {
    const numericPrice = parseInt(currentPrice.replace(/\D/g, ""), 10) || 10000000;

    addItem(
      {
        productSlug: product.slug,
        productName: product.name,
        unitPrice: numericPrice,
        image: activeImage,
        ram: "",
        storage: selectedStorage,
        color: activeColor.name,
      },
      1,
    );

    if (!isLoggedIn) return;
    setAddedMessage(true);
    setTimeout(() => setAddedMessage(false), 2500);
  };

  const modalContent = (
    <div
      className="apple-pay-sheet-modal"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
    >
      <div
        className="apple-pay-sheet-card apple-quickview-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="apple-sheet-pull-handle" aria-hidden="true" />

        <button
          type="button"
          onClick={onClose}
          className="apple-modal-close-btn"
          aria-label="Đóng"
        >
          ×
        </button>

        {/* Left Column: Product Visual Showcase with Halo */}
        <div className="apple-quickview-media-box">
          <div
            style={{
              position: "absolute",
              width: "260px",
              height: "260px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${activeColor.hex}33 0%, transparent 70%)`,
              filter: "blur(35px)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              minHeight: "320px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
            }}
          >
            <Image
              src={activeImage}
              alt={product.name}
              width={340}
              height={340}
              style={{
                objectFit: "contain",
                maxWidth: "92%",
                maxHeight: "320px",
                width: "auto",
                height: "auto",
                margin: "auto",
                mixBlendMode: "multiply",
              }}
              unoptimized
            />
          </div>
        </div>

        {/* Right Column: Configurations & Action */}
        <div className="apple-quickview-info-box">
          <div>
            <span
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                fontWeight: 800,
                color: "#0088cc",
                letterSpacing: "0.06em",
              }}
            >
              {product.brand || "Apple"} · {product.badge || "Chính hãng VN/A"}
            </span>
            <h2
              id="quick-view-title"
              style={{
                fontSize: "22px",
                fontWeight: 800,
                margin: "6px 0 10px",
                color: "#0f172a",
                lineHeight: 1.25,
              }}
            >
              {product.name}
            </h2>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 900,
                color: "#e8790a",
                marginBottom: "16px",
              }}
            >
              {currentPrice}
            </div>

            {/* Storage selector if available */}
            {product.storageOptions && product.storageOptions.length > 0 && (
              <div style={{ marginBottom: "18px" }}>
                <span
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#86868b",
                    marginBottom: "8px",
                  }}
                >
                  Dung lượng lưu trữ:
                </span>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {product.storageOptions.map((storage) => (
                    <button
                      key={storage}
                      type="button"
                      onClick={() => setSelectedStorage(storage)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "10px",
                        border: selectedStorage === storage ? "2px solid #0071e3" : "1.5px solid #d2d2d7",
                        background: selectedStorage === storage ? "rgba(0,113,227,0.06)" : "#fff",
                        color: selectedStorage === storage ? "#0071e3" : "#1d1d1f",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {storage}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color switcher */}
            <div style={{ marginBottom: "20px" }}>
              <span
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#86868b",
                  marginBottom: "8px",
                }}
              >
                Màu sắc: <strong>{activeColor.name}</strong>
              </span>
              <div style={{ display: "flex", gap: "10px" }}>
                {colorOptions.map((c, i) => (
                  <button
                    key={`${c.name}-${i}`}
                    type="button"
                    onClick={() => setSelectedColorIndex(i)}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: c.hex,
                      border: i === selectedColorIndex ? "2px solid #0071e3" : "1.5px solid rgba(0,0,0,0.15)",
                      boxShadow: i === selectedColorIndex ? "0 0 0 3px rgba(0,113,227,0.25)" : "none",
                      cursor: "pointer",
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Highlights specs */}
            {product.specs && product.specs.length > 0 && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "18px" }}>
                {product.specs.slice(0, 3).map((spec) => (
                  <span key={spec} className="product-spec-chip">
                    ✓ {spec}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "grid", gap: "10px" }}>
            <button
              type="button"
              onClick={handleAddToCart}
              className="apple-checkout-submit-btn"
              style={{
                marginTop: 0,
                padding: "13px",
                background: addedMessage ? "#10b981" : "linear-gradient(135deg, #0088cc 0%, #0072aa 100%)",
                boxShadow: addedMessage ? "0 6px 20px rgba(16, 185, 129, 0.4)" : "0 6px 20px rgba(0, 136, 204, 0.3)",
                transition: "all 0.3s ease",
              }}
            >
              {addedMessage ? "✓ Đã thêm vào giỏ hàng thành công!" : "Thêm vào giỏ hàng"}
            </button>

            {addedMessage && (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "12px",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "12.5px",
                  color: "#15803d",
                  fontWeight: 700,
                }}
              >
                <span>✓ Đã cập nhật giỏ hàng</span>
                <Link
                  href="/gio-hang"
                  style={{
                    color: "#0088cc",
                    textDecoration: "underline",
                    fontWeight: 800,
                  }}
                  onClick={onClose}
                >
                  Xem giỏ ngay →
                </Link>
              </div>
            )}

            <Link
              href="/gio-hang"
              className="apple-pay-direct-btn"
              style={{ padding: "12px", textDecoration: "none" }}
              onClick={(event) => {
                if (!isLoggedIn) event.preventDefault();
                handleAddToCart();
                if (isLoggedIn) onClose();
              }}
            >
              <span>Mua ngay với</span>
              <span style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>Pay</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
