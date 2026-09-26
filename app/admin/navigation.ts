export type AdminNavItem = {
  icon: string;
  label: string;
  href: string;
  roles?: string[];
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
  roles?: string[];
};

export const adminNavigationGroups: AdminNavGroup[] = [
  { label: "Điều hành", items: [
    { icon: "⌂", label: "Tổng quan", href: "/admin" },
    { icon: "✓", label: "Công việc & báo cáo", href: "/admin/tasks" },
    { icon: "↗", label: "Báo cáo kinh doanh", href: "/admin/reports", roles: ["owner", "manager"] },
  ] },
  { label: "Bán hàng & khách hàng", items: [
    { icon: "▤", label: "Đơn hàng", href: "/admin/orders", roles: ["owner", "manager", "sales", "warranty", "repair"] },
    { icon: "✦", label: "Tư vấn trực tiếp", href: "/admin/live-chat", roles: ["owner", "manager", "consultant"] },
    { icon: "♙", label: "Member khách hàng", href: "/admin/customers", roles: ["owner"] },
    { icon: "◇", label: "Khuyến mãi & voucher", href: "/admin/vouchers", roles: ["owner"] },
  ] },
  { label: "Sản phẩm & kho", roles: ["owner", "manager", "sales", "inventory"], items: [
    { icon: "▦", label: "Danh mục sản phẩm", href: "/admin/products", roles: ["owner", "manager", "sales"] },
    { icon: "＋", label: "Thêm sản phẩm", href: "/admin/products/new", roles: ["owner", "manager"] },
    { icon: "⇄", label: "Kiểm tra & xuất nhập hàng", href: "/admin/inventory", roles: ["owner", "manager", "inventory"] },
    { icon: "△", label: "Cảnh báo tồn kho", href: "/admin/products?stock=low", roles: ["owner", "manager", "sales"] },
  ] },
  { label: "Tổ chức doanh nghiệp", roles: ["owner", "manager"], items: [
    { icon: "⌘", label: "Hệ thống chi nhánh", href: "/admin/branches", roles: ["owner"] },
    { icon: "♧", label: "Hồ sơ nhân sự", href: "/admin/hr", roles: ["owner", "manager"] },
    { icon: "▣", label: "Thẻ nhân sự", href: "/admin/hr/cards", roles: ["owner", "manager"] },
    { icon: "⚿", label: "Tài khoản & phân quyền", href: "/admin/staff", roles: ["owner"] },
    { icon: "▤", label: "Kiểm kê lương tháng", href: "/admin/payroll", roles: ["owner"] },
    { icon: "％", label: "Báo cáo thuế", href: "/admin/tax", roles: ["owner"] },
  ] },
  { label: "Chấm công", items: [
    { icon: "◷", label: "Chấm công nhân viên", href: "/admin/attendance" },
    { icon: "◎", label: "Đăng ký khuôn mặt", href: "/admin/face-test", roles: ["owner", "manager"] },
  ] },
  { label: "Cá nhân", roles: ["manager", "sales", "consultant", "warranty", "repair", "inventory"], items: [
    { icon: "▣", label: "Thẻ nhân sự của tôi", href: "/staff/card" },
  ] },
  { label: "An ninh", items: [
    { icon: "◉", label: "Camera chi nhánh", href: "/admin/cameras" },
  ] },
];

export function adminNavigationForRole(role: string, homeHref = "/admin") {
  return adminNavigationGroups
    .filter((group) => !group.roles || group.roles.includes(role))
    .flatMap((group) => group.items)
    .filter((item) => !item.roles || item.roles.includes(role))
    .map((item) => ({ ...item, href: item.href === "/admin" ? homeHref : item.href }));
}

