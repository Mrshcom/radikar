import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { chatJson, getAnalyzeConfig, getWriteConfig } from "@radicar/ai";
import {
  normalizeImportedBoolean,
  normalizeImportedText,
  normalizeImportedTextArray,
  normalizeStoredResumeData,
} from "@radicar/validators";
import {
  asObject,
  hasResumeContent,
  type JsonObject,
  validateJobDescription,
} from "./helpers";
import type { BillingService, UsageCosts } from "../billing/service";

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

function clampScore(value: unknown) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function normalizeAnalysis(result: ModelAnalysis): Analysis {
  const safeResult = asObject(result);
  if (!normalizeImportedBoolean(safeResult.isJobPosting)) {
    throw new Error(
      textOf(safeResult.invalidReason) ||
        "متن واردشده یک آگهی شغلی قابل تحلیل نیست.",
    );
  }
  if (!Array.isArray(safeResult.breakdown) || safeResult.breakdown.length < 4) {
    throw new Error("مدل شواهد کافی برای محاسبه امتیاز تطبیق ارائه نکرد.");
  }
  const breakdown = safeResult.breakdown.slice(0, 4).map((item, index) => {
    const safeItem = asObject(item);
    return {
      label:
        textOf(safeItem.label) ||
        [
          "تناسب عنوان و حوزه شغلی",
          "همپوشانی مهارت‌های الزامی",
          "ارتباط سابقه و مسئولیت‌ها",
          "تحصیلات و شرایط تکمیلی",
        ][index],
      value: clampScore(safeItem.value),
    };
  });
  return {
    score: Math.round(
      breakdown.reduce(
        (total, item, index) =>
          total + item.value * breakdownWeights[index],
        0,
      ),
    ),
    jobTitle: textOf(safeResult.jobTitle) || "عنوان شغل در آگهی مشخص نشده",
    company: textOf(safeResult.company) || "نام شرکت در آگهی مشخص نشده",
    breakdown,
    strengths: stringArray(safeResult.strengths).slice(0, 5),
    gaps: stringArray(safeResult.gaps).slice(0, 4),
  };
}

function modelError(reply: FastifyReply, error: unknown, fallback: string) {
  return reply.code(502).send({
    error: error instanceof Error ? error.message : fallback,
  });
}

function preserveResumeArrays(base: JsonObject, generated: JsonObject) {
  return normalizeStoredResumeData({
    ...base,
    ...generated,
    experiences: Array.isArray(generated.experiences)
      ? generated.experiences
      : base.experiences,
    projects: Array.isArray(generated.projects)
      ? generated.projects
      : base.projects,
    educations: Array.isArray(generated.educations)
      ? generated.educations
      : base.educations,
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
    experiences: mergeDescriptionPatches(
      base.experiences,
      patch.experiences,
    ),
    projects: mergeDescriptionPatches(base.projects, patch.projects),
  });
}

function getTailorWriteConfig() {
  const config = getWriteConfig();
  if (
    config.provider === "freeDeepseekAPI" &&
    /(?:reasoner|r1)/i.test(config.model)
  ) {
    return { ...config, model: "deepseek-chat" };
  }
  return config;
}

