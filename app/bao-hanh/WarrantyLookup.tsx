"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Warranty = {
  orderCode: string;
  productName: string;
  items: Array<{ productName: string; ram: string; storage: string; color: string; quantity: number }>;
  orderStatus: string;
  invoiceNumber: string;
  warrantyMonths: number;
  warrantyStartDate: string;
  warrantyEndDate: string;
  warrantySerials: string;
  warrantyPolicy: string;
  branchName: string;
};

export default function WarrantyLookup() {
  const [warranty, setWarranty] = useState<Warranty | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setWarranty(null);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/warranty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json() as { warranty?: Warranty; message?: string };
    setLoading(false);
    if (!response.ok || !result.warranty) {
      setMessage(result.message || "Không thể tra cứu bảo hành.");
      return;
    }
    setWarranty(result.warranty);
  }

  return <div className="warranty-lookup-layout">
    <section className="warranty-lookup-card">
      <p className="eyebrow">Tra cứu nhanh</p>
      <h1>Bảo hành sản phẩm</h1>
      <p>Nhập mã đơn hàng và số điện thoại đã dùng khi mua máy. Thông tin chỉ hiển thị khi cả hai dữ liệu trùng khớp.</p>
      <form onSubmit={submit}>
        <label>Mã đơn hàng<input name="orderCode" required minLength={6} maxLength={25} autoCapitalize="characters" placeholder="Ví dụ: HA1A2B3C4D5E" /></label>
        <label>Số điện thoại mua hàng<input name="phone" required type="tel" inputMode="tel" placeholder="0901 234 567" /></label>
        {message && <p className="warranty-error" role="alert">{message}</p>}
        <button className="button button-primary" disabled={loading}>{loading ? "Đang tra cứu..." : "Kiểm tra bảo hành"}</button>
      </form>
      <div className="warranty-member-note"><strong>Đã là Infinity Company Member?</strong><span>Đăng nhập để xem toàn bộ đơn mua, hóa đơn và bảo hành trong một nơi.</span><Link href="/tai-khoan">Mở tài khoản member →</Link></div>
    </section>

    <section className={`warranty-result ${warranty ? "has-result" : ""}`} aria-live="polite">
      {!warranty ? <div className="warranty-empty"><span aria-hidden="true">✓</span><h2>Thông tin bảo hành rõ ràng</h2><p>Thời hạn, ngày kích hoạt, serial/IMEI và nơi tiếp nhận sẽ hiển thị tại đây.</p></div> : <>
        <header><div><span>Đã tìm thấy hồ sơ</span><h2>{warranty.productName}</h2></div><i>{warranty.warrantyStartDate ? "Đã kích hoạt" : "Chờ kích hoạt"}</i></header>
        <div className="warranty-result-grid">
          <div><span>Mã đơn hàng</span><strong>{warranty.orderCode}</strong></div>
          <div><span>Số hóa đơn</span><strong>{warranty.invoiceNumber || "Chưa phát hành"}</strong></div>
          <div><span>Thời hạn</span><strong>{warranty.warrantyMonths || 12} tháng</strong></div>
          <div><span>Chi nhánh tiếp nhận</span><strong>{warranty.branchName || "Infinity Company"}</strong></div>
          <div><span>Ngày bắt đầu</span><strong>{formatDate(warranty.warrantyStartDate) || "Chưa kích hoạt"}</strong></div>
          <div><span>Ngày hết hạn</span><strong>{formatDate(warranty.warrantyEndDate) || "Chưa xác định"}</strong></div>
        </div>
        <div className="warranty-products"><h3>Sản phẩm bảo hành</h3>{(warranty.items.length ? warranty.items : [{ productName: warranty.productName, ram: "", storage: "", color: "", quantity: 1 }]).map((item, index) => <article key={`${item.productName}-${index}`}><div><strong>{item.productName}</strong><span>{[item.ram && `RAM ${item.ram}`, item.storage, item.color].filter(Boolean).join(" · ") || "Theo cấu hình trên đơn"}</span></div><b>x{item.quantity}</b></article>)}</div>
        <div className="warranty-serial"><span>Serial / IMEI</span><strong>{warranty.warrantySerials || "Cửa hàng chưa cập nhật"}</strong></div>
        <div className="warranty-policy"><h3>Điều kiện bảo hành</h3><p>{warranty.warrantyPolicy || "Sản phẩm được bảo hành theo chính sách nhà sản xuất hoặc nhà cung cấp. Vui lòng mang theo sản phẩm và mã đơn hàng khi đến cửa hàng."}</p></div>
      </>}
    </section>
  </div>;
}

function formatDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}
