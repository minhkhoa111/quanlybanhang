import type { Metadata } from "next";
import { CatalogPage } from "../ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Phụ kiện Apple",
  description: "Apple Watch, âm thanh và phụ kiện tại Huy Apple.",
};

export default function PhuKienPage() {
  return (
    <CatalogPage
      eyebrow="Phụ kiện Apple"
      title="Hoàn thiện hệ sinh thái của bạn."
      intro="Apple Watch, thiết bị âm thanh, sạc và phụ kiện được gom trong một danh mục dễ tìm."
      category="phu-kien"
    />
  );
}
