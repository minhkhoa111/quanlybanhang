"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Product, ProductColor } from "../products";
import { formatOrderMoney, productUnitPrice } from "../order-pricing";
import {
  calculateInstallmentPlan,
  DOWN_PAYMENT_OPTIONS,
  FINANCE_COMPANIES,
  INSTALLMENT_TERMS,
  MIN_INSTALLMENT_TOTAL,
} from "../installment";

type SubmitStatus = "idle" | "sending" | "sent" | "error";
type OrderTab = "details" | "payment" | "installment";

const FORM_ENDPOINT = "https://formsubmit.co/ajax/aydomkhoa123@gmail.com";
const ZALO_URL = "https://zalo.me/02879797999";
const BANK_ACCOUNT = "6820102010";
const BANK_PAYMENT = `Chuyển khoản Techcombank 24/7 - ${BANK_ACCOUNT}`;
const MOMO_PAYMENT = "MoMo - 0869275642";
const INSTALLMENT_PAYMENT = "Trả góp qua công ty tài chính";
const STORE_VISIT = "Đến cửa hàng xem máy";
type PublicBranch = { id: string; name: string; address: string; phone: string; hours: string };

function normalizeOption(value?: string) {
  return (value ?? "").trim().toLocaleLowerCase("vi");
}

function colorsForProduct(product?: Product, storage = "", ram = ""): ProductColor[] {
  if (!product) return [];
  const variants = (product.variants ?? []).filter((variant) =>
    (!storage || normalizeOption(variant.storage) === normalizeOption(storage)) &&
    (!ram || normalizeOption(variant.ram) === normalizeOption(ram)),
  );
  const variantColors = variants
    .filter((variant) => variant.color)
    .filter((variant, index, list) => list.findIndex((item) => normalizeOption(item.color) === normalizeOption(variant.color)) === index)
    .map((variant) => ({ name: variant.color as string, hex: variant.colorHex || "#111111" }));
  if (variantColors.length) return variantColors;
  if (product.colorOptions?.length) return product.colorOptions;
  return product.colors.map((hex, index) => ({ name: `Màu ${index + 1}`, hex }));
}

