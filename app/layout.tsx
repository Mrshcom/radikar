import type { Metadata } from "next";
import localFont from "next/font/local";
import "@fontsource-variable/vazirmatn";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "./globals.css";

const matrixMono = localFont({
  src: "../node_modules/next/dist/next-devtools/server/font/geist-mono-latin.woff2",
  display: "swap",
  variable: "--font-matrix-mono",
});

export const metadata: Metadata = {
  title: "رادیکار | دستیار هوشمند کاریابی",
  description: "پنل هوشمند ساخت رزومه، تطبیق فرصت‌های شغلی و مدیریت اپلای",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "رادیکار | دستیار هوشمند مسیر شغلی تو",
    description:
      "رزومه‌ات را بساز، فرصت مناسب را پیدا کن و هوشمندانه اپلای کن.",
    locale: "fa_IR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "رادیکار | دستیار هوشمند مسیر شغلی تو",
    description:
      "رزومه‌ات را بساز، فرصت مناسب را پیدا کن و هوشمندانه اپلای کن.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className="bg-[#f6f7f2]" lang="fa" dir="rtl">
      <body
        className={`${matrixMono.variable} m-0 bg-[#f6f7f2] font-sans text-[#19312f]`}
      >
        {children}
      </body>
    </html>
  );
}
