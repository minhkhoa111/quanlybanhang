import Image from "next/image";
import Link from "next/link";
import type { Product } from "../products";

export default function ProductCard({ product }: { product: Product }) {
  const colorOptions = product.colorOptions?.length
    ? product.colorOptions
    : product.colors.map((hex, index) => ({ name: `Màu ${index + 1}`, hex }));

  return <article className="product-card">
    <div className="product-image-wrapper">
      <Link className="product-image" href={`/san-pham/${product.slug}`} aria-label={`Xem ${product.name}`}>
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <Image src={product.image} alt={product.name} fill unoptimized sizes="(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 30vw" />
      </Link>
    </div>
    <div className="product-body">
      <p className="product-brand">{product.brand}</p>
      <h3><Link href={`/san-pham/${product.slug}`}>{product.name}</Link></h3>
      <p className="product-tagline">{product.tagline}</p>
      {product.specs.length > 0 && <ul className="product-card-specs" aria-label={`Cấu hình nổi bật của ${product.name}`}>
        {product.specs.slice(0, 3).map((spec) => <li key={spec}><span aria-hidden="true" />{spec}</li>)}
      </ul>}
      <div className="product-meta"><strong>{product.price.toLowerCase().startsWith("từ") ? product.price : `Từ ${product.price}`}</strong><div className="color-dots" aria-label="Màu tham khảo">{colorOptions.map((color) => <span key={color.name} title={color.name} style={{ backgroundColor: color.hex }} />)}</div></div>
      {product.storageOptions && product.storageOptions.length > 0 && <p className="product-storage">{product.storageOptions.join(" / ")}</p>}
      <div className="product-actions">
        <Link href={`/san-pham/${product.slug}`}>Chi tiết <svg width="1em" height="1em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 12h4m-2-2v4M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm5-2v16" /></svg></Link>
        <Link className="mini-cta" href={`/san-pham/${product.slug}`}>Xem cấu hình <svg width="1em" height="1em" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7-7l7 7l-7 7" /></svg></Link>
      </div>
    </div>
  </article>;
}
