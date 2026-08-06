import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "./pwa-register";

export const metadata: Metadata = {
  title: "Mushaf Companion — Faithful Quran Reading",
  description: "A calm, page-faithful digital mushaf with all 604 Quran pages, Hifz tools, verified offline recitation, translation, and source-attributed tafsir.",
  applicationName: "Mushaf Companion",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mushaf",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    google: "notranslate",
  },
  openGraph: {
    title: "Mushaf Companion",
    description: "All 604 pages, with verified learning, memorization, recitation, and tafsir layers.",
    type: "website",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Mushaf Companion" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mushaf Companion",
    description: "All 604 pages, with verified learning, memorization, recitation, and tafsir layers.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f3028",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
