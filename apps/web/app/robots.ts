import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

const privatePaths = [
  "/api/",
  "/v1/",
  "/login",
  "/admin/",
  "/dashboard",
  "/account",
  "/settings",
  "/orders",
  "/resumes",
  "/jobs",
  "/applications",
  "/match",
  "/interview",
  "/knowledge-base",
  "/upgrade",
  "/billing/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: privatePaths },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: privatePaths },
      { userAgent: "ChatGPT-User", allow: "/", disallow: privatePaths },
      { userAgent: "Claude-SearchBot", allow: "/", disallow: privatePaths },
      { userAgent: "Claude-User", allow: "/", disallow: privatePaths },
      { userAgent: "PerplexityBot", allow: "/", disallow: privatePaths },
      { userAgent: "Perplexity-User", allow: "/", disallow: privatePaths },
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "ClaudeBot", disallow: "/" },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
