import type { Metadata } from "next";
import CartCheckout from "./CartCheckout";
import { getBranches } from "@/db/branches";
import { getPublicProducts } from "@/db/products";

export const metadata: Metadata = { title: "Giỏ hàng | Infinity Store" };
export const dynamic = "force-dynamic";
export default async function CartPage() {
  const [branches, products] = await Promise.all([
    getBranches(false).catch(() => []),
    getPublicProducts().catch(() => []),
  ]);
  return <main className="cart-page shell"><CartCheckout branches={branches} recommendations={products.slice(0, 4)} /></main>;
}
