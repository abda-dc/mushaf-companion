import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mushaf Companion — Faithful Quran Reading",
  description: "A calm, page-faithful digital mushaf with all 604 Quran pages, authenticated Uthmani text, tajweed guidance, transliteration, bookmarks, and recitation.",
  applicationName: "Mushaf Companion",
  other: {
    google: "notranslate",
  },
  openGraph: {
    title: "Mushaf Companion",
    description: "All 604 pages. The mushaf, faithfully reimagined.",
    type: "website",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Mushaf Companion" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mushaf Companion",
    description: "All 604 pages. The mushaf, faithfully reimagined.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
