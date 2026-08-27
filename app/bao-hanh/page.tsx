import type { Metadata } from "next";
import WarrantyLookup from "./WarrantyLookup";

export const metadata: Metadata = {
  title: "Tra cứu bảo hành",
  description: "Tra cứu thời hạn, ngày kích hoạt và serial bảo hành sản phẩm đã mua tại Infinity Company.",
};

export default function WarrantyPage() {
  return <main className="warranty-page shell">
    <WarrantyLookup />
  </main>;
}
