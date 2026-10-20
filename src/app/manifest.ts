import type { MetadataRoute } from "next";

/** Install metadata for Android Chrome and iPhone or iPad Add to Home Screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SparesX",
    short_name: "SparesX",
    description:
      "Marketplace for mobile spare parts. List, find, and request parts from technicians across India.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0d9488",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
