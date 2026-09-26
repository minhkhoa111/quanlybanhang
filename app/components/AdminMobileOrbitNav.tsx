"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { adminNavigationForRole } from "@/app/admin/navigation";

export default function AdminMobileOrbitNav({ role, homeHref }: { role: string; homeHref: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const railRef = useRef<HTMLDivElement>(null);
  const items = adminNavigationForRole(role, homeHref);
  const matchingTargets = items
    .map((item) => item.href.split("?")[0])
    .filter((target) => target === homeHref ? pathname === homeHref : pathname.startsWith(target));
  const activeTarget = matchingTargets.sort((left, right) => right.length - left.length)[0];
  const activeQueryHref = items.find((item) => {
    if (!item.href.includes("?") || item.href.split("?")[0] !== activeTarget) return false;
    return Array.from(new URLSearchParams(item.href.split("?")[1])).every(([key, value]) => searchParams.get(key) === value);
  })?.href;

  useEffect(() => {
    const rail = railRef.current;
    const active = rail?.querySelector<HTMLElement>(".is-active");
    if (!rail || !active) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const left = active.offsetLeft - (rail.clientWidth - active.offsetWidth) / 2;
    rail.scrollTo({ left: Math.max(0, left), behavior: reducedMotion ? "auto" : "smooth" });
  }, [pathname]);

  return <nav className="admin-mobile-orbit" aria-label="Đầy đủ chức năng quản lý">
    <div className="admin-mobile-orbit-head">
      <strong>Chức năng</strong>
      <span>Vuốt để xem tất cả</span>
    </div>
    <div className="admin-mobile-orbit-rail" ref={railRef}>
      {items.map((item, index) => {
        const target = item.href.split("?")[0];
        const active = activeQueryHref ? item.href === activeQueryHref : target === activeTarget && !item.href.includes("?");
        return <Link
          href={item.href}
          className={active ? "is-active" : ""}
          style={{ "--orbit-index": index } as CSSProperties}
          aria-current={active ? "page" : undefined}
          key={`${item.href}-${item.label}`}
        >
          <span className="admin-mobile-orbit-icon" aria-hidden="true"><i>{item.icon}</i></span>
          <strong>{item.label}</strong>
        </Link>;
      })}
    </div>
  </nav>;
}
