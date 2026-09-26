import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The product photos are local files in /public. Serving them directly keeps
  // the development server reliable on a normal Mac as well as on Sites.
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      // Allows several original-quality product images in one admin save.
      // Individual files are still capped and signature-checked server-side.
      bodySizeLimit: "80mb",
    },
  },
};

export default nextConfig;
