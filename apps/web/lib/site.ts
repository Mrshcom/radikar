import type { Metadata } from "next";

export const siteConfig = {
  name: "رادیکار",
  legalName: "رادیکار",
  url: "https://radikar.ir",
  locale: "fa_IR",
  language: "fa",
  title: "کاریابی هوشمند با هوش مصنوعی | رادیکار",
  description:
    "با رادیکار فرصت‌های مناسب را پیدا کن، تطابق رزومه با آگهی را بسنج، برای هر شغل رزومه هدفمند بساز و برای مصاحبه آماده شو.",
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
          alt: "رادیکار؛ دستیار هوشمند کاریابی از فرصت تا مصاحبه",
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
