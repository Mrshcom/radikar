import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "رادیکار؛ دستیار هوشمند مسیر شغلی",
    short_name: "رادیکار",
    description:
      "ساخت رزومه، تطبیق با آگهی شغلی، تمرین مصاحبه و مدیریت اپلای",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7f2",
    theme_color: "#0f5b42",
    lang: "fa",
    dir: "rtl",
    icons: [
      {
        src: "/radikar-logo.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
