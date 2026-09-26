"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type SearchProduct = {
  slug: string;
  name: string;
  category: string;
  image: string;
  price: string;
  sellingPrice?: string;
  salePrice?: string;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();
}

export default function HomeProductSearch({ products }: { products: SearchProduct[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const results = useMemo(() => {
    const term = normalize(query.trim());
    if (term.length < 2) return [];
    return products
      .filter((product) => normalize(`${product.name} ${product.category}`).includes(term))
      .map((product) => {
        const name = normalize(product.name);
        const score = name.startsWith(term) ? 0 : name.split(/\s+/).some((word) => word.startsWith(term)) ? 1 : 2;
        return { product, score };
      })
      .sort((left, right) => left.score - right.score || left.product.name.localeCompare(right.product.name, "vi"))
      .map(({ product }) => product)
      .slice(0, 6);
  }, [products, query]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (results[0]) router.push(`/san-pham/${results[0].slug}`);
  }

  return (
    <div className="home-product-search">
      <form onSubmit={submit} role="search">
        <span className="home-search-icon" aria-hidden="true">⌕</span>
        <label className="sr-only" htmlFor="home-product-query">Tìm kiếm sản phẩm</label>
        <input
          id="home-product-query"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 150)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setFocused(false);
              event.currentTarget.blur();
            }
          }}
          placeholder="Bạn muốn tìm điện thoại, laptop hay phụ kiện?"
          autoComplete="off"
        />
        <button type="submit" disabled={!results.length}>Tìm kiếm</button>
      </form>

      {focused && query.trim().length >= 2 && (
        <div className="home-search-results" role="listbox" aria-label="Kết quả tìm kiếm">
          {results.length ? results.map((product) => (
            <Link href={`/san-pham/${product.slug}`} key={product.slug} role="option">
              <span className="home-search-result-image">
                <Image src={product.image} alt="" fill style={{ objectFit: "contain" }} sizes="56px" unoptimized />
              </span>
              <span>
                <strong>{product.name}</strong>
                <small>{product.salePrice || product.sellingPrice || product.price}</small>
              </span>
              <b aria-hidden="true">→</b>
            </Link>
          )) : <p>Chưa tìm thấy sản phẩm phù hợp.</p>}
        </div>
      )}
    </div>
  );
}
