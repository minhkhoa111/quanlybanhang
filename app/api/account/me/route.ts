import { currentCustomer } from "@/app/customer-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { customer: await currentCustomer() ?? null },
    { headers: { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" } },
  );
}
