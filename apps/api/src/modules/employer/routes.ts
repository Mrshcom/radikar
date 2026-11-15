import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { and, asc, desc, eq, getTableColumns, inArray, ne, sql } from "drizzle-orm";
import * as mammoth from "mammoth";
import { extractText as extractPdfText, getDocumentProxy } from "unpdf";
import { z } from "zod";
import { chatJson, getAnalyzeConfig } from "@radikar/ai";
import { normalizeIranianMobile } from "@radikar/validators";
import {
  employerCandidates,
  employerInvitationHistory,
  employerPositions,
  employerProfiles,
  employerResumeBank,
  userNotifications,
  users,
  type Database,
} from "@radikar/database";
import type { RadicoinService } from "../radicoin/service";
import type { InterviewAgentClient } from "../ai/interview-agent";
import { interviewTopicsSchema, parseInterviewReport } from "../ai/interview-report";
import { createLegacyInterviewTurn, createLegacyInterviewClarification } from "../ai/interview-legacy";
import type { InterviewInvitationDelivery } from "../notifications/otp-delivery";

const positionSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(12_000),
});
const employerProfileSchema = z.object({ companyName: z.string().trim().min(2).max(120) });
const idSchema = z.object({ id: z.uuid() });
const resumeIdSchema = z.object({ id: z.uuid(), candidateId: z.uuid() });
const bulkResumeDeleteSchema = z.object({ candidateIds: z.array(z.uuid()).min(1).max(100) });
const positionClosureSchema = z.object({
  reason: z.enum(["hired", "cancelled", "changed_need", "duplicate", "other"]),
  note: z.string().trim().max(1_000).optional(),
  hiredCandidateId: z.uuid().optional(),
});
const bankResumeIdSchema = z.object({ resumeId: z.uuid() });
const bankImportSchema = z.object({ resumeIds: z.array(z.uuid()).min(1).max(100) });
const reviewMethodSchema = z.object({ method: z.enum(["manual", "smart"]) });
const inviteSchema = z.object({ candidateIds: z.array(z.uuid()).min(1).max(20), deadline: z.iso.datetime() });
const renewInvitationSchema = z.object({ deadline: z.iso.datetime().optional() });
const maxInterviewTurns = 12;
const answerSchema = z.object({ answers: z.array(z.string().trim().max(8_000)).max(maxInterviewTurns) });
const turnSchema = z.object({
  questionIndex: z
    .number()
    .int()
    .min(0)
    .max(maxInterviewTurns - 1),
  answer: z.string().trim().min(10).max(8_000),
});
const clarificationInputSchema = z.object({
  questionIndex: z
    .number()
    .int()
    .min(0)
    .max(maxInterviewTurns - 1),
  userMessage: z.string().trim().min(1).max(1_000),
});
const feedbackSharingSchema = z.object({ shared: z.boolean() });
const interviewQuestionsSchema = z.object({ questions: z.array(z.string().trim().min(10).max(500)).length(5) });
const interviewReportSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string().trim().min(1).max(2000),
  strengths: z.array(z.string()).max(8),
  improvements: z.array(z.string()).max(8),
  topics: interviewTopicsSchema.optional(),
});
const tokenSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) });
const screeningCost = 14;
const interviewCost = 84;
const maxFiles = 100;
const maxFileBytes = 5 * 1024 * 1024;
const maxBatchBytes = 40 * 1024 * 1024;
const { fileData: originalFileColumn, ...candidateColumns } = getTableColumns(employerCandidates);
void originalFileColumn;

function hash(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function fail(reply: FastifyReply, status: number, error: string) {
  return reply.code(status).send({ error });
}

function isProviderQuotaError(error: unknown) {
  return error instanceof Error && /(?:quota|credit|balance|pre-consume)/i.test(error.message);
}

function fallbackInterviewQuestions(title: string) {
  return [
    `از تجربهٔ مرتبط خود با موقعیت «${title}» و مسئولیت‌هایی که بر عهده داشته‌اید بگویید.`,
    "یک مسئلهٔ کاری پیچیده را که اخیراً حل کرده‌اید توضیح دهید و بگویید چگونه به راه‌حل رسیدید.",
    "هنگام اولویت‌بندی چند کار هم‌زمان، چه معیارهایی دارید و چگونه تیم را در جریان می‌گذارید؟",
    "نمونه‌ای از دریافت بازخورد سازنده را شرح دهید و بگویید چه تغییری در روش کارتان ایجاد کرد.",
    "اگر این موقعیت را شروع کنید، در ۹۰ روز اول چه هدف‌هایی برای خودتان تعیین می‌کنید؟",
  ];
}

function customer(request: FastifyRequest, reply: FastifyReply, accountType: "candidate" | "employer" = "employer") {
  if (request.auth?.user.role === "user" && request.auth.user.accountType === accountType) return true;
  fail(reply, 403, "این بخش برای نوع حساب شما در دسترس نیست.");
  return false;
}

function publicCandidate(
  candidate: Omit<typeof employerCandidates.$inferSelect, "fileData"> & { hasOriginalFile: boolean },
) {
  const { resumeText, fileHash, invitationTokenHash, ...safe } = candidate;
  void resumeText;
  void fileHash;
  void invitationTokenHash;
  return safe;
}

function publicBankResume(resume: typeof employerResumeBank.$inferSelect) {
  const { fileData, fileHash, resumeText, ...safe } = resume;
  void fileData;
  void fileHash;
  void resumeText;
  return {
    ...safe,
    specialty: resume.specialty ?? specialtyOf(resume.resumeText),
    hasOriginalFile: resume.fileData !== null,
  };
}

function fileExtension(name: string) {
  return name.toLowerCase().split(".").pop() ?? "";
}

export function cleanResumeText(value: string) {
  // Some PDF fonts produce NUL characters that PostgreSQL cannot store in text columns.
  return value.replace(/\u0000/g, "").trim();
}

async function resumeText(name: string, bytes: Buffer) {
  if (fileExtension(name) === "docx") return cleanResumeText((await mammoth.extractRawText({ buffer: bytes })).value);
  if (fileExtension(name) !== "pdf") throw new Error("فقط فایل PDF و DOCX پشتیبانی می‌شود.");
  const document = await getDocumentProxy(new Uint8Array(bytes));
  try {
    if (document.numPages > 30) throw new Error("رزومهٔ PDF باید حداکثر ۳۰ صفحه داشته باشد.");
    return cleanResumeText((await extractPdfText(document, { mergePages: true })).text);
  } finally {
    await (document as typeof document & { destroy?: () => Promise<void> }).destroy?.();
  }
}

const phonePattern = /(?:\+98|0098|0)?[\s-]*[9۹٩](?:[\s-]*[0-9۰-۹٠-٩]){9}/g;

function latinDigits(text: string) {
  return text
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632));
}

export function contactOf(text: string) {
  const rawPhone = text.match(phonePattern)?.[0];
  const digits = rawPhone ? latinDigits(rawPhone).replace(/\D/g, "") : "";
  const phone = digits.startsWith("0098")
    ? `0${digits.slice(4)}`
    : digits.startsWith("98")
      ? `0${digits.slice(2)}`
      : digits.startsWith("9")
        ? `0${digits}`
        : digits;
  return {
    email: text.match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,63}/i)?.[0]?.toLowerCase() ?? null,
    phone: /^09\d{9}$/.test(phone) ? phone : null,
  };
}

type ResumeIdentity = {
  fileHash: string;
  email?: string | null;
  phone?: string | null;
};

function isDuplicateResume(resume: ResumeIdentity, knownResumes: readonly ResumeIdentity[]) {
  return knownResumes.some(
    (known) =>
      known.fileHash === resume.fileHash ||
      (resume.email != null && known.email != null && resume.email.toLowerCase() === known.email.toLowerCase()) ||
      (resume.phone != null && known.phone != null && resume.phone === known.phone),
  );
}

function nameOf(text: string) {
  const candidate = text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s+/g, " "))
    .find(
      (line) =>
        line.length >= 3 &&
        line.length <= 80 &&
        !/@|\d{5,}|رزومه|resume|curriculum vitae|linkedin/i.test(line) &&
        /^[\p{L}\s.'’-]+$/u.test(line),
    );
  return candidate ?? null;
}

const specialtySignal =
  /\b(?:developer|engineer|designer|manager|specialist|expert|consultant|analyst|programmer|sales|marketing|devops|qa|backend|frontend|front-end|back-end)\b|\b(?:senior|junior|lead|staff|principal)\s+(?:java|react|angular|node(?:\.js)?|\.net|dotnet|php|python|laravel)\b|(?:برنامه[‌\s-]*نویس|توسعه[‌\s-]*دهنده|مهندس|طراح|مدیر|کارشناس|متخصص|مشاور|تحلیلگر|فروش|بازاریابی|فرانت[‌\s-]*اند|بک[‌\s-]*اند|دواپس|(?:ارشد|جونیور|لید)\s+جاوا)/i;
const specialtyNoise =
  /^(?:skills?|technical skills?|experience|work experience|education|contact|summary|profile|مهارت(?:‌ها)?|سوابق(?: کاری)?|تحصیلات|تماس|خلاصه|پروفایل)\s*:?$/i;
const specialtyProse = /(?:فرصت|دنبال|علاقه|توانایی|کارآموزی|می[‌\s]?(?:توان|کن|باش)|هستم)/i;

export function specialtyOf(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^[\s•·▪◦—–-]+/, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(
      (line) =>
        line.length >= 3 &&
        line.length <= 64 &&
        line.split(" ").length <= 8 &&
        !specialtyNoise.test(line) &&
        !specialtyProse.test(line),
    );
  const candidate = lines.slice(0, 36).find((line) => specialtySignal.test(line) && !/@|\+?\d[\d\s()-]{7,}/.test(line));
  return candidate ?? null;
}

async function prepareBankResume(ownerUserId: string, fileName: string, bytes: Buffer) {
  let extracted = "";
  let extractionError: string | null = null;
  try {
    extracted = (await resumeText(fileName, bytes)).slice(0, 24_000);
    if (extracted.length < 80) extractionError = "متن قابل‌خواندن کافی در فایل پیدا نشد.";
  } catch (error) {
    extractionError = error instanceof Error ? error.message : "خواندن فایل ناموفق بود.";
  }
  return {
    id: randomUUID(),
    ownerUserId,
    fileName,
    fileHash: hash(bytes),
    fileData: bytes,
    resumeText: extracted,
    extractionError,
    name: nameOf(extracted),
    specialty: specialtyOf(extracted),
    ...contactOf(extracted),
    createdAt: new Date(),
    updatedAt: new Date(),
  } satisfies typeof employerResumeBank.$inferInsert;
}

function screeningKey(position: typeof employerPositions.$inferSelect) {
  return `employer-screening:${position.id}:${position.screeningStartedAt?.toISOString()}`;
}

function invitationKey(candidateId: string) {
  return `employer-interview:${candidateId}`;
}

function newInvitationReservationKey(candidateId: string) {
  return `${invitationKey(candidateId)}:${randomUUID()}`;
}

