import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd } from "../_components/json-ld";
import { createPageMetadata, siteConfig } from "@/lib/site";
import {
  MarketingFooter,
  MarketingHeader,
} from "./_components/marketing-sections";

export const metadata: Metadata = createPageMetadata({
  title: siteConfig.title,
  description: siteConfig.description,
  path: "/",
});

metadata.title = { absolute: siteConfig.title };

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteConfig.url}/#organization`,
  name: siteConfig.name,
  legalName: siteConfig.legalName,
  url: siteConfig.url,
  logo: `${siteConfig.url}/radikar-logo.png`,
  description: siteConfig.description,
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteConfig.url}/#website`,
  name: siteConfig.name,
  url: siteConfig.url,
  inLanguage: siteConfig.language,
  publisher: { "@id": `${siteConfig.url}/#organization` },
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f8f3] text-[#19312f]">
      <JsonLd data={organizationSchema} />
      <JsonLd data={websiteSchema} />
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
