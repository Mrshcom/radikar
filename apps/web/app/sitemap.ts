import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

const publicRoutes = [
  "/",
  "/resume-builder",
  "/ai-resume-builder",
  "/resume-job-match",
  "/interview-practice",
  "/application-tracker",
  "/guides",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((path) => ({ url: absoluteUrl(path) }));
}
