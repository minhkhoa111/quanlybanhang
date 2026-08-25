"use client";

import { useMemo, useState } from "react";
import type { Product } from "../products";
import ProductCard from "./ProductCard";

type SortMode = "featured" | "price-asc" | "price-desc";
type PriceBand = "all" | "under-20" | "20-40" | "over-40";

const categoryGroups: Partial<Record<Product["category"], Array<{ label: string; value: string }>>> = {
  iphone: [
    { label: "Tất cả iPhone", value: "all" },
    { label: "iPhone 17", value: "17" },
    { label: "iPhone 16", value: "16" },
    { label: "iPhone 15", value: "15" },
    { label: "iPhone 14", value: "14" },
    { label: "iPhone 13, 12 & SE", value: "legacy" },
  ],
  macbook: [
    { label: "Tất cả MacBook", value: "all" },
    { label: "MacBook Air", value: "air" },
    { label: "MacBook Pro", value: "pro" },
    { label: "MacBook Neo", value: "neo" },
  ],
  ipad: [
    { label: "Tất cả iPad", value: "all" },
    { label: "iPad Pro", value: "pro" },
    { label: "iPad Air", value: "air" },
    { label: "iPad mini", value: "mini" },
    { label: "iPad tiêu chuẩn", value: "standard" },
  ],
  "mac-mini-studio": [
    { label: "Tất cả máy bàn", value: "all" },
    { label: "Mac mini", value: "mini" },
    { label: "Mac Studio", value: "studio" },
  ],
  imac: [
    { label: "Tất cả iMac", value: "all" },
    { label: "iMac M4", value: "m4" },
    { label: "iMac M3", value: "m3" },
  ],
};

function matchesGroup(product: Product, category: Product["category"], group: string) {
  if (group === "all") return true;
  const haystack = `${product.slug} ${product.name}`.toLowerCase();
  if (category === "iphone") {
    if (group === "legacy") return /iphone-(12|13|se)|iphone (12|13|se)/.test(haystack);
    if (group === "17" && /iphone-(air|17e)|iphone (air|17e)/.test(haystack)) return true;
    return haystack.includes(`iphone-${group}`) || haystack.includes(`iphone ${group}`);
  }
  if (category === "macbook") return haystack.includes(`macbook-${group}`) || haystack.includes(`macbook ${group}`);
  if (category === "ipad") {
    if (group === "standard") return !/(ipad[\s-]+(pro|air|mini))/.test(haystack);
    return haystack.includes(`ipad-${group}`) || haystack.includes(`ipad ${group}`);
  }
  if (category === "mac-mini-studio") return haystack.includes(`mac-${group}`) || haystack.includes(`mac ${group}`);
  if (category === "imac") return haystack.includes(`-${group}-`) || haystack.includes(` ${group} `);
  return true;
}

function numericPrice(product: Product) {
  return Number((product.salePrice || product.sellingPrice || product.price).replace(/\D/g, "")) || 0;
}

function matchesPriceBand(product: Product, band: PriceBand) {
  if (band === "all") return true;
  const price = numericPrice(product);
  if (band === "under-20") return price < 20_000_000;
  if (band === "20-40") return price >= 20_000_000 && price <= 40_000_000;
  return price > 40_000_000;
}

export default function CatalogProductBrowser({ products, category }: { products: Product[]; category: Product["category"] }) {
  const groups = categoryGroups[category] ?? [{ label: "Tất cả sản phẩm", value: "all" }];
  const [group, setGroup] = useState("all");
  const [priceBand, setPriceBand] = useState<PriceBand>("all");
  const [sort, setSort] = useState<SortMode>("featured");
  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => matchesGroup(product, category, group) && matchesPriceBand(product, priceBand));
    if (sort === "featured") return filtered;
    return [...filtered].sort((a, b) => sort === "price-asc" ? numericPrice(a) - numericPrice(b) : numericPrice(b) - numericPrice(a));
  }, [category, group, priceBand, products, sort]);

  return <>
    {category === "ipad" && <div className="catalog-price-tabs" aria-label="Lọc iPad theo giá">
      {([
        ["all", "Mặc định"],
        ["under-20", "Dưới 20 triệu"],
        ["20-40", "20 - 40 triệu"],
        ["over-40", "Trên 40 triệu"],
      ] as Array<[PriceBand, string]>).map(([value, label]) => <button key={value} type="button" className={priceBand === value ? "is-active" : ""} onClick={() => setPriceBand(value)}>{label}</button>)}
    </div>}
    <div className="catalog-toolbar">
      <div className="catalog-model-tabs" aria-label="Lọc theo dòng sản phẩm">
        {groups.map((item) => <button key={item.value} type="button" className={group === item.value ? "is-active" : ""} onClick={() => setGroup(item.value)}>{item.label}</button>)}
      </div>
      <label className="catalog-sort">
        <span>Sắp xếp</span>
        <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
          <option value="featured">Nổi bật</option>
          <option value="price-asc">Giá thấp đến cao</option>
          <option value="price-desc">Giá cao đến thấp</option>
        </select>
      </label>
    </div>
    <p className="catalog-result-count">Hiển thị {visibleProducts.length} sản phẩm</p>
    <div className="product-grid catalog-product-grid">{visibleProducts.map((product) => <ProductCard key={product.slug} product={product} />)}</div>
  </>;
}
