"use client";

import { useEffect } from "react";

const VISITOR_KEY = "huy-apple-visitor-v1";
const VIEW_PREFIX = "huy-apple-viewed:";

export default function ProductViewTracker({ productSlug }: { productSlug: string }) {
  useEffect(() => {
    const lastView = Number(localStorage.getItem(`${VIEW_PREFIX}${productSlug}`) || 0);
    if (Date.now() - lastView < 30 * 60 * 1000) return;
    let visitorId = localStorage.getItem(VISITOR_KEY);
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, visitorId);
    }
    localStorage.setItem(`${VIEW_PREFIX}${productSlug}`, String(Date.now()));
    void fetch("/api/product-views", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productSlug, visitorId }),
      keepalive: true,
    }).then((response) => {
      if (!response.ok) localStorage.removeItem(`${VIEW_PREFIX}${productSlug}`);
    }).catch(() => localStorage.removeItem(`${VIEW_PREFIX}${productSlug}`));
  }, [productSlug]);
  return null;
}
