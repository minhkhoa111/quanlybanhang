import React from "react";
import Link from "next/link";
import type { Product } from "./products";
import { getPublicProducts } from "@/db/products";
import CatalogCampaign from "./components/CatalogCampaign";
import { categoryCampaigns } from "./category-merchandising";
import { orderCatalogProducts } from "./current-catalog";
import CatalogProductBrowser from "./components/CatalogProductBrowser";
import CategoryFamilyTiles from "./components/CategoryFamilyTiles";
import { canManageProducts, currentAdminUser } from "./admin-auth";
export { default as ProductCard } from "./components/ProductCard";

const categoryNames: Record<string, string> = {
  "may-anh": "Máy ảnh & Thiết bị ghi hình chính hãng",
  "phu-kien": "Phụ kiện công nghệ chính hãng",
  iphone: "Điện thoại Apple iPhone chính hãng",
  ipad: "Máy tính bảng Apple iPad chính hãng",
  macbook: "Apple MacBook chính hãng",
  "mac-mini-studio": "Mac mini & Mac Studio chính hãng",
  imac: "Apple iMac chính hãng",
  laptop: "Laptop chính hãng giá tốt",
  "laptop-cu": "Laptop cũ giá rẻ, nguyên bản",
  android: "Điện thoại Android chính hãng",
  audio: "Thiết bị âm thanh & Tai nghe",
  smartwatch: "Đồng hồ thông minh & Smartwatch",
};

export async function CatalogPage({
  category,
  initialGroup,
  eyebrow,
  title,
  intro,
}: {
  eyebrow?: string;
  title?: string;
  intro?: string;
  initialGroup?: string;
  category: Product["category"];
}) {
  const [publicProducts, admin] = await Promise.all([
    getPublicProducts(category),
    currentAdminUser(),
  ]);
  const list = orderCatalogProducts(publicProducts, category);
  const showProductEditor = canManageProducts(admin);
  const campaign = categoryCampaigns[category];
  const catTitle = title || categoryNames[category] || "Sản phẩm chính hãng";

  return (
    <main
      className={`catalog-storefront catalog-storefront-${category}`}
      style={{
        backgroundColor: "#f4f4f4",
        minHeight: "80vh",
        paddingBottom: "50px",
      }}
    >
      <div className="cps-container shell" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 12px" }}>
        {/* Breadcrumb Navigation */}
        <nav
          className="cps-breadcrumb"
          aria-label="Đường dẫn trang"
          style={{
            fontSize: "12.5px",
            color: "#64748b",
            padding: "12px 0 8px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          <Link href="/" style={{ color: "#0071e3", textDecoration: "none", fontWeight: 500 }}>
            Trang chủ
          </Link>
          <span style={{ color: "#94a3b8" }}>›</span>
          <span style={{ color: "#1e293b", fontWeight: 600 }}>{catTitle}</span>
        </nav>

        {(category === "iphone" || category === "ipad" || category === "macbook") && (
          <CategoryFamilyTiles category={category} />
        )}

        <CatalogCampaign category={category} />

        <section className="catalog-products-section" id="catalog-products" style={{ padding: "10px 0" }}>
          {/* Category Header Banner */}
          <header
            className="catalog-products-heading cps-catalog-heading"
            style={{
              background: "#ffffff",
              borderRadius: "10px",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
              marginBottom: "16px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span
                  style={{
                    background: "#f0f7ff",
                    color: "#0071e3",
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    border: "1px solid #bae6fd",
                  }}
                >
                  {eyebrow || "CHÍNH HÃNG 100%"}
                </span>
                <span style={{ fontSize: "12px", color: "#64748b" }}>• Giao nhanh 2h • Đổi mới 30 ngày</span>
              </div>
              <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "2px 0 4px" }}>
                {campaign?.sectionTitle ?? catTitle}
              </h1>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                {intro || campaign?.sectionNote || "Chọn sản phẩm và xem thông số, giá bán chi tiết."}
              </p>
            </div>

            <div
              className="catalog-count"
              style={{
                background: "#f0f7ff",
                border: "1px solid #bae6fd",
                borderRadius: "8px",
                padding: "8px 16px",
                textAlign: "center",
              }}
            >
              <strong style={{ fontSize: "18px", color: "#0071e3", display: "block" }}>{list.length}</strong>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>sản phẩm</span>
            </div>
          </header>

          {campaign?.offers?.length ? (
            <div
              className="catalog-offers"
              aria-label="Ưu đãi mua hàng"
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginBottom: "16px",
                fontSize: "12px",
              }}
            >
              <strong style={{ color: "#0071e3", alignSelf: "center" }}>Ưu đãi:</strong>
              {campaign.offers.map((offer, index) => (
                <span
                  className={index === 0 ? "is-primary" : ""}
                  key={offer}
                  style={{
                    background: index === 0 ? "#0071e3" : "#ffffff",
                    color: index === 0 ? "#ffffff" : "#334155",
                    border: "1px solid #bae6fd",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontWeight: 600,
                  }}
                >
                  {offer}
                </span>
              ))}
            </div>
          ) : null}

          {(category === "iphone" || category === "macbook") && (
            <aside
              className="student-promotion"
              aria-label="Ưu đãi học sinh sinh viên"
              style={{
                background: "#f0f7ff",
                border: "1px dashed #0071e3",
                borderRadius: "8px",
                padding: "10px 14px",
                marginBottom: "16px",
                fontSize: "12px",
              }}
            >
              <div>
                <span style={{ color: "#0071e3", fontWeight: 800 }}>ƯU ĐÃI GIÁO DỤC - BACK TO SCHOOL: </span>
                <strong style={{ color: "#0f172a" }}>GIẢM 3% VỚI TẤT CẢ SẢN PHẨM TẠI CỬA HÀNG (TRỪ PHỤ KIỆN)</strong>
              </div>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "11.5px" }}>
                Áp dụng đối với các chương trình mua và thu cũ lên đời đối với HSSV &amp; Giáo viên.
                Áp dụng cho học sinh, sinh viên và giáo viên khi mua sắm trực tiếp hoặc online.
              </p>
            </aside>
          )}

          <CatalogProductBrowser
            products={list}
            category={category}
            initialGroup={initialGroup}
            canManageProducts={showProductEditor}
          />
        </section>
      </div>
    </main>
  );
}
