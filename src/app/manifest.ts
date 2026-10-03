import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Domiyo",
    short_name: "Domiyo",
    description: "Organize a rotina do household em um só lugar.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#382344",
    theme_color: "#382344",
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}