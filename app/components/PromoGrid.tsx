import fs from "fs";
import path from "path";
import Image from "next/image";
import Link from "next/link";
import { getPublicProducts } from "@/db/products";
import fallbackPromos from "../data/promos";

function findAdForSlug(slug: string) {
  const publicAds = path.join(process.cwd(), "public", "ads");
  const exts = ["jpg", "png", "webp", "jpeg"];
  for (const ext of exts) {
    const candidate = path.join(publicAds, `${slug}.${ext}`);
    if (fs.existsSync(candidate)) return `/ads/${slug}.${ext}`;
    const candidate2 = path.join(publicAds, `promo-${slug}.${ext}`);
    if (fs.existsSync(candidate2)) return `/ads/promo-${slug}.${ext}`;
  }
  // try generic promo files promo-1/2/3
  for (const ext of exts) {
    for (let i = 1; i <= 5; i++) {
      const c = path.join(publicAds, `promo-${i}.${ext}`);
      if (fs.existsSync(c)) return `/ads/promo-${i}.${ext}`;
    }
  }
  return null;
}

export default async function PromoGrid() {
  const products = await getPublicProducts();
  const featured = products.filter((p) => p.featured).slice(0, 3);

  const items = featured.length
    ? featured.map((p) => {
        const ad = findAdForSlug(p.slug);
        return { image: ad || p.image, href: `/san-pham/${p.slug}`, alt: p.name };
      })
    : fallbackPromos;

  return (
    <section className="promo-grid shell">
      <div className="promo-grid-inner">
        {items.map((p, i) => (
          <Link
            key={i}
            href={p.href}
            className="promo-item"
            aria-label={p.alt || p.href}
          >
            <Image src={p.image} alt={p.alt || "Khuyến mãi Huy Apple"} fill unoptimized sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 33vw" />
          </Link>
        ))}
      </div>
    </section>
  );
}
