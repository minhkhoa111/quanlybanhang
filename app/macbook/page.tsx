import Link from "next/link";
import Image from "next/image";
import { CatalogPage } from "../ui";

export const dynamic = "force-dynamic";

export default function MacbookPage() {
  return (
    <>
      <div style={{ background: "#05070a", borderBottom: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff" }}>
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "56px", height: "38px", position: "relative", flexShrink: 0 }}>
              <Image
                src="/apple-macbook-pro/hero-macbook-pro.jpg"
                alt="MacBook Pro mới"
                fill
                sizes="56px"
                style={{ objectFit: "cover", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)" }}
              />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 750, color: "#2997ff", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "2px" }}>
                Apple M5 / M4 Pro / M4 Max · Chính Hãng
              </div>
              <strong style={{ fontSize: "15px", color: "#f5f5f7" }}>
                MacBook Pro Mới: Đỉnh cao hiệu năng. Bứt phá mọi giới hạn.
              </strong>
            </div>
          </div>

          <Link
            href="/dat-truoc"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 22px",
              borderRadius: "999px",
              background: "#2997ff",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(41, 151, 255, 0.4)",
              transition: "all 0.2s ease",
            }}
          >
            <span>Khám phá & Đặt trước 0đ</span>
            <span>→</span>
          </Link>
        </div>
      </div>
      <CatalogPage category="macbook" />
    </>
  );
}
