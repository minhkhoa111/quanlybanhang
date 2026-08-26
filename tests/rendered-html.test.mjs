import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("keeps the storefront wired to Huy Apple order content", async () => {
  const [page, layout, orderPage, products, categoryMenu, homeShowcases, studentOffer] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("app/dat-hang/page.tsx", root), "utf8"),
    readFile(new URL("app/products.ts", root), "utf8"),
    readFile(new URL("app/components/VisualCategoryMenu.tsx", root), "utf8"),
    readFile(new URL("app/components/HomeProductShowcases.tsx", root), "utf8"),
    readFile(new URL("app/components/StudentOfferBanner.tsx", root), "utf8"),
  ]);

  assert.match(layout, /Huy Apple \| Điện thoại & đặt hàng/);
  assert.match(layout, /02879797999/);
  assert.match(page, /getPublicProducts/);
  assert.doesNotMatch(page, /Đặt đúng máy|để Huy giữ máy/);
  assert.match(page, /StudentOfferBanner/);
  assert.match(studentOffer, /Giảm đến 3% cho học sinh, sinh viên/);
  assert.match(orderPage, /Thông tin đặt hàng|Đặt hàng nhanh/);
  assert.match(products, /iphone-17-pro/);
  assert.match(products, /galaxy-s25-ultra/);
  assert.match(products, /oppo-find-x8-pro/);
  assert.match(page, /VisualCategoryMenu/);
  for (const label of ["iPhone", "iPad", "MacBook", "Laptop", "Samsung", "Android"]) {
    assert.match(categoryMenu, new RegExp(label));
  }
  for (const removedLabel of ["iMac - Mac Mini", "Apple Watch", "Âm thanh", "Phụ kiện"]) {
    assert.doesNotMatch(categoryMenu, new RegExp(removedLabel));
  }
  assert.match(page, /HomeProductShowcases/);
  assert.match(homeShowcases, /title="Mobile"/);
  assert.match(homeShowcases, /title="MacBook mới"/);
  assert.match(homeShowcases, /role="tablist"/);
  assert.match(homeShowcases, /scrollBy/);
  assert.match(homeShowcases, /object-fit: contain|home-showcase-media/);
  assert.match(homeShowcases, /macbookFamily/);
  assert.match(homeShowcases, /macbook\[\\s-\]\+pro/);
  assert.match(homeShowcases, /macbook\[\\s-\]\+air/);
  assert.doesNotMatch(homeShowcases, /\.\.\.macbooks/);
});

test("unifies /quan-ly with the modern product and order administration", async () => {
  const [adminEntry, productsPage, productForm, bulkProducts, ordersPage, adminLoginPage, adminLoginActions, adminActions, adminAuth, productStore, orderStore, staffPage, staffStore] = await Promise.all([
    readFile(new URL("app/quan-ly/page.tsx", root), "utf8"),
    readFile(new URL("app/admin/products/page.tsx", root), "utf8"),
    readFile(new URL("app/admin/AdminProductForm.tsx", root), "utf8"),
    readFile(new URL("app/admin/AdminBulkProducts.tsx", root), "utf8"),
    readFile(new URL("app/admin/orders/page.tsx", root), "utf8"),
    readFile(new URL("app/quan-ly/dang-nhap/page.tsx", root), "utf8"),
    readFile(new URL("app/quan-ly/dang-nhap/actions.ts", root), "utf8"),
    readFile(new URL("app/admin/actions.ts", root), "utf8"),
    readFile(new URL("app/admin-auth.ts", root), "utf8"),
    readFile(new URL("db/products.ts", root), "utf8"),
    readFile(new URL("db/orders.ts", root), "utf8"),
    readFile(new URL("app/admin/staff/page.tsx", root), "utf8"),
    readFile(new URL("db/admin-users.ts", root), "utf8"),
  ]);

  assert.match(adminEntry, /requireAdminPage/);
  assert.match(adminEntry, /user\.role === "manager" \? "\/manger" : "\/staff"/);
  assert.match(productsPage, /Quản lý sản phẩm/);
  assert.match(productsPage, /Thêm sản phẩm/);
  assert.match(productsPage, /Tất cả danh mục/);
  assert.match(productsPage, /Giá khuyến mãi/);
  assert.match(productForm, /Thư viện hình ảnh/);
  assert.match(productForm, /Cấu hình theo danh mục/);
  assert.match(productForm, /PRODUCT_FIELD_CONFIG/);
  assert.match(productForm, /variantImage_/);
  assert.doesNotMatch(productForm, /name="imageUrl"/);
  assert.match(bulkProducts, /selectedIds/);
  assert.doesNotMatch(bulkProducts, /<form[\s\S]*\{children\}[\s\S]*<\/form>/);
  assert.match(ordersPage, /Quản lý đơn hàng/);
  assert.match(ordersPage, /getManagedOrders/);
  assert.match(adminLoginPage, /Đăng nhập quản lý/);
  assert.match(adminLoginActions, /createAdminSession/);
  assert.match(adminAuth, /ADMIN_PASSWORD/);
  assert.doesNotMatch(adminEntry, /ChatGPT|requireChatGPTUser|chatGPTSignOutPath/);
  assert.match(adminActions, /saveAdminProductAction/);
  assert.match(adminActions, /toggleAdminProductAction/);
  assert.match(adminActions, /uploadVariantImages/);
  assert.match(productStore, /deleteManagedProduct/);
  assert.match(orderStore, /createOrder/);
  assert.match(staffPage, /requireOwnerPage/);
  assert.match(staffPage, /Cấp quyền cho nhân viên/);
  assert.match(staffStore, /admin_user_sessions/);
  assert.match(staffStore, /PBKDF2/);
});

