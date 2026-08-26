import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getManagedOrderById } from "@/db/orders";
import { getManagedProducts } from "@/db/products";
import { changeOrderPaymentStatusAction, changeOrderStatusAction, saveOrderInvoiceAction } from "../../actions";
import { requireAdminPage } from "@/app/admin-auth";
import { getBranches } from "@/db/branches";
import { getAdminUsers } from "@/db/admin-users";
import { formatDateTime, formatMoney, orderStatuses, orderTotalNumber, paymentStatuses, statusLabel } from "../../utils";
import PrintButtons from "../../PrintButtons";
import OrderAssignmentForm from "../OrderAssignmentForm";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string; error?: string }> }) {
  const [{ id }, query, currentUser] = await Promise.all([params, searchParams, requireAdminPage("/admin/orders")]);
  const canAssign = currentUser.role === "owner" || currentUser.role === "manager";
  const [order, products, allBranches, allStaff] = await Promise.all([
    getManagedOrderById(id),
    getManagedProducts(),
    canAssign ? getBranches(false).catch(() => []) : Promise.resolve([]),
    canAssign ? getAdminUsers().catch(() => []) : Promise.resolve([]),
  ]);
  if (!order) notFound();
  const isAssignedWorker = currentUser.role === "sales" || currentUser.role === "warranty" || currentUser.role === "repair";
  const canViewOrder = currentUser.role === "owner" || (currentUser.role === "manager" && order.branchId === currentUser.branchId) || (isAssignedWorker && order.assignedAdminId === currentUser.id);
  if (!canViewOrder) notFound();
  const branches = currentUser.role === "manager" ? allBranches.filter((item) => item.id === currentUser.branchId) : allBranches;
  const staff = allStaff.filter((item) => item.active && item.role !== "owner" && (currentUser.role !== "manager" || item.branchId === currentUser.branchId));
  const product = products.find((item) => item.slug === order.productSlug || item.name === order.productName);
  const unitPrice = product ? orderTotalNumber({ ...order, quantity: 1 }, products) : 0;
  const orderItems = order.items.length ? order.items : [{
    productSlug: order.productSlug, productName: order.productName, ram: "", storage: order.storage,
    color: order.color, quantity: order.quantity, unitPrice, image: product?.image || "",
  }];
  const subtotal = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const total = orderTotalNumber(order, products);
  const invoiceDate = order.invoiceDate || new Date(order.createdAt).toISOString().slice(0, 10);
  const warrantyStartDate = order.warrantyStartDate || invoiceDate;
  const taxRate = order.invoiceTaxRate;
  const taxMultiplier = 1 + taxRate / 100;
  const taxableAmount = order.invoiceTaxIncluded && taxRate > 0 ? Math.round(total / taxMultiplier) : total;
  const taxAmount = taxRate > 0
    ? order.invoiceTaxIncluded ? total - taxableAmount : Math.round(taxableAmount * taxRate / 100)
    : 0;
  const invoiceTotal = order.invoiceTaxIncluded ? total : total + taxAmount;
  const warrantyPolicy = order.warrantyPolicy || DEFAULT_WARRANTY_POLICY;

  return (
    <>
      <div className="admin-topline">
        <div><span>Đơn hàng {order.orderCode}</span><h1>Chi tiết đơn hàng</h1></div>
        <div className="admin-actions-row">
          <PrintButtons />
          <Link className="admin-button" href="/admin/orders">Quay lại</Link>
        </div>
      </div>
      {query.status && <p className="admin-alert success">{query.status === "invoice-saved" ? "Đã lưu thông tin hóa đơn và bảo hành." : query.status === "assigned" ? "Đã cập nhật chi nhánh và nhân viên phụ trách." : "Đã cập nhật đơn hàng."}</p>}
      {query.error && <p className="admin-alert error">{query.error}</p>}
      <section className="admin-order-detail">
        <div className="admin-card">
          <div className="admin-card-head"><div><span>Thông tin đơn</span><h2>{formatDateTime(order.createdAt)}</h2></div></div>
          <div className="admin-detail-grid">
            <p><span>Mã đơn thanh toán</span><strong>{order.orderCode}</strong></p>
            <p><span>Customer</span><strong>{order.customerName}</strong></p>
            <p><span>Phone</span><a href={`tel:${order.phone}`}>{order.phone}</a></p>
            <p><span>Email</span>{order.email || "Không có"}</p>
            <p><span>Payment method</span>{order.paymentMethod || "Chưa chọn"}</p>
            <p><span>Tài khoản khách hàng</span>{order.customerId ? `#${order.customerId.slice(0, 8)}` : "Khách mua nhanh"}</p>
            <p><span>Voucher</span>{order.voucherCode || "Không sử dụng"}</p>
            <p className="admin-span-2"><span>Shipping address</span>{order.address || "Nhận tại cửa hàng"}</p>
            <p className="admin-span-2"><span>Note</span>{order.note || "Không có ghi chú"}</p>
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-card-head"><div><span>Status</span><h2>Cập nhật</h2></div></div>
          <form action={changeOrderStatusAction} className="admin-status-form">
            <input type="hidden" name="id" value={order.id} />
            <select name="status" defaultValue={order.status}>{orderStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select>
            <button className="admin-button admin-button-primary" type="submit">Change status</button>
          </form>
          <form action={changeOrderPaymentStatusAction} className="admin-status-form">
            <input type="hidden" name="id" value={order.id} />
            <select name="paymentStatus" defaultValue={order.paymentStatus}>{paymentStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select>
            <button className="admin-button" type="submit">Update payment</button>
          </form>
          <div className="admin-order-assignment">
            <span>Phân công vận hành</span>
            {canAssign ? <OrderAssignmentForm orderId={order.id} branches={branches} staff={staff} defaultBranchId={order.branchId || currentUser.branchId} defaultAdminId={order.assignedAdminId} lockBranch={currentUser.role === "manager"} /> : <div className="admin-assignment-readonly"><strong>{order.branchName || "Chưa phân chi nhánh"}</strong><small>{order.assignedAdminName || "Chưa có nhân viên phụ trách"}</small></div>}
          </div>
        </div>
        {order.financeCompany && (
          <div className="admin-card admin-span-2 admin-sensitive">
            <div className="admin-card-head">
              <div><span>Thông tin nhạy cảm · Không hiển thị khi in</span><h2>Hồ sơ tư vấn trả góp</h2></div>
              <strong className="admin-finance-company">{order.financeCompany}</strong>
            </div>
            <div className="admin-detail-grid">
              <p><span>Giá trị đơn hàng</span><strong>{formatMoney(total)}</strong></p>
              <p><span>Trả trước</span><strong>{order.downPaymentPercent}% · {formatMoney(Number(order.downPaymentAmount))}</strong></p>
              <p><span>Khoản góp tài chính</span><strong>{formatMoney(Number(order.financedAmount))}</strong></p>
              <p><span>Kỳ hạn lựa chọn</span><strong>{order.installmentTerm} tháng</strong></p>
              <p><span>Góp dự kiến mỗi tháng</span><strong>{formatMoney(Number(order.monthlyPayment))}</strong></p>
              <p><span>Tổng lãi tạm tính</span><strong>{formatMoney(Number(order.estimatedInterest))}</strong></p>
              <p><span>Họ và tên đăng ký</span><strong>{order.installmentName}</strong></p>
              <p><span>Số điện thoại</span><a href={`tel:${order.installmentPhone}`}>{order.installmentPhone}</a></p>
              <p><span>Ngày sinh</span><strong>{formatProfileDate(order.dateOfBirth)}</strong></p>
              <p><span>Số CCCD</span><strong className="admin-citizen-id">{order.citizenId}</strong></p>
              <p><span>Ngày cấp</span><strong>{formatProfileDate(order.citizenIdIssueDate)}</strong></p>
              <p><span>Nơi cấp</span><strong>{order.citizenIdIssuePlace}</strong></p>
            </div>
          </div>
        )}
        <div className="admin-card admin-span-2 admin-invoice-form">
          <div className="admin-card-head">
            <div><span>Hóa đơn và bảo hành</span><h2>Thông tin xuất hóa đơn</h2></div>
            <span className={`admin-badge invoice-${order.invoiceStatus}`}>{invoiceStatusLabel(order.invoiceStatus)}</span>
          </div>
          <p className="admin-form-note">Lưu dữ liệu người mua, thuế và bảo hành trước khi in. Đây là phiếu hóa đơn nội bộ; hóa đơn điện tử chính thức vẫn cần phát hành qua hệ thống hóa đơn điện tử của cửa hàng.</p>
          <form action={saveOrderInvoiceAction}>
            <input type="hidden" name="id" value={order.id} />
            <fieldset className="admin-invoice-section">
              <legend>Trạng thái chứng từ</legend>
              <div className="admin-invoice-grid admin-invoice-grid-4">
                <label><span>Trạng thái hóa đơn</span><select name="invoiceStatus" defaultValue={order.invoiceStatus}><option value="not_created">Chưa lập</option><option value="draft">Bản nháp</option><option value="ready">Sẵn sàng xuất</option><option value="issued">Đã xuất</option><option value="cancelled">Đã hủy</option></select></label>
                <label><span>Số hóa đơn</span><input name="invoiceNumber" defaultValue={order.invoiceNumber} placeholder="VD: 00000125" /></label>
                <label><span>Ký hiệu</span><input name="invoiceSeries" defaultValue={order.invoiceSeries} placeholder="VD: 1C26THA" /></label>
                <label><span>Mẫu số</span><input name="invoiceTemplateCode" defaultValue={order.invoiceTemplateCode} placeholder="VD: 1" /></label>
                <label><span>Ngày hóa đơn</span><input type="date" name="invoiceDate" defaultValue={invoiceDate} /></label>
                <label><span>Đối tượng mua</span><select name="invoiceBuyerType" defaultValue={order.invoiceBuyerType}><option value="individual">Cá nhân</option><option value="company">Doanh nghiệp</option></select></label>
                <label><span>Thuế suất VAT</span><select name="invoiceTaxRate" defaultValue={String(order.invoiceTaxRate)}><option value="0">0%</option><option value="5">5%</option><option value="8">8%</option><option value="10">10%</option></select></label>
                <label className="admin-invoice-checkbox"><input type="checkbox" name="invoiceTaxIncluded" defaultChecked={order.invoiceTaxIncluded} /><span>Giá đơn hàng đã gồm VAT</span></label>
              </div>
            </fieldset>
            <fieldset className="admin-invoice-section">
              <legend>Thông tin bên bán</legend>
              <div className="admin-invoice-grid">
                <label><span>Tên đơn vị bán</span><input name="invoiceSellerName" defaultValue={order.invoiceSellerName || "HUY APPLE"} /></label>
                <label><span>Mã số thuế</span><input name="invoiceSellerTaxCode" inputMode="numeric" defaultValue={order.invoiceSellerTaxCode} placeholder="Nhập mã số thuế cửa hàng" /></label>
                <label className="admin-span-2"><span>Địa chỉ</span><input name="invoiceSellerAddress" defaultValue={order.invoiceSellerAddress || "122/4 Cô Giang, P. Cầu Kiệu, TP.HCM"} /></label>
                <label><span>Số điện thoại</span><input name="invoiceSellerPhone" defaultValue={order.invoiceSellerPhone || "02879797999"} /></label>
              </div>
            </fieldset>
            <fieldset className="admin-invoice-section">
              <legend>Thông tin người mua</legend>
              <div className="admin-invoice-grid">
                <label><span>Họ tên người mua</span><input name="invoiceBuyerName" defaultValue={order.invoiceBuyerName || order.customerName} /></label>
                <label><span>Tên công ty</span><input name="invoiceCompanyName" defaultValue={order.invoiceCompanyName} placeholder="Để trống nếu mua cá nhân" /></label>
                <label><span>Mã số thuế người mua</span><input name="invoiceTaxCode" inputMode="numeric" defaultValue={order.invoiceTaxCode} /></label>
                <label><span>Email nhận hóa đơn</span><input type="email" name="invoiceEmail" defaultValue={order.invoiceEmail || order.email} /></label>
                <label className="admin-span-2"><span>Địa chỉ xuất hóa đơn</span><input name="invoiceAddress" defaultValue={order.invoiceAddress || order.address} /></label>
                <label className="admin-span-2"><span>Ghi chú hóa đơn</span><textarea name="invoiceNote" rows={3} defaultValue={order.invoiceNote} placeholder="Thông tin cần lưu ý khi xuất hóa đơn" /></label>
              </div>
            </fieldset>
            <fieldset className="admin-invoice-section">
              <legend>Bảo hành theo đơn hàng</legend>
              <div className="admin-invoice-grid">
                <label><span>Thời hạn bảo hành</span><div className="admin-input-suffix"><input type="number" min="0" max="120" name="warrantyMonths" defaultValue={order.warrantyMonths || 12} /><span>tháng</span></div></label>
                <label><span>Ngày bắt đầu</span><input type="date" name="warrantyStartDate" defaultValue={warrantyStartDate} /></label>
                <label className="admin-span-2"><span>Serial / IMEI sản phẩm</span><textarea name="warrantySerials" rows={3} defaultValue={order.warrantySerials} placeholder="Mỗi serial hoặc IMEI một dòng" /></label>
                <label className="admin-span-2"><span>Chính sách bảo hành in trên hóa đơn</span><textarea name="warrantyPolicy" rows={7} defaultValue={warrantyPolicy} /></label>
              </div>
            </fieldset>
            <div className="admin-invoice-summary">
              <div><span>Tiền hàng sau giảm</span><strong>{formatMoney(total)}</strong></div>
              <div><span>Tiền trước thuế</span><strong>{formatMoney(taxableAmount)}</strong></div>
              <div><span>VAT {taxRate}%</span><strong>{formatMoney(taxAmount)}</strong></div>
              <div><span>Tổng thanh toán hóa đơn</span><strong>{formatMoney(invoiceTotal)}</strong></div>
            </div>
            <div className="admin-form-actions"><button className="admin-button admin-button-primary" type="submit">Lưu hóa đơn và bảo hành</button></div>
          </form>
        </div>
        <div className="admin-card admin-span-2">
          <div className="admin-card-head"><div><span>Products</span><h2>Sản phẩm trong đơn</h2></div></div>
          {orderItems.map((item, index) => {
            const managed = products.find((candidate) => candidate.slug === item.productSlug);
            const image = item.image || managed?.image;
            return <div className="admin-order-product" key={`${item.productSlug}-${item.ram}-${item.storage}-${item.color}-${index}`}>
              <div>{image ? <Image src={image} alt="" width={86} height={86} unoptimized /> : <span />}</div>
              <div><strong>{item.productName}</strong><span>SKU: {managed?.sku || item.productSlug || "N/A"}</span><span>{[item.ram && `RAM ${item.ram}`, item.storage && `Dung lượng ${item.storage}`, item.color && `Màu ${item.color}`].filter(Boolean).join(" · ") || "Cấu hình tiêu chuẩn"}</span></div>
              <p>{item.quantity}</p>
              <p>{formatMoney(item.unitPrice)}</p>
              <p>{formatMoney(item.unitPrice * item.quantity)}</p>
            </div>;
          })}
          <div className="admin-totals">
            <p><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></p>
            <p><span>Shipping fee</span><strong>{order.shippingFee || "0đ"}</strong></p>
            <p><span>Discount</span><strong>{Number(order.discount) > 0 ? `-${formatMoney(Number(order.discount))}` : "0đ"}</strong></p>
            <p><span>Total</span><strong>{formatMoney(total)}</strong></p>
          </div>
        </div>
        <div className="admin-card admin-span-2">
          <div className="admin-card-head"><div><span>Timeline</span><h2>Order timeline</h2></div></div>
          <ol className="admin-timeline">
            {["pending", "confirmed", "processing", "shipping", "delivered"].map((status) => (
              <li key={status} className={orderStatuses.indexOf(order.status) >= orderStatuses.indexOf(status) ? "is-done" : ""}>
                <span />
                <div><strong>{statusLabel(status)}</strong><small>{status === "pending" ? formatDateTime(order.createdAt) : "Chờ cập nhật"}</small></div>
              </li>
            ))}
          </ol>
        </div>
        <article className="admin-invoice-print">
          <header>
            <div><p>{order.invoiceSellerName || "HUY APPLE"}</p><h1>HÓA ĐƠN BÁN HÀNG</h1></div>
            <dl><div><dt>Số hóa đơn</dt><dd>{order.invoiceNumber || "Chưa cấp"}</dd></div><div><dt>Ký hiệu</dt><dd>{order.invoiceSeries || "-"}</dd></div><div><dt>Ngày</dt><dd>{formatInvoiceDate(invoiceDate)}</dd></div></dl>
          </header>
          <section className="admin-invoice-parties">
            <div><h2>Bên bán</h2><p><strong>{order.invoiceSellerName || "HUY APPLE"}</strong></p><p>MST: {order.invoiceSellerTaxCode || "Chưa khai báo"}</p><p>{order.invoiceSellerAddress || "122/4 Cô Giang, P. Cầu Kiệu, TP.HCM"}</p><p>Điện thoại: {order.invoiceSellerPhone || "02879797999"}</p></div>
            <div><h2>Người mua</h2><p><strong>{order.invoiceCompanyName || order.invoiceBuyerName || order.customerName}</strong></p>{order.invoiceCompanyName && <p>Người mua: {order.invoiceBuyerName || order.customerName}</p>}<p>MST: {order.invoiceTaxCode || "Không có"}</p><p>{order.invoiceAddress || order.address || "Nhận tại cửa hàng"}</p><p>Email: {order.invoiceEmail || order.email || "Không có"}</p></div>
          </section>
          <table>
            <thead><tr><th>STT</th><th>Sản phẩm / cấu hình</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
            <tbody>{orderItems.map((item, index) => <tr key={`${item.productSlug}-invoice-${index}`}><td>{index + 1}</td><td><strong>{item.productName}</strong><small>{[item.ram && `RAM ${item.ram}`, item.storage, item.color].filter(Boolean).join(" · ")}</small></td><td>{item.quantity}</td><td>{formatMoney(item.unitPrice)}</td><td>{formatMoney(item.unitPrice * item.quantity)}</td></tr>)}</tbody>
          </table>
          <section className="admin-invoice-print-totals">
            <p><span>Cộng tiền hàng</span><strong>{formatMoney(subtotal)}</strong></p>
            <p><span>Giảm giá</span><strong>{Number(order.discount) > 0 ? `-${formatMoney(Number(order.discount))}` : "0đ"}</strong></p>
            <p><span>Phí giao hàng</span><strong>{order.shippingFee || "0đ"}</strong></p>
            <p><span>Tiền trước thuế</span><strong>{formatMoney(taxableAmount)}</strong></p>
            <p><span>VAT ({taxRate}%)</span><strong>{formatMoney(taxAmount)}</strong></p>
            <p className="total"><span>Tổng thanh toán</span><strong>{formatMoney(invoiceTotal)}</strong></p>
          </section>
          <section className="admin-invoice-warranty">
            <h2>Thông tin bảo hành</h2>
            <p><strong>Thời hạn:</strong> {order.warrantyMonths || 12} tháng, từ ngày {formatInvoiceDate(warrantyStartDate)}</p>
            <p><strong>Serial / IMEI:</strong> {order.warrantySerials || "Chưa ghi nhận"}</p>
            <p>{warrantyPolicy}</p>
          </section>
          {order.invoiceNote && <p className="admin-invoice-note"><strong>Ghi chú:</strong> {order.invoiceNote}</p>}
          <footer><div><strong>Người mua hàng</strong><span>Ký và ghi rõ họ tên</span></div><div><strong>Người bán hàng</strong><span>Ký và ghi rõ họ tên</span></div></footer>
        </article>
      </section>
    </>
  );
}

function formatProfileDate(value: string) {
  if (!value) return "Chưa có";
  return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN");
}

function formatInvoiceDate(value: string) {
  if (!value) return "Chưa xác định";
  return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN");
}

function invoiceStatusLabel(status: string) {
  if (status === "draft") return "Bản nháp";
  if (status === "ready") return "Sẵn sàng xuất";
  if (status === "issued") return "Đã xuất";
  if (status === "cancelled") return "Đã hủy";
  return "Chưa lập";
}

const DEFAULT_WARRANTY_POLICY = "Sản phẩm được bảo hành theo chính sách của nhà sản xuất hoặc nhà cung cấp và tình trạng ghi trên đơn hàng. Khi tiếp nhận bảo hành, sản phẩm cần còn nguyên tem, số serial/IMEI trùng khớp và không thuộc trường hợp rơi vỡ, vào nước hoặc đã bị can thiệp trái phép. Thời gian xử lý phụ thuộc trung tâm bảo hành và sẽ được cửa hàng thông báo cho khách hàng.";
