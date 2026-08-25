import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The product photos are local files in /public. Serving them directly keeps
  // the development server reliable on a normal Mac as well as on Sites.
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
