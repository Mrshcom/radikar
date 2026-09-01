import type { FastifyInstance } from "fastify";
import { chatJson, getAnalyzeConfig } from "@radicar/ai";
import {
  extractLinks as extractPdfLinks,
  extractText as extractPdfText,
  getDocumentProxy,
} from "unpdf";
import * as mammoth from "mammoth";
import {
  normalizeResumeImportPayload,
  sanitizeImportedUrl,
  type ResumeImportPayload,
} from "@radicar/validators";
import { serializeResumeSkills, type JsonObject } from "../ai/helpers";
import type { BillingService } from "../billing/service";

const maxTextLength = 24_000;
const maxPdfPages = 30;
const maxEmbeddedLinks = 50;
const maxImportOutputTokens = 8_192;

const resumeImportShape = `{
  "resumeData": {
    "fullName": string,
    "jobTitle": string,
    "email": string,
    "phone": string,
    "location": string,
    "website": string,
    "summary": string
  },
  "experiences": [{
    "jobTitle": string,
    "company": string,
    "location": string,
    "startDate": string,
    "endDate": string,
    "isCurrent": boolean,
    "description": string,
    "technologies": string
  }],
  "qualifications": [{
    "institution": string,
    "credential": string,
    "startDate": string,
    "endDate": string,
    "isCurrent": boolean
  }],
  "projects": [{
    "projectTitle": string,
    "role": string,
    "url": string,
    "startDate": string,
    "endDate": string,
    "isCurrent": boolean,
    "description": string,
    "technologies": string
  }],
  "skills": [string],
  "languages": string,
  "languageItems": [{"languageName": string, "proficiency": string}],
  "careerGoals": string,
  "preferredRoles": string,
  "preferredIndustries": string,
  "workPreferences": string,
  "interviewContext": string,
  "interviewChallenges": string
}`;

type ExtractedFileContent = {
  text: string;
  links: string[];
};

function extensionOf(filename: string) {
  return filename.toLowerCase().split(".").pop() ?? "";
}

export function normalizeEmbeddedLinks(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const links = new Set<string>();
  for (const candidate of value) {
    if (typeof candidate !== "string") continue;
    const trimmed = candidate.trim();
    if (!/^https?:\/\//i.test(trimmed)) continue;
    const sanitized = sanitizeImportedUrl(trimmed);
    if (!sanitized) continue;
    links.add(sanitized);
    if (links.size >= maxEmbeddedLinks) break;
  }
  return [...links];
}

function isLinkedInUrl(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "linkedin.com" || hostname.endsWith(".linkedin.com");
  } catch {
    return false;
  }
}

function isLinkedInLikeUrl(value: string) {
  try {
    const hostname = new URL(value).hostname
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    return hostname.includes("linkedin");
  } catch {
    return false;
  }
}

export function applyEmbeddedLinkFallbacks(
  payload: ResumeImportPayload,
  links: string[],
): ResumeImportPayload {
  const linkedinUrl = normalizeEmbeddedLinks(links).find(isLinkedInUrl);
  if (!linkedinUrl) return payload;
  const importedWebsite = payload.resumeData.website;
  if (importedWebsite && !isLinkedInLikeUrl(importedWebsite)) return payload;
  return {
    ...payload,
    resumeData: { ...payload.resumeData, website: linkedinUrl },
  };
}

export function extractContactFallbacks(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const email =
    text.match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,63}/i)?.[0] ??
    "";
  const phone =
    text.match(/(?:\+[ \t]?\d[\d \t().-]{7,}\d|\b0\d[\d \t().-]{7,}\d)/)?.[0]
      ?.trim() ?? "";
  const contactStart = lines.findIndex((line) =>
    /^(?:contact|contact information|اطلاعات تماس|راه‌های ارتباطی)$/i.test(line),
  );
  const contactEnd =
    contactStart < 0
      ? -1
      : lines.findIndex(
          (line, index) =>
            index > contactStart &&
            /^(?:about me|summary|profile|درباره من|خلاصه)$/i.test(line),
        );
  const location =
    contactStart < 0 || contactEnd < 0
      ? ""
      : lines.slice(contactStart + 1, contactEnd).find((line) => {
          if (/^(?:information|linkedin profile)$/i.test(line)) return false;
          if (line === email || line === phone) return false;
          if (line.includes("@") || /^(?:https?:\/\/|www\.)/i.test(line))
            return false;
          return !/(?:\+[ \t]?\d|\b0\d)[\d \t().-]{7,}\d/.test(line);
        }) ?? "";
  return { email, phone, location };
}

