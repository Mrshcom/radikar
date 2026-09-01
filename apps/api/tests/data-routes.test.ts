import assert from "node:assert/strict";
import test from "node:test";
import type { DataCollection, DataRecord } from "@radicar/shared-types";
import { buildApp } from "../src/app";
import type { RecordRepository } from "../src/modules/data/record-repository";
import type { AuthServicePort } from "../src/modules/auth/routes";
import type { AuthUser, SessionIdentity } from "../src/modules/auth/types";
import {
  applyEmbeddedLinkFallbacks,
  applyTextFallbacks,
  buildResumeImportPrompt,
  extractContactFallbacks,
  extractExperienceHeadingFallbacks,
  extractSummaryFallback,
  normalizeEmbeddedLinks,
} from "../src/modules/imports/knowledge-import";
import { extractCompanyLogoUrl } from "../src/modules/imports/job-import";

class MemoryRecordRepository implements RecordRepository {
  private readonly records = new Map<string, DataRecord>();

  private key(ownerUserId: string, collection: DataCollection, id: string) {
    return `${ownerUserId}:${collection}:${id}`;
  }

  async list(ownerUserId: string, collection: DataCollection) {
    return [...this.records.entries()]
      .filter(([key]) => key.startsWith(`${ownerUserId}:${collection}:`))
      .map(([, record]) => record);
  }

  async get(ownerUserId: string, collection: DataCollection, id: string) {
    return this.records.get(this.key(ownerUserId, collection, id)) ?? null;
  }

  async put(ownerUserId: string, collection: DataCollection, record: DataRecord) {
    this.records.set(this.key(ownerUserId, collection, record.id), record);
    return record;
  }

  async remove(ownerUserId: string, collection: DataCollection, id: string) {
    this.records.delete(this.key(ownerUserId, collection, id));
  }

  async clear(ownerUserId: string, collection: DataCollection) {
    for (const key of this.records.keys()) {
      if (key.startsWith(`${ownerUserId}:${collection}:`)) this.records.delete(key);
    }
  }
}

const testUser: AuthUser = {
  id: "11111111-1111-4111-8111-111111111111",
  phone: "09120000000",
  fullName: "کاربر تست",
  role: "superadmin",
  status: "active",
  tablePageSize: 20,
  createdAt: "2026-08-27T10:00:00.000Z",
  lastLoginAt: "2026-08-27T10:00:00.000Z",
};
const testIdentity: SessionIdentity = { user: testUser, sessionId: "session-test" };
const otherIdentity: SessionIdentity = {
  user: { ...testUser, id: "33333333-3333-4333-8333-333333333333", phone: "09121111111", role: "user" },
  sessionId: "session-other",
};
const secondUserIdentity: SessionIdentity = {
  user: { ...testUser, id: "55555555-5555-4555-8555-555555555555", phone: "09123333333", role: "user" },
  sessionId: "session-second-user",
};
const adminIdentity: SessionIdentity = {
  user: { ...testUser, id: "44444444-4444-4444-8444-444444444444", phone: "09122222222", role: "admin" },
  sessionId: "session-admin",
};

const authService: AuthServicePort = {
  requestOtp: async () => ({ challengeId: "22222222-2222-4222-8222-222222222222", expiresInSeconds: 180 }),
  verifyOtp: async () => ({ user: testUser, sessionToken: "test-token", sessionExpiresAt: new Date("2026-09-27") }),
  resolveSession: async (token) =>
    token === "test-token"
      ? testIdentity
      : token === "other-token"
        ? otherIdentity
        : token === "second-user-token"
          ? secondUserIdentity
        : token === "admin-token"
          ? adminIdentity
          : null,
  revokeSession: async () => undefined,
  getStats: async () => ({
    users: { total: 1, active: 1, registeredToday: 1, activeToday: 1 },
    records: { total: 0, resumes: 0, resumesToday: 0, byCollection: [] },
    usersByRole: [{ role: "superadmin", total: 1 }],
  }),
  getRecentEvents: async () => ({ items: [] }),
  listUsers: async () => ({ items: [], total: 0, page: 1, pageSize: 20 }),
  listAllRecords: async () => ({ items: [], total: 0, page: 1, pageSize: 20 }),
  getUserDetails: async () => ({ ...testUser, records: [] }),
  updateUser: async () => testUser,
  updateProfile: async () => testUser,
  updatePreferences: async (_userId, input) => ({ ...testUser, ...input }),
};

