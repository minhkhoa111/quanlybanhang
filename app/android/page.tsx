import type { Metadata } from "next"; import { CatalogPage } from "../ui";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title:"Android khác", description:"Xiaomi, OPPO và điện thoại Android tại Infinity Company." };
export default function Page(){return <CatalogPage category="android"/>}
