import { z } from "zod";
import {
  dataCollections,
  type DataCollection,
  type DataRecord,
} from "@radicar/shared-types";

const localizedDigitPattern = /[۰-۹٠-٩]/g;
const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

export function normalizeDigits(value: string) {
  return value.replace(localizedDigitPattern, (digit) => {
    const persianIndex = persianDigits.indexOf(digit);
    return String(persianIndex >= 0 ? persianIndex : arabicDigits.indexOf(digit));
  });
}

export function normalizeDigitsDeep<T>(value: T): T {
  if (typeof value === "string") return normalizeDigits(value) as T;
  if (Array.isArray(value)) return value.map(normalizeDigitsDeep) as T;
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, normalizeDigitsDeep(nestedValue)]),
    ) as T;
  }
  return value;
}

export const dataCollectionSchema = z.enum(dataCollections);

export const baseRecordSchema = z
  .object({
    id: z.string().trim().min(1).max(255),
    profileId: z.string().trim().min(1).max(255).optional(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .loose();

const importedTextKeys = ["name", "label", "title", "value", "text"] as const;
const maxImportedTextLength = 12_000;
const maxImportedImageLength = 7_000_000;
const unsafeControlCharacters =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g;

function sanitizeImportedScalar(value: string, maxLength: number) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(unsafeControlCharacters, "")
    .normalize("NFC")
    .trim()
    .slice(0, maxLength);
}

export function normalizeImportedText(value: unknown): string {
  if (typeof value === "string")
    return sanitizeImportedScalar(value, maxImportedTextLength);
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value))
    return value
      .map(normalizeImportedText)
      .map((item) => item.trim())
      .filter(Boolean)
      .join("، ")
      .slice(0, maxImportedTextLength);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of importedTextKeys) {
      const normalized = normalizeImportedText(record[key]);
      if (normalized.trim()) return normalized;
    }
  }
  return "";
}

