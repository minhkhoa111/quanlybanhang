"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function MegaMenu(){
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(()=>{
    function onKey(e: KeyboardEvent){ if(e.key === "Escape") setOpen(false); }
    function onDocClick(e: MouseEvent){
      if(!ref.current) return;
      if(!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onDocClick);
    function onMobileToggle(event: Event){
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      if(typeof detail?.open === 'boolean') setOpen(detail.open);
    }
    document.addEventListener('mobile-menu-toggle', onMobileToggle as EventListener);
    return ()=>{
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onDocClick);
      document.removeEventListener('mobile-menu-toggle', onMobileToggle as EventListener);
    };
  },[]);

  useEffect(()=>{
    // keep body class in sync for mobile overlay
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;
    if(isMobile){
      if(open) document.body.classList.add('mobile-menu-open'); else document.body.classList.remove('mobile-menu-open');
    }
  },[open]);

  return (
    <div
      className={`mega-menu ${open? 'open':''}`}
      ref={ref}
      onMouseEnter={()=>setOpen(true)}
      onMouseLeave={()=>setOpen(false)}
    >
      <div className="mega-inner shell">
        <div className="mega-col">
          <h4>Điện thoại</h4>
          <Link href="/iphone">iPhone</Link>
          <Link href="/samsung">Samsung</Link>
          <Link href="/android">Android khác</Link>
        </div>
        <div className="mega-col">
          <h4>Máy tính bảng</h4>
          <Link href="/ipad">iPad</Link>
        </div>
        <div className="mega-col">
          <h4>Máy tính Apple</h4>
          <Link href="/macbook">MacBook</Link>
          <Link href="/laptop">Laptop Windows</Link>
        </div>

        {/* promo tiles removed to avoid missing assets */}
      </div>
    </div>
  );
}
