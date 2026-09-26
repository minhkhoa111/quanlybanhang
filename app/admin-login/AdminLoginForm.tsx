"use client";

import { useState } from "react";
import Link from "next/link";
import { loginAdminAction } from "./actions";

export default function AdminLoginForm({ returnTo }: { returnTo: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);

  return (
    <form
      action={async (formData: FormData) => {
        setIsPending(true);
        await loginAdminAction(formData);
        setIsPending(false);
      }}
      className="admin-login-modern-form"
    >
      <input type="hidden" name="returnTo" value={returnTo} />

      {/* Username Field */}
      <div className="admin-field-group">
        <label htmlFor="admin-username" className="admin-field-label">
          Tên đăng nhập
        </label>
        <div className="admin-input-wrapper">
          <span className="admin-input-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <input
            id="admin-username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="Nhập tên tài khoản"
            required
            autoFocus
            className="admin-modern-input"
            disabled={isPending}
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="admin-field-group">
        <div className="admin-field-label-row">
          <label htmlFor="admin-password" className="admin-field-label">
            Mật khẩu
          </label>
        </div>
        <div className="admin-input-wrapper">
          <span className="admin-input-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <input
            id="admin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Nhập mật khẩu"
            required
            className="admin-modern-input"
            disabled={isPending}
          />
          <button
            type="button"
            className="admin-password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className={`admin-modern-submit-btn ${isPending ? "is-loading" : ""}`}
      >
        {isPending ? (
          <>
            <span className="admin-btn-spinner" aria-hidden="true" />
            <span>Đang đăng nhập…</span>
          </>
        ) : (
          <>
            <span>Đăng nhập hệ thống</span>
            <svg className="admin-btn-arrow-svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </>
        )}
      </button>

      {/* Security connection message */}
      <div className="admin-security-caption">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span>Kết nối bảo mật · Chỉ dành cho nhân sự được cấp quyền</span>
      </div>

      {/* Return to website link */}
      <div className="admin-back-wrapper">
        <Link href="/" className="admin-login-back-link" title="Quay lại Infinity Store">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          <span>Quay lại Infinity Store</span>
        </Link>
      </div>
    </form>
  );
}