test("supports customer accounts, multi-product carts and managed vouchers", async () => {
  const [layout, cart, checkout, account, orderRoute, voucherPage, voucherStore] = await Promise.all([
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("app/cart.tsx", root), "utf8"),
    readFile(new URL("app/gio-hang/CartCheckout.tsx", root), "utf8"),
    readFile(new URL("app/tai-khoan/AccountPanel.tsx", root), "utf8"),
    readFile(new URL("app/api/orders/route.ts", root), "utf8"),
    readFile(new URL("app/admin/vouchers/page.tsx", root), "utf8"),
    readFile(new URL("db/vouchers.ts", root), "utf8"),
  ]);

  assert.match(layout, /CartProvider/);
  assert.match(layout, /CartHeaderLink/);
  assert.match(cart, /localStorage/);
  assert.match(checkout, /items: items\.map/);
  assert.match(checkout, /Mã voucher/);
  assert.match(account, /Đăng ký/);
  assert.match(orderRoute, /normalizeItems/);
  assert.match(orderRoute, /validateVoucher/);
  assert.match(voucherPage, /Quản lý voucher/);
  assert.match(voucherStore, /usage_limit/);
});

test("separates store consultation from online payment and removes COD", async () => {
  const [quickOrder, cart, orderApi, orders, momoQr, orderPage, cartPage, adminDetail, adminUtils] = await Promise.all([
    readFile(new URL("app/tu-van/ConsultationForm.tsx", root), "utf8"),
    readFile(new URL("app/gio-hang/CartCheckout.tsx", root), "utf8"),
    readFile(new URL("app/api/orders/route.ts", root), "utf8"),
    readFile(new URL("db/orders.ts", root), "utf8"),
    readFile(new URL("app/api/momo-qr/route.ts", root), "utf8"),
    readFile(new URL("app/dat-hang/page.tsx", root), "utf8"),
    readFile(new URL("app/gio-hang/page.tsx", root), "utf8"),
    readFile(new URL("app/admin/orders/[id]/page.tsx", root), "utf8"),
    readFile(new URL("app/admin/utils.ts", root), "utf8"),
  ]);
  for (const storefront of [quickOrder, cart]) {
    assert.match(storefront, /Đến cửa hàng xem máy/);
    assert.match(storefront, /Đặt hàng online/);
    assert.match(storefront, /Chi nhánh/);
    assert.match(storefront, /api\/momo-qr/);
    assert.doesNotMatch(storefront, /Thanh toán khi nhận máy|payment-method-cod|>COD</);
  }
  assert.match(orderPage, /getBranches\(false\)/);
  assert.match(cartPage, /getBranches\(false\)/);
  assert.match(orderApi, /ONLINE_PAYMENTS/);
  assert.match(orderApi, /COD không còn được hỗ trợ/);
  assert.match(orderApi, /Vui lòng chọn chi nhánh muốn đến xem máy/);
  assert.match(orderApi, /branchId: selectedBranch\?\.id/);
  assert.match(orders, /initialPaymentStatus = isStoreConsultation \? "not_required"/);
  assert.match(orders, /input\.branchId/);
  assert.match(momoQr, /getOrderPaymentByCode/);
  assert.match(momoQr, /order\.payment_method\.startsWith\("MoMo"\)/);
  assert.match(momoQr, /QRCode\.toString/);
  assert.match(adminDetail, /Yêu cầu xem máy tại/);
  assert.match(adminUtils, /not_required: "Không cần thanh toán"/);
});

test("supports Google sign-in, member avatars and unique usernames", async () => {
  const [account, googleStart, googleCallback, register, login, avatar, customers, motion, theme] = await Promise.all([
    readFile(new URL("app/tai-khoan/AccountPanel.tsx", root), "utf8"),
    readFile(new URL("app/api/account/google/start/route.ts", root), "utf8"),
    readFile(new URL("app/api/account/google/callback/route.ts", root), "utf8"),
    readFile(new URL("app/api/account/register/route.ts", root), "utf8"),
    readFile(new URL("app/api/account/login/route.ts", root), "utf8"),
    readFile(new URL("app/api/account/avatar/route.ts", root), "utf8"),
    readFile(new URL("db/customers.ts", root), "utf8"),
    readFile(new URL("app/components/MotionSystem.tsx", root), "utf8"),
    readFile(new URL("app/modern-theme.css", root), "utf8"),
  ]);

  assert.match(account, /Tiếp tục với Google/);
  assert.match(account, /Tên đăng nhập hoặc email/);
  assert.match(account, /name="username"/);
  assert.match(account, /HOÀN THIỆN HỒ SƠ/);
  assert.match(account, /Đổi ảnh/);
  assert.match(account, /Gỡ ảnh/);
  assert.match(account, /Thông tin member/);
  assert.match(googleStart, /accounts\.google\.com\/o\/oauth2\/v2\/auth/);
  assert.match(googleStart, /openid email profile/);
  assert.match(googleCallback, /oauth2\.googleapis\.com\/token/);
  assert.match(googleCallback, /openidconnect\.googleapis\.com\/v1\/userinfo/);
  assert.match(register, /createCustomerSession/);
  assert.doesNotMatch(register, /startOtpVerification/);
  assert.doesNotMatch(login, /startOtpVerification/);
  assert.match(avatar, /PRODUCT_IMAGES/);
  assert.match(avatar, /3 \* 1024 \* 1024/);
  assert.match(avatar, /updateCustomerAvatar/);
  assert.match(customers, /customers_username_idx/);
  assert.match(customers, /avatar_url/);
  assert.match(customers, /LOWER\(username\)/);
  assert.match(customers, /google_sub/);
  assert.match(motion, /main > section:not\(\.account-panel\)/);
  assert.match(theme, /\.account-page \.account-panel\[data-motion-reveal\]/);
});

test("ships every seeded product image referenced by the catalog", async () => {
  const products = await readFile(new URL("app/products.ts", root), "utf8");
  const imagePaths = [...products.matchAll(/image:"([^"]+)"/g)].map(
    ([, imagePath]) => imagePath,
  );

  assert.ok(imagePaths.length >= 10);
  await Promise.all(
    imagePaths.map((imagePath) => access(new URL(`public${imagePath}`, root))),
  );
});

