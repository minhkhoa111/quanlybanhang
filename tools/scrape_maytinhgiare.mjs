import fs from 'fs';
import path from 'path';

function detectBrand(name, slug) {
  const text = (name + ' ' + slug).toLowerCase();
  if (text.includes('dell') || text.includes('alienware')) return 'Dell';
  if (text.includes('hp') || text.includes('elitebook') || text.includes('zbook') || text.includes('probook') || text.includes('omen')) return 'HP';
  if (text.includes('lenovo') || text.includes('thinkpad') || text.includes('ideapad') || text.includes('legion') || text.includes('thinkbook')) return 'Lenovo';
  if (text.includes('asus') || text.includes('zenbook') || text.includes('vivobook') || text.includes('rog') || text.includes('tuf')) return 'ASUS';
  if (text.includes('acer') || text.includes('nitro') || text.includes('predator') || text.includes('aspire') || text.includes('swift')) return 'Acer';
  if (text.includes('msi') || text.includes('katana') || text.includes('modern') || text.includes('stealth') || text.includes('raider')) return 'MSI';
  if (text.includes('apple') || text.includes('macbook')) return 'Apple';
  if (text.includes('surface') || text.includes('microsoft')) return 'Microsoft';
  if (text.includes('razer')) return 'Razer';
  if (text.includes('lg') || text.includes('gram')) return 'LG';
  return 'Laptop';
}

function parseSpecsList(configRaw) {
  if (!configRaw) return ['Cấu hình tiêu chuẩn', 'Bảo hành 12 tháng'];
  const parts = configRaw.split('|').map(p => p.trim()).filter(Boolean);
  const specs = [];
  for (const part of parts) {
    if (/^i[3579]|ryzen|core|xeon|ultra|athlon/i.test(part)) specs.push('CPU: ' + part);
    else if (/rtx|gtx|radeon|iris|uhd|geforce|intel hd|quadro|nvidia|amd/i.test(part)) specs.push('VGA: ' + part);
    else if (/^\d+gb$/i.test(part) && !specs.some(s => s.startsWith('RAM:'))) specs.push('RAM: ' + part.toUpperCase());
    else if (/^\d+(?:gb|tb|b)$/i.test(part)) specs.push('Ổ cứng: ' + part.toUpperCase().replace('B', 'GB'));
    else if (/inch|fhd|qhd|uhd|2k|4k|oled|ips/i.test(part)) specs.push('Màn hình: ' + part);
    else specs.push(part);
  }
  if (!specs.some(s => s.includes('RAM:'))) {
    const ramMatch = configRaw.match(/\b(\d+GB)\b/i);
    if (ramMatch) specs.push('RAM: ' + ramMatch[1].toUpperCase());
  }
  if (!specs.some(s => s.includes('Ổ cứng:'))) {
    const ssdMatch = configRaw.match(/\b(\d+(?:GB|TB))\b/i);
    if (ssdMatch) specs.push('SSD: ' + ssdMatch[1].toUpperCase());
  }
  return specs.length > 0 ? specs : [configRaw];
}

