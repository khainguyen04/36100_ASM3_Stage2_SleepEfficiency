import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // static site in out/ (no server needed)
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
