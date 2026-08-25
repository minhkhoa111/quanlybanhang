"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useCart } from "@/app/cart";
import { formatOrderMoney } from "@/app/order-pricing";

const BANK_PAYMENT = "Chuyển khoản Techcombank 24/7 - 6820102010";

type Customer = { name: string; email: string; phone: string };
type VoucherQuote = { code: string; discount: number; subtotal: number };

export default function CartCheckout() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState<VoucherQuote | null>(null);
  const [voucherMessage, setVoucherMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Thanh toán khi nhận máy");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const activeVoucher = voucher?.subtotal === subtotal ? voucher : null;
  const total = Math.max(0, subtotal - (activeVoucher?.discount ?? 0));

  useEffect(() => { void fetch("/api/account/me").then((response) => response.json()).then((data) => setCustomer(data.customer)).catch(() => undefined); }, []);

  async function applyVoucher() {
    setVoucherMessage("");
    try {
      const response = await fetch("/api/vouchers/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: voucherInput, subtotal }) });
      const result = await response.json() as { ok?: boolean; code?: string; discount?: number; message?: string };
      if (!response.ok) throw new Error(result.message || "Voucher không hợp lệ.");
      setVoucher({ code: result.code || "", discount: Number(result.discount) || 0, subtotal });
      setVoucherInput(result.code || voucherInput.toUpperCase());
      setVoucherMessage(`Đã giảm ${formatOrderMoney(Number(result.discount) || 0)}.`);
    } catch (error) {
      setVoucher(null);
      setVoucherMessage(error instanceof Error ? error.message : "Voucher không hợp lệ.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) return;
    setStatus("sending");
    setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: data.get("name"), phone: data.get("phone"), email: data.get("email"),
          deliveryMethod: data.get("delivery"), address: data.get("address"), paymentMethod,
          note: data.get("note"), voucherCode: activeVoucher?.code || "",
          items: items.map(({ productSlug, ram, storage, color, quantity }) => ({ productSlug, ram, storage, color, quantity })),
        }),
      });
      const result = await response.json() as { ok?: boolean; orderCode?: string; message?: string };
      if (!response.ok || !result.ok) throw new Error(result.message || "Không thể tạo đơn hàng.");
      const nextExpiresAt = Date.now() + 10 * 60 * 1000;
      setOrderCode(result.orderCode || "");
      setExpiresAt(nextExpiresAt);
      setStatus("success");
      clearCart();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Không thể tạo đơn hàng.");
    }
  }

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  if (status === "success") return (
    <section className="cart-success">
      <span>✓</span><h1>Đã tiếp nhận đơn hàng</h1><p>Mã đơn của bạn là <strong>{orderCode}</strong>.</p>
      {paymentMethod === BANK_PAYMENT && <div className="cart-bank-qr"><Image src={`/api/payment-qr?orderCode=${encodeURIComponent(orderCode)}&expiresAt=${expiresAt}`} alt={`QR thanh toán đơn ${orderCode}`} width={280} height={280} unoptimized /><div><strong>Quét QR Techcombank</strong><span>Số tiền: {formatOrderMoney(total)}</span><small>QR có hiệu lực 10 phút, nội dung chuyển khoản là mã đơn hàng.</small></div></div>}
      <Link className="button button-primary" href="/">Tiếp tục mua sắm</Link>
    </section>
  );

  return (
    <>
      <header className="cart-heading"><div><span>GIỎ HÀNG</span><h1>{itemCount} sản phẩm đã chọn</h1></div><Link href="/">Tiếp tục mua hàng</Link></header>
      {!items.length ? <section className="cart-empty"><h2>Giỏ hàng đang trống</h2><p>Chọn cấu hình và thêm sản phẩm bạn muốn mua.</p><Link className="button button-primary" href="/iphone">Xem sản phẩm</Link></section> : (
        <form className="cart-layout" onSubmit={submit}>
          <section className="cart-items">
            {items.map((item) => <article className="cart-line" key={item.key}>
              <div className="cart-line-image"><Image src={item.image} alt={item.productName} fill unoptimized sizes="110px" /></div>
              <div className="cart-line-info"><strong>{item.productName}</strong><span>{[item.ram && `${item.ram} RAM`, item.storage, item.color].filter(Boolean).join(" · ")}</span><small>{formatOrderMoney(item.unitPrice)}</small></div>
              <div className="cart-line-quantity"><button type="button" onClick={() => updateQuantity(item.key, item.quantity - 1)}>−</button><span>{item.quantity}</span><button type="button" onClick={() => updateQuantity(item.key, item.quantity + 1)}>+</button></div>
              <strong className="cart-line-total">{formatOrderMoney(item.unitPrice * item.quantity)}</strong>
              <button className="cart-line-remove" type="button" onClick={() => removeItem(item.key)} aria-label={`Xóa ${item.productName}`}>×</button>
            </article>)}
          </section>

          <aside className="cart-checkout">
            <div className="cart-checkout-head"><h2>Thông tin đặt hàng</h2>{customer ? <span>Đang mua với tài khoản {customer.email}</span> : <Link href="/tai-khoan">Đăng nhập để lưu thông tin</Link>}</div>
            <div className="form-row"><label>Họ và tên<input name="name" required defaultValue={customer?.name} /></label><label>Số điện thoại<input name="phone" required type="tel" defaultValue={customer?.phone} pattern="[0-9 +]{9,15}" /></label></div>
            <label>Email<input name="email" type="email" defaultValue={customer?.email} /></label>
            <label>Nhận hàng<select name="delivery" required defaultValue="Giao hàng tận nơi"><option>Giao hàng tận nơi</option><option>Nhận tại cửa hàng</option></select></label>
            <label>Địa chỉ<textarea name="address" rows={2} placeholder="Bỏ trống nếu nhận tại cửa hàng" /></label>

            <div className="cart-voucher"><label>Mã voucher<input value={voucherInput} onChange={(event) => setVoucherInput(event.target.value.toUpperCase())} placeholder="Nhập mã giảm giá" /></label><button type="button" onClick={applyVoucher} disabled={!voucherInput.trim()}>Áp dụng</button>{voucherMessage && <p className={activeVoucher ? "is-success" : "is-error"}>{activeVoucher ? voucherMessage : "Giỏ hàng đã thay đổi, vui lòng áp dụng lại voucher."}</p>}</div>

            <fieldset className="cart-payment"><legend>Thanh toán</legend>{["Thanh toán khi nhận máy", "Thanh toán tại cửa hàng", BANK_PAYMENT, "MoMo - 0869275642", "Apple Pay - xác nhận với cửa hàng"].map((method) => <label key={method}><input type="radio" name="payment" checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} />{method}</label>)}</fieldset>
            <label>Ghi chú<textarea name="note" rows={2} /></label>
            <dl className="cart-totals"><div><dt>Tạm tính</dt><dd>{formatOrderMoney(subtotal)}</dd></div>{activeVoucher && <div><dt>Voucher {activeVoucher.code}</dt><dd>-{formatOrderMoney(activeVoucher.discount)}</dd></div>}<div><dt>Tổng thanh toán</dt><dd>{formatOrderMoney(total)}</dd></div></dl>
            {message && <p className="cart-error">{message}</p>}
            <button className="button button-primary cart-submit" disabled={status === "sending"}>{status === "sending" ? "Đang tạo đơn..." : "Đặt hàng"}</button>
          </aside>
        </form>
      )}
    </>
  );
}
