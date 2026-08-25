import { cookies } from "next/headers";
import { createCustomerSession, registerCustomer } from "@/db/customers";
import { CUSTOMER_COOKIE, customerCookieOptions } from "@/app/customer-auth";
import { clearAdminSession } from "@/app/admin-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { username?: string; name?: string; email?: string; phone?: string; password?: string };
    const customer = await registerCustomer({
      username: body.username ?? "",
      name: body.name ?? "", email: body.email ?? "", phone: body.phone ?? "",
      password: body.password ?? "",
    });
    const token = await createCustomerSession(customer.id);
    await clearAdminSession();
    (await cookies()).set(CUSTOMER_COOKIE, token, customerCookieOptions());
    return Response.json({ ok: true, customer });
  } catch (error) {
    return Response.json({ ok: false, message: error instanceof Error ? error.message : "Không thể đăng ký." }, { status: 400 });
  }
}