function createTestApp(authServiceOverride: AuthServicePort = authService) {
  return buildApp({
    repository: new MemoryRecordRepository(),
    readinessCheck: async () => undefined,
    corsOrigins: ["http://localhost:3161"],
    logger: false,
    authService: authServiceOverride,
    sessionCookieName: "radicar_session",
    secureCookies: false,
    sessionTtlDays: 30,
  });
}

test("normalizes Persian and Arabic digits before route validation", async () => {
  let receivedPhone = "";
  let receivedCode = "";
  const app = createTestApp({
    ...authService,
    requestOtp: async (phone) => {
      receivedPhone = phone;
      return { challengeId: "22222222-2222-4222-8222-222222222222", expiresInSeconds: 180 };
    },
    verifyOtp: async (_phone, _challengeId, code) => {
      receivedCode = code;
      return { user: testUser, sessionToken: "test-token", sessionExpiresAt: new Date("2026-09-27") };
    },
  });

  const requested = await app.inject({
    method: "POST",
    url: "/api/auth/request-otp",
    payload: { phone: "۰۹۱۲۳۴۵۶۷۸۹" },
  });
  assert.equal(requested.statusCode, 201);
  assert.equal(receivedPhone, "09123456789");

  const verified = await app.inject({
    method: "POST",
    url: "/api/auth/verify-otp",
    payload: {
      phone: "٠٩١٢٣٤٥٦٧٨٩",
      challengeId: "22222222-2222-4222-8222-222222222222",
      code: "١٢٣٤٥٦",
    },
  });
  assert.equal(verified.statusCode, 200);
  assert.equal(receivedCode, "123456");
  await app.close();
});

