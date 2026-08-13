import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // AVIF first, WebP fallback — listing grids are image-heavy on mobile.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https" as const,
        hostname: "wm6vuzwpg65hpvqy.public.blob.vercel-storage.com",
      },
      {
        protocol: "https" as const,
        hostname: "*.public.blob.vercel-storage.com",
      },
      // Google Sign-In profile photos
      {
        protocol: "https" as const,
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https" as const,
        hostname: "*.googleusercontent.com",
      },
      // Local development support for image uploads
      ...(process.env.NODE_ENV === "development"
        ? [
            {
              protocol: "http" as const,
              hostname: "localhost",
            },
          ]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  // Collapse duplicate listing/detail routes and hosts onto one canonical form.
  async redirects() {
    return [
      { source: "/browse", destination: "/products", permanent: true },
      { source: "/products/:id", destination: "/product/:id", permanent: true },
      // www is canonical, so the bare apex must not serve the site too.
      {
        source: "/:path*",
        has: [{ type: "host", value: "sparesx.com" }],
        destination: "https://www.sparesx.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
