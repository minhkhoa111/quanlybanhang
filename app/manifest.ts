import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Infinity Company - Mua sắm & Quản lý",
    short_name: "Infinity Company",
    description: "Mua điện thoại, theo dõi đơn hàng và quản lý cửa hàng Infinity Company.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f6f2",
    theme_color: "#ffffff",
    orientation: "portrait-primary",
  };
}
