import type { NextConfig } from "next";

/**
 * CSP is Report-Only for private beta so auth/chat/images/analytics are not
 * blocked while violations remain visible in browser consoles.
 * Enforce after manual QA clears Report-Only violations.
 *
 * Allowed surface (intentional):
 * - scripts: self + Next inline/eval + Google GIS + gstatic
 * - images: self, data, blob, Vercel Blob, Google avatars
 * - connect: self, https, wss (Socket.io / Sentry / APIs)
 * - frames: Google accounts (GSI)
 * - fonts: self + data (system stack; no SF Pro host)
 */
const cspReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://www.gstatic.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.google.com https://www.googletagservices.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://*.googleusercontent.com https://lh3.googleusercontent.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com",
  "font-src 'self' data:",
  "connect-src 'self' https: wss: ws:",
  "frame-src 'self' https://accounts.google.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://pagead2.googlesyndication.com",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

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
  {
    key: "Content-Security-Policy-Report-Only",
    value: cspReportOnly,
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Keep sharp as a native Node module — bundling it breaks image uploads on Vercel.
  serverExternalPackages: ["sharp"],
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
      // Legacy seller dashboard → technician hub (Phase 1 consolidation)
      {
        source: "/dashboard/seller",
        destination: "/technician/dashboard",
        permanent: true,
      },
      {
        source: "/dashboard/seller/listings",
        destination: "/technician/products",
        permanent: true,
      },
      {
        source: "/dashboard/seller/add",
        destination: "/technician/products/new",
        permanent: true,
      },
      {
        source: "/dashboard/seller/messages",
        destination: "/messages",
        permanent: true,
      },
      {
        source: "/dashboard/seller/profile",
        destination: "/technician/profile",
        permanent: true,
      },
      {
        source: "/dashboard/seller/verification",
        destination: "/technician/profile",
        permanent: true,
      },
      // Phase 2 — public "seller" routes → technician terminology
      {
        source: "/sellers",
        destination: "/technicians",
        permanent: true,
      },
      {
        source: "/seller-guidelines",
        destination: "/technician-guidelines",
        permanent: true,
      },
      {
        source: "/admin/technicians",
        destination: "/admin/users",
        permanent: true,
      },
      // www is canonical. Explicit 308 so Google treats this as permanent
      // (Vercel’s Domains UI redirect is a 307 and does not pass ranking).
      {
        source: "/:path*",
        has: [{ type: "host", value: "sparesx.com" }],
        destination: "https://www.sparesx.com/:path*",
        statusCode: 308,
      },
    ];
  },
};

export default nextConfig;