test("keeps every local catalog image present and decodable by file signature", async () => {
  const sourceFiles = [
    "app/products.ts",
    "app/expanded-products.ts",
    "app/apple-products.ts",
    "app/apple-desktop-products.ts",
    "app/current-catalog.ts",
    "app/category-merchandising.ts",
    "app/catalog-enrichment.json",
    "db/products.ts",
  ];
  const sources = await Promise.all(sourceFiles.map((file) => readFile(new URL(file, root), "utf8")));
  const imagePaths = new Set(
    sources.flatMap((source) => [...source.matchAll(/["'](\/products\/[^"'\n]+\.(?:png|jpe?g|webp|gif|avif))["']/gi)].map(([, imagePath]) => imagePath)),
  );

  assert.ok(imagePaths.size >= 300, `Expected a complete image catalog, found ${imagePaths.size} paths.`);
  await Promise.all([...imagePaths].map(async (imagePath) => {
    const bytes = await readFile(new URL(`public${imagePath}`, root));
    assert.ok(hasSupportedImageSignature(bytes), `Invalid product image: ${imagePath}`);
  }));
});

test("publishes Mac mini, Mac Studio and iMac as complete managed categories", async () => {
  const [products, desktopProducts, navigation, categoryMenu, adminFields, adminActions, database] = await Promise.all([
    readFile(new URL("app/products.ts", root), "utf8"),
    readFile(new URL("app/apple-desktop-products.ts", root), "utf8"),
    readFile(new URL("app/components/PrimaryNav.tsx", root), "utf8"),
    readFile(new URL("app/components/VisualCategoryMenu.tsx", root), "utf8"),
    readFile(new URL("app/admin/product-fields.ts", root), "utf8"),
    readFile(new URL("app/admin/actions.ts", root), "utf8"),
    readFile(new URL("db/products.ts", root), "utf8"),
  ]);

  assert.match(products, /appleDesktopProducts/);
  for (const model of ["Mac mini M4", "Mac mini M4 Pro", "Mac Studio M4 Max", "Mac Studio M3 Ultra", "iMac 24 inch M4", "iMac 24 inch M3"]) {
    assert.match(desktopProducts, new RegExp(model));
  }
  for (const category of ["mac-mini-studio", "imac"]) {
    assert.match(navigation, new RegExp(category));
    assert.match(categoryMenu, new RegExp(category));
    assert.match(adminFields, new RegExp(`"${category}"`));
    assert.match(adminActions, new RegExp(`"${category}"`));
    assert.match(database, new RegExp(`'${category}'`));
    await access(new URL(`app/${category}/page.tsx`, root));
  }
  for (const price of ["14.490.000đ", "34.690.000đ", "57.890.000đ", "115.890.000đ", "34.890.000đ", "44.890.000đ"]) {
    assert.match(desktopProducts, new RegExp(price));
  }
});

test("uses manufacturer campaigns and complete current iPhone colors", async () => {
  const [ui, campaign, merchandising, catalog, iphonePage, productBrowser] = await Promise.all([
    readFile(new URL("app/ui.tsx", root), "utf8"),
    readFile(new URL("app/components/CatalogCampaign.tsx", root), "utf8"),
    readFile(new URL("app/category-merchandising.ts", root), "utf8"),
    readFile(new URL("app/current-catalog.ts", root), "utf8"),
    readFile(new URL("app/iphone/page.tsx", root), "utf8"),
    readFile(new URL("app/components/CatalogProductBrowser.tsx", root), "utf8"),
  ]);

  assert.match(ui, /CatalogCampaign/);
  assert.match(ui, /CatalogProductBrowser/);
  assert.match(productBrowser, /catalog-product-grid/);
  assert.match(productBrowser, /price-asc/);
  assert.match(productBrowser, /price-desc/);
  assert.match(productBrowser, /iPhone 13, 12 & SE/);
  assert.match(productBrowser, /MacBook Air/);
  assert.match(productBrowser, /MacBook Pro/);
  assert.match(campaign, /catalog-campaign-image/);
  for (const brand of ["Apple | iPhone 17 Pro", "Apple | MacBook", "Samsung Galaxy", "Android flagship"]) {
    assert.ok(merchandising.includes(brand));
  }
  for (const model of ["iphone-17-pro-max", "iphone-17-pro", "iphone-17", "iphone-air", "iphone-17e"]) {
    assert.match(catalog, new RegExp(`\"${model}\"`));
  }
  for (const color of ["Đen", "Trắng", "Xanh Lam Khói", "Xanh Lá Xô Thơm", "Cam Vũ Trụ", "Xanh Đậm", "Bạc", "Đen Không Gian", "Trắng Mây", "Vàng Nhạt", "Hồng Phớt"]) {
    assert.match(catalog, new RegExp(color));
  }
  assert.doesNotMatch(ui, /iPhone cho từng kiểu người dùng/);
  assert.doesNotMatch(iphonePage, /iPhone cho từng kiểu người dùng/);
});

test("keeps consolidated catalog links resolvable", async () => {
  const databaseSource = await readFile(new URL("db/products.ts", root), "utf8");
  assert.match(databaseSource, /slug LIKE \?/);
  assert.match(databaseSource, /publicFamilyKey\(item\.slug\) === slug/);
});

function hasSupportedImageSignature(bytes) {
  if (bytes.length < 12) return false;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return true;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
  const header = bytes.subarray(0, 12).toString("latin1");
  if (header.startsWith("GIF87a") || header.startsWith("GIF89a")) return true;
  if (header.startsWith("RIFF") && header.slice(8, 12) === "WEBP") return true;
  return header.slice(4, 8) === "ftyp" && /^(avif|avis|mif1|msf1)$/.test(header.slice(8, 12));
}

