import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed 'output: export' for Vercel deployment (enables SSR/ISR)
  // This fixes Supabase session timeout issues on page refresh
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
