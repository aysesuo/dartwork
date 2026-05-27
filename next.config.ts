import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  async redirects() {
    return [
      {
        source: "/dartwork",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
