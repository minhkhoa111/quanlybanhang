"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { adminNavigationGroups } from "./navigation";

export default function AdminNavigation({ role, homeHref = "/admin" }: { role: string; homeHref?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const links = adminNavigationGroups
    .filter((group) => !group.roles || group.roles.includes(role))
    .flatMap((group) => group.items)
    .filter((item) => !item.roles || item.roles.includes(role));
  const selected = links.filter((item) => {
    const [target, query] = (item.href === "/admin" ? homeHref : item.href).split("?");
    if (item.href === "/admin") return pathname === homeHref;
    return (pathname === target || pathname.startsWith(`${target}/`)) &&
      (!query || [...new URLSearchParams(query)].every(([key, value]) => searchParams.get(key) === value));
  }).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav className="admin-nav-groups">
      {adminNavigationGroups.filter((group) => !group.roles || group.roles.includes(role)).map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
      })).filter((group) => group.items.length).map((group) => (
        <section key={group.label}>
          <span>{group.label}</span>
          {group.items.map((item) => {
            const href = item.href === "/admin" ? homeHref : item.href;
            const active = item.href === selected;
            return <Link key={item.href} href={href} aria-current={active ? "page" : undefined} className={active ? "is-active" : ""}><i aria-hidden="true">{item.icon}</i>{item.label}</Link>;
          })}
        </section>
      ))}
    </nav>
  );
}
