import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "carrefourar.vtexassets.com",
      },
      {
        protocol: "https",
        hostname: "www.lareinaonline.com.ar",
      },
      {
        protocol: "http",
        hostname: "www.lareinaonline.com.ar",
      },
    ],
  },
};

export default nextConfig;