test("persists the authenticated user's table page-size preference", async () => {
  let savedPageSize: AuthUser["tablePageSize"] | null = null;
  const app = createTestApp({
    ...authService,
    updatePreferences: async (_userId, input) => {
      savedPageSize = input.tablePageSize;
      return { ...testUser, tablePageSize: input.tablePageSize };
    },
  });

  const response = await app.inject({
    method: "PATCH",
    url: "/api/account/preferences",
    payload: { tablePageSize: 100 },
    cookies: { radicar_session: "test-token" },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(savedPageSize, 100);
  assert.equal(response.json().user.tablePageSize, 100);
  await app.close();
});

test("stores, reads and removes a data record", async () => {
  const app = createTestApp();
  const record = {
    id: "job-1",
    profileId: "profile-default",
    role: "Frontend Engineer",
    createdAt: "2026-08-27T10:00:00.000Z",
    updatedAt: "2026-08-27T10:00:00.000Z",
  };

  const saved = await app.inject({
    method: "PUT",
    url: "/v1/data/jobs/job-1",
    payload: record,
    cookies: { radicar_session: "other-token" },
  });
  assert.equal(saved.statusCode, 200);
  assert.deepEqual(saved.json(), record);

  const listed = await app.inject({ method: "GET", url: "/v1/data/jobs", cookies: { radicar_session: "other-token" } });
  assert.deepEqual(listed.json(), [record]);

  const removed = await app.inject({
    method: "DELETE",
    url: "/v1/data/jobs/job-1",
    cookies: { radicar_session: "other-token" },
  });
  assert.equal(removed.statusCode, 204);
  await app.close();
});

test("canonicalizes imported knowledge before it reaches storage", async () => {
  const app = createTestApp();
  const record = {
    id: "profile-mixed-input",
    profileId: "profile-mixed-input",
    resumeData: {
      fullName: ["سارا", "احمدی"],
      website: "",
      summary: { text: "توسعه‌دهنده محصول" },
    },
    experiences: {
      position: "مهندس نرم‌افزار",
      employer: "شرکت نمونه",
      stack: ["React", "TypeScript"],
    },
    qualifications: "کارشناسی نرم‌افزار",
    projects: JSON.stringify({
      items: { title: "سامانه نمونه", technologies: ["Next.js", "Zod"] },
    }),
    skills: { value: "React" },
    languageItems: "فارسی",
    createdAt: "2026-08-27T10:00:00.000Z",
    updatedAt: "2026-08-27T10:00:00.000Z",
  };

  const saved = await app.inject({
    method: "PUT",
    url: "/v1/data/knowledgeProfiles/profile-mixed-input",
    payload: record,
    cookies: { radicar_session: "other-token" },
  });
  assert.equal(saved.statusCode, 200);
  const payload = saved.json();
  assert.equal(payload.resumeData.fullName, "سارا، احمدی");
  assert.equal(payload.resumeData.website, "");
  assert.equal(payload.experiences[0].jobTitle, "مهندس نرم‌افزار");
  assert.equal(payload.experiences[0].technologies, "React، TypeScript");
  assert.equal(payload.qualifications[0].credential, "کارشناسی نرم‌افزار");
  assert.equal(payload.projects[0].name, "سامانه نمونه");
  assert.equal(payload.projects[0].technologies, "Next.js، Zod");
  assert.equal(payload.languageItems[0].name, "فارسی");

  const listed = await app.inject({
    method: "GET",
    url: "/v1/data/knowledgeProfiles",
    cookies: { radicar_session: "other-token" },
  });
  assert.deepEqual(listed.json(), [payload]);
  await app.close();
});

test("canonicalizes malformed resume records before storage", async () => {
  const app = createTestApp();
  const saved = await app.inject({
    method: "PUT",
    url: "/v1/data/resumes/resume-mixed-input",
    payload: {
      id: "resume-mixed-input",
      profileId: "profile-default",
      name: { text: "رزومه تست" },
      templateId: ["simple-one-column"],
      source: 42,
      data: JSON.stringify({
        name: "سارا احمدی",
        title: "مهندس نرم‌افزار",
        website: "javascript:alert(1)",
        workExperience: {
          role: "توسعه‌دهنده",
          dateRange: "2020 تا اکنون",
          technologies: ["React", "Node.js"],
        },
        project: { title: "محصول نمونه", stack: "Next.js" },
      }),
      createdAt: "2026-08-27T10:00:00.000Z",
      updatedAt: "2026-08-27T10:00:00.000Z",
    },
    cookies: { radicar_session: "other-token" },
  });

  assert.equal(saved.statusCode, 200);
  const payload = saved.json();
  assert.equal(payload.name, "رزومه تست");
  assert.equal(payload.templateId, "simple-one-column");
  assert.equal(payload.source, "user");
  assert.equal(payload.data.fullName, "سارا احمدی");
  assert.equal(payload.data.jobTitle, "مهندس نرم‌افزار");
  assert.equal(payload.data.website, "");
  assert.equal(payload.data.experiences[0].jobTitle, "توسعه‌دهنده");
  assert.equal(payload.data.experiences[0].startDate, "2020");
  assert.equal(payload.data.experiences[0].isCurrent, true);
  assert.equal(payload.data.projects[0].technologies, "Next.js");
  await app.close();
});

test("rejects unknown collections and mismatched ids", async () => {
  const app = createTestApp();
  const unknown = await app.inject({ method: "GET", url: "/v1/data/unknown", cookies: { radicar_session: "other-token" } });
  assert.equal(unknown.statusCode, 400);

  const mismatch = await app.inject({
    method: "PUT",
    url: "/v1/data/jobs/job-1",
    payload: {
      id: "job-2",
      createdAt: "2026-08-27T10:00:00.000Z",
      updatedAt: "2026-08-27T10:00:00.000Z",
    },
    cookies: { radicar_session: "other-token" },
  });
  assert.equal(mismatch.statusCode, 400);
  await app.close();
});

test("requires a session and isolates records by authenticated owner", async () => {
  const app = createTestApp();
  const unauthorized = await app.inject({ method: "GET", url: "/v1/data/jobs" });
  assert.equal(unauthorized.statusCode, 401);

  const record = {
    id: "private-job",
    createdAt: "2026-08-27T10:00:00.000Z",
    updatedAt: "2026-08-27T10:00:00.000Z",
  };
  await app.inject({
    method: "PUT",
    url: "/v1/data/jobs/private-job",
    payload: record,
    cookies: { radicar_session: "other-token" },
  });
  const otherUsersRecords = await app.inject({
    method: "GET",
    url: "/v1/data/jobs",
    cookies: { radicar_session: "second-user-token" },
  });
  assert.deepEqual(otherUsersRecords.json(), []);
  await app.close();
});

test("logout is idempotent and clears an expired or missing session cookie", async () => {
  const app = createTestApp();
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/logout",
  });

  assert.equal(response.statusCode, 204);
  const setCookie = response.headers["set-cookie"];
  const cookieHeader = Array.isArray(setCookie) ? setCookie.join("; ") : setCookie || "";
  assert.match(cookieHeader, /radicar_session=;/);
  assert.match(cookieHeader, /Max-Age=0/);
  await app.close();
});

