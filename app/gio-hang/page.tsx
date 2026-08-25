import type { Metadata } from "next";
import CartCheckout from "./CartCheckout";

export const metadata: Metadata = { title: "Giỏ hàng | Huy Apple" };
export default function CartPage() { return <main className="cart-page shell"><CartCheckout /></main>; }
