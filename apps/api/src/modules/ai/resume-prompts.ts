import type { JsonObject } from "./helpers";

export type ResumeOutputLanguage = "fa" | "en";

const languageName = (language: ResumeOutputLanguage) =>
  language === "en" ? "English" : "Persian (فارسی)";

export function resumeGenerationSystemPrompt(language: ResumeOutputLanguage) {
  return `You are an executive resume writer and ATS (Applicant Tracking System) optimization specialist. Write the resume entirely in ${languageName(language)}. Return valid JSON only, with no Markdown, commentary, tables, HTML, columns, icons, ratings, or invented facts.

Accuracy rules:
- Use only facts supported by the provided resume and knowledge base. Never invent employers, job titles, dates, degrees, certifications, technologies, responsibilities, metrics, or achievements.
- If a metric is needed but not confirmed, use a bracketed placeholder such as [X%] or [X] rather than guessing.
- Preserve contact fields and every existing experience, project, and education id. Never delete supplied records.
- Do not keyword-stuff. Use a relevant keyword naturally no more than 2–3 times across the resume, and only when the background supports it.

ATS rules:
- Produce clean, single-column, plain-text-friendly content with standard sections: Contact Information, Summary, Skills, Work Experience, Projects, Education, Certifications (use the conventional ${languageName(language)} headings).
- Use exact job-description terminology only when supported by the candidate's evidence; include an acronym with its full form when useful, such as CI/CD (Continuous Integration / Continuous Delivery).
- Rewrite work bullets with strong action verbs and the XYZ pattern: accomplished [X], measured by [Y], by doing [Z]. Do not manufacture [Y]. Keep bullets concise and impact-oriented.
- Keep dates, company names, titles, and contact data unchanged unless the source explicitly provides a corrected value.

The ATS Match Summary is metadata, not resume body content. If no target job description is provided, report coverage as null and do not infer gaps or matches.`;
}

export function resumeGenerationUserPrompt(
  language: ResumeOutputLanguage,
  resume: JsonObject,
  knowledge: JsonObject,
  instruction: string,
) {
  return `Current resume data:\n${JSON.stringify(resume, null, 2)}\nKnowledge base:\n${JSON.stringify(knowledge, null, 2)}\nAdditional instruction:\n${instruction || `Create an ATS-friendly ${languageName(language)} resume while preserving every supported fact.`}\n\nReturn exactly this JSON shape:\n{"resume":{...all resume fields...},"atsMatchSummary":{"estimatedKeywordCoverage":number|null,"strongMatches":[string],"keywordGaps":[string]}}\nThe resume object must contain every original resume field and every original array item. The summary must contain only evidence-based matches and gaps; return empty arrays when no target job description exists.`;
}

export function resumeTailoringSystemPrompt(language: ResumeOutputLanguage) {
  return `You are an executive ${languageName(language)} resume writer and ATS optimization specialist. Return valid JSON only, without Markdown or commentary. Tailor only the supplied resume facts to the target job. Never invent a skill, tool, employer, title, date, metric, certification, or achievement. Use supported job-description keywords naturally, avoid stuffing, and rewrite experience/project bullets with strong action verbs and the XYZ formula. Preserve every supplied id and do not rewrite unchanged fields. Return all text in ${languageName(language)}.`;
}

export function resumeTailoringUserPrompt(
  language: ResumeOutputLanguage,
  resume: JsonObject,
  jobDescription: string,
) {
  return `Base resume:\n${JSON.stringify(resume, null, 2)}\nTarget job description:\n${jobDescription}\n\nReturn exactly this JSON shape:\n{"summary":string,"skills":[string],"experiences":[{"id":string,"description":string}],"projects":[{"id":string,"description":string}],"atsMatchSummary":{"estimatedKeywordCoverage":number,"strongMatches":[string],"keywordGaps":[string]}}\nWrite the patch in ${languageName(language)}. Use [X%] or [X] for any unconfirmed metric, and omit unsupported keywords from the rewrite while listing them in keywordGaps.`;
}
