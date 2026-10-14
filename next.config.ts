import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site (out/), deployable to any static host.
  output: "export",
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
