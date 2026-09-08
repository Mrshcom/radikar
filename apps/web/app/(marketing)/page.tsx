import { DemoSection, FeaturesSection, FaqSection, FinalCta, HeroSection, MarketingFooter, MarketingHeader, PricingSection, TemplatesSection, TrustStrip, WorkflowSection } from "./_components/marketing-sections";

export default function MarketingPage() {
  return <><MarketingHeader /><main><HeroSection /><TrustStrip /><WorkflowSection /><FeaturesSection /><DemoSection /><TemplatesSection /><PricingSection /><FaqSection /><FinalCta /></main><MarketingFooter /></>;
}
