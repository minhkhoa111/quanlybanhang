"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { products, type Product } from "../products";

function parsePrice(price?: string){
  if(!price) return 0;
  const digits = price.replace(/[^0-9]/g, "");
  return parseInt(digits || "0", 10);
}

export default function FilterPanel(){
  const [brand, setBrand] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [q, setQ] = useState("");

  const filtered: Product[] = useMemo(() => {
    return products.filter((p) => {
      if(brand && p.brand.toLowerCase() !== brand.toLowerCase()) return false;
      const price = parsePrice(p.price);
      if(priceRange === "under-5" && price > 5000000) return false;
      if(priceRange === "5-10" && (price < 5000000 || price > 10000000)) return false;
      if(priceRange === "over-10" && price < 10000000) return false;
      if(q && !(p.name + " " + (p.tagline||"")).toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [brand, priceRange, q]);

  return (
    <div className="filter-panel shell">
      <div className="filters-row">
        <select aria-label="Chọn thương hiệu" value={brand} onChange={(e)=>setBrand(e.target.value)}>
          <option value="">Tất cả thương hiệu</option>
          <option value="Apple">Apple</option>
          <option value="Samsung">Samsung</option>
          <option value="Xiaomi">Xiaomi</option>
        </select>
        <select aria-label="Khoảng giá" value={priceRange} onChange={(e)=>setPriceRange(e.target.value)}>
          <option value="">Tất cả mức giá</option>
          <option value="under-5">Dưới 5 triệu</option>
          <option value="5-10">5 - 10 triệu</option>
          <option value="over-10">Trên 10 triệu</option>
        </select>
        <input placeholder="Tìm theo tên hoặc model" aria-label="Tìm kiếm sản phẩm" value={q} onChange={(e)=>setQ(e.target.value)} />
        <button className="button" onClick={()=>{ /* no-op: filtering is live */ }}>Áp dụng</button>
      </div>

      <div className="filter-summary">Hiện {filtered.length} sản phẩm</div>

      <div className="filter-preview-grid">
        {filtered.slice(0,6).map((p)=> (
          <Link key={p.slug} href={`/san-pham/${p.slug}`} className="product-preview">
            <Image src={p.image} alt={p.name} width={80} height={80} unoptimized />
            <div className="meta"><strong>{p.name}</strong><span className="price">{p.price}</span></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
