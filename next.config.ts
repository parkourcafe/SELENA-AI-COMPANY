import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [
      {
        source: "/en",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
