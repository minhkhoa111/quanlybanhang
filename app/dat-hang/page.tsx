import type { Metadata } from "next";
import { getPublicProducts } from "@/db/products";
import { getBranches } from "@/db/branches";
import ConsultationForm from "../tu-van/ConsultationForm";

export const metadata: Metadata = {
  title: "Đặt hàng",
  description: "Gửi thông tin đặt mua điện thoại cho Huy Apple.",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const [products, branches] = await Promise.all([getPublicProducts(), getBranches(false).catch(() => [])]);
  const initialOrderCode = `HA${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;

  return (
    <main>
      <section className="order-page shell">
        <header className="order-page-header">
          <p className="eyebrow">Đặt hàng nhanh · xác nhận trực tiếp</p>
          <h1>Đặt online hoặc chọn chi nhánh xem máy.</h1>
          <p>
            Nếu đến cửa hàng, bạn chỉ cần chọn chi nhánh và gửi yêu cầu tư vấn, chưa cần thanh toán.
            Nếu đặt online, hãy chọn thanh toán trực tuyến để cửa hàng xử lý giao máy.
          </p>
          <div className="consult-contact">
            <div><span>SMS/ZALO</span><a href="tel:02879797999">02879797999</a></div>
            <div><span>ĐỊA CHỈ</span><p>122/4 Cô Giang<br />P.Cầu Kiệu, TP.HCM</p></div>
          </div>
        </header>
        <ConsultationForm products={products} branches={branches} initialOrderCode={initialOrderCode} />
      </section>
      <section className="consult-process shell">
        <h2>Sau khi đặt hàng</h2>
        <div>
          <article><span>01</span><h3>Chi nhánh nhận yêu cầu</h3><p>Đơn xem máy được chuyển thẳng tới chi nhánh; đơn online vào hệ thống bán hàng.</p></article>
          <article><span>02</span><h3>Xác nhận tồn kho</h3><p>Cửa hàng kiểm tra màu, dung lượng, giá và thời gian giao nhận.</p></article>
          <article><span>03</span><h3>Hoàn tất đơn</h3><p>Khách nhận máy tại cửa hàng hoặc giao hàng theo thông tin đã cung cấp.</p></article>
        </div>
      </section>
    </main>
  );
}
