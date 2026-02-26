import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["firebase-admin"],
  /*
  eslint: {
    ignoreDuringBuilds: true,
  }
  */
};

export default nextConfig;
