import type { Metadata } from "next";
import { getPublicProducts } from "@/db/products";
import ConsultationForm from "../tu-van/ConsultationForm";

export const metadata: Metadata = {
  title: "Đặt hàng",
  description: "Gửi thông tin đặt mua điện thoại cho Huy Apple.",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const products = await getPublicProducts();
  const initialOrderCode = `HA${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;

  return (
    <main>
      <section className="order-page shell">
        <header className="order-page-header">
          <p className="eyebrow">Đặt hàng nhanh · xác nhận trực tiếp</p>
          <h1>Đặt máy nhanh, thanh toán dễ dàng.</h1>
          <p>
            Chọn sản phẩm và cách nhận hàng. Huy Apple sẽ xác nhận giá, tồn kho
            và thời gian giao máy qua điện thoại hoặc Zalo.
          </p>
          <div className="consult-contact">
            <div><span>SMS/ZALO</span><a href="tel:02879797999">02879797999</a></div>
            <div><span>ĐỊA CHỈ</span><p>122/4 Cô Giang<br />P.Cầu Kiệu, TP.HCM</p></div>
          </div>
        </header>
        <ConsultationForm products={products} initialOrderCode={initialOrderCode} />
      </section>
      <section className="consult-process shell">
        <h2>Sau khi đặt hàng</h2>
        <div>
          <article><span>01</span><h3>Huy nhận đơn</h3><p>Thông tin được lưu vào trang quản lý và gửi email cho cửa hàng.</p></article>
          <article><span>02</span><h3>Xác nhận tồn kho</h3><p>Cửa hàng kiểm tra màu, dung lượng, giá và thời gian giao nhận.</p></article>
          <article><span>03</span><h3>Hoàn tất đơn</h3><p>Khách nhận máy tại cửa hàng hoặc giao hàng theo thông tin đã cung cấp.</p></article>
        </div>
      </section>
    </main>
  );
}
