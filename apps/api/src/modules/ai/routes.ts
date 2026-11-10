import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  chatJson,
  getAnalyzeConfig,
  getAnalyzeProviderSettings,
  getWriteConfig,
  setAnalyzeProvider,
} from "@radikar/ai";
import {
  normalizeImportedBoolean,
  normalizeImportedText,
  normalizeImportedTextArray,
  normalizeStoredResumeData,
} from "@radikar/validators";
import { asObject, hasResumeContent, type JsonObject, validateJobDescription } from "./helpers";
import { interviewReportRequestSchema, parseInterviewReport } from "./interview-report";
import { interviewDepthMinutes } from "@radikar/shared-types";
import type { InterviewAgentClient } from "./interview-agent";
import { signInterviewChat, verifyInterviewChat } from "./interview-chat-token";
import {
  createLegacyInterviewReport,
  createLegacyInterviewSession,
  createLegacyInterviewTurn,
  createLegacyInterviewClarification,
} from "./interview-legacy";
import type { BillingService, UsageCosts } from "../billing/service";
import { requirePermission } from "../auth/routes";
import type { ProviderName } from "@radikar/ai";
import { eq } from "drizzle-orm";
import { aiSettings, type Database } from "@radikar/database";
import type { ProductEventService } from "../analytics/service";
import {
  resumeGenerationSystemPrompt,
  resumeGenerationUserPrompt,
  resumeTailoringSystemPrompt,
  resumeTailoringUserPrompt,
  type ResumeOutputLanguage,
} from "./resume-prompts";

const aiSettingsId = "analysis-provider";

const aiSettingsSchema = z.object({
  provider: z.enum(["freeDeepseekAPI", "gapgpt"]),
  model: z.string().trim().max(120).optional(),
  dollarRateRials: z.number().int().min(0).max(1_000_000_000).optional(),
});

const gapGptModels = [
  ["gapgpt-qwen-3.6", 0.25, 2],
  ["gapgpt-qwen-3.6-thinking", 0.25, 2],
  ["gpt-5.6-sol", 2.5, 15],
  ["gpt-5.6-luna", 0.2, 1.2],
  ["gpt-5.6-terra", 2, 12],
  ["gpt-5.5", 5, 30],
  ["gpt-5.4", 2.5, 15],
  ["gpt-5.2-pro", 21, 126],
  ["gpt-5.3-codex-spark", 1.75, 14],
  ["claude-fable-5", 10, 50],
  ["claude-sonnet-5", 2, 10],
  ["claude-opus-5", 5, 25],
  ["gemini-3.1-pro-preview", 2, 12],
  ["gemini-3.5-flash", 1.5, 9],
  ["gemini-3.1-flash-lite", 0.25, 1.5],
  ["gemini-3.1-flash-lite-preview", 0.25, 1.5],
  ["gemini-3-flash-preview", 0.5, 3],
  ["grok-4.3", 1.25, 2.5],
  ["grok-4", 3, 15],
] as const;

type Analysis = {
  score: number;
  jobTitle: string;
  company: string;
  breakdown: Array<{ label: string; value: number }>;
  strengths: string[];
  gaps: string[];
};

type ModelAnalysis = Partial<Omit<Analysis, "breakdown">> & {
  isJobPosting?: boolean;
  invalidReason?: string;
  breakdown?: Array<{ label?: string; value?: number }>;
};

type DashboardData = {
  subtitle: string;
  profileScore: number;
  heroTitle: string;
  heroText: string;
  aiTitle: string;
  aiText: string;
};

type AtsMatchSummary = {
  estimatedKeywordCoverage: number | null;
  strongMatches: string[];
  keywordGaps: string[];
};

const breakdownWeights = [0.3, 0.35, 0.25, 0.1] as const;

function bodyOf(value: unknown) {
  return asObject(value);
}

function textOf(value: unknown) {
  return normalizeImportedText(value);
}

function stringArray(value: unknown) {
  return normalizeImportedTextArray(value);
}

function normalizeAtsMatchSummary(value: unknown): AtsMatchSummary {
  const summary = asObject(value);
  const coverage = Number(summary.estimatedKeywordCoverage);
  return {
    estimatedKeywordCoverage: Number.isFinite(coverage) ? Math.min(100, Math.max(0, Math.round(coverage))) : null,
    strongMatches: stringArray(summary.strongMatches).slice(0, 8),
    keywordGaps: stringArray(summary.keywordGaps).slice(0, 8),
  };
}

