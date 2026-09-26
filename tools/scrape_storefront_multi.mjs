import fs from 'fs/promises';
import path from 'path';

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
  try{
    const res = await fetch(url);
    if(!res.ok) throw new Error('Failed to download '+url);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(dest, buf);
    return true;
  }catch{
    return false;
  }
}

function extractProducts(html){
  const blocks = html.split('product-info-container product-item');
  const items = [];
  for(const block of blocks){
    const href = (block.match(/href="([^\"]+?)"/)||[])[1];
    const img = (block.match(/<img[^>]+src="([^\"]+?)"/)||[])[1];
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
  return `  { slug:"${slug}", name:"${name}", brand:"${p.brand || ''}", category:"${p.category}", image:"${image}", badge:"", tagline:"${name}", price:"${price}", colors:["#111111"], specs:[${specs.map(s=>`"${s}"`).join(',')}], source:"${p.href}" },\n`;
}

async function readExistingSlugs(){
  const src = await fs.readFile(OUT_PRODUCTS, 'utf8');
  const slugs = [...src.matchAll(/slug:\s*"([^"]+)"/g)].map(m=>m[1]);
  return new Set(slugs);
}

async function main(){
  const targets = [
    { url: 'https://cellphones.com.vn/laptop/mac.html', type: 'macbook', limit: 200 },
    { url: 'https://cellphones.com.vn/laptop/mac.html', type: 'iphone-skip', limit: 0 },
    { url: 'https://cellphones.com.vn/phu-kien.html', type: 'phu-kien', limit: 50 },
    { url: 'https://cellphones.com.vn/mobile/samsung.html', type: 'samsung', limit: 500 },
  ];

  await fs.mkdir(OUT_PUBLIC, { recursive:true });
  const existingSlugs = await readExistingSlugs();
  const collected = [];

  for(const t of targets){
    console.log('Fetching', t.url);
    const html = await fetchText(t.url);
    const items = extractProducts(html);
    let take = items;
    if(t.limit && t.limit>0) take = items.slice(0,t.limit);

    for(const it of take){
      const slug = makeSlug(it.href) || ('cp-'+Math.random().toString(36).slice(2,8));
      if(t.type==='iphone-skip'){
        // skip adding any from this page to iphone because they already exist
        continue;
      }
      if(existingSlugs.has(slug)){
        console.log('Skipping existing', slug);
        continue;
      }

      // determine category
      let category = t.type;
      if(t.type==='macbook'){
        const n = it.name.toLowerCase();
        if(n.includes('air')) category = 'macbook-air';
        else if(n.includes('pro')) category = 'macbook-pro';
        else category = 'macbook';
      }
      if(t.type==='phu-kien') category = 'phu-kien';

      const ext = path.extname(new URL(it.img).pathname).split('?')[0] || '.jpg';
      const filename = `${slug}${ext}`;
      const dest = path.join(OUT_PUBLIC, filename);
      const downloaded = await download(it.img, dest);
      if(downloaded){
        console.log('Downloaded', it.img, '->', dest);
      }else{
        console.warn('Failed to download', it.img);
      }
      const imagePath = downloaded?`/products/${filename}`:it.img;
      collected.push({ slug, name: it.name, image: imagePath, price: it.price, specs: it.specs, href: it.href, brand: '', category });
    }
  }

  if(collected.length===0){ console.log('No new products collected'); return; }

  // Append collected products to products.ts by inserting before closing '];'
  let orig = await fs.readFile(OUT_PRODUCTS, 'utf8');
  const insertAt = orig.lastIndexOf('];');
  if(insertAt===-1){ console.error('Cannot find end of products array'); return; }
  const before = orig.slice(0, insertAt);
  const after = orig.slice(insertAt);
  const tsEntries = collected.map(p=>productToTs(p)).join('');
  const newContent = before + '\n' + tsEntries + after;
  await fs.writeFile(OUT_PRODUCTS, newContent, 'utf8');
  console.log('Appended', collected.length, 'products to', OUT_PRODUCTS);
}

main().catch(err=>{ console.error(err); process.exit(1); });
