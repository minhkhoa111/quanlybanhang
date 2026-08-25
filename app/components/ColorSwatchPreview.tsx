"use client";
import React, { useEffect, useState } from "react";
import NextImage from "next/image";

type Color = { name: string; hex: string };

function slugify(s: string){
  return s.toString().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

async function existsImage(url: string){
  return new Promise<boolean>((resolve)=>{
    const img = new window.Image();
    img.onload = ()=>resolve(true);
    img.onerror = ()=>resolve(false);
    img.src = url;
  });
}

export default function ColorSwatchPreview({ slug, colors, defaultImage }:{slug:string, colors:Color[], defaultImage?:string}){
  const [activeIdx, setActiveIdx] = useState(0);
  const [images, setImages] = useState<(string|undefined)[]>([]);
  const colorsKey = JSON.stringify(colors);

  useEffect(()=>{
    let mounted=true;
    async function prepare(){
      const found: (string|undefined)[] = [];
      for(const [i,color] of colors.entries()){
        const cslug = slugify(color.name);
        const candidates = [
          `/products/${slug}-${cslug}.jpg`,
          `/products/${slug}-${cslug}.png`,
          `/products/${slug}-${i+1}.jpg`,
          `/products/${slug}-${i+1}.png`,
          `/products/${slug}.jpg`,
          `/products/${slug}.png`
        ];
        let ok: string|undefined = undefined;
        for(const u of candidates){
          if(await existsImage(u)) { ok = u; break; }
        }
        found.push(ok);
      }
      if(mounted) setImages(found);
    }
    prepare();
    return ()=>{ mounted=false; };
  },[slug, colors, colorsKey]);

  const activeImage = images[activeIdx] ?? defaultImage;

  return (
    <div className="detail-color-snapshot">
      <div className="detail-image-preview">
        {activeImage ? (
          <NextImage src={activeImage} alt={`Preview ${activeIdx}`} width={740} height={420} unoptimized style={{objectFit:'contain'}} />
        ) : (
          <div style={{width:'100%',height:420,display:'grid',placeItems:'center',background:'#fff'}}>Hình ảnh đang tải...</div>
        )}
      </div>

      <div className="detail-color-list small">
        {colors.map((c, idx)=> (
          <button key={c.name} className={`color-swatch ${idx===activeIdx? 'active':''}`} onClick={()=>setActiveIdx(idx)} title={c.name}>
            <span className="dot" style={{backgroundColor:c.hex}} />
            <span className="label">{c.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
