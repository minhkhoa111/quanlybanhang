"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "../products";

type FamilyCategory = Extract<Product["category"], "iphone" | "ipad" | "macbook">;
type Family = { label: string; note: string; value: string; image: string };

const categoryFamilies: Record<FamilyCategory, Family[]> = {
  iphone: [
    { label: "iPhone 18 Pro Series", note: "4 màu · Đến 2TB", value: "18", image: "/products/iphone-18/pro-max-do.png" },
    { label: "iPhone 17", note: "Thế hệ mới", value: "17", image: "/products/apple/iphone-17-official/mist-blue.jpg" },
    { label: "iPhone 16", note: "Mạnh mẽ, cân bằng", value: "16", image: "/products/iphone-16.png" },
    { label: "iPhone 15", note: "USB-C tiện dụng", value: "15", image: "/products/iphone-15.png" },
    { label: "iPhone 14", note: "Bền bỉ, quen thuộc", value: "14", image: "/products/apple/iphone-models/iphone-14-plus.png" },
    { label: "iPhone 13, 12 & SE", note: "Dễ tiếp cận", value: "legacy", image: "/products/iphone-13.jpg" },
  ],
  ipad: [
    { label: "iPad Pro", note: "Hiệu năng chuyên nghiệp", value: "pro", image: "/products/apple/ipad-pro/space-black.jpg" },
    { label: "iPad mini", note: "Nhỏ gọn", value: "mini", image: "/products/apple/ipad-mini-a17/colors.png" },
    { label: "iPad", note: "Linh hoạt mỗi ngày", value: "standard", image: "/products/apple/ipad-a16/blue.jpg" },
    { label: "iPad Air", note: "Mỏng nhẹ, mạnh mẽ", value: "air", image: "/products/apple/ipad-air/purple.jpg" },
  ],
  macbook: [
    { label: "MacBook Air", note: "Mỏng nhẹ, pin lâu", value: "air", image: "/products/apple/macbook-air/sky-blue.jpg" },
    { label: "MacBook Pro", note: "Hiệu năng chuyên sâu", value: "pro", image: "/products/apple/macbook-pro/space-black.jpg" },
    { label: "MacBook Neo", note: "Gọn nhẹ, dễ tiếp cận", value: "neo", image: "/products/apple/macbook-neo/indigo.jpg" },
  ],
};

const categoryTitles: Record<FamilyCategory, string> = {
  iphone: "iPhone",
  ipad: "iPad",
  macbook: "MacBook",
};

export default function CategoryFamilyTiles({ category }: { category: FamilyCategory }) {
  const [selected, setSelected] = useState("");
  const families = categoryFamilies[category];

  function selectFamily(value: string) {
    setSelected(value);
    window.dispatchEvent(new CustomEvent("catalog-family-select", { detail: { category, group: value } }));
    window.setTimeout(() => document.getElementById("catalog-products")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  }

  return <section className="catalog-family-section" aria-labelledby={`${category}-family-title`}>
    <div className="shell">
      <p className="catalog-family-kicker">Chọn theo dòng sản phẩm</p>
      <h1 id={`${category}-family-title`}>{categoryTitles[category]}</h1>
      <div className={`catalog-family-grid catalog-family-grid-${families.length}`}>
        {families.map((family) => <button
          className={`catalog-family-tile${selected === family.value ? " is-active" : ""}`}
          type="button"
          onClick={() => selectFamily(family.value)}
          aria-pressed={selected === family.value}
          key={family.value}
        >
          <span className="catalog-family-image"><Image src={family.image} alt="" fill style={{ objectFit: "contain" }} sizes="(max-width: 700px) 42vw, 210px" unoptimized /></span>
          <span className="catalog-family-copy"><strong>{family.label}</strong><small>{family.note}</small></span>
        </button>)}
      </div>
    </div>
  </section>;
}