test("allows only superadmins to access system reports", async () => {
  const app = createTestApp();
  const admin = await app.inject({
    method: "GET",
    url: "/api/admin/stats",
    cookies: { radicar_session: "admin-token" },
  });
  const superadmin = await app.inject({
    method: "GET",
    url: "/api/admin/stats",
    cookies: { radicar_session: "test-token" },
  });
  assert.equal(admin.statusCode, 403);
  assert.equal(superadmin.statusCode, 200);
  const events = await app.inject({
    method: "GET",
    url: "/api/admin/events?limit=20",
    cookies: { radicar_session: "test-token" },
  });
  assert.equal(events.statusCode, 200);
  await app.close();
});

test("management roles cannot use customer-owned workspace data", async () => {
  const app = createTestApp();
  for (const token of ["admin-token", "test-token"]) {
    const response = await app.inject({
      method: "GET",
      url: "/v1/data/resumes",
      cookies: { radicar_session: token },
    });
    assert.equal(response.statusCode, 403);
  }
  await app.close();
});

test("rejects state-changing browser requests from untrusted origins", async () => {
  const app = createTestApp();
  const response = await app.inject({
    method: "PUT",
    url: "/v1/data/jobs/csrf-attempt",
    headers: { origin: "https://attacker.example" },
    cookies: { radicar_session: "test-token" },
    payload: {
      id: "csrf-attempt",
      createdAt: "2026-08-27T10:00:00.000Z",
      updatedAt: "2026-08-27T10:00:00.000Z",
    },
  });
  assert.equal(response.statusCode, 403);
  await app.close();
});

test("reports liveness and readiness", async () => {
  const app = createTestApp();
  const health = await app.inject({ method: "GET", url: "/health" });
  const ready = await app.inject({ method: "GET", url: "/ready" });
  assert.equal(health.statusCode, 200);
  assert.equal(ready.statusCode, 200);
  await app.close();
});

test("registers AI routes with validation before model execution", async () => {
  const app = createTestApp();
  const analysis = await app.inject({
    method: "POST",
    url: "/api/match/analyze",
    payload: { jobDescription: "کوتاه", resume: {} },
    cookies: { radicar_session: "test-token" },
  });
  const feedback = await app.inject({
    method: "POST",
    url: "/api/interview/feedback",
    payload: { question: "خودت را معرفی کن", answer: "" },
    cookies: { radicar_session: "test-token" },
  });
  assert.equal(analysis.statusCode, 422);
  assert.equal(feedback.statusCode, 400);
  await app.close();
});

test("job import rejects local targets before performing a fetch", async () => {
  const app = createTestApp();
  const response = await app.inject({
    method: "POST",
    url: "/api/job-import",
    payload: { url: "http://127.0.0.1/private" },
    cookies: { radicar_session: "test-token" },
  });
  assert.equal(response.statusCode, 400);
  await app.close();
});

test("extracts a safe company logo from structured and LinkedIn job markup", () => {
  const pageUrl = new URL("https://www.linkedin.com/jobs/view/123456/");
  assert.equal(
    extractCompanyLogoUrl(
      `<script type="application/ld+json">{"@type":"JobPosting","hiringOrganization":{"@type":"Organization","logo":{"url":"https://cdn.example.com/company.png"}}}</script>`,
      pageUrl,
    ),
    "https://cdn.example.com/company.png",
  );
  assert.equal(
    extractCompanyLogoUrl(
      `<img class="artdeco-entity-image" data-delayed-url="https://media.licdn.com/dms/image/logo.png?x=1&amp;y=2">`,
      pageUrl,
    ),
    "https://media.licdn.com/dms/image/logo.png?x=1&y=2",
  );
  assert.equal(
    extractCompanyLogoUrl(
      `<meta property="og:image" content="http://127.0.0.1/private.png">`,
      pageUrl,
    ),
    "",
  );
});

test("knowledge import requires a multipart resume file", async () => {
  const app = createTestApp();
  const response = await app.inject({
    method: "POST",
    url: "/api/knowledge/import",
    cookies: { radicar_session: "test-token" },
  });
  assert.equal(response.statusCode, 400);
  await app.close();
});

