import type { Metadata } from "next";
import { CatalogPage } from "../ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Máy ảnh Mirrorless & Thiết bị quay phim chính hãng",
  description: "Máy ảnh Mirrorless FUJIFILM, SONY, CANON và Gimbal Flycam DJI chính hãng tại Infinity Store. Trả góp 0%, giao nhanh 2 giờ.",
};

export default function MayAnhPage() {
  return (
    <CatalogPage
      eyebrow="Máy ảnh & Thiết bị ghi hình"
      title="Máy ảnh Mirrorless & Quay phim chuyên nghiệp."
      intro="Khám phá các dòng máy ảnh danh tiếng từ FUJIFILM, SONY, CANON và thiết bị chống rung, flycam DJI. Cam kết 100% chính hãng, bảo hành 12 - 24 tháng, hỗ trợ trả góp 0% lãi suất."
      category="may-anh"
    />
  );
}

