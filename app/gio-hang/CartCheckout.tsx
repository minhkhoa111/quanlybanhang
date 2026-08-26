"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useCart } from "@/app/cart";
import { formatOrderMoney } from "@/app/order-pricing";

const BANK_PAYMENT = "Chuyển khoản Techcombank 24/7 - 6820102010";
const MOMO_PAYMENT = "MoMo - 0869275642";
const APPLE_PAYMENT = "Apple Pay - xác nhận với cửa hàng";
const STORE_VISIT = "Đến cửa hàng xem máy";

type Customer = { name: string; email: string; phone: string };
type VoucherQuote = { code: string; discount: number; subtotal: number };
type Branch = { id: string; name: string; address: string; phone: string; hours: string };

export default function CartCheckout({ branches }: { branches: Branch[] }) {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [purchaseMode, setPurchaseMode] = useState<"online" | "store">("online");
  const [branchId, setBranchId] = useState("");
  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState<VoucherQuote | null>(null);
  const [voucherMessage, setVoucherMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(BANK_PAYMENT);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [submittedTotal, setSubmittedTotal] = useState(0);
  const activeVoucher = purchaseMode === "online" && voucher?.subtotal === subtotal ? voucher : null;
  const total = Math.max(0, subtotal - (activeVoucher?.discount ?? 0));
  const selectedBranch = branches.find((branch) => branch.id === branchId);

  useEffect(() => { void fetch("/api/account/me").then((response) => response.json()).then((data) => setCustomer(data.customer)).catch(() => undefined); }, []);

  function chooseMode(mode: "online" | "store") {
    setPurchaseMode(mode);
    setMessage("");
    if (mode === "store") {
      setPaymentMethod("");
      setVoucher(null);
      setVoucherMessage("");
    } else setPaymentMethod(BANK_PAYMENT);
  }

  async function applyVoucher() {
    setVoucherMessage("");
    try {
      const response = await fetch("/api/vouchers/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: voucherInput, subtotal }) });
      const result = await response.json() as { code?: string; discount?: number; message?: string };
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
    if (purchaseMode === "store" && !selectedBranch) { setStatus("error"); setMessage("Vui lòng chọn chi nhánh muốn đến xem máy."); return; }
    if (purchaseMode === "online" && !paymentMethod) { setStatus("error"); setMessage("Vui lòng chọn phương thức thanh toán online."); return; }
    setStatus("sending");
    setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: data.get("name"), phone: data.get("phone"), email: data.get("email"),
          deliveryMethod: purchaseMode === "store" ? STORE_VISIT : "Giao hàng tận nơi",
          branchId: purchaseMode === "store" ? branchId : "",
          address: purchaseMode === "online" ? data.get("address") : "",
          paymentMethod: purchaseMode === "online" ? paymentMethod : "",
          note: data.get("note"), voucherCode: activeVoucher?.code || "",
          items: items.map(({ productSlug, ram, storage, color, quantity }) => ({ productSlug, ram, storage, color, quantity })),
        }),
      });
      const result = await response.json() as { ok?: boolean; orderCode?: string; message?: string };
      if (!response.ok || !result.ok) throw new Error(result.message || "Không thể tạo đơn hàng.");
      setOrderCode(result.orderCode || "");
      setExpiresAt(Date.now() + 10 * 60 * 1000);
      setSubmittedTotal(total);
      setStatus("success");
      clearCart();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Không thể tạo đơn hàng.");
    }
  }

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const isStoreVisit = purchaseMode === "store";
  const qrUrl = paymentMethod === MOMO_PAYMENT
    ? `/api/momo-qr?orderCode=${encodeURIComponent(orderCode)}&expiresAt=${expiresAt}`
    : `/api/payment-qr?orderCode=${encodeURIComponent(orderCode)}&expiresAt=${expiresAt}`;

  if (status === "success") return (
    <section className="cart-success">
      <span>✓</span><h1>{isStoreVisit ? "Đã gửi yêu cầu xem máy" : "Đã tiếp nhận đơn hàng"}</h1>
      <p>Mã yêu cầu của bạn là <strong>{orderCode}</strong>.</p>
      {isStoreVisit && <div className="cart-store-confirmation"><strong>{selectedBranch?.name}</strong><span>{selectedBranch?.address}</span><small>Nhân viên chi nhánh sẽ tiếp nhận đơn và liên hệ tư vấn trước khi bạn đến xem máy. Chưa phát sinh thanh toán.</small></div>}
      {!isStoreVisit && (paymentMethod === BANK_PAYMENT || paymentMethod === MOMO_PAYMENT) && <div className={`cart-bank-qr${paymentMethod === MOMO_PAYMENT ? " is-momo" : ""}`}><Image src={qrUrl} alt={`QR thanh toán đơn ${orderCode}`} width={280} height={280} unoptimized /><div><strong>{paymentMethod === MOMO_PAYMENT ? "Quét QR MoMo" : "Quét QR Techcombank"}</strong><span>Số tiền cần thanh toán: {formatOrderMoney(submittedTotal)}</span><span>Nội dung: {orderCode}</span><small>{paymentMethod === MOMO_PAYMENT ? "Sau khi quét, vui lòng nhập đúng số tiền và mã đơn đang hiển thị để cửa hàng đối soát." : "QR có hiệu lực 10 phút và tự điền đúng số tiền của đơn hàng."}</small></div></div>}
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
            <fieldset className="cart-order-mode"><legend>Bạn muốn mua theo cách nào?</legend><div><label><input type="radio" checked={purchaseMode === "online"} onChange={() => chooseMode("online")} /><span><strong>Đặt hàng online</strong><small>Giao tận nơi và thanh toán trực tuyến</small></span></label><label><input type="radio" checked={purchaseMode === "store"} onChange={() => chooseMode("store")} /><span><strong>Đến cửa hàng xem máy</strong><small>Chọn chi nhánh, nhân viên gọi tư vấn</small></span></label></div></fieldset>
            <div className="form-row"><label>Họ và tên<input name="name" required defaultValue={customer?.name} /></label><label>Số điện thoại<input name="phone" required type="tel" defaultValue={customer?.phone} pattern="[0-9 +]{9,15}" /></label></div>
            <label>Email<input name="email" type="email" defaultValue={customer?.email} /></label>
            {isStoreVisit ? <label>Chi nhánh muốn xem máy<select value={branchId} onChange={(event) => setBranchId(event.target.value)} required><option value="" disabled>Chọn chi nhánh</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} · {branch.address}</option>)}</select></label> : <label>Địa chỉ giao hàng<textarea name="address" rows={2} required placeholder="Số nhà, đường, phường/xã, tỉnh/thành" /></label>}
            {!isStoreVisit && <div className="cart-voucher"><label>Mã voucher<input value={voucherInput} onChange={(event) => setVoucherInput(event.target.value.toUpperCase())} placeholder="Nhập mã giảm giá" /></label><button type="button" onClick={applyVoucher} disabled={!voucherInput.trim()}>Áp dụng</button>{voucherMessage && <p className={activeVoucher ? "is-success" : "is-error"}>{activeVoucher ? voucherMessage : "Giỏ hàng đã thay đổi, vui lòng áp dụng lại voucher."}</p>}</div>}
            {!isStoreVisit && <fieldset className="cart-payment"><legend>Thanh toán online</legend>{[BANK_PAYMENT, MOMO_PAYMENT, APPLE_PAYMENT].map((method) => <label key={method}><input type="radio" name="payment" checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} required />{method}</label>)}</fieldset>}
            {isStoreVisit && <div className="cart-consult-notice"><strong>Không cần thanh toán</strong><span>Yêu cầu sẽ chuyển thẳng đến chi nhánh để nhân viên tiếp nhận và tư vấn.</span></div>}
            <label>Ghi chú<textarea name="note" rows={2} placeholder={isStoreVisit ? "Thời gian dự kiến đến, màu máy muốn xem..." : "Yêu cầu giao hàng..."} /></label>
            <dl className="cart-totals"><div><dt>Tạm tính</dt><dd>{formatOrderMoney(subtotal)}</dd></div>{activeVoucher && <div><dt>Voucher {activeVoucher.code}</dt><dd>-{formatOrderMoney(activeVoucher.discount)}</dd></div>}<div><dt>{isStoreVisit ? "Giá máy dự kiến" : "Tổng thanh toán"}</dt><dd>{formatOrderMoney(total)}</dd></div></dl>
            {message && <p className="cart-error">{message}</p>}
            <button className="button button-primary cart-submit" disabled={status === "sending"}>{status === "sending" ? "Đang gửi..." : isStoreVisit ? "Gửi yêu cầu để nhân viên tư vấn" : "Đặt hàng online"}</button>
          </aside>
        </form>
      )}
    </>
  );
}