async function run() {
  console.log('--- Bắt đầu thu thập dữ liệu Laptop từ maytinhgiare.vn ---');
  const allHtmlBlocks = [];

  console.log('1. Đang tải Trang 1...');
  const res1 = await fetch('https://maytinhgiare.vn/laptop/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  });
  const html1 = await res1.text();
  const p1List = html1.match(/<ul class=\"f-product-viewid f-product\"[^>]*>([\s\S]*?)<\/ul>/i)?.[1] || '';
  allHtmlBlocks.push(p1List);

  console.log('2. Đang tải Pages 2 đến 25 qua API getPage.php...');
  for (let p = 2; p <= 25; p++) {
    process.stdout.write(`Trang ${p}... `);
    const formData = new URLSearchParams({
      page: String(p),
      cid: '4',
      type: 'submenu',
      url: '',
      idd: '',
      num_rows_page: '25',
      strPrice: ''
    });

    try {
      const res = await fetch('https://maytinhgiare.vn/loading/getPage.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0'
        },
        body: formData.toString()
      });
      const json = await res.json();
      if (json.view) allHtmlBlocks.push(json.view);
    } catch (err) {
      console.error(`Lỗi trang ${p}:`, err.message);
    }
  }
  console.log('\nĐã tải xong toàn bộ HTML!');

  const combined = allHtmlBlocks.join('\n');
  const items = [...combined.matchAll(/<li[^>]*class=\"padding5\"[^>]*>([\s\S]*?)<\/li>/gi)];
  console.log(`Tìm thấy ${items.length} thẻ sản phẩm. Đang trích xuất cấu hình và chuẩn hóa...`);

  const rawProducts = [];
  const slugs = new Set();

  for (const item of items) {
    const raw = item[1];
    const titleMatch = raw.match(/<h3[^>]*>[\s\S]*?<a[^>]+href=\"https:\/\/maytinhgiare\.vn\/([^\"]+)\.html\"[^>]*>([\s\S]*?)<\/a>/i);
    if (!titleMatch) continue;

    const slug = titleMatch[1].trim();
    const name = titleMatch[2].replace(/<[^>]+>/g, '').trim();

    const configMatch = raw.match(/<div class=\"item-cauhinh\"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);
    const configRaw = configMatch ? configMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    const newPriceMatch = raw.match(/class=\"new-price\"[^>]*>([\s\S]*?)<\/span>/i);
    const newPrice = newPriceMatch ? newPriceMatch[1].replace(/<[^>]+>/g, '').replace(/[đ₫]/g, '').trim() + 'đ' : 'Liên hệ';

    const oldPriceMatch = raw.match(/class=\"old-price\"[^>]*>([\s\S]*?)<\/span>/i);
    const oldPrice = oldPriceMatch ? oldPriceMatch[1].replace(/<[^>]+>/g, '').replace(/[đ₫]/g, '').trim() + 'đ' : undefined;

    const imgMatch = raw.match(/<div class=\"pr-img\"[\s\S]*?<img[^>]+src=\"([^\"]+)\"/i);
    const imgUrl = imgMatch ? imgMatch[1] : '';

    const saleMatch = raw.match(/class=\"pr-sales\"[^>]*>([^<]+)<\/span>/i);
    const newLabelMatch = raw.match(/class=\"pos-label pr-new\"[^>]*>([^<]+)<\/span>/i);

    if (slug && name && !slugs.has(slug)) {
      slugs.add(slug);
      rawProducts.push({
        slug,
        name,
        configRaw,
        newPrice: newPrice === 'đ' ? 'Liên hệ' : newPrice,
        oldPrice: oldPrice === 'đ' ? undefined : oldPrice,
        imgUrl,
        saleBadge: saleMatch ? saleMatch[1].trim() : '',
        statusBadge: newLabelMatch ? newLabelMatch[1].trim() : ''
      });
    }
  }

  console.log(`Đã trích xuất ${rawProducts.length} sản phẩm độc bản.`);

  // 3. Tải hình ảnh cục bộ
  console.log('3. Đang tải toàn bộ hình ảnh về public/products/maytinhgiare/...');
  const localDir = path.join(process.cwd(), 'public/products/maytinhgiare');
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });

  const concurrency = 15;
  let downloadedCount = 0;
  let cachedCount = 0;

  async function downloadImage(prod) {
    if (!prod.imgUrl) return;
    const extMatch = prod.imgUrl.match(/\.(jpg|jpeg|png|webp)/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
    const localFilename = `${prod.slug}.${ext}`;
    const localPath = path.join(localDir, localFilename);
    prod.localImage = `/products/maytinhgiare/${localFilename}`;

    if (fs.existsSync(localPath)) {
      cachedCount++;
      return;
    }

    try {
      const encoded = encodeURI(prod.imgUrl);
      const res = await fetch(encoded, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(localPath, buf);
        downloadedCount++;
      } else {
        prod.localImage = '/products/laptops/asus-vivobook-15-x1504.jpg'; // fallback
      }
    } catch {
      prod.localImage = '/products/laptops/asus-vivobook-15-x1504.jpg'; // fallback
    }
  }

  for (let i = 0; i < rawProducts.length; i += concurrency) {
    const batch = rawProducts.slice(i, i + concurrency);
    await Promise.all(batch.map(p => downloadImage(p)));
    if ((i + concurrency) % 75 === 0 || i + concurrency >= rawProducts.length) {
      console.log(`Tiến độ tải ảnh: ${Math.min(i + concurrency, rawProducts.length)}/${rawProducts.length} (Mới tải: ${downloadedCount}, Đã có sẵn: ${cachedCount})`);
    }
  }

  // 4. Định dạng sản phẩm chuẩn TypeScript
  console.log('4. Định dạng đối tượng Product và tạo app/maytinhgiare-laptop-products.ts...');
  const formatted = rawProducts.map(p => {
    const brand = detectBrand(p.name, p.slug);
    const specs = parseSpecsList(p.configRaw);
    const isNew = p.statusBadge === 'Mới';
    const condition = isNew ? 'new' : 'like-new';
    const conditionLabel = isNew ? 'New' : 'Like New - Đã qua sử dụng';
    const badge = p.saleBadge || (p.statusBadge ? (p.statusBadge === 'Mới' ? 'Máy Mới' : p.statusBadge) : 'Like New 99%');
    const warranty = isNew ? '12 tháng chính hãng' : '12 tháng phần cứng, lỗi 1 đổi 1 trong 30 ngày';

    return {
      slug: p.slug,
      name: p.name,
      brand,
      category: 'laptop',
      image: p.localImage || '/products/laptops/asus-vivobook-15-x1504.jpg',
      images: [p.localImage || '/products/laptops/asus-vivobook-15-x1504.jpg'],
      badge,
      tagline: `${p.name} | ${p.configRaw || conditionLabel}`,
      description: `Laptop ${p.name} chính hãng (${brand}) cấu hình ${p.configRaw || 'tiêu chuẩn'} tại Infinity Store. Tình trạng máy: ${conditionLabel}. Bảo hành ${warranty}, tặng kèm balo chống sốc và chuột không dây. Hỗ trợ trả góp 0% lãi suất, thu cũ đổi mới trợ giá đến 95%, giao nhanh 2h tại TP.HCM và Hà Nội.`,
      price: p.newPrice,
      sellingPrice: p.newPrice,
      salePrice: p.newPrice,
      oldPrice: p.oldPrice,
      condition,
      conditionLabel,
      stock: 10,
      status: 'active',
      active: true,
      colors: ['#1e293b', '#64748b'],
      colorOptions: [
        { name: 'Xám Titan / Đen', hex: '#1e293b' },
        { name: 'Bạc / Silver', hex: '#64748b' }
      ],
      specs: [
        ...specs,
        `Tình trạng: ${conditionLabel}`
      ],
      source: `https://maytinhgiare.vn/${p.slug}.html`
    };
  });

  const outContent = 'import type { Product } from "./products";\n\nexport const maytinhgiareLaptopProducts: Product[] = ' + JSON.stringify(formatted, null, 2) + ';\n';
  fs.writeFileSync('app/maytinhgiare-laptop-products.ts', outContent, 'utf-8');
  console.log(`HOÀN THÀNH XUẤT SẮC! Đã ghi nhận ${formatted.length} sản phẩm vào app/maytinhgiare-laptop-products.ts!`);
}

run();
