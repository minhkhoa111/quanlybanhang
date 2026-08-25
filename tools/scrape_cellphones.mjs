import fs from 'fs/promises';
import path from 'path';

const TARGET = 'https://cellphones.com.vn/mobile/apple.html';
const OUT_PRODUCTS = path.resolve(process.cwd(), 'app', 'products.ts');
const OUT_PUBLIC = path.resolve(process.cwd(), 'public', 'products');

function cleanText(s){
  return s.replace(/\s+/g,' ').replace(/<[^>]+>/g,'').trim();
}

async function fetchText(url){
  const res = await fetch(url, { headers: { 'User-Agent': 'node-fetch' } });
  return await res.text();
}

async function download(url, dest){
  const res = await fetch(url);
  if(!res.ok) throw new Error('Failed to download '+url);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buf);
}

function extractProducts(html){
  const blocks = html.split('product-info-container product-item');
  const items = [];
  for(const block of blocks){
    const href = (block.match(/href="([^"]+?)"/)||[])[1];
    const img = (block.match(/<img[^>]+src="([^"]+?)"/)||[])[1];
    const name = (block.match(/<div class="product__name">[\s\S]*?<h3>([\s\S]*?)<\//)||[])[1];
    const price = (block.match(/product__price--show[^>]*>([\s\S]*?)<\//)||[])[1];
    const specsMatches = [...block.matchAll(/class="product__more-info__item">\s*([^<]+?)\s*<\/p>/g)].map(m=>m[1]);
    if(href && img && name){
      items.push({ href, img, name: cleanText(name), price: price?cleanText(price):'', specs: specsMatches });
    }
  }
  return items;
}

function makeSlug(href){
  try{ const u = new URL(href); return u.pathname.split('/').filter(Boolean).pop().replace(/\.html$/,''); }catch{ return href.split('/').pop().replace(/\.html$/,'').replace(/[^a-z0-9\-]/gi,'-').toLowerCase(); }
}

function productToTs(p){
  const slug = p.slug;
  const name = p.name.replace(/"/g, '\\"');
  const image = p.image;
  const price = p.price || 'Liên hệ giá tốt';
  const specs = p.specs.map(s=>s.replace(/"/g,'\\"'));
  return `  { slug:"${slug}", name:"${name}", brand:"Apple", category:"iphone", image:"${image}", badge:"", tagline:"${name}", price:"${price}", colors:["#111111"], specs:[${specs.map(s=>`"${s}"`).join(',')}], source:"${p.href}" },\n`;
}

async function main(){
  console.log('Fetching', TARGET);
  const html = await fetchText(TARGET);
  const items = extractProducts(html).slice(0,120);
  if(items.length===0){ console.error('No items found'); process.exit(1); }
  await fs.mkdir(OUT_PUBLIC, { recursive:true });
  const products = [];
  for(const it of items){
    const slug = makeSlug(it.href) || ('cp-'+Math.random().toString(36).slice(2,8));
    const ext = path.extname(new URL(it.img).pathname).split('?')[0] || '.jpg';
    const filename = `${slug}${ext}`;
    const dest = path.join(OUT_PUBLIC, filename);
    try{ await download(it.img, dest); console.log('Downloaded', it.img, '->', dest); }
    catch(err){ console.warn('Failed to download image, will keep remote URL', err.message); }
    products.push({ slug, name: it.name, image: `/products/${filename}`, price: it.price, specs: it.specs, href: it.href });
  }

  // replace the products array in app/products.ts
  const orig = await fs.readFile(OUT_PRODUCTS, 'utf8');
  const startMarker = 'export const products: Product[] = [';
  const startIdx = orig.indexOf(startMarker);
  if(startIdx===-1){ console.error('Cannot find products export in', OUT_PRODUCTS); process.exit(1); }
  const afterStart = orig.indexOf('[', startIdx) + 1;
  const endIdx = orig.indexOf('];', afterStart);
  if(endIdx===-1){ console.error('Cannot find end of products array in', OUT_PRODUCTS); process.exit(1); }
  const header = orig.slice(0, afterStart);
  const footer = orig.slice(endIdx);
  const tsEntries = products.map(p=>productToTs(p)).join('');
  const newContent = header + '\n' + tsEntries + '\n' + footer;
  await fs.writeFile(OUT_PRODUCTS, newContent, 'utf8');
  console.log('Replaced products array with', products.length, 'items in', OUT_PRODUCTS);
}

main().catch(err=>{ console.error(err); process.exit(1); });
