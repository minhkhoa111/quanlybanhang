import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Huy Apple - Mua sắm & Quản lý",
    short_name: "Huy Apple",
    description: "Mua điện thoại, theo dõi đơn hàng và quản lý cửa hàng Huy Apple.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f6f2",
    theme_color: "#ffffff",
    orientation: "portrait-primary",
    icons: [
      { src: "/huy-apple-logo.png", sizes: "192x192", type: "image/png" },
      { src: "/huy-apple-logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
