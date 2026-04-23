import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PowerFlow",
    short_name: "PowerFlow",
    description: "Mental performance training for powerlifters",
    start_url: "/today",
    display: "standalone",
    background_color: "#050608",
    theme_color: "#050608",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
