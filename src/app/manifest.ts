import type { MetadataRoute } from "next";

// Web App Manifest — makes the portal installable on phones (Add to Home Screen).
// Next serves this at /manifest.webmanifest and links it automatically.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GivTrade",
    short_name: "GivTrade",
    description: "Fund your MT5 account securely via Whish Pay",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a1620",
    theme_color: "#0a1620",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
