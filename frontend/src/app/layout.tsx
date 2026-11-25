import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";

import { site } from "@/config/site";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const noindex = process.env.NEXT_PUBLIC_NOINDEX === "true";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}: ${site.tagline}`, template: `%s · ${site.shortName}` },
  description: site.description,
  icons: { icon: "/brand/logo-mark.png" },
  robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
  openGraph: { siteName: site.name, type: "website", images: ["/images/illustrations/luke-8-3.jpg"] },
};

export const viewport: Viewport = { themeColor: "#1e1e7a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  );
}
