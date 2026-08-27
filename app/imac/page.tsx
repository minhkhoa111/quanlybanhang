import type { Metadata } from "next";
import { CatalogPage } from "../ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "iMac",
  description: "iMac 24 inch nhiều màu với cấu hình RAM, SSD và giá theo từng phiên bản tại Infinity Company.",
};

export default function ImacPage() {
  return <CatalogPage category="imac" />;
}
