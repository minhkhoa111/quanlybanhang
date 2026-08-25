import fs from 'fs/promises';
import path from 'path';

const FILE = path.resolve(process.cwd(), 'app', 'products.ts');

async function read(){ return fs.readFile(FILE,'utf8'); }
async function write(s){ return fs.writeFile(FILE,s,'utf8'); }

function detectBrand(name, slug){
  const n = name.toLowerCase();
  if(n.includes('iphone') || slug.includes('iphone') || n.includes('apple') || slug.includes('mac')) return 'Apple';
  if(n.includes('samsung') || slug.includes('samsung')) return 'Samsung';
  if(n.includes('xiaomi') || slug.includes('xiaomi')) return 'Xiaomi';
  return '';
}

function normalizePrice(p){
  if(!p) return 'Liên hệ';
  const s = p.trim();
  if(s.match(/\d/)) return s.replace(/\s+/g,' ').replace(/,00/g,'').trim();
  return 'Liên hệ';
}

async function main(){
  let src = await read();
  const startMarker = 'export const products: Product[] = [';
  const i = src.indexOf(startMarker);
  if(i===-1){ console.error('products export not found'); return; }
  const a = src.indexOf('[', i);
  const b = src.indexOf('];', a);
  const prefix = src.slice(0,a+1);
  const suffix = src.slice(b);
  const body = src.slice(a+1,b);
  // split entries by '},' that are at end of object
  const rawEntries = body.split(/\},\s*\n/).map(s=>s.trim()).filter(Boolean);
  const seen = new Set();
  const newEntries = [];
  for(const r of rawEntries){
    const entry = r.endsWith('},')? r : r + '},';
    const slugMatch = entry.match(/slug:\s*"([^"]+)"/);
    const nameMatch = entry.match(/name:\s*"([^"]*)"/);
    const priceMatch = entry.match(/price:\s*"([^"]*)"/);
    const brandMatch = entry.match(/brand:\s*"([^"]*)"/);
    const slug = slugMatch? slugMatch[1] : ('no-slug-'+Math.random().toString(36).slice(2,8));
    if(seen.has(slug)){
      console.log('Removing duplicate', slug); continue;
    }
    seen.add(slug);
    const name = nameMatch? nameMatch[1] : '';
    const detected = detectBrand(name, slug);
    let newEntry = entry;
    if(brandMatch){
      newEntry = newEntry.replace(/brand:\s*"([^"]*)"/, `brand:"${detected||brandMatch[1]}"`);
    } else {
      newEntry = newEntry.replace(/\{\s*/, `{ brand:"${detected}", `);
    }
    const price = priceMatch? priceMatch[1] : '';
    const norm = normalizePrice(price);
    newEntry = newEntry.replace(/price:\s*"([^"]*)"/, `price:"${norm}"`);
    newEntries.push(newEntry);
  }
  const newBody = '\n' + newEntries.join('\n') + '\n';
  const out = prefix + newBody + suffix;
  await write(out);
  console.log('Wrote normalized products:', newEntries.length);
}

main().catch(e=>{ console.error(e); process.exit(1); });
