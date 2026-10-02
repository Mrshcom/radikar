import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { normalizeResumeImportPayload, sanitizeImportedUrl, type ResumeImportPayload } from "@radikar/validators";

const inputSchema = z.object({ url: z.url().max(500) });
const apifyApiBase = "https://api.apify.com/v2";

export type LinkedInImportOptions = { apiToken?: string; linkedInActorId?: string };

function isLinkedInProfileUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return (
      (host === "linkedin.com" || host.endsWith(".linkedin.com")) &&
      /^\/(?:in|sales\/people)\/[a-z0-9%_-]+\/?$/i.test(url.pathname)
    );
  } catch {
    return false;
  }
}
function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
function list(value: unknown) {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}
function mapDate(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    return [text(item.month), text(item.year)].filter(Boolean).join(" ");
  }
  return "";
}

export function mapLinkedInProfile(raw: Record<string, unknown>, sourceUrl: string): ResumeImportPayload {
  const experiences = Array.isArray(raw.experience)
    ? raw.experience.map((item, index) => {
        const entry = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
        const current = Boolean(entry.job_still_working ?? entry.isCurrent);
        return {
          id: `linkedin-experience-${index + 1}`,
          jobTitle: text(entry.job_title ?? entry.title),
          company: text(entry.company_name ?? entry.company),
          location: text(entry.location),
          startDate: mapDate(entry.job_started_on ?? entry.startDate),
          endDate: current ? "" : mapDate(entry.job_ended_on ?? entry.endDate),
          isCurrent: current,
          description: text(entry.description),
          technologies: list(entry.technologies ?? entry.skills).join(", "),
        };
      })
    : [];
  const qualifications = Array.isArray(raw.education)
    ? raw.education.map((item, index) => {
        const entry = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
        return {
          id: `linkedin-education-${index + 1}`,
          institution: text(entry.school_name ?? entry.university ?? entry.school),
          credential: text(entry.degree ?? entry.field_of_study ?? entry.description),
          startDate: mapDate(entry.started_on ?? entry.startDate),
          endDate: mapDate(entry.ended_on ?? entry.endDate),
          isCurrent: false,
        };
      })
    : [];
  const profileUrl = sanitizeImportedUrl(text(raw.profile_link ?? raw.linkedin_url) || sourceUrl) || sourceUrl;
  return normalizeResumeImportPayload({
    resumeData: {
      fullName: text(raw.full_name ?? raw.name),
      jobTitle: text(raw.job_title ?? raw.profile_headline ?? raw.headline),
      email: "",
      phone: "",
      location: text(raw.location ?? raw.city),
      website: profileUrl,
      summary: text(raw.description ?? raw.about),
    },
    experiences,
    qualifications,
    projects: [],
    skills: list(raw.skills).join(", "),
    languages: list(raw.languages).join(", "),
    languageItems: [],
    fileName: `linkedin:${profileUrl}`,
  });
}

export function registerLinkedInImportRoute(app: FastifyInstance, options: LinkedInImportOptions = {}) {
  app.post<{ Body: { url: string } }>("/api/knowledge/import-linkedin", async (request, reply) => {
    const input = inputSchema.safeParse(request.body);
    if (!input.success || !isLinkedInProfileUrl(input.data?.url ?? ""))
      return reply
        .code(400)
        .send({ error: "فقط لینک پروفایل عمومی LinkedIn با مسیر /in یا /sales/people پشتیبانی می‌شود." });
    if (!options.apiToken) return reply.code(503).send({ error: "APIFY_API_TOKEN در محیط API تنظیم نشده است." });
    const actorId = options.linkedInActorId || "data-slayer~linkedin-profile-scraper";
    const response = await fetch(
      `${apifyApiBase}/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${encodeURIComponent(options.apiToken)}&format=json`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ linkedin_urls: [input.data.url] }),
        signal: AbortSignal.timeout(120_000),
      },
    );
    if (!response.ok) {
      request.log.warn({ status: response.status }, "Apify LinkedIn import failed");
      return reply.code(502).send({ error: "دریافت اطلاعات LinkedIn از Apify ناموفق بود." });
    }
    const output = (await response.json()) as unknown;
    const first = Array.isArray(output) ? output[0] : output;
    if (!first || typeof first !== "object")
      return reply.code(404).send({ error: "پروفایل عمومی قابل استخراجی از این لینک پیدا نشد." });
    return mapLinkedInProfile(first as Record<string, unknown>, input.data.url);
  });
}
