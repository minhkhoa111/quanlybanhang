import type { ManagedOrder } from "@/db/orders";
import type { ManagedProduct } from "@/db/products";

export const orderStatuses = ["pending", "confirmed", "processing", "shipping", "delivered", "cancelled", "returned"];
export const paymentStatuses = ["not_required", "unpaid", "paid", "refunded", "failed"];

export function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(timestamp: number) {
  return new Date(timestamp).toLocaleString("vi-VN");
}

export function productPriceNumber(product: ManagedProduct) {
  return moneyToNumber(product.salePrice || product.sellingPrice || product.price);
}

export function orderTotalNumber(order: ManagedOrder, products: ManagedProduct[] = []) {
  const explicit = moneyToNumber(order.total);
  if (explicit > 0) return explicit;
  const product = products.find((item) => item.slug === order.productSlug || item.name === order.productName);
  return product ? productPriceNumber(product) * order.quantity : 0;
}

export function moneyToNumber(value?: string) {
  if (!value) return 0;
  return Number(String(value).replace(/[^\d]/g, "")) || 0;
}

export function formatMoney(value: number) {
  if (!value) return "Liên hệ";
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Chờ xác nhận",
    confirmed: "Đã tiếp nhận",
    processing: "Đang xử lý",
    shipping: "Đang giao",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
    returned: "Hoàn trả",
    active: "Đang bán",
    inactive: "Tạm ẩn",
    draft: "Bản nháp",
    unpaid: "Chưa thanh toán",
    paid: "Đã thanh toán",
    refunded: "Hoàn tiền",
    failed: "Lỗi thanh toán",
    not_required: "Không cần thanh toán",
  };
  return labels[status] ?? status;
}
