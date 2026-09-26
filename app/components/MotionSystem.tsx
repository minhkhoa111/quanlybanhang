"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const revealSelector = [
  "main > section:not(.account-panel):not(.catalog-products-section):not(.product-detail):not(.product-launch-hero):not(.shop-categories):not(.cps-block-section):not(.cps-commitments):not(:has(.cps-flashsale-section))",
  "main > .shell:not(.product-detail)",
  ".catalog-products-heading",
  ".catalog-offers",
  ".student-promotion",
  ".catalog-toolbar",
  ".catalog-result-count",
  ".product-grid > *",
  ".product-detail > *",
  ".brand-chooser > *",
  ".service-grid > *",
  ".decision-list > *",
  ".footer-grid > *",
  ".finance-partner",
  ".shop-intro",
  ".shop-section-heading",
  ".shop-category-grid > *",
  ".cps-block-header",
  ".cps-block-grid > *",
  ".cps-flashsale-header",
  ".cps-flashsale-grid > *",
  ".cps-commitments-grid > *",
].join(",");

export default function MotionSystem({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const operationalPortal = /^\/(admin(?:-login|\/|$)|manager(?:\/|$)|manger(?:\/|$)|staff(?:\/|$)|quan-ly(?:\/|$))/.test(pathname || "");

  useEffect(() => {
    if (operationalPortal) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const elements = new Set<HTMLElement>();
    const reveal = (element: HTMLElement) => {
      element.classList.add("is-revealed");
      observer?.unobserve(element);
    };
    const observer = "IntersectionObserver" in window ? new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) reveal(entry.target as HTMLElement);
      }),
      { threshold: 0, rootMargin: "0px 0px -24px 0px" },
    ) : null;

    const register = () => {
      // Filtering replaces cards without changing the route. Register only new
      // nodes, and release removed ones instead of retaining a growing list.
      elements.forEach((element) => {
        if (!element.isConnected) {
          observer?.unobserve(element);
          elements.delete(element);
        }
      });
      document.querySelectorAll<HTMLElement>(revealSelector).forEach((element) => {
        if (elements.has(element)) return;
        elements.add(element);
        element.dataset.motionReveal = "";
        const siblings = element.parentElement ? Array.from(element.parentElement.children) : [];
        const order = Math.max(0, siblings.indexOf(element));
        element.style.setProperty("--reveal-order", String(order % 5));
        if (element.closest(".storefront-refresh")) {
          element.dataset.motionDirection = element.matches(".shop-intro, .cps-flashsale-header") ? "down"
            : element.matches(".shop-section-heading, .cps-block-header") ? "left"
            : element.matches(".storefront-member-assurance") ? "right"
            : ["left", "up", "down", "right"][order % 4];
        }
        if (preference.matches || !observer || element.contains(document.activeElement)) reveal(element);
        else observer.observe(element);
      });
    };
    const showFocused = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      let element = event.target.closest<HTMLElement>("[data-motion-reveal]");
      while (element) {
        reveal(element);
        element = element.parentElement?.closest<HTMLElement>("[data-motion-reveal]") ?? null;
      }
    };
    const preferenceChanged = () => {
      if (preference.matches) elements.forEach(reveal);
    };

    document.body.classList.add("motion-ready");
    register();
    const mutations = new MutationObserver((records) => {
      if (records.some((record) => [...record.addedNodes, ...record.removedNodes].some((node) => node instanceof Element))) register();
    });
    mutations.observe(document.querySelector(".route-stage") ?? document.body, { childList: true, subtree: true });
    document.addEventListener("focusin", showFocused);
    preference.addEventListener("change", preferenceChanged);
    return () => {
      observer?.disconnect();
      mutations.disconnect();
      document.removeEventListener("focusin", showFocused);
      preference.removeEventListener("change", preferenceChanged);
      document.body.classList.remove("motion-ready");
      elements.forEach((element) => {
        delete element.dataset.motionReveal;
        delete element.dataset.motionDirection;
        element.classList.remove("is-revealed");
        element.style.removeProperty("--reveal-order");
      });
    };
  }, [pathname, operationalPortal]);

  return <div key={pathname || "page"} className={operationalPortal ? "route-stage route-stage-static" : "route-stage"}>{children}</div>;
}
