import type { Metadata } from "next";
import { CatalogPage } from "../ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Laptop Chính Hãng & Like New Tuyển Chọn",
  description: "Hơn 680+ mẫu laptop văn phòng, đồ họa, gaming và trạm Dell, HP, ThinkPad, ASUS từ phổ thông đến cao cấp tại Infinity Store.",
};

export default function LaptopPage() {
  return (
    <CatalogPage
      eyebrow="LAPTOP CHÍNH HÃNG & LIKE NEW"
      title="Laptop từ 12–200 triệu — Văn Phòng, Gaming & Máy Trạm Đồ Họa Chuyên Nghiệp"
      intro="Kho laptop hơn 680+ mẫu mã đa dạng từ Dell Latitude/Precision/XPS, HP EliteBook/ZBook, Lenovo ThinkPad, ASUS, Acer, MSI... Đầy đủ thông số chi tiết CPU, VGA, RAM, SSD, màn hình và bảo hành 12 tháng uy tín."
      category="laptop"
    />
  );
}

