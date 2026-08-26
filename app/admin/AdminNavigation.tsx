"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { icon: string; label: string; href: string; roles?: string[] };
type NavGroup = { label: string; items: NavItem[]; roles?: string[] };

const groups: NavGroup[] = [
  { label: "Điều hành", items: [
    { icon: "⌂", label: "Tổng quan", href: "/admin" },
    { icon: "↗", label: "Báo cáo kinh doanh", href: "/admin/reports", roles: ["owner", "manager"] },
  ] },
  { label: "Bán hàng & khách hàng", items: [
    { icon: "▤", label: "Đơn hàng", href: "/admin/orders", roles: ["owner", "manager", "sales", "warranty", "repair"] },
    { icon: "✦", label: "Tư vấn trực tiếp", href: "/admin/live-chat", roles: ["owner", "manager", "consultant"] },
    { icon: "♙", label: "Khách hàng", href: "/admin/customers", roles: ["owner", "manager", "sales", "consultant"] },
    { icon: "◇", label: "Khuyến mãi & voucher", href: "/admin/vouchers", roles: ["owner", "manager", "sales"] },
  ] },
  { label: "Sản phẩm & kho", roles: ["owner", "manager", "sales"], items: [
    { icon: "▦", label: "Danh mục sản phẩm", href: "/admin/products" },
    { icon: "＋", label: "Thêm sản phẩm", href: "/admin/products/new", roles: ["owner", "manager"] },
    { icon: "△", label: "Cảnh báo tồn kho", href: "/admin/products?stock=low" },
  ] },
  { label: "Tổ chức doanh nghiệp", roles: ["owner", "manager"], items: [
    { icon: "⌘", label: "Hệ thống chi nhánh", href: "/admin/branches", roles: ["owner"] },
    { icon: "♧", label: "Hồ sơ nhân sự", href: "/admin/hr", roles: ["owner", "manager"] },
    { icon: "⚿", label: "Tài khoản & phân quyền", href: "/admin/staff", roles: ["owner"] },
  ] },
  { label: "Chấm công", items: [
    { icon: "◷", label: "Chấm công nhân viên", href: "/admin/attendance" },
  ] },
  { label: "An ninh", items: [
    { icon: "◉", label: "Camera chi nhánh", href: "/admin/cameras" },
  ] },
];

export default function AdminNavigation({ role }: { role: string }) {
  const pathname = usePathname();
  return (
    <nav className="admin-nav-groups">
      {groups.filter((group) => !group.roles || group.roles.includes(role)).map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
      })).filter((group) => group.items.length).map((group) => (
        <section key={group.label}>
          <span>{group.label}</span>
          {group.items.map((item) => {
            const target = item.href.split("?")[0];
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(target);
            return <Link key={item.href} href={item.href} className={active ? "is-active" : ""}><i>{item.icon}</i>{item.label}</Link>;
          })}
        </section>
      ))}
    </nav>
  );
}
