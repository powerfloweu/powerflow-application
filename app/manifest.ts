import type { MetadataRoute } from "next";

/**
 * Single source of truth for the PWA manifest (served at /manifest.webmanifest).
 *
 * There used to ALSO be a static public/manifest.webmanifest — files in
 * public/ take precedence over Next's generated routes, so that static file
 * was silently shadowing this one in production, serving its stale
 * start_url: "/" (this route correctly uses "/today") on every install.
 * The static file has been removed; this route now carries every value it
 * had (description, scope, theme/background colors, icon purposes,
 * apple-touch-icon) so nothing was lost in the merge.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PowerFlow",
    short_name: "PowerFlow",
    description: "Mental performance training for powerlifters — journal, course, and coaching tools.",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#7c3aed",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
