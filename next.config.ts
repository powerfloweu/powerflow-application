import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mux/mux-player-react", "@mux/mux-player", "@mux/playback-core"],
  images: {
    deviceSizes: [320, 420, 640, 768, 1024, 1200, 1920, 2400],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
