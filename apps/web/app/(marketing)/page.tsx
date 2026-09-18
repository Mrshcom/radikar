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
  description:
    "دستیار هوشمند کاریابی برای پیدا کردن فرصت‌های مناسب، تحلیل تطابق رزومه با آگهی، ساخت رزومه هدفمند، تمرین مصاحبه و پیگیری اپلای.",
  applicationSubCategory: "Intelligent Job Search",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: ["fa", "en"],
  offers: [
    { "@type": "Offer", name: "پلن پایه", price: "0", priceCurrency: "IRR" },
    { "@type": "Offer", name: "پلن حرفه‌ای", price: "4990000", priceCurrency: "IRR" },
    { "@type": "Offer", name: "پلن ممتاز", price: "7990000", priceCurrency: "IRR" },
  ],
  publisher: { "@id": `${siteConfig.url}/#organization` },
  featureList: [
    "پیشنهاد فرصت‌های شغلی متناسب",
    "تحلیل تطابق رزومه با آگهی شغلی",
    "ساخت رزومه هدفمند برای هر فرصت",
    "تمرین مصاحبه شغلی با کمک هوش مصنوعی",
    "مدیریت و پیگیری درخواست‌های شغلی",
  ],
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "@id": `${siteConfig.url}/#how-it-works`,
  name: "چطور با رادیکار شغل مناسب پیدا کنیم؟",
  description:
    "مراحل استفاده از رادیکار برای پیدا کردن فرصت شغلی، ساخت رزومه هدفمند و آمادگی مصاحبه.",
  step: [
    { "@type": "HowToStep", position: 1, name: "ساخت پروفایل مسیر شغلی" },
    { "@type": "HowToStep", position: 2, name: "انتخاب یا وارد کردن آگهی شغلی" },
    { "@type": "HowToStep", position: 3, name: "تحلیل تطابق رزومه و آگهی" },
    { "@type": "HowToStep", position: 4, name: "ساخت رزومه هدفمند" },
    { "@type": "HowToStep", position: 5, name: "تمرین مصاحبه و پیگیری اپلای" },
  ],
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
  return <><JsonLd data={softwareSchema} /><JsonLd data={howToSchema} /><JsonLd data={faqSchema} /><HeroSection /><TrustStrip /><WorkflowSection /><FeaturesSection /><DemoSection /><TemplatesSection /><PricingSection /><FaqSection /><FinalCta /></>;
}
