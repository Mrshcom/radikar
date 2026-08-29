import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { chatJson, getAnalyzeConfig, getWriteConfig } from "@radicar/ai";
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
  return typeof value === "string" ? value : "";
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function clampScore(value: unknown) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function normalizeAnalysis(result: ModelAnalysis): Analysis {
  if (result.isJobPosting !== true) {
    throw new Error(
      result.invalidReason?.trim() ||
        "متن واردشده یک آگهی شغلی قابل تحلیل نیست.",
    );
  }
  if (!Array.isArray(result.breakdown) || result.breakdown.length < 4) {
    throw new Error("مدل شواهد کافی برای محاسبه امتیاز تطبیق ارائه نکرد.");
  }
  const breakdown = result.breakdown.slice(0, 4).map((item, index) => ({
    label:
      item.label?.trim() ||
      [
        "تناسب عنوان و حوزه شغلی",
        "همپوشانی مهارت‌های الزامی",
        "ارتباط سابقه و مسئولیت‌ها",
        "تحصیلات و شرایط تکمیلی",
      ][index],
    value: clampScore(item.value),
  }));
  return {
    score: Math.round(
      breakdown.reduce(
        (total, item, index) =>
          total + item.value * breakdownWeights[index],
        0,
      ),
    ),
    jobTitle: result.jobTitle?.trim() || "عنوان شغل در آگهی مشخص نشده",
    company: result.company?.trim() || "نام شرکت در آگهی مشخص نشده",
    breakdown,
    strengths: stringArray(result.strengths).slice(0, 5),
    gaps: stringArray(result.gaps).slice(0, 4),
  };
}

function modelError(reply: FastifyReply, error: unknown, fallback: string) {
  return reply.code(502).send({
    error: error instanceof Error ? error.message : fallback,
  });
}

function preserveResumeArrays(base: JsonObject, generated: JsonObject) {
  return {
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
  };
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

export function registerAiRoutes(app: FastifyInstance, billing?: BillingService) {
  app.post("/api/match/analyze", async (request, reply) => {
    const body = bodyOf(request.body);
    const jobDescription = textOf(body.jobDescription).trim();
    const resume = asObject(body.resume);
    const validation = validateJobDescription(jobDescription);
    if (!validation.valid)
      return reply.code(422).send({ error: validation.error });
    if (!hasResumeContent(resume))
      return reply.code(422).send({ error: "رزومه مبنا خالی است." });

    const usage = { ai: 2, match: 1 } satisfies UsageCosts;
    await consume(billing, request, usage, "match_analyze");
    try {
      const result = await chatJson<ModelAnalysis>(getAnalyzeConfig(), [
        {
          role: "system",
          content:
            "تو یک متخصص سخت‌گیر ATS هستی. فقط JSON معتبر بدون markdown برگردان. هیچ امتیازی را بر اساس کیفیت کلی رزومه یا حدس خودت نده؛ فقط همپوشانی صریح رزومه با نیازمندی‌های همین آگهی ملاک است.",
        },
        {
          role: "user",
          content: `ابتدا بررسی کن متن واقعاً آگهی شغلی است. اگر معتبر بود چهار امتیاز مستقل ۰ تا ۱۰۰ برای تناسب عنوان (۳۰٪)، مهارت‌ها (۳۵٪)، سابقه (۲۵٪) و تحصیلات (۱۰٪) بده. نبود شواهد یعنی صفر و هیچ داده‌ای نساز.\nرزومه:\n${JSON.stringify(resume, null, 2)}\nشرح شغل:\n${jobDescription}\nJSON: {"isJobPosting":boolean,"invalidReason":string,"jobTitle":string,"company":string,"breakdown":[{"label":string,"value":number}],"strengths":string[],"gaps":string[]}`,
        },
      ]);
      return normalizeAnalysis(result);
    } catch (error) {
      await refund(billing, request, usage, "match_analyze");
      const message =
        error instanceof Error ? error.message : "تحلیل مدل ناموفق بود.";
      return reply
        .code(message.includes("آگهی شغلی قابل تحلیل نیست") ? 422 : 502)
        .send({ error: message });
    }
  });

  app.post("/api/match/tailor", async (request, reply) => {
    const body = bodyOf(request.body);
    const jobDescription = textOf(body.jobDescription).trim();
    const resume = asObject(body.resume);
    const validation = validateJobDescription(jobDescription);
    if (!validation.valid)
      return reply.code(422).send({ error: validation.error });
    if (!hasResumeContent(resume))
      return reply.code(422).send({ error: "رزومه مبنا خالی است." });
    const languageName = body.language === "en" ? "English" : "Persian";

    const usage = { ai: 5 } satisfies UsageCosts;
    await consume(billing, request, usage, "match_tailor");
    try {
      const tailored = await chatJson<JsonObject>(getWriteConfig(), [
        {
          role: "system",
          content: `You are a professional ${languageName} resume writer. Return valid JSON only. Do not invent facts. Preserve contact fields and every experience, project and education id.`,
        },
        {
          role: "user",
          content: `Base resume:\n${JSON.stringify(resume, null, 2)}\nTarget job:\n${jobDescription}\nRewrite human-readable fields in ${languageName}. Keep every record and id. Return every resume field as JSON.`,
        },
      ]);
      return { resume: preserveResumeArrays(resume, tailored) };
    } catch (error) {
      await refund(billing, request, usage, "match_tailor");
      return modelError(reply, error, "ساخت رزومه اختصاصی با مدل ناموفق بود.");
    }
  });

  app.post("/api/resume/generate", async (request, reply) => {
    const body = bodyOf(request.body);
    const resume = asObject(body.resume);
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
      ]);
      return { resume: preserveResumeArrays(resume, generated) };
    } catch (error) {
      await refund(billing, request, usage, "resume_generate");
      return modelError(reply, error, "مدل رزومه‌ساز پاسخ نداد.");
    }
  });

  app.post("/api/panel/dashboard", async (request, reply) => {
    const body = bodyOf(request.body);
    const resume = asObject(body.resume);
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
      );
      const fields = [
        data.subtitle,
        data.heroTitle,
        data.heroText,
        data.aiTitle,
        data.aiText,
      ];
      if (fields.some((value) => !value?.trim()))
        throw new Error("خروجی مدل برای ساخت داشبورد کامل نیست.");
      const fullName = textOf(resume.fullName).trim().split(/\s+/)[0];
      return {
        greeting: fullName
          ? `سلام ${fullName}، آماده‌ی یک قدم تازه‌ای؟`
          : "سلام، آماده‌ی یک قدم تازه‌ای؟",
        subtitle: data.subtitle!.trim(),
        profileScore: clampScore(data.profileScore),
        heroTitle: data.heroTitle!.trim(),
        heroText: data.heroText!.trim(),
        aiTitle: data.aiTitle!.trim(),
        aiText: data.aiText!.trim(),
      };
    } catch (error) {
      return modelError(reply, error, "مدل داشبورد پاسخ نداد.");
    }
  });

  app.post("/api/interview/session", async (request, reply) => {
    const body = bodyOf(request.body);
    const resume = asObject(body.resume);
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
      ]);
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
        cards: Array.isArray(result.cards) ? result.cards.slice(0, 3) : [],
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
      ]);
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
