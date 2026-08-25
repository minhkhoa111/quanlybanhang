import HeroCarousel from "./components/HeroCarousel";
import PromoGrid from "./components/PromoGrid";
import VisualCategoryMenu from "./components/VisualCategoryMenu";
import HomeProductShowcases from "./components/HomeProductShowcases";
import HomeHero from "./components/hero";
import AppleTechNews from "./components/AppleTechNews";
import StudentOfferBanner from "./components/StudentOfferBanner";
import { getPublicProducts } from "@/db/products";

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
