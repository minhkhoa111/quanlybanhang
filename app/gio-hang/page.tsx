import type { Metadata } from "next";
import CartCheckout from "./CartCheckout";
import { getBranches } from "@/db/branches";

export const metadata: Metadata = { title: "Giỏ hàng | Huy Apple" };
export const dynamic = "force-dynamic";
export default async function CartPage() {
  const branches = await getBranches(false).catch(() => []);
  return <main className="cart-page shell"><CartCheckout branches={branches} /></main>;
}
