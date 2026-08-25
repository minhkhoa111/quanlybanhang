"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const categories = [
  ["iPhone", "/iphone"], ["Samsung", "/samsung"], ["Android", "/android"], ["MacBook", "/macbook"],
];

export default function HomeHero() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const frame = requestAnimationFrame(() => setReady(true)); return () => cancelAnimationFrame(frame); }, []);

  return (
    <section className={`phone-hero ${ready ? "is-ready" : ""}`} aria-labelledby="phone-hero-title">
      <div className="phone-hero-glow glow-one" /><div className="phone-hero-glow glow-two" />
      <div className="phone-hero-shell">
        <div className="phone-hero-copy">
          <div className="phone-hero-kicker"><span /> Điện thoại chính hãng · Bảo hành rõ ràng</div>
          <h1 id="phone-hero-title">Chọn điện thoại<span>đúng nhu cầu.</span></h1>
          <p>iPhone, Samsung và Android mới nhất với mức giá minh bạch. Tư vấn thật, hỗ trợ trả góp và giao hàng nhanh tại TP.HCM.</p>
          <div className="phone-hero-actions">
            <Link href="/iphone" className="hero-buy">Mua điện thoại <span>→</span></Link>
            <Link href="/tu-van" className="hero-advice">Tư vấn chọn máy</Link>
          </div>
          <nav className="phone-hero-categories" aria-label="Danh mục nổi bật">
            {categories.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
          </nav>
          <div className="phone-hero-benefits">
            <div><strong>01</strong><span>Máy chính hãng<br />Nguồn gốc rõ ràng</span></div>
            <div><strong>02</strong><span>Hỗ trợ trả góp<br />Linh hoạt</span></div>
            <div><strong>03</strong><span>Giao nhanh<br />Tại TP.HCM</span></div>
          </div>
        </div>

        <div className="phone-hero-visual" aria-label="Điện thoại nổi bật">
          <div className="phone-hero-orbit orbit-one" /><div className="phone-hero-orbit orbit-two" />
          <div className="phone-device device-back"><Image src="/products/dien-thoai-samsung-galaxy-s26-ultra.jpg" alt="Samsung Galaxy S26 Ultra" fill sizes="(max-width: 720px) 45vw, 260px" priority unoptimized /></div>
          <div className="phone-device device-main"><Image src="/products/iphone-17-pro-max.jpg" alt="iPhone 17 Pro Max" fill sizes="(max-width: 720px) 55vw, 330px" priority unoptimized /></div>
          <Link href="/san-pham/iphone-17-pro-max" className="hero-product-card"><span>Sản phẩm nổi bật</span><strong>iPhone 17 Pro Max</strong><small>Xem chi tiết và chọn cấu hình →</small></Link>
          <div className="hero-stock"><i /> Có sẵn tại cửa hàng</div>
        </div>
      </div>

      <style jsx global>{`
        .phone-hero{--hero-red:#ee3f2f;position:relative;isolation:isolate;min-height:720px;overflow:hidden;background:linear-gradient(135deg,#f8f7f3 0%,#f0ede6 52%,#dedbd4 100%);color:#151515}.phone-hero-glow{position:absolute;z-index:-1;border-radius:50%;opacity:.75}.glow-one{right:-8%;top:-35%;width:680px;height:680px;background:radial-gradient(circle,#ff8c77 0%,transparent 68%)}.glow-two{left:35%;bottom:-45%;width:520px;height:520px;background:radial-gradient(circle,#b9d9ff 0%,transparent 70%)}
        .phone-hero-shell{width:min(1240px,calc(100% - 40px));min-height:720px;margin:auto;display:grid;grid-template-columns:1.02fr .98fr;align-items:center;gap:42px;padding:62px 0 70px}.phone-hero-copy{z-index:4;font-family:var(--font-site),"Nunito Sans",ui-rounded,"SF Pro Rounded",sans-serif;opacity:0;transform:translateY(20px);transition:.7s ease}.phone-hero.is-ready .phone-hero-copy{opacity:1;transform:none}.phone-hero-kicker{display:flex;align-items:center;gap:10px;margin-bottom:22px;color:#6d6962;font-size:12px;font-weight:750;letter-spacing:.08em!important;text-transform:uppercase}.phone-hero-kicker span{width:28px;height:2px;background:var(--hero-red)}.phone-hero h1{max-width:680px;margin:0;font-family:var(--font-site),"Nunito Sans",ui-rounded,"SF Pro Rounded",sans-serif;font-size:clamp(58px,6.4vw,90px);line-height:.94;letter-spacing:-.045em!important;font-weight:750}.phone-hero h1 span{display:block;color:var(--hero-red)}.phone-hero-copy>p{max-width:580px;margin:28px 0;color:#625f59;font-size:18px;line-height:1.7;font-weight:500}
        .phone-hero-actions{display:flex;gap:12px;flex-wrap:wrap}.phone-hero-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:52px;padding:0 22px;border-radius:999px;font-size:14px;font-weight:750;transition:.2s}.phone-hero-actions a:hover{transform:translateY(-2px)}.hero-buy{gap:22px;background:#171717;color:#fff;box-shadow:0 10px 25px #0002}.hero-buy span{color:#ff806c;font-size:20px}.hero-advice{border:1px solid #bdb9b1;background:#fff8}.phone-hero-categories{display:flex;gap:8px;flex-wrap:wrap;margin-top:24px}.phone-hero-categories a{padding:8px 12px;border:1px solid #1515151f;border-radius:999px;background:#fff8;color:#5a5751;font-size:12px;font-weight:700}.phone-hero-categories a:hover{border-color:var(--hero-red);color:var(--hero-red)}.phone-hero-benefits{display:grid;grid-template-columns:repeat(3,1fr);max-width:570px;margin-top:38px;padding-top:22px;border-top:1px solid #15151524}.phone-hero-benefits div{display:flex;gap:10px}.phone-hero-benefits strong{color:var(--hero-red);font-size:11px}.phone-hero-benefits span{color:#5e5b55;font-size:11px;line-height:1.5;font-weight:650}
        .phone-hero-visual{position:relative;height:590px;opacity:0;transform:translateX(35px);transition:.9s .12s cubic-bezier(.2,.8,.2,1)}.phone-hero.is-ready .phone-hero-visual{opacity:1;transform:none}.phone-hero-visual:before{content:"";position:absolute;inset:55px 15px 45px 50px;border-radius:48% 52% 45% 55%;background:linear-gradient(145deg,#171717,#353535);box-shadow:0 45px 80px #0003}.phone-hero-orbit{position:absolute;z-index:1;border:1px solid #ffffff26;border-radius:50%}.orbit-one{width:460px;height:460px;right:25px;top:65px}.orbit-two{width:330px;height:330px;right:90px;top:130px}.phone-device{position:absolute;z-index:2;overflow:hidden;border-radius:38px;background:#f6f6f4;box-shadow:0 28px 50px #00000047}.phone-device img{object-fit:contain;padding:16px}.device-main{width:310px;height:440px;left:100px;top:55px;transform:rotate(-7deg)}.device-back{width:240px;height:350px;right:15px;top:145px;transform:rotate(9deg);opacity:.92}.hero-product-card{position:absolute;z-index:4;left:18px;bottom:16px;width:260px;padding:18px 20px;border:1px solid #ffffffb3;border-radius:20px;background:#ffffffe6;box-shadow:0 18px 40px #0002;backdrop-filter:blur(16px)}.hero-product-card span{display:block;margin-bottom:6px;color:var(--hero-red);font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.12em}.hero-product-card strong{display:block;font-size:18px}.hero-product-card small{display:block;margin-top:7px;color:#6b6862;font-size:11px}.hero-stock{position:absolute;z-index:4;right:18px;top:65px;display:flex;align-items:center;gap:8px;padding:10px 13px;border-radius:999px;background:#ffffffe6;box-shadow:0 12px 30px #0002;font-size:11px;font-weight:850}.hero-stock i{width:8px;height:8px;border-radius:50%;background:#28a745;box-shadow:0 0 0 4px #28a74526}
        @media(max-width:980px){.phone-hero-shell{grid-template-columns:1fr;gap:10px;padding-top:54px}.phone-hero-copy{text-align:center}.phone-hero-kicker,.phone-hero-actions,.phone-hero-categories{justify-content:center}.phone-hero h1,.phone-hero-copy>p,.phone-hero-benefits{margin-left:auto;margin-right:auto}.phone-hero-visual{width:min(620px,100%);margin:auto}}
        @media(max-width:650px){.phone-hero{min-height:auto}.phone-hero-shell{width:calc(100% - 24px);min-height:auto;padding:38px 0 45px}.phone-hero-kicker{font-size:9px}.phone-hero h1{font-size:49px}.phone-hero-copy>p{margin:20px auto;font-size:15px}.phone-hero-actions a{width:100%}.phone-hero-benefits{gap:8px;margin-top:28px}.phone-hero-benefits div{display:grid;gap:3px}.phone-hero-visual{height:440px;margin-top:10px}.phone-hero-visual:before{inset:35px 0 40px;border-radius:36px}.device-main{left:8%;top:45px;width:55%;height:330px}.device-back{right:3%;top:105px;width:43%;height:270px}.orbit-one{width:310px;height:310px;right:8px;top:55px}.orbit-two{width:220px;height:220px;right:52px;top:100px}.hero-product-card{left:8px;bottom:4px;width:230px;padding:14px 16px}.hero-stock{right:8px;top:35px;font-size:9px}.phone-hero-categories{flex-wrap:nowrap;overflow-x:auto;justify-content:flex-start}.phone-hero-categories a{white-space:nowrap}.glow-one{width:420px;height:420px}}
        @media(prefers-reduced-motion:reduce){.phone-hero-copy,.phone-hero-visual{opacity:1;transform:none;transition:none}}
      `}</style>
    </section>
  );
}
