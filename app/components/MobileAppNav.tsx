"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/app/cart";

const items = [
  { label: "Trang chủ", href: "/", icon: "home" },
  { label: "Sản phẩm", href: "/iphone", icon: "shop" },
  { label: "Giỏ hàng", href: "/gio-hang", icon: "cart" },
  { label: "Tài khoản", href: "/tai-khoan", icon: "user" },
] as const;

export default function MobileAppNav() {
  const pathname = usePathname();
  const { count } = useCart();
  if (pathname.startsWith("/admin") || pathname.startsWith("/quan-ly")) return null;

  return (
    <nav className="mobile-app-nav" aria-label="Điều hướng ứng dụng">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={active ? "is-active" : ""} aria-current={active ? "page" : undefined}>
            <AppIcon name={item.icon} />
            <span>{item.label}</span>
            {item.icon === "cart" && count > 0 && <em>{count > 9 ? "9+" : count}</em>}
          </Link>
        );
      })}
    </nav>
  );
}

function AppIcon({ name }: { name: (typeof items)[number]["icon"] }) {
  const paths = {
    home: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10M9 20v-6h6v6"/></>,
    shop: <><path d="M4 9h16l-1-5H5L4 9Z"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
    cart: <><path d="M3 4h2l2.2 10h10.9L21 7H6"/><circle cx="9" cy="19" r="1"/><circle cx="18" cy="19" r="1"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}