function clampScore(value: unknown) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function normalizeAnalysis(result: ModelAnalysis): Analysis {
  const safeResult = asObject(result);
  if (!normalizeImportedBoolean(safeResult.isJobPosting)) {
    throw new Error(textOf(safeResult.invalidReason) || "متن واردشده یک آگهی شغلی قابل تحلیل نیست.");
  }
  if (!Array.isArray(safeResult.breakdown) || safeResult.breakdown.length < 4) {
    throw new Error("مدل شواهد کافی برای محاسبه امتیاز تطبیق ارائه نکرد.");
  }
  const breakdown = safeResult.breakdown.slice(0, 4).map((item, index) => {
    const safeItem = asObject(item);
    return {
      label:
        textOf(safeItem.label) ||
        ["تناسب عنوان و حوزه شغلی", "همپوشانی مهارت‌های الزامی", "ارتباط سابقه و مسئولیت‌ها", "تحصیلات و شرایط تکمیلی"][
          index
        ],
      value: clampScore(safeItem.value),
    };
  });
  return {
    score: Math.round(breakdown.reduce((total, item, index) => total + item.value * breakdownWeights[index], 0)),
    jobTitle: textOf(safeResult.jobTitle) || "عنوان شغل در آگهی مشخص نشده",
    company: textOf(safeResult.company) || "نام شرکت در آگهی مشخص نشده",
    breakdown,
    strengths: stringArray(safeResult.strengths).slice(0, 5),
    gaps: stringArray(safeResult.gaps).slice(0, 4),
  };
}

function modelError(reply: FastifyReply, error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  return reply.code(502).send({
    error: /pre-consume quota failed|remaining user quota/i.test(message)
      ? "اعتبار سرویس هوش مصنوعی کافی نیست؛ لطفاً بعداً دوباره تلاش کنید."
      : message,
  });
}

function preserveResumeArrays(base: JsonObject, generated: JsonObject) {
  return normalizeStoredResumeData({
    ...base,
    ...generated,
    experiences: Array.isArray(generated.experiences) ? generated.experiences : base.experiences,
    projects: Array.isArray(generated.projects) ? generated.projects : base.projects,
    educations: Array.isArray(generated.educations) ? generated.educations : base.educations,
    photoUrl: base.photoUrl,
    email: base.email,
    phone: base.phone,
    website: base.website,
  });
}

function mergeDescriptionPatches(baseValue: unknown, patchValue: unknown) {
  if (!Array.isArray(baseValue)) return baseValue;
  const patches = new Map(
    (Array.isArray(patchValue) ? patchValue : [])
      .map((value) => asObject(value))
      .map((value) => [textOf(value.id), textOf(value.description)] as const)
      .filter(([id, description]) => Boolean(id && description)),
  );
  return baseValue.map((value) => {
    const item = asObject(value);
    const description = patches.get(textOf(item.id));
    return description ? { ...item, description } : item;
  });
}

function hasTailoredPatch(value: JsonObject) {
  return Boolean(
    textOf(value.summary) ||
    stringArray(value.skills).length ||
    (Array.isArray(value.experiences) && value.experiences.length) ||
    (Array.isArray(value.projects) && value.projects.length),
  );
}

export function mergeTailoredResume(base: JsonObject, patch: JsonObject) {
  if (!hasTailoredPatch(patch)) {
    throw new Error("مدل محتوای قابل استفاده‌ای برای رزومه اختصاصی برنگرداند.");
  }
  const skills = stringArray(patch.skills).join(", ");
  return normalizeStoredResumeData({
    ...base,
    summary: textOf(patch.summary) || base.summary,
    skills: skills || base.skills,
    experiences: mergeDescriptionPatches(base.experiences, patch.experiences),
    projects: mergeDescriptionPatches(base.projects, patch.projects),
  });
}

function getTailorWriteConfig() {
  const config = getWriteConfig();
  if (config.provider === "freeDeepseekAPI" && /(?:reasoner|r1)/i.test(config.model)) {
    return { ...config, model: "deepseek-chat" };
  }
  return config;
}

