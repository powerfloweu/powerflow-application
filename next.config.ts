import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mux/mux-player-react", "@mux/mux-player", "@mux/playback-core"],
};

export default nextConfig;
