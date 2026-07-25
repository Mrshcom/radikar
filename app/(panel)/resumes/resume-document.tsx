import { Globe2, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";
import type { ResumeData } from "./resume-data";

type ResumeDocumentProps = {
  templateId: string;
  data: ResumeData;
  compact?: boolean;
};

const twoColumnTemplates = new Set([
  "two-professional",
  "two-clean",
  "two-corporate",
  "two-clear",
  "two-balanced",
  "two-essential",
  "two-polished",
  "two-harmonized",
  "two-defined",
  "two-industrial",
  "two-elegant",
  "two-modern",
  "two-creative",
  "two-visionary",
  "sector-orange",
  "sector-yellow",
  "sector-turquoise",
  "sector-green",
]);

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

function ContactDetails({ data, className }: { data: ResumeData; className: string }) {
  return (
    <div className={className}>
      <span><Mail size={11} />{data.email}</span>
      <span><Phone size={11} />{data.phone}</span>
      <span><MapPin size={11} />{data.location}</span>
      <span><Globe2 size={11} />{data.website}</span>
    </div>
  );
}

function ProfilePhoto({ data, className }: { data: ResumeData; className: string }) {
  const initials = getInitials(data.fullName);

  return (
    <div className={className}>
      {data.photoUrl
        ? <Image src={data.photoUrl} alt={`تصویر ${data.fullName}`} width={240} height={240} unoptimized />
        : initials}
    </div>
  );
}

function ExperienceSection({ data, bullets }: { data: ResumeData; bullets: string[] }) {
  return (
    <section className="resume-experience-section">
      <h2>سوابق حرفه‌ای</h2>
      <div className="resume-position">
        <div>
          <h3>{data.experienceTitle}</h3>
          <strong>{data.company}</strong>
        </div>
        <time>{data.experienceDate}</time>
      </div>
      <ul>{bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
    </section>
  );
}

function StandardResume({ templateId, data, compact }: ResumeDocumentProps) {
  const skills = data.skills.split(/،|,/).map((skill) => skill.trim()).filter(Boolean);
  const bullets = data.experience.split("\n").filter(Boolean);

  return (
    <article className={`resume-document template-${templateId} ${compact ? "resume-thumbnail" : "resume-print-area"}`}>
      <header className="resume-doc-header">
        <ProfilePhoto data={data} className="resume-avatar" />
        <div className="resume-identity">
          <h1>{data.fullName || "\u00a0"}</h1>
          <p>{data.jobTitle || "\u00a0"}</p>
        </div>
        <ContactDetails data={data} className="resume-contact" />
      </header>
      <div className="resume-doc-body">
        <aside className="resume-doc-side">
          <section><h2>مهارت‌ها</h2><div className="resume-skills">{skills.map((skill) => <span key={skill}>{skill}</span>)}</div></section>
          <section><h2>تحصیلات</h2><p>{data.education}</p></section>
          <section><h2>زبان‌ها</h2><p>{data.languages}</p></section>
        </aside>
        <div className="resume-doc-main">
          <section><h2>درباره من</h2><p>{data.summary}</p></section>
          <ExperienceSection data={data} bullets={bullets} />
        </div>
      </div>
    </article>
  );
}

function TwoColumnResume({ templateId, data, compact }: ResumeDocumentProps) {
  const skills = data.skills.split(/،|,/).map((skill) => skill.trim()).filter(Boolean);
  const bullets = data.experience.split("\n").filter(Boolean);

  return (
    <article className={`resume-document two-column-document template-${templateId} ${compact ? "resume-thumbnail" : "resume-print-area"}`}>
      <div className="two-resume-accent" aria-hidden="true" />
      <header className="two-resume-header">
        <ProfilePhoto data={data} className="two-resume-avatar" />
        <div className="two-resume-identity">
          <h1>{data.fullName || "\u00a0"}</h1>
          <p>{data.jobTitle || "\u00a0"}</p>
        </div>
        <ContactDetails data={data} className="two-resume-header-contact" />
      </header>

      <div className="two-resume-layout">
        <aside className="two-resume-sidebar">
          <ContactDetails data={data} className="two-resume-contact" />
          <section className="two-resume-skills-section">
            <h2>مهارت‌ها</h2>
            <div className="two-resume-skills">{skills.map((skill, index) => <span key={skill} style={{ "--skill-level": `${96 - index * 7}%` } as CSSProperties}>{skill}</span>)}</div>
          </section>
          <section className="two-resume-languages"><h2>زبان‌ها</h2><p>{data.languages}</p></section>
        </aside>

        <div className="two-resume-main">
          <section className="two-resume-summary"><h2>درباره من</h2><p>{data.summary}</p></section>
          <ExperienceSection data={data} bullets={bullets} />
          <section className="two-resume-education"><h2>تحصیلات</h2><p>{data.education}</p></section>
        </div>
      </div>
    </article>
  );
}

function ColorSplashResume({ data, compact }: ResumeDocumentProps) {
  const skills = data.skills.split(/،|,/).map((skill) => skill.trim()).filter(Boolean);
  const bullets = data.experience.split("\n").filter(Boolean);

  return (
    <article className={`resume-document color-splash-document template-two-color-splash ${compact ? "resume-thumbnail" : "resume-print-area"}`}>
      <div className="splash-shape splash-shape-pink" aria-hidden="true" />
      <div className="splash-shape splash-shape-green" aria-hidden="true" />
      <div className="splash-shape splash-shape-blue" aria-hidden="true" />

      <header className="splash-header">
        <div className="splash-identity">
          <h1>{data.fullName}</h1>
          <p>{data.jobTitle}</p>
        </div>
        <ProfilePhoto data={data} className="splash-photo" />
      </header>

      <div className="splash-intro">
        <section>
          <h2>درباره من</h2>
          <p>{data.summary}</p>
        </section>
        <div className="splash-contact">
          <strong>{data.phone}</strong>
          <span>{data.email}</span>
        </div>
      </div>

      <div className="splash-content">
        <ExperienceSection data={data} bullets={bullets} />
        <section className="splash-skills">
          <h2>مهارت‌ها</h2>
          <div>{skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
        </section>
      </div>
    </article>
  );
}

function OrganicPortraitResume({ data, compact }: ResumeDocumentProps) {
  const skills = data.skills.split(/،|,/).map((skill) => skill.trim()).filter(Boolean);
  const bullets = data.experience.split("\n").filter(Boolean);

  return (
    <article className={`resume-document organic-portrait-document template-organic-photographer ${compact ? "resume-thumbnail" : "resume-print-area"}`}>
      <header className="organic-portrait-header">
        <div className="organic-portrait-heading">
          <h1>{data.fullName}</h1>
          <strong>{data.jobTitle}</strong>
          <p>{data.summary}</p>
        </div>
        <div className="organic-portrait-photo-wrap">
          <ProfilePhoto data={data} className="organic-portrait-photo" />
          <span className="organic-photo-shape" aria-hidden="true" />
        </div>
      </header>

      <div className="organic-portrait-layout">
        <div className="organic-portrait-main">
          <ExperienceSection data={data} bullets={bullets} />
          <section className="organic-portrait-education"><h2>تحصیلات</h2><p>{data.education}</p></section>
        </div>
        <aside className="organic-portrait-side">
          <section><h2>اطلاعات تماس</h2><ContactDetails data={data} className="organic-portrait-contact" /></section>
          <section><h2>مهارت‌ها</h2><div className="organic-portrait-skills">{skills.slice(0, 5).map((skill) => <span key={skill}>{skill}</span>)}</div></section>
        </aside>
      </div>

      <div className="organic-side-art" aria-hidden="true"><i /><i /><i /></div>
      <div className="organic-footer-art" aria-hidden="true"><i /><i /><i /><i /><i /></div>
    </article>
  );
}

export function ResumeDocument(props: ResumeDocumentProps) {
  if (props.templateId === "two-color-splash") return <ColorSplashResume {...props} />;
  if (props.templateId === "photo-creative" || props.templateId === "organic-photographer") return <OrganicPortraitResume {...props} />;

  return twoColumnTemplates.has(props.templateId)
    ? <TwoColumnResume {...props} />
    : <StandardResume {...props} />;
}
