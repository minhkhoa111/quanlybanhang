import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./red-theme.css";
import "./modern-theme.css";
import "./motion.css";
import "./chatbot.css";
import "./category-menu.css";
import "./home-showcase.css";
import "./hero-vibe.css";
import "./catalog-storefront.css";
import "./home-retail.css";
import "./mobile-storefront.css";
import "./admin-mobile-orbit.css";
import "./apple-3d-luxury.css";
import "./apple-tuandigi.css";
import "./product-detail-2026.css";
import "./footer-luxury-2026.css";
import "./preorder.css";
import "./admin-login/admin-login-2026.css";
import "./infinity-theme.css";
import "./smember-theme.css";
import "./tra-gop/installment-luxury.css";
import "./admin/products/products-premium.css";
import "./storefront-refresh.css";
import StorefrontHeader from "./components/StorefrontHeader";
import StorefrontFooter from "./components/StorefrontFooter";
import { CartProvider } from "@/app/cart";
import CartHeaderLink from "./components/CartHeaderLink";
import MotionSystem from "./components/MotionSystem";
import LocalChatbot from "./components/LocalChatbot";
import MobileAppNav from "./components/MobileAppNav";
import PwaInstaller from "./components/PwaInstaller";
import { getPublicProducts } from "@/db/products";

const siteFont = Inter({
  variable: "--font-site",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://infinityshop.click"),
  title: { default: "Infinity Store | Điện thoại & đặt hàng", template: "%s | Infinity Store" },
  description: "iPhone, iPad, MacBook và Laptop chính hãng tại Infinity Store..",
  openGraph: { title: "Infinity Store", description: "Chọn đúng máy. Không mua theo cảm tính.", type: "website", url: "https://infinityshop.click", siteName: "Infinity Store", images: ["/og-storefront.png"] },
  twitter: { card: "summary_large_image", images: ["/og-storefront.png"] },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "64x64" },
      { url: "/brand/if-emblem-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/if-emblem-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: { capable: true, title: "Infinity Store", statusBarStyle: "default" },
  other: { "store:phone": "02879797999" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#ffffff",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const catalog = await getPublicProducts();
  const chatbotProducts = catalog.map(({ slug, name, brand, price, tagline, stock, active }) => ({ slug, name, brand, price, tagline, stock, active }));
  return (
    <html lang="vi">
      <body className={siteFont.variable}>
        <CartProvider>
          <div className="sr-only" aria-hidden="true" style={{ display: "none" }}><CartHeaderLink /></div>
          <StorefrontHeader />
          <MotionSystem>{children}</MotionSystem>
          <StorefrontFooter />
          <LocalChatbot products={chatbotProducts} />
          <PwaInstaller />
          <MobileAppNav />
        </CartProvider>
      </body>
    </html>
  );
}
