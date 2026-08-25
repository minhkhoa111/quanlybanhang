import { NextResponse } from "next/server";
import { recordProductView } from "@/db/product-views";

const SAFE_VALUE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,99}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { productSlug?: string; visitorId?: string };
    const productSlug = String(body.productSlug || "").trim();
    const visitorId = String(body.visitorId || "").trim();
    if (!SAFE_VALUE.test(productSlug) || !SAFE_VALUE.test(visitorId)) {
      return NextResponse.json({ message: "Dữ liệu lượt xem không hợp lệ." }, { status: 400 });
    }
    const recorded = await recordProductView(productSlug, visitorId);
    return NextResponse.json({ recorded });
  } catch {
    return NextResponse.json({ message: "Chưa thể ghi nhận lượt xem." }, { status: 500 });
  }
}
