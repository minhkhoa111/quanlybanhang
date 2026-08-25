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

  const objects = [];
  let i = 0;
  while(i < arrayContent.length){
    // skip whitespace
    while(i < arrayContent.length && /\s/.test(arrayContent[i])) i++;
    if(i >= arrayContent.length) break;
    if(arrayContent[i] !== '{') {
      // skip separators like commas
      i++;
      continue;
    }
    let startIdx = i;
    let depth = 0;
    while(i < arrayContent.length){
      if(arrayContent[i] === '{') depth++;
      else if(arrayContent[i] === '}'){
        depth--;
        if(depth === 0){
          i++; // include closing brace
          break;
        }
      }
      i++;
    }
    const objText = arrayContent.slice(startIdx, i);
    objects.push(objText.trim());
  }

  const kept = [];
  for(const obj of objects){
    const m = obj.match(/category\s*:\s*"([^"]+)"/);
    const cat = m ? m[1] : null;
    if(cat && REMOVE.includes(cat)){
      console.log('Removing seed product category=', cat);
      continue;
    }
    kept.push(obj);
  }

  const newArray = '\n  ' + kept.join(',\n\n  ') + '\n';
  const newContent = prefix + newArray + suffix;
  await fs.writeFile(FILE, newContent, 'utf8');
  console.log('Wrote', FILE);
}

main().catch(err=>{ console.error(err); process.exit(1); });
