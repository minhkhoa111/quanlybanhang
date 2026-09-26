import Link from "next/link";
import Image from "next/image";
import { getPublicProducts } from "@/db/products";
import StorefrontHero from "./components/StorefrontHero";
import StorefrontCommitments from "./components/StorefrontCommitments";
import StorefrontFlashSale from "./components/StorefrontFlashSale";
import StorefrontProductBlock from "./components/StorefrontProductBlock";
import IPhone18ProAdBanner from "./components/IPhone18ProAdBanner";
import StudentOfferBanner from "./components/StudentOfferBanner";
import UpcomingAppleLaunchPoster from "./components/UpcomingAppleLaunchPoster";
import VisualCategoryMenu from "./components/VisualCategoryMenu";
import HomeProductShowcases from "./components/HomeProductShowcases";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getPublicProducts();

  const formatted = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    category: p.category,
    brand: p.brand,
    image: p.image,
    price: p.price,
    salePrice: p.salePrice,
    sellingPrice: p.sellingPrice,
    badge: p.badge,
    specs: p.specs,
  }));

  // Categories
  const iphones = formatted.filter((p) => p.category === "iphone");
  const androids = formatted.filter((p) => p.category === "android");
  const allPhones = [...iphones, ...androids];

  const macbooks = formatted.filter((p) => p.category.startsWith("macbook"));
  const laptops = formatted.filter((p) => p.category === "laptop" || p.category === "laptop-cu");

  const accessories = formatted.filter(
    (p) => p.category === "phu-kien" || p.category === "audio" || p.category === "smartwatch"
  );

  const cameras = formatted.filter((p) => p.category === "may-anh");

  // Flash sale selection: products with sale price or high discount
  const flashSaleItems = (allPhones.length >= 5 ? allPhones : formatted)
    .slice(0, 5)
    .map((p, idx) => ({
      slug: p.slug,
      name: p.name,
      image: p.image,
      price: p.salePrice || p.sellingPrice || p.price,
      oldPrice: p.price !== (p.salePrice || p.sellingPrice) ? p.price : undefined,
      discountBadge: `Giảm ${12 + idx * 4}%`,
      soldCount: 18 + idx * 6,
      totalCount: 50,
    }));

  return (
    <main className="storefront-refresh">
      {/* 1. Hero 3 Cột Chuẩn Infinity Store */}
      <div className="shop-intro cps-container">
        <span>INFINITY STORE</span>
        <p>Công nghệ bạn yêu. Trải nghiệm bạn xứng đáng.</p>
        <Link href="/tu-van">Tư vấn chọn máy <span aria-hidden="true">↗</span></Link>
      </div>
      <StorefrontHero />
      <section id="shop-categories" className="shop-categories cps-container" aria-label="Khám phá danh mục">
        <div className="shop-section-heading"><div><span>CHỌN THEO CÁCH CỦA BẠN</span><h2>Thế giới công nghệ, trong tầm tay.</h2></div><p>Tìm thiết bị phù hợp với bạn.</p></div>
        <div className="shop-category-grid">
          {[
            { name: "iPhone", note: "Kết nối theo cách riêng", href: "/iphone", image: "/hero-products/iphone-18-pro-cutout-v2.png" },
            { name: "MacBook", note: "Cảm hứng làm việc", href: "/macbook", image: "/products/apple/macbook-air-13-15-m4-official.png" },
            { name: "Laptop", note: "Sẵn sàng bứt phá", href: "/laptop", image: "/products/expanded/rog-scar18-2025.png" },
            { name: "Máy ảnh", note: "Lưu từng khoảnh khắc", href: "/may-anh", image: "/hero-products/fujifilm-xm5-cutout-v3.png" },
           ].map((category, index) => <Link href={category.href} key={category.href} className="shop-category"><span className="shop-category-number" aria-hidden="true">0{index + 1}</span><div><strong>{category.name}</strong><span>{category.note}</span></div><Image src={category.image} alt={category.name} width={180} height={120} unoptimized /><span className="shop-category-arrow" aria-hidden="true">↗</span></Link>)}
        </div>
      </section>

      {/* 2. Dải Cam Kết 4 Tiêu Chí */}
      <StorefrontCommitments />

      <section className="storefront-member-assurance" aria-label="Bảo hành điện tử Member">
        <span className="storefront-member-assurance-icon" aria-hidden="true">🛡️</span>
        <div className="storefront-member-assurance-copy">
          <strong>Bảo hành điện tử, luôn có trong Member</strong>
          <span>Mỗi đơn hàng thành công đều được lưu để bạn theo dõi và tra cứu bảo hành.</span>
        </div>
        <Link href="/member#orders">
          Xem đơn và bảo hành <span aria-hidden="true">→</span>
        </Link>
      </section>

      <StudentOfferBanner />
      <UpcomingAppleLaunchPoster />
      <VisualCategoryMenu />
      <HomeProductShowcases products={formatted} />

      {/* 3. Flash Sale Giờ Vàng Đếm Ngược */}
      <StorefrontFlashSale products={flashSaleItems} />

      {/* 4. Quảng Cáo Apple iPhone 18 Pro Flagship */}
      <div className="cps-container" style={{ margin: "16px auto" }}>
        <IPhone18ProAdBanner variant="full" />
      </div>

      {/* 5. Khối Điện Thoại Nổi Bật */}
      <StorefrontProductBlock
        title="Điện thoại nổi bật"
        viewAllHref="/iphone"
        filterTabs={[
          { label: "Tất cả", filterKey: "all" },
          { label: "Apple iPhone", filterKey: "iphone" },
          { label: "Flagship Android", filterKey: "android" },
        ]}
        products={allPhones}
      />

      {/* 5. Khối MacBook Apple (Chính hãng & Like New) */}
      <StorefrontProductBlock
        title="MacBook cho mọi cảm hứng"
        viewAllHref="/macbook"
        filterTabs={[
          { label: "Tất cả", filterKey: "all" },
          { label: "MacBook Pro", filterKey: "pro" },
          { label: "MacBook Air", filterKey: "air" },
          { label: "Mới 100%", filterKey: "mới" },
          { label: "Like New (Đã qua SD)", filterKey: "like new" },
        ]}
        products={macbooks}
      />

      {/* 6. Khối Laptop Windows & Gaming AI */}
      <StorefrontProductBlock
        title="Laptop làm việc &amp; gaming"
        viewAllHref="/laptop"
        filterTabs={[
          { label: "Tất cả", filterKey: "all" },
          { label: "Laptop Gaming AI", filterKey: "gaming" },
          { label: "ASUS", filterKey: "asus" },
          { label: "Dell", filterKey: "dell" },
          { label: "Laptop Cũ Like New", filterKey: "laptop-cu" },
        ]}
        products={laptops}
      />

      {/* 6. Banner Dịch Vụ Thu Cũ Đổi Mới */}
      <section className="cps-container">
        <div className="cps-tradein-banner">
          <div className="cps-tradein-content">
            <h3>THU CŨ ĐỔI MỚI - LÊN ĐỜI TRỢ GIÁ ĐẾN 95%</h3>
            <p>
              Infinity Store định giá máy trong 5 phút. Hỗ trợ thu mua tất cả dòng máy iPhone, MacBook, iPad cũ giá cao nhất, thủ tục siêu tốc không bù nhiều tiền.
            </p>
          </div>
          <Link href="/tra-gop" className="cps-tradein-cta">
            Định giá máy ngay →
          </Link>
        </div>
      </section>

      {/* 7. Khối Phụ Kiện & Âm Thanh */}
      <StorefrontProductBlock
        title="Phụ kiện &amp; âm thanh"
        viewAllHref="/phu-kien"
        filterTabs={[
          { label: "Tất cả", filterKey: "all" },
          { label: "AirPods & Âm thanh", filterKey: "audio" },
          { label: "Apple Watch", filterKey: "smartwatch" },
          { label: "Cáp sạc & Pin", filterKey: "phu-kien" },
        ]}
        products={accessories}
      />

      {/* 8. Khối Máy Ảnh & Flycam Chuyên Nghiệp */}
      <StorefrontProductBlock
        title="Bắt trọn từng khoảnh khắc"
        viewAllHref="/may-anh"
        filterTabs={[
          { label: "Tất cả", filterKey: "all" },
          { label: "FUJIFILM", filterKey: "fujifilm" },
          { label: "SONY", filterKey: "sony" },
          { label: "CANON", filterKey: "canon" },
          { label: "DJI", filterKey: "dji" },
        ]}
        products={cameras}
      />
    </main>
  );
}