export function getMatchAnalyzeConfig() {
  const config = getAnalyzeConfig();
  if (
    config.provider === "freeDeepseekAPI" &&
    /(?:reasoner|r1)/i.test(config.model)
  ) {
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

function modelUsage(
  billing: BillingService | undefined,
  request: FastifyRequest,
  operation: string,
) {
  if (!billing) return undefined;
  return {
    onUsage: (event: Parameters<BillingService["recordModelUsage"]>[3]) =>
      billing.recordModelUsage(
        request.auth!.user.id,
        `${request.id}:${operation}:${event.attempt}`,
        operation,
        event,
      ),
  };
}

function modelRequestAbort(
  request: FastifyRequest,
  reply: FastifyReply,
) {
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

export function registerAiRoutes(app: FastifyInstance, billing?: BillingService) {
  app.post("/api/match/analyze", async (request, reply) => {
    const body = bodyOf(request.body);
    const jobDescription = textOf(body.jobDescription).trim();
    const resume = asObject(normalizeStoredResumeData(body.resume));
    const validation = validateJobDescription(jobDescription);
    if (!validation.valid)
      return reply.code(422).send({ error: validation.error });
    if (!hasResumeContent(resume))
      return reply.code(422).send({ error: "رزومه مبنا خالی است." });

    const usage = { ai: 2, match: 1 } satisfies UsageCosts;
    await consume(billing, request, usage, "match_analyze");
    const requestAbort = modelRequestAbort(request, reply);
    try {
      const result = await chatJson<ModelAnalysis>(getMatchAnalyzeConfig(), [
        {
          role: "system",
          content:
            "تو یک متخصص سخت‌گیر ATS هستی. فقط JSON معتبر بدون markdown برگردان. هیچ امتیازی را بر اساس کیفیت کلی رزومه یا حدس خودت نده؛ فقط همپوشانی صریح رزومه با نیازمندی‌های همین آگهی ملاک است.",
        },
        {
          role: "user",
          content: `ابتدا بررسی کن متن واقعاً آگهی شغلی است. اگر معتبر بود چهار امتیاز مستقل ۰ تا ۱۰۰ برای تناسب عنوان (۳۰٪)، مهارت‌ها (۳۵٪)، سابقه (۲۵٪) و تحصیلات (۱۰٪) بده. نبود شواهد یعنی صفر و هیچ داده‌ای نساز.\nرزومه:\n${JSON.stringify(resume, null, 2)}\nشرح شغل:\n${jobDescription}\nJSON: {"isJobPosting":boolean,"invalidReason":string,"jobTitle":string,"company":string,"breakdown":[{"label":string,"value":number}],"strengths":string[],"gaps":string[]}`,
        },
      ], {
        ...modelUsage(billing, request, "match_analyze"),
        signal: requestAbort.signal,
        emptyResponseMessage:
          "مدل پاسخی برای تحلیل تطابق نداد. لطفاً دوباره تلاش کن.",
        maxAttempts: 2,
        maxOutputTokens: 2_048,
      });
      return normalizeAnalysis(result);
    } catch (error) {
      await refund(billing, request, usage, "match_analyze");
      if (requestAbort.signal.aborted) return reply;
      const message =
        error instanceof Error ? error.message : "تحلیل مدل ناموفق بود.";
      return reply
        .code(message.includes("آگهی شغلی قابل تحلیل نیست") ? 422 : 502)
        .send({ error: message });
    } finally {
      requestAbort.dispose();
    }
  });

  app.post("/api/match/tailor", async (request, reply) => {
    const body = bodyOf(request.body);
    const jobDescription = textOf(body.jobDescription).trim();
    const resume = asObject(normalizeStoredResumeData(body.resume));
    const validation = validateJobDescription(jobDescription);
    if (!validation.valid)
      return reply.code(422).send({ error: validation.error });
    if (!hasResumeContent(resume))
      return reply.code(422).send({ error: "رزومه مبنا خالی است." });
    const languageName = body.language === "en" ? "English" : "Persian";

    const usage = { ai: 5 } satisfies UsageCosts;
    await consume(billing, request, usage, "match_tailor");
    try {
      const tailored = await chatJson<JsonObject>(
        getTailorWriteConfig(),
        [
          {
            role: "system",
            content: `You are a professional ${languageName} resume writer. Return valid JSON only. Tailor existing facts to the target job without inventing facts, employers, skills or achievements.`,
          },
          {
            role: "user",
            content: `Base resume:\n${JSON.stringify(resume)}\nTarget job:\n${jobDescription}\nReturn only a concise rewrite patch in ${languageName}. Keep every supplied id exactly unchanged. Do not repeat contact details, dates, companies, titles, education or unchanged fields. JSON: {"summary":string,"skills":[string],"experiences":[{"id":string,"description":string}],"projects":[{"id":string,"description":string}]}`,
          },
        ],
        {
          ...modelUsage(billing, request, "match_tailor"),
          emptyResponseMessage:
            "مدل پاسخی برای ساخت رزومه اختصاصی نداد. لطفاً دوباره تلاش کن.",
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
    if (!hasResumeContent(resume))
      return reply
        .code(422)
        .send({ error: "ابتدا اطلاعات واقعی رزومه را وارد کن." });
    const languageName = body.language === "en" ? "English" : "Persian";
    const usage = { ai: 2 } satisfies UsageCosts;
    await consume(billing, request, usage, "resume_generate");
    try {
      const generated = await chatJson<JsonObject>(getWriteConfig(), [
        {
          role: "system",
          content: `You are a professional ${languageName} resume writer. Return valid JSON only. Do not invent facts. Preserve contact fields and every experience, project and education id.`,
        },
        {
          role: "user",
          content: `Current resume:\n${JSON.stringify(resume, null, 2)}\nKnowledge base:\n${JSON.stringify(asObject(body.knowledge), null, 2)}\nInstruction: ${textOf(body.instruction) || `Create an ATS-friendly resume in ${languageName}.`}\nKeep every record and return every resume field as JSON.`,
        },
      ], modelUsage(billing, request, "resume_generate"));
      return { resume: preserveResumeArrays(resume, generated) };
    } catch (error) {
      await refund(billing, request, usage, "resume_generate");
      return modelError(reply, error, "مدل رزومه‌ساز پاسخ نداد.");
    }
  });

  app.post("/api/panel/dashboard", async (request, reply) => {
    const body = bodyOf(request.body);
    const resume = asObject(normalizeStoredResumeData(body.resume));
    if (!hasResumeContent(resume))
      return reply
        .code(422)
        .send({ error: "برای ساخت داشبورد ابتدا رزومه را تکمیل کن." });
    try {
      const data = await chatJson<Partial<DashboardData>>(
        getAnalyzeConfig(),
        [
          {
            role: "system",
            content:
              "تو تحلیل‌گر پروفایل حرفه‌ای هستی. فقط JSON معتبر و فارسی برگردان و هیچ داده‌ای نساز.",
          },
          {
            role: "user",
            content: `رزومه:\n${JSON.stringify(resume, null, 2)}\nپایگاه دانش:\n${JSON.stringify(asObject(body.knowledge), null, 2)}\nJSON: {"subtitle":string,"profileScore":number,"heroTitle":string,"heroText":string,"aiTitle":string,"aiText":string}`,
          },
        ],
        modelUsage(billing, request, "dashboard"),
      );
      const fields = [
        data.subtitle,
        data.heroTitle,
        data.heroText,
        data.aiTitle,
        data.aiText,
      ].map(textOf);
      if (fields.some((value) => !value))
        throw new Error("خروجی مدل برای ساخت داشبورد کامل نیست.");
      const fullName = textOf(resume.fullName).trim().split(/\s+/)[0];
      return {
        greeting: fullName
          ? `سلام ${fullName}، آماده‌ی یک قدم تازه‌ای؟`
          : "سلام، آماده‌ی یک قدم تازه‌ای؟",
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
      return reply
        .code(422)
        .send({ error: "برای ساخت جلسه مصاحبه ابتدا رزومه را تکمیل کن." });
    const usage = { ai: 5, interview: 1 } satisfies UsageCosts;
    await consume(billing, request, usage, "interview_session");
    try {
      const result = await chatJson<JsonObject>(getAnalyzeConfig(), [
        {
          role: "system",
          content: "تو مربی مصاحبه شغلی هستی. فقط JSON معتبر فارسی برگردان.",
        },
        {
          role: "user",
          content: `رزومه:\n${JSON.stringify(resume, null, 2)}\nپایگاه دانش:\n${JSON.stringify(asObject(body.knowledge), null, 2)}\nحالت: ${textOf(body.mode) || "ترکیبی"}\nشرح شغل: ${textOf(body.jobDescription) || "ندارد"}\nJSON: {"title":string,"subtitle":string,"duration":string,"questions":string[],"cards":[{"title":string,"text":string,"tone":"lavender|mint|peach"}]}`,
        },
      ], modelUsage(billing, request, "interview_session"));
      const questions = stringArray(result.questions);
      if (
        !textOf(result.title).trim() ||
        !textOf(result.subtitle).trim() ||
        !textOf(result.duration).trim() ||
        !questions.length
      )
        throw new Error("مدل جلسه مصاحبه کامل تولید نکرد.");
      return {
        title: textOf(result.title).trim(),
        subtitle: textOf(result.subtitle).trim(),
        duration: textOf(result.duration).trim(),
        questions: questions.slice(0, 6),
        cards: (Array.isArray(result.cards)
          ? result.cards
          : result.cards
            ? [result.cards]
            : [])
          .slice(0, 3)
          .map((card) => {
            const safeCard = asObject(card);
            const tone = textOf(safeCard.tone);
            return {
              title: textOf(safeCard.title),
              text: textOf(safeCard.text),
              tone: ["lavender", "mint", "peach"].includes(tone)
                ? tone
                : "mint",
            };
          })
          .filter((card) => card.title && card.text),
      };
    } catch (error) {
      await refund(billing, request, usage, "interview_session");
      return modelError(reply, error, "مدل مصاحبه پاسخ نداد.");
    }
  });

  app.post("/api/interview/feedback", async (request, reply) => {
    const body = bodyOf(request.body);
    const answer = textOf(body.answer).trim();
    if (!answer)
      return reply
        .code(400)
        .send({ error: "پاسخ برای دریافت بازخورد کافی نیست." });
    try {
      const result = await chatJson<JsonObject>(getAnalyzeConfig(), [
        {
          role: "system",
          content: "تو مربی مصاحبه هستی. فقط JSON معتبر فارسی و کوتاه برگردان.",
        },
        {
          role: "user",
          content: `سؤال: ${textOf(body.question)}\nپاسخ کاربر: ${answer}\nJSON: {"title":string,"text":string}`,
        },
      ], modelUsage(billing, request, "interview_feedback"));
      if (!textOf(result.title).trim() || !textOf(result.text).trim())
        throw new Error("مدل بازخورد کامل تولید نکرد.");
      return {
        title: textOf(result.title).trim(),
        text: textOf(result.text).trim(),
      };
    } catch (error) {
      return modelError(reply, error, "مدل بازخورد پاسخ نداد.");
    }
  });
}
