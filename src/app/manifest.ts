import type { MetadataRoute } from "next";

// Web App Manifest — makes the portal installable on phones (Add to Home Screen).
// Next serves this at /manifest.webmanifest and links it automatically.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PSP Portal",
    short_name: "PSP",
    description: "Deposit portal — Whish Pay + MT5",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#03100f",
    theme_color: "#03100f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
