import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("Apple MacBook Pro showcase assets exist and are accessible", async () => {
  const images = [
    "hero-macbook-pro.jpg",
    "chip-m5-family.jpg",
    "battery-highlight.jpg",
    "ai-highlight.jpg",
    "product-viewer-hero.jpg",
    "product-viewer-sizes.jpg",
  ];

  for (const img of images) {
    await access(new URL(`public/apple-macbook-pro/${img}`, root));
  }
});

test("Apple iPhone 18 Pro showcase assets exist and are accessible", async () => {
  const images = [
    "hero-iphone-18-pro.jpg",
    "camera-system.jpg",
    "contrast-18pro.jpg",
  ];

  for (const img of images) {
    await access(new URL(`public/apple-iphone-18-pro/${img}`, root));
  }
});

test("MacBookProShowcase component is properly structured with Apple design sections", async () => {
  const source = await readFile(new URL("app/dat-truoc/MacBookProShowcase.tsx", root), "utf8");
  assert.match(source, /apple-mbp-localnav/, "Contains sticky LocalNav bar");
  assert.match(source, /Ba chip\. Tiềm năng bất tận\./, "Contains 3 chips headline");
  assert.match(source, /Lên đến 24 giờ/, "Contains 24h battery highlight");
  assert.match(source, /Apple Intelligence/, "Contains Apple Intelligence highlight");
  assert.match(source, /Liquid Retina XDR/, "Contains Liquid Retina XDR screen");
  assert.match(source, /Space Black/, "Contains Space Black color option");
  assert.match(source, /Silver/, "Contains Silver color option");
  assert.match(source, /apple-mbp-configurator-section/, "Contains pre-order configurator");
  assert.match(source, /\/api\/preorders/, "Posts to preorder API");
});

test("IPhone18ProShowcase component is properly structured with Apple official design sections", async () => {
  const source = await readFile(new URL("app/dat-truoc/IPhone18ProShowcase.tsx", root), "utf8");
  assert.match(source, /apple-iphone-localnav/, "Contains sticky LocalNav bar");
  assert.match(source, /Một nâng cấp quan trọng/, "Contains official Apple headline");
  assert.match(source, /Khẩu Độ Biến Thiên Cơ Học 4 Bước/, "Contains 4-stop aperture headline");
  assert.match(source, /ƒ\/1\.48/, "Contains ƒ/1.48 stop");
  assert.match(source, /ƒ\/1\.8/, "Contains ƒ/1.8 stop");
  assert.match(source, /ƒ\/2\.8/, "Contains ƒ/2.8 stop");
  assert.match(source, /ƒ\/4\.0/, "Contains ƒ/4.0 stop");
  assert.match(source, /Chip Apple A20 Pro/, "Contains A20 Pro chip highlight");
  assert.match(source, /Titan Đỏ Rượu/, "Contains Burgundy color finish");
  assert.match(source, /Titan Băng/, "Contains Glacier color finish");
  assert.match(source, /Super Retina XDR/, "Contains Super Retina XDR OLED");
  assert.match(source, /Tetraprism Zoom 8x/, "Contains 8x zoom highlight");
  assert.match(source, /Đặt Trước iPhone 18 Pro\. Cọc 0đ/, "Contains zero-deposit configurator");
  assert.match(source, /\/api\/preorders/, "Posts to preorder API");
});

test("Preorder page (/dat-truoc) integrates MacBook and iPhone showcases directly", async () => {
  const pageSource = await readFile(new URL("app/dat-truoc/page.tsx", root), "utf8");
  assert.match(pageSource, /IPhone18ProShowcase/, "Imports IPhone18ProShowcase");
  assert.match(pageSource, /MacBookProShowcase/, "Imports MacBookProShowcase");
  assert.match(pageSource, /macbook-pro-apple\.css/, "Imports Apple stylesheet");
});

test("iPhone catalog page (/iphone) has prominent Apple iPhone 18 Pro ad banner", async () => {
  const iphoneSource = await readFile(new URL("app/iphone/page.tsx", root), "utf8");
  assert.match(iphoneSource, /IPhone18ProAdBanner/, "Imports IPhone18ProAdBanner");
});

test("MacBook catalog page (/macbook) has prominent banner linking to /dat-truoc", async () => {
  const macbookSource = await readFile(new URL("app/macbook/page.tsx", root), "utf8");
  assert.match(macbookSource, /href="\/dat-truoc"/, "Links to /dat-truoc");
  assert.match(macbookSource, /Khám phá & Đặt trước 0đ/, "Contains CTA text");
});

test("Homepage (app/page.tsx) renders Apple iPhone 18 Pro billboard advertisement", async () => {
  const pageSource = await readFile(new URL("app/page.tsx", root), "utf8");
  assert.match(pageSource, /IPhone18ProAdBanner/, "Renders IPhone18ProAdBanner on homepage");
});

test("StorefrontHero has iPhone 18 Pro ads with Xem thêm về iPhone 18 Pro and MacBook Pro ads", async () => {
  const heroSource = await readFile(new URL("app/components/StorefrontHero.tsx", root), "utf8");
  assert.match(heroSource, /tabTitle: "IPHONE 18 PRO"/, "Contains iPhone 18 Pro tab");
  assert.match(heroSource, /cta: "Xem thêm về iPhone 18 Pro"/, "Contains CTA Xem thêm về iPhone 18 Pro");
  assert.match(heroSource, /tabTitle: "MACBOOK PRO MỚI"/, "Contains MacBook Pro tab");
  assert.match(heroSource, /cta: "Xem thêm về MacBook Pro"/, "Contains CTA Xem thêm về MacBook Pro");
  assert.match(heroSource, /href:\s*"\/dat-truoc\?device=iphone"/, "Links iPhone to /dat-truoc?device=iphone");
  assert.match(heroSource, /href:\s*"\/dat-truoc\?device=macbook"/, "Links MacBook to /dat-truoc?device=macbook");
});
