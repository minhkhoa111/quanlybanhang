"use client";

import Link from "next/link";
import { useCart } from "@/app/cart";

export default function CartHeaderLink() {
  const { count } = useCart();
  return <Link className="header-cart-link" href="/gio-hang" aria-label={`Giỏ hàng có ${count} sản phẩm`}><span className="header-cart-icon" aria-hidden="true" /><strong>Giỏ hàng</strong><em>{count}</em></Link>;
}
