import type { Metadata } from "next";
import { getPublicProducts } from "@/db/products";
import { getBranches } from "@/db/branches";
import { moneyToNumber } from "../order-pricing";
import InstallmentSimulator from "./InstallmentSimulator";

export const metadata: Metadata = {
  title: "Mô phỏng tài chính trả góp 0% - Dự toán khoản vay chính hãng | Infinity Store",
  description:
    "Công cụ Mô phỏng tài chính trả góp 0% lãi suất. Không thu CCCD tại bước mô phỏng. Tra cứu toàn bộ iPhone, MacBook, iPad, Laptop và Máy ảnh theo Hãng và Tên máy.",
  openGraph: {
    title: "Mô phỏng tài chính trả góp 0% chính hãng | Infinity Store",
    description: "Chủ động ngân sách - Trả trước từ 0đ - Không thu CCCD.",
    images: ["/og-storefront.png"],
  },
};

export const dynamic = "force-dynamic";

export interface SimulatorProductItem {
  slug: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  badge: string;
  tagline: string;
  price: number;
  originalPrice: number;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ may?: string; gia?: string; tab?: string }>;
}) {
  const query = await searchParams;
  const [catalog, rawBranches] = await Promise.all([
    getPublicProducts().catch(() => []),
    getBranches(false).catch(() => []),
  ]);

  const branches = rawBranches.map(({ id, name, address, phone }) => ({
    id,
    name,
    address,
    phone,
  }));

  const products: SimulatorProductItem[] = catalog
    .filter((product) => product.active !== false && product.stock !== 0)
    .map((product) => {
      const price = moneyToNumber(product.salePrice || product.sellingPrice || product.price);
      const originalPrice = moneyToNumber(product.price) || price;
      return {
        slug: product.slug,
        name: product.name,
        brand: product.brand || "",
        category: product.category || "other",
        image: product.image || "/brand/if-emblem-512.png",
        badge: product.badge || "",
        tagline: product.tagline || "",
        price,
        originalPrice,
      };
    })
    .filter((product) => product.price > 0)
    .sort((a, b) => {
      // 1. High value installment products (>= 8tr) come first
      const aTier = a.price >= 15_000_000 ? 3 : a.price >= 6_000_000 ? 2 : 1;
      const bTier = b.price >= 15_000_000 ? 3 : b.price >= 6_000_000 ? 2 : 1;
      if (aTier !== bTier) return bTier - aTier;

      // 2. Apple flagship priority
      const aIsApple = a.brand.toLowerCase() === "apple";
      const bIsApple = b.brand.toLowerCase() === "apple";
      if (aIsApple && !bIsApple) return -1;
      if (!aIsApple && bIsApple) return 1;

      // 3. Price descending (higher tier flagships first)
      return b.price - a.price;
    });

  return (
    <main className="installment-luxe-page">
      <InstallmentSimulator
        products={products}
        branches={branches}
        initialSlug={query.may}
        initialAmount={Math.max(0, Number(query.gia) || 0)}
        initialCategory={query.tab}
      />
    </main>
  );
}
