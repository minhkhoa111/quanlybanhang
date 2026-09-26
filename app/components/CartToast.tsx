"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { CartLine } from "@/app/cart";

interface CartToastProps {
  item: CartLine | null;
  totalCount: number;
  onClose: () => void;
}

export default function CartToast({ item, totalCount, onClose }: CartToastProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (item) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 4500);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [item, onClose]);

  if (!mounted || !item) return null;

  const formattedPrice = item.unitPrice
    ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.unitPrice)
    : "";

  const variantText = [item.storage, item.color].filter(Boolean).join(" · ");

  const toastContent = (
    <div
      role="status"
      aria-live="polite"
      className={`cart-toast-wrapper ${visible ? "is-visible" : "is-hiding"}`}
    >
      <div className="cart-toast-card">
        {/* Top Header: Success Badge & Close Button */}
        <div className="cart-toast-header">
          <div className="cart-toast-badge">
            <span className="cart-toast-check" aria-hidden="true">✓</span>
            <strong>Đã thêm vào giỏ hàng!</strong>
          </div>
          <button
            type="button"
            className="cart-toast-close"
            onClick={() => {
              setVisible(false);
              setTimeout(onClose, 300);
            }}
            aria-label="Đóng thông báo"
          >
            ×
          </button>
        </div>

        {/* Product Details Row */}
        <div className="cart-toast-body">
          <div className="cart-toast-thumb">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.productName}
                width={52}
                height={52}
                style={{ objectFit: "contain" }}
                unoptimized
              />
            ) : (
              <div className="cart-toast-thumb-placeholder">📱</div>
            )}
          </div>
          <div className="cart-toast-info">
            <h4 className="cart-toast-title">{item.productName}</h4>
            {variantText && <p className="cart-toast-variant">{variantText}</p>}
            <p className="cart-toast-price">
              {formattedPrice} {item.quantity > 1 ? `× ${item.quantity}` : ""}
            </p>
          </div>
        </div>

        {/* Total Summary & Action Buttons */}
        <div className="cart-toast-footer">
          <span className="cart-toast-count">
            Giỏ hàng hiện có <strong>{totalCount}</strong> sản phẩm
          </span>
          <div className="cart-toast-actions">
            <Link
              href="/gio-hang"
              className="cart-toast-btn-secondary"
              onClick={() => {
                setVisible(false);
                onClose();
              }}
            >
              Xem giỏ hàng
            </Link>
            <Link
              href="/dat-hang"
              className="cart-toast-btn-primary"
              onClick={() => {
                setVisible(false);
                onClose();
              }}
            >
              Thanh toán ngay →
            </Link>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="cart-toast-progress-bar" aria-hidden="true" />
      </div>
    </div>
  );

  return createPortal(toastContent, document.body);
}

