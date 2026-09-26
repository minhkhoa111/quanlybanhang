"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Product } from "../products";
import ProductCard from "./ProductCard";
import "../catalog-refined.css";

type SortMode = "featured" | "price-asc" | "price-desc";
type PriceBand = "all" | "under-20" | "20-40" | "over-40";
type ConditionFilter = "all" | "new" | "like-new";

const categoryGroups: Partial<Record<Product["category"], Array<{ label: string; value: string }>>> = {
  "may-anh": [
    { label: "Tất cả máy ảnh", value: "all" },
    { label: "FUJIFILM", value: "fujifilm" },
    { label: "SONY", value: "sony" },
    { label: "CANON", value: "canon" },
    { label: "DJI", value: "dji" },
  ],
  "phu-kien": [
    { label: "Tất cả phụ kiện", value: "all" },
    { label: "Cáp & Củ sạc", value: "sac" },
    { label: "Tai nghe & Loa", value: "tai-nghe" },
    { label: "Pin dự phòng", value: "pin" },
    { label: "Ốp lưng & Bao da", value: "op-lung" },
    { label: "Chuột & Bàn phím", value: "chuot-ban-phim" },
    { label: "Balo & Túi chống sốc", value: "tui" },
    { label: "Phụ kiện Apple", value: "apple" },
  ],
  iphone: [
    { label: "Tất cả iPhone", value: "all" },
    { label: "iPhone 18 Pro Series", value: "18" },
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
  laptop: [
    { label: "Tất cả Laptop", value: "all" },
    { label: "ASUS", value: "asus" },
    { label: "Dell", value: "dell" },
    { label: "HP", value: "hp" },
    { label: "Lenovo", value: "lenovo" },
    { label: "Acer & MSI", value: "acer" },
  ],
};

function matchesGroup(product: Product, category: Product["category"], group: string) {
  if (group === "all") return true;
  const haystack = `${product.slug} ${product.name} ${product.brand || ""}`.toLowerCase();
  if (category === "may-anh") {
    if (group === "all") return true;
    const brandLower = (product.brand || "").toLowerCase();
    if (group === "fujifilm") return brandLower === "fujifilm" || haystack.includes("fuji");
    if (group === "sony") return brandLower === "sony" || haystack.includes("sony");
    if (group === "canon") return brandLower === "canon" || haystack.includes("canon");
    if (group === "dji") return brandLower === "dji" || haystack.includes("dji") || haystack.includes("osmo") || haystack.includes("avata");
    return true;
  }
  if (category === "phu-kien") {
    if (group === "sac") return /sạc|sac|cable|cáp|adapter|anker|baseus|type-c|lightning/i.test(haystack);
    if (group === "tai-nghe") return /tai nghe|earpods|airpods|headphone|soundpeats|marshall|loa|speaker/i.test(haystack);
    if (group === "pin") return /dự phòng|du phong|powerbank|mophie|ugreen/i.test(haystack);
    if (group === "op-lung") return /ốp|op|bao da|case|cover|dán|cường lực|kinh/i.test(haystack);
    if (group === "chuot-ban-phim") return /chuột|bàn phím|keyboard|mouse|logitech|trackpad/i.test(haystack);
    if (group === "tui") return /túi|balo|chống sốc|quai|tomtoc/i.test(haystack);
    if (group === "apple") return /apple|magsafe|airpods|pencil|magic/i.test(haystack);
    return true;
  }
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
  if (category === "laptop") return group === "acer" ? /acer|msi/.test(haystack) : haystack.includes(group);
  return true;
}

function numericPrice(product: Product) {
  return Number((product.salePrice || product.sellingPrice || product.price).replace(/\D/g, "")) || 0;
}

function matchesPriceBand(product: Product, band: PriceBand) {
  if (band === "all") return true;
  const price = numericPrice(product);
  if (!price) return false;
  if (band === "under-20") return price < 20_000_000;
  if (band === "20-40") return price >= 20_000_000 && price <= 40_000_000;
  return price > 40_000_000;
}

function subscribeToLocation(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}
const readSearch = () => window.location.search;
const serverSearch = () => "";

export default function CatalogProductBrowser({
  products,
  category,
  initialGroup = "all",
  canManageProducts = false,
}: {
  products: Product[];
  category: Product["category"];
  initialGroup?: string;
  canManageProducts?: boolean;
}) {
  const groups = useMemo(() => categoryGroups[category] ?? [{ label: "Tất cả sản phẩm", value: "all" }], [category]);
  const search = useSyncExternalStore(subscribeToLocation, readSearch, serverSearch);
  const [selectedGroup, setGroup] = useState<string | null>(null);
  const urlGroup = new URLSearchParams(search).get("group");
  const group = selectedGroup ?? (groups.some((item) => item.value === urlGroup) ? urlGroup! : initialGroup);
  const [priceBand, setPriceBand] = useState<PriceBand>("all");
  const [condition, setCondition] = useState<ConditionFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("featured");

  const hasConditionProducts = useMemo(() => {
    return products.some((p) => Boolean(p.condition));
  }, [products]);

  useEffect(() => {
    function handleFamilySelect(event: Event) {
      const detail = (event as CustomEvent<{ category?: string; group?: string }>).detail;
      if (detail?.category === category && groups.some((item) => item.value === detail.group)) {
        setGroup(detail.group ?? "all");
      }
    }
    window.addEventListener("catalog-family-select", handleFamilySelect);
    return () => window.removeEventListener("catalog-family-select", handleFamilySelect);
  }, [category, groups]);

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const searchText = `${product.name} ${product.brand ?? ""} ${product.specs?.join(" ") ?? ""}`.toLocaleLowerCase("vi");
      if (query.trim() && !searchText.includes(query.trim().toLocaleLowerCase("vi"))) return false;
      if (!matchesGroup(product, category, group)) return false;
      if (!matchesPriceBand(product, priceBand)) return false;
      if (condition !== "all") {
        if (condition === "new" && product.condition !== "new") return false;
        if (condition === "like-new" && product.condition !== "like-new") return false;
      }
      return true;
    });
    if (sort === "featured") return filtered;
    return [...filtered].sort((a, b) => sort === "price-asc" ? numericPrice(a) - numericPrice(b) : numericPrice(b) - numericPrice(a));
  }, [category, condition, group, priceBand, products, query, sort]);

  const priceLabels: Record<PriceBand, string> = { all: "Mọi mức giá", "under-20": "Dưới 20 triệu", "20-40": "20 – 40 triệu", "over-40": "Trên 40 triệu" };
  const clearFilters = () => { setQuery(""); setGroup("all"); setPriceBand("all"); setCondition("all"); };
  const hasFilters = Boolean(query || group !== "all" || priceBand !== "all" || condition !== "all");

  return (
    <div className="catalog-refined">
      <div className="catalog-discover">
        <div><span className="catalog-eyebrow">TÌM THIẾT BỊ DÀNH CHO BẠN</span><h2>Lựa chọn vừa ý. Công nghệ vừa tầm.</h2><p>Khám phá, lọc cấu hình và tìm sản phẩm phù hợp.</p></div>
        <label className="catalog-local-search"><span>Tìm trong danh mục</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên máy, thương hiệu, cấu hình…" /></label>
      </div>
      <div className="catalog-filter-panel">
        <div className="catalog-family-pills" role="group" aria-label="Dòng sản phẩm">
          {groups.map((item) => <button type="button" key={item.value} aria-pressed={group === item.value} onClick={() => setGroup(item.value)}>{item.label}<span>{products.filter((product) => matchesGroup(product, category, item.value)).length}</span></button>)}
        </div>
        <div className="catalog-filter-controls">
          <label><span>Khoảng giá</span><select value={priceBand} onChange={(event) => setPriceBand(event.target.value as PriceBand)}>{Object.entries(priceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          {hasConditionProducts && <label><span>Tình trạng</span><select value={condition} onChange={(event) => setCondition(event.target.value as ConditionFilter)}><option value="all">Tất cả tình trạng</option><option value="new">Máy mới</option><option value="like-new">Like New · Đã qua sử dụng</option></select></label>}
          <label className="catalog-sort-control"><span>Sắp xếp theo</span><select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="featured">Nổi bật</option><option value="price-asc">Giá thấp đến cao</option><option value="price-desc">Giá cao đến thấp</option></select></label>
        </div>
      </div>
      <div className="catalog-results-bar">
        <p role="status"><strong>{visibleProducts.length}</strong> sản phẩm <span>/ {products.length} trong danh mục</span></p>
        {hasFilters && <button type="button" onClick={clearFilters}>Xóa bộ lọc ↺</button>}
      </div>
      {hasFilters && <div className="catalog-active-filters" aria-label="Bộ lọc đang áp dụng">
        {query && <button type="button" onClick={() => setQuery("")} aria-label={`Bỏ tìm kiếm ${query}`}>“{query}” ×</button>}
        {group !== "all" && <button type="button" onClick={() => setGroup("all")}>Dòng: {groups.find((item) => item.value === group)?.label} ×</button>}
        {priceBand !== "all" && <button type="button" onClick={() => setPriceBand("all")}>{priceLabels[priceBand]} ×</button>}
        {condition !== "all" && <button type="button" onClick={() => setCondition("all")}>{condition === "new" ? "Máy mới" : "Like New"} ×</button>}
      </div>}
      {visibleProducts.length ? <div className="product-grid catalog-product-grid catalog-refined-grid">
        {visibleProducts.map((product) => <ProductCard key={product.slug} product={product} canManage={canManageProducts} />)}
      </div> : <div className="catalog-empty-state"><span aria-hidden="true">⌕</span><h3>Chưa tìm thấy lựa chọn phù hợp</h3><p>Thử tên máy ngắn hơn hoặc bỏ bớt bộ lọc để khám phá thêm sản phẩm.</p><button type="button" onClick={clearFilters}>Xem tất cả sản phẩm</button></div>}
    </div>
  );
}
