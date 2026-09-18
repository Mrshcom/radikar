import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

const publicRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/resume-builder", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/ai-resume-builder", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/resume-job-match", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/interview-practice", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/application-tracker", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/guides", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-09-18T00:00:00+03:30");

  return publicRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
