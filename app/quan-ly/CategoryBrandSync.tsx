"use client";
import { useState } from "react";
import type { ProductVariant } from "../products";

function editableCategory(category?: string) {
  if (category === "ipad" || category === "tablet") return "ipad";
  if (category === "mac-mini-studio" || category === "imac") return category;
  if (category?.startsWith("macbook")) return "macbook";
  if (category === "laptop") return "laptop";
  return category === "samsung" || category === "android" ? category : "iphone";
}

export default function CategoryBrandSync({ initialBrand, initialCategory, initialVariants = [] }:
  { initialBrand?: string; initialCategory?: string; initialVariants?: ProductVariant[] }){
  const [brand, setBrand] = useState(initialBrand ?? "");
  const [category, setCategory] = useState(editableCategory(initialCategory));
  const [brandTouched, setBrandTouched] = useState(false);

  function suggestedBrand(nextCategory: string) {
    if(nextCategory.startsWith('macbook') || nextCategory === 'mac-mini-studio' || nextCategory === 'imac') return 'Apple';
    if(nextCategory === 'samsung') return 'Samsung';
    if(nextCategory === 'iphone' || nextCategory === 'ipad') return 'Apple';
    return brand;
  }

  return (
    <>
      <label>Hãng
        <input name="brand" required value={brand} onChange={(e)=>{ setBrand(e.target.value); setBrandTouched(true); }} placeholder="Apple" />
      </label>

      <label>Nhóm sản phẩm
        <select name="category" required value={category} onChange={(e)=>{ const next = e.target.value; setCategory(next); if(!brandTouched) setBrand(suggestedBrand(next)); }}>
          <option value="iphone">iPhone</option>
          <option value="samsung">Samsung</option>
          <option value="android">Android khác</option>
          <option value="ipad">iPad</option>
          <option value="macbook">MacBook</option>
          <option value="mac-mini-studio">Mac mini &amp; Mac Studio</option>
          <option value="imac">iMac</option>
          <option value="laptop">Laptop Windows</option>
        </select>
      </label>

      {(category === "macbook" || category === "mac-mini-studio" || category === "imac" || category === "laptop") && (
        <div className="admin-mac-fields admin-wide">
          <div className="admin-mac-fields-heading">
            <strong>Cấu hình RAM / SSD</strong>
            <span>Mỗi cấu hình có giá riêng và sẽ hiện thành lựa chọn trên trang sản phẩm.</span>
          </div>
          <label>RAM đang bán
            <input name="macRamOptions" defaultValue={uniqueVariantValues(initialVariants, "ram").join(", ")} placeholder="16GB, 24GB, 32GB" />
          </label>
          <label>SSD đang bán
            <input name="macSsdOptions" defaultValue={uniqueVariantValues(initialVariants, "storage").join(", ")} placeholder="512GB, 1TB, 2TB" />
          </label>
          <label className="admin-wide">Tên màu theo thứ tự ô màu
            <input name="macColorNames" defaultValue={uniqueVariantValues(initialVariants, "color").join(", ")} placeholder="Xanh Da Trời, Bạc, Ánh Sao, Đêm Xanh Thẳm" />
          </label>
          <label className="admin-wide">Bảng giá cấu hình — mỗi dòng: RAM | SSD | Giá
            <textarea name="macConfigurations" rows={5} defaultValue={configurationLines(initialVariants)} placeholder={"16GB | 512GB | 35.999.000đ\n16GB | 1TB | 41.999.000đ\n24GB | 1TB | 47.999.000đ"} />
          </label>
        </div>
      )}
    </>
  );
}

function uniqueVariantValues(variants: ProductVariant[], key: "ram" | "storage" | "color") {
  return Array.from(new Set(variants.map((variant) => variant[key]).filter((value): value is string => Boolean(value))));
}

function configurationLines(variants: ProductVariant[]) {
  const lines = variants
    .filter((variant) => variant.ram && variant.storage && variant.price)
    .map((variant) => `${variant.ram} | ${variant.storage} | ${variant.price}`);
  return Array.from(new Set(lines)).join("\n");
}
