import type { Metadata } from "next"; import { CatalogPage } from "../ui";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title:"iPhone", description:"Các đời iPhone tại Infinity Company." };
export default function Page(){return <CatalogPage category="iphone"/>}
