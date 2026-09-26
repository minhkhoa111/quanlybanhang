import type { MetadataRoute } from "next";

const siteUrl = "https://infinityshop.click";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/iphone", "/ipad", "/macbook", "/macbook-air", "/mac-mini-studio", "/imac", "/android", "/laptop", "/phu-kien", "/dat-truoc", "/bao-hanh", "/tra-gop", "/tu-van"];
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : route === "/iphone" || route === "/macbook" || route === "/macbook-air" || route === "/dat-truoc" ? 0.9 : 0.7,
  }));
}
