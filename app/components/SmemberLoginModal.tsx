"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useSearchParams } from "next/navigation";

interface SmemberLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SmemberLoginModal({ isOpen, onClose }: SmemberLoginModalProps) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const task = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(task);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const currentQuery = searchParams.toString();
  const returnUrl = encodeURIComponent(`${pathname || "/"}${currentQuery ? `?${currentQuery}` : ""}`);

  return createPortal(
    <div
      className="smember-modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
    >
      <div
        className="smember-modal-box"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="smember-modal-title"
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "420px",
          padding: "24px 24px 28px",
          position: "relative",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.25)",
          textAlign: "center",
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ"
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            border: "none",
            background: "#f1f5f9",
            color: "#64748b",
            fontSize: "16px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
        >
          ✕
        </button>

        {/* Header Title */}
        <h3
          id="smember-modal-title"
          style={{
            margin: "0 0 16px",
            fontSize: "22px",
            fontWeight: 800,
            color: "#0071e3",
            letterSpacing: "-0.02em",
          }}
        >
          INFINITY MEMBER
        </h3>

        {/* Mascot */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "0 auto 16px",
            height: "140px",
          }}
        >
          <Image
            src="/infinity-member/mascot-promotion.svg"
            alt="Ưu đãi Infinity Member"
            width={140}
            height={110}
            style={{ objectFit: "contain" }}
            unoptimized
            priority
          />
        </div>

        {/* Body Description */}
        <p
          style={{
            fontSize: "14px",
            lineHeight: "1.55",
            color: "#334155",
            margin: "0 0 24px",
            padding: "0 8px",
          }}
        >
          Vui lòng đăng nhập tài khoản <strong>Infinity Member</strong> để xem ưu đãi và thanh toán dễ dàng hơn.
        </p>

        {/* 2 Buttons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <Link
            href={`/member?mode=register&returnTo=${returnUrl}`}
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "44px",
              padding: "0 16px",
              borderRadius: "8px",
              border: "1.5px solid #0071e3",
              background: "#ffffff",
              color: "#0071e3",
              fontSize: "14.5px",
              fontWeight: 700,
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
          >
            Đăng ký
          </Link>

          <Link
            href={`/member?mode=login&returnTo=${returnUrl}`}
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "44px",
              padding: "0 16px",
              borderRadius: "8px",
              border: "1.5px solid #0071e3",
              background: "#0071e3",
              color: "#ffffff",
              fontSize: "14.5px",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(0, 113, 227, 0.25)",
              transition: "all 0.15s ease",
            }}
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
