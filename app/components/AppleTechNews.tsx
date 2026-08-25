import Image from "next/image";

const articles = [
  {
    source: "Tinh tế", date: "Đánh giá", category: "iPhone",
    title: "iPhone 17 Pro Max: camera trước 4K thể hiện ra sao ngoài trời?",
    description: "Trải nghiệm thực tế khả năng quay 4K, chống rung và lớp phủ chống phản quang trên màn hình.",
    image: "/products/iphone-17-pro-max.jpg",
    href: "https://tinhte.vn/thread/iphone-17-pro-max-test-nhanh-camera-truoc-quay-video-4k-ngoai-troi-nang.4058810/",
  },
  {
    source: "Tinh tế", date: "Tổng hợp", category: "MacBook",
    title: "MacBook Air M4 có đáng nâng cấp từ phiên bản M1?",
    description: "Tổng hợp đánh giá về hiệu năng, RAM 16GB mặc định, thời lượng pin và trải nghiệm không quạt.",
    image: "/products/apple-macbook-air-13-m4-10cpu-8gpu-16gb-256gb-2025.png",
    href: "https://tinhte.vn/thread/tong-hop-danh-gia-macbook-air-m4-ai-dung-m1-thi-nen-nang-cap.3968476/",
  },
  {
    source: "VnExpress Số hóa", date: "Thị trường", category: "MacBook",
    title: "MacBook Air M4 vẫn giữ sức hút khi thế hệ mới xuất hiện",
    description: "Góc nhìn về sự cân bằng giữa hiệu năng, trải nghiệm và chi phí của MacBook Air M4.",
    image: "/products/apple/macbook-air/apple-hero.png",
    href: "https://vnexpress.net/macbook-air-m4-giu-suc-hut-khi-phien-ban-m5-trinh-lang-5070636.html",
  },
  {
    source: "Tinh tế", date: "So sánh", category: "iPad",
    title: "iPad Pro M5 và M4: khác biệt lớn nằm ở hiệu năng AI",
    description: "So sánh thiết kế, màn hình, RAM, băng thông bộ nhớ và khả năng đa nhiệm trên iPadOS.",
    image: "/products/apple/ipad-pro/apple-hero.jpg",
    href: "https://tinhte.vn/thread/so-sanh-thong-so-ipad-pro-m5-va-ipad-pro-m4-nang-cap-lon-ve-hieu-nang-ai-giu-nguyen-thiet-ke.4065717/",
  },
];

export default function AppleTechNews() {
  return (
    <section className="apple-news section shell" aria-labelledby="apple-news-title">
      <div className="apple-news-heading">
        <div><p className="eyebrow">Góc công nghệ</p><h2 id="apple-news-title">Đọc thêm về sản phẩm Apple</h2></div>
        <p>Đánh giá và góc nhìn từ các diễn đàn, trang công nghệ độc lập.</p>
      </div>
      <div className="apple-news-grid">
        {articles.map((article, index) => (
          <a className={`apple-news-card ${index === 0 ? "is-featured" : ""}`} href={article.href} target="_blank" rel="noreferrer" key={article.href}>
            <div className="apple-news-image"><Image src={article.image} alt="" fill sizes={index === 0 ? "(max-width: 700px) 100vw, 50vw" : "(max-width: 700px) 100vw, 25vw"} unoptimized /></div>
            <div className="apple-news-body">
              <div className="apple-news-meta"><strong>{article.source}</strong><span>{article.category}</span><span>{article.date}</span></div>
              <h3>{article.title}</h3><p>{article.description}</p>
              <span className="apple-news-link">Đọc bài viết gốc <b aria-hidden="true">↗</b></span>
            </div>
          </a>
        ))}
      </div>
      <p className="apple-news-note">Các liên kết mở trang bên ngoài. Nội dung và quan điểm thuộc về đơn vị xuất bản.</p>
    </section>
  );
}
