import { currentCustomer } from "@/app/customer-auth";
import { preorderProducts } from "@/app/preorder-products";
import { getBranches } from "@/db/branches";
import { createOrder, type OrderInput } from "@/db/orders";

export const dynamic = "force-dynamic";

const STORE_PICKUP = "Đến cửa hàng xem máy";
const NO_PAYMENT = "Không áp dụng - yêu cầu tư vấn";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const product = preorderProducts.find((item) => item.id === clean(body.productId, 60));
    if (!product) throw new Error("Sản phẩm đặt trước không hợp lệ.");

    const configuration = clean(body.configuration, 100);
    const color = clean(body.color, 60);
    const matchesConfig = product.capacities.includes(configuration) ||
      product.capacities.some((cap) => configuration.toLowerCase().includes(cap.toLowerCase()) || cap.toLowerCase().includes(configuration.toLowerCase())) ||
      Boolean(configuration);
    const matchesColor = product.colors.includes(color) ||
      product.colors.some((col) => color.toLowerCase().includes(col.toLowerCase()) || col.toLowerCase().includes(color.toLowerCase())) ||
      Boolean(color);

    if (!matchesConfig || !matchesColor) {
      throw new Error("Vui lòng chọn đúng cấu hình và màu sắc mong muốn.");
    }

    const customerName = clean(body.customerName, 100).replace(/\s+/g, " ");
    const phone = clean(body.phone, 20).replace(/[ .-]/g, "");
    const email = clean(body.email, 160).toLowerCase();
    if (customerName.length < 2 || !/^\+?\d{9,12}$/.test(phone)) {
      throw new Error("Vui lòng nhập đúng họ tên và số điện thoại liên hệ.");
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Địa chỉ email không hợp lệ.");
    }

    const branches = await getBranches(false);
    const branch = branches.find((item) => item.id === clean(body.branchId, 60));
    if (!branch) throw new Error("Vui lòng chọn một chi nhánh đang hoạt động để nhận máy.");

    const quantity = Math.min(5, Math.max(1, Math.floor(Number(body.quantity)) || 1));
    const contactTime = clean(body.contactTime, 60) || "Bất kỳ thời gian nào";
    const customerNote = clean(body.note, 500);
    const customer = await currentCustomer();
    const orderCode = `DT${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
    const note = [
      "[ĐẶT TRƯỚC · KHÔNG THU CỌC]",
      `Nhóm sản phẩm: ${product.familyLabel}`,
      `Thời gian liên hệ: ${contactTime}`,
      customerNote && `Ghi chú khách hàng: ${customerNote}`,
    ].filter(Boolean).join("\n");

    const order: OrderInput = {
      orderCode,
      customerName,
      phone,
      email,
      productSlug: `preorder-${product.id}`,
      productName: product.name,
      color,
      storage: configuration,
      quantity,
      deliveryMethod: STORE_PICKUP,
      address: branch.address,
      paymentMethod: NO_PAYMENT,
      total: "",
      discount: "",
      voucherCode: "",
      items: [{
        productSlug: `preorder-${product.id}`,
        productName: product.name,
        ram: "",
        storage: configuration,
        color,
        quantity,
        unitPrice: 0,
        image: product.image,
      }],
      customerId: customer?.id ?? "",
      contactTime,
      note,
      financeCompany: "",
      installmentName: "",
      installmentPhone: "",
      dateOfBirth: "",
      citizenId: "",
      citizenIdIssueDate: "",
      citizenIdIssuePlace: "",
      downPaymentPercent: 0,
      downPaymentAmount: "",
      financedAmount: "",
      installmentTerm: 0,
      monthlyPayment: "",
      estimatedInterest: "",
      branchId: branch.id,
      branchName: branch.name,
    };

    const saved = await createOrder(order);
    return Response.json({
      ok: true,
      id: saved.id,
      orderCode,
      status: saved.status,
      paymentStatus: saved.paymentStatus,
      paymentRequired: false,
      branch: { id: branch.id, name: branch.name, address: branch.address, phone: branch.phone, hours: branch.hours },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể tạo yêu cầu đặt trước.";
    return Response.json({ ok: false, message }, { status: 400 });
  }
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
