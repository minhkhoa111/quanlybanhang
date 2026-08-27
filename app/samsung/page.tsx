import type { Metadata } from "next"; import { CatalogPage } from "../ui";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title:"Samsung Galaxy", description:"Samsung Galaxy tại Infinity Company." };
export default function Page(){return <CatalogPage category="samsung"/>}