export function extractSummaryFallback(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const start = lines.findIndex((line) =>
    /^(?:about me|summary|professional summary|profile|درباره من|خلاصه)$/i.test(
      line,
    ),
  );
  if (start < 0) return "";
  const summary: string[] = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    const next = lines[index + 1] ?? "";
    if (
      /^(?:professional experience|work experience|experience|projects?|skills?|languages?|education|contact|اطلاعات تماس|سوابق شغلی|پروژه‌ها|مهارت‌ها|زبان‌ها|تحصیلات)$/i.test(
        line,
      ) ||
      (/^[A-Z]{1,4}$/.test(line) &&
        /^[A-Z][A-Z\s.'-]{3,}$/.test(next))
    )
      break;
    summary.push(line);
  }
  return summary.join(" ").trim();
}

export function extractExperienceHeadingFallbacks(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const datePattern =
    /^(\d{1,4}[/-]\d{1,4}|\d{4})\s*[–—-]\s*(present|current|now|\d{1,4}[/-]\d{1,4}|\d{4})$/i;
  return lines.flatMap((line, index) => {
    const dates = line.match(datePattern);
    const organization = lines[index - 1] ?? "";
    const jobTitle = lines[index - 2] ?? "";
    if (!dates || !organization.includes("·") || !jobTitle) return [];
    const [company = "", ...locationParts] = organization.split("·");
    const isCurrent = /^(?:present|current|now)$/i.test(dates[2]);
    return [
      {
        jobTitle,
        company: company.trim(),
        location: locationParts.join("·").trim(),
        startDate: dates[1],
        endDate: isCurrent ? "" : dates[2],
        isCurrent,
      },
    ];
  });
}

export function applyTextFallbacks(
  payload: ResumeImportPayload,
  text: string,
): ResumeImportPayload {
  const fallback = extractContactFallbacks(text);
  const summary = extractSummaryFallback(text);
  const experienceHeadings = extractExperienceHeadingFallbacks(text);
  const experiences =
    experienceHeadings.length === payload.experiences.length
      ? payload.experiences.map((experience, index) => ({
          ...experienceHeadings[index],
          ...experience,
          company:
            experience.company || experienceHeadings[index]?.company || "",
          location:
            experience.location || experienceHeadings[index]?.location || "",
          startDate:
            experience.startDate || experienceHeadings[index]?.startDate || "",
          endDate:
            experience.endDate || experienceHeadings[index]?.endDate || "",
          isCurrent:
            experience.isCurrent ||
            experienceHeadings[index]?.isCurrent ||
            false,
        }))
      : payload.experiences;
  return normalizeResumeImportPayload({
    ...payload,
    experiences,
    resumeData: {
      ...payload.resumeData,
      email: payload.resumeData.email || fallback.email,
      phone: payload.resumeData.phone || fallback.phone,
      location: payload.resumeData.location || fallback.location,
      summary: payload.resumeData.summary || summary,
    },
  });
}

export function buildResumeImportPrompt(text: string) {
  return `تمام اطلاعات رزومه زیر را بدون خلاصه‌سازی و بدون ترجمه به JSON تبدیل کن.
- زبان و املای متن مبدأ را دقیقاً حفظ کن.
- تمام سوابق، پروژه‌ها، شرکت‌ها، محل‌ها، تاریخ‌ها، توضیحات، فناوری‌ها، مهارت‌ها و زبان‌ها را استخراج کن.
- ایمیل، تلفن، محل سکونت، وب‌سایت و خلاصه حرفه‌ای را حذف نکن.
- برای مقادیر ناموجود رشته خالی یا آرایه خالی بگذار و هیچ داده‌ای نساز.
- technologies هر سابقه یا پروژه را از فناوری‌های همان مورد پر کن، نه از مهارت‌های کلی.
- برای عنوان پروژه فقط از کلید projectTitle استفاده کن و در هیچ سطحی کلید name نساز.
متن رزومه:
${text}
ساختار دقیق JSON خروجی:
${resumeImportShape}`;
}

async function extractFileContent(
  filename: string,
  buffer: Buffer,
): Promise<ExtractedFileContent> {
  const extension = extensionOf(filename);
  if (extension === "pdf") {
    const document = await getDocumentProxy(new Uint8Array(buffer));
    try {
      if (document.numPages > maxPdfPages)
        throw new Error("فایل PDF باید حداکثر ۳۰ صفحه داشته باشد.");
      const [textResult, linksResult] = await Promise.all([
        extractPdfText(document, { mergePages: true }),
        extractPdfLinks(document),
      ]);
      return {
        text: textResult.text,
        links: normalizeEmbeddedLinks(linksResult.links),
      };
    } finally {
      const disposableDocument = document as typeof document & {
        destroy?: () => Promise<void>;
      };
      if (typeof disposableDocument.destroy === "function")
        await disposableDocument.destroy();
    }
  }
  if (extension === "docx")
    return { text: (await mammoth.extractRawText({ buffer })).value, links: [] };
  if (extension === "txt")
    return { text: new TextDecoder().decode(buffer), links: [] };
  throw new Error("فرمت فایل پشتیبانی نمی‌شود.");
}

export function registerKnowledgeImportRoute(
  app: FastifyInstance,
  billing?: BillingService,
) {
  app.post("/api/knowledge/import", async (request, reply) => {
    if (!request.isMultipart())
      return reply.code(400).send({ error: "فایل رزومه ارسال نشده است." });
    const file = await request.file({ limits: { fileSize: 8 * 1024 * 1024 } });
    if (!file)
      return reply.code(400).send({ error: "فایل رزومه ارسال نشده است." });
    if (!["pdf", "docx", "txt"].includes(extensionOf(file.filename)))
      return reply
        .code(415)
        .send({ error: "فقط فایل‌های PDF، DOCX و TXT پشتیبانی می‌شوند." });

    try {
      const extractedFile = await extractFileContent(
        file.filename,
        await file.toBuffer(),
      );
      const text = extractedFile.text
        .replace(/\0/g, "")
        .trim()
        .slice(0, maxTextLength);
      if (text.length < 50)
        return reply.code(422).send({
          error:
            "متن کافی از فایل استخراج نشد. فایل PDF اسکن‌شده به OCR نیاز دارد.",
        });

      const analyzeConfig = getAnalyzeConfig();
      const importConfig =
        analyzeConfig.provider === "freeDeepseekAPI"
          ? { ...analyzeConfig, model: "deepseek-chat" }
          : analyzeConfig;
      const extracted = await chatJson<JsonObject>(
        importConfig,
        [
          {
            role: "system",
            content:
              "تو سامانه استخراج دقیق اطلاعات رزومه هستی. فقط JSON معتبر برگردان، زبان متن مبدأ را حفظ کن، هیچ اطلاعاتی نساز و هیچ مورد موجودی را حذف یا خلاصه نکن.",
          },
          {
            role: "user",
            content: buildResumeImportPrompt(text),
          },
        ],
        {
          maxOutputTokens: maxImportOutputTokens,
          ...(importConfig.provider === "freeDeepseekAPI"
            ? { emptyResponseFallbackModels: ["deepseek-reasoner"] }
            : {}),
          ...(billing
            ? {
                onUsage: (event) =>
                billing.recordModelUsage(
                  request.auth!.user.id,
                  `${request.id}:knowledge_import:${event.attempt}`,
                  "knowledge_import",
                  event,
                ),
              }
            : {}),
        },
      );
      const normalized = applyTextFallbacks(
        normalizeResumeImportPayload({
          ...extracted,
          skills: serializeResumeSkills(extracted.skills),
          fileName: file.filename,
        }),
        text,
      );
      return applyEmbeddedLinkFallbacks(normalized, extractedFile.links);
    } catch (error) {
      return reply.code(502).send({
        error:
          error instanceof Error ? error.message : "پردازش رزومه ناموفق بود.",
      });
    }
  });
}
