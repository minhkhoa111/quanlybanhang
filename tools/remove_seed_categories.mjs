import fs from 'fs/promises';
import path from 'path';

const FILE = path.resolve(process.cwd(), 'app', 'products.ts');
const REMOVE = ['tablet','ipad','macbook','laptop','phu-kien'];

async function main(){
  let src = await fs.readFile(FILE, 'utf8');
  const start = src.indexOf('export const products');
  if(start===-1) throw new Error('Cannot find products export');
  const arrStart = src.indexOf('[', start);
  const arrEnd = src.lastIndexOf('];');
  if(arrStart===-1 || arrEnd===-1) throw new Error('Cannot find products array bounds');
  const prefix = src.slice(0, arrStart+1);
  const arrayContent = src.slice(arrStart+1, arrEnd);
  const suffix = src.slice(arrEnd);

  // Split objects by top-level '},' occurrences.
  const parts = arrayContent.split(/},\s*\n/).map(p=>p.trim()).filter(Boolean);
  const kept = [];
  for(const part of parts){
    const objText = part.endsWith('},') ? part.slice(0,-1) : part;
    const catMatch = objText.match(/category\s*:\s*"([^"]+)"/);
    const cat = catMatch ? catMatch[1] : null;
    if(cat && REMOVE.includes(cat)){
      console.log('Removing seed product with category', cat);
      continue;
    }
    kept.push(objText.endsWith(',') ? objText : objText + ',');
  }

  const newArray = '\n  ' + kept.join('\n  ') + '\n';
  const newContent = prefix + newArray + suffix;
  await fs.writeFile(FILE, newContent, 'utf8');
  console.log('Wrote', FILE);
}

main().catch(err=>{ console.error(err); process.exit(1); });
