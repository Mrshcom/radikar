import type { FastifyInstance } from "fastify";
import { chatJson, getAnalyzeConfig } from "@radicar/ai";
import { extractText as extractPdfText, getDocumentProxy } from "unpdf";
import * as mammoth from "mammoth";
import { serializeResumeSkills, type JsonObject } from "../ai/helpers";

const maxTextLength = 24_000;
const maxPdfPages = 30;

function extensionOf(filename: string) {
  return filename.toLowerCase().split(".").pop() ?? "";
}

async function extractFileText(filename: string, buffer: Buffer) {
  const extension = extensionOf(filename);
  if (extension === "pdf") {
    const document = await getDocumentProxy(new Uint8Array(buffer));
    try {
      if (document.numPages > maxPdfPages)
        throw new Error("فایل PDF باید حداکثر ۳۰ صفحه داشته باشد.");
      return (await extractPdfText(document, { mergePages: true })).text;
    } finally {
      const disposableDocument = document as typeof document & {
        destroy?: () => Promise<void>;
      };
      if (typeof disposableDocument.destroy === "function")
        await disposableDocument.destroy();
    }
  }
  if (extension === "docx")
    return (await mammoth.extractRawText({ buffer })).value;
  if (extension === "txt") return new TextDecoder().decode(buffer);
  throw new Error("فرمت فایل پشتیبانی نمی‌شود.");
}

export function registerKnowledgeImportRoute(app: FastifyInstance) {
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
      const text = (await extractFileText(file.filename, await file.toBuffer()))
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
      const extracted = await chatJson<JsonObject>(importConfig, [
        {
          role: "system",
          content:
            "تو سامانه استخراج اطلاعات رزومه هستی. فقط JSON معتبر فارسی برگردان. هیچ اطلاعاتی نساز و موارد ناموجود را خالی بگذار.",
        },
        {
          role: "user",
          content: `رزومه زیر را به JSON ساختاریافته تبدیل کن. مهارت‌ها را آرایه جداگانه برگردان.\nمتن:\n${text}\nJSON: {"resumeData":{},"experiences":[],"qualifications":[],"projects":[],"skills":[string],"languages":string,"languageItems":[{"languageName":string,"proficiency":string}],"careerGoals":string,"preferredRoles":string,"preferredIndustries":string,"workPreferences":string,"interviewContext":string,"interviewChallenges":string}`,
        },
      ]);
      const languageItems = Array.isArray(extracted.languageItems)
        ? extracted.languageItems
            .map((item) => {
              const language = item as JsonObject;
              return {
                name:
                  typeof language.languageName === "string"
                    ? language.languageName
                    : typeof language.name === "string"
                      ? language.name
                      : "",
                proficiency:
                  typeof language.proficiency === "string"
                    ? language.proficiency
                    : "",
              };
            })
            .filter((language) => language.name)
        : [];
      return {
        resumeData: extracted.resumeData ?? {},
        experiences: Array.isArray(extracted.experiences)
          ? extracted.experiences
          : [],
        qualifications: Array.isArray(extracted.qualifications)
          ? extracted.qualifications
          : [],
        projects: Array.isArray(extracted.projects) ? extracted.projects : [],
        skills: serializeResumeSkills(extracted.skills),
        languages:
          typeof extracted.languages === "string" ? extracted.languages : "",
        languageItems,
        careerGoals:
          typeof extracted.careerGoals === "string" ? extracted.careerGoals : "",
        preferredRoles:
          typeof extracted.preferredRoles === "string"
            ? extracted.preferredRoles
            : "",
        preferredIndustries:
          typeof extracted.preferredIndustries === "string"
            ? extracted.preferredIndustries
            : "",
        workPreferences:
          typeof extracted.workPreferences === "string"
            ? extracted.workPreferences
            : "",
        interviewContext:
          typeof extracted.interviewContext === "string"
            ? extracted.interviewContext
            : "",
        interviewChallenges:
          typeof extracted.interviewChallenges === "string"
            ? extracted.interviewChallenges
            : "",
        fileName: file.filename,
      };
    } catch (error) {
      return reply.code(502).send({
        error:
          error instanceof Error ? error.message : "پردازش رزومه ناموفق بود.",
      });
    }
  });
}
