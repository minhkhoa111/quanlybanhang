import type { Metadata } from "next";
import { CatalogPage } from "../ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Laptop cao cấp", description: "Laptop gaming và sáng tạo cao cấp tại Infinity Company." };

export default function LaptopPage(){
  return <CatalogPage eyebrow="Laptop hiệu năng cao" title="Laptop mạnh cho gaming, đồ họa và AI." intro="Các dòng máy nổi bật từ ASUS ROG, MSI và Gigabyte, có sẵn lựa chọn RAM, SSD và mức giá theo cấu hình." category="laptop" />;
}
