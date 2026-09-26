import type { Metadata } from "next";
import { CatalogPage } from "../ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Phụ kiện & linh kiện Apple",
  description: "Phụ kiện, màn hình iPhone, pin, camera và linh kiện sửa chữa tại Infinity Store.",
};

export default function PhuKienPage() {
  return (
    <CatalogPage
      eyebrow="Phụ kiện & linh kiện sửa chữa"
      title="Từ phụ kiện sử dụng đến linh kiện kỹ thuật."
      intro="Apple Watch, âm thanh, sạc, màn hình iPhone, pin, camera và linh kiện sửa chữa được gom trong một danh mục dễ tìm. Giá linh kiện được xác nhận lại sau khi kỹ thuật viên kiểm tra máy."
      category="phu-kien"
    />
  );
}