export function sanitizeImportedUrl(value: unknown) {
  const normalized = normalizeImportedText(value).trim();
  if (
    !normalized ||
    /^(?:javascript|data|vbscript|file):/i.test(normalized) ||
    /(?:…|⋯|%e2%80%a6|%e2%8b%af)/i.test(normalized)
  )
    return "";
  try {
    const parsed = new URL(
      /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`,
    );
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      !parsed.hostname ||
      !parsed.hostname.includes(".") ||
      parsed.username ||
      parsed.password
    )
      return "";
    return parsed.toString().slice(0, 2_048);
  } catch {
    return "";
  }
}

export function sanitizeImportedImageSource(value: unknown) {
  if (typeof value !== "string") return "";
  const normalized = sanitizeImportedScalar(value, maxImportedImageLength);
  if (/^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/=\s]+$/i.test(normalized))
    return normalized;
  if (normalized.startsWith("//") || normalized.includes("\\")) return "";
  if (
    normalized.startsWith("/") &&
    !normalized.startsWith("//")
  )
    return normalized.slice(0, 2_048);
  return sanitizeImportedUrl(normalized);
}

export function sanitizeRemoteImageSource(value: unknown) {
  const source = sanitizeImportedImageSource(value);
  if (!/^https?:\/\//i.test(source)) return "";
  try {
    const parsed = new URL(source);
    if (
      parsed.hostname === "localhost" ||
      parsed.hostname.endsWith(".local") ||
      /^\d{1,3}(?:\.\d{1,3}){3}$/.test(parsed.hostname) ||
      parsed.hostname.includes(":")
    )
      return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function sanitizeImportedEmail(value: unknown) {
  const normalized = normalizeImportedText(value).replace(/\s+/g, "");
  return /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,63}$/u.test(normalized)
    ? normalized.slice(0, 254)
    : "";
}

function sanitizeImportedPhone(value: unknown) {
  const normalized = normalizeDigits(normalizeImportedText(value));
  if (/^[+\d][\d\s().-]{5,30}$/.test(normalized)) return normalized;
  return "";
}

export function normalizeImportedBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const normalized = normalizeImportedText(value).trim().toLocaleLowerCase("fa");
  return /^(?:true|yes|1|current|present|بله|اکنون|امروز|در حال حاضر)$/.test(
    normalized,
  );
}

function objectInput(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function parseStructuredString(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed || !/^[\[{]/.test(trimmed)) return value;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
}

function firstDefined(
  record: Record<string, unknown>,
  keys: readonly string[],
) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function aliasedObjectInput(
  value: unknown,
  scalarKey: string,
  aliases: Record<string, readonly string[]>,
) {
  const parsed = parseStructuredString(value);
  const source =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : { [scalarKey]: parsed };
  return Object.fromEntries(
    Object.entries(aliases).map(([key, candidates]) => [
      key,
      firstDefined(source, [key, ...candidates]),
    ]),
  );
}

const collectionWrapperKeys = [
  "items",
  "data",
  "values",
  "list",
  "results",
  "records",
] as const;

function collectionInput(value: unknown): unknown[] {
  const parsed = parseStructuredString(value);
  if (parsed === undefined || parsed === null || parsed === "") return [];
  if (Array.isArray(parsed)) return parsed.flatMap(collectionInput);
  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;
    const wrapped = firstDefined(record, collectionWrapperKeys);
    if (wrapped !== undefined && wrapped !== parsed)
      return collectionInput(wrapped);
  }
  return [parsed];
}

export function normalizeImportedTextArray(value: unknown) {
  return collectionInput(value)
    .map(normalizeImportedText)
    .filter(Boolean);
}

function omitUndefinedValues<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, nestedValue]) => nestedValue !== undefined),
  ) as Partial<T>;
}

const optionalImportedTextSchema = z.preprocess(
  (value) =>
    value === undefined || value === null
      ? undefined
      : normalizeImportedText(value),
  z.string().optional(),
);
const optionalImportedUrlSchema = z.preprocess(
  (value) => {
    const sanitized = sanitizeImportedUrl(value);
    return sanitized || undefined;
  },
  z.string().max(2_048).optional(),
);
const optionalImportedImageSchema = z.preprocess(
  (value) => {
    const sanitized = sanitizeImportedImageSource(value);
    return sanitized || undefined;
  },
  z.string().max(maxImportedImageLength).optional(),
);
const optionalImportedEmailSchema = z.preprocess(
  (value) => {
    const sanitized = sanitizeImportedEmail(value);
    return sanitized || undefined;
  },
  z.string().max(254).optional(),
);
const optionalImportedPhoneSchema = z.preprocess(
  (value) => {
    const sanitized = sanitizeImportedPhone(value);
    return sanitized || undefined;
  },
  z.string().max(32).optional(),
);
const importedBooleanSchema = z.preprocess(normalizeImportedBoolean, z.boolean());

function boundedImportedArray<T extends z.ZodType>(schema: T, maxLength = 100) {
  return z.preprocess(
    (value) => collectionInput(value).slice(0, maxLength),
    z.array(schema).max(maxLength),
  );
}

const importedExperienceSchema = z.preprocess(
  (value) =>
    aliasedObjectInput(value, "description", {
      id: [],
      jobTitle: ["title", "position", "role"],
      company: ["employer", "organization", "organisation"],
      location: ["city", "place"],
      startDate: ["start", "from"],
      endDate: ["end", "to"],
      date: ["dateRange", "period"],
      isCurrent: ["current", "present"],
      description: ["summary", "details", "responsibilities"],
      technologies: ["technology", "tech", "stack", "skills", "tools"],
      achievements: ["accomplishments"],
    }),
  z
    .object({
      id: optionalImportedTextSchema,
      jobTitle: optionalImportedTextSchema,
      company: optionalImportedTextSchema,
      location: optionalImportedTextSchema,
      startDate: optionalImportedTextSchema,
      endDate: optionalImportedTextSchema,
      date: optionalImportedTextSchema,
      isCurrent: importedBooleanSchema.default(false),
      description: optionalImportedTextSchema,
      technologies: optionalImportedTextSchema,
      achievements: optionalImportedTextSchema,
    })
    .transform(omitUndefinedValues),
);

const importedQualificationSchema = z.preprocess(
  (value) =>
    aliasedObjectInput(value, "credential", {
      id: [],
      institution: ["university", "school", "academy", "organization"],
      credential: ["degree", "title", "name", "certificate"],
      startDate: ["start", "from"],
      endDate: ["end", "to"],
      date: ["dateRange", "period"],
      isCurrent: ["current", "present"],
      education: ["study"],
      certifications: ["certificates"],
      skills: ["technologies", "stack"],
      languages: ["language"],
    }),
  z
    .object({
      id: optionalImportedTextSchema,
      institution: optionalImportedTextSchema,
      credential: optionalImportedTextSchema,
      startDate: optionalImportedTextSchema,
      endDate: optionalImportedTextSchema,
      date: optionalImportedTextSchema,
      isCurrent: importedBooleanSchema.default(false),
      education: optionalImportedTextSchema,
      certifications: optionalImportedTextSchema,
      skills: optionalImportedTextSchema,
      languages: optionalImportedTextSchema,
    })
    .transform(omitUndefinedValues),
);

const importedProjectSchema = z.preprocess(
  (value) =>
    aliasedObjectInput(value, "name", {
      id: [],
      name: ["title", "projectName"],
      role: ["type", "position"],
      url: ["link", "website", "href"],
      startDate: ["start", "from"],
      endDate: ["end", "to"],
      date: ["dateRange", "period"],
      isCurrent: ["current", "present"],
      description: ["summary", "details"],
      technologies: ["technology", "tech", "stack", "skills", "tools"],
    }),
  z
    .object({
      id: optionalImportedTextSchema,
      name: optionalImportedTextSchema,
      role: optionalImportedTextSchema,
      url: optionalImportedUrlSchema,
      startDate: optionalImportedTextSchema,
      endDate: optionalImportedTextSchema,
      date: optionalImportedTextSchema,
      isCurrent: importedBooleanSchema.default(false),
      description: optionalImportedTextSchema,
      technologies: optionalImportedTextSchema,
    })
    .transform(omitUndefinedValues),
);

const importedLanguageSchema = z.preprocess(
  (value) =>
    aliasedObjectInput(value, "name", {
      id: [],
      name: ["languageName", "language", "title"],
      languageName: ["language", "name"],
      proficiency: ["level", "fluency"],
    }),
  z
    .object({
      id: optionalImportedTextSchema,
      name: optionalImportedTextSchema,
      languageName: optionalImportedTextSchema,
      proficiency: optionalImportedTextSchema,
    })
    .transform(({ languageName, ...language }) => ({
      ...language,
      name: language.name || languageName,
    })),
);

const importedResumeDataSchema = z.preprocess(
  (value) =>
    aliasedObjectInput(value, "summary", {
      fullName: ["name", "candidateName"],
      jobTitle: ["title", "professionalTitle", "position"],
      photoUrl: ["photo", "avatar", "image", "profileImage"],
      email: ["mail"],
      phone: ["mobile", "telephone", "tel"],
      location: ["address", "city", "place"],
      website: ["linkedin", "link", "url", "portfolioUrl"],
      summary: ["about", "bio", "profile", "objective"],
      experienceTitle: ["currentRole"],
      company: ["employer", "organization"],
      experienceDate: ["date", "period"],
      experience: ["experienceSummary", "workSummary"],
      education: ["educationSummary"],
      experiences: ["workExperience", "workExperiences", "employmentHistory"],
      educations: ["qualifications", "degrees", "educationHistory"],
      projects: ["portfolioProjects", "project"],
      skills: ["technicalSkills", "techSkills", "technologies"],
      languages: ["language", "spokenLanguages"],
    }),
  z
    .object({
      fullName: optionalImportedTextSchema,
      jobTitle: optionalImportedTextSchema,
      photoUrl: optionalImportedImageSchema,
      email: optionalImportedEmailSchema,
      phone: optionalImportedPhoneSchema,
      location: optionalImportedTextSchema,
      website: optionalImportedUrlSchema,
      summary: optionalImportedTextSchema,
      experienceTitle: optionalImportedTextSchema,
      company: optionalImportedTextSchema,
      experienceDate: optionalImportedTextSchema,
      experience: optionalImportedTextSchema,
      education: optionalImportedTextSchema,
      experiences: boundedImportedArray(importedExperienceSchema).optional(),
      educations: boundedImportedArray(importedQualificationSchema).optional(),
      projects: boundedImportedArray(importedProjectSchema).optional(),
      skills: optionalImportedTextSchema,
      languages: optionalImportedTextSchema,
    })
    .transform(omitUndefinedValues),
);

function prepareResumeImport(value: unknown) {
  const envelope = objectInput(parseStructuredString(value)) as Record<
    string,
    unknown
  >;
  const nestedEnvelope = objectInput(
    firstDefined(envelope, ["result", "output", "response"]),
  ) as Record<string, unknown>;
  const dataEnvelope = objectInput(envelope.data) as Record<string, unknown>;
  const root = {
    ...envelope,
    ...(Object.keys(dataEnvelope).length ? dataEnvelope : {}),
    ...(Object.keys(nestedEnvelope).length ? nestedEnvelope : {}),
  };
  const resumeData = objectInput(
    parseStructuredString(
      firstDefined(root, ["resumeData", "resume", "cv", "profile"]),
    ),
  ) as Record<string, unknown>;
  return {
    ...root,
    resumeData,
    experiences:
      firstDefined(root, [
        "experiences",
        "workExperience",
        "workExperiences",
        "employmentHistory",
      ]) ??
      firstDefined(resumeData, [
        "experiences",
        "workExperience",
        "workExperiences",
        "employmentHistory",
      ]),
    qualifications:
      firstDefined(root, [
        "qualifications",
        "educations",
        "educationHistory",
        "degrees",
      ]) ??
      firstDefined(resumeData, [
        "qualifications",
        "educations",
        "educationHistory",
        "degrees",
      ]),
    projects:
      firstDefined(root, ["projects", "portfolioProjects", "project"]) ??
      firstDefined(resumeData, [
        "projects",
        "portfolioProjects",
        "project",
      ]),
    skills:
      firstDefined(root, ["skills", "technicalSkills", "technologies"]) ??
      firstDefined(resumeData, [
        "skills",
        "technicalSkills",
        "technologies",
      ]),
    languages:
      firstDefined(root, ["languages", "spokenLanguages", "language"]) ??
      firstDefined(resumeData, [
        "languages",
        "spokenLanguages",
        "language",
      ]),
    languageItems: firstDefined(root, [
      "languageItems",
      "spokenLanguageItems",
    ]),
  };
}

export const resumeImportPayloadSchema = z.preprocess(
  prepareResumeImport,
  z.object({
    resumeData: importedResumeDataSchema.default({}),
    experiences: boundedImportedArray(importedExperienceSchema).default([]),
    qualifications: boundedImportedArray(importedQualificationSchema).default([]),
    projects: boundedImportedArray(importedProjectSchema).default([]),
    skills: optionalImportedTextSchema,
    languages: optionalImportedTextSchema,
    languageItems: boundedImportedArray(importedLanguageSchema, 50).default([]),
    careerGoals: optionalImportedTextSchema,
    preferredRoles: optionalImportedTextSchema,
    preferredIndustries: optionalImportedTextSchema,
    workPreferences: optionalImportedTextSchema,
    interviewContext: optionalImportedTextSchema,
    interviewChallenges: optionalImportedTextSchema,
    fileName: optionalImportedTextSchema,
    error: optionalImportedTextSchema,
  }),
);

export type ResumeImportPayload = z.infer<typeof resumeImportPayloadSchema>;

export function normalizeResumeImportPayload(value: unknown) {
  return resumeImportPayloadSchema.parse(value);
}

export function normalizeImportedResumeData(value: unknown) {
  return importedResumeDataSchema.parse(value);
}

function canonicalId(value: unknown, prefix: string, index: number) {
  return normalizeImportedText(value) || `${prefix}-${index + 1}`;
}

function canonicalDates(value: Record<string, unknown>) {
  let startDate = normalizeImportedText(value.startDate);
  let endDate = normalizeImportedText(value.endDate);
  if (!startDate && !endDate) {
    const [start = "", end = ""] = normalizeImportedText(value.date).split(
      /\s+(?:تا|–|—|-)\s+/,
      2,
    );
    startDate = start.trim();
    endDate = end.trim();
  }
  const isCurrent =
    normalizeImportedBoolean(value.isCurrent) ||
    /^(?:امروز|اکنون|حال|حال حاضر|present|current|now)$/i.test(endDate);
  return { startDate, endDate: isCurrent ? "" : endDate, isCurrent };
}

function canonicalExperience(value: Record<string, unknown>, index: number) {
  const dates = canonicalDates(value);
  return {
    id: canonicalId(value.id, "experience", index),
    jobTitle: normalizeImportedText(value.jobTitle),
    company: normalizeImportedText(value.company),
    location: normalizeImportedText(value.location),
    ...dates,
    description: normalizeImportedText(value.description),
    technologies: normalizeImportedText(value.technologies),
  };
}

function canonicalQualification(
  value: Record<string, unknown>,
  index: number,
) {
  const dates = canonicalDates(value);
  return {
    id: canonicalId(value.id, "qualification", index),
    institution: normalizeImportedText(value.institution),
    credential: normalizeImportedText(
      value.credential || value.education || value.certifications,
    ),
    ...dates,
  };
}

function canonicalProject(value: Record<string, unknown>, index: number) {
  const dates = canonicalDates(value);
  return {
    id: canonicalId(value.id, "project", index),
    name: normalizeImportedText(value.name),
    role: normalizeImportedText(value.role),
    url: sanitizeImportedUrl(value.url),
    ...dates,
    description: normalizeImportedText(value.description),
    technologies: normalizeImportedText(value.technologies),
  };
}

function canonicalLanguage(value: Record<string, unknown>, index: number) {
  return {
    id: canonicalId(value.id, "language", index),
    name: normalizeImportedText(value.name || value.languageName),
    proficiency: normalizeImportedText(value.proficiency),
  };
}

export function normalizeStoredResumeData(value: unknown) {
  const normalized = normalizeImportedResumeData(value);
  return {
    fullName: normalizeImportedText(normalized.fullName),
    jobTitle: normalizeImportedText(normalized.jobTitle),
    photoUrl: sanitizeImportedImageSource(normalized.photoUrl),
    email: normalizeImportedText(normalized.email),
    phone: normalizeImportedText(normalized.phone),
    location: normalizeImportedText(normalized.location),
    website: sanitizeImportedUrl(normalized.website),
    summary: normalizeImportedText(normalized.summary),
    experienceTitle: normalizeImportedText(normalized.experienceTitle),
    company: normalizeImportedText(normalized.company),
    experienceDate: normalizeImportedText(normalized.experienceDate),
    experience: normalizeImportedText(normalized.experience),
    education: normalizeImportedText(normalized.education),
    experiences: (normalized.experiences ?? []).map((item, index) =>
      canonicalExperience(item, index),
    ),
    educations: (normalized.educations ?? []).map((item, index) =>
      canonicalQualification(item, index),
    ),
    projects: (normalized.projects ?? []).map((item, index) =>
      canonicalProject(item, index),
    ),
    skills: normalizeImportedText(normalized.skills),
    languages: normalizeImportedText(normalized.languages),
  };
}

export function normalizeDataRecordForStorage(
  collection: DataCollection,
  value: unknown,
): DataRecord {
  const record = baseRecordSchema.parse(value) as DataRecord;
  if (collection === "resumes") {
    const source = normalizeImportedText(record.source);
    return {
      ...record,
      name: normalizeImportedText(record.name),
      templateId: normalizeImportedText(record.templateId),
      colorId: normalizeImportedText(record.colorId),
      source: source === "tailored" ? "tailored" : "user",
      targetJobId: normalizeImportedText(record.targetJobId),
      targetJobTitle: normalizeImportedText(record.targetJobTitle),
      targetCompany: normalizeImportedText(record.targetCompany),
      data: normalizeStoredResumeData(record.data),
    };
  }
  if (collection === "jobs") {
    const { sourceUrl: rawSourceUrl, logoUrl: rawLogoUrl, ...safeRecord } =
      record;
    const sourceUrl = sanitizeImportedUrl(rawSourceUrl);
    const logoUrl = sanitizeRemoteImageSource(rawLogoUrl);
    return {
      ...safeRecord,
      ...(sourceUrl ? { sourceUrl } : {}),
      ...(logoUrl ? { logoUrl } : {}),
    };
  }
  if (collection === "knowledgeProfiles") {
    const normalized = normalizeResumeImportPayload(record);
    return {
      ...record,
      resumeData: normalizeStoredResumeData(record.resumeData),
      experiences: normalized.experiences.map((item, index) =>
        canonicalExperience(item, index),
      ),
      qualifications: normalized.qualifications.map((item, index) =>
        canonicalQualification(item, index),
      ),
      projects: normalized.projects.map((item, index) =>
        canonicalProject(item, index),
      ),
      skills: normalizeImportedText(normalized.skills),
      languages: normalizeImportedText(normalized.languages),
      languageItems: normalized.languageItems.map((item, index) =>
        canonicalLanguage(item, index),
      ),
      careerGoals: normalizeImportedText(normalized.careerGoals),
      preferredRoles: normalizeImportedText(normalized.preferredRoles),
      preferredIndustries: normalizeImportedText(
        normalized.preferredIndustries,
      ),
      workPreferences: normalizeImportedText(normalized.workPreferences),
      interviewContext: normalizeImportedText(normalized.interviewContext),
      interviewChallenges: normalizeImportedText(
        normalized.interviewChallenges,
      ),
      certifications: normalizeImportedText(record.certifications),
      sampleProjectsSeeded: normalizeImportedBoolean(
        record.sampleProjectsSeeded,
      ),
    };
  }
  return record;
}
