import "./globals.css";
import type { Metadata, Viewport } from "next";
import { RegisterSW } from "@/components/RegisterSW";

export const metadata: Metadata = {
  title: "PSP Portal",
  description: "Deposit portal — Rival / Whish Pay + MT5",
  applicationName: "PSP Portal",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "PSP Portal",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#1f6feb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
