import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "CricScore",
    short_name: "CricScore",
    description: "Live cricket scores, fixtures, and personalized feeds.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "browser"],
    orientation: "portrait-primary",
    background_color: "#09090b",
    theme_color: "#09090b",
    categories: ["sports", "news"],
    icons: [
      {
        src: "/icon-cric.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-cric.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/placeholder-wide.svg",
        sizes: "1280x720",
        type: "image/svg+xml",
        form_factor: "wide",
        label: "Live scores (placeholder)",
      },
      {
        src: "/screenshots/placeholder-narrow.svg",
        sizes: "750x1334",
        type: "image/svg+xml",
        form_factor: "narrow",
        label: "Mobile scores (placeholder)",
      },
    ],
  };
}
