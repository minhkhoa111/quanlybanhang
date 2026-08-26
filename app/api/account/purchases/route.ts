import { currentCustomer } from "@/app/customer-auth";
import { getCustomerOrders } from "@/db/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const customer = await currentCustomer();
  if (!customer) {
    return Response.json({ message: "Vui lòng đăng nhập member." }, { status: 401 });
  }

  const orders = await getCustomerOrders(customer.id);
  return Response.json({
    purchases: orders.map((order) => ({
      id: order.id,
      orderCode: order.orderCode,
      productName: order.productName,
      items: order.items.map(({ productSlug, productName, ram, storage, color, quantity, unitPrice, image }) => ({
        productSlug, productName, ram, storage, color, quantity, unitPrice, image,
      })),
      quantity: order.quantity,
      total: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus,
      invoiceStatus: order.invoiceStatus,
      invoiceNumber: order.invoiceNumber,
      invoiceDate: order.invoiceDate,
      warrantyMonths: order.warrantyMonths,
      warrantyStartDate: order.warrantyStartDate,
      warrantySerials: order.warrantySerials,
      branchName: order.branchName,
      createdAt: order.createdAt,
    })),
  }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
