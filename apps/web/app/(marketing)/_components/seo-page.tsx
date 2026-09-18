import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { JsonLd } from "../../_components/json-ld";
import { absoluteUrl, siteConfig } from "@/lib/site";

export type SeoSection = {
  heading: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
};

type SeoFaq = { question: string; answer: string };

export function SeoPage({
  path,
  eyebrow,
  title,
  intro,
  answer,
  sections,
  faqs = [],
  cta = "رایگان شروع کن",
}: {
  path: string;
  eyebrow: string;
  title: string;
  intro: string;
  answer: string;
  sections: readonly SeoSection[];
  faqs?: readonly SeoFaq[];
  cta?: string;
}) {
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${absoluteUrl(path)}#webpage`,
    url: absoluteUrl(path),
    name: title,
    description: intro,
    inLanguage: siteConfig.language,
    isPartOf: { "@id": `${siteConfig.url}/#website` },
    about: { "@id": `${siteConfig.url}/#software` },
  };
  const faqSchema = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      }
    : null;

  return (
    <>
      <JsonLd data={webPageSchema} />
      {faqSchema ? <JsonLd data={faqSchema} /> : null}
      <article className="mx-auto w-full max-w-[960px] px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
        <nav aria-label="مسیر صفحه" className="mb-8 text-xs text-[#52645e]">
          <Link href="/" className="hover:text-[#0f6b4c]">رادیکار</Link>
          <span aria-hidden="true" className="mx-2">/</span>
          <span aria-current="page">{eyebrow}</span>
        </nav>
        <header className="rounded-[32px] border border-[#d8e8df] bg-white p-7 shadow-[0_24px_70px_rgba(20,70,52,.08)] sm:p-12">
          <p className="text-xs font-black text-[#0b704c]">{eyebrow}</p>
          <h1 className="mt-4 text-3xl font-black leading-[1.55] text-[#17201e] sm:text-5xl">{title}</h1>
          <p className="mt-6 max-w-3xl text-sm leading-8 text-[#52645e] sm:text-base">{intro}</p>
          <div className="mt-8 rounded-2xl border border-[#b9ddca] bg-[#edf8f2] p-5">
            <h2 className="text-sm font-black text-[#15563f]">پاسخ کوتاه</h2>
            <p className="mt-2 text-sm leading-8 text-[#294a3e]">{answer}</p>
          </div>
        </header>

        <div className="mt-12 space-y-12">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-black leading-[1.6] text-[#17201e]">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-4 text-sm leading-8 text-[#465a53]">{paragraph}</p>
              ))}
              {section.bullets?.length ? (
                <ul className="mt-5 grid gap-3 p-0">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 rounded-2xl border border-[#dce8e1] bg-white p-4 text-sm leading-7 text-[#344b43]">
                      <CheckCircle2 aria-hidden="true" className="mt-1 shrink-0 text-[#14805a]" size={18} />
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        {faqs.length ? (
          <section className="mt-14" aria-labelledby="page-faq-title">
            <h2 id="page-faq-title" className="text-2xl font-black text-[#17201e]">سؤال‌های پرتکرار</h2>
            <div className="mt-6 space-y-3">
              {faqs.map((faq) => (
                <details key={faq.question} className="rounded-2xl border border-[#dce8e1] bg-white p-5">
                  <summary className="cursor-pointer font-black text-[#203c33]">{faq.question}</summary>
                  <p className="mt-4 text-sm leading-8 text-[#52645e]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <aside className="mt-16 rounded-[28px] bg-[#0b3d2e] p-8 text-white sm:flex sm:items-center sm:justify-between">
          <div><h2 className="text-2xl font-black">مسیر شغلی‌ات را هدفمندتر ادامه بده</h2><p className="mt-3 text-sm leading-7 text-white/80">پروفایل حرفه‌ای بساز و ابزارهای رادیکار را در یک جریان یکپارچه امتحان کن.</p></div>
          <Link href="/login" className="mt-6 inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-[#b9f2d3] px-6 text-sm font-black text-[#0b3c2d] sm:mt-0">{cta}<ArrowLeft size={16} /></Link>
        </aside>
      </article>
    </>
  );
}