export function getMatchAnalyzeConfig() {
  const config = getAnalyzeConfig();
  if (config.provider === "freeDeepseekAPI" && /(?:reasoner|r1)/i.test(config.model)) {
    return { ...config, model: "deepseek-chat" };
  }
  return config;
}

async function consume(
  billing: BillingService | undefined,
  request: FastifyRequest,
  costs: UsageCosts,
  operation: string,
) {
  if (!billing) return;
  await billing.consumeUsage(request.auth!.user.id, costs, operation, request.id);
}

async function refund(
  billing: BillingService | undefined,
  request: FastifyRequest,
  costs: UsageCosts,
  operation: string,
) {
  if (!billing) return;
  await billing.refundUsage(request.auth!.user.id, costs, operation, request.id);
}

function modelUsage(billing: BillingService | undefined, request: FastifyRequest, operation: string) {
  if (!billing) return undefined;
  return {
    onUsage: (event: Parameters<BillingService["recordModelUsage"]>[3]) =>
      billing.recordModelUsage(request.auth!.user.id, `${request.id}:${operation}:${event.attempt}`, operation, event),
  };
}

function modelRequestAbort(request: FastifyRequest, reply: FastifyReply) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  request.raw.once("aborted", abort);
  reply.raw.once("close", abort);
  return {
    signal: controller.signal,
    dispose: () => {
      request.raw.off("aborted", abort);
      reply.raw.off("close", abort);
    },
  };
}

