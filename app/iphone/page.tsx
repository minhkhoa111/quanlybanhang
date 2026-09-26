import type { Metadata } from "next";
import { CatalogPage } from "../ui";
import IPhone18ProAdBanner from "@/app/components/IPhone18ProAdBanner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "iPhone Chính Hãng Apple - iPhone 18 Pro & Pro Max | Infinity Store",
  description: "Khám phá các đời iPhone chính hãng VN/A tại Infinity Store. Trải nghiệm và đặt trước iPhone 18 Pro với khẩu độ cơ học 4 bước ƒ/1.48–ƒ/4.0, chip A20 Pro 2nm.",
};

export default async function Page() {
  return (
    <>
      <IPhone18ProAdBanner variant="compact" />
      <CatalogPage category="iphone" />
    </>
  );
}
