import Image from "next/image";
import Link from "next/link";
import type { Product } from "../products";
import { categoryCampaigns } from "../category-merchandising";

export default function CatalogCampaign({ category }: { category: Product["category"] }) {
  const campaign = categoryCampaigns[category];
  if (!campaign) return null;

  const sourceIsInternal = campaign.sourceUrl.startsWith("/");
  const visual = <Image className="catalog-campaign-image" src={campaign.image} alt={campaign.imageAlt} fill priority sizes="(max-width: 760px) 100vw, 1180px" unoptimized />;

  return (
    <section className={`catalog-campaign catalog-campaign-${category}${campaign.dark ? " is-dark" : ""}`}>
      <div className="shell">
        {sourceIsInternal
          ? <Link className="catalog-campaign-stage" href={campaign.sourceUrl} aria-label={campaign.sourceLabel}>{visual}</Link>
          : <a className="catalog-campaign-stage" href={campaign.sourceUrl} target="_blank" rel="noreferrer" aria-label={campaign.sourceLabel}>{visual}</a>}
      </div>
    </section>
  );
}
