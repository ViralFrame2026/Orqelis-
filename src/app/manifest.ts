import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "ORQELIS", short_name: "ORQELIS", description: "Casa, bazar, regalos y mucho más.", start_url: "/", display: "standalone", background_color: "#fffaf5", theme_color: "#2b211e", lang: "es-AR", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] };
}