export function registerAiRoutes(
  app: FastifyInstance,
  billing?: BillingService,
  database?: Database,
  productEvents?: ProductEventService,
  interviewAgent?: InterviewAgentClient,
  interviewChatSecret?: string,
) {
  app.get("/api/admin/ai-settings", async (request, reply) => {
    if (!requirePermission(request, reply, "ai-settings:manage:any")) return;
    let current: ReturnType<typeof getAnalyzeProviderSettings> & { dollarRateRials: number };
    try {
      current = { ...getAnalyzeProviderSettings(), dollarRateRials: 0 };
    } catch {
      current = { provider: "gapgpt", model: "gapgpt-qwen-3.6", configured: false, dollarRateRials: 0 };
    }
    if (database) {
      const [saved] = await database.select().from(aiSettings).where(eq(aiSettings.id, aiSettingsId)).limit(1);
      if (saved) {
        setAnalyzeProvider(saved.provider as ProviderName, saved.model);
        current = { ...getAnalyzeProviderSettings(), dollarRateRials: 0 };
      }
    }
    return {
      current: {
        ...current,
        dollarRateRials: Number(
          (
            await database
              ?.select({ dollarRateRials: aiSettings.dollarRateRials })
              .from(aiSettings)
              .where(eq(aiSettings.id, aiSettingsId))
              .limit(1)
          )?.[0]?.dollarRateRials ?? 0,
        ),
      },
      providers: [
        { id: "freeDeepseekAPI", label: "DeepSeek Local", defaultModel: "deepseek-chat" },
        {
          id: "gapgpt",
          label: "GapGPT",
          defaultModel: "gapgpt-qwen-3.6",
          models: gapGptModels.map(([id, inputPrice, outputPrice]) => ({ id, inputPrice, outputPrice })),
        },
      ],
    };
  });

  app.patch("/api/admin/ai-settings", async (request, reply) => {
    if (!requirePermission(request, reply, "ai-settings:manage:any")) return;
    const input = aiSettingsSchema.parse(request.body);
    const provider = input.provider as ProviderName;
    setAnalyzeProvider(provider, input.model || undefined);
    let dollarRateRials = input.dollarRateRials ?? 0;
    if (database) {
      const saved = await database
        .select({ dollarRateRials: aiSettings.dollarRateRials })
        .from(aiSettings)
        .where(eq(aiSettings.id, aiSettingsId))
        .limit(1);
      dollarRateRials = input.dollarRateRials ?? Number(saved[0]?.dollarRateRials ?? 0);
      await database
        .insert(aiSettings)
        .values({
          id: aiSettingsId,
          provider,
          model: input.model?.trim() || (provider === "gapgpt" ? "gapgpt-qwen-3.6" : "deepseek-chat"),
          updatedAt: new Date(),
          dollarRateRials,
        })
        .onConflictDoUpdate({
          target: aiSettings.id,
          set: {
            provider,
            model: input.model?.trim() || (provider === "gapgpt" ? "gapgpt-qwen-3.6" : "deepseek-chat"),
            dollarRateRials,
            updatedAt: new Date(),
          },
        });
    }
    return { ...getAnalyzeProviderSettings(), dollarRateRials };
  });

  app.post("/api/match/analyze", async (request, reply) => {
    const body = bodyOf(request.body);
    const jobDescription = textOf(body.jobDescription).trim();
    const resume = asObject(normalizeStoredResumeData(body.resume));
    const validation = validateJobDescription(jobDescription);
    if (!validation.valid) return reply.code(422).send({ error: validation.error });
    if (!hasResumeContent(resume)) return reply.code(422).send({ error: "رزومه مبنا خالی است." });
    await productEvents?.record(
      "job_input_submitted",
      `job-input:${request.auth!.user.id}:${request.id}`,
      request.auth!.user.id,
      { source: "manual" },
    );

    const usage = { ai: 2, match: 1 } satisfies UsageCosts;
    await consume(billing, request, usage, "match_analyze");
    const requestAbort = modelRequestAbort(request, reply);
    try {
      const result = await chatJson<ModelAnalysis>(
        getMatchAnalyzeConfig(),
        [
          {
            role: "system",
            content:
              "تو یک متخصص سخت‌گیر ATS هستی. فقط JSON معتبر بدون markdown برگردان. هیچ امتیازی را بر اساس کیفیت کلی رزومه یا حدس خودت نده؛ فقط همپوشانی صریح رزومه با نیازمندی‌های همین آگهی ملاک است.",
          },
          {
            role: "user",
            content: `ابتدا بررسی کن متن واقعاً آگهی شغلی است. اگر معتبر بود چهار امتیاز مستقل ۰ تا ۱۰۰ برای تناسب عنوان (۳۰٪)، مهارت‌ها (۳۵٪)، سابقه (۲۵٪) و تحصیلات (۱۰٪) بده. نبود شواهد یعنی صفر و هیچ داده‌ای نساز.\nرزومه:\n${JSON.stringify(resume, null, 2)}\nشرح شغل:\n${jobDescription}\nJSON: {"isJobPosting":boolean,"invalidReason":string,"jobTitle":string,"company":string,"breakdown":[{"label":string,"value":number}],"strengths":string[],"gaps":string[]}`,
          },
        ],
        {
          ...modelUsage(billing, request, "match_analyze"),
          signal: requestAbort.signal,
          emptyResponseMessage: "مدل پاسخی برای تحلیل تطابق نداد. لطفاً دوباره تلاش کن.",
          maxAttempts: 2,
          maxOutputTokens: 2_048,
        },
      );
      const analysis = normalizeAnalysis(result);
      await productEvents?.record(
        "match_analysis_result",
        `match-result:${request.auth!.user.id}:${request.id}`,
        request.auth!.user.id,
        { result: "success" },
      );
      return analysis;
    } catch (error) {
      request.log.error({ err: error }, "match analysis failed");
      await refund(billing, request, usage, "match_analyze");
      if (requestAbort.signal.aborted) return reply;
      const message = error instanceof Error ? error.message : "تحلیل مدل ناموفق بود.";
      await productEvents?.record(
        "match_analysis_result",
        `match-result:${request.auth!.user.id}:${request.id}`,
        request.auth!.user.id,
        { result: "failure", failure_class: message.includes("آگهی") ? "validation" : "provider" },
      );
      return reply.code(message.includes("آگهی شغلی قابل تحلیل نیست") ? 422 : 502).send({ error: message });
    } finally {
      requestAbort.dispose();
    }
  });

  app.post("/api/match/tailor", async (request, reply) => {
    const body = bodyOf(request.body);
    const jobDescription = textOf(body.jobDescription).trim();
    const resume = asObject(normalizeStoredResumeData(body.resume));
    const validation = validateJobDescription(jobDescription);
    if (!validation.valid) return reply.code(422).send({ error: validation.error });
    if (!hasResumeContent(resume)) return reply.code(422).send({ error: "رزومه مبنا خالی است." });
    const language = body.language === "en" ? "en" : "fa";

    const usage = { ai: 5 } satisfies UsageCosts;
    await consume(billing, request, usage, "match_tailor");
    try {
      const tailored = await chatJson<JsonObject>(
        getTailorWriteConfig(),
        [
          {
            role: "system",
            content: resumeTailoringSystemPrompt(language),
          },
          {
            role: "user",
            content: resumeTailoringUserPrompt(language, resume, jobDescription),
          },
        ],
        {
          ...modelUsage(billing, request, "match_tailor"),
          emptyResponseMessage: "مدل پاسخی برای ساخت رزومه اختصاصی نداد. لطفاً دوباره تلاش کن.",
          maxAttempts: 2,
          maxOutputTokens: 4_096,
          timeoutMs: 45_000,
        },
      );
      return { resume: mergeTailoredResume(resume, tailored) };
    } catch (error) {
      await refund(billing, request, usage, "match_tailor");
      return modelError(reply, error, "ساخت رزومه اختصاصی با مدل ناموفق بود.");
    }
  });

  app.post("/api/resume/generate", async (request, reply) => {
    const body = bodyOf(request.body);
    const resume = asObject(normalizeStoredResumeData(body.resume));
    if (!hasResumeContent(resume)) return reply.code(422).send({ error: "ابتدا اطلاعات واقعی رزومه را وارد کن." });
    const language: ResumeOutputLanguage = body.language === "en" ? "en" : "fa";
    const usage = { ai: 2 } satisfies UsageCosts;
    await consume(billing, request, usage, "resume_generate");
    try {
      const generated = await chatJson<JsonObject>(
        getWriteConfig(),
        [
          {
            role: "system",
            content: resumeGenerationSystemPrompt(language),
          },
          {
            role: "user",
            content: resumeGenerationUserPrompt(language, resume, asObject(body.knowledge), textOf(body.instruction)),
          },
        ],
        modelUsage(billing, request, "resume_generate"),
      );
      const generatedResume = asObject(generated.resume);
      return {
        resume: preserveResumeArrays(resume, Object.keys(generatedResume).length ? generatedResume : generated),
        atsMatchSummary: normalizeAtsMatchSummary(generated.atsMatchSummary),
      };
    } catch (error) {
      await refund(billing, request, usage, "resume_generate");
      return modelError(reply, error, "مدل رزومه‌ساز پاسخ نداد.");
    }
  });

  app.post("/api/panel/dashboard", async (request, reply) => {
    const body = bodyOf(request.body);
    const resume = asObject(normalizeStoredResumeData(body.resume));
    if (!hasResumeContent(resume)) return reply.code(422).send({ error: "برای ساخت داشبورد ابتدا رزومه را تکمیل کن." });
    try {
      const data = await chatJson<Partial<DashboardData>>(
        getAnalyzeConfig(),
        [
          {
            role: "system",
            content: "تو تحلیل‌گر پروفایل حرفه‌ای هستی. فقط JSON معتبر و فارسی برگردان و هیچ داده‌ای نساز.",
          },
          {
            role: "user",
            content: `رزومه:\n${JSON.stringify(resume, null, 2)}\nپایگاه دانش:\n${JSON.stringify(asObject(body.knowledge), null, 2)}\nJSON: {"subtitle":string,"profileScore":number,"heroTitle":string,"heroText":string,"aiTitle":string,"aiText":string}`,
          },
        ],
        { ...modelUsage(billing, request, "dashboard"), maxOutputTokens: 1_024 },
      );
      const fields = [data.subtitle, data.heroTitle, data.heroText, data.aiTitle, data.aiText].map(textOf);
      if (fields.some((value) => !value)) throw new Error("خروجی مدل برای ساخت داشبورد کامل نیست.");
      const fullName = textOf(resume.fullName).trim().split(/\s+/)[0];
      return {
        greeting: fullName ? `سلام ${fullName}، آماده‌ی یک قدم تازه‌ای؟` : "سلام، آماده‌ی یک قدم تازه‌ای؟",
        subtitle: fields[0],
        profileScore: clampScore(data.profileScore),
        heroTitle: fields[1],
        heroText: fields[2],
        aiTitle: fields[3],
        aiText: fields[4],
      };
    } catch (error) {
      return modelError(reply, error, "مدل داشبورد پاسخ نداد.");
    }
  });

  app.post("/api/interview/session", async (request, reply) => {
    const body = bodyOf(request.body);
    const resume = asObject(normalizeStoredResumeData(body.resume));
    if (!hasResumeContent(resume))
      return reply.code(422).send({ error: "برای ساخت جلسه مصاحبه ابتدا رزومه را تکمیل کن." });
    const intent = z
      .object({
        type: z.enum(["comprehensive", "focused"]).optional(),
        focusArea: z.string().trim().min(1).max(120).optional(),
        depth: z.enum(["quick", "standard", "deep"]).optional(),
      })
      .safeParse(body);
    if (!intent.success || (intent.data.type === "focused" && !intent.data.focusArea))
      return reply.code(422).send({ error: "برای تمرین تخصصی، موضوع معتبر انتخاب کن." });
    const focusArea = intent.data.type === "focused" ? intent.data.focusArea : undefined;
    const usage = { ai: 5, interview: 1 } satisfies UsageCosts;
    await consume(billing, request, usage, "interview_session");
    try {
      const input = {
        resume,
        knowledge: asObject(body.knowledge),
        mode: textOf(body.mode) || "ترکیبی",
        focusArea,
        depth: intent.data.depth,
        durationMinutes: intent.data.depth ? interviewDepthMinutes[intent.data.depth] : undefined,
        jobDescription: textOf(body.jobDescription),
      };
      const options = { ...modelUsage(billing, request, "interview_session"), signal: request.signal };
      if (!interviewAgent) return await createLegacyInterviewSession(input, options);
      let chatUuid = "";
      const session = await interviewAgent.createSession(input, {
        ...options,
        onChatUuid: (uuid) => {
          chatUuid = uuid;
        },
      });
      return { ...session, chatToken: signInterviewChat(chatUuid, request.auth!.user.id, interviewChatSecret!) };
    } catch (error) {
      await refund(billing, request, usage, "interview_session");
      return modelError(reply, error, "مدل مصاحبه پاسخ نداد.");
    }
  });

  app.post("/api/interview/report", async (request, reply) => {
    const parsed = interviewReportRequestSchema
      .extend({ chatToken: z.string().max(200).optional() })
      .safeParse(request.body);
    if (!parsed.success)
      return reply
        .code(422)
        .send({ error: "برای دریافت نتیجه، پاسخ همهٔ سؤال‌ها را کامل کن؛ هر پاسخ حداکثر ۸۰۰۰ کاراکتر باشد." });
    const abort = modelRequestAbort(request, reply);
    try {
      const chatUuid = parsed.data.chatToken
        ? verifyInterviewChat(parsed.data.chatToken, request.auth!.user.id, interviewChatSecret!)
        : undefined;
      if (parsed.data.chatToken && !chatUuid) return reply.code(403).send({ error: "شناسهٔ گفت‌وگو معتبر نیست." });
      const options = {
        ...modelUsage(billing, request, "interview_report"),
        signal: abort.signal,
        chatUuid: chatUuid ?? undefined,
      };
      return interviewAgent
        ? parseInterviewReport(await interviewAgent.createReport(parsed.data, options), parsed.data.responses.length)
        : await createLegacyInterviewReport(parsed.data, options);
    } catch (error) {
      return modelError(reply, error, "مدل گزارش مصاحبه را کامل تولید نکرد. دوباره تلاش کن.");
    } finally {
      abort.dispose();
    }
  });

  app.post("/api/interview/next-question", async (request, reply) => {
    const parsed = z
      .object({
        mode: z.string().trim().min(1).max(200),
        chatToken: z.string().max(200).optional(),
        depth: z.enum(["quick", "standard", "deep"]).optional(),
        jobDescription: z.string().max(1_000).optional(),
        targetTimeReached: z.boolean().optional(),
        mustConclude: z.boolean().optional(),
        nextTopic: z.string().trim().min(10).max(500),
        topicShiftRequired: z.boolean().optional(),
        history: z
          .array(
            z.object({
              question: z.string().trim().min(1).max(500),
              answer: z.string().trim().min(1).max(8_000),
            }),
          )
          .min(1)
          .max(30),
      })
      .safeParse(request.body);
    if (!parsed.success) return reply.code(422).send({ error: "گفت‌وگوی مصاحبه معتبر نیست." });
    const abort = modelRequestAbort(request, reply);
    try {
      const chatUuid = parsed.data.chatToken
        ? verifyInterviewChat(parsed.data.chatToken, request.auth!.user.id, interviewChatSecret!)
        : undefined;
      if (parsed.data.chatToken && !chatUuid) return reply.code(403).send({ error: "شناسهٔ گفت‌وگو معتبر نیست." });
      let newChatUuid = "";
      const options = {
        ...modelUsage(billing, request, "interview_session"),
        signal: abort.signal,
        chatUuid: chatUuid ?? undefined,
        onChatUuid: (uuid: string) => {
          newChatUuid = uuid;
        },
      };
      const turn = interviewAgent
        ? await interviewAgent.nextQuestion(parsed.data, options)
        : await createLegacyInterviewTurn(parsed.data, options);
      return {
        ...turn,
        ...(interviewAgent
          ? { chatToken: signInterviewChat(newChatUuid, request.auth!.user.id, interviewChatSecret!) }
          : {}),
      };
    } catch (error) {
      return modelError(reply, error, "ساخت سؤال بعدی ناموفق بود. دوباره تلاش کن.");
    } finally {
      abort.dispose();
    }
  });

  app.post("/api/interview/clarify", async (request, reply) => {
    const parsed = z
      .object({
        mode: z.string().trim().min(1).max(200),
        chatToken: z.string().max(200).optional(),
        question: z.string().trim().min(1).max(500),
        userMessage: z.string().trim().min(1).max(1_000),
        history: z.array(z.object({ question: z.string().max(500), answer: z.string().max(8_000) })).max(30),
      })
      .safeParse(request.body);
    if (!parsed.success) return reply.code(422).send({ error: "پیام گفت‌وگو معتبر نیست." });
    const abort = modelRequestAbort(request, reply);
    try {
      const chatUuid = parsed.data.chatToken
        ? verifyInterviewChat(parsed.data.chatToken, request.auth!.user.id, interviewChatSecret!)
        : undefined;
      if (parsed.data.chatToken && !chatUuid) return reply.code(403).send({ error: "شناسهٔ گفت‌وگو معتبر نیست." });
      let newChatUuid = "";
      const options = {
        ...modelUsage(billing, request, "interview_session"),
        signal: abort.signal,
        chatUuid: chatUuid ?? undefined,
        onChatUuid: (uuid: string) => {
          newChatUuid = uuid;
        },
      };
      const response = interviewAgent
        ? await interviewAgent.clarify(parsed.data, options)
        : await createLegacyInterviewClarification(parsed.data, options);
      return {
        ...response,
        ...(interviewAgent
          ? { chatToken: signInterviewChat(newChatUuid, request.auth!.user.id, interviewChatSecret!) }
          : {}),
      };
    } catch (error) {
      return modelError(reply, error, "پاسخ مصاحبه‌گر آماده نشد. دوباره تلاش کن.");
    } finally {
      abort.dispose();
    }
  });

  app.post("/api/interview/feedback", async (request, reply) => {
    const body = bodyOf(request.body);
    const answer = textOf(body.answer).trim();
    if (!answer) return reply.code(400).send({ error: "پاسخ برای دریافت بازخورد کافی نیست." });
    try {
      const result = await chatJson<JsonObject>(
        getAnalyzeConfig(),
        [
          {
            role: "system",
            content: "تو مربی مصاحبه هستی. فقط JSON معتبر فارسی و کوتاه برگردان.",
          },
          {
            role: "user",
            content: `سؤال: ${textOf(body.question)}\nپاسخ کاربر: ${answer}\nJSON: {"title":string,"text":string}`,
          },
        ],
        modelUsage(billing, request, "interview_feedback"),
      );
      if (!textOf(result.title).trim() || !textOf(result.text).trim()) throw new Error("مدل بازخورد کامل تولید نکرد.");
      return {
        title: textOf(result.title).trim(),
        text: textOf(result.text).trim(),
      };
    } catch (error) {
      return modelError(reply, error, "مدل بازخورد پاسخ نداد.");
    }
  });
}
