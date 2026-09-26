import type { Metadata } from "next";
import { currentCustomer } from "@/app/customer-auth";
import { preorderProducts } from "@/app/preorder-products";
import { getBranches } from "@/db/branches";
import IPhone18ProShowcase from "./IPhone18ProShowcase";
import MacBookProShowcase from "./MacBookProShowcase";
import "./macbook-pro-apple.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "iPhone 18 Pro & Pro Max - Đặt trước chính hãng Apple | Infinity Store",
  description: "Trải nghiệm và đặt trước iPhone 18 Pro, iPhone 18 Pro Max mới nhất tại Infinity Store. Khẩu độ biến thiên 4 bước ƒ/1.48–ƒ/4.0, chip A20 Pro 2nm. Giữ suất 0đ tiền cọc, nhận máy kiểm tra mới thanh toán.",
  openGraph: {
    title: "iPhone 18 Pro - Một nâng cấp quan trọng. Bứt phá mọi chuẩn mực Pro.",
    description: "Khẩu độ biến thiên cơ học 4 bước ƒ/1.48–ƒ/4.0. Chip A20 Pro 2nm thế hệ mới. Đặt trước không cần cọc tại Infinity Store.",
    images: ["/apple-iphone-18-pro/hero-iphone-18-pro.jpg"],
  },
};

interface PreorderPageProps {
  searchParams?: Promise<{ device?: string }> | { device?: string };
}

export default async function PreorderPage({ searchParams }: PreorderPageProps) {
  const [resolvedParams, branches, customer] = await Promise.all([
    searchParams ? Promise.resolve(searchParams) : Promise.resolve({ device: "iphone" }),
    getBranches(false).catch(() => []),
    currentCustomer().catch(() => undefined),
  ]);

  const device = resolvedParams?.device === "macbook" ? "macbook" : "iphone";
  const branchList = branches.map(({ id, name, address, phone, hours }) => ({
    id,
    name,
    address,
    phone,
    hours,
  }));
  const customerInfo = customer ? { name: customer.name, phone: customer.phone, email: customer.email } : undefined;

  return (
    <main className="preorder-apple-page" style={{ backgroundColor: "#000000", minHeight: "100vh" }}>
      {device === "macbook" ? (
        <MacBookProShowcase
          branches={branchList}
          customer={customerInfo}
          allProducts={preorderProducts}
        />
      ) : (
        <IPhone18ProShowcase
          branches={branchList}
          customer={customerInfo}
          allProducts={preorderProducts}
        />
      )}
    </main>
  );
}
