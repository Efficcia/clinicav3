import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Static export - client-side only (fast like localhost)
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
