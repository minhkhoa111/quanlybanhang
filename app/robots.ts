import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/manager/", "/manger/", "/staff/", "/quan-ly/", "/api/"],
    },
    sitemap: "https://infinityshop.click/sitemap.xml",
    host: "https://infinityshop.click",
  };
}
