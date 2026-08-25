import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/db/products";
import ProductDetailExperience from "@/app/components/ProductDetailExperience";

export const dynamic = "force-dynamic";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params; const p=await getProductBySlug(slug); return p?{title:p.name,description:p.tagline}:{title:"Sản phẩm"};}
export default async function ProductPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params; const product=await getProductBySlug(slug); if(!product) notFound();
  return (
    <main>
      <ProductDetailExperience product={product} />
    </main>
  );
}