function candidateReservationKey(
  candidate: Pick<typeof employerCandidates.$inferSelect, "id" | "invitationReservationKey">,
) {
  return candidate.invitationReservationKey ?? invitationKey(candidate.id);
}

export function registerEmployerRoutes(
  app: FastifyInstance,
  db: Database,
  radicoin: RadicoinService,
  webAppUrl: string,
  interviewAgent?: InterviewAgentClient,
  deliverInterviewInvitation?: InterviewInvitationDelivery,
) {
  async function saveInterviewInvitationNotification(
    userId: string,
    candidateId: string,
    position: typeof employerPositions.$inferSelect,
  ) {
    const now = new Date();
    await db
      .insert(userNotifications)
      .values({
        id: randomUUID(),
        userId,
        type: "interview_invitation",
        sourceKey: invitationKey(candidateId),
        title: `دعوت به مصاحبهٔ ${position.title}`,
        message: `برای موقعیت «${position.title}» در «${position.companyName}» به مصاحبه دعوت شده‌ای.`,
        href: `/interview-invites/${candidateId}`,
        readAt: null,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: [userNotifications.userId, userNotifications.sourceKey],
        set: {
          title: `دعوت به مصاحبهٔ ${position.title}`,
          message: `برای موقعیت «${position.title}» در «${position.companyName}» به مصاحبه دعوت شده‌ای.`,
          href: `/interview-invites/${candidateId}`,
          readAt: null,
          createdAt: now,
        },
      });
  }

  async function deliverInvitationSms(phone: string, token: string, request: FastifyRequest) {
    if (!deliverInterviewInvitation) return "sms_unavailable" as const;
    try {
      await deliverInterviewInvitation({ phone, token });
      return "sms_sent" as const;
    } catch (error) {
      request.log.warn({ err: error, phoneSuffix: phone.slice(-4) }, "Interview invitation SMS delivery failed");
      return "sms_failed" as const;
    }
  }

  async function profileOf(userId: string) {
    const [profile] = await db.select().from(employerProfiles).where(eq(employerProfiles.userId, userId)).limit(1);
    return profile ?? null;
  }

  async function ownedPosition(id: string, userId: string) {
    const [position] = await db
      .select()
      .from(employerPositions)
      .where(and(eq(employerPositions.id, id), eq(employerPositions.ownerUserId, userId)))
      .limit(1);
    return position;
  }

  async function hasPositionInvitations(id: string) {
    const [invited] = await db
      .select({ id: employerCandidates.id })
      .from(employerCandidates)
      .where(and(eq(employerCandidates.positionId, id), ne(employerCandidates.invitationStatus, "not_invited")))
      .limit(1);
    return Boolean(invited);
  }

  async function invitedCandidate(token: string) {
    const [candidate] = await db
      .select(candidateColumns)
      .from(employerCandidates)
      .where(eq(employerCandidates.invitationTokenHash, hash(token)))
      .limit(1);
    if (!candidate) return null;
    const [position] = await db
      .select()
      .from(employerPositions)
      .where(eq(employerPositions.id, candidate.positionId))
      .limit(1);
    return position ? { candidate, position } : null;
  }

  async function cancelledInvitation(token: string, userId: string) {
    const [invitation] = await db
      .select({ id: employerInvitationHistory.id })
      .from(employerInvitationHistory)
      .where(
        and(
          eq(employerInvitationHistory.tokenHash, hash(token)),
          eq(employerInvitationHistory.invitedUserId, userId),
        ),
      )
      .limit(1);
    return invitation ?? null;
  }

  async function candidateSession(value: string, userId: string) {
    const found = tokenSchema.safeParse({ token: value }).success
      ? await invitedCandidate(value)
      : idSchema.safeParse({ id: value }).success
        ? await (async () => {
            const [candidate] = await db
              .select(candidateColumns)
              .from(employerCandidates)
              .where(and(eq(employerCandidates.id, value), eq(employerCandidates.invitedUserId, userId)))
              .limit(1);
            if (!candidate) return null;
            const [position] = await db
              .select()
              .from(employerPositions)
              .where(eq(employerPositions.id, candidate.positionId))
              .limit(1);
            return position ? { candidate, position } : null;
          })()
        : null;
    return found;
  }

  async function analyzeInterview(
    position: typeof employerPositions.$inferSelect,
    answers: string[],
    incomplete = false,
    questions = position.interviewQuestions ?? [],
    chatUuid?: string,
  ) {
    const responses = questions.flatMap((question, index) =>
      answers[index]?.trim() ? [{ question, answer: answers[index] }] : [],
    );
    if (!responses.length && incomplete) {
      return {
        score: 0,
        summary: "نامزد پیش از ثبت پاسخ از مصاحبه خارج شد.",
        strengths: [],
        improvements: [],
      };
    }
    if (interviewAgent) {
      const report = parseInterviewReport(
        await interviewAgent.createReport(
          {
            mode: `مصاحبهٔ شغلی برای «${position.title}». معیارهای شغل: ${position.description.slice(0, 1_000)}`,
            responses,
          },
          { chatUuid },
        ),
        responses.length,
      );
      return interviewReportSchema.parse({
        score: incomplete ? Math.round((report.score * responses.length) / questions.length) : report.score,
        summary: incomplete ? `نامزد پیش از تکمیل مصاحبه خارج شد. ${report.summary}`.slice(0, 2_000) : report.summary,
        strengths: report.strengths,
        topics: report.topics,
        improvements: incomplete
          ? [...report.improvements, "تکمیل پاسخ همهٔ سؤال‌های مصاحبه"].slice(0, 8)
          : report.improvements,
      });
    }
    const result = await chatJson<unknown>(
      getAnalyzeConfig(),
      [
        {
          role: "system",
          content: incomplete
            ? "مصاحبهٔ شغلی با خروج زودهنگام نامزد تمام شده است. فقط پاسخ‌های ثبت‌شده را بر اساس معیارهای شغل تحلیل کن، سؤال‌های بی‌پاسخ را در امتیاز لحاظ کن و در خلاصه صریحاً خروج زودهنگام را بنویس. فقط JSON فارسی برگردان و تصمیم استخدام یا رد قطعی صادر نکن."
            : "مصاحبهٔ شغلی را فقط بر اساس پاسخ‌های ثبت‌شده و معیارهای شغل تحلیل کن. فقط JSON فارسی برگردان؛ هیچ تصمیم استخدام یا رد قطعی صادر نکن.",
        },
        {
          role: "user",
          content: `پوزیشن: ${position.title}\nشرح: ${position.description}\nسؤال‌ها و پاسخ‌ها: ${JSON.stringify(questions.map((question, index) => ({ question, answer: answers[index] ?? "" })))}\nحداکثر ۸ مبحث واقعاً پوشش‌داده‌شده را همراه با امتیاز ۰ تا ۱۰۰ و شاهد کوتاه از پاسخ نامزد ارزیابی کن.\nJSON: {"score":number,"summary":string,"strengths":string[],"improvements":string[],"topics":[{"title":string,"score":number,"evidence":string}]}`,
        },
      ],
      { maxOutputTokens: 1200, timeoutMs: 60_000 },
    );
    const report = interviewReportSchema.parse(result);
    return { ...report, score: Math.round(report.score) };
  }

  async function expireInvitation<
    T extends Pick<
      typeof employerCandidates.$inferSelect,
      "id" | "invitationDeadline" | "invitationReservationKey" | "invitationStatus"
    >,
  >(candidate: T, ownerUserId: string): Promise<T> {
    if (
      !candidate.invitationDeadline ||
      candidate.invitationDeadline >= new Date() ||
      candidate.invitationStatus === "not_invited" ||
      candidate.invitationStatus === "expired" ||
      candidate.invitationStatus === "completed"
    )
      return candidate;
    await radicoin.settleOperation(ownerUserId, candidateReservationKey(candidate), "release");
    const [expired] = await db
      .update(employerCandidates)
      .set({ invitationStatus: "expired", updatedAt: new Date() })
      .where(eq(employerCandidates.id, candidate.id))
      .returning({ invitationStatus: employerCandidates.invitationStatus });
    return { ...candidate, invitationStatus: expired.invitationStatus };
  }

  app.get("/api/employer/profile", async (request, reply) => {
    if (!customer(request, reply)) return;
    return { profile: await profileOf(request.auth!.user.id) };
  });

  app.get("/api/employer/activity-stats", async (request, reply) => {
    if (!customer(request, reply)) return;
    const ownerUserId = request.auth!.user.id;
    const [positionStats] = await db
      .select({
        positions: sql<number>`count(*)`,
        activePositions: sql<number>`count(*) filter (where ${employerPositions.closedAt} is null)`,
        hiredPositions: sql<number>`count(*) filter (where ${employerPositions.closureReason} = 'hired')`,
      })
      .from(employerPositions)
      .where(eq(employerPositions.ownerUserId, ownerUserId));
    const [candidateStats] = await db
      .select({
        candidates: sql<number>`count(*)`,
        screenedCandidates: sql<number>`count(*) filter (where ${employerCandidates.screeningStatus} = 'ready')`,
        interviewInvitations: sql<number>`count(*) filter (where ${employerCandidates.invitationStatus} <> 'not_invited')`,
      })
      .from(employerCandidates)
      .innerJoin(employerPositions, eq(employerCandidates.positionId, employerPositions.id))
      .where(eq(employerPositions.ownerUserId, ownerUserId));
    const wallet = await radicoin.getWallet(ownerUserId, 0);
    return {
      positions: Number(positionStats?.positions ?? 0),
      activePositions: Number(positionStats?.activePositions ?? 0),
      hiredPositions: Number(positionStats?.hiredPositions ?? 0),
      candidates: Number(candidateStats?.candidates ?? 0),
      screenedCandidates: Number(candidateStats?.screenedCandidates ?? 0),
      interviewInvitations: Number(candidateStats?.interviewInvitations ?? 0),
      radicoinBalance: wallet.wallet?.availableCoins ?? 0,
    };
  });

  app.post("/api/employer/profile", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { companyName } = employerProfileSchema.parse(request.body);
    const now = new Date();
    const [profile] = await db
      .insert(employerProfiles)
      .values({
        userId: request.auth!.user.id,
        companyName,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing()
      .returning();
    if (!profile) return fail(reply, 409, "فضای کارفرمای این حساب قبلاً ثبت شده است.");
    return reply.code(201).send({ profile });
  });

  app.patch("/api/employer/profile", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { companyName } = employerProfileSchema.parse(request.body);
    const [profile] = await db
      .update(employerProfiles)
      .set({ companyName, updatedAt: new Date() })
      .where(eq(employerProfiles.userId, request.auth!.user.id))
      .returning();
    if (!profile) return fail(reply, 404, "پروفایل شرکت پیدا نشد.");
    return { profile };
  });

  app.get("/api/employer/resume-bank", async (request, reply) => {
    if (!customer(request, reply)) return;
    const resumes = await db
      .select()
      .from(employerResumeBank)
      .where(eq(employerResumeBank.ownerUserId, request.auth!.user.id))
      .orderBy(asc(employerResumeBank.createdAt));
    if (!resumes.length) return [];
    const associations = await db
      .select({
        id: employerCandidates.id,
        resumeBankId: employerCandidates.resumeBankId,
        positionId: employerPositions.id,
        positionTitle: employerPositions.title,
        invitationStatus: employerCandidates.invitationStatus,
        invitationDeadline: employerCandidates.invitationDeadline,
        invitationReservationKey: employerCandidates.invitationReservationKey,
        interviewScore: sql<number | null>`(${employerCandidates.interviewReport}->>'score')::int`,
        updatedAt: employerCandidates.updatedAt,
      })
      .from(employerCandidates)
      .innerJoin(employerPositions, eq(employerCandidates.positionId, employerPositions.id))
      .where(
        and(
          eq(employerPositions.ownerUserId, request.auth!.user.id),
          inArray(
            employerCandidates.resumeBankId,
            resumes.map((resume) => resume.id),
          ),
        ),
      )
      .orderBy(desc(employerCandidates.updatedAt));
    const current = await Promise.all(
      associations.map((association) => expireInvitation(association, request.auth!.user.id)),
    );
    const byResume = new Map<string, typeof current>();
    for (const association of current) {
      if (!association.resumeBankId) continue;
      const linked = byResume.get(association.resumeBankId) ?? [];
      linked.push(association);
      byResume.set(association.resumeBankId, linked);
    }
    return resumes.map((resume) => {
      const positions = byResume.get(resume.id) ?? [];
      return {
        ...publicBankResume(resume),
        positions,
        canDelete: positions.every((position) => position.invitationStatus === "not_invited"),
      };
    });
  });

  app.post("/api/employer/resume-bank", async (request, reply) => {
    if (!customer(request, reply)) return;
    if (!request.isMultipart()) return fail(reply, 400, "فایل رزومه‌ای ارسال نشده است.");
    let batchBytes = 0;
    let fileCount = 0;
    const uniqueFiles = new Map<string, { fileName: string; bytes: Buffer }>();
    for await (const part of request.parts({ limits: { files: maxFiles, fileSize: maxFileBytes, parts: maxFiles } })) {
      if (part.type !== "file") continue;
      fileCount += 1;
      if (fileCount > maxFiles) return fail(reply, 413, "حداکثر ۱۰۰ فایل در هر نوبت پذیرفته می‌شود.");
      const bytes = await part.toBuffer();
      batchBytes += bytes.length;
      if (batchBytes > maxBatchBytes) return fail(reply, 413, "حجم کل فایل‌ها باید حداکثر ۴۰ مگابایت باشد.");
      const fileHash = hash(bytes);
      if (!uniqueFiles.has(fileHash)) uniqueFiles.set(fileHash, { fileName: part.filename, bytes });
    }
    if (!fileCount) return fail(reply, 400, "فایل رزومه‌ای ارسال نشده است.");
    const existing = await db
      .select({ fileHash: employerResumeBank.fileHash, email: employerResumeBank.email, phone: employerResumeBank.phone })
      .from(employerResumeBank)
      .where(eq(employerResumeBank.ownerUserId, request.auth!.user.id));
    const prepared: Array<typeof employerResumeBank.$inferInsert> = [];
    let duplicateCount = fileCount - uniqueFiles.size;
    for (const file of uniqueFiles.values()) {
      const resume = await prepareBankResume(request.auth!.user.id, file.fileName, file.bytes);
      if (isDuplicateResume(resume, [...existing, ...prepared])) {
        duplicateCount += 1;
        continue;
      }
      prepared.push(resume);
    }
    if (prepared.length) await db.insert(employerResumeBank).values(prepared);
    return reply.code(201).send({ count: prepared.length, duplicateCount });
  });

  app.get("/api/employer/resume-bank/:resumeId", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { resumeId } = bankResumeIdSchema.parse(request.params);
    const [resume] = await db
      .select({
        id: employerResumeBank.id,
        fileName: employerResumeBank.fileName,
        resumeText: employerResumeBank.resumeText,
        extractionError: employerResumeBank.extractionError,
      })
      .from(employerResumeBank)
      .where(and(eq(employerResumeBank.id, resumeId), eq(employerResumeBank.ownerUserId, request.auth!.user.id)))
      .limit(1);
    if (!resume) return fail(reply, 404, "رزومه پیدا نشد.");
    return resume;
  });

  app.patch("/api/employer/resume-bank/:resumeId", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { resumeId } = bankResumeIdSchema.parse(request.params);
    const parsed = z
      .object({
        name: z.string().trim().max(160).nullable(),
        specialty: z.string().trim().max(160).nullable(),
        email: z.string().trim().email("ایمیل معتبر نیست.").max(254).nullable(),
        phone: z.string().trim().max(32).nullable(),
      })
      .safeParse(request.body);
    if (!parsed.success) return fail(reply, 422, parsed.error.issues[0]?.message ?? "اطلاعات رزومه معتبر نیست.");
    const phone = parsed.data.phone ? normalizeIranianMobile(parsed.data.phone) : null;
    if (parsed.data.phone && !phone) return fail(reply, 422, "شماره همراه معتبر نیست.");
    const values = {
      name: parsed.data.name || null,
      specialty: parsed.data.specialty || null,
      email: parsed.data.email?.toLowerCase() || null,
      phone,
      updatedAt: new Date(),
    };
    const [resume] = await db
      .update(employerResumeBank)
      .set(values)
      .where(and(eq(employerResumeBank.id, resumeId), eq(employerResumeBank.ownerUserId, request.auth!.user.id)))
      .returning();
    if (!resume) return fail(reply, 404, "رزومه پیدا نشد.");
    await db.update(employerCandidates).set({ name: values.name, email: values.email, phone: values.phone, updatedAt: values.updatedAt }).where(eq(employerCandidates.resumeBankId, resume.id));
    return { resume: publicBankResume(resume) };
  });

  app.get("/api/employer/resume-bank/:resumeId/file", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { resumeId } = bankResumeIdSchema.parse(request.params);
    const [resume] = await db
      .select({ fileName: employerResumeBank.fileName, fileData: employerResumeBank.fileData })
      .from(employerResumeBank)
      .where(and(eq(employerResumeBank.id, resumeId), eq(employerResumeBank.ownerUserId, request.auth!.user.id)))
      .limit(1);
    if (!resume) return fail(reply, 404, "رزومه پیدا نشد.");
    if (!resume.fileData) return fail(reply, 404, "نسخهٔ اصلی این رزومه ذخیره نشده است.");
    const isPdf = fileExtension(resume.fileName) === "pdf";
    return reply
      .header("cache-control", "private, no-store")
      .header("content-disposition", isPdf ? 'inline; filename="resume.pdf"' : 'attachment; filename="resume.docx"')
      .type(isPdf ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
      .send(resume.fileData);
  });

  app.delete("/api/employer/resume-bank/:resumeId", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { resumeId } = bankResumeIdSchema.parse(request.params);
    const linked = await db
      .select({
        id: employerCandidates.id,
        positionId: employerCandidates.positionId,
        invitationStatus: employerCandidates.invitationStatus,
      })
      .from(employerCandidates)
      .where(eq(employerCandidates.resumeBankId, resumeId));
    if (linked.some((candidate) => candidate.invitationStatus !== "not_invited"))
      return fail(reply, 409, "این رزومه در دعوت مصاحبه استفاده شده و برای حفظ سوابق قابل حذف نیست.");
    if (linked.length) {
      await db.delete(employerCandidates).where(
        inArray(
          employerCandidates.id,
          linked.map((candidate) => candidate.id),
        ),
      );
    }
    const [deleted] = await db
      .delete(employerResumeBank)
      .where(and(eq(employerResumeBank.id, resumeId), eq(employerResumeBank.ownerUserId, request.auth!.user.id)))
      .returning({ id: employerResumeBank.id });
    if (!deleted) return fail(reply, 404, "رزومه پیدا نشد.");
    return deleted;
  });

  app.get("/api/employer/positions", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { status } = z.object({ status: z.enum(["active", "closed", "all"]).optional() }).parse(request.query);
    const visibility = status ?? "active";
    return db
      .select()
      .from(employerPositions)
      .where(
        visibility === "closed"
          ? and(eq(employerPositions.ownerUserId, request.auth!.user.id), sql`${employerPositions.closedAt} IS NOT NULL`)
          : visibility === "all"
            ? eq(employerPositions.ownerUserId, request.auth!.user.id)
            : and(eq(employerPositions.ownerUserId, request.auth!.user.id), sql`${employerPositions.closedAt} IS NULL`),
      )
      .orderBy(desc(employerPositions.createdAt), desc(employerPositions.id));
  });

  app.post("/api/employer/positions", async (request, reply) => {
    if (!customer(request, reply)) return;
    const profile = await profileOf(request.auth!.user.id);
    if (!profile) return fail(reply, 403, "ابتدا فضای کارفرمای خود را ثبت کن.");
    const input = positionSchema.parse(request.body);
    const now = new Date();
    const [position] = await db
      .insert(employerPositions)
      .values({
        id: randomUUID(),
        ownerUserId: request.auth!.user.id,
        companyName: profile.companyName,
        ...input,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return reply.code(201).send(position);
  });

  app.get("/api/employer/positions/:id", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { id } = idSchema.parse(request.params);
    const position = await ownedPosition(id, request.auth!.user.id);
    if (!position) return fail(reply, 404, "پوزیشن پیدا نشد.");
    const candidates = await db
      .select({ ...candidateColumns, hasOriginalFile: sql<boolean>`${employerCandidates.fileData} IS NOT NULL` })
      .from(employerCandidates)
      .where(eq(employerCandidates.positionId, id))
      .orderBy(asc(employerCandidates.createdAt));
    const current = await Promise.all(candidates.map((candidate) => expireInvitation(candidate, position.ownerUserId)));
    return {
      position,
      candidates: current.map(publicCandidate),
      costs: { screening: screeningCost, interview: interviewCost },
    };
  });

  app.post("/api/employer/positions/:id/close", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { id } = idSchema.parse(request.params);
    const input = positionClosureSchema.parse(request.body);
    const position = await ownedPosition(id, request.auth!.user.id);
    if (!position) return fail(reply, 404, "پوزیشن پیدا نشد.");
    if (position.closedAt) return fail(reply, 409, "این پوزیشن قبلاً بسته شده است.");
    if (input.reason === "hired" && input.hiredCandidateId) {
      const [candidate] = await db
        .select({ id: employerCandidates.id })
        .from(employerCandidates)
        .where(and(eq(employerCandidates.id, input.hiredCandidateId), eq(employerCandidates.positionId, id)))
        .limit(1);
      if (!candidate) return fail(reply, 422, "نامزد انتخاب‌شده متعلق به این پوزیشن نیست.");
    }
    const now = new Date();
    const activeCandidates = await db
      .select()
      .from(employerCandidates)
      .where(and(eq(employerCandidates.positionId, id), inArray(employerCandidates.invitationStatus, ["invited", "accepted", "started"])));
    await db.transaction(async (tx) => {
      for (const candidate of activeCandidates) {
        if (candidate.invitationTokenHash) {
          await tx.insert(employerInvitationHistory).values({
            id: randomUUID(), candidateId: candidate.id, positionId: id, invitedUserId: candidate.invitedUserId,
            tokenHash: candidate.invitationTokenHash, deadline: candidate.invitationDeadline, status: "cancelled",
            createdAt: candidate.updatedAt, cancelledAt: now,
          });
        }
        await tx.update(employerCandidates).set({ invitationTokenHash: null, invitationDeadline: null, invitationStatus: "expired", updatedAt: now }).where(eq(employerCandidates.id, candidate.id));
      }
      await tx.update(employerPositions).set({
        closedAt: now, closureReason: input.reason, closureNote: input.note || null,
        hiredCandidateId: input.reason === "hired" ? input.hiredCandidateId ?? null : null,
        hiringRewardedAt: input.reason === "hired" ? now : null, updatedAt: now,
      }).where(eq(employerPositions.id, id));
    });
    await Promise.all(activeCandidates.map((candidate) => radicoin.settleOperation(position.ownerUserId, candidateReservationKey(candidate), "release")));
    if (input.reason === "hired")
      await radicoin.adjust(position.ownerUserId, 5, "هدیهٔ ثبت استخدام موفق", request.auth!.user.id, `position-hired:${id}`);
    return { closedAt: now, reward: input.reason === "hired" ? 5 : 0 };
  });

  app.post("/api/employer/positions/:id/continue", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { id } = idSchema.parse(request.params);
    const position = await ownedPosition(id, request.auth!.user.id);
    if (!position) return fail(reply, 404, "پوزیشن پیدا نشد.");
    const [candidate] = await db
      .select({ id: employerCandidates.id })
      .from(employerCandidates)
      .where(eq(employerCandidates.positionId, id))
      .limit(1);
    if (!candidate) return fail(reply, 422, "ابتدا دست‌کم یک رزومه اضافه کن.");
    const [updated] = await db
      .update(employerPositions)
      .set({ workflowStage: Math.max(position.workflowStage, 3), updatedAt: new Date() })
      .where(eq(employerPositions.id, id))
      .returning();
    return updated;
  });

  app.post("/api/employer/positions/:id/review-method", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { id } = idSchema.parse(request.params);
    const { method } = reviewMethodSchema.parse(request.body);
    const position = await ownedPosition(id, request.auth!.user.id);
    if (!position) return fail(reply, 404, "پوزیشن پیدا نشد.");
    if (position.screeningStatus !== "not_started" && position.screeningStatus !== "failed")
      return fail(reply, 409, "در زمان پایش یا پس از تکمیل آن، روش بررسی قابل تغییر نیست.");
    const [candidate] = await db
      .select({ id: employerCandidates.id })
      .from(employerCandidates)
      .where(eq(employerCandidates.positionId, id))
      .limit(1);
    if (!candidate) return fail(reply, 422, "ابتدا دست‌کم یک رزومه اضافه کن.");
    const [updated] = await db
      .update(employerPositions)
      .set({ reviewMethod: method, workflowStage: method === "manual" ? 4 : 3, updatedAt: new Date() })
      .where(eq(employerPositions.id, id))
      .returning();
    return updated;
  });

  app.patch("/api/employer/positions/:id", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { id } = idSchema.parse(request.params);
    const input = positionSchema.parse(request.body);
    const position = await ownedPosition(id, request.auth!.user.id);
    if (!position) return fail(reply, 404, "پوزیشن پیدا نشد.");
    if (position.screeningStatus !== "not_started")
      return fail(
        reply,
        409,
        "پس از شروع پایش، عنوان و شرح پوزیشن قابل ویرایش نیست؛ نتایج و دعوت‌ها بر اساس نسخهٔ قبلی ساخته شده‌اند.",
      );
    if (await hasPositionInvitations(id))
      return fail(reply, 409, "پس از ساخت دعوت، عنوان و شرح پوزیشن قابل ویرایش نیست.");
    const [updated] = await db
      .update(employerPositions)
      .set({ ...input, updatedAt: new Date() })
      .where(
        and(
          eq(employerPositions.id, id),
          eq(employerPositions.ownerUserId, request.auth!.user.id),
          eq(employerPositions.screeningStatus, "not_started"),
        ),
      )
      .returning();
    if (!updated) return fail(reply, 409, "پایش این پوزیشن شروع شده است؛ صفحه را دوباره بارگذاری کن.");
    return updated;
  });

  app.delete("/api/employer/positions/:id", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { id } = idSchema.parse(request.params);
    const position = await ownedPosition(id, request.auth!.user.id);
    if (!position) return fail(reply, 404, "پوزیشن پیدا نشد.");
    if (position.screeningStatus !== "not_started")
      return fail(reply, 409, "پس از شروع پایش، حذف پوزیشن برای حفظ نتایج و سوابق مصاحبه ممکن نیست.");
    if (await hasPositionInvitations(id))
      return fail(reply, 409, "پس از ساخت دعوت، حذف پوزیشن برای حفظ سوابق مصاحبه ممکن نیست.");
    await db.delete(employerPositions).where(eq(employerPositions.id, id));
    return reply.code(204).send();
  });

  app.post("/api/employer/positions/:id/resumes", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { id } = idSchema.parse(request.params);
    const position = await ownedPosition(id, request.auth!.user.id);
    if (!position) return fail(reply, 404, "پوزیشن پیدا نشد.");
    if (position.screeningStatus !== "not_started") return fail(reply, 409, "برای این پوزیشن پایش شروع شده است.");
    if (await hasPositionInvitations(id)) return fail(reply, 409, "پس از ساخت دعوت، افزودن رزومه ممکن نیست.");
    if (!request.isMultipart()) return fail(reply, 400, "فایل رزومه‌ای ارسال نشده است.");
    const [existingCandidates, bankResumes] = await Promise.all([
      db
        .select({ fileHash: employerCandidates.fileHash, email: employerCandidates.email, phone: employerCandidates.phone })
        .from(employerCandidates)
        .where(eq(employerCandidates.positionId, id)),
      db.select().from(employerResumeBank).where(eq(employerResumeBank.ownerUserId, request.auth!.user.id)),
    ]);
    let batchBytes = 0;
    let fileCount = 0;
    const uploadedFiles: Array<{ fileName: string; bytes: Buffer }> = [];
    for await (const part of request.parts({ limits: { files: maxFiles, fileSize: maxFileBytes, parts: maxFiles } })) {
      if (part.type !== "file") continue;
      fileCount += 1;
      if (fileCount > maxFiles) return fail(reply, 413, "حداکثر ۱۰۰ فایل برای هر پوزیشن پذیرفته می‌شود.");
      const bytes = await part.toBuffer();
      batchBytes += bytes.length;
      if (batchBytes > maxBatchBytes) return fail(reply, 413, "حجم کل فایل‌ها باید حداکثر ۴۰ مگابایت باشد.");
      uploadedFiles.push({ fileName: part.filename, bytes });
    }
    if (!uploadedFiles.length) return fail(reply, 400, "فایل رزومه‌ای ارسال نشده است.");
    const prepared = await Promise.all(
      uploadedFiles.map(({ fileName, bytes }) => prepareBankResume(request.auth!.user.id, fileName, bytes)),
    );
    const newBankResumes: Array<typeof employerResumeBank.$inferInsert> = [];
    const newCandidates: Array<typeof employerCandidates.$inferInsert> = [];
    let duplicateCount = 0;
    for (const resume of prepared) {
      if (isDuplicateResume(resume, [...existingCandidates, ...newCandidates])) {
        duplicateCount += 1;
        continue;
      }
      const bankResume = [...bankResumes, ...newBankResumes].find((known) => isDuplicateResume(resume, [known]));
      const source = bankResume ?? resume;
      if (!bankResume) newBankResumes.push(resume);
      newCandidates.push({
        id: randomUUID(),
        positionId: id,
        resumeBankId: source.id,
        fileName: source.fileName,
        fileHash: source.fileHash,
        fileData: source.fileData,
        resumeText: source.resumeText,
        extractionError: source.extractionError,
        name: source.name,
        email: source.email,
        phone: source.phone,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    if (existingCandidates.length + newCandidates.length > maxFiles)
      return fail(reply, 413, "حداکثر ۱۰۰ رزومه برای هر پوزیشن پذیرفته می‌شود.");
    await db.transaction(async (tx) => {
      if (newBankResumes.length) await tx.insert(employerResumeBank).values(newBankResumes);
      if (newCandidates.length) await tx.insert(employerCandidates).values(newCandidates);
    });
    return reply.code(201).send({ count: newCandidates.length, duplicateCount });
  });

  app.post("/api/employer/positions/:id/resume-bank", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { id } = idSchema.parse(request.params);
    const { resumeIds } = bankImportSchema.parse(request.body);
    const position = await ownedPosition(id, request.auth!.user.id);
    if (!position) return fail(reply, 404, "پوزیشن پیدا نشد.");
    if (position.screeningStatus !== "not_started") return fail(reply, 409, "برای این پوزیشن پایش شروع شده است.");
    if (await hasPositionInvitations(id)) return fail(reply, 409, "پس از ساخت دعوت، افزودن رزومه ممکن نیست.");
    const [existing, resumes] = await Promise.all([
      db
        .select({
          id: employerCandidates.id,
          resumeBankId: employerCandidates.resumeBankId,
          fileHash: employerCandidates.fileHash,
          email: employerCandidates.email,
          phone: employerCandidates.phone,
        })
        .from(employerCandidates)
        .where(eq(employerCandidates.positionId, id)),
      db
        .select()
        .from(employerResumeBank)
        .where(
          and(
            eq(employerResumeBank.ownerUserId, request.auth!.user.id),
            inArray(employerResumeBank.id, [...new Set(resumeIds)]),
          ),
        ),
    ]);
    if (resumes.length !== new Set(resumeIds).size) return fail(reply, 404, "بعضی رزومه‌های بانک پیدا نشدند.");
    const newResumes: typeof resumes = [];
    let duplicateCount = 0;
    for (const resume of resumes) {
      if (isDuplicateResume(resume, [...existing, ...newResumes])) {
        duplicateCount += 1;
        continue;
      }
      newResumes.push(resume);
    }
    if (existing.length + newResumes.length > maxFiles)
      return fail(reply, 413, "حداکثر ۱۰۰ رزومه برای هر پوزیشن پذیرفته می‌شود.");
    const now = new Date();
    await db.insert(employerCandidates).values(
      newResumes.map((resume) => ({
        id: randomUUID(),
        positionId: id,
        resumeBankId: resume.id,
        fileName: resume.fileName,
        fileHash: resume.fileHash,
        fileData: resume.fileData,
        resumeText: resume.resumeText,
        extractionError: resume.extractionError,
        name: resume.name,
        email: resume.email,
        phone: resume.phone,
        createdAt: now,
        updatedAt: now,
      })),
    );
    return reply.code(201).send({ count: newResumes.length, duplicateCount });
  });

  app.get("/api/employer/positions/:id/resumes/:candidateId", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { id, candidateId } = resumeIdSchema.parse(request.params);
    const position = await ownedPosition(id, request.auth!.user.id);
    if (!position) return fail(reply, 404, "پوزیشن پیدا نشد.");
    const [candidate] = await db
      .select({
        id: employerCandidates.id,
        fileName: employerCandidates.fileName,
        resumeText: employerCandidates.resumeText,
        extractionError: employerCandidates.extractionError,
      })
      .from(employerCandidates)
      .where(and(eq(employerCandidates.id, candidateId), eq(employerCandidates.positionId, id)))
      .limit(1);
    if (!candidate) return fail(reply, 404, "رزومه پیدا نشد.");
    return candidate;
  });

  app.patch("/api/employer/positions/:id/resumes/:candidateId/contact", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { id, candidateId } = resumeIdSchema.parse(request.params);
    const parsed = z.object({ phone: z.string().max(32) }).safeParse(request.body);
    const phone = parsed.success ? normalizeIranianMobile(parsed.data.phone) : null;
    if (!phone) return fail(reply, 422, "شماره همراه معتبر نیست.");
    const position = await ownedPosition(id, request.auth!.user.id);
    if (!position) return fail(reply, 404, "پوزیشن پیدا نشد.");
    const updated = await db.transaction(async (tx) => {
      const [candidate] = await tx
        .select({ id: employerCandidates.id, resumeBankId: employerCandidates.resumeBankId })
        .from(employerCandidates)
        .where(and(eq(employerCandidates.id, candidateId), eq(employerCandidates.positionId, id)))
        .limit(1);
      if (!candidate) return null;
      const now = new Date();
      if (candidate.resumeBankId) {
        const [resume] = await tx
          .update(employerResumeBank)
          .set({ phone, updatedAt: now })
          .where(
            and(
              eq(employerResumeBank.id, candidate.resumeBankId),
              eq(employerResumeBank.ownerUserId, request.auth!.user.id),
            ),
          )
          .returning({ id: employerResumeBank.id });
        if (!resume) return null;
        await tx
          .update(employerCandidates)
          .set({ phone, updatedAt: now })
          .where(eq(employerCandidates.resumeBankId, resume.id));
      } else {
        await tx
          .update(employerCandidates)
          .set({ phone, updatedAt: now })
          .where(and(eq(employerCandidates.id, candidateId), eq(employerCandidates.positionId, id)));
      }
      return { candidateId, phone };
    });
    if (!updated) return fail(reply, 404, "رزومه یا نامزد پیدا نشد.");
    return updated;
  });

  app.get("/api/employer/positions/:id/resumes/:candidateId/file", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { id, candidateId } = resumeIdSchema.parse(request.params);
    const position = await ownedPosition(id, request.auth!.user.id);
    if (!position) return fail(reply, 404, "پوزیشن پیدا نشد.");
    const [candidate] = await db
      .select({ fileName: employerCandidates.fileName, fileData: employerCandidates.fileData })
      .from(employerCandidates)
      .where(and(eq(employerCandidates.id, candidateId), eq(employerCandidates.positionId, id)))
      .limit(1);
    if (!candidate) return fail(reply, 404, "رزومه پیدا نشد.");
    if (!candidate.fileData) return fail(reply, 404, "نسخهٔ اصلی این رزومه ذخیره نشده است؛ فایل را دوباره وارد کن.");
    const isPdf = fileExtension(candidate.fileName) === "pdf";
    return reply
      .header("cache-control", "private, no-store")
      .header("content-disposition", isPdf ? 'inline; filename="resume.pdf"' : 'attachment; filename="resume.docx"')
      .type(isPdf ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
      .send(candidate.fileData);
  });

  app.delete("/api/employer/positions/:id/resumes/:candidateId", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { id, candidateId } = resumeIdSchema.parse(request.params);
    const position = await ownedPosition(id, request.auth!.user.id);
    if (!position) return fail(reply, 404, "پوزیشن پیدا نشد.");
    if (position.screeningStatus !== "not_started") return fail(reply, 409, "پس از شروع پایش، حذف رزومه ممکن نیست.");
    if (await hasPositionInvitations(id)) return fail(reply, 409, "پس از ساخت دعوت، حذف رزومه ممکن نیست.");
    const [candidate] = await db
      .select({ invitationStatus: employerCandidates.invitationStatus })
      .from(employerCandidates)
      .where(and(eq(employerCandidates.id, candidateId), eq(employerCandidates.positionId, id)))
      .limit(1);
    if (!candidate) return fail(reply, 404, "رزومه پیدا نشد.");
    if (candidate.invitationStatus !== "not_invited") return fail(reply, 409, "رزومهٔ دعوت‌شده را نمی‌توان حذف کرد.");
    const [deleted] = await db
      .delete(employerCandidates)
      .where(and(eq(employerCandidates.id, candidateId), eq(employerCandidates.positionId, id)))
      .returning({ id: employerCandidates.id });
    if (!deleted) return fail(reply, 404, "رزومه پیدا نشد.");
    return { id: deleted.id };
  });

  app.delete("/api/employer/positions/:id/resumes", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { id } = idSchema.parse(request.params);
    const { candidateIds } = bulkResumeDeleteSchema.parse(request.body);
    const position = await ownedPosition(id, request.auth!.user.id);
    if (!position) return fail(reply, 404, "پوزیشن پیدا نشد.");
    if (position.screeningStatus !== "not_started") return fail(reply, 409, "پس از شروع پایش، حذف رزومه ممکن نیست.");
    if (await hasPositionInvitations(id)) return fail(reply, 409, "پس از ساخت دعوت، حذف رزومه ممکن نیست.");

    const candidates = await db
      .select({ id: employerCandidates.id, invitationStatus: employerCandidates.invitationStatus })
      .from(employerCandidates)
      .where(and(eq(employerCandidates.positionId, id), inArray(employerCandidates.id, candidateIds)));
    if (candidates.length !== candidateIds.length) return fail(reply, 404, "یک یا چند رزومه پیدا نشد.");
    if (candidates.some((candidate) => candidate.invitationStatus !== "not_invited"))
      return fail(reply, 409, "رزومهٔ دعوت‌شده را نمی‌توان حذف کرد.");

    const deleted = await db
      .delete(employerCandidates)
      .where(and(eq(employerCandidates.positionId, id), inArray(employerCandidates.id, candidateIds)))
      .returning({ id: employerCandidates.id });
    return { count: deleted.length };
  });

  app.post("/api/employer/positions/:id/screen", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { id } = idSchema.parse(request.params);
    const position = await ownedPosition(id, request.auth!.user.id);
    if (!position) return fail(reply, 404, "پوزیشن پیدا نشد.");
    const candidates = await db
      .select(candidateColumns)
      .from(employerCandidates)
      .where(eq(employerCandidates.positionId, id));
    if (!candidates.length) return fail(reply, 422, "ابتدا فایل‌های رزومه را وارد کن.");
    if (position.reviewMethod === "manual") return fail(reply, 409, "برای این پوزیشن بررسی دستی انتخاب شده است.");
    if (position.screeningStatus === "completed") return fail(reply, 409, "پایش این پوزیشن قبلاً کامل شده است.");
    if (position.screeningStatus === "processing") return { status: "processing" };
    const startedAt = new Date();
    const run = { ...position, screeningStartedAt: startedAt };
    await radicoin.reserveOperation(
      position.ownerUserId,
      screeningCost,
      screeningKey(run),
      "پایش رزومه‌های پوزیشن شغلی",
    );
    if (position.screeningStatus === "failed")
      await db
        .update(employerCandidates)
        .set({ screeningStatus: "pending", updatedAt: new Date() })
        .where(and(eq(employerCandidates.positionId, id), eq(employerCandidates.screeningStatus, "failed")));
    await db
      .update(employerPositions)
      .set({
        reviewMethod: "smart",
        workflowStage: 3,
        screeningStatus: "processing",
        screeningError: null,
        screeningStartedAt: startedAt,
        updatedAt: startedAt,
      })
      .where(eq(employerPositions.id, id));
    return { status: "processing" };
  });

  app.post("/api/employer/positions/:id/screen/next", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { id } = idSchema.parse(request.params);
    const position = await ownedPosition(id, request.auth!.user.id);
    if (!position) return fail(reply, 404, "پوزیشن پیدا نشد.");
    if (position.screeningStatus !== "processing") return fail(reply, 409, "پایش فعالی برای این پوزیشن وجود ندارد.");
    const candidates = await db
      .select(candidateColumns)
      .from(employerCandidates)
      .where(eq(employerCandidates.positionId, id))
      .orderBy(asc(employerCandidates.createdAt));
    const next = candidates.find((candidate) => candidate.screeningStatus === "pending");
    if (!next) {
      const failed = candidates.some((candidate) => candidate.screeningStatus === "failed");
      const status = failed ? "failed" : "completed";
      await radicoin.settleOperation(position.ownerUserId, screeningKey(position), failed ? "release" : "commit");
      await db
        .update(employerPositions)
        .set({
          screeningStatus: status,
          workflowStage: status === "completed" ? 4 : 3,
          screeningCompletedAt: new Date(),
          screeningError: failed ? "پایش برخی رزومه‌ها ناموفق بود؛ هزینه‌ای کسر نشد." : null,
          updatedAt: new Date(),
        })
        .where(eq(employerPositions.id, id));
      return { status, processed: candidates.length, total: candidates.length };
    }
    const duplicate =
      candidates.findIndex((candidate) => candidate.id === next.id) >
      candidates.findIndex((candidate) => candidate.fileHash === next.fileHash);
    if (duplicate || next.extractionError) {
      await db
        .update(employerCandidates)
        .set({ screeningStatus: duplicate ? "duplicate" : "unreadable", updatedAt: new Date() })
        .where(eq(employerCandidates.id, next.id));
    } else {
      try {
        const redacted = next.resumeText
          .replace(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,63}/gi, "[ایمیل]")
          .replace(phonePattern, "[تلفن]");
        let result: unknown;
        if (interviewAgent) {
          result = await interviewAgent.rankResume({
            title: position.title,
            description: position.description,
            resumeText: redacted,
          });
        } else {
          const analyzeConfig = getAnalyzeConfig();
          result = await chatJson<unknown>(
            analyzeConfig,
            [
              {
                role: "system",
                content:
                  "برای استخدام، رزومه را فقط بر اساس متن پوزیشن و شواهد رزومه تحلیل کن. فقط JSON فارسی برگردان. نبود داده را نامشخص بدان، نه رد قطعی. ویژگی‌های حساس و هویتی را معیار قرار نده.",
              },
              {
                role: "user",
                content: `عنوان: ${position.title}\nشرح: ${position.description}\nرزومه: ${redacted}\nJSON: {"name":string,"score":number,"matched":string[],"missing":string[],"unknown":string[],"summary":string}`,
              },
            ],
            {
              maxOutputTokens: 900,
              timeoutMs: 45_000,
              emptyResponseFallbackModels:
                analyzeConfig.provider === "gapgpt" && analyzeConfig.model === "gapgpt-qwen-3.6"
                  ? ["gapgpt-qwen-3.8"]
                  : undefined,
            },
          );
        }
        const parsed = z
          .object({
            name: z.string().trim().max(160).default(""),
            score: z.number().min(0).max(100),
            matched: z.array(z.string()).max(8),
            missing: z.array(z.string()).max(8),
            unknown: z.array(z.string()).max(8),
            summary: z.string().trim().min(1).max(1000),
          })
          .parse(result);
        await db
          .update(employerCandidates)
          .set({
            name: parsed.name || next.fileName,
            screeningStatus: "ready",
            matchEvidence: {
              score: Math.round(parsed.score),
              matched: parsed.matched,
              missing: parsed.missing,
              unknown: parsed.unknown,
              summary: parsed.summary,
            },
            updatedAt: new Date(),
          })
          .where(eq(employerCandidates.id, next.id));
      } catch (error) {
        request.log.error({ err: error, candidateId: next.id }, "Employer resume screening failed");
        await db
          .update(employerCandidates)
          .set({ screeningStatus: "failed", updatedAt: new Date() })
          .where(eq(employerCandidates.id, next.id));
      }
    }
    return {
      status: "processing",
      processed: candidates.filter((candidate) => candidate.screeningStatus !== "pending").length + 1,
      total: candidates.length,
    };
  });

  app.post("/api/employer/positions/:id/invitations", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { id } = idSchema.parse(request.params);
    const { candidateIds, deadline } = inviteSchema.parse(request.body);
    const position = await ownedPosition(id, request.auth!.user.id);
    if (!position) return fail(reply, 404, "پوزیشن پیدا نشد.");
    if (position.screeningStatus === "processing")
      return fail(reply, 409, "تا پایان پایش در حال اجرا، دعوت را آغاز نکن.");
    const deadlineDate = new Date(deadline);
    if (deadlineDate.getTime() < Date.now() + 60 * 60_000)
      return fail(reply, 422, "مهلت مصاحبه باید دست‌کم یک ساعت از اکنون بیشتر باشد.");
    const selectedCandidates = await db
      .select(candidateColumns)
      .from(employerCandidates)
      .where(and(eq(employerCandidates.positionId, id), inArray(employerCandidates.id, [...new Set(candidateIds)])));
    const eligible = selectedCandidates.filter(
      (candidate) =>
        candidate.invitationStatus === "not_invited" &&
        (position.screeningStatus === "completed" ? candidate.screeningStatus === "ready" : true),
    );
    if (!eligible.length) return fail(reply, 422, "نامزد دعوت‌پذیری انتخاب نشده است.");
    if (eligible.length !== new Set(candidateIds).size)
      return fail(reply, 422, "بعضی رزومه‌های انتخاب‌شده پیدا نشدند یا قبلاً دعوت شده‌اند؛ فهرست را دوباره بررسی کن.");
    if (eligible.some((candidate) => !normalizeIranianMobile(candidate.phone ?? "")))
      return fail(reply, 422, "برای ساخت دعوت، شماره همراه معتبر همهٔ نامزدهای انتخاب‌شده را ثبت کن.");
    const candidatePhones = eligible.map((candidate) => normalizeIranianMobile(candidate.phone!)!);
    const matchingAccounts = await db
      .select({ id: users.id, phone: users.phone, accountType: users.accountType })
      .from(users)
      .where(inArray(users.phone, candidatePhones));
    if (matchingAccounts.some((account) => account.accountType !== "candidate"))
      return fail(reply, 422, "شماره همراه یکی از نامزدها متعلق به حساب کارفرمایی است و قابل دعوت نیست.");
    const candidateAccountByPhone = new Map(
      matchingAccounts
        .filter((account) => account.accountType === "candidate" && account.phone)
        .map((account) => [account.phone!, account]),
    );
    const wallet = await radicoin.getWallet(position.ownerUserId, 0);
    if ((wallet.wallet?.availableCoins ?? 0) < eligible.length * interviewCost)
      return reply
        .code(402)
        .send({ error: "موجودی رادیکوین برای رزرو همهٔ دعوت‌ها کافی نیست.", code: "INSUFFICIENT_RADICOIN" });
    let questions = position.interviewQuestions;
    if (!questions) {
      try {
        const generated = interviewAgent
          ? await interviewAgent.createSession({
              resume: {},
              knowledge: {},
              mode: `مصاحبهٔ استخدامی برای ${position.title}`,
              jobDescription: position.description,
              questionCount: 5,
            })
          : await chatJson<unknown>(
              getAnalyzeConfig(),
              [
                {
                  role: "system",
                  content:
                    "برای مصاحبهٔ شغلی ساختاریافته، پنج سؤال کوتاه، بی‌طرف و قابل مقایسه برای همهٔ نامزدها بساز. فقط JSON برگردان.",
                },
                {
                  role: "user",
                  content: `عنوان: ${position.title}\nشرح: ${position.description}\nJSON: {"questions":string[]}`,
                },
              ],
              { maxOutputTokens: 400, timeoutMs: 45_000 },
            );
        questions = interviewQuestionsSchema.parse(generated).questions;
      } catch (error) {
        // Invitations must remain usable when the optional AI provider is out of quota or
        // unavailable. Persist a neutral, structured question set instead of leaving the
        // employer with a generic server error and no invitation link.
        request.log.warn(
          { err: error, positionId: id, providerQuota: isProviderQuotaError(error) },
          "Employer interview question generation failed; using fallback questions",
        );
        questions = fallbackInterviewQuestions(position.title);
      }
      await db
        .update(employerPositions)
        .set({ interviewQuestions: questions, updatedAt: new Date() })
        .where(eq(employerPositions.id, id));
    }
    const reserved = new Map<string, string>();
    try {
      for (const candidate of eligible) {
        const reservationKey = newInvitationReservationKey(candidate.id);
        if (
          !(await radicoin.reserveOperation(
            position.ownerUserId,
            interviewCost,
            reservationKey,
            "رزرو مصاحبهٔ شغلی",
          ))
        )
          throw new Error("رزرو اعتبار این نامزد قبلاً نهایی شده است.");
        reserved.set(candidate.id, reservationKey);
      }
    } catch (error) {
      await Promise.all(
        [...reserved.values()].map((reservationKey) =>
          radicoin.settleOperation(position.ownerUserId, reservationKey, "release"),
        ),
      );
      throw error;
    }
    const invitations = await Promise.all(eligible.map(async (candidate) => {
      const token = randomBytes(32).toString("hex");
      const phone = normalizeIranianMobile(candidate.phone!)!;
      const account = candidateAccountByPhone.get(phone);
      await db
        .update(employerCandidates)
        .set({
          invitationTokenHash: hash(token),
          invitationReservationKey: reserved.get(candidate.id),
          invitationDeadline: deadlineDate,
          invitationStatus: "invited",
          invitedUserId: account?.id ?? null,
          updatedAt: new Date(),
        })
        .where(eq(employerCandidates.id, candidate.id));
      const delivery = account
        ? await saveInterviewInvitationNotification(account.id, candidate.id, position).then(() => "in_app" as const)
        : await deliverInvitationSms(phone, token, request);
      return {
        candidateId: candidate.id,
        name: candidate.name,
        url: `${webAppUrl}/interview-invites/${token}`,
        delivery,
      };
    }));
    await db
      .update(employerPositions)
      .set({
        workflowStage: 4,
        reviewMethod: position.reviewMethod ?? (position.screeningStatus === "completed" ? "smart" : "manual"),
        updatedAt: new Date(),
      })
      .where(eq(employerPositions.id, id));
    return reply.code(201).send({ invitations });
  });

  app.post("/api/employer/positions/:id/invitations/:candidateId/link", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { id, candidateId } = z.object({ id: z.uuid(), candidateId: z.uuid() }).parse(request.params);
    const { deadline } = renewInvitationSchema.parse(request.body ?? {});
    const position = await ownedPosition(id, request.auth!.user.id);
    if (!position) return fail(reply, 404, "پوزیشن پیدا نشد.");
    const [candidate] = await db
      .select(candidateColumns)
      .from(employerCandidates)
      .where(and(eq(employerCandidates.id, candidateId), eq(employerCandidates.positionId, id)))
      .limit(1);
    if (!candidate) return fail(reply, 404, "نامزد پیدا نشد.");
    const current = await expireInvitation(candidate, position.ownerUserId);
    if (!["invited", "accepted", "started", "expired", "completed"].includes(current.invitationStatus))
      return fail(reply, 409, "دعوت فعال برای این نامزد وجود ندارد.");
    const restartingInterview = current.invitationStatus === "completed";
    const replacingUnusedInvitation = ["invited", "accepted"].includes(current.invitationStatus);
    const renewingInvitation = current.invitationStatus === "expired" || restartingInterview;
    const deadlineDate = deadline ? new Date(deadline) : null;
    if (renewingInvitation && !deadlineDate)
      return fail(reply, 422, "برای ارسال مجدد دعوت، مهلت تازهٔ مصاحبه را مشخص کن.");
    if (deadlineDate && deadlineDate.getTime() < Date.now() + 60 * 60_000)
      return fail(reply, 422, "مهلت مصاحبه باید دست‌کم یک ساعت از اکنون بیشتر باشد.");
    if (!normalizeIranianMobile(current.phone ?? ""))
      return fail(reply, 409, "برای ساخت لینک دعوت، ابتدا شماره همراه معتبر نامزد را ثبت کن.");
    const phone = normalizeIranianMobile(current.phone!)!;
    const [account] = await db
      .select({ id: users.id, accountType: users.accountType })
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);
    if (account?.accountType === "employer")
      return fail(reply, 409, "شماره همراه این نامزد متعلق به حساب کارفرمایی است و قابل دعوت نیست.");
    const token = randomBytes(32).toString("hex");
    const reservationKey = renewingInvitation ? newInvitationReservationKey(candidate.id) : null;
    if (
      reservationKey &&
      !(await radicoin.reserveOperation(
        position.ownerUserId,
        interviewCost,
        reservationKey,
        "رزرو مجدد مصاحبهٔ شغلی",
      ))
    )
      return fail(reply, 409, "رزرو اعتبار این دعوت قبلاً انجام شده است.");
    const updated = await db.transaction(async (tx) => {
      const now = new Date();
      if (replacingUnusedInvitation && current.invitationTokenHash) {
        await tx.insert(employerInvitationHistory).values({
          id: randomUUID(),
          candidateId: current.id,
          positionId: current.positionId,
          invitedUserId: current.invitedUserId,
          tokenHash: current.invitationTokenHash,
          deadline: current.invitationDeadline,
          status: "cancelled",
          createdAt: current.updatedAt,
          cancelledAt: now,
        });
      }
      const [next] = await tx
        .update(employerCandidates)
        .set({
          invitationTokenHash: hash(token),
          ...(deadlineDate ? { invitationDeadline: deadlineDate } : {}),
          ...(reservationKey ? { invitationReservationKey: reservationKey } : {}),
          ...(restartingInterview
            ? {
                interviewAnswers: null,
                conversationQuestions: null,
                conversationReplies: null,
                conversationClarifications: null,
                agentChatUuid: null,
                interviewReport: null,
                interviewFeedbackSharedAt: null,
              }
            : {}),
          ...(renewingInvitation
            ? { invitedUserId: account?.id ?? null, invitationStatus: "invited" as const }
            : account
              ? {
                  invitedUserId: account.id,
                  invitationStatus: current.invitationStatus,
                }
              : {}),
          updatedAt: now,
        })
        .where(and(
          eq(employerCandidates.id, candidateId),
          eq(employerCandidates.invitationStatus, current.invitationStatus),
        ))
        .returning({ id: employerCandidates.id });
      if (!next) throw new Error("INVITATION_STATUS_CHANGED");
      return next;
    }).catch(async (error: unknown) => {
      if (reservationKey) await radicoin.settleOperation(position.ownerUserId, reservationKey, "release");
      if (error instanceof Error && error.message === "INVITATION_STATUS_CHANGED") return null;
      throw error;
    });
    if (!updated) {
      if (reservationKey) await radicoin.settleOperation(position.ownerUserId, reservationKey, "release");
      return fail(reply, 409, "وضعیت دعوت تغییر کرده است. صفحه را به‌روز کن و دوباره تلاش کن.");
    }
    const delivery = account
      ? await saveInterviewInvitationNotification(account.id, candidate.id, position).then(() => "in_app" as const)
      : await deliverInvitationSms(phone, token, request);
    return { candidateId, name: candidate.name, url: `${webAppUrl}/interview-invites/${token}`, delivery };
  });

  app.patch("/api/employer/positions/:id/interviews/:candidateId/feedback-sharing", async (request, reply) => {
    if (!customer(request, reply)) return;
    const { id, candidateId } = resumeIdSchema.parse(request.params);
    const { shared } = feedbackSharingSchema.parse(request.body);
    const position = await ownedPosition(id, request.auth!.user.id);
    if (!position) return fail(reply, 404, "پوزیشن پیدا نشد.");
    const [candidate] = await db
      .select({
        id: employerCandidates.id,
        invitationStatus: employerCandidates.invitationStatus,
        interviewReport: employerCandidates.interviewReport,
      })
      .from(employerCandidates)
      .where(and(eq(employerCandidates.id, candidateId), eq(employerCandidates.positionId, id)))
      .limit(1);
    if (!candidate) return fail(reply, 404, "نامزد پیدا نشد.");
    if (candidate.invitationStatus !== "completed" || !candidate.interviewReport)
      return fail(reply, 409, "گزارش مصاحبه هنوز آماده نشده است.");
    const sharedAt = shared ? new Date() : null;
    await db
      .update(employerCandidates)
      .set({ interviewFeedbackSharedAt: sharedAt, updatedAt: new Date() })
      .where(eq(employerCandidates.id, candidate.id));
    return { candidateId, shared, sharedAt };
  });

  const getInvitation = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!customer(request, reply, "candidate")) return;
    const { value } = z.object({ value: z.string() }).parse(request.params);
    const found = await candidateSession(value, request.auth!.user.id);
    if (!found) {
      const cancelled = tokenSchema.safeParse({ token: value }).success
        ? await cancelledInvitation(value, request.auth!.user.id)
        : null;
      return cancelled
        ? fail(reply, 410, "این دعوت‌نامه لغو شده است؛ از لینک تازه‌ای که کارفرما فرستاده استفاده کن.")
        : fail(reply, 404, "دعوت‌نامه پیدا نشد.");
    }
    const { position } = found;
    const candidate = await expireInvitation(found.candidate, position.ownerUserId);
    const ownsInvitation = candidate.invitedUserId === request.auth?.user.id;
    const canViewReport = ownsInvitation && candidate.invitationStatus === "completed";
    const feedbackShared = canViewReport && candidate.interviewFeedbackSharedAt !== null;
    const reportReady = canViewReport && Boolean(candidate.interviewReport);
    const report = feedbackShared ? candidate.interviewReport : null;
    return {
      companyName: position.companyName,
      title: position.title,
      deadline: candidate.invitationDeadline,
      status: candidate.invitationStatus,
      owned: ownsInvitation,
      questions:
        candidate.invitedUserId === request.auth?.user.id
          ? (candidate.conversationQuestions ?? position.interviewQuestions)
          : null,
      answers: candidate.invitedUserId === request.auth?.user.id ? candidate.interviewAnswers : null,
      replies: candidate.invitedUserId === request.auth?.user.id ? candidate.conversationReplies : null,
      clarifications: candidate.invitedUserId === request.auth?.user.id ? candidate.conversationClarifications : null,
      report,
      reportReady,
      feedbackShared,
    };
  };
  app.get("/api/employer/invitations/:value", getInvitation);
  app.get("/api/employer/interviews/:value", getInvitation);

  app.post("/api/employer/invitations/:token/accept", async (request, reply) => {
    if (!customer(request, reply, "candidate")) return;
    const { token } = tokenSchema.parse(request.params);
    const found = await invitedCandidate(token);
    if (!found) {
      const cancelled = await cancelledInvitation(token, request.auth!.user.id);
      return cancelled
        ? fail(reply, 410, "این دعوت‌نامه لغو شده است؛ از لینک تازه‌ای که کارفرما فرستاده استفاده کن.")
        : fail(reply, 404, "دعوت‌نامه پیدا نشد.");
    }
    const { candidate } = found;
    if (!candidate.invitationDeadline || candidate.invitationDeadline < new Date()) {
      await expireInvitation(candidate, found.position.ownerUserId);
      return fail(reply, 410, "مهلت مصاحبه به پایان رسیده است.");
    }
    if (candidate.invitedUserId && candidate.invitedUserId !== request.auth!.user.id)
      return fail(reply, 403, "این دعوت‌نامه برای حساب دیگری پذیرفته شده است.");
    const invitedPhone = normalizeIranianMobile(candidate.phone ?? "");
    const accountPhone = normalizeIranianMobile(request.auth!.user.phone ?? "");
    if (!invitedPhone) return fail(reply, 409, "شماره همراه نامزد برای این دعوت ثبت نشده است.");
    if (!accountPhone || accountPhone !== invitedPhone)
      return fail(reply, 403, "این دعوت‌نامه فقط با شماره همراه ثبت‌شده برای نامزد قابل استفاده است.");
    if (!candidate.invitedUserId)
      await db
        .update(employerCandidates)
        .set({ invitedUserId: request.auth!.user.id, invitationStatus: "invited", updatedAt: new Date() })
        .where(eq(employerCandidates.id, candidate.id));
    return { accepted: true };
  });

  app.post("/api/employer/interviews/:value/turn", async (request, reply) => {
    if (!customer(request, reply, "candidate")) return;
    const { value } = z.object({ value: z.string() }).parse(request.params);
    const input = turnSchema.safeParse(request.body);
    if (!input.success) return fail(reply, 422, "پاسخ باید دست‌کم ۱۰ و حداکثر ۸۰۰۰ کاراکتر باشد.");
    const found = await candidateSession(value, request.auth!.user.id);
    if (!found) return fail(reply, 404, "دعوت‌نامه پیدا نشد.");
    const { candidate, position } = found;
    if (candidate.invitedUserId !== request.auth!.user.id) return fail(reply, 403, "ابتدا دعوت‌نامه را بپذیر.");
    if (!candidate.invitationDeadline || candidate.invitationDeadline < new Date()) {
      await expireInvitation(candidate, position.ownerUserId);
      return fail(reply, 410, "مهلت مصاحبه به پایان رسیده است.");
    }
    if (candidate.invitationStatus === "completed") return fail(reply, 409, "مصاحبه قبلاً تکمیل شده است.");
    const questions = candidate.conversationQuestions ?? position.interviewQuestions ?? [];
    const replies = candidate.conversationReplies ?? [];
    const { questionIndex, answer } = input.data;
    const saved = candidate.interviewAnswers ?? [];
    const firstEmpty = saved.findIndex((item) => !item.trim());
    const answered = firstEmpty < 0 ? saved : saved.slice(0, firstEmpty);
    if (questionIndex < answered.length && answered[questionIndex] === answer) {
      return {
        questions,
        answers: answered,
        replies,
        complete: answered.length === questions.length && Boolean(replies[questionIndex]),
      };
    }
    if (questionIndex !== answered.length || questionIndex >= questions.length)
      return fail(reply, 409, "ترتیب گفت‌وگو تغییر کرده است؛ صفحه را تازه کن.");
    const nextAnswers = [...answered, answer];
    const nextQuestions = [...questions];
    const nextReplies = [...replies];
    {
      const history = nextAnswers.map((item, index) => ({ question: questions[index], answer: item }));
      try {
        const turn = {
          mode: `مصاحبهٔ استخدامی برای ${position.title}`,
          jobDescription: position.description,
          nextTopic: questions[questionIndex + 1] ?? "شواهدی از مهارت فنی و همکاری که هنوز در گفت‌وگو روشن نشده است",
          history,
          mustConclude: nextAnswers.length >= maxInterviewTurns,
        };
        const response = interviewAgent
          ? await interviewAgent.nextQuestion(turn, {
              chatUuid: candidate.agentChatUuid ?? undefined,
              onChatUuid: async (uuid) => {
                if (candidate.agentChatUuid === uuid) return;
                await db
                  .update(employerCandidates)
                  .set({ agentChatUuid: uuid })
                  .where(eq(employerCandidates.id, candidate.id));
              },
            })
          : await createLegacyInterviewTurn(turn, { maxOutputTokens: 300, timeoutMs: 45_000 });
        if (response.complete || nextAnswers.length >= maxInterviewTurns) nextQuestions.length = nextAnswers.length;
        else nextQuestions[questionIndex + 1] = response.question;
        nextReplies[questionIndex] =
          nextAnswers.length >= maxInterviewTurns && !response.complete
            ? "ممنون از وقتی که برای این گفت‌وگو گذاشتی. مصاحبه به پایان رسید و پاسخ‌هایت بررسی می‌شوند."
            : response.reply;
      } catch (error) {
        request.log.warn({ err: error, candidateId: candidate.id }, "Adaptive interview turn failed");
        if (interviewAgent) return fail(reply, 502, "پاسخ مصاحبه‌گر آماده نشد؛ دوباره تلاش کن.");
        if (nextAnswers.length >= maxInterviewTurns) {
          nextQuestions.length = nextAnswers.length;
          nextReplies[questionIndex] =
            "ممنون از وقتی که برای این گفت‌وگو گذاشتی. مصاحبه به پایان رسید و پاسخ‌هایت بررسی می‌شوند.";
        } else {
          nextQuestions[questionIndex + 1] =
            questions[questionIndex + 1] ?? "از یک تصمیم فنی و نتیجهٔ آن در کار تیمی می‌گویی؟";
          nextReplies[questionIndex] = "ممنون که توضیح دادی. برای شناخت بهتر تجربه‌ات ادامه بدهیم.";
        }
      }
    }
    await db
      .update(employerCandidates)
      .set({
        interviewAnswers: nextAnswers,
        conversationQuestions: nextQuestions,
        conversationReplies: nextReplies,
        invitationStatus: "started",
        updatedAt: new Date(),
      })
      .where(eq(employerCandidates.id, candidate.id));
    return {
      questions: nextQuestions,
      answers: nextAnswers,
      replies: nextReplies,
      complete: nextAnswers.length === nextQuestions.length && Boolean(nextReplies[questionIndex]),
    };
  });

  app.post("/api/employer/interviews/:value/clarify", async (request, reply) => {
    if (!customer(request, reply, "candidate")) return;
    const { value } = z.object({ value: z.string() }).parse(request.params);
    const input = clarificationInputSchema.safeParse(request.body);
    if (!input.success) return fail(reply, 422, "پیام گفت‌وگو معتبر نیست.");
    const found = await candidateSession(value, request.auth!.user.id);
    if (!found) return fail(reply, 404, "دعوت‌نامه پیدا نشد.");
    const { candidate, position } = found;
    if (candidate.invitedUserId !== request.auth!.user.id) return fail(reply, 403, "ابتدا دعوت‌نامه را بپذیر.");
    if (!candidate.invitationDeadline || candidate.invitationDeadline < new Date()) {
      await expireInvitation(candidate, position.ownerUserId);
      return fail(reply, 410, "مهلت مصاحبه به پایان رسیده است.");
    }
    if (candidate.invitationStatus === "completed") return fail(reply, 409, "مصاحبه قبلاً تکمیل شده است.");
    const questions = candidate.conversationQuestions ?? position.interviewQuestions ?? [];
    const answers = candidate.interviewAnswers ?? [];
    const currentIndex = answers.findIndex((answer) => !answer.trim());
    const expectedIndex = currentIndex < 0 ? answers.length : currentIndex;
    if (input.data.questionIndex !== expectedIndex || !questions[expectedIndex])
      return fail(reply, 409, "ترتیب گفت‌وگو تغییر کرده است؛ صفحه را تازه کن.");
    const clarifications = candidate.conversationClarifications ?? [];
    if (clarifications.filter((item) => item.questionIndex === expectedIndex).length >= 5)
      return fail(reply, 429, "برای این سؤال حداکثر پنج درخواست توضیح پذیرفته می‌شود.");
    let response: { reply: string };
    try {
      const context = {
        mode: `مصاحبهٔ استخدامی برای ${position.title}`,
        question: questions[expectedIndex],
        userMessage: input.data.userMessage,
        history: answers.slice(0, expectedIndex).map((answer, index) => ({ question: questions[index], answer })),
      };
      response = interviewAgent
        ? await interviewAgent.clarify(context, {
            chatUuid: candidate.agentChatUuid ?? undefined,
            onChatUuid: async (uuid) => {
              if (candidate.agentChatUuid === uuid) return;
              await db
                .update(employerCandidates)
                .set({ agentChatUuid: uuid })
                .where(eq(employerCandidates.id, candidate.id));
            },
          })
        : await createLegacyInterviewClarification(context, { maxOutputTokens: 400, timeoutMs: 45_000 });
    } catch (error) {
      request.log.error({ err: error, candidateId: candidate.id }, "Interview clarification failed");
      return fail(reply, 502, "پاسخ مصاحبه‌گر آماده نشد. دوباره تلاش کن.");
    }
    const nextClarifications = [
      ...clarifications,
      { questionIndex: expectedIndex, user: input.data.userMessage, reply: response.reply },
    ];
    await db
      .update(employerCandidates)
      .set({ conversationClarifications: nextClarifications, updatedAt: new Date() })
      .where(eq(employerCandidates.id, candidate.id));
    return { clarifications: nextClarifications };
  });

  const saveAnswers = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!customer(request, reply, "candidate")) return;
    const { value } = z.object({ value: z.string() }).parse(request.params);
    const { answers } = answerSchema.parse(request.body);
    const found = await candidateSession(value, request.auth!.user.id);
    if (!found) return fail(reply, 404, "دعوت‌نامه پیدا نشد.");
    const { candidate, position } = found;
    if (candidate.invitedUserId !== request.auth!.user.id)
      return fail(reply, 403, "ابتدا دعوت‌نامه را با حساب خودت بپذیر.");
    if (!candidate.invitationDeadline || candidate.invitationDeadline < new Date()) {
      await expireInvitation(candidate, position.ownerUserId);
      return fail(reply, 410, "مهلت مصاحبه به پایان رسیده است.");
    }
    if (candidate.invitationStatus === "completed") return fail(reply, 409, "مصاحبه قبلاً تکمیل شده است.");
    if (answers.length > maxInterviewTurns) return fail(reply, 422, "تعداد پاسخ‌ها معتبر نیست.");
    await db
      .update(employerCandidates)
      .set({ interviewAnswers: answers, invitationStatus: "started", updatedAt: new Date() })
      .where(eq(employerCandidates.id, candidate.id));
    return { saved: true };
  };
  app.put("/api/employer/invitations/:value/answers", saveAnswers);
  app.put("/api/employer/interviews/:value/answers", saveAnswers);

  const completeInterview = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!customer(request, reply, "candidate")) return;
    const { value } = z.object({ value: z.string() }).parse(request.params);
    const found = await candidateSession(value, request.auth!.user.id);
    if (!found) return fail(reply, 404, "دعوت‌نامه پیدا نشد.");
    const { candidate, position } = found;
    if (candidate.invitedUserId !== request.auth!.user.id)
      return fail(reply, 403, "این مصاحبه متعلق به حساب شما نیست.");
    if (candidate.invitationStatus === "completed") {
      await radicoin.settleOperation(position.ownerUserId, candidateReservationKey(candidate), "commit");
      return { completed: true };
    }
    if (!candidate.invitationDeadline || candidate.invitationDeadline < new Date()) {
      await expireInvitation(candidate, position.ownerUserId);
      return fail(reply, 410, "مهلت مصاحبه به پایان رسیده است.");
    }
    const answers = candidate.interviewAnswers ?? [];
    const questions = candidate.conversationQuestions ?? position.interviewQuestions ?? [];
    if (answers.length !== questions.length || answers.some((answer) => answer.trim().length < 10))
      return fail(reply, 422, "پاسخ همهٔ سؤال‌ها باید کامل باشد.");
    let report: z.infer<typeof interviewReportSchema>;
    try {
      report = await analyzeInterview(position, answers, false, questions, candidate.agentChatUuid ?? undefined);
    } catch (error) {
      request.log.error({ err: error, candidateId: candidate.id }, "Failed to generate employer interview report");
      return fail(reply, 502, "گزارش مصاحبه تولید نشد. پاسخ‌ها ذخیره شده‌اند؛ دوباره تلاش کن.");
    }
    await db
      .update(employerCandidates)
      .set({
        interviewReport: report,
        invitationStatus: "completed",
        updatedAt: new Date(),
      })
      .where(eq(employerCandidates.id, candidate.id));
    await radicoin.settleOperation(position.ownerUserId, candidateReservationKey(candidate), "commit");
    return { completed: true };
  };
  app.post("/api/employer/invitations/:value/complete", completeInterview);
  app.post("/api/employer/interviews/:value/complete", completeInterview);

  const exitInterview = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!customer(request, reply, "candidate")) return;
    const { value } = z.object({ value: z.string() }).parse(request.params);
    const { answers } = answerSchema.parse(request.body);
    const found = await candidateSession(value, request.auth!.user.id);
    if (!found) return fail(reply, 404, "دعوت‌نامه پیدا نشد.");
    const { candidate, position } = found;
    if (candidate.invitedUserId !== request.auth!.user.id)
      return fail(reply, 403, "این مصاحبه متعلق به حساب شما نیست.");
    if (candidate.invitationStatus === "completed")
      return fail(reply, 409, "این مصاحبه قبلاً نهایی شده و امکان شروع مجدد ندارد.");
    if (!candidate.invitationDeadline || candidate.invitationDeadline < new Date()) {
      await expireInvitation(candidate, position.ownerUserId);
      return fail(reply, 410, "مهلت مصاحبه به پایان رسیده است.");
    }
    if (answers.length > maxInterviewTurns) return fail(reply, 422, "تعداد پاسخ‌ها معتبر نیست.");

    let report: z.infer<typeof interviewReportSchema>;
    try {
      report = await analyzeInterview(
        position,
        answers,
        true,
        candidate.conversationQuestions ?? position.interviewQuestions ?? [],
        candidate.agentChatUuid ?? undefined,
      );
    } catch {
      report = {
        score: 0,
        summary: "نامزد پیش از تکمیل مصاحبه خارج شد؛ گزارش بر اساس پاسخ‌های ثبت‌شده نهایی شده است.",
        strengths: [],
        improvements: ["تکمیل پاسخ همهٔ سؤال‌های مصاحبه"],
      };
    }
    await db
      .update(employerCandidates)
      .set({
        interviewAnswers: answers,
        interviewReport: report,
        invitationStatus: "completed",
        updatedAt: new Date(),
      })
      .where(eq(employerCandidates.id, candidate.id));
    await radicoin.settleOperation(position.ownerUserId, candidateReservationKey(candidate), "commit");
    return { completed: true, exitedEarly: true };
  };
  app.post("/api/employer/invitations/:value/exit", exitInterview);
  app.post("/api/employer/interviews/:value/exit", exitInterview);

  app.get("/api/employer/interviews", async (request, reply) => {
    if (!customer(request, reply, "candidate")) return;
    const candidates = await db
      .select(candidateColumns)
      .from(employerCandidates)
      .where(eq(employerCandidates.invitedUserId, request.auth!.user.id));
    const positionIds = [...new Set(candidates.map((candidate) => candidate.positionId))];
    if (!positionIds.length) return [];
    const positions = await db.select().from(employerPositions).where(inArray(employerPositions.id, positionIds));
    const byId = new Map(positions.map((position) => [position.id, position]));
    const current = await Promise.all(
      candidates.map((candidate) => {
        const position = byId.get(candidate.positionId);
        return position ? expireInvitation(candidate, position.ownerUserId) : candidate;
      }),
    );
    const cancelled = await db
      .select({
        id: employerInvitationHistory.id,
        positionId: employerInvitationHistory.positionId,
        deadline: employerInvitationHistory.deadline,
        status: employerInvitationHistory.status,
        cancelledAt: employerInvitationHistory.cancelledAt,
      })
      .from(employerInvitationHistory)
      .where(eq(employerInvitationHistory.invitedUserId, request.auth!.user.id));
    const cancelledPositionIds = [...new Set(cancelled.map((invitation) => invitation.positionId))];
    const cancelledPositions = cancelledPositionIds.length
      ? await db.select().from(employerPositions).where(inArray(employerPositions.id, cancelledPositionIds))
      : [];
    const cancelledByPositionId = new Map(cancelledPositions.map((position) => [position.id, position]));
    return [
      ...current
      .filter((candidate) => candidate.invitationStatus !== "not_invited")
      .map((candidate) => ({
        id: candidate.id,
        title: byId.get(candidate.positionId)?.title ?? "",
        companyName: byId.get(candidate.positionId)?.companyName ?? "",
        status: candidate.invitationStatus,
        deadline: candidate.invitationDeadline,
      })),
      ...cancelled.flatMap((invitation) => {
        const position = cancelledByPositionId.get(invitation.positionId);
        if (!position) return [];
        return [{
          id: `cancelled-${invitation.id}`,
          title: position.title,
          companyName: position.companyName,
          status: invitation.status,
          deadline: invitation.deadline,
          cancelledAt: invitation.cancelledAt,
        }];
      }),
    ];
  });
}
