import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return [
      {
        source: "/h/:slug",
        destination: `${apiUrl}/h/:slug`,
      },
    ];
  },
};

export default nextConfig;
