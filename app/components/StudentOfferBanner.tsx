import Link from "next/link";

export default function StudentOfferBanner() {
  return (
    <section className="student-offer-band" aria-label="Ưu đãi học sinh sinh viên">
      <div className="shell student-offer-inner">
        <div>
          <span>Ưu đãi giáo dục</span>
          <h2>Giảm đến 3% cho học sinh, sinh viên</h2>
          <p>Áp dụng cho một số dòng iPhone, iPad và MacBook theo chương trình tại thời điểm mua.</p>
        </div>
        <div className="student-offer-actions">
          <Link href="/iphone">Xem iPhone</Link>
          <Link href="/macbook">Xem MacBook</Link>
        </div>
      </div>
    </section>
  );
}
