import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost:3000", "192.168.0.17", "192.168.0.*"],
  devIndicators: false,
};

export default nextConfig;
