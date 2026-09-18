import { JsonLd } from "../_components/json-ld";
import { siteConfig } from "@/lib/site";
import { marketingFaqs } from "./_components/marketing-data";
import { DemoSection, FeaturesSection, FaqSection, FinalCta, HeroSection, PricingSection, TemplatesSection, TrustStrip, WorkflowSection } from "./_components/marketing-sections";

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": `${siteConfig.url}/#software`,
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: ["fa", "en"],
  offers: [
    { "@type": "Offer", name: "پلن پایه", price: "0", priceCurrency: "IRR" },
    { "@type": "Offer", name: "پلن حرفه‌ای", price: "4990000", priceCurrency: "IRR" },
    { "@type": "Offer", name: "پلن ممتاز", price: "7990000", priceCurrency: "IRR" },
  ],
  publisher: { "@id": `${siteConfig.url}/#organization` },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: marketingFaqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

export default function MarketingPage() {
  return <><JsonLd data={softwareSchema} /><JsonLd data={faqSchema} /><HeroSection /><TrustStrip /><WorkflowSection /><FeaturesSection /><DemoSection /><TemplatesSection /><PricingSection /><FaqSection /><FinalCta /></>;
}
