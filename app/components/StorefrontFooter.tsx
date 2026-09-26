"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const brandPartners = [
  { name: "Sản phẩm Apple", href: "/iphone", tag: " Apple" },
  { name: "MacBook Apple", href: "/macbook", tag: "💻 MacBook" },
  { name: "Điện thoại OPPO", href: "/android", tag: "OPPO" },
  { name: "Sony Alpha & Audio", href: "/may-anh", tag: "SONY" },
  { name: "Thiết bị DJI", href: "/may-anh", tag: "DJI" },
  { name: "Canon Image", href: "/may-anh", tag: "Canon" },
  { name: "Fujifilm Mirrorless", href: "/may-anh", tag: "Fujifilm" },
  { name: "Điện thoại Xiaomi", href: "/android", tag: "Xiaomi" },
  { name: "ASUS ROG & Zenbook", href: "/laptop", tag: "ASUS" },
  { name: "Dell Official", href: "/laptop", tag: "Dell" },
  { name: "HP Premium", href: "/laptop", tag: "HP" },
  { name: "Lenovo ThinkPad", href: "/laptop", tag: "Lenovo" },
];

export default function StorefrontFooter() {
  const pathname = usePathname();
  const [seoExpanded, setSeoExpanded] = useState(false);

  if (pathname.startsWith("/admin") || pathname.startsWith("/quan-ly") || pathname.startsWith("/dat-truoc")) {
    return null;
  }

  return (
    <footer className="cps-footer" role="contentinfo">
      <div className="cps-container">
        {/* 1. CHUYÊN TRANG THƯƠNG HIỆU & ĐỐI TÁC CHÍNH HÃNG */}
        <section className="cps-brand-strip" aria-label="Thương hiệu đối tác chính hãng">
          <div className="cps-brand-strip-title">
            <span>Chuyên trang đối tác chính hãng &amp; Đại lý ủy quyền</span>
          </div>
          <div className="cps-brand-pills-row">
            {brandPartners.map((item) => (
              <Link key={item.name} href={item.href} className="cps-brand-pill-item" title={item.name}>
                <span>{item.tag}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 2. KHỐI NỘI DUNG SEO GIỚI THIỆU HỆ THỐNG CÓ THU GỌN / XEM THÊM */}
        <section className="cps-seo-box" aria-label="Giới thiệu hệ thống Infinity Store">
          <h2>HỆ THỐNG BÁN LẺ ĐIỆN THOẠI, LAPTOP &amp; THIẾT BỊ CÔNG NGHỆ CHÍNH HÃNG</h2>
          <div className={`cps-seo-content ${seoExpanded ? "is-expanded" : "is-collapsed"}`}>
            <p>
              <strong>Infinity Store</strong> tự hào là hệ thống bán lẻ thiết bị công nghệ hàng đầu, chuyên cung cấp các dòng sản phẩm Apple iPhone, iPad, MacBook, Laptop AI, máy ảnh Mirrorless chuyên nghiệp (Fujifilm, Sony, Canon) và thiết bị bay Flycam / Gimbal DJI chính hãng 100%.
            </p>
            <h3>1. Cam kết sản phẩm chính hãng &amp; Nguồn gốc minh bạch</h3>
            <p>
              Tất cả sản phẩm bán ra đều là hàng chính ngạch (VN/A đối với Apple), nguyên seal hộp, đầy đủ hóa đơn VAT và được hưởng chế độ bảo hành chính hãng từ 12 đến 24 tháng tại các trung tâm bảo hành ủy quyền như Apple AASP, Sony Vietnam, Canon LBM.
            </p>
            <h3>2. Mua hàng trả góp 0% - Xét duyệt siêu tốc</h3>
            <p>
              Hỗ trợ trả góp 0% lãi suất qua thẻ tín dụng của hơn 25 ngân hàng lớn hoặc thông qua các đối tác tài chính uy tín như Kredivo, FE Credit, HD Saison, Home Credit. Hồ sơ đơn giản, duyệt online trong 5 phút.
            </p>
            <h3>3. Thu cũ đổi mới (Trade-in) trợ giá lên tới 95%</h3>
            <h3>3. Dịch vụ chăm sóc &amp; Bảo hành chuẩn quốc tế</h3>
            <p>
              Chương trình thu cũ đổi mới giúp khách hàng dễ dàng nâng cấp lên các dòng máy flagship mới nhất. Định giá nhanh chóng, thủ tục gọn lẹ, mức trợ giá cao nhất thị trường.
              Đội ngũ kỹ thuật viên tay nghề cao hỗ trợ cài đặt, vệ sinh máy và chuyển đổi dữ liệu miễn phí trọn đời sản phẩm. Tiếp nhận bảo hành nhanh chóng, tận tâm.
            </p>
            <h3>4. Giao hàng hỏa tốc trong 2 giờ &amp; Đổi mới 30 ngày</h3>
            <p>
              Giao nhanh 2 giờ tại khu vực nội thành Hà Nội và TP. Hồ Chí Minh. Chính sách 1 đổi 1 trong vòng 30 ngày đầu tiên nếu phát sinh lỗi phần cứng từ nhà sản xuất.
            </p>
          </div>
          <button
            type="button"
            className="cps-seo-toggle-btn"
            onClick={() => setSeoExpanded(!seoExpanded)}
            aria-expanded={seoExpanded}
          >
            {seoExpanded ? "Thu gọn ⌃" : "Xem thêm thông tin ⌵"}
          </button>
        </section>

        {/* 3. LƯỚI FOOTER 4 CỘT INFINITY STORE */}
        <div className="cps-footer-grid">
          {/* Cột 1: Tổng đài hỗ trợ */}
          <div className="cps-footer-col">
            <h4>Tổng đài hỗ trợ miễn phí</h4>
            <div className="cps-footer-hotline-item">
              <span>Gọi mua hàng: <strong>028.7979.7999</strong> (7h30 - 22h00)</span>
            </div>
            <div className="cps-footer-hotline-item">
              <span>Hỗ trợ kỹ thuật &amp; bảo hành: <strong>1800.2064</strong> (8h00 - 21h00)</span>
            </div>
            <div className="cps-footer-hotline-item">
              <span>Khiếu nại &amp; góp ý: <strong>1800.2063</strong> (8h00 - 21h30)</span>
            </div>
            <div style={{ marginTop: "12px", lineHeight: "1.5" }}>
              <span style={{ fontWeight: 700, color: "#1e293b", display: "block" }}>Showroom TP. Hồ Chí Minh:</span>
              <span>122/4 Cô Giang, P. Cầu Kiệu, Q. Phú Nhuận, TP.HCM</span>
            </div>
            <div style={{ marginTop: "6px", lineHeight: "1.5" }}>
              <span style={{ fontWeight: 700, color: "#1e293b", display: "block" }}>Showroom Hà Nội:</span>
              <span>300 Cầu Giấy, P. Dịch Vọng, Q. Cầu Giấy, Hà Nội</span>
            </div>
          </div>

          {/* Cột 2: Thông tin & chính sách */}
          <div className="cps-footer-col">
            <h4>Thông tin và chính sách</h4>
            <ul className="cps-footer-list">
              <li><Link href="/tra-gop">Mua hàng và thanh toán Online</Link></li>
              <li><Link href="/tra-gop">Mua hàng trả góp 0% lãi suất</Link></li>
              <li><Link href="/bao-hanh">Chính sách bảo hành &amp; đổi mới</Link></li>
              <li><Link href="/bao-hanh">Tra cứu bảo hành điện tử</Link></li>
              <li><Link href="/tu-van">Chính sách giao hàng hỏa tốc 2h</Link></li>
              <li><Link href="/tu-van">Quy chế hoạt động &amp; bảo mật thông tin</Link></li>
            </ul>
          </div>

          {/* Cột 3: Dịch vụ & khách hàng */}
          <div className="cps-footer-col">
            <h4>Dịch vụ và tiện ích</h4>
            <ul className="cps-footer-list">
              <li><Link href="/member">Khách hàng thân thiết Infinity Member</Link></li>
              <li><Link href="/tra-gop">Thu cũ đổi mới trợ giá đến 95%</Link></li>
              <li><Link href="/tra-gop">Mô phỏng trả góp 0% lãi suất</Link></li>
              <li><Link href="/tu-van">Khách hàng doanh nghiệp (B2B)</Link></li>
              <li><Link href="/tu-van">Đăng ký tư vấn chọn máy theo nhu cầu</Link></li>
              <li><Link href="/admin-login">Cổng quản trị nội bộ Infinity Store</Link></li>
            </ul>
          </div>

          {/* Cột 4: Thanh toán & Chứng nhận */}
          <div className="cps-footer-col">
            <h4>Kết nối &amp; Thanh toán</h4>
            <div className="cps-footer-social-row">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="cps-social-pill" title="Facebook" aria-label="Facebook">f</a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="cps-social-pill" title="YouTube" aria-label="YouTube">▶</a>
              <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="cps-social-pill" title="TikTok" aria-label="TikTok">♪</a>
              <a href="https://zalo.me/02879797999" target="_blank" rel="noreferrer" className="cps-social-pill" title="Zalo" aria-label="Zalo">Z</a>
            </div>

            <div className="cps-partner-icons">
              <span className="cps-partner-tag"> Apple Reseller</span>
              <span className="cps-partner-tag">VNPAY-QR</span>
              <span className="cps-partner-tag">MoMo</span>
              <span className="cps-partner-tag">Kredivo</span>
              <span className="cps-partner-tag">Home Credit</span>
              <span className="cps-partner-tag">Visa / Master</span>
            </div>

            <div style={{ marginTop: "14px" }}>
              <span style={{ display: "inline-block", background: "#e0f2fe", color: "#0284c7", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>
                ✓ ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG
              </span>
            </div>
          </div>
        </div>

        {/* 4. DÒNG BẢN QUYỀN VÀ PHÁP LÝ */}
        <div className="cps-footer-bottom">
          <p style={{ margin: "0 0 6px" }}>
            © 2026 Công Ty Cổ Phần Bán Lẻ Kỹ Thuật Số Infinity Store. GPĐKKD: 0316789999 cấp bởi Sở KH &amp; ĐT TP. Hồ Chí Minh.
          </p>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "11px" }}>
            Địa chỉ văn phòng: 122/4 Cô Giang, Phường Cầu Kiệu, Quận Phú Nhuận, Thành phố Hồ Chí Minh. Điện thoại: 028.7979.7999.
          </p>
        </div>
      </div>
    </footer>
  );
}
