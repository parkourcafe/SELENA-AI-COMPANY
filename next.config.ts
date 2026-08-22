import type { NextConfig } from "next";
import { publicSecurityHeaders } from "./lib/security-headers";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: process.cwd(),
  async rewrites() {
    return [
      {
        source: "/workshop",
        destination: "/workshop.html",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/en",
        destination: "/",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: publicSecurityHeaders(process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.selenasystems.com"),
      },
    ];
  },
};

export default nextConfig;
