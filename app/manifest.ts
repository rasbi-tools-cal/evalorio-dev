import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Evalorio",
    short_name: "Evalorio",
    description: "Homes for sale and rent in Spain, France, Italy and Portugal.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#006948",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-touch-icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  }
}
