import { currentCustomer } from "@/app/customer-auth";

export async function GET() {
  return Response.json({ customer: await currentCustomer() ?? null });
}
