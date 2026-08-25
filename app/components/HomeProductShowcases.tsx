"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

export type HomeShowcaseProduct = {
  slug: string;
  name: string;
  category: string;
  image: string;
  badge: string;
  price: string;
  sellingPrice?: string;
  salePrice?: string;
  stock?: number;
  specs: string[];
};

type ProductTab = {
  id: string;
  label: string;
  note: string;
  href: string;
  products: HomeShowcaseProduct[];
};

type ShowcaseProps = {
  eyebrow: string;
  title: string;
  description: string;
  tone: "mobile" | "macbook";
  tabs: ProductTab[];
  offers: string[];
};

function displayPrice(product: HomeShowcaseProduct) {
  return product.salePrice || product.sellingPrice || product.price;
}

function ProductShowcase({ eyebrow, title, description, tone, tabs, offers }: ShowcaseProps) {
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "");
  const railRef = useRef<HTMLDivElement>(null);
  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeId) ?? tabs[0],
    [activeId, tabs],
  );

  if (!activeTab || activeTab.products.length === 0) return null;

  function changeTab(id: string) {
    setActiveId(id);
    if (railRef.current) railRef.current.scrollLeft = 0;
  }

  function scroll(direction: number) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.82, behavior: "smooth" });
  }

  return (
    <section className={`home-showcase home-showcase-${tone}`} aria-labelledby={`${tone}-showcase-title`}>
      <div className="shell home-showcase-inner">
        <header className="home-showcase-heading">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <div className="home-showcase-title-row">
              <h2 id={`${tone}-showcase-title`}>{title}</h2>
              <p>{description}</p>
            </div>
          </div>
          <Link className="home-showcase-all" href={activeTab.href}>Xem tất cả <span aria-hidden="true">→</span></Link>
        </header>

        <div className="home-showcase-tabs" role="tablist" aria-label={`Dòng sản phẩm ${title}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={tab.id === activeTab.id}
              className={tab.id === activeTab.id ? "is-active" : ""}
              onClick={() => changeTab(tab.id)}
            >
              <span>{tab.label}</span>
              <small>{tab.note}</small>
            </button>
          ))}
        </div>

        <div className="home-showcase-offers" aria-label="Ưu đãi">
          <strong>Ưu đãi</strong>
          {offers.map((offer, index) => <span className={index === 0 ? "is-primary" : ""} key={offer}>{offer}</span>)}
        </div>

        <div className="home-showcase-carousel">
          <button className="home-showcase-arrow is-left" type="button" onClick={() => scroll(-1)} aria-label="Xem sản phẩm trước">‹</button>
          <div className="home-showcase-rail" ref={railRef}>
            {activeTab.products.map((product) => (
              <article className="home-showcase-card" key={product.slug}>
                <div className="home-showcase-media">
                  {product.badge && <span className="home-showcase-badge">{product.badge}</span>}
                  <Link href={`/san-pham/${product.slug}`} aria-label={`Xem ${product.name}`}>
                    <Image src={product.image} alt={product.name} fill sizes="(max-width: 680px) 78vw, (max-width: 1100px) 42vw, 23vw" unoptimized />
                  </Link>
                </div>
                <div className="home-showcase-card-body">
                  <Link className="home-showcase-name" href={`/san-pham/${product.slug}`}>{product.name}</Link>
                  <ul className="home-showcase-specs" aria-label={`Cấu hình ${product.name}`}>
                    {product.specs.slice(0, 3).map((spec) => <li key={spec}><span aria-hidden="true" />{spec}</li>)}
                  </ul>
                  <div className="home-showcase-price-row">
                    <strong>{displayPrice(product)}</strong>
                    {product.salePrice && product.salePrice !== product.price && <del>{product.price}</del>}
                  </div>
                  <div className="home-showcase-card-footer">
                    <span>{product.stock === 0 ? "Liên hệ tồn kho" : "Ưu đãi tại cửa hàng"}</span>
                    <Link href={`/san-pham/${product.slug}`}>Xem cấu hình <span aria-hidden="true">→</span></Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <button className="home-showcase-arrow is-right" type="button" onClick={() => scroll(1)} aria-label="Xem sản phẩm tiếp theo">›</button>
        </div>
      </div>
    </section>
  );
}

function macbookFamily(product: HomeShowcaseProduct) {
  const identity = `${product.slug} ${product.name}`;
  if (/macbook[\s-]+pro/i.test(identity)) return "pro";
  if (/macbook[\s-]+air/i.test(identity)) return "air";
  return "other";
}

export default function HomeProductShowcases({ products }: { products: HomeShowcaseProduct[] }) {
  const iphones = products.filter((product) => product.category === "iphone");
  const samsung = products.filter((product) => product.category === "samsung");
  const macbooks = products.filter((product) => product.category.startsWith("macbook"));
  const macbookPro = macbooks.filter((product) => macbookFamily(product) === "pro");
  const macbookAir = macbooks.filter((product) => macbookFamily(product) === "air");

  return (
    <div className="home-showcases">
      <ProductShowcase
        eyebrow="Điện thoại chính hãng"
        title="Mobile"
        description="Chọn nhanh iPhone và Samsung theo nhu cầu"
        tone="mobile"
        tabs={[
          { id: "iphone", label: "iPhone nổi bật", note: "Dòng Apple đang được quan tâm", href: "/iphone", products: iphones },
          { id: "samsung", label: "Samsung Galaxy", note: "Galaxy S và các dòng gập", href: "/samsung", products: samsung },
        ]}
        offers={["Thu cũ đổi mới", "Trả góp linh hoạt", "Giao nhanh nội thành"]}
      />
      <ProductShowcase
        eyebrow="Apple Silicon mới"
        title="MacBook mới"
        description="Cấu hình phù hợp từ học tập đến công việc chuyên nghiệp"
        tone="macbook"
        tabs={[
          { id: "macbook-pro", label: "MacBook Pro", note: "Hiệu năng cho công việc chuyên sâu", href: "/macbook", products: macbookPro },
          { id: "macbook-air", label: "MacBook Air", note: "Mỏng nhẹ cho công việc hằng ngày", href: "/macbook", products: macbookAir },
        ]}
        offers={["Thu cũ đổi mới", "Ưu đãi học sinh sinh viên", "Trả góp linh hoạt"]}
      />
    </div>
  );
}
