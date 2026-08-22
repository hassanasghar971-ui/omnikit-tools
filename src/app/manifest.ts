import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OmniKit Tools — 750 Free On-Device Tools",
    short_name: "OmniKit",
    description:
      "750+ free online tools running 100% on-device. Zero uploads, zero servers, full offline support.",
    id: "/",
    start_url: "/",
    display: "standalone",
    background_color: "#080C14",
    theme_color: "#080C14",
    orientation: "any",
    categories: ["utilities", "developer tools", "productivity"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "192x192", type: "image/svg+xml", purpose: "maskable" },
      { src: "/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "JSON Formatter", url: "/tools/json-formatter", icons: [{ src: "/icon.svg", sizes: "any" }] },
      { name: "All Tools", url: "/tools", icons: [{ src: "/icon.svg", sizes: "any" }] },
    ],
  };
}