test("provides category-specific product fields and flexible RAM or SSD presets", async () => {
  const [form, fields, actions] = await Promise.all([
    readFile(new URL("app/admin/AdminProductForm.tsx", root), "utf8"),
    readFile(new URL("app/admin/product-fields.ts", root), "utf8"),
    readFile(new URL("app/admin/actions.ts", root), "utf8"),
  ]);

  for (const category of ["iphone", "samsung", "android", "ipad", "macbook", "laptop"]) {
    assert.match(fields, new RegExp(`${category}:`));
  }
  for (const option of ["8GB", "16GB", "32GB", "256GB", "512GB", "1TB", "2TB"]) {
    assert.match(fields, new RegExp(option));
  }
  assert.match(form, /PRODUCT_FIELD_CONFIG/);
  assert.match(form, /datalist/);
  assert.match(form, /inputMode="numeric"/);
  assert.match(form, /Thông số bổ sung/);
  assert.match(actions, /normalizeRam/);
  assert.match(actions, /normalizeStorage/);
  assert.match(actions, /detectImageType/);
  assert.doesNotMatch(actions, /allImages\[0\] \|\| previous\?\.image/);
});

test("offers a timed Techcombank QR with amount and order code", async () => {
  const [orderForm, qrRoute, webhookRoute, statusRoute, orderStore, installment] = await Promise.all([
    readFile(new URL("app/tu-van/ConsultationForm.tsx", root), "utf8"),
    readFile(new URL("app/api/payment-qr/route.ts", root), "utf8"),
    readFile(new URL("app/api/payments/casso/route.ts", root), "utf8"),
    readFile(new URL("app/api/orders/status/route.ts", root), "utf8"),
    readFile(new URL("db/orders.ts", root), "utf8"),
    readFile(new URL("app/installment.ts", root), "utf8"),
  ]);

  assert.match(orderForm, /MoMo - 0869275642/);
  assert.match(orderForm, /Apple Pay - xác nhận với cửa hàng/);
  assert.match(orderForm, /6820102010/);
  assert.match(orderForm, /Nguyễn Minh Khoa/);
  assert.match(orderForm, /api\/payment-qr/);
  assert.match(orderForm, /10 \* 60 \* 1000/);
  assert.match(orderForm, /formatCountdown/);
  assert.match(orderForm, /Đặt hàng & nhận mã QR/);
  assert.match(orderForm, /QR thanh toán sẽ xuất hiện sau khi đơn hàng được tạo/);
  assert.match(orderForm, /post-order-bank-payment/);
  assert.doesNotMatch(orderForm, /product=\$\{encodeURIComponent\(selectedSlug\)\}/);
  assert.match(orderForm, /role="tablist"/);
  assert.match(orderForm, /Sản phẩm & nhận hàng/);
  assert.match(orderForm, /Phương thức thanh toán/);
  assert.match(orderForm, /Trả góp qua công ty tài chính/);
  assert.match(orderForm, /Hồ sơ trả góp/);
  assert.match(orderForm, /name="financeCompany"/);
  assert.match(orderForm, /name="citizenId"/);
  assert.match(installment, /\/finance\/fe-credit-official\.svg/);
  assert.match(installment, /\/finance\/shinhan-finance-official\.png/);
  assert.match(installment, /MIN_INSTALLMENT_TOTAL = 8_000_000/);
  assert.match(installment, /DOWN_PAYMENT_OPTIONS = \[10, 20, 30, 40, 50\]/);
  assert.match(installment, /INSTALLMENT_TERMS = \[6, 9, 12, 15\]/);
  assert.match(installment, /monthlyRate: 1\.86/);
  assert.match(orderForm, /calculateInstallmentPlan/);
  assert.match(orderForm, /openPaymentTab/);
  assert.match(orderForm, /Đang kiểm tra thanh toán/);
  assert.match(orderForm, /Đã thanh toán/);
  assert.match(orderForm, /api\/orders\/status/);
  assert.match(orderForm, /name="payment"/);
  assert.match(orderForm, /navigator\.clipboard\.writeText/);
  assert.match(qrRoute, /amount: String\(amount\)/);
  assert.match(qrRoute, /purpose: orderCode/);
  assert.match(qrRoute, /Mã QR đã hết hạn/);
  assert.match(qrRoute, /Cache-Control/);
  assert.match(webhookRoute, /secure-token/);
  assert.match(webhookRoute, /recordBankPayment/);
  assert.match(statusRoute, /getOrderStatusByCode/);
  assert.match(orderStore, /order_code/);
  assert.match(orderStore, /bank_payment_events/);
  assert.match(orderStore, /amount >= \?/);
  assert.match(orderStore, /Không áp dụng - yêu cầu tư vấn/);
  assert.doesNotMatch(orderStore, /Thanh toán khi nhận máy/);
  assert.match(orderStore, /finance_company/);
  assert.match(orderStore, /citizen_id_issue_place/);
  assert.match(orderStore, /down_payment_percent/);
  assert.match(orderStore, /monthly_payment/);
});

test("groups the Apple MacBook and iPad catalog by configurable model", async () => {
  const [catalog, detail, orderForm, managerFields, managerActions, pricing] = await Promise.all([
    readFile(new URL("app/apple-products.ts", root), "utf8"),
    readFile(new URL("app/components/ProductDetailExperience.tsx", root), "utf8"),
    readFile(new URL("app/tu-van/ConsultationForm.tsx", root), "utf8"),
    readFile(new URL("app/quan-ly/CategoryBrandSync.tsx", root), "utf8"),
    readFile(new URL("app/quan-ly/actions.ts", root), "utf8"),
    readFile(new URL("app/order-pricing.ts", root), "utf8"),
  ]);

  for (const slug of [
    "macbook-neo-a18-pro", "macbook-air-13-m5", "macbook-air-15-m5",
    "macbook-pro-14-m5", "macbook-pro-16-m5-pro", "ipad-pro-11-m5",
    "ipad-pro-13-m5", "ipad-air-11-m4", "ipad-air-13-m4", "ipad-a16-11",
  ]) assert.match(catalog, new RegExp(slug));

  assert.match(detail, /Ổ cứng SSD/);
  assert.match(detail, /ramOptions/);
  assert.match(detail, /&ram=/);
  assert.match(orderForm, /params\.get\("ram"\)/);
  assert.match(pricing, /normalizedRam/);
  assert.match(managerFields, /name="macRamOptions"/);
  assert.match(managerFields, /name="macSsdOptions"/);
  assert.match(managerFields, /name="macConfigurations"/);
  assert.match(managerActions, /buildMacVariants/);

  const imagePaths = [...catalog.matchAll(/"(\/products\/apple\/[^"\n]+\.(?:jpg|png))"/g)].map(([, imagePath]) => imagePath);
  assert.ok(imagePaths.length >= 20);
  await Promise.all([...new Set(imagePaths)].map((imagePath) => access(new URL(`public${imagePath}`, root))));
});

