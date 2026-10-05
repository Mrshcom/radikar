import { createHash, randomUUID } from "node:crypto";
import { and, asc, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import type { Database } from "@radikar/database";
import { jobListings, jobPoolRuns, jobPoolSegments, jobPoolSettings } from "@radikar/database";
import { DEFAULT_JOB_POOL_SEGMENTS } from "./default-segments";

const APIFY_API_BASE = "https://api.apify.com/v2";
const SOURCE = "linkedin";
const SETTINGS_ID = "default";
const publishedAtValues = ["r86400", "r604800", "r2592000"] as const;

type RawJob = Record<string, unknown>;

export type JobPoolServiceOptions = {
  enabled: boolean;
  apifyApiToken?: string;
  actorId: string;
  dailyLimit: number;
  intervalHours: number;
  locations: string[];
  publishedAt: "r86400" | "r604800" | "r2592000";
  costPerThousandUsdMicros: number;
  actorStartCostUsdMicros: number;
};

export type JobPoolSettingsInput = {
  enabled: boolean;
  dailyLimit: number;
  intervalHours: number;
  publishedAt: (typeof publishedAtValues)[number];
  locations: string[];
};

export type JobPoolJobFilters = {
  query?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

export type PublicJobPoolListing = {
  id: string;
  title: string;
  companyName: string;
  companyLogoUrl: string | null;
  location: string | null;
  canonicalUrl: string;
  workplaceType: string | null;
  employmentType: string | null;
  salaryText: string | null;
  salaryPeriod: "monthly" | "yearly" | "unknown";
  postedAt: Date | null;
  description: string | null;
  skills: string[];
};

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asTextList(value: unknown) {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function parseDate(value: unknown) {
  const text = asText(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseSalary(value: unknown) {
  const values = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const salaryText = values
    .filter((item): item is string => typeof item === "string")
    .join(" – ")
    .trim();
  if (!salaryText) return { salaryText: null, salaryMin: null, salaryMax: null, salaryCurrency: null };
  const salaryCurrency = salaryText.includes("$")
    ? "USD"
    : salaryText.includes("€")
      ? "EUR"
      : salaryText.includes("£")
        ? "GBP"
        : null;
  const valuesInText = extractSalaryAmounts(salaryText);
  return {
    salaryText,
    salaryMin: valuesInText.length ? Math.round(Math.min(...valuesInText)) : null,
    salaryMax: valuesInText.length ? Math.round(Math.max(...valuesInText)) : null,
    salaryCurrency,
  };
}

export type SalaryPeriod = "monthly" | "yearly" | "unknown";

function salaryTextValues(values: unknown[]) {
  return values.flatMap((value) => {
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
    return [];
  });
}

function extractSalaryAmounts(text: string) {
  return Array.from(text.matchAll(/\b\d[\d,.]*\s*[km]?\b/gi), (match) => {
    const normalized = match[0].replace(/,/g, "").replace(/\s+/g, "").toLocaleLowerCase("en");
    const multiplier = normalized.endsWith("m") ? 1_000_000 : normalized.endsWith("k") ? 1_000 : 1;
    const amount = Number.parseFloat(normalized.replace(/[km]$/, ""));
    return amount * multiplier;
  }).filter(Number.isFinite);
}

function explicitSalaryPeriod(text: string, requireCurrency = false): SalaryPeriod {
  const amount = requireCurrency
    ? "(?:[$€£]\\s*\\d[\\d,.]*\\s*[km]?|\\d[\\d,.]*\\s*[km]?\\s*(?:usd|eur|gbp))"
    : "(?:[$€£]?\\s*\\d[\\d,.]*\\s*[km]?|\\d[\\d,.]*\\s*[km]?\\s*(?:usd|eur|gbp|[$€£]))";
  if (
    new RegExp(
      `(?:${amount})\\s*(?:[a-z]{3}\\s*)?(?:per\\s*|/\\s*)?(?:month|mo\\.?|monthly)|(?:month|mo\\.?|monthly)\\s*(?:${amount})|ماه(?:انه|یانه)?`,
      "i",
    ).test(text)
  )
    return "monthly";
  if (
    new RegExp(
      `(?:${amount})\\s*(?:[a-z]{3}\\s*)?(?:per\\s*|/\\s*)?(?:year|yr\\.?|annual(?:ly)?|yearly|annum)|(?:year|yr\\.?|annual(?:ly)?|yearly|annum)\\s*(?:${amount})|سال(?:انه|یانه)?`,
      "i",
    ).test(text)
  )
    return "yearly";
  return "unknown";
}

export function detectSalaryPeriod(...values: unknown[]): SalaryPeriod {
  const salaryText = salaryTextValues(values.slice(0, 4)).join(" ").toLocaleLowerCase("en");
  const salaryPeriod = explicitSalaryPeriod(salaryText);
  if (salaryPeriod !== "unknown") return salaryPeriod;
  const salaryAmounts = extractSalaryAmounts(salaryText);
  if (salaryAmounts.some((amount) => amount > 15_000)) return "yearly";
  if (/[€$£]|\b(?:usd|eur|gbp)\b/i.test(salaryText) && salaryAmounts.some((amount) => amount >= 1_000))
    return "monthly";

  const fallbackText = salaryTextValues(values.slice(4)).join(" ").toLocaleLowerCase("en");
  const fallbackPeriod = explicitSalaryPeriod(fallbackText, true);
  if (fallbackPeriod !== "unknown") return fallbackPeriod;
  if (extractSalaryAmounts(fallbackText).some((amount) => amount > 15_000)) return "yearly";
  return "unknown";
}

function fingerprint(...parts: string[]) {
  return createHash("sha256")
    .update(parts.map((part) => part.trim().toLocaleLowerCase("en")).join("|"))
    .digest("hex");
}

function normalizeJob(raw: RawJob) {
  const title = asText(raw.jobTitle ?? raw.title ?? raw.position);
  const companyName = asText(raw.companyName ?? raw.company ?? raw.company_name);
  const location = asText(raw.location ?? raw.jobLocation);
  const canonicalUrl = asText(raw.jobUrl ?? raw.url ?? raw.job_url);
  const externalId = asText(raw.jobId ?? raw.id) || fingerprint(canonicalUrl, title, companyName, location);
  if (!title || !companyName || !canonicalUrl) return null;
  const skills = asTextList(raw.skills ?? raw.skillNames ?? raw.jobSkills);
  const salary = parseSalary(raw.salaryInfo ?? raw.salary ?? raw.salaryText);
  return {
    id: randomUUID(),
    source: SOURCE,
    externalId,
    canonicalUrl,
    fingerprint: fingerprint(title, companyName, location, canonicalUrl),
    title,
    companyName,
    location: location || null,
    workplaceType: asText(raw.workplaceType ?? raw.workType) || null,
    employmentType: asText(raw.employmentType ?? raw.jobType) || null,
    seniority: asText(raw.seniorityLevel ?? raw.experienceLevel) || null,
    ...salary,
    description: asText(raw.description ?? raw.jobDescription) || null,
    skills,
    postedAt: parseDate(raw.publishedAt ?? raw.postedAt),
    rawPayload: raw,
  };
}

export class JobPoolService {
  constructor(
    private readonly db: Database,
    private readonly options: JobPoolServiceOptions,
  ) {}

  async getSummary() {
    const settings = await this.getSettings();
    const [latestRun] = await this.db.select().from(jobPoolRuns).orderBy(desc(jobPoolRuns.startedAt)).limit(1);
    const [active] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobListings)
      .where(eq(jobListings.isActive, true));
    const [segments] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobPoolSegments)
      .where(eq(jobPoolSegments.isActive, true));
    return {
      settings,
      activeJobCount: active?.count ?? 0,
      activeSegmentCount: segments?.count ?? 0,
      latestRun: latestRun ?? null,
    };
  }

  async getReport(days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1_000);
    const [totals] = await this.db
      .select({
        runs: sql<number>`count(*)::int`,
        searches: sql<number>`coalesce(sum(${jobPoolRuns.searchCount}), 0)::int`,
        received: sql<number>`coalesce(sum(${jobPoolRuns.receivedCount}), 0)::int`,
        inserted: sql<number>`coalesce(sum(${jobPoolRuns.insertedCount}), 0)::int`,
        updated: sql<number>`coalesce(sum(${jobPoolRuns.updatedCount}), 0)::int`,
        estimatedCostUsdMicros: sql<number>`coalesce(sum(${jobPoolRuns.estimatedCostUsdMicros}), 0)::int`,
        successfulRuns: sql<number>`count(*) filter (where ${jobPoolRuns.status} = 'completed')::int`,
        failedRuns: sql<number>`count(*) filter (where ${jobPoolRuns.status} = 'failed')::int`,
      })
      .from(jobPoolRuns)
      .where(gte(jobPoolRuns.startedAt, since));
    const runs = await this.db
      .select()
      .from(jobPoolRuns)
      .where(gte(jobPoolRuns.startedAt, since))
      .orderBy(desc(jobPoolRuns.startedAt))
      .limit(100);
    const [active] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobListings)
      .where(eq(jobListings.isActive, true));
    return { periodDays: days, totals: { ...totals, activeJobs: active?.count ?? 0 }, runs };
  }

  async listJobs(filters: JobPoolJobFilters) {
    const conditions = [eq(jobListings.isActive, true)];
    if (filters.query) conditions.push(ilike(jobListings.title, `%${filters.query}%`));
    if (filters.location) conditions.push(ilike(jobListings.location, `%${filters.location}%`));
    if (filters.salaryCurrency) conditions.push(eq(jobListings.salaryCurrency, filters.salaryCurrency));
    if (filters.salaryMin != null) conditions.push(gte(jobListings.salaryMax, filters.salaryMin));
    if (filters.salaryMax != null) conditions.push(lte(jobListings.salaryMin, filters.salaryMax));
    const where = and(...conditions);
    const ascending = filters.sortDirection === "asc";
    let orderBy = desc(jobListings.postedAt);
    if (filters.sortBy === "title") orderBy = ascending ? asc(jobListings.title) : desc(jobListings.title);
    if (filters.sortBy === "company")
      orderBy = ascending ? asc(jobListings.companyName) : desc(jobListings.companyName);
    if (filters.sortBy === "location") orderBy = ascending ? asc(jobListings.location) : desc(jobListings.location);
    if (filters.sortBy === "salary") orderBy = ascending ? asc(jobListings.salaryMin) : desc(jobListings.salaryMin);
    if (filters.sortBy === "date") orderBy = ascending ? asc(jobListings.postedAt) : desc(jobListings.postedAt);
    const [total] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobListings)
      .where(where);
    const items = await this.db
      .select()
      .from(jobListings)
      .where(where)
      .orderBy(orderBy, desc(jobListings.lastSeenAt))
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize);
    return {
      items: items.map((job) => ({
        ...job,
        salaryPeriod: detectSalaryPeriod(
          job.salaryText,
          job.rawPayload?.salaryInfo,
          job.rawPayload?.salary,
          job.rawPayload?.salaryText,
          job.rawPayload?.description,
          job.rawPayload?.jobDescription,
        ),
      })),
      total: total?.count ?? 0,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  async listPublicJobs(filters: JobPoolJobFilters) {
    const result = await this.listJobs(filters);
    return {
      ...result,
      items: result.items.map(
        ({
          rawPayload,
          seniority: _seniority,
          salaryMin: _salaryMin,
          salaryMax: _salaryMax,
          salaryCurrency: _salaryCurrency,
          source: _source,
          externalId: _externalId,
          fingerprint: _fingerprint,
          discoveredAt: _discoveredAt,
          lastSeenAt: _lastSeenAt,
          expiresAt: _expiresAt,
          isActive: _isActive,
          ...job
        }) =>
          ({
            ...job,
            companyLogoUrl: asText(rawPayload.companyLogo) || null,
          }) satisfies PublicJobPoolListing,
      ),
    };
  }

  async getSettings(): Promise<JobPoolSettingsInput> {
    const now = new Date();
    await this.db
      .insert(jobPoolSettings)
      .values({
        id: SETTINGS_ID,
        enabled: this.options.enabled,
        dailyLimit: this.options.dailyLimit,
        intervalHours: this.options.intervalHours,
        publishedAt: this.options.publishedAt,
        locations: this.options.locations,
        updatedAt: now,
      })
      .onConflictDoNothing();
    const [settings] = await this.db.select().from(jobPoolSettings).where(eq(jobPoolSettings.id, SETTINGS_ID)).limit(1);
    if (!settings || !publishedAtValues.includes(settings.publishedAt as (typeof publishedAtValues)[number])) {
      throw new Error("تنظیمات Job Pool معتبر نیست.");
    }
    return {
      enabled: settings.enabled,
      dailyLimit: settings.dailyLimit,
      intervalHours: settings.intervalHours,
      publishedAt: settings.publishedAt as JobPoolSettingsInput["publishedAt"],
      locations: Array.isArray(settings.locations)
        ? settings.locations
            .filter((location) => typeof location === "string" && location.trim())
            .map((location) => location.trim())
        : [],
    };
  }

  async updateSettings(input: JobPoolSettingsInput) {
    const now = new Date();
    await this.db
      .insert(jobPoolSettings)
      .values({ id: SETTINGS_ID, ...input, updatedAt: now })
      .onConflictDoUpdate({
        target: jobPoolSettings.id,
        set: { ...input, updatedAt: now },
      });
    return this.getSettings();
  }

  async syncDailyPool(options: { ignoreInterval?: boolean } = {}) {
    const settings = await this.getSettings();
    if (!settings.enabled) throw new Error("Job Pool در پنل سوپرادمین غیرفعال است.");
    if (!settings.locations.length)
      throw new Error("حداقل یک موقعیت جست‌وجو را در تنظیمات Job Pool وارد کن؛ هیچ درخواست Apify ارسال نشد.");
    if (!this.options.apifyApiToken) throw new Error("APIFY_API_TOKEN برای Job Pool تنظیم نشده است.");

    const now = new Date();
    const [latestCompletedRun] = await this.db
      .select()
      .from(jobPoolRuns)
      .where(and(eq(jobPoolRuns.source, SOURCE), eq(jobPoolRuns.status, "completed")))
      .orderBy(desc(jobPoolRuns.startedAt))
      .limit(1);
    if (
      !options.ignoreInterval &&
      latestCompletedRun &&
      now.getTime() - latestCompletedRun.startedAt.getTime() < settings.intervalHours * 60 * 60 * 1_000
    ) {
      throw new Error("Job Pool در بازه روزانه فعلی قبلاً با موفقیت اجرا شده است.");
    }
    await this.ensureDefaultSegments(now);
    const segments = await this.db
      .select()
      .from(jobPoolSegments)
      .where(eq(jobPoolSegments.isActive, true))
      .orderBy(jobPoolSegments.sortOrder);
    const searchCount = segments.length * settings.locations.length;
    const runId = randomUUID();
    await this.db.insert(jobPoolRuns).values({
      id: runId,
      source: SOURCE,
      status: "running",
      requestedLimit: settings.dailyLimit,
      searchCount,
      startedAt: now,
    });

    let receivedCount = 0;
    try {
      const response = await fetch(
        `${APIFY_API_BASE}/acts/${encodeURIComponent(this.options.actorId)}/run-sync-get-dataset-items?token=${encodeURIComponent(this.options.apifyApiToken)}&format=json`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            keyword: segments.map((segment) => segment.keyword),
            locations: settings.locations,
            publishedAt: settings.publishedAt,
            maxItems: settings.dailyLimit,
            saveOnlyUniqueItems: true,
            enrichCompanyData: false,
          }),
          signal: AbortSignal.timeout(15 * 60_000),
        },
      );
      if (!response.ok) throw new Error(`Apify پاسخ ${response.status} داد.`);
      const payload = (await response.json()) as unknown;
      const rawJobs = Array.isArray(payload)
        ? payload.filter((item): item is RawJob => Boolean(item) && typeof item === "object")
        : [];
      receivedCount = rawJobs.length;
      let insertedCount = 0;
      let updatedCount = 0;
      for (const rawJob of rawJobs) {
        const job = normalizeJob(rawJob);
        if (!job) continue;
        const existing = await this.db
          .select({ id: jobListings.id })
          .from(jobListings)
          .where(and(eq(jobListings.source, SOURCE), eq(jobListings.externalId, job.externalId)))
          .limit(1);
        const timestamps = { lastSeenAt: now, isActive: true };
        if (existing.length) {
          updatedCount += 1;
          await this.db
            .update(jobListings)
            .set({ ...job, ...timestamps, id: existing[0].id })
            .where(eq(jobListings.id, existing[0].id));
        } else {
          insertedCount += 1;
          await this.db.insert(jobListings).values({ ...job, discoveredAt: now, ...timestamps });
        }
      }
      const estimatedCostUsdMicros =
        Math.ceil((rawJobs.length * this.options.costPerThousandUsdMicros) / 1_000) +
        this.options.actorStartCostUsdMicros;
      await this.db
        .update(jobPoolRuns)
        .set({
          status: "completed",
          receivedCount: rawJobs.length,
          insertedCount,
          updatedCount,
          estimatedCostUsdMicros,
          completedAt: new Date(),
        })
        .where(eq(jobPoolRuns.id, runId));
      return { runId, receivedCount: rawJobs.length, insertedCount, updatedCount, estimatedCostUsdMicros };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "خطای نامشخص در دریافت Job Pool";
      const estimatedCostUsdMicros =
        Math.ceil((receivedCount * this.options.costPerThousandUsdMicros) / 1_000) +
        this.options.actorStartCostUsdMicros;
      await this.db
        .update(jobPoolRuns)
        .set({ status: "failed", receivedCount, estimatedCostUsdMicros, errorMessage, completedAt: new Date() })
        .where(eq(jobPoolRuns.id, runId));
      throw error;
    }
  }

  private async ensureDefaultSegments(now: Date) {
    for (const [index, [id, keyword]] of DEFAULT_JOB_POOL_SEGMENTS.entries()) {
      await this.db
        .insert(jobPoolSegments)
        .values({ id, label: keyword, keyword, sortOrder: index, createdAt: now, updatedAt: now })
        .onConflictDoNothing();
    }
  }
}
