import React from "react";
import type { Product } from "./products";
import { getPublicProducts } from "@/db/products";
import CatalogCampaign from "./components/CatalogCampaign";
import { categoryCampaigns } from "./category-merchandising";
import { orderCatalogProducts } from "./current-catalog";
import CatalogProductBrowser from "./components/CatalogProductBrowser";
import CategoryFamilyTiles from "./components/CategoryFamilyTiles";
export { default as ProductCard } from "./components/ProductCard";

export async function CatalogPage({ category }: { eyebrow?:string; title?:string; intro?:string; category:Product["category"] }) {
  const list = orderCatalogProducts(await getPublicProducts(category), category);
  const campaign = categoryCampaigns[category];
  return <main className={`catalog-storefront catalog-storefront-${category}`}>
    {category === "ipad" && <CategoryFamilyTiles />}
    <CatalogCampaign category={category} />
    <section className="catalog-products-section" id="catalog-products">
      <div className="shell">
        <header className="catalog-products-heading">
          <div>
            <p className="eyebrow">Danh mục chính hãng</p>
            <h2>{campaign?.sectionTitle ?? "Sản phẩm đang có"}</h2>
            <p>{campaign?.sectionNote ?? "Chọn sản phẩm và xem cấu hình chi tiết."}</p>
          </div>
          <div className="catalog-count"><strong>{list.length}</strong><span>model</span></div>
        </header>
        {campaign?.offers?.length ? <div className="catalog-offers" aria-label="Ưu đãi mua hàng">
          <strong>Ưu đãi</strong>
          {campaign.offers.map((offer, index) => <span className={index === 0 ? "is-primary" : ""} key={offer}>{offer}</span>)}
        </div> : null}
        {(category === "iphone" || category === "macbook") && <aside className="student-promotion" aria-label="Ưu đãi học sinh sinh viên">
          <div><span>Ưu đãi giáo dục</span><strong>Giảm đến 3% cho học sinh, sinh viên</strong></div>
          <p>Áp dụng theo sản phẩm và chương trình tại thời điểm xác nhận đơn. Vui lòng cung cấp thẻ học sinh, sinh viên còn hiệu lực.</p>
        </aside>}
        <CatalogProductBrowser products={list} category={category} />
      </div>
    </section>
  </main>;
}
