import { cookies } from "next/headers";
import { authenticateCustomer, createCustomerSession } from "@/db/customers";
import { CUSTOMER_COOKIE, customerCookieOptions } from "@/app/customer-auth";
import { clearAdminSession } from "@/app/admin-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { identifier?: string; email?: string; password?: string };
    const customer = await authenticateCustomer(body.identifier ?? body.email ?? "", body.password ?? "");
    const token = await createCustomerSession(customer.id);
    await clearAdminSession();
    (await cookies()).set(CUSTOMER_COOKIE, token, customerCookieOptions());
    return Response.json({ ok: true, customer });
  } catch (error) {
    return Response.json({ ok: false, message: error instanceof Error ? error.message : "Không thể đăng nhập." }, { status: 400 });
  }
}
