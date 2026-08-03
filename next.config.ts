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
    remotePatterns: [
      {
        protocol: "https" as const,
        hostname: "wm6vuzwpg65hpvqy.public.blob.vercel-storage.com",
      },
      {
        protocol: "https" as const,
        hostname: "*.public.blob.vercel-storage.com",
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
  // Collapse duplicate listing/detail routes onto one canonical pattern.
  async redirects() {
    return [
      { source: "/browse", destination: "/products", permanent: true },
      { source: "/products/:id", destination: "/product/:id", permanent: true },
    ];
  },
};

export default nextConfig;
