import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3003";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: "مسیر | دستیار هوشمند کاریابی",
    description: "پنل هوشمند ساخت رزومه، تطبیق فرصت‌های شغلی و مدیریت اپلای",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "مسیر | دستیار هوشمند مسیر شغلی تو",
      description: "رزومه‌ات را بساز، فرصت مناسب را پیدا کن و هوشمندانه اپلای کن.",
      images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: "پنل هوشمند مسیر" }],
      locale: "fa_IR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "مسیر | دستیار هوشمند مسیر شغلی تو",
      description: "رزومه‌ات را بساز، فرصت مناسب را پیدا کن و هوشمندانه اپلای کن.",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