export default function ConsultationForm({
  products = [],
  branches = [],
  initialOrderCode,
}: {
  products?: Product[];
  branches?: PublicBranch[];
  initialOrderCode: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const params = useSearchParams();
  const requestedProduct = params.get("may") || "";
  const requestedRam = params.get("ram") || "";
  const requestedStorage = params.get("dung-luong") || "";
  const requestedColor = params.get("mau") || "";
  const initialProduct =
    products.find((product) => product.slug === requestedProduct)?.slug ??
    products[0]?.slug ??
    "";
  const initialProductData = products.find((product) => product.slug === initialProduct);
  const initialRamOptions = Array.from(new Set((initialProductData?.variants ?? []).map((variant) => variant.ram).filter((ram): ram is string => Boolean(ram))));
  const initialRam = initialRamOptions.find((ram) => normalizeOption(ram) === normalizeOption(requestedRam)) ?? initialRamOptions[0] ?? "";
  const initialStorageOptions = Array.from(new Set((initialProductData?.variants ?? []).filter((variant) => !initialRam || normalizeOption(variant.ram) === normalizeOption(initialRam)).map((variant) => variant.storage).filter((storage): storage is string => Boolean(storage))));
  const initialStorage = initialStorageOptions.find((storage) => normalizeOption(storage) === normalizeOption(requestedStorage))
    ?? initialStorageOptions[0]
    ?? initialProductData?.storageOptions?.[0]
    ?? "";
  const initialColors = colorsForProduct(initialProductData, initialStorage, initialRam);
  const [selectedSlug, setSelectedSlug] = useState(initialProduct);
  const selectedProduct = useMemo(
    () => products.find((product) => product.slug === selectedSlug),
    [products, selectedSlug],
  );
  const [selectedStorage, setSelectedStorage] = useState(initialStorage);
  const [selectedRam, setSelectedRam] = useState(initialRam);
  const [selectedColor, setSelectedColor] = useState(
    initialColors.find((color) => normalizeOption(color.name) === normalizeOption(requestedColor))?.name ?? initialColors[0]?.name ?? "",
  );
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [purchaseMode, setPurchaseMode] = useState<"online" | "store">("online");
  const [branchId, setBranchId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [copiedBank, setCopiedBank] = useState(false);
  const [orderCode, setOrderCode] = useState(initialOrderCode);
  const [qrExpiresAt, setQrExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [paymentError, setPaymentError] = useState("");
  const [activeTab, setActiveTab] = useState<OrderTab>("details");
  const [submittedPaymentMethod, setSubmittedPaymentMethod] = useState("");
  const [submittedPaymentStatus, setSubmittedPaymentStatus] = useState("unpaid");
  const [submittedOrderStatus, setSubmittedOrderStatus] = useState("pending");
  const [submittedOrderTotal, setSubmittedOrderTotal] = useState(0);
  const [submittedStoreVisit, setSubmittedStoreVisit] = useState(false);
  const [submittedBranchName, setSubmittedBranchName] = useState("");
  const [financeCompany, setFinanceCompany] = useState("");
  const [downPaymentPercent, setDownPaymentPercent] = useState(10);
  const [installmentTerm, setInstallmentTerm] = useState(6);
  const [sms, setSms] = useState("");
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherMessage, setVoucherMessage] = useState("");
  const [voucherSubtotal, setVoucherSubtotal] = useState(0);
  const unitPrice = useMemo(
    () => productUnitPrice(selectedProduct, selectedStorage, selectedColor, selectedRam),
    [selectedColor, selectedProduct, selectedRam, selectedStorage],
  );
  const orderSubtotal = unitPrice * quantity;
  const voucherIsCurrent = Boolean(voucherCode) && voucherSubtotal === orderSubtotal;
  const appliedVoucherCode = voucherIsCurrent ? voucherCode : "";
  const appliedVoucherDiscount = voucherIsCurrent ? voucherDiscount : 0;
  const orderTotal = Math.max(0, orderSubtotal - appliedVoucherDiscount);
  const installmentEligible = orderTotal >= MIN_INSTALLMENT_TOTAL;
  const selectedFinanceCompany = FINANCE_COMPANIES.find((company) => company.name === financeCompany);
  const installmentPlans = useMemo(
    () => INSTALLMENT_TERMS.map((term) => calculateInstallmentPlan(
      orderTotal,
      downPaymentPercent,
      term,
      selectedFinanceCompany?.monthlyRate ?? 0,
    )),
    [downPaymentPercent, orderTotal, selectedFinanceCompany],
  );
  const selectedInstallmentPlan = installmentPlans.find((plan) => plan.term === installmentTerm) ?? installmentPlans[0];
  const bankQrUrl = `/api/payment-qr?orderCode=${encodeURIComponent(orderCode)}&expiresAt=${qrExpiresAt ?? ""}`;
  const momoQrUrl = `/api/momo-qr?orderCode=${encodeURIComponent(orderCode)}&expiresAt=${qrExpiresAt ?? ""}`;
  const qrExpired = qrExpiresAt !== null && remainingSeconds <= 0;

  useEffect(() => {
    if (!qrExpiresAt) return;
    const updateRemaining = () => {
      setRemainingSeconds(Math.max(0, Math.ceil((qrExpiresAt - Date.now()) / 1000)));
    };
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [qrExpiresAt]);

  useEffect(() => {
    if (
      status !== "sent" ||
      submittedPaymentMethod !== BANK_PAYMENT ||
      submittedPaymentStatus === "paid"
    ) return;

    let attempts = 0;
    const checkPayment = async () => {
      attempts += 1;
      try {
        const response = await fetch(`/api/orders/status?orderCode=${encodeURIComponent(orderCode)}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const result = await response.json() as { status?: string; paymentStatus?: string };
        if (result.status) setSubmittedOrderStatus(result.status);
        if (result.paymentStatus) setSubmittedPaymentStatus(result.paymentStatus);
      } catch {
        // Giữ trạng thái chờ và thử lại ở lượt kế tiếp.
      }
    };
    void checkPayment();
    const timer = window.setInterval(() => {
      if (attempts >= 200) {
        window.clearInterval(timer);
        return;
      }
      void checkPayment();
    }, 3_000);
    return () => window.clearInterval(timer);
  }, [orderCode, status, submittedPaymentMethod, submittedPaymentStatus]);

  function chooseProduct(slug: string) {
    const nextProduct = products.find((product) => product.slug === slug);
    const nextRam = nextProduct?.variants?.find((variant) => variant.ram)?.ram ?? "";
    const nextStorage = nextProduct?.variants?.find((variant) => !nextRam || normalizeOption(variant.ram) === normalizeOption(nextRam))?.storage ?? nextProduct?.storageOptions?.[0] ?? "";
    const nextColor = colorsForProduct(nextProduct, nextStorage, nextRam)[0]?.name ?? "";
    setSelectedSlug(slug);
    setSelectedRam(nextRam);
    setSelectedColor(nextColor);
    setSelectedStorage(nextStorage);
  }

  async function copyBankAccount() {
    try {
      await navigator.clipboard.writeText(BANK_ACCOUNT);
      setCopiedBank(true);
    } catch {
      setCopiedBank(false);
    }
  }

  async function applyVoucher() {
    setVoucherMessage("");
    try {
      const response = await fetch("/api/vouchers/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: voucherInput, subtotal: orderSubtotal }) });
      const result = await response.json() as { code?: string; discount?: number; message?: string };
      if (!response.ok) throw new Error(result.message || "Voucher không hợp lệ.");
      setVoucherCode(result.code || "");
      setVoucherInput(result.code || voucherInput.toUpperCase());
      setVoucherDiscount(Number(result.discount) || 0);
      setVoucherSubtotal(orderSubtotal);
      setVoucherMessage(`Đã giảm ${formatOrderMoney(Number(result.discount) || 0)}.`);
    } catch (error) {
      setVoucherCode(""); setVoucherDiscount(0); setVoucherSubtotal(0);
      setVoucherMessage(error instanceof Error ? error.message : "Voucher không hợp lệ.");
    }
  }

  function selectPayment(method: string) {
    if (method === INSTALLMENT_PAYMENT && !installmentEligible) {
      setPaymentError("Trả góp qua công ty tài chính chỉ áp dụng cho đơn hàng từ 8.000.000đ.");
      return;
    }
    setPaymentMethod(method);
    setPaymentError("");
    if (method === INSTALLMENT_PAYMENT) {
      setQrExpiresAt(null);
      setRemainingSeconds(0);
      setActiveTab("installment");
    }
  }

  function renewBankQr() {
    setQrExpiresAt(Date.now() + 10 * 60 * 1000);
    setRemainingSeconds(10 * 60);
    setPaymentError("");
  }

  function resetForNextOrder() {
    setStatus("idle");
    setQuantity(1);
    setPaymentMethod("");
    setOrderCode(createOrderCode());
    setQrExpiresAt(null);
    setRemainingSeconds(0);
    setPaymentError("");
    setActiveTab("details");
    setSubmittedPaymentMethod("");
    setSubmittedPaymentStatus("unpaid");
    setSubmittedOrderStatus("pending");
    setSubmittedOrderTotal(0);
    setSubmittedStoreVisit(false);
    setSubmittedBranchName("");
    setPurchaseMode("online");
    setBranchId("");
    setFinanceCompany("");
    setDownPaymentPercent(10);
    setInstallmentTerm(6);
  }

  function openPaymentTab() {
    if (purchaseMode === "store") return;
    const controls = formRef.current?.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >(".order-form-main input:not([type='hidden']), .order-form-main select, .order-form-main textarea");
    for (const control of controls ?? []) {
      if (!control.checkValidity()) {
        control.reportValidity();
        return;
      }
    }
    if (paymentMethod === INSTALLMENT_PAYMENT && !installmentEligible) {
      setPaymentMethod("");
      setFinanceCompany("");
      setPaymentError("Trả góp qua công ty tài chính chỉ áp dụng cho đơn hàng từ 8.000.000đ.");
    }
    setActiveTab("payment");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const isStoreVisit = purchaseMode === "store";
    const selectedBranch = branches.find((branch) => branch.id === branchId);
    if (isStoreVisit && !selectedBranch) {
      setPaymentError("Vui lòng chọn chi nhánh muốn đến xem máy.");
      setActiveTab("details");
      return;
    }
    if (!isStoreVisit && !paymentMethod) {
      setPaymentError("Vui lòng chọn phương thức thanh toán online.");
      setActiveTab("payment");
      return;
    }
    if (!isStoreVisit && paymentMethod === INSTALLMENT_PAYMENT && !installmentEligible) {
      setPaymentError("Trả góp qua công ty tài chính chỉ áp dụng cho đơn hàng từ 8.000.000đ.");
      setActiveTab("payment");
      return;
    }

    // Trường ẩn chống bot: nếu có dữ liệu thì coi như đã xử lý, không gửi email.
    if (data.get("website")) {
      setStatus("sent");
      return;
    }

    const orderPayload = {
      customerName: String(data.get("name") || ""),
      phone: String(data.get("phone") || ""),
      email: "",
      orderCode,
      productSlug: String(data.get("productSlug") || selectedSlug),
      productName: String(data.get("model") || selectedProduct?.name || selectedSlug),
      color: String(data.get("color") || ""),
      storage: String(data.get("storage") || ""),
      ram: String(data.get("ram") || ""),
      quantity: Number(data.get("quantity") || 1),
      deliveryMethod: isStoreVisit ? STORE_VISIT : "Giao hàng tận nơi",
      branchId: isStoreVisit ? branchId : "",
      address: isStoreVisit ? "" : String(data.get("address") || ""),
      paymentMethod: isStoreVisit ? "" : String(data.get("payment") || ""),
      total: String(orderTotal),
      contactTime: "",
      note: String(data.get("note") || ""),
      financeCompany: paymentMethod === INSTALLMENT_PAYMENT ? financeCompany : "",
      installmentName: paymentMethod === INSTALLMENT_PAYMENT ? String(data.get("installmentName") || "") : "",
      installmentPhone: paymentMethod === INSTALLMENT_PAYMENT ? String(data.get("installmentPhone") || "") : "",
      dateOfBirth: paymentMethod === INSTALLMENT_PAYMENT ? String(data.get("dateOfBirth") || "") : "",
      citizenId: paymentMethod === INSTALLMENT_PAYMENT ? String(data.get("citizenId") || "") : "",
      citizenIdIssueDate: paymentMethod === INSTALLMENT_PAYMENT ? String(data.get("citizenIdIssueDate") || "") : "",
      citizenIdIssuePlace: paymentMethod === INSTALLMENT_PAYMENT ? String(data.get("citizenIdIssuePlace") || "") : "",
      installmentConsent: paymentMethod === INSTALLMENT_PAYMENT ? data.get("installmentConsent") === "on" : false,
      downPaymentPercent: paymentMethod === INSTALLMENT_PAYMENT ? downPaymentPercent : 0,
      downPaymentAmount: paymentMethod === INSTALLMENT_PAYMENT ? String(selectedInstallmentPlan?.downPaymentAmount ?? 0) : "",
      financedAmount: paymentMethod === INSTALLMENT_PAYMENT ? String(selectedInstallmentPlan?.financedAmount ?? 0) : "",
      installmentTerm: paymentMethod === INSTALLMENT_PAYMENT ? installmentTerm : 0,
      monthlyPayment: paymentMethod === INSTALLMENT_PAYMENT ? String(selectedInstallmentPlan?.monthlyPayment ?? 0) : "",
      estimatedInterest: paymentMethod === INSTALLMENT_PAYMENT ? String(selectedInstallmentPlan?.interestAmount ?? 0) : "",
      voucherCode: appliedVoucherCode,
    };

    const body = [
      "ĐƠN ĐẶT HÀNG - INFINITY COMPANY",
      `Mã đơn: ${orderCode}`,
      `Họ tên: ${data.get("name")}`,
      `SĐT: ${data.get("phone")}`,
      `Sản phẩm: ${data.get("model") || selectedProduct?.name || selectedSlug || "Chưa xác định"}`,
      `Màu: ${data.get("color") || "Chưa chọn"}`,
      `Cấu hình: ${[data.get("ram"), data.get("storage")].filter(Boolean).join(" / ") || "Chưa chọn"}`,
      `Số lượng: ${data.get("quantity") || "1"}`,
      `Hình thức: ${isStoreVisit ? "Đến cửa hàng xem máy" : "Đặt hàng online"}`,
      `Chi nhánh: ${selectedBranch?.name || "Không áp dụng"}`,
      `Địa chỉ: ${isStoreVisit ? selectedBranch?.address : data.get("address")}`,
      `Thanh toán: ${isStoreVisit ? "Không áp dụng - chờ tư vấn" : data.get("payment")}`,
      `Tổng tiền: ${formatOrderMoney(orderTotal)}`,
      `Ghi chú: ${data.get("note") || "Không có"}`,
    ].join("\n");

    setSms(`sms:02879797999?body=${encodeURIComponent(body)}`);
    setStatus("sending");

    try {
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!orderResponse.ok) {
        throw new Error("Không thể lưu đơn hàng");
      }
      const savedOrder = await orderResponse.json() as {
        orderCode?: string;
        status?: string;
        paymentStatus?: string;
      };
      const submittedMethod = isStoreVisit ? "" : String(data.get("payment") || "");
      const savedOrderCode = savedOrder.orderCode || orderCode;
      setOrderCode(savedOrderCode);
      setSubmittedPaymentMethod(submittedMethod);
      setSubmittedPaymentStatus(savedOrder.paymentStatus ?? "unpaid");
      setSubmittedOrderStatus(savedOrder.status ?? "pending");
      setSubmittedOrderTotal(orderTotal);
      setSubmittedStoreVisit(isStoreVisit);
      setSubmittedBranchName(selectedBranch?.name || "");

      if (submittedMethod === BANK_PAYMENT || submittedMethod === MOMO_PAYMENT) {
        setQrExpiresAt(Date.now() + 10 * 60 * 1000);
        setRemainingSeconds(10 * 60);
      }

      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _subject: "Đơn đặt hàng mới - Infinity Company",
          _template: "table",
          _cc: "nguyenmkhoa2010@icloud.com",
          "Họ và tên": data.get("name"),
          "Số điện thoại": data.get("phone"),
          "Mã đơn hàng": orderCode,
          "Sản phẩm đặt": data.get("model") || selectedProduct?.name || selectedSlug || "Chưa xác định",
          "Màu": data.get("color") || "Chưa chọn",
          "Cấu hình": [data.get("ram"), data.get("storage")].filter(Boolean).join(" / ") || "Chưa chọn",
          "Số lượng": data.get("quantity") || "1",
          "Hình thức": isStoreVisit ? "Đến cửa hàng xem máy" : "Đặt hàng online",
          "Chi nhánh xem máy": selectedBranch?.name || "Không áp dụng",
          "Địa chỉ": isStoreVisit ? selectedBranch?.address : data.get("address"),
          "Thanh toán": isStoreVisit ? "Không áp dụng - chờ tư vấn" : data.get("payment"),
          "Công ty tài chính": financeCompany || "Không áp dụng",
          "Trả trước": paymentMethod === INSTALLMENT_PAYMENT ? `${downPaymentPercent}% (${formatOrderMoney(selectedInstallmentPlan?.downPaymentAmount ?? 0)})` : "Không áp dụng",
          "Kỳ hạn dự kiến": paymentMethod === INSTALLMENT_PAYMENT ? `${installmentTerm} tháng` : "Không áp dụng",
          "Góp dự kiến mỗi tháng": paymentMethod === INSTALLMENT_PAYMENT ? formatOrderMoney(selectedInstallmentPlan?.monthlyPayment ?? 0) : "Không áp dụng",
          "Hồ sơ trả góp": paymentMethod === INSTALLMENT_PAYMENT ? "Đã lưu trong hệ thống quản trị" : "Không áp dụng",
          "Tổng tiền": formatOrderMoney(orderTotal),
          "Ghi chú đơn hàng": data.get("note") || "Không có",
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { success?: boolean | string }
        | null;

      if (!response.ok || result?.success === false || result?.success === "false") {
        console.warn("Order saved, but email delivery failed.");
      }

      setStatus("sent");
      setQuantity(1);
      setPaymentMethod("");
      setCopiedBank(false);
      if (submittedMethod !== BANK_PAYMENT && submittedMethod !== MOMO_PAYMENT) {
        setQrExpiresAt(null);
        setRemainingSeconds(0);
      }
      setPaymentError("");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    const isBankTransfer = submittedPaymentMethod === BANK_PAYMENT;
    const isMomoPayment = submittedPaymentMethod === MOMO_PAYMENT;
    const isInstallment = submittedPaymentMethod === INSTALLMENT_PAYMENT;
    const isPaid = submittedPaymentStatus === "paid";
    return (
      <div className={`consult-success${isBankTransfer || isMomoPayment ? " is-bank-payment" : ""}`}>
        <span>✓</span>
        <h2>{submittedStoreVisit ? "Đã chuyển yêu cầu đến chi nhánh" : isPaid ? "Đã thanh toán" : isBankTransfer ? "Đang kiểm tra thanh toán" : isMomoPayment ? "Đã tạo QR MoMo" : isInstallment ? "Đã tiếp nhận hồ sơ trả góp" : "Đã tiếp nhận đơn hàng"}</h2>
        <p>
          {submittedStoreVisit
            ? `Yêu cầu xem máy ${orderCode} đã được chuyển đến ${submittedBranchName}. Nhân viên sẽ liên hệ tư vấn và xác nhận máy trước khi bạn đến.`
            : isPaid
            ? `Giao dịch cho đơn ${orderCode} đã được xác nhận. Infinity Company sẽ chuẩn bị sản phẩm để giao.`
            : isBankTransfer
              ? `Hệ thống đang đối soát giao dịch cho đơn ${orderCode}. Trạng thái sẽ tự cập nhật khi ngân hàng xác nhận.`
              : isInstallment
                ? `Hồ sơ cho đơn ${orderCode} đã được ghi nhận. Nhân viên tài chính sẽ liên hệ tư vấn; khoản vay chỉ có hiệu lực sau khi công ty tài chính phê duyệt.`
              : submittedOrderStatus === "confirmed"
                ? "Infinity Company đã tiếp nhận đơn. Cửa hàng sẽ xác nhận tồn kho, chuẩn bị máy và giao theo thông tin đã cung cấp."
                : "Infinity Company đã ghi nhận đơn và sẽ liên hệ xác nhận trong thời gian sớm nhất."}
        </p>
        {!submittedStoreVisit && <div className={`order-payment-result ${isPaid ? "is-paid" : "is-pending"}`}>
          <span>{isInstallment ? "Hồ sơ" : "Thanh toán"}</span>
          <strong>{isPaid ? "Đã thanh toán" : isInstallment ? "Chờ tư vấn & xét duyệt" : "Chưa thanh toán"}</strong>
        </div>}
        {submittedStoreVisit && <div className="store-consultation-result"><strong>Không có bước thanh toán</strong><span>Chi nhánh đã tiếp nhận thông tin để nhân viên chủ động tư vấn cho bạn.</span></div>}
        {(isBankTransfer || isMomoPayment) && !isPaid && qrExpiresAt && (
          <div className={`post-order-bank-payment${isMomoPayment ? " is-momo" : ""}`} aria-live="polite">
            <div className="bank-transfer-panel">
              <div className={`bank-qr-image${qrExpired ? " is-expired" : ""}`}>
                <Image src={isMomoPayment ? momoQrUrl : bankQrUrl} alt={`Mã QR thanh toán đơn ${orderCode}`} width={720} height={720} unoptimized />
                {qrExpired && (
                  <div className="bank-qr-expired">
                    <strong>QR đã hết hạn</strong>
                    <button type="button" onClick={renewBankQr}>Tạo QR mới</button>
                  </div>
                )}
              </div>
              <div className="bank-transfer-details">
                <span>{isMomoPayment ? "Ví MoMo" : "Techcombank 24/7"}</span>
                <strong>{isMomoPayment ? "0869275642" : "Nguyễn Minh Khoa"}</strong>
                <dl>
                  <div><dt>Số tiền</dt><dd>{formatOrderMoney(submittedOrderTotal)}</dd></div>
                  <div><dt>Mã đơn</dt><dd>{orderCode}</dd></div>
                  <div><dt>{isMomoPayment ? "Số MoMo" : "Số tài khoản"}</dt><dd>{isMomoPayment ? "0869275642" : BANK_ACCOUNT}</dd></div>
                </dl>
                <div className={`bank-payment-timer${qrExpired ? " is-expired" : ""}`}>
                  <span>Thời hạn thanh toán</span>
                  <strong>{formatCountdown(remainingSeconds)}</strong>
                </div>
                {!isMomoPayment && <button type="button" onClick={copyBankAccount}>{copiedBank ? "Đã sao chép" : "Sao chép số tài khoản"}</button>}
                <small>{isMomoPayment ? `Sau khi quét, nhập đúng ${formatOrderMoney(submittedOrderTotal)} và nội dung ${orderCode} để cửa hàng đối soát.` : `Quét QR để thanh toán đúng ${formatOrderMoney(submittedOrderTotal)} với nội dung ${orderCode}. Trạng thái sẽ tự cập nhật khi ngân hàng xác nhận.`}</small>
              </div>
            </div>
          </div>
        )}
        <a className="button button-primary" href={sms}>
          Gửi thêm qua SMS
        </a>
        <a
          className="button button-secondary"
          href={ZALO_URL}
          target="_blank"
          rel="noreferrer"
        >
          Nhắn Zalo ngay
        </a>
        <button onClick={resetForNextOrder}>Tạo đơn khác</button>
      </div>
    );
  }

  return (
    <form ref={formRef} className="consult-form consult-form-horizontal" onSubmit={submit}>
      <div className="form-heading">
        <span>ĐẶT HÀNG NHANH</span>
        <h2>Chọn máy và cách mua phù hợp</h2>
      </div>

      <div className={`order-tabs${paymentMethod === INSTALLMENT_PAYMENT ? " has-installment" : ""}${purchaseMode === "store" ? " is-store-visit" : ""}`} role="tablist" aria-label="Các bước đặt hàng">
        <button type="button" role="tab" aria-selected={activeTab === "details"} aria-controls="order-details-panel" onClick={() => setActiveTab("details")}>
          <span>01</span><strong>Sản phẩm & nhận hàng</strong>
        </button>
        {purchaseMode === "online" && <button type="button" role="tab" aria-selected={activeTab === "payment"} aria-controls="order-payment-panel" onClick={openPaymentTab}>
          <span>02</span><strong>Phương thức thanh toán</strong>
        </button>}
        {purchaseMode === "online" && paymentMethod === INSTALLMENT_PAYMENT && (
          <button type="button" role="tab" aria-selected={activeTab === "installment"} aria-controls="order-installment-panel" onClick={() => setActiveTab("installment")}>
            <span>03</span><strong>Hồ sơ trả góp</strong>
          </button>
        )}
      </div>

      <div className="order-tab-content">
        <div id="order-details-panel" role="tabpanel" className="order-form-main" hidden={activeTab !== "details"}>
          <section className="order-step">
            <div className="order-step-title">
              <span>01</span>
              <div><h3>Cách mua và sản phẩm</h3><p>Chọn đặt online hoặc đến chi nhánh xem máy.</p></div>
            </div>

            <fieldset className="order-fulfillment-choice">
              <legend>Hình thức mua hàng</legend>
              <div>
                <label><input type="radio" checked={purchaseMode === "online"} onChange={() => { setPurchaseMode("online"); setPaymentMethod(BANK_PAYMENT); setPaymentError(""); }} /><span><strong>Đặt hàng online</strong><small>Giao tận nơi và thanh toán trực tuyến</small></span></label>
                <label><input type="radio" checked={purchaseMode === "store"} onChange={() => { setPurchaseMode("store"); setPaymentMethod(""); setActiveTab("details"); setPaymentError(""); }} /><span><strong>Đến cửa hàng xem máy</strong><small>Không thanh toán, nhân viên chi nhánh tư vấn</small></span></label>
              </div>
            </fieldset>

            {selectedProduct && (
              <div className="order-product-preview">
                <div className="order-product-image">
                  <Image src={selectedProduct.variants?.find((variant) => normalizeOption(variant.ram) === normalizeOption(selectedRam) && normalizeOption(variant.storage) === normalizeOption(selectedStorage) && normalizeOption(variant.color) === normalizeOption(selectedColor))?.image || selectedProduct.image} alt={selectedProduct.name} fill unoptimized sizes="120px" />
                </div>
                <div><strong>{selectedProduct.name}</strong><span>{selectedProduct.brand} · {formatOrderMoney(unitPrice)}</span></div>
              </div>
            )}

            <label>
              Chọn sản phẩm
              <select value={selectedSlug} onChange={(event) => chooseProduct(event.target.value)} required>
                {products.map((product) => <option key={product.slug} value={product.slug}>{product.name}</option>)}
              </select>
            </label>
            <input type="hidden" name="productSlug" value={selectedSlug} />
            <input type="hidden" name="model" value={selectedProduct?.name ?? selectedSlug} />

            <input type="hidden" name="color" value={selectedColor} />
            <input type="hidden" name="ram" value={selectedRam} />
            <input type="hidden" name="storage" value={selectedStorage} />
            <div className="order-selected-config">
              <div>
                <span>Cấu hình đã chọn</span>
                <strong>{[selectedRam && `${selectedRam} RAM`, selectedStorage && `${selectedStorage} SSD`, selectedColor].filter(Boolean).join(" · ") || "Cấu hình tiêu chuẩn"}</strong>
                <small>{formatOrderMoney(unitPrice)}</small>
              </div>
              {selectedProduct && <Link href={`/san-pham/${selectedProduct.slug}`}>Đổi cấu hình</Link>}
            </div>

            <label className="order-quantity-field">
              Số lượng
              <div className="order-quantity-stepper">
                <button type="button" aria-label="Giảm số lượng" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
                <input name="quantity" type="number" min="1" max="10" value={quantity} onChange={(event) => { const next = Math.floor(Number(event.target.value)); setQuantity(Number.isFinite(next) && next > 0 ? Math.min(10, next) : 1); }} required />
                <button type="button" aria-label="Tăng số lượng" onClick={() => setQuantity((value) => Math.min(10, value + 1))}>+</button>
              </div>
            </label>
          </section>

          <section className="order-step">
            <div className="order-step-title">
              <span>02</span>
              <div><h3>Thông tin khách hàng</h3><p>Cửa hàng dùng để tiếp nhận và liên hệ xác nhận.</p></div>
            </div>
            <div className="form-row">
              <label>Họ và tên<input name="name" required placeholder="Nguyễn Văn A" autoComplete="name" /></label>
              <label>Số điện thoại<input name="phone" required type="tel" pattern="[0-9 +]{9,15}" placeholder="09xx xxx xxx" autoComplete="tel" /></label>
            </div>
            {purchaseMode === "store" ? <label>Chi nhánh muốn xem máy<select value={branchId} onChange={(event) => setBranchId(event.target.value)} required><option value="" disabled>Chọn chi nhánh</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} · {branch.address}</option>)}</select></label> : <label>Địa chỉ giao hàng<textarea name="address" rows={2} required placeholder="Số nhà, đường, phường/xã, tỉnh/thành" /></label>}
            {purchaseMode === "store" && <label>Yêu cầu tư vấn<textarea name="note" rows={2} placeholder="Thời gian dự kiến đến, màu hoặc phiên bản muốn xem..." /></label>}
          </section>

          <div className="order-tab-actions order-tab-actions-next">
            {purchaseMode === "store" ? <button className="button button-primary" type="submit" disabled={status === "sending"}>{status === "sending" ? "Đang chuyển yêu cầu..." : "Gửi yêu cầu để nhân viên tư vấn"} <span>↗</span></button> : <button className="button button-primary" type="button" onClick={openPaymentTab}>Tiếp tục thanh toán <span>→</span></button>}
          </div>
        </div>

        {purchaseMode === "online" && <aside id="order-payment-panel" role="tabpanel" className="order-checkout" hidden={activeTab !== "payment"}>
          <div className="order-tab-actions order-tab-actions-back">
            <button className="button button-secondary" type="button" onClick={() => setActiveTab("details")}><span>←</span> Quay lại chọn sản phẩm</button>
          </div>
          <section className="order-step order-summary">
            <div className="order-step-title">
              <span>✓</span>
              <div><h3>Đơn hàng</h3><p>Kiểm tra thông tin chính.</p></div>
            </div>
            <dl className="order-summary-list">
              <div><dt>Mã đơn</dt><dd>{orderCode}</dd></div>
              <div><dt>Sản phẩm</dt><dd>{selectedProduct?.name ?? "Chưa chọn"}</dd></div>
              <div><dt>Phiên bản</dt><dd>{[selectedRam && `${selectedRam} RAM`, selectedStorage && `${selectedStorage} SSD`, selectedColor].filter(Boolean).join(" · ") || "Chưa chọn"}</dd></div>
              <div><dt>Số lượng</dt><dd>{quantity}</dd></div>
              <div><dt>Tổng tiền</dt><dd>{orderTotal > 0 ? formatOrderMoney(orderTotal) : "Chờ xác nhận"}</dd></div>
              {voucherIsCurrent && <div><dt>Voucher</dt><dd>{voucherCode} · -{formatOrderMoney(voucherDiscount)}</dd></div>}
              <div><dt>Thanh toán</dt><dd>{paymentMethod || "Chưa chọn"}</dd></div>
            </dl>
          </section>

          <section className="order-step order-payment-step">
            <div className="order-step-title">
              <span>03</span>
              <div><h3>Thanh toán</h3><p>Chọn phương thức phù hợp.</p></div>
            </div>
            <div className="checkout-voucher">
              <label>Mã voucher<input value={voucherInput} onChange={(event) => setVoucherInput(event.target.value.toUpperCase())} placeholder="Nhập mã giảm giá" /></label>
              <button type="button" onClick={applyVoucher} disabled={!voucherInput.trim()}>Áp dụng</button>
              {voucherMessage && <p className={voucherIsCurrent ? "is-success" : "is-error"}>{voucherIsCurrent ? voucherMessage : "Cấu hình hoặc số lượng đã đổi, vui lòng áp dụng lại voucher."}</p>}
            </div>
            <fieldset className="payment-methods">
              <legend>Phương thức thanh toán</legend>
              <div className="payment-method-grid">
                <label className="payment-method-option">
                  <input type="radio" name="payment" value={BANK_PAYMENT} checked={paymentMethod === BANK_PAYMENT} onChange={(event) => selectPayment(event.target.value)} disabled={orderTotal <= 0} required />
                  <span className="payment-method-mark payment-method-bank" aria-hidden="true">TCB</span><strong>Chuyển khoản 24/7</strong>
                </label>
                <label className="payment-method-option payment-method-featured">
                  <input type="radio" name="payment" value={MOMO_PAYMENT} checked={paymentMethod === MOMO_PAYMENT} onChange={(event) => selectPayment(event.target.value)} />
                  <span className="payment-logo-momo" aria-hidden="true">momo</span><strong>Ví MoMo</strong>
                </label>
                <label className="payment-method-option payment-method-featured">
                  <input type="radio" name="payment" value="Apple Pay - xác nhận với cửa hàng" checked={paymentMethod === "Apple Pay - xác nhận với cửa hàng"} onChange={(event) => selectPayment(event.target.value)} />
                  <span className="payment-logo-apple" aria-hidden="true">Apple Pay</span><strong>Apple Pay</strong>
                </label>
                <label className="payment-method-option payment-method-installment">
                  <input type="radio" name="payment" value={INSTALLMENT_PAYMENT} checked={paymentMethod === INSTALLMENT_PAYMENT} onChange={(event) => selectPayment(event.target.value)} disabled={!installmentEligible} />
                  <span className="payment-method-mark payment-method-credit" aria-hidden="true">0%</span><strong>Trả góp tài chính</strong>
                </label>
              </div>
              {!installmentEligible && <p className="installment-eligibility-note">Áp dụng khi tổng giá trị đơn hàng từ 8.000.000đ.</p>}
            </fieldset>

            {paymentMethod === BANK_PAYMENT && (
              <div className="payment-instructions bank-order-notice" aria-live="polite">
                <div>
                  <span>Chuyển khoản Techcombank 24/7</span>
                  <strong>QR thanh toán sẽ xuất hiện sau khi đơn hàng được tạo</strong>
                  <small>QR sẽ tự điền đúng tổng tiền và mã đơn, có hiệu lực trong 10 phút.</small>
                </div>
              </div>
            )}

            {paymentError && <div className="bank-payment-error" role="alert">{paymentError}</div>}

            {paymentMethod === MOMO_PAYMENT && (
              <div className="payment-instructions payment-instructions-momo" aria-live="polite">
                <div><span>Thanh toán qua MoMo</span><strong>QR sẽ xuất hiện sau khi tạo đơn</strong><small>Số tiền {formatOrderMoney(orderTotal)} và mã đơn sẽ hiển thị cạnh QR để bạn nhập chính xác.</small></div>
              </div>
            )}

            {paymentMethod === "Apple Pay - xác nhận với cửa hàng" && (
              <div className="payment-instructions" aria-live="polite"><div><span>Apple Pay</span><strong>Xác nhận khi cửa hàng liên hệ</strong></div></div>
            )}

            <label>Ghi chú thêm<textarea name="note" rows={2} placeholder="Yêu cầu về màu, tình trạng máy..." /></label>
          </section>

          <label aria-hidden="true" style={{ display: "none" }}>Không điền trường này<input name="website" tabIndex={-1} autoComplete="off" /></label>
          <label className="consent"><input type="checkbox" required={paymentMethod !== INSTALLMENT_PAYMENT} /> Tôi đồng ý để Infinity Company liên hệ xác nhận đơn.</label>

          {status === "error" && <div className="order-form-error" role="alert">Chưa gửi được đơn. Thử lại hoặc liên hệ qua <a href={sms}>SMS</a> / <a href={ZALO_URL} target="_blank" rel="noreferrer">Zalo</a>.</div>}

          <button className="button button-primary form-submit" type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Đang tạo đơn..." : paymentMethod === BANK_PAYMENT || paymentMethod === MOMO_PAYMENT ? "Đặt hàng & nhận mã QR" : "Gửi đơn đặt hàng"} <span>↗</span>
          </button>
          <p className="privacy-note">Thông tin chỉ dùng để xác nhận và giao hàng.</p>
        </aside>}

        {paymentMethod === INSTALLMENT_PAYMENT && (
          <section id="order-installment-panel" role="tabpanel" className="order-installment" hidden={activeTab !== "installment"}>
            <div className="order-tab-actions order-tab-actions-back">
              <button className="button button-secondary" type="button" onClick={() => setActiveTab("payment")}><span>←</span> Quay lại phương thức thanh toán</button>
            </div>

            <div className="installment-intro">
              <span>HỒ SƠ TƯ VẤN</span>
              <h3>Đăng ký trả góp qua công ty tài chính</h3>
              <p>Chọn đối tác và điền đúng thông tin trên CCCD. Nhân viên phụ trách sẽ liên hệ để tư vấn điều kiện, kỳ hạn và khoản trả trước.</p>
            </div>

            <fieldset className="installment-partners">
              <legend>Chọn công ty tài chính</legend>
              <div>
                {FINANCE_COMPANIES.map((company) => (
                  <label key={company.name}>
                    <input type="radio" name="financeCompany" value={company.name} checked={financeCompany === company.name} onChange={() => setFinanceCompany(company.name)} required />
                    <span><Image src={company.logo} alt={company.name} width={176} height={56} unoptimized /></span>
                  </label>
                ))}
              </div>
            </fieldset>

            <section className="installment-calculator" aria-live="polite">
              <div className="installment-calculator-head">
                <div><span>PHƯƠNG ÁN TẠM TÍNH</span><h4>{formatOrderMoney(orderTotal)}</h4></div>
                <p>{selectedFinanceCompany ? `Lãi suất ${selectedFinanceCompany.monthlyRate}%/tháng theo thông tin của cửa hàng.` : "Chọn công ty tài chính để xem số tiền hàng tháng."}</p>
              </div>

              <fieldset className="down-payment-options">
                <legend>Trả trước</legend>
                <div>
                  {DOWN_PAYMENT_OPTIONS.map((percent) => (
                    <label key={percent}>
                      <input type="radio" name="downPaymentPercent" value={percent} checked={downPaymentPercent === percent} onChange={() => setDownPaymentPercent(percent)} />
                      <span><strong>{percent}%</strong><small>{formatOrderMoney(Math.round(orderTotal * percent / 100))}</small></span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="installment-financed-summary">
                <span>Số tiền góp qua công ty tài chính</span>
                <strong>{formatOrderMoney(selectedInstallmentPlan?.financedAmount ?? 0)}</strong>
              </div>

              <fieldset className="installment-term-options" disabled={!selectedFinanceCompany}>
                <legend>Chọn kỳ hạn</legend>
                <div>
                  {installmentPlans.map((plan) => (
                    <label key={plan.term}>
                      <input type="radio" name="installmentTerm" value={plan.term} checked={installmentTerm === plan.term} onChange={() => setInstallmentTerm(plan.term)} required />
                      <span className="installment-term-months"><strong>{plan.term} tháng</strong><small>{plan.interestMonths === 0 ? "0% lãi" : `${plan.interestMonths} tháng tính lãi`}</small></span>
                      <span className="installment-term-price"><strong>{selectedFinanceCompany ? formatOrderMoney(plan.monthlyPayment) : "Chọn đối tác"}</strong><small>/ tháng</small></span>
                      <span className="installment-term-interest">Tổng lãi: {selectedFinanceCompany ? formatOrderMoney(plan.interestAmount) : "-"}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <p className="installment-disclaimer">Số tiền trên là tạm tính theo lãi suất bạn cung cấp, chưa bao gồm bảo hiểm hoặc phí phát sinh nếu đối tác áp dụng. Kết quả xét duyệt và số tiền chính thức do công ty tài chính xác nhận.</p>
            </section>

            <div className="installment-form-grid">
              <label>Họ và tên người đăng ký<input name="installmentName" required autoComplete="name" placeholder="Đúng theo CCCD" /></label>
              <label>Số điện thoại<input name="installmentPhone" required type="tel" inputMode="tel" pattern="[0-9 +]{9,15}" autoComplete="tel" placeholder="09xx xxx xxx" /></label>
              <label>Ngày tháng năm sinh<input name="dateOfBirth" required type="date" autoComplete="bday" /></label>
              <label>Số CCCD<input name="citizenId" required inputMode="numeric" pattern="[0-9]{12}" minLength={12} maxLength={12} autoComplete="off" placeholder="12 chữ số" /></label>
              <label>Ngày cấp<input name="citizenIdIssueDate" required type="date" /></label>
              <label>Nơi cấp<input name="citizenIdIssuePlace" required autoComplete="off" placeholder="Cục Cảnh sát QLHC về TTXH" /></label>
            </div>

            <label className="consent installment-consent">
              <input name="installmentConsent" type="checkbox" required />
              Tôi đồng ý để Infinity Company lưu và chuyển thông tin hồ sơ cho công ty tài chính đã chọn nhằm tư vấn, thẩm định khoản trả góp.
            </label>
            <p className="installment-privacy">Thông tin CCCD được lưu trong hệ thống quản trị, không đưa vào email thông báo đơn hàng.</p>

            {status === "error" && <div className="order-form-error" role="alert">Chưa gửi được hồ sơ. Vui lòng kiểm tra thông tin và thử lại.</div>}
            <button className="button button-primary form-submit installment-submit" type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Đang gửi hồ sơ..." : "Gửi hồ sơ trả góp"} <span>↗</span>
            </button>
          </section>
        )}
      </div>
    </form>
  );
}

function createOrderCode() {
  return `HA${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}
