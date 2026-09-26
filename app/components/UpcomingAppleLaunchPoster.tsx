import Image from "next/image";
import Link from "next/link";

const APPLE_NEWSROOM_IPHONE =
  "https://www.apple.com/newsroom/2026/09/apple-debuts-iphone-18-pro-and-iphone-18-pro-max/";
const APPLE_NEWSROOM_MACBOOK_AIR =
  "https://www.apple.com/vn/newsroom/2026/03/apple-introduces-the-new-macbook-air-with-m5/";
const APPLE_NEWSROOM_MACBOOK_PRO =
  "https://www.apple.com/vn/newsroom/2026/03/apple-introduces-macbook-pro-with-all-new-m5-pro-and-m5-max/";

const announcements = [
  {
    eyebrow: "MACBOOK AIR · ĐÃ RA MẮT",
    title: "MacBook Air với M5",
    description: "Mỏng nhẹ, pin đến 18 giờ và bộ nhớ 512GB tiêu chuẩn.",
    image: "/campaigns/apple-macbook-air-m5-official.jpg",
    alt: "MacBook Air M5 hiển thị Pixelmator Pro theo hình ảnh chính thức của Apple",
    facts: ["13,6 hoặc 15,3 inch", "M5 · Wi-Fi 7", "512GB đến 4TB"],
    source: APPLE_NEWSROOM_MACBOOK_AIR,
  },
  {
    eyebrow: "MACBOOK PRO · ĐÃ RA MẮT",
    title: "MacBook Pro, nay với dòng chip M5",
    description: "Hiệu năng chuyên nghiệp với M5, M5 Pro và M5 Max.",
    image: "/campaigns/apple-macbook-pro-m5-official.jpg",
    alt: "MacBook Pro M5 màu đen không gian theo hình ảnh chính thức của Apple",
    facts: ["14 hoặc 16 inch", "Pin đến 24 giờ", "M5 · M5 Pro · M5 Max"],
    source: APPLE_NEWSROOM_MACBOOK_PRO,
  },
];

export default function UpcomingAppleLaunchPoster() {
  return (
    <section className="apple-launch shell" aria-labelledby="apple-launch-title">
      <header className="apple-launch-heading">
        <div>
          <span className="apple-launch-kicker">TIN MỚI TỪ APPLE</span>
          <h2 id="apple-launch-title">iPhone 18 Series &amp; MacBook &amp; iPad thế hệ mới</h2>
        </div>
        <p>Nội dung và hình ảnh được đối chiếu trực tiếp từ Apple Newsroom.</p>
      </header>

      <article className="apple-launch-hero">
        <div className="apple-launch-hero-copy">
          <span className="apple-launch-status">MỞ ĐẶT TRƯỚC TỪ 12/09/2026</span>
          <p className="apple-launch-overline">iPhone 18 Pro &amp; iPhone 18 Pro Max</p>
          <h3>Pro hơn ở camera.<br />Mạnh hơn với A20 Pro.</h3>
          <p className="apple-launch-summary">
            Apple chính thức công bố bộ đôi iPhone 18 Pro với camera chính Fusion 48MP khẩu độ thay đổi,
            chip A20 Pro và bốn màu Burgundy, Glacier, Silver, Black.
          </p>
          <ul className="apple-launch-facts" aria-label="Thông tin nổi bật iPhone 18 Pro">
            <li><strong>48MP</strong><span>Fusion Main, khẩu độ thay đổi</span></li>
            <li><strong>A20 Pro</strong><span>CPU 6 lõi, GPU 7 lõi</span></li>
            <li><strong>256GB–2TB</strong><span>Bốn tùy chọn dung lượng</span></li>
          </ul>
          <div className="apple-launch-actions">
            <Link className="button button-primary" href="/dat-truoc">Đặt trước không cần cọc</Link>
            <a className="apple-launch-source" href={APPLE_NEWSROOM_IPHONE} target="_blank" rel="noreferrer">
              Xem thông cáo Apple <span aria-hidden="true">↗</span>
            </a>
          </div>
          <small>Apple dự kiến giao hàng từ 18/09/2026 tại các thị trường được hỗ trợ, gồm Việt Nam.</small>
        </div>

        <div className="apple-launch-hero-media">
          <Image
            src="/campaigns/apple-iphone-18-pro-official.jpg"
            alt="iPhone 18 Pro màu Burgundy nhìn từ mặt trước và mặt sau theo hình ảnh chính thức của Apple"
            fill
            priority
            sizes="(max-width: 760px) 100vw, 48vw"
            className="apple-launch-product-image"
          />
          <div className="apple-launch-color-card">
            <Image
              src="/campaigns/apple-iphone-18-pro-colors-official.jpg"
              alt="Bốn màu chính thức của iPhone 18 Pro: Black, Silver, Glacier và Burgundy"
              fill
              sizes="(max-width: 760px) 42vw, 210px"
            />
          </div>
        </div>
      </article>

      <div className="apple-launch-grid" aria-label="Các mẫu MacBook mới từ Apple">
        {announcements.map((item) => (
          <article className="apple-launch-card" key={item.title}>
            <div className="apple-launch-card-media">
              <Image src={item.image} alt={item.alt} fill sizes="(max-width: 760px) 100vw, 50vw" />
            </div>
            <div className="apple-launch-card-copy">
              <span>{item.eyebrow}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <ul>{item.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
              <div>
                <Link href="/macbook">Xem MacBook tại cửa hàng</Link>
                <a href={item.source} target="_blank" rel="noreferrer">Nguồn Apple ↗</a>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="apple-launch-note">
        Infinity Store không phải Apple. Tên sản phẩm, thông số và hình ảnh trong khu vực này được trích dẫn từ thông báo chính thức của Apple. Hình ảnh concept minh họa.
      </p>
    </section>
  );
}
