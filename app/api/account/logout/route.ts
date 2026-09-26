import { clearCustomerSession } from "@/app/customer-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearCustomerSession();
  return Response.json(
    { ok: true },
    { headers: { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" } },
  );
}
