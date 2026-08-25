"use client";
import React, { useEffect, useState } from "react";

export default function MobileMenuToggle(){
  const [open, setOpen] = useState(false);

  useEffect(()=>{
    function onDocClose(){ setOpen(false); document.body.classList.remove('mobile-menu-open'); }
    document.addEventListener('mobile-menu-close', onDocClose as EventListener);
    return ()=>document.removeEventListener('mobile-menu-close', onDocClose as EventListener);
  },[]);

  function toggle(){
    const next = !open;
    setOpen(next);
    document.body.classList.toggle('mobile-menu-open', next);
    document.dispatchEvent(new CustomEvent('mobile-menu-toggle', { detail: { open: next } }));
  }

  return (
    <button className={`mobile-toggle ${open? 'open':''}`} onClick={toggle} aria-expanded={open} aria-label="Mở menu">
      <span className="bar" />
      <span className="bar" />
      <span className="bar" />
    </button>
  );
}
