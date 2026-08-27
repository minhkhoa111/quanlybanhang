import type { Metadata } from "next";
import { CatalogPage } from "../ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Mac mini & Mac Studio",
  description: "Mac mini và Mac Studio với cấu hình RAM, SSD và giá theo từng phiên bản tại Infinity Company.",
};

export default function MacMiniStudioPage() {
  return <CatalogPage category="mac-mini-studio" />;
}
