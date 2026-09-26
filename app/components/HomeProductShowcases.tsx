"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import ProductQuickViewModal, { type QuickViewProduct } from "./ProductQuickViewModal";

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
  tone: "mobile" | "macbook" | "accessories";
  tabs: ProductTab[];
  offers: string[];
};

function displayPrice(product: HomeShowcaseProduct) {
  return product.salePrice || product.sellingPrice || product.price;
}

function ProductShowcase({
  eyebrow,
  title,
  description,
  tone,
  tabs,
  offers,
  onQuickView,
}: ShowcaseProps & { onQuickView: (p: HomeShowcaseProduct) => void }) {
  const availableTabs = useMemo(() => tabs.filter((tab) => tab.products.length > 0), [tabs]);
  const [activeId, setActiveId] = useState(availableTabs[0]?.id ?? "");
  const railRef = useRef<HTMLDivElement>(null);
  const activeTab = useMemo(
    () => availableTabs.find((tab) => tab.id === activeId) ?? availableTabs[0],
    [activeId, availableTabs],
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
          <Link className="home-showcase-all" href={activeTab.href}>
            Xem tất cả <span aria-hidden="true">→</span>
          </Link>
        </header>

        <div className="home-showcase-tabs" role="tablist" aria-label={`Dòng sản phẩm ${title}`}>
          {availableTabs.map((tab) => (
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
          {offers.map((offer, index) => (
            <span className={index === 0 ? "is-primary" : ""} key={offer}>
              {offer}
            </span>
          ))}
        </div>

        <div className="home-showcase-carousel">
          <button
            className="home-showcase-arrow is-left"
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Xem sản phẩm trước"
          >
            ‹
          </button>
          <div className="home-showcase-rail" ref={railRef}>
            {activeTab.products.map((product) => (
              <article className="home-showcase-card" key={product.slug}>
                <div className="home-showcase-media">
                  {product.badge && <span className="home-showcase-badge">{product.badge}</span>}
                  <Link href={`/san-pham/${product.slug}`} aria-label={`Xem ${product.name}`}>
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 680px) 78vw, (max-width: 1100px) 42vw, 23vw"
                      style={{ objectFit: "contain", objectPosition: "center" }}
                      unoptimized
                    />
                  </Link>
                  <button
                    type="button"
                    className="product-quick-view-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onQuickView(product);
                    }}
                  >
                    <span>Xem nhanh </span>
                  </button>
                </div>
                <div className="home-showcase-card-body">
                  <Link className="home-showcase-name" href={`/san-pham/${product.slug}`}>
                    {product.name}
                  </Link>
                  <ul className="home-showcase-specs" aria-label={`Cấu hình ${product.name}`}>
                    {product.specs.slice(0, 3).map((spec) => (
                      <li key={spec}>
                        <span aria-hidden="true" />
                        {spec}
                      </li>
                    ))}
                  </ul>
                  <div className="home-showcase-price-row">
                    <strong>{displayPrice(product)}</strong>
                    {product.salePrice && product.salePrice !== product.price && <del>{product.price}</del>}
                  </div>
                  <div className="home-showcase-card-footer">
                    <span>{product.stock === 0 ? "Liên hệ tồn kho" : "Ưu đãi tại cửa hàng"}</span>
                    <Link href={`/san-pham/${product.slug}`}>
                      Xem cấu hình <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <button
            className="home-showcase-arrow is-right"
            type="button"
            onClick={() => scroll(1)}
            aria-label="Xem sản phẩm tiếp theo"
          >
            ›
          </button>
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
  const [quickViewProduct, setQuickViewProduct] = useState<QuickViewProduct | null>(null);

  const iphones = products.filter((product) => product.category === "iphone");
  const android = products.filter((product) => product.category === "android");
  const macbooks = products.filter((product) => product.category.startsWith("macbook"));
  const macbookPro = macbooks.filter((product) => macbookFamily(product) === "pro");
  const macbookAir = macbooks.filter((product) => macbookFamily(product) === "air");
  const laptop = products.filter((product) => product.category === "laptop");
  const accessories = products.filter((product) => product.category === "phu-kien");
  const audio = products.filter((product) => product.category === "audio");
  const smartwatch = products.filter((product) => product.category === "smartwatch");

  const handleQuickView = (p: HomeShowcaseProduct) => {
    setQuickViewProduct({
      slug: p.slug,
      name: p.name,
      category: p.category,
      image: p.image,
      badge: p.badge,
      price: p.price,
      sellingPrice: p.sellingPrice,
      salePrice: p.salePrice,
      stock: p.stock,
      specs: p.specs,
    });
  };

  return (
    <>
      <div className="home-showcases">
        <ProductShowcase
          eyebrow="Điện thoại chính hãng"
          title="Điện thoại nổi bật"
          description="Khung viền Titan, Apple Intelligence và camera chuẩn điện ảnh"
          tone="mobile"
          tabs={[
            { id: "iphone", label: "iPhone nổi bật", note: "Dòng Apple đang được quan tâm", href: "/iphone", products: iphones },
            { id: "android", label: "Flagship Android", note: "OPPO, Xiaomi và nhiều lựa chọn", href: "/android", products: android },
          ]}
          offers={["Bảo hành chính hãng 12-24 tháng", "Trả góp 0% linh hoạt", "Giao nhanh 2h nội thành"]}
          onQuickView={handleQuickView}
        />
        <ProductShowcase
          eyebrow="Máy tính cho mọi nhu cầu"
          title="Laptop & MacBook"
          description="Từ mỏng nhẹ văn phòng đến cỗ máy quái vật RTX 5090 & M4 Max"
          tone="macbook"
          tabs={[
            { id: "macbook-pro", label: "MacBook Pro", note: "Hiệu năng M4/M5 cho đồ họa chuyên sâu", href: "/macbook", products: macbookPro },
            { id: "macbook-air", label: "MacBook Air", note: "Mỏng nhẹ cho công việc hằng ngày", href: "/macbook", products: macbookAir },
            { id: "laptop", label: "Laptop Gaming & AI", note: "NVIDIA RTX 5090 / OLED 240Hz", href: "/laptop", products: laptop },
          ]}
          offers={["Giảm thêm 1.000.000đ cho HSSV", "Tặng túi chống sốc & chuột Pro", "Bảo hành 24 tháng"]}
          onQuickView={handleQuickView}
        />
        <ProductShowcase
          eyebrow="Hoàn thiện hệ sinh thái"
          title="Phụ kiện thiết yếu"
          description="AirPods Max, Apple Watch Ultra, củ sạc GaN và phụ kiện MagSafe chính hãng"
          tone="accessories"
          tabs={[
            { id: "accessories", label: "Phụ kiện", note: "Sạc nhanh MagSafe, cáp dù và ốp lưng", href: "/phu-kien", products: accessories },
            { id: "audio", label: "Âm thanh", note: "AirPods Pro, AirPods Max không gian 3D", href: "/audio", products: audio },
            { id: "smartwatch", label: "Đồng hồ", note: "Apple Watch Ultra & Series theo dõi sức khỏe", href: "/smartwatch", products: smartwatch },
          ]}
          offers={["Giảm 15% khi mua kèm máy", "Bảo hành 1 đổi 1 trong 12 tháng", "Chính hãng Apple"]}
          onQuickView={handleQuickView}
        />
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <ProductQuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </>
  );
}
