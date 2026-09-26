import { redirect } from "next/navigation";
import { canManageProducts, requireAdminPage } from "@/app/admin-auth";
import { getProductBySlug } from "@/db/products";

export const dynamic = "force-dynamic";

export default async function StorefrontProductEditRedirect({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const [query, user] = await Promise.all([
    searchParams,
    requireAdminPage("/admin/products"),
  ]);

  if (!canManageProducts(user)) {
    redirect("/admin/products?error=product-manager-required");
  }

  const slug = query.slug?.trim();
  if (!slug) redirect("/admin/products");

  const product = await getProductBySlug(slug);
  if (!product?.id) {
    redirect(`/admin/products?q=${encodeURIComponent(slug)}`);
  }

  redirect(`/admin/products/${encodeURIComponent(product.id)}`);
}
