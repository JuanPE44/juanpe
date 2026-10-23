import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site (out/), deployable to any static host.
  output: "export",
  images: { unoptimized: true },
  // The dev-only route indicator sat on top of the bench's bottom-left hint; build errors still surface.
  devIndicators: false,
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
