import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
