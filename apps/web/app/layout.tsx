import type { Metadata } from "next";
import type { Viewport } from "next";
import "@fontsource-variable/vazirmatn";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "./globals.css";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0f5b42",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className="scroll-smooth bg-[#f6f7f2] motion-reduce:scroll-auto" lang="fa" dir="rtl" data-scroll-behavior="smooth">
      <body
        className="m-0 bg-[#f6f7f2] font-sans text-[#19312f]"
      >
        {children}
      </body>
    </html>
  );
}
