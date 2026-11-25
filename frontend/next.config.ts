import type { NextConfig } from "next";

// Staging/preview builds set NEXT_PUBLIC_NOINDEX=true. Production must not (CI guard).
const noindex = process.env.NEXT_PUBLIC_NOINDEX === "true";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          ...(noindex ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : []),
        ],
      },
    ];
  },
};

export default config;
