import Image from "next/image";
import Link from "next/link";

const ipadFamilies = [
  { label: "iPad Pro", href: "#catalog-products", image: "/products/apple/ipad-pro/space-black.jpg" },
  { label: "iPad Mini", href: "#catalog-products", image: "/products/apple/ipad-a16/blue.jpg" },
  { label: "iPad Gen", href: "#catalog-products", image: "/products/apple/ipad-a16/pink.jpg" },
  { label: "iPad Air", href: "#catalog-products", image: "/products/apple/ipad-air/purple.jpg" },
];

export default function CategoryFamilyTiles() {
  return <section className="catalog-family-section" aria-labelledby="ipad-family-title">
    <div className="shell">
      <h1 id="ipad-family-title">iPad</h1>
      <div className="catalog-family-grid">
        {ipadFamilies.map((family) => <Link className="catalog-family-tile" href={family.href} key={family.label}>
          <span className="catalog-family-image"><Image src={family.image} alt={family.label} fill sizes="(max-width: 700px) 42vw, 180px" unoptimized /></span>
          <strong>{family.label}</strong>
        </Link>)}
      </div>
    </div>
  </section>;
}