test("runs a local FAQ and product chatbot without external AI services", async () => {
  const [layout, component, engine, knowledge, styles] = await Promise.all([
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("app/components/LocalChatbot.tsx", root), "utf8"),
    readFile(new URL("app/chatbot/engine.ts", root), "utf8"),
    readFile(new URL("app/data/chatbotKnowledge.ts", root), "utf8"),
    readFile(new URL("app/chatbot.css", root), "utf8"),
  ]);

  assert.match(layout, /LocalChatbot/);
  assert.match(layout, /chatbotProducts/);
  assert.match(component, /huy-apple-local-chat-v1/);
  assert.match(component, /Đang trực tuyến/);
  assert.match(component, /\/chatbot\/consultant-avatar\.png/);
  assert.match(component, /Tư vấn cùng Huy/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /lookupOrderStatus/);
  assert.match(component, /api\/orders\/status/);
  assert.match(engine, /CONFIDENCE_THRESHOLD/);
  assert.match(engine, /levenshtein/);
  assert.match(engine, /findProduct/);
  assert.match(engine, /contextProduct/);
  assert.match(engine, /findShippingResponse/);
  assert.match(engine, /isShippingFollowUp/);
  for (const intent of [
    "greeting", "products", "product_price", "product_search", "warranty",
    "shipping", "payment", "store_information", "contact", "promotion",
    "order_status", "thanks", "goodbye", "unknown",
  ]) assert.match(knowledge, new RegExp(`${intent}:`));
  for (const reply of ["Sản phẩm", "Giá sản phẩm", "Chính sách bảo hành", "Giao hàng", "Thanh toán", "Liên hệ tư vấn"]) {
    assert.match(knowledge, new RegExp(reply));
  }
  for (const shippingDetail of ["Viettel Post", "J&T Express", "SPX", "bao ngày có", "giao hỏa tốc", "2-5 ngày làm việc"]) {
    assert.match(knowledge, new RegExp(shippingDetail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(knowledge, /CHATBOT_SHIPPING_KNOWLEDGE/);
  assert.match(engine, /lastIntent === "shipping"/);
  assert.match(styles, /position: fixed/);
  assert.match(styles, /backdrop-filter: blur/);
  await access(new URL("public/chatbot/consultant-avatar.png", root));
  assert.match(styles, /@media \(max-width: 620px\)/);
  assert.doesNotMatch(`${component}\n${engine}\n${knowledge}`, /openai|gemini|claude|dangerouslySetInnerHTML|eval\s*\(/i);
});

test("provides protected employee profiles, payroll details and attendance", async () => {
  const [directory, profile, attendance, store, photoRoute, navigation, migration, staff, staffActions, adminUsers, orderActions] = await Promise.all([
    readFile(new URL("app/admin/hr/page.tsx", root), "utf8"),
    readFile(new URL("app/admin/hr/[id]/page.tsx", root), "utf8"),
    readFile(new URL("app/admin/attendance/page.tsx", root), "utf8"),
    readFile(new URL("db/hr.ts", root), "utf8"),
    readFile(new URL("app/api/admin/hr-photo/[id]/route.ts", root), "utf8"),
    readFile(new URL("app/admin/AdminNavigation.tsx", root), "utf8"),
    readFile(new URL("drizzle/0006_employee_hr.sql", root), "utf8"),
    readFile(new URL("app/admin/staff/page.tsx", root), "utf8"),
    readFile(new URL("app/admin/staff/actions.ts", root), "utf8"),
    readFile(new URL("db/admin-users.ts", root), "utf8"),
    readFile(new URL("app/admin/actions.ts", root), "utf8"),
  ]);

  assert.match(directory, /Hồ sơ nhân sự/);
  assert.match(profile, /Hộ khẩu thường trú/);
  assert.match(profile, /Tài khoản nhận lương/);
  assert.match(profile, /Lịch sử chấm công/);
  assert.match(attendance, /chấm công vào/i);
  assert.match(attendance, /chấm công ra/i);
  assert.match(store, /AES-GCM/);
  assert.match(store, /citizen_id_encrypted/);
  assert.match(store, /bank_account_number_encrypted/);
  assert.match(photoRoute, /user\.role !== "owner" && user\.role !== "manager"/);
  assert.match(photoRoute, /canManageEmployee\(user, employee\)/);
  assert.match(photoRoute, /private, no-store/);
  assert.match(navigation, /\/admin\/hr/);
  assert.match(navigation, /\/admin\/attendance/);
  assert.match(migration, /employee_profiles/);
  assert.match(migration, /employee_attendance/);
  assert.match(staff, /value="warranty">Nhân viên bảo hành/);
  assert.match(staff, /value="repair">Nhân viên sửa chữa/);
  assert.match(staffActions, /role === "warranty"/);
  assert.match(staffActions, /role === "repair"/);
  assert.match(adminUsers, /"warranty" \| "repair"/);
  assert.match(navigation, /"warranty", "repair"/);
  assert.match(orderActions, /user\.role === "warranty"/);
  assert.match(orderActions, /user\.role === "repair"/);
});

test("allows owners and branch managers to update employee profiles within branch scope", async () => {
  const [auth, directory, profile, actions, navigation, attendance] = await Promise.all([
    readFile(new URL("app/admin-auth.ts", root), "utf8"),
    readFile(new URL("app/admin/hr/page.tsx", root), "utf8"),
    readFile(new URL("app/admin/hr/[id]/page.tsx", root), "utf8"),
    readFile(new URL("app/admin/hr/actions.ts", root), "utf8"),
    readFile(new URL("app/admin/AdminNavigation.tsx", root), "utf8"),
    readFile(new URL("app/admin/attendance/page.tsx", root), "utf8"),
  ]);
  assert.match(auth, /requireHrManagerPage/);
  assert.match(auth, /requireHrManagerAction/);
  assert.match(auth, /user\.branchId === employee\.branchId/);
  assert.match(directory, /user\.role === "owner" \? allEmployees/);
  assert.match(profile, /canManageEmployee\(user, employee\)/);
  assert.match(profile, /name="photo"/);
  assert.match(profile, /name="name"/);
  assert.match(actions, /canManageEmployee\(user, current\)/);
  assert.match(actions, /name: value\(formData, "name"\)/);
  assert.match(navigation, /roles: \["owner", "manager"\].*Hồ sơ nhân sự/s);
  assert.match(attendance, /isSupervisor && <Link[^>]+href="\/admin\/hr"/);
});

test("filters the employee directory by owner and branch-manager scope", async () => {
  const [directory, styles] = await Promise.all([
    readFile(new URL("app/admin/hr/page.tsx", root), "utf8"),
    readFile(new URL("app/modern-theme.css", root), "utf8"),
  ]);
  assert.match(directory, /name="keyword"/);
  assert.match(directory, /name="role"/);
  assert.match(directory, /name="branch"/);
  assert.match(directory, /name="status"/);
  assert.match(directory, /Nhân viên bán hàng/);
  assert.match(directory, /Nhân viên bảo hành/);
  assert.match(directory, /Nhân viên sửa chữa/);
  assert.match(directory, /user\.role === "owner" \? allEmployees/);
  assert.match(directory, /item\.branchId === user\.branchId/);
  assert.match(directory, /user\.role === "owner" && <option value="manager"/);
  assert.match(styles, /\.admin-hr-filters/);
});

test("requires device biometrics for employee self attendance", async () => {
  const [component, page, optionsRoute, verifyRoute, passkeyStore, schema, migration, actions] = await Promise.all([
    readFile(new URL("app/admin/attendance/BiometricAttendance.tsx", root), "utf8"),
    readFile(new URL("app/admin/attendance/page.tsx", root), "utf8"),
    readFile(new URL("app/api/admin/attendance/passkey/options/route.ts", root), "utf8"),
    readFile(new URL("app/api/admin/attendance/passkey/verify/route.ts", root), "utf8"),
    readFile(new URL("db/attendance-passkeys.ts", root), "utf8"),
    readFile(new URL("db/schema.ts", root), "utf8"),
    readFile(new URL("drizzle/0007_attendance_passkeys.sql", root), "utf8"),
    readFile(new URL("app/admin/hr/actions.ts", root), "utf8"),
  ]);

  assert.match(page, /BiometricAttendance/);
  assert.match(component, /startRegistration/);
  assert.match(component, /startAuthentication/);
  assert.match(component, /không nhận hay lưu ảnh khuôn mặt/i);
  assert.match(optionsRoute, /userVerification: "required"/);
  assert.match(optionsRoute, /authenticatorAttachment: "platform"/);
  assert.match(verifyRoute, /requireUserVerification: true/);
  assert.match(verifyRoute, /employeeCheck\(user\.id, mode/);
  assert.match(passkeyStore, /employee_attendance_passkeys/);
  assert.match(passkeyStore, /expires_at/);
  assert.match(schema, /employeeAttendancePasskeys/);
  assert.match(migration, /employee_attendance_challenges/);
  assert.doesNotMatch(actions, /selfAttendanceAction/);
});

test("provides a protected DeepFace camera testing console", async () => {
  const [page, consolePage, navigation, styles] = await Promise.all([
    readFile(new URL("app/admin/face-test/page.tsx", root), "utf8"),
    readFile(new URL("app/admin/face-test/FaceTestConsole.tsx", root), "utf8"),
    readFile(new URL("app/admin/AdminNavigation.tsx", root), "utf8"),
    readFile(new URL("app/modern-theme.css", root), "utf8"),
  ]);
  assert.match(page, /requireOwnerPage\("\/admin\/face-test"\)/);
  assert.match(page, /Facenet512 · DeepFace/);
  assert.match(consolePage, /navigator\.mediaDevices\.getUserMedia/);
  assert.match(consolePage, /"X-API-Key": apiKey\.trim\(\)/);
  assert.match(consolePage, /employee_id: employeeId\.trim\(\)/);
  assert.match(consolePage, /submitFace\("enroll"\)/);
  assert.match(consolePage, /submitFace\("verify"\)/);
  assert.match(navigation, /Kiểm thử nhận diện/);
  assert.match(navigation, /href: "\/admin\/face-test", roles: \["owner"\]/);
  assert.match(styles, /\.face-test-workspace/);
  assert.match(styles, /@keyframes face-test-scan/);
});

test("stores member invoices and warranty records behind customer ownership checks", async () => {
  const [account, purchasesApi, invoicePage, warrantyPage, warrantyApi, orders, home, mobileNav] = await Promise.all([
    readFile(new URL("app/tai-khoan/AccountPanel.tsx", root), "utf8"),
    readFile(new URL("app/api/account/purchases/route.ts", root), "utf8"),
    readFile(new URL("app/tai-khoan/hoa-don/[id]/page.tsx", root), "utf8"),
    readFile(new URL("app/bao-hanh/WarrantyLookup.tsx", root), "utf8"),
    readFile(new URL("app/api/warranty/route.ts", root), "utf8"),
    readFile(new URL("db/orders.ts", root), "utf8"),
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/components/MobileAppNav.tsx", root), "utf8"),
  ]);

  assert.match(account, /Hóa đơn &amp; bảo hành/);
  assert.match(account, /api\/account\/purchases/);
  assert.match(purchasesApi, /currentCustomer/);
  assert.match(purchasesApi, /getCustomerOrders\(customer\.id\)/);
  assert.match(invoicePage, /getCustomerOrderById\(id, customer\.id\)/);
  assert.match(invoicePage, /Bảo hành điện tử/);
  assert.match(orders, /WHERE customer_id = \?/);
  assert.match(warrantyPage, /mã đơn hàng và số điện thoại/i);
  assert.match(warrantyApi, /getWarrantyOrder\(orderCode, phone\)/);
  assert.match(warrantyApi, /private, no-store/);
  assert.match(home, /Bảo hành điện tử, luôn có trong Member/);
  assert.match(mobileNav, /\/bao-hanh/);
});

test("separates owner, branch manager and staff workspaces with protected business ledgers", async () => {
  const [managerPortal, staffPortal, login, adminHome, customers, vouchers, voucherActions, navigation, branchDetail, staffActions, payroll, payrollActions, payrollStore, payrollMigration, tax] = await Promise.all([
    readFile(new URL("app/manger/page.tsx", root), "utf8"),
    readFile(new URL("app/staff/page.tsx", root), "utf8"),
    readFile(new URL("app/admin-login/actions.ts", root), "utf8"),
    readFile(new URL("app/admin/page.tsx", root), "utf8"),
    readFile(new URL("app/admin/customers/page.tsx", root), "utf8"),
    readFile(new URL("app/admin/vouchers/page.tsx", root), "utf8"),
    readFile(new URL("app/admin/vouchers/actions.ts", root), "utf8"),
    readFile(new URL("app/admin/AdminNavigation.tsx", root), "utf8"),
    readFile(new URL("app/admin/branches/[id]/page.tsx", root), "utf8"),
    readFile(new URL("app/admin/staff/actions.ts", root), "utf8"),
    readFile(new URL("app/admin/payroll/page.tsx", root), "utf8"),
    readFile(new URL("app/admin/payroll/actions.ts", root), "utf8"),
    readFile(new URL("db/payroll.ts", root), "utf8"),
    readFile(new URL("drizzle/0008_employee_payroll.sql", root), "utf8"),
    readFile(new URL("app/admin/tax/page.tsx", root), "utf8"),
  ]);

  assert.match(managerPortal, /Cổng quản lý chi nhánh/);
  assert.match(managerPortal, /item\.branchId === user\.branchId/);
  assert.match(managerPortal, /Thêm nhân sự cấp dưới/);
  assert.match(staffPortal, /Cổng làm việc nhân viên/);
  assert.match(staffPortal, /staffTools\(user\.role\)/);
  assert.match(login, /user\.role === "manager" \? "\/manger" : "\/staff"/);
  assert.match(adminHome, /redirect\("\/manger"\)/);
  assert.match(adminHome, /redirect\("\/staff"\)/);
  assert.match(customers, /requireOwnerPage\("\/admin\/customers"\)/);
  assert.match(vouchers, /requireOwnerPage\("\/admin\/vouchers"\)/);
  assert.match(voucherActions, /requireOwnerAction\(\)/);
  assert.match(navigation, /Member khách hàng.*roles: \["owner"\]/);
  assert.match(navigation, /Khuyến mãi & voucher.*roles: \["owner"\]/);
  assert.match(branchDetail, /actor\.branchId !== branch\.id/);
  assert.match(branchDetail, /createStaffAction/);
  assert.match(staffActions, /requireHrManagerAction/);
  assert.match(staffActions, /actor\.role === "manager" && role === "manager"/);
  assert.match(staffActions, /actor\.role === "manager" \? actor\.branchId/);
  assert.match(payroll, /Kiểm kê lương (tháng|theo chi nhánh)/);
  assert.match(payrollActions, /requireOwnerAction/);
  assert.match(payrollStore, /ON CONFLICT\(admin_user_id,payroll_month\)/);
  assert.match(payrollMigration, /employee_payroll_records/);
  assert.match(tax, /requireOwnerPage\("\/admin\/tax"\)/);
  assert.match(tax, /VAT đã thu ước tính/);
  assert.match(tax, /không thay thế tờ khai thuế/i);
});

test("groups payroll by branch and generates salary receipts with statutory deductions", async () => {
  const [page, editor, actions, store, schema, migration, receipt, styles] = await Promise.all([
    readFile(new URL("app/admin/payroll/page.tsx", root), "utf8"),
    readFile(new URL("app/admin/payroll/PayrollEditorForm.tsx", root), "utf8"),
    readFile(new URL("app/admin/payroll/actions.ts", root), "utf8"),
    readFile(new URL("db/payroll.ts", root), "utf8"),
    readFile(new URL("db/schema.ts", root), "utf8"),
    readFile(new URL("drizzle/0009_payroll_breakdown.sql", root), "utf8"),
    readFile(new URL("app/admin/payroll/[id]/page.tsx", root), "utf8"),
    readFile(new URL("app/modern-theme.css", root), "utf8"),
  ]);
  assert.match(page, /name="branch"/);
  assert.match(page, /groupByBranch/);
  assert.match(page, /giảm trừ bản thân là 15,5 triệu đồng\/tháng/);
  assert.match(editor, /name="bonusAmount"/);
  assert.match(editor, /name="socialInsuranceAmount"/);
  assert.match(editor, /name="personalIncomeTaxAmount"/);
  assert.match(editor, /gross > 12_000_000/);
  assert.match(actions, /employee\.monthlySalary/);
  assert.match(store, /baseSalary \+ bonusAmount - socialInsuranceAmount - personalIncomeTaxAmount/);
  assert.match(schema, /personalIncomeTaxAmount/);
  assert.match(migration, /bonus_amount/);
  assert.match(receipt, /PHIẾU LƯƠNG \/ XÁC NHẬN NHẬN LƯƠNG/);
  assert.match(receipt, /không phải hóa đơn giá trị gia tăng/i);
  assert.match(styles, /\.admin-payroll-person > div > strong/);
  assert.match(styles, /\.admin-payroll-receipt/);
});

test("loads monthly payroll attendance with one database query", async () => {
  const [page, hr, loading] = await Promise.all([
    readFile(new URL("app/admin/payroll/page.tsx", root), "utf8"),
    readFile(new URL("db/hr.ts", root), "utf8"),
    readFile(new URL("app/admin/payroll/loading.tsx", root), "utf8"),
  ]);
  assert.match(page, /getAttendanceForMonth\(month\)/);
  assert.match(page, /getPayrollEmployeeDirectory\(\)/);
  assert.doesNotMatch(page, /getEmployeeDirectory\(\)/);
  assert.doesNotMatch(page, /employees\.map\(async/);
  assert.match(hr, /export async function getAttendanceForMonth/);
  assert.match(hr, /export async function getPayrollEmployeeDirectory/);
  assert.match(hr, /let encryptionKeyReady: Promise<CryptoKey> \| null = null/);
  assert.match(hr, /WHERE a\.work_date BETWEEN \? AND \?/);
  assert.match(loading, /Đang tải bảng lương/);
});

test("keeps operational portals out of storefront reveal motion", async () => {
  const [motionSystem, motionStyles] = await Promise.all([
    readFile(new URL("app/components/MotionSystem.tsx", root), "utf8"),
    readFile(new URL("app/motion.css", root), "utf8"),
  ]);
  assert.match(motionSystem, /operationalPortal/);
  assert.match(motionSystem, /route-stage-static/);
  assert.doesNotMatch(motionSystem, /"\.admin-card"/);
  assert.doesNotMatch(motionSystem, /"\.admin-metric"/);
  assert.match(motionStyles, /\.route-stage-static/);
  assert.match(motionStyles, /animation: none/);
});

test("centralizes warranty and repair staff in the service branch", async () => {
  const [actions, staffPage, branchPage, migration] = await Promise.all([
    readFile(new URL("app/admin/staff/actions.ts", root), "utf8"),
    readFile(new URL("app/admin/staff/page.tsx", root), "utf8"),
    readFile(new URL("app/admin/branches/[id]/page.tsx", root), "utf8"),
    readFile(new URL("drizzle/0012_centralize_service_staff.sql", root), "utf8"),
  ]);
  assert.match(actions, /const serviceRole=role === "warranty" \|\| role === "repair"/);
  assert.match(actions, /branchId: branch\.id/);
  assert.match(staffPage, /luôn được hệ thống đưa về Trung tâm bảo hành sửa chữa Apple/);
  assert.match(branchPage, /isServiceBranch/);
  assert.match(migration, /WHERE role IN \('warranty', 'repair'\)/);
  assert.match(migration, /UPPER\(code\) = 'BH1-1'/);
});

test("routes live consultation to the selected branch and gives the director a manager-first HR view", async () => {
  const [customerChat, publicApi, adminApi, inbox, chatStore, schema, chatMigration, hrStore, hrPage, staffStore, demoMigration, auth, layout, moneyInput] = await Promise.all([
    readFile(new URL("app/components/LiveSupportChat.tsx", root), "utf8"),
    readFile(new URL("app/api/live-chat/route.ts", root), "utf8"),
    readFile(new URL("app/api/admin/live-chat/route.ts", root), "utf8"),
    readFile(new URL("app/admin/live-chat/LiveChatInbox.tsx", root), "utf8"),
    readFile(new URL("db/live-chat.ts", root), "utf8"),
    readFile(new URL("db/schema.ts", root), "utf8"),
    readFile(new URL("drizzle/0010_live_chat_branches.sql", root), "utf8"),
    readFile(new URL("db/hr.ts", root), "utf8"),
    readFile(new URL("app/admin/hr/page.tsx", root), "utf8"),
    readFile(new URL("db/admin-users.ts", root), "utf8"),
    readFile(new URL("drizzle/0011_demo_employee_profiles.sql", root), "utf8"),
    readFile(new URL("app/admin-auth.ts", root), "utf8"),
    readFile(new URL("app/admin/layout.tsx", root), "utf8"),
    readFile(new URL("app/admin/AdminMoneyInput.tsx", root), "utf8"),
  ]);
  assert.match(customerChat, /Chi nhánh cần tư vấn/);
  assert.match(customerChat, /branchId/);
  assert.match(publicApi, /getBranches\(false\)/);
  assert.match(publicApi, /createLiveConversation\(name,phone,\{id:branch\.id,name:branch\.name\}\)/);
  assert.match(adminApi, /admin\.role === "owner" \? "" : admin\.branchId/);
  assert.match(adminApi, /role === "consultant"/);
  assert.match(inbox, /branchName/);
  assert.match(chatStore, /WHERE c\.branch_id=\?/);
  assert.match(schema, /branchName: text\("branch_name"\)/);
  assert.match(chatMigration, /live_chat_conversations_branch_idx/);
  assert.match(hrStore, /CASE u\.role WHEN 'manager' THEN 0/);
  assert.match(staffStore, /CASE role WHEN 'manager' THEN 0/);
  assert.match(hrPage, /roleOrder\(left\.role\)/);
  assert.match(auth, /name: "Giám đốc"/);
  assert.match(layout, /return "Giám đốc"/);
  for (const salary of ["38000000", "20000000", "15000000", "12000000"]) assert.match(demoMigration, new RegExp(salary));
  assert.match(demoMigration, /printf\('079%09d'/);
  assert.match(demoMigration, /bank_account_number_encrypted/);
  assert.match(moneyInput, /toLocaleString\("vi-VN"\)/);
});
