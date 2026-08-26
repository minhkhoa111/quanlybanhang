import HeroCarousel from "./components/HeroCarousel";
import PromoGrid from "./components/PromoGrid";
import VisualCategoryMenu from "./components/VisualCategoryMenu";
import HomeProductShowcases from "./components/HomeProductShowcases";
import HomeHero from "./components/hero";
import AppleTechNews from "./components/AppleTechNews";
import StudentOfferBanner from "./components/StudentOfferBanner";
import { getPublicProducts } from "@/db/products";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getPublicProducts();
  const showcaseProducts = products.map(({ slug, name, category, image, badge, price, sellingPrice, salePrice, stock, specs }) => ({
    slug, name, category, image, badge, price, sellingPrice, salePrice, stock, specs,
  }));
  return (
    <main>
      <HomeHero />
      <HeroCarousel />

      <VisualCategoryMenu />

      <PromoGrid />

      <StudentOfferBanner />

      <section className="home-warranty shell" aria-labelledby="home-warranty-title">
        <div className="home-warranty-copy">
          <p className="eyebrow">Hậu mãi minh bạch</p>
          <h2 id="home-warranty-title">Bảo hành điện tử, luôn có trong Member.</h2>
          <p>Tra cứu thời hạn, ngày kích hoạt và serial/IMEI bằng mã đơn hàng. Khi mua bằng tài khoản member, hóa đơn và bảo hành được lưu tự động.</p>
          <div><Link className="button button-primary" href="/bao-hanh">Tra cứu bảo hành</Link><Link className="button button-secondary" href="/tai-khoan">Mở Huy Apple Member</Link></div>
        </div>
        <div className="home-warranty-steps">
          <article><span>01</span><div><strong>Nhập mã đơn &amp; số điện thoại</strong><p>Xác thực đúng thông tin người mua trước khi hiển thị hồ sơ.</p></div></article>
          <article><span>02</span><div><strong>Xem thời hạn &amp; serial</strong><p>Biết ngày bắt đầu, hết hạn và chi nhánh tiếp nhận.</p></div></article>
          <article><span>03</span><div><strong>Lưu cùng hóa đơn member</strong><p>Không lo thất lạc phiếu giấy khi cần hỗ trợ sau bán.</p></div></article>
        </div>
      </section>

      <AppleTechNews />

      <HomeProductShowcases products={showcaseProducts} />

      <section className="section shell" id="map">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Ghé cửa hàng</p>
            <h2>Bản đồ tới Huy Apple</h2>
          </div>
        </div>
        <div className="store-map">
          <iframe
            title="Bản đồ Huy Apple"
            src="https://www.google.com/maps?q=122/4%20C%C3%B4%20Giang%2C%20P.%20C%E1%BA%A7u%20Ki%E1%BA%BFu%2C%20TP.HCM&output=embed"
            width="100%"
            height={420}
            className="store-map-frame"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </main>
  );
}
