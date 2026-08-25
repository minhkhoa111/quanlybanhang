import { clearCustomerSession } from "@/app/customer-auth";

export async function POST() {
  await clearCustomerSession();
  return Response.json({ ok: true });
}
