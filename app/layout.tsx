import type { Metadata } from "next";
import "@fontsource-variable/vazirmatn";
import "./globals.css";

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
      <body className="m-0 bg-[#f6f7f2] font-['Vazirmatn_Variable',Vazirmatn,Tahoma,Arial,sans-serif] text-[#19312f]">
        {children}
      </body>
    </html>
  );
}
