"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import type { PreorderProduct } from "@/app/preorder-products";

type Branch = { id: string; name: string; address: string; phone: string; hours: string };
type CustomerInfo = { name: string; phone: string; email: string };
type SubmitResult = {
  orderCode: string;
  branch: Branch;
};

export default function PreorderForm({
  products,
  branches,
  customer,
}: {
  products: PreorderProduct[];
  branches: Branch[];
  customer?: CustomerInfo;
}) {
  const [family, setFamily] = useState<PreorderProduct["family"]>("iphone");
  const visibleProducts = useMemo(() => products.filter((item) => item.family === family), [family, products]);
  const [productId, setProductId] = useState(products[0]?.id || "");
  const selectedProduct = products.find((item) => item.id === productId) || visibleProducts[0];
  const [configuration, setConfiguration] = useState(products[0]?.capacities[0] || "");
  const [color, setColor] = useState(products[0]?.colors[0] || "");
  const [branchId, setBranchId] = useState(branches[0]?.id || "");
  const [branchQuery, setBranchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);

  const filteredBranches = branches.filter((branch) => {
    const query = normalize(branchQuery);
    return !query || normalize(`${branch.name} ${branch.address}`).includes(query);
  });
  const selectedBranch = branches.find((branch) => branch.id === branchId);

  function selectFamily(nextFamily: PreorderProduct["family"]) {
    const first = products.find((item) => item.family === nextFamily);
    setFamily(nextFamily);
    if (first) selectProduct(first);
  }

  function selectProduct(product: PreorderProduct) {
    setProductId(product.id);
    setConfiguration(product.capacities[0] || "");
    setColor(product.colors[0] || "");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    setResult(null);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/preorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          configuration,
          color,
          branchId,
          customerName: data.get("customerName"),
          phone: data.get("phone"),
          email: data.get("email"),
          quantity: data.get("quantity"),
          contactTime: data.get("contactTime"),
          note: data.get("note"),
        }),
      });
      const payload = await response.json() as SubmitResult & { message?: string };
      if (!response.ok || !payload.orderCode) throw new Error(payload.message || "Không thể gửi yêu cầu đặt trước.");
      setResult(payload);
      window.dispatchEvent(new Event("huy-account-change"));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể gửi yêu cầu đặt trước.");
    } finally {
      setSending(false);
    }
  }

  if (result) {
    return (
      <section className="shell preorder-success" aria-live="polite">
        <div className="preorder-success-icon">✓</div>
        <span>ĐÃ GHI NHẬN YÊU CẦU</span>
        <h2>Đặt trước thành công</h2>
        <p>Mã đặt trước của bạn</p>
        <strong>{result.orderCode}</strong>
        <div>
          <span>Nhận máy dự kiến tại</span>
          <b>{result.branch.name}</b>
          <small>{result.branch.address}</small>
        </div>
        <p>Bạn chưa phải thanh toán. Chi nhánh sẽ liên hệ xác nhận trước khi có máy.</p>
        <div className="preorder-success-actions">
          <Link href={`/member#orders`}>Xem đơn trong Member</Link>
          <button type="button" onClick={() => setResult(null)}>Đặt thêm sản phẩm</button>
        </div>
      </section>
    );
  }

  return (
    <form className="shell preorder-form" onSubmit={submit}>
      <section className="preorder-products" aria-labelledby="preorder-products-title">
        <div className="preorder-section-head">
          <div><span>BƯỚC 1</span><h2 id="preorder-products-title">Chọn sản phẩm muốn đặt trước</h2></div>
          <small>Giá chính thức sẽ được xác nhận khi mở bán</small>
        </div>

        <div className="preorder-family-tabs" role="tablist" aria-label="Nhóm sản phẩm">
          {([
            ["iphone", "iPhone 18 Series"],
            ["macbook", "MacBook mới"],
            ["ipad", "iPad mới"],
          ] as const).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={family === id} className={family === id ? "is-active" : ""} onClick={() => selectFamily(id)}>{label}</button>
          ))}
        </div>

        <div className="preorder-product-grid">
          {visibleProducts.map((product) => (
            <button key={product.id} type="button" className={`preorder-product-card ${selectedProduct?.id === product.id ? "is-selected" : ""}`} onClick={() => selectProduct(product)}>
              <span className="preorder-product-check">{selectedProduct?.id === product.id ? "✓" : ""}</span>
              <span className="preorder-product-image"><Image src={product.image} alt="" fill sizes="(max-width: 640px) 45vw, 240px" unoptimized /></span>
              <strong>{product.name}</strong>
              <small>{product.description}</small>
            </button>
          ))}
        </div>

        {selectedProduct && (
          <div className="preorder-options">
            <label><span>Cấu hình mong muốn</span><select value={configuration} onChange={(event) => setConfiguration(event.target.value)}>{selectedProduct.capacities.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Màu sắc mong muốn</span><select value={color} onChange={(event) => setColor(event.target.value)}>{selectedProduct.colors.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Số lượng</span><select name="quantity" defaultValue="1"><option value="1">1 sản phẩm</option><option value="2">2 sản phẩm</option><option value="3">3 sản phẩm</option></select></label>
          </div>
        )}
      </section>

      <div className="preorder-detail-grid">
        <section className="preorder-customer-card">
          <div className="preorder-section-head"><div><span>BƯỚC 2</span><h2>Thông tin liên hệ</h2></div></div>
          {!customer && <p className="preorder-login-note">Đã có tài khoản? <Link href="/member?returnTo=%2Fdat-truoc">Đăng nhập Member</Link> để đơn tự lưu vào lịch sử.</p>}
          <div className="preorder-fields">
            <label><span>Họ và tên *</span><input name="customerName" required minLength={2} defaultValue={customer?.name || ""} placeholder="Nguyễn Văn An" autoComplete="name" /></label>
            <label><span>Số điện thoại *</span><input name="phone" required inputMode="tel" defaultValue={customer?.phone || ""} placeholder="09xxxxxxxx" autoComplete="tel" /></label>
            <label><span>Email</span><input name="email" type="email" defaultValue={customer?.email || ""} placeholder="email@example.com" autoComplete="email" /></label>
            <label><span>Thời gian tiện liên hệ</span><select name="contactTime" defaultValue="Bất kỳ thời gian nào"><option>Bất kỳ thời gian nào</option><option>08:00 – 12:00</option><option>12:00 – 17:00</option><option>17:00 – 21:00</option></select></label>
            <label className="preorder-span-2"><span>Ghi chú</span><textarea name="note" rows={3} maxLength={500} placeholder="Nhu cầu thêm về màu, cấu hình hoặc thời gian nhận máy..." /></label>
          </div>
        </section>

        <section className="preorder-branch-card">
          <div className="preorder-section-head"><div><span>BƯỚC 3</span><h2>Chọn chi nhánh gần nhất</h2></div></div>
          <div className="preorder-branch-tools">
            <input value={branchQuery} onChange={(event) => setBranchQuery(event.target.value)} placeholder="Nhập quận, thành phố hoặc tên chi nhánh" aria-label="Tìm chi nhánh" />
            <a
              href={selectedBranch ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedBranch.address)}` : "https://www.google.com/maps/search/?api=1&query=Infinity+Store"}
              target="_blank"
              rel="noreferrer"
            >
              ⌖ Chỉ đường gần tôi
            </a>
          </div>
          <div className="preorder-branch-list">
            {!branches.length && <p className="preorder-no-branch">Hiện chưa có chi nhánh hoạt động. Vui lòng quay lại sau.</p>}
            {filteredBranches.map((branch) => (
              <label key={branch.id} className={branchId === branch.id ? "is-selected" : ""}>
                <input type="radio" name="branch" value={branch.id} checked={branchId === branch.id} onChange={() => setBranchId(branch.id)} required />
                <span className="preorder-branch-pin">⌖</span>
                <span><strong>{branch.name}</strong><small>{branch.address}</small><em>{branch.hours}{branch.phone ? ` · ${branch.phone}` : ""}</em></span>
              </label>
            ))}
            {branches.length > 0 && !filteredBranches.length && <p className="preorder-no-branch">Không tìm thấy chi nhánh phù hợp từ khóa.</p>}
          </div>
        </section>
      </div>

      <section className="preorder-submit-bar">
        <div><span>Không thu cọc</span><strong>{selectedProduct?.name}</strong><small>{configuration} · {color}</small></div>
        <button type="submit" disabled={sending || !selectedProduct || !branchId}>{sending ? "Đang ghi nhận..." : "Xác nhận đặt trước"}</button>
        {error && <p role="alert">{error}</p>}
      </section>
    </form>
  );
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
