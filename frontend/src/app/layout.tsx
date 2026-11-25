import type { Metadata, Viewport } from "next";
import { Outfit, Playfair_Display } from "next/font/google";

import { site } from "@/config/site";
import { asset } from "@/lib/static";
import "@/styles/globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
// Serif italic used only for accent words in headlines.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["italic"],
  variable: "--font-playfair",
  display: "swap",
});

const noindex = process.env.NEXT_PUBLIC_NOINDEX === "true";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}: ${site.tagline}`, template: `%s · ${site.shortName}` },
  description: site.description,
  icons: { icon: asset("/brand/logo-mark.png") },
  robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
  openGraph: { siteName: site.name, type: "website", images: ["/images/illustrations/luke-8-3.jpg"] },
};

export const viewport: Viewport = { themeColor: "#14145a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${outfit.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
