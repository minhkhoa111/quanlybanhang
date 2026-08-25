"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const revealSelector = [
  "main > section:not(.account-panel)",
  "main > .shell",
  ".product-grid > *",
  ".brand-chooser > *",
  ".service-grid > *",
  ".decision-list > *",
  ".footer-grid > *",
  ".finance-partner",
  ".admin-metric",
  ".admin-card",
  ".admin-table-wrap",
].join(",");

export default function MotionSystem({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elements = Array.from(document.querySelectorAll<HTMLElement>(revealSelector));

    elements.forEach((element, index) => {
      element.dataset.motionReveal = "";
      element.style.setProperty("--reveal-order", String(index % 6));
    });

    document.body.classList.add("motion-ready");

    if (reducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -7% 0px" },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pathname]);

  return <div key={pathname || "page"} className="route-stage">{children}</div>;
}
