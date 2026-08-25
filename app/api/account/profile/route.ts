import { currentCustomer } from "@/app/customer-auth";
import { updateCustomerProfile } from "@/db/customers";

export async function PATCH(request: Request) {
  try {
    const customer = await currentCustomer();
    if (!customer) return Response.json({ ok: false, message: "Vui lòng đăng nhập." }, { status: 401 });
    const body = await request.json() as { name?: string; phone?: string };
    const updated = await updateCustomerProfile(customer.id, { name: body.name || "", phone: body.phone || "" });
    return Response.json({ ok: true, customer: updated });
  } catch (error) {
    return Response.json({ ok: false, message: error instanceof Error ? error.message : "Không thể cập nhật hồ sơ." }, { status: 400 });
  }
}
