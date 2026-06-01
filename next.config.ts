import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  experimental: {
    turbopackImportTypeText: true,
  },
  turbopack: {
    root: process.cwd(),
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.txt$/i,
      type: "asset/source",
    });

    return config;
  },
};

export default nextConfig;
