import type { Metadata } from "next";

export const siteConfig = {
  name: "رادیکار",
  legalName: "رادیکار",
  url: "https://radikar.ir",
  locale: "fa_IR",
  language: "fa",
  title: "رادیکار | رزومه‌ساز هوشمند و دستیار کاریابی",
  description:
    "با رادیکار رزومه فارسی یا انگلیسی بساز، میزان تطابق رزومه با آگهی شغلی را بسنج، برای مصاحبه آماده شو و مسیر اپلای‌هایت را یکپارچه مدیریت کن.",
  ogImage: "/og.jpg",
} as const;

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

export function createPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const canonical = absoluteUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "fa-IR": canonical,
        "x-default": canonical,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
      images: [
        {
          url: absoluteUrl(siteConfig.ogImage),
          width: 1200,
          height: 630,
          alt: "رادیکار؛ رزومه‌ساز هوشمند و دستیار کاریابی",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(siteConfig.ogImage)],
    },
  };
}
