"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const appleLinks = [
  ["/iphone", "iPhone"],
  ["/ipad", "iPad"],
  ["/macbook", "MacBook"],
  ["/mac-mini-studio", "Mac mini / Studio"],
  ["/imac", "iMac"],
  ["/phu-kien", "Phụ kiện Apple"],
] as const;

const topLinks = [
  ["/samsung", "Samsung"],
  ["/android", "Android khác"],
  ["/laptop", "Laptop"],
] as const;

export default function PrimaryNav() {
  const pathname = usePathname();

  return (
    <nav className="desktop-nav" aria-label="Điều hướng chính">
      <div className="nav-dropdown">
        <Link
          className="nav-dropdown-trigger"
          href="/iphone"
          aria-current={appleLinks.some(([href]) => pathname === href) ? "page" : undefined}
          aria-haspopup="true"
        >
          Apple <span aria-hidden="true">⌄</span>
        </Link>
        <div className="nav-dropdown-panel" role="menu" aria-label="Danh mục Apple">
          {appleLinks.map(([href, label]) => (
            <Link key={href} href={href} role="menuitem" aria-current={pathname === href ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </div>
      </div>
      {topLinks.map(([href, label]) => (
        <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