test("sanitizes heterogeneous PDF annotation links", () => {
  assert.deepEqual(
    normalizeEmbeddedLinks([
      "https://www.linkedin.com/in/m…",
      "https://www.linkedin.com/in/m%E2%80%A6",
      " https://www.linkedin.com/in/example-user ",
      "https://www.linkedin.com/in/example-user",
      "javascript:alert(1)",
      "data:text/html,unsafe",
      { url: "https://linkedin.com/in/not-a-string" },
      null,
      42,
    ]),
    ["https://www.linkedin.com/in/example-user"],
  );
  assert.deepEqual(normalizeEmbeddedLinks("https://linkedin.com/in/example"), []);
});

test("uses an embedded LinkedIn URL when the imported website is empty", () => {
  const payload = {
    resumeData: {},
    experiences: [],
    qualifications: [],
    projects: [],
    languageItems: [],
  };
  const withLinkedIn = applyEmbeddedLinkFallbacks(payload, [
    "https://www.linkedin.com/in/m%E2%80%A6",
    "https://example.com",
    "https://www.linkedin.com/in/mampel88/",
  ]);
  assert.equal(
    withLinkedIn.resumeData.website,
    "https://www.linkedin.com/in/mampel88/",
  );

  const replacesGeneratedPlaceholder = applyEmbeddedLinkFallbacks(
    { ...payload, resumeData: { website: "https://linkedinprofile/" } },
    ["https://www.linkedin.com/in/example-user"],
  );
  assert.equal(
    replacesGeneratedPlaceholder.resumeData.website,
    "https://www.linkedin.com/in/example-user",
  );

  const existingWebsite = applyEmbeddedLinkFallbacks(
    { ...payload, resumeData: { website: "https://portfolio.example/" } },
    ["https://linkedin.com/in/example-user"],
  );
  assert.equal(existingWebsite.resumeData.website, "https://portfolio.example/");
});

test("recovers deterministic contact, summary and experience headings from PDF text", () => {
  const text = `Professional Experience
Frontend Chapter Lead
Dotin · Iran
12/2023 – Present
Contact
Information
+98 9158135580
mrshcom@gmail.com
Mashhad, Razavi Khorasan, Iran
LinkedIn Profile
About Me
Complete professional summary from the source resume.
MR
MOHAMMAD REZA SHARIATZADEH`;
  assert.deepEqual(extractContactFallbacks(text), {
    email: "mrshcom@gmail.com",
    phone: "+98 9158135580",
    location: "Mashhad, Razavi Khorasan, Iran",
  });
  assert.equal(
    extractSummaryFallback(text),
    "Complete professional summary from the source resume.",
  );
  assert.deepEqual(extractExperienceHeadingFallbacks(text), [
    {
      jobTitle: "Frontend Chapter Lead",
      company: "Dotin",
      location: "Iran",
      startDate: "12/2023",
      endDate: "",
      isCurrent: true,
    },
  ]);

  const normalized = applyTextFallbacks(
    {
      resumeData: {},
      experiences: [{ jobTitle: "Frontend Chapter Lead" }],
      qualifications: [],
      projects: [],
      languageItems: [],
    },
    text,
  );
  assert.equal(normalized.resumeData.email, "mrshcom@gmail.com");
  assert.equal(normalized.resumeData.phone, "+98 9158135580");
  assert.equal(normalized.resumeData.location, "Mashhad, Razavi Khorasan, Iran");
  assert.equal(
    normalized.resumeData.summary,
    "Complete professional summary from the source resume.",
  );
  assert.equal(normalized.experiences[0].company, "Dotin");
  assert.equal(normalized.experiences[0].location, "Iran");
});

test("knowledge import prompt requires complete source-language fields", () => {
  const prompt = buildResumeImportPrompt("SOURCE RESUME");
  for (const field of [
    '"email"',
    '"phone"',
    '"location"',
    '"summary"',
    '"company"',
    '"technologies"',
    '"languageItems"',
    '"projectTitle"',
  ])
    assert.match(prompt, new RegExp(field));
  assert.doesNotMatch(prompt, /"name"\s*:/);
  assert.match(prompt, /بدون ترجمه/);
  assert.match(prompt, /SOURCE RESUME/);
});
