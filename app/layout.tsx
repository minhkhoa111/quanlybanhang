import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import "./red-theme.css";
import "./modern-theme.css";
import "./motion.css";
import "./chatbot.css";
import "./category-menu.css";
import "./home-showcase.css";
import "./hero-vibe.css";
import "./catalog-storefront.css";
import MegaMenu from "./components/MegaMenu";
import MobileMenuToggle from "./components/MobileMenuToggle";
import PrimaryNav from "./components/PrimaryNav";
import CartHeaderLink from "./components/CartHeaderLink";
import AccountHeaderLink from "./components/AccountHeaderLink";
import { CartProvider } from "./cart";
import MotionSystem from "./components/MotionSystem";
import LocalChatbot from "./components/LocalChatbot";
import MobileAppNav from "./components/MobileAppNav";
import PwaInstaller from "./components/PwaInstaller";
import { getPublicProducts } from "@/db/products";

const siteFont = Nunito_Sans({
  variable: "--font-site",
  subsets: ["latin", "latin-ext", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Huy Apple | Điện thoại & đặt hàng", template: "%s | Huy Apple" },
  description: "iPhone, Samsung và Android chính hãng. Tư vấn chọn máy theo nhu cầu tại TP.HCM.",
  icons: { icon: "/huy-apple-logo.png", shortcut: "/huy-apple-logo.png", apple: "/huy-apple-logo.png" },
  openGraph: { title: "Huy Apple", description: "Chọn đúng máy. Không mua theo cảm tính.", type: "website", images: ["/og.png"] },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Huy Apple", statusBarStyle: "default" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#ffffff",
};

function Header() {
  return <header className="site-header">
      <div className="shell nav-wrap">
        <Link className="logo" href="/" aria-label="Huy Apple - Trang chủ">
          <Image src="/huy-apple-logo.png" alt="Huy Apple" width={58} height={58} priority className="site-logo site-logo-header" unoptimized />
        </Link>
        <PrimaryNav />
        <MobileMenuToggle />
        <MegaMenu />
        <AccountHeaderLink />
        <CartHeaderLink />
        <Link className="nav-cta" href="/tu-van">Đặt Hàng Ngay <span>↗</span></Link>
      </div>
    </header>;
}

function Footer() {
  return <footer className="site-footer">
    <div className="shell footer-grid">
        <div className="footer-brand"><Link className="logo logo-footer" href="/"><Image src="/huy-apple-logo.png" alt="Huy Apple" width={180} height={180} className="site-logo site-logo-footer" unoptimized /></Link><p>Điện thoại phù hợp là chiếc máy giải quyết tốt nhu cầu của bạn — không nhất thiết là chiếc đắt nhất.</p></div>
      <div><h3>Sản phẩm</h3><Link href="/iphone">iPhone</Link><Link href="/ipad">iPad</Link><Link href="/macbook">MacBook</Link><Link href="/mac-mini-studio">Mac mini &amp; Mac Studio</Link><Link href="/imac">iMac</Link><Link href="/samsung">Samsung Galaxy</Link><Link href="/android">Android khác</Link><Link href="/laptop">Laptop</Link><Link href="/laptop-cu">Laptop cũ</Link><Link href="/phu-kien">Phụ kiện</Link></div>
      <div><h3>Hỗ trợ</h3><Link href="/tu-van">Đăng ký tư vấn</Link><a href="tel:02879797999">Gọi cửa hàng</a><a href="https://zalo.me/02879797999" target="_blank" rel="noreferrer">Nhắn Zalo</a><Link href="/admin-login">Cổng quản trị cửa hàng</Link></div>
      <div className="footer-contact">
        <h3>Ghé Huy Apple</h3>
        <p>122/4 Cô Giang<br />P.Cầu Kiệu, TP.HCM</p>
        <p><strong>SMS/ZALO</strong><br /><a href="tel:02879797999">02879797999</a></p>
        <div className="footer-map">
          <iframe
            title="Huy Apple - Cửa hàng"
            src="https://www.google.com/maps?q=122/4%20C%C3%B4%20Giang%2C%20P.%20C%E1%BA%A7u%20Ki%E1%BA%BFu%2C%20TP.HCM&output=embed"
            width="260"
            height="160"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
      <section className="footer-finance footer-finance-compact" aria-labelledby="footer-finance-title">
        <div className="finance-copy">
          <span>Thanh toán linh hoạt</span>
          <h2 id="footer-finance-title">Hỗ trợ trả góp qua công ty tài chính</h2>
          <p>Chọn đơn vị phù hợp, nhân viên Huy Apple sẽ tư vấn hồ sơ và phương án thanh toán theo nhu cầu.</p>
          <Link className="finance-contact" href="/tu-van">Nhận tư vấn trả góp <span aria-hidden="true">→</span></Link>
        </div>
        <div className="finance-list" aria-label="Các công ty tài chính hỗ trợ trả góp">
          <Link className="finance-partner" href="/tu-van" aria-label="Tư vấn trả góp qua FE Credit">
            <Image src="/finance/fe-credit-official.svg" alt="FE Credit" width={292} height={31} unoptimized />
            <span aria-hidden="true">→</span>
          </Link>
          <Link className="finance-partner" href="/tu-van" aria-label="Tư vấn trả góp qua HD Saison">
            <Image src="/finance/hd-saison-official.png" alt="HD Saison" width={365} height={134} unoptimized />
            <span aria-hidden="true">→</span>
          </Link>
          <Link className="finance-partner" href="/tu-van" aria-label="Tư vấn trả góp qua Kredivo">
            <Image src="/finance/kredivo-official.png" alt="Kredivo - Buy now, pay later" width={1000} height={340} unoptimized />
            <span aria-hidden="true">→</span>
          </Link>
          <Link className="finance-partner" href="/tu-van" aria-label="Tư vấn trả góp qua Shinhan Finance">
            <Image src="/finance/shinhan-finance-official.png" alt="Shinhan Finance" width={500} height={64} unoptimized />
            <span aria-hidden="true">→</span>
          </Link>
          <p className="finance-note">Khoản vay và hạn mức phụ thuộc vào điều kiện xét duyệt của từng công ty tài chính.</p>
        </div>
      </section>
    </div>
    <div className="shell footer-bottom"><span>© 2026 Huy Apple</span><span>Ảnh sản phẩm minh họa từ website chính thức của Apple, Samsung, Xiaomi và OPPO.</span></div>
  </footer>;
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const catalog = await getPublicProducts();
  const chatbotProducts = catalog.map(({ slug, name, brand, price, tagline, stock, active }) => ({ slug, name, brand, price, tagline, stock, active }));
  return <html lang="vi"><body className={siteFont.variable}><CartProvider><Header /><MotionSystem>{children}<Footer /></MotionSystem><LocalChatbot products={chatbotProducts} /><PwaInstaller /><MobileAppNav /></CartProvider></body></html>;
}
