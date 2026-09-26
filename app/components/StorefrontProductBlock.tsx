"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export interface ShowcaseItem {
  slug: string;
  name: string;
  category: string;
  brand?: string;
  image: string;
  price: string;
  salePrice?: string;
  sellingPrice?: string;
  badge?: string;
  specs?: string[];
}

interface ProductBlockProps {
  title: string;
  viewAllHref: string;
  filterTabs: { label: string; filterKey: string }[];
  products: ShowcaseItem[];
}

export default function StorefrontProductBlock({
  title,
  viewAllHref,
  filterTabs,
  products,
}: ProductBlockProps) {
  const [direction, setDirection] = useState("next");
  const [activeTab, setActiveTab] = useState(filterTabs[0]?.filterKey || "all");

  const filteredProducts = products.filter((p) => {
    if (activeTab === "all") return true;
    const lowerSearch = (p.name + " " + (p.brand || "") + " " + (p.badge || "")).toLowerCase();
    return lowerSearch.includes(activeTab.toLowerCase()) || p.category.toLowerCase().includes(activeTab.toLowerCase());
  });

  const displayList = (filteredProducts.length > 0 ? filteredProducts : products).slice(0, 10);

  return (
    <section className="cps-container cps-block-section" aria-label={title}>
      {/* Block Header: Title + Filter Pills + View All */}
      <div className="cps-block-header">
        <div className="cps-block-heading-copy">
          <span className="cps-block-kicker">Được chọn cho bạn</span>
          <h2 className="cps-block-title">{title}</h2>
        </div>

        <div className="cps-block-filters">
          {filterTabs.map((tab) => (
            <button
              key={tab.filterKey}
              type="button"
              className={`cps-filter-pill ${activeTab === tab.filterKey ? "is-active" : ""}`}
              aria-pressed={activeTab === tab.filterKey}
              onClick={() => {
                setDirection(filterTabs.findIndex((item) => item.filterKey === tab.filterKey) > filterTabs.findIndex((item) => item.filterKey === activeTab) ? "next" : "previous");
                setActiveTab(tab.filterKey);
              }}
            >
              {tab.label}
            </button>
          ))}

          <Link href={viewAllHref} className="cps-view-all-link">
            Xem tất cả ›
          </Link>
        </div>
      </div>

      {/* Product Cards Grid (5 columns on desktop, 2 on mobile) */}
      <div className="cps-block-grid shop-filter-results" key={activeTab} data-slide-direction={direction}>
        {displayList.map((item, idx) => {
          const discountPercent = 8 + (idx % 4) * 4;
          return (
            <Link
              key={item.slug}
              href={`/san-pham/${item.slug}`}
              className="cps-product-card"
            >
              <div className="cps-card-badges">
                <span className="cps-badge-discount">Giảm {discountPercent}%</span>
                <span className="cps-badge-installment">Trả góp 0%</span>
              </div>

              <div className="cps-card-media">
                <Image
                  src={item.image}
                  alt={item.name}
                  width={180}
                  height={180}
                  unoptimized
                />
              </div>

              <div className="cps-card-body">
                <h3 className="cps-card-name" title={item.name}>{item.name}</h3>

                <div className="cps-card-prices">
                  <span className="cps-price-current">{item.salePrice || item.sellingPrice || item.price}</span>
                  <span className="cps-price-old">
                    {/* Compute simulated original price for strikethrough */}
                    {item.price !== (item.salePrice || item.sellingPrice) ? item.price : ""}
                  </span>
                </div>

                <div className="cps-member-box">
                  <span>👑 Infinity Member giảm thêm đến 1%</span>
                </div>

                <div className="cps-card-footer">
                  <span className="cps-stars">★★★★★</span>
                  <span>5.0 (42 đánh giá)</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
