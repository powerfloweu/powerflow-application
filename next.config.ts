import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mux/mux-player-react", "@mux/mux-player", "@mux/playback-core"],
  images: {
    deviceSizes: [320, 420, 640, 768, 1024, 1200, 1920, 2400],
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      {
        // Every SAT result email sent between April and September 2026 linked
        // to /tests/sat/..., which has never existed — the pages live under
        // /tests/self-awareness. Fixing the builder only helps future emails;
        // this rescues the links already sitting in people's inboxes, several
        // of whom paid for the report. Query strings (?ref=) carry over.
        source: "/tests/sat/:path*",
        destination: "/tests/self-awareness/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
