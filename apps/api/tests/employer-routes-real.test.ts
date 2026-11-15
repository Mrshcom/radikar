import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import test from "node:test";
import { promisify } from "node:util";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { and, eq } from "drizzle-orm";
import {
  createDatabase,
  employerCandidates,
  employerInvitationHistory,
  employerPositions,
  employerResumeBank,
  userNotifications,
} from "@radikar/database";
import postgres from "postgres";
import { cleanResumeText, contactOf, registerEmployerRoutes, specialtyOf } from "../src/modules/employer/routes";
import { InterviewAgentClient } from "../src/modules/ai/interview-agent";
import { RadicoinService } from "../src/modules/radicoin/service";
import { registerNotificationRoutes } from "../src/modules/notifications/routes";

const execFileAsync = promisify(execFile);
const root = new URL("../../../", import.meta.url).pathname;
const adminUrl = "postgresql://radikar:radikar@127.0.0.1:5433/postgres";

test("contact extraction accepts Persian and spaced Iranian phone numbers", () => {
  assert.equal(contactOf("تماس: ۰۹۱۵ ۸۱۳ ۵۵۸۰").phone, "09158135580");
  assert.equal(contactOf("Phone: +98-915-813-5580").phone, "09158135580");
  assert.equal(contactOf("ایمیل: person@example.com").email, "person@example.com");
});

test("resume specialty extraction finds English and Persian professional titles", () => {
  assert.equal(specialtyOf("Ali Akbari\nSenior Java Developer\nExperience"), "Senior Java Developer");
  assert.equal(specialtyOf("مریم رضایی\nکارشناس فروش\nسوابق کاری"), "کارشناس فروش");
  assert.equal(specialtyOf("مریم رضایی\nمدیر پروژه\nسوابق کاری"), "مدیر پروژه");
  assert.equal(specialtyOf("Junior Backend\nExperience"), "Junior Backend");
  assert.equal(specialtyOf("Senior Java\nExperience"), "Senior Java");
  assert.equal(specialtyOf("React JS . CSS . HTML"), null);
  assert.equal(
    specialtyOf("junior Backend یا کارآموزی فرصت دنبال افزاری.به نرم های پروژه سازی ایده و ماشین یادگیری"),
    null,
  );
});

test("resume text removes PDF NUL characters before persistence", () => {
  assert.equal(cleanResumeText("  مدیر\u0000 پروژه\u0000  "), "مدیر پروژه");
});

test(
  "employer screening charges for file classification and releases expired interview reservations",
  { timeout: 60_000 },
  async () => {
    const name = `radikar_employer_test_${randomUUID().replaceAll("-", "")}`;
    const url = `postgresql://radikar:radikar@127.0.0.1:5433/${name}`;
    const admin = postgres(adminUrl, { max: 1 });
    let connection: ReturnType<typeof createDatabase> | undefined;
    const app = Fastify();
    try {
      await admin.unsafe(`CREATE DATABASE ${name}`);
      const env = { ...process.env, DATABASE_URL: url };
      await execFileAsync("node", ["--import", "tsx", "packages/database/src/migrate.ts"], { cwd: root, env });
      await execFileAsync("node", ["--import", "tsx", "packages/database/src/seed.ts"], { cwd: root, env });
      connection = createDatabase(url, 2);
      const db = connection.db;
      const owner = randomUUID();
      const actor = randomUUID();
      const sql = postgres(url, { max: 1 });
      try {
        await sql`insert into users (id, phone, role, account_type, status, created_at, updated_at, table_page_size) values (${owner}, '09120000401', 'user', 'employer', 'active', now(), now(), 20), (${actor}, '09120000402', 'user', 'candidate', 'active', now(), now(), 20)`;
        const radicoin = new RadicoinService(db);
        await radicoin.adjust(owner, 200, "اعتبار تست کارفرما", actor, "employer-test-fund");
        await app.register(multipart);
        app.addHook("onRequest", async (request) => {
          const candidateRequest = request.headers["x-test-account-type"] === "candidate";
          request.auth = {
            user: {
              id: candidateRequest ? actor : owner,
              phone: candidateRequest ? "09120000402" : "09120000401",
              role: "user",
              accountType: candidateRequest ? "candidate" : "employer",
            },
            sessionId: "employer-test",
          } as NonNullable<typeof request.auth>;
        });
        let reportShouldFail = false;
        let reportCalls = 0;
        let turnCalls = 0;
        let clarificationCalls = 0;
        let rankerCalls = 0;
        let rankerPrompt = "";
        const candidateChatUuid = randomUUID();
        const interviewerBodies: Array<Record<string, string>> = [];
        const interviewAgent = new InterviewAgentClient({
          baseUrl: "https://agent.test",
          apiKey: "test-key",
          interviewerAgent: "interviewer",
          resumeRankerAgent: "resume-ranker",
          timeoutMs: 1_000,
          fetcher: async (url, init) => {
            if (String(url).includes("/resume-ranker/chat")) {
              rankerCalls += 1;
              rankerPrompt = String(init?.body);
              return new Response(
                JSON.stringify({
                  success: true,
                  data: {
                    uuid: randomUUID(),
                    status: "completed",
                    reply: JSON.stringify({
                      name: "نامزد جاوا",
                      score: 82,
                      matched: ["Java"],
                      missing: [],
                      unknown: ["سابقهٔ تیمی"],
                      summary: "تجربهٔ جاوا با شغل مرتبط است.",
                    }),
                  },
                }),
                { status: 200, headers: { "Content-Type": "application/json" } },
              );
            }
            if (init?.method === "GET")
              return new Response(
                JSON.stringify({
                  success: true,
                  data: { uuid: candidateChatUuid, status: "completed", reply: "previous" },
                }),
              );
            interviewerBodies.push(JSON.parse(String(init?.body)));
            const prompt = JSON.parse(String(init?.body)).message as string;
            if (prompt.includes('ساختار: {"reply":string}')) {
              clarificationCalls += 1;
              return new Response(
                JSON.stringify({
                  success: true,
                  data: {
                    uuid: candidateChatUuid,
                    status: "completed",
                    reply: JSON.stringify({ reply: "منظورم یک مثال واقعی از همکاری تیمی خودت است." }),
                  },
                }),
                { status: 200, headers: { "Content-Type": "application/json" } },
              );
            }
            if (prompt.includes('"reply":string,"question":string')) {
              turnCalls += 1;
              return new Response(
                JSON.stringify({
                  success: true,
                  data: {
                    uuid: candidateChatUuid,
                    status: "completed",
                    reply: JSON.stringify({
                      reply: "گفتی روی همکاری تیمی کار کردی؛ دربارهٔ نقش خودت کنجکاوم.",
                      question: "در همان همکاری، یک اختلاف نظر را چگونه حل کردی؟",
                    }),
                  },
                }),
                { status: 200, headers: { "Content-Type": "application/json" } },
              );
            }
            reportCalls += 1;
            const questionCount = prompt.match(/"question":/g)?.length ?? 5;
            const report = {
              summary: "پاسخ‌های نامزد با معیارهای شغل بررسی شد.",
              strengths: ["توضیح روشن تجربه"],
              improvements: ["ارائهٔ مثال‌های دقیق‌تر"],
              questions: Array.from({ length: questionCount }, (_, questionIndex) => ({
                questionIndex,
                score: 80,
                feedback: "پاسخ مرتبط بود.",
                strengths: ["ارتباط با سؤال"],
                issues: ["جزئیات کم"],
                suggestedAnswer: "با یک مثال مشخص پاسخ کامل‌تری ارائه کنید.",
              })),
            };
            return new Response(
              JSON.stringify({
                success: true,
                data: {
                  uuid: candidateChatUuid,
                  status: reportShouldFail ? "failed" : "completed",
                  reply: reportShouldFail ? null : JSON.stringify(report),
                  error: reportShouldFail ? "agent unavailable" : null,
                },
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          },
        });
        const invitationDeliveries: Array<{ phone: string; token: string }> = [];
        registerEmployerRoutes(app, db, radicoin, "http://web.test", interviewAgent, async (payload) => {
          invitationDeliveries.push(payload);
        });
        registerNotificationRoutes(app, db);
        await app.ready();
        const candidateCannotCreateProfile = await app.inject({
          method: "POST",
          url: "/api/employer/profile",
          payload: { companyName: "شرکت کارجو" },
          headers: { "x-test-account-type": "candidate" },
        });
        assert.equal(candidateCannotCreateProfile.statusCode, 403);
        const positionInput = {
          title: "مهندس نرم‌افزار",
          description:
            "توسعه و نگهداری سامانه با دانش جاوااسکریپت و تجربهٔ همکاری تیمی، تحلیل نیازمندی‌ها و مستندسازی دقیق فرایندها برای تیم محصول.",
        };
        const beforeSetup = await app.inject({
          method: "POST",
          url: "/api/employer/positions",
          payload: positionInput,
        });
        assert.equal(beforeSetup.statusCode, 403);
        const setup = await app.inject({
          method: "POST",
          url: "/api/employer/profile",
          payload: { companyName: "شرکت نمونه" },
        });
        assert.equal(setup.statusCode, 201);
        const updatedProfile = await app.inject({
          method: "PATCH",
          url: "/api/employer/profile",
          payload: { companyName: "شرکت نمونه ویرایش‌شده" },
        });
        assert.equal(updatedProfile.statusCode, 200);
        assert.equal(updatedProfile.json().profile.companyName, "شرکت نمونه ویرایش‌شده");
        const restoreProfile = await app.inject({
          method: "PATCH",
          url: "/api/employer/profile",
          payload: { companyName: "شرکت نمونه" },
        });
        assert.equal(restoreProfile.statusCode, 200);
        const positionResponse = await app.inject({
          method: "POST",
          url: "/api/employer/positions",
          payload: { ...positionInput, companyName: "نام شرکت جعلی" },
        });
        assert.equal(positionResponse.statusCode, 201);
        assert.equal(positionResponse.json().companyName, "شرکت نمونه");
        const positionId = positionResponse.json().id as string;
        const initialActivityStats = await app.inject({ method: "GET", url: "/api/employer/activity-stats" });
        assert.equal(initialActivityStats.statusCode, 200);
        assert.deepEqual(initialActivityStats.json(), {
          positions: 1,
          activePositions: 1,
          hiredPositions: 0,
          candidates: 0,
          screenedCandidates: 0,
          interviewInvitations: 0,
          radicoinBalance: 200,
        });
        const editedInput = { ...positionInput, title: "مهندس ارشد نرم‌افزار" };
        const candidateCannotEdit = await app.inject({
          method: "PATCH",
          url: `/api/employer/positions/${positionId}`,
          payload: editedInput,
          headers: { "x-test-account-type": "candidate" },
        });
        assert.equal(candidateCannotEdit.statusCode, 403);
        const edited = await app.inject({
          method: "PATCH",
          url: `/api/employer/positions/${positionId}`,
          payload: editedInput,
        });
        assert.equal(edited.statusCode, 200);
        assert.equal(edited.json().title, editedInput.title);
        assert.equal(edited.json().companyName, "شرکت نمونه");
        const firstId = randomUUID();
        const secondId = randomUUID();
        const now = new Date();
        await db.insert(employerCandidates).values([
          {
            id: firstId,
            positionId,
            fileName: "first.pdf",
            fileHash: "same",
            extractionError: "متن کافی ندارد",
            createdAt: now,
            updatedAt: now,
          },
          {
            id: secondId,
            positionId,
            fileName: "copy.pdf",
            fileHash: "same",
            extractionError: "متن کافی ندارد",
            createdAt: new Date(now.getTime() + 1),
            updatedAt: now,
          },
        ]);
        const disposableId = randomUUID();
        const bulkDisposableId = randomUUID();
        await db.insert(employerCandidates).values({
          id: disposableId,
          positionId,
          fileName: "mistake.pdf",
          fileHash: "disposable",
          fileData: Buffer.from("%PDF-1.4\npreview"),
          resumeText: "متن آزمایشی رزومه",
          createdAt: now,
          updatedAt: now,
        });
        await db.insert(employerCandidates).values({
          id: bulkDisposableId,
          positionId,
          fileName: "bulk-mistake.pdf",
          fileHash: "bulk-disposable",
          createdAt: now,
          updatedAt: now,
        });
        const preview = await app.inject({
          method: "GET",
          url: `/api/employer/positions/${positionId}/resumes/${disposableId}`,
        });
        assert.equal(preview.statusCode, 200);
        assert.equal(preview.json().resumeText, "متن آزمایشی رزومه");
        const originalFile = await app.inject({
          method: "GET",
          url: `/api/employer/positions/${positionId}/resumes/${disposableId}/file`,
        });
        assert.equal(originalFile.statusCode, 200);
        assert.match(originalFile.headers["content-type"] as string, /application\/pdf/);
        assert.equal(originalFile.rawPayload.toString(), "%PDF-1.4\npreview");
        assert.equal(
          (
            await app.inject({
              method: "GET",
              url: `/api/employer/positions/${positionId}/resumes/${disposableId}/file`,
              headers: { "x-test-account-type": "candidate" },
            })
          ).statusCode,
          403,
        );
        assert.equal(
          (await app.inject({ method: "GET", url: `/api/employer/positions/${positionId}` })).json().candidates[2]
            .resumeText,
          undefined,
        );
        assert.equal(
          (await app.inject({ method: "GET", url: `/api/employer/positions/${positionId}` })).json().candidates[2]
            .fileData,
          undefined,
        );
        assert.equal(
          (
            await app.inject({
              method: "DELETE",
              url: `/api/employer/positions/${positionId}/resumes/${disposableId}`,
              headers: { "x-test-account-type": "candidate" },
            })
          ).statusCode,
          403,
        );
        const bulkDelete = await app.inject({
          method: "DELETE",
          url: `/api/employer/positions/${positionId}/resumes`,
          payload: { candidateIds: [disposableId, bulkDisposableId] },
        });
        assert.equal(bulkDelete.statusCode, 200);
        assert.equal(bulkDelete.json().count, 2);
        assert.equal(
          (await app.inject({ method: "GET", url: `/api/employer/positions/${positionId}/resumes/${disposableId}` }))
            .statusCode,
          404,
        );
        assert.equal(
          (await app.inject({ method: "POST", url: `/api/employer/positions/${positionId}/screen` })).statusCode,
          200,
        );
        for (let step = 0; step < 3; step += 1)
          assert.equal(
            (await app.inject({ method: "POST", url: `/api/employer/positions/${positionId}/screen/next` })).statusCode,
            200,
          );
        const classified = (await app.inject({ method: "GET", url: `/api/employer/positions/${positionId}` })).json();
        assert.equal(classified.position.screeningStatus, "completed");
        assert.equal(
          (await app.inject({ method: "DELETE", url: `/api/employer/positions/${positionId}/resumes/${firstId}` }))
            .statusCode,
          409,
        );
        assert.equal(
          (await app.inject({ method: "PATCH", url: `/api/employer/positions/${positionId}`, payload: positionInput }))
            .statusCode,
          409,
        );
        assert.equal(
          (await app.inject({ method: "GET", url: `/api/employer/positions/${positionId}` })).json().position.title,
          editedInput.title,
        );
        assert.deepEqual(
          classified.candidates.map((candidate: { screeningStatus: string }) => candidate.screeningStatus),
          ["unreadable", "duplicate"],
        );
        assert.equal((await radicoin.getWallet(owner, 0)).wallet?.availableCoins, 186);
        await db
          .update(employerCandidates)
          .set({
            screeningStatus: "ready",
            email: "candidate@example.com",
            name: "نامزد نمونه",
            phone: "09120000402",
          })
          .where(eq(employerCandidates.id, firstId));
        await db
          .update(employerPositions)
          .set({
            interviewQuestions: Array.from(
              { length: 5 },
              (_, index) => `سؤال مشترک شماره ${index + 1} دربارهٔ مهارت‌ها چیست؟`,
            ),
          })
          .where(eq(employerPositions.id, positionId));
        const invite = await app.inject({
          method: "POST",
          url: `/api/employer/positions/${positionId}/invitations`,
          payload: {
            candidateIds: [firstId],
            deadline: new Date(Date.now() + 2 * 60 * 60_000).toISOString(),
          },
        });
        assert.equal(invite.statusCode, 201);
        assert.equal(invite.json().invitations.length, 1);
        assert.equal((await radicoin.getWallet(owner, 0)).wallet?.availableCoins, 102);
        const renewed = await app.inject({
          method: "POST",
          url: `/api/employer/positions/${positionId}/invitations/${firstId}/link`,
        });
        assert.equal(renewed.statusCode, 200);
        assert.notEqual(renewed.json().url, invite.json().invitations[0].url);
        const cancelledInvitations = await db
          .select()
          .from(employerInvitationHistory)
          .where(eq(employerInvitationHistory.candidateId, firstId));
        assert.equal(cancelledInvitations.length, 1);
        assert.equal(cancelledInvitations[0]?.status, "cancelled");
        assert.equal(cancelledInvitations[0]?.invitedUserId, actor);
        assert.notEqual(cancelledInvitations[0]?.tokenHash, "");
        const oldToken = String(invite.json().invitations[0].url).split("/").at(-1);
        const cancelledLink = await app.inject({
          method: "GET",
          url: `/api/employer/invitations/${oldToken}`,
          headers: { "x-test-account-type": "candidate" },
        });
        assert.equal(cancelledLink.statusCode, 410);
        assert.match(cancelledLink.json().error, /لغو شده/);
        const candidateInterviews = await app.inject({
          method: "GET",
          url: "/api/employer/interviews",
          headers: { "x-test-account-type": "candidate" },
        });
        assert.equal(candidateInterviews.statusCode, 200);
        assert.deepEqual(
          candidateInterviews.json().map((interview: { status: string }) => interview.status).sort(),
          ["cancelled", "invited"],
        );
        assert.equal((await radicoin.getWallet(owner, 0)).wallet?.availableCoins, 102);
        await db
          .update(employerCandidates)
          .set({ invitationDeadline: new Date(Date.now() - 1000) })
          .where(eq(employerCandidates.id, firstId));
        const expired = (await app.inject({ method: "GET", url: `/api/employer/positions/${positionId}` })).json();
        assert.equal(expired.candidates[0].invitationStatus, "expired");
        assert.equal((await radicoin.getWallet(owner, 0)).wallet?.availableCoins, 186);
        const expiredWithoutDeadline = await app.inject({
          method: "POST",
          url: `/api/employer/positions/${positionId}/invitations/${firstId}/link`,
        });
        assert.equal(expiredWithoutDeadline.statusCode, 422);
        assert.match(expiredWithoutDeadline.json().error, /مهلت تازه/);
        const resentExpired = await app.inject({
          method: "POST",
          url: `/api/employer/positions/${positionId}/invitations/${firstId}/link`,
          payload: { deadline: new Date(Date.now() + 2 * 60 * 60_000).toISOString() },
        });
        assert.equal(resentExpired.statusCode, 200);
        assert.equal(resentExpired.json().delivery, "in_app");
        assert.notEqual(resentExpired.json().url, renewed.json().url);
        assert.equal((await radicoin.getWallet(owner, 0)).wallet?.availableCoins, 102);
        await db
          .update(employerCandidates)
          .set({ invitationDeadline: new Date(Date.now() - 1000) })
          .where(eq(employerCandidates.id, firstId));
        const expiredAgain = (await app.inject({ method: "GET", url: `/api/employer/positions/${positionId}` })).json();
        assert.equal(expiredAgain.candidates[0].invitationStatus, "expired");
        assert.equal((await radicoin.getWallet(owner, 0)).wallet?.availableCoins, 186);
        const directPosition = await app.inject({
          method: "POST",
          url: "/api/employer/positions",
          payload: positionInput,
        });
        assert.equal(directPosition.statusCode, 201);
        const directPositionId = directPosition.json().id as string;
        const listedPositions = await app.inject({ method: "GET", url: "/api/employer/positions" });
        assert.equal(listedPositions.statusCode, 200);
        const createdAtValues = (listedPositions.json() as { createdAt: string }[]).map(
          (position) => position.createdAt,
        );
        assert.deepEqual(
          createdAtValues,
          [...createdAtValues].sort((a, b) => b.localeCompare(a)),
        );
        const boundary = "radikar-resume-upload-test";
        const uploadedBytes = Buffer.from("%PDF-1.4\noriginal-upload");
        const secondUploadedBytes = Buffer.from("%PDF-1.4\nsecond-original-upload");
        const multipartPayload = Buffer.concat([
          Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="manual.pdf"\r\nContent-Type: application/pdf\r\n\r\n`,
          ),
          uploadedBytes,
          Buffer.from(
            `\r\n--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="manual-second.pdf"\r\nContent-Type: application/pdf\r\n\r\n`,
          ),
          secondUploadedBytes,
          Buffer.from(`\r\n--${boundary}--\r\n`),
        ]);
        const upload = await app.inject({
          method: "POST",
          url: `/api/employer/positions/${directPositionId}/resumes`,
          headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
          payload: multipartPayload,
        });
        assert.equal(upload.statusCode, 201);
        assert.deepEqual(upload.json(), { count: 2, duplicateCount: 0 });
        const repeatedUpload = await app.inject({
          method: "POST",
          url: `/api/employer/positions/${directPositionId}/resumes`,
          headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
          payload: multipartPayload,
        });
        assert.equal(repeatedUpload.statusCode, 201);
        assert.deepEqual(repeatedUpload.json(), { count: 0, duplicateCount: 2 });
        const reproductionPosition = await app.inject({
          method: "POST",
          url: "/api/employer/positions",
          payload: positionInput,
        });
        const reproductionId = reproductionPosition.json().id as string;
        const binaryResume = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x00, 0xff, 0x80]);
        const reproductionFiles = Array.from({ length: 4 }, (_, index) => ({
          fileName: `binary-${index + 1}.pdf`,
          bytes: Buffer.concat([binaryResume, Buffer.from(`-${index}`)]),
        }));
        const reproductionPayload = Buffer.concat([
          ...reproductionFiles.flatMap(({ fileName, bytes }) => [
            Buffer.from(
              `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${fileName}"\r\nContent-Type: application/pdf\r\n\r\n`,
            ),
            bytes,
            Buffer.from("\r\n"),
          ]),
          Buffer.from(`--${boundary}--\r\n`),
        ]);
        const reproduction = await app.inject({
          method: "POST",
          url: `/api/employer/positions/${reproductionId}/resumes`,
          headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
          payload: reproductionPayload,
        });
        assert.equal(reproduction.statusCode, 201);
        assert.equal(reproduction.json().count, 4);
        const reproductionCandidate = (
          await app.inject({ method: "GET", url: `/api/employer/positions/${reproductionId}` })
        ).json().candidates[0];
        const reproducedFile = await app.inject({
          method: "GET",
          url: `/api/employer/positions/${reproductionId}/resumes/${reproductionCandidate.id}/file`,
        });
        assert.deepEqual(reproducedFile.rawPayload, reproductionFiles[0]!.bytes);
        const oneMorePayload = Buffer.concat([
          Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="another.pdf"\r\nContent-Type: application/pdf\r\n\r\n`,
          ),
          Buffer.from("%PDF-1.4\nadditional"),
          Buffer.from(`\r\n--${boundary}--\r\n`),
        ]);
        const oneMoreUpload = await app.inject({
          method: "POST",
          url: `/api/employer/positions/${reproductionId}/resumes`,
          headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
          payload: oneMorePayload,
        });
        assert.equal(oneMoreUpload.statusCode, 201);
        assert.equal(oneMoreUpload.json().count, 1);
        const directCandidateId = (
          await app.inject({ method: "GET", url: `/api/employer/positions/${directPositionId}` })
        ).json().candidates[0].id as string;
        const uploadedOriginal = await app.inject({
          method: "GET",
          url: `/api/employer/positions/${directPositionId}/resumes/${directCandidateId}/file`,
        });
        assert.equal(uploadedOriginal.rawPayload.toString(), uploadedBytes.toString());
        await db
          .update(employerPositions)
          .set({
            interviewQuestions: Array.from(
              { length: 5 },
              (_, index) => `سؤال مشترک شماره ${index + 1} دربارهٔ مهارت‌ها چیست؟`,
            ),
          })
          .where(eq(employerPositions.id, directPositionId));
        const inviteWithoutPhone = await app.inject({
          method: "POST",
          url: `/api/employer/positions/${directPositionId}/invitations`,
          payload: {
            candidateIds: [directCandidateId],
            deadline: new Date(Date.now() + 2 * 60 * 60_000).toISOString(),
          },
        });
        assert.equal(inviteWithoutPhone.statusCode, 422);
        assert.match(inviteWithoutPhone.json().error, /شماره همراه معتبر/);
        await db
          .update(employerCandidates)
          .set({ phone: "09120000999" })
          .where(eq(employerCandidates.positionId, directPositionId));
        const directInvite = await app.inject({
          method: "POST",
          url: `/api/employer/positions/${directPositionId}/invitations`,
          payload: {
            candidateIds: [directCandidateId],
            deadline: new Date(Date.now() + 2 * 60 * 60_000).toISOString(),
          },
        });
        assert.equal(directInvite.statusCode, 201);
        assert.equal(directInvite.json().invitations.length, 1);
        assert.equal(directInvite.json().invitations[0].delivery, "sms_sent");
        assert.equal(invitationDeliveries[0]?.phone, "09120000999");
        const manualAfterInvite = await app.inject({
          method: "POST",
          url: `/api/employer/positions/${directPositionId}/review-method`,
          payload: { method: "manual" },
        });
        assert.equal(manualAfterInvite.statusCode, 200);
        assert.equal(manualAfterInvite.json().reviewMethod, "manual");
        const smartAfterInvite = await app.inject({
          method: "POST",
          url: `/api/employer/positions/${directPositionId}/review-method`,
          payload: { method: "smart" },
        });
        assert.equal(smartAfterInvite.statusCode, 200);
        assert.equal(smartAfterInvite.json().reviewMethod, "smart");
        assert.equal(smartAfterInvite.json().workflowStage, 3);
        assert.equal(
          (
            await app.inject({
              method: "PATCH",
              url: `/api/employer/positions/${directPositionId}`,
              payload: positionInput,
            })
          ).statusCode,
          409,
        );
        assert.equal(
          (await app.inject({ method: "DELETE", url: `/api/employer/positions/${directPositionId}` })).statusCode,
          409,
        );
        assert.equal(
          (
            await app.inject({
              method: "POST",
              url: `/api/employer/positions/${directPositionId}/resumes`,
              headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
              payload: multipartPayload,
            })
          ).statusCode,
          409,
        );
        const invitationUrl = directInvite.json().invitations[0].url as string;
        const invitationToken = invitationUrl.split("/").at(-1)!;
        const candidateHeaders = { "x-test-account-type": "candidate" };
        const rejectedForDifferentPhone = await app.inject({
          method: "POST",
          url: `/api/employer/invitations/${invitationToken}/accept`,
          headers: candidateHeaders,
        });
        assert.equal(rejectedForDifferentPhone.statusCode, 403);
        assert.match(rejectedForDifferentPhone.json().error, /فقط با شماره همراه ثبت‌شده/);
        await db
          .update(employerCandidates)
          .set({ phone: "09120000402" })
          .where(eq(employerCandidates.id, directCandidateId));
        const accepted = await app.inject({
          method: "POST",
          url: `/api/employer/invitations/${invitationToken}/accept`,
          headers: candidateHeaders,
        });
        assert.equal(accepted.statusCode, 200);
        const savedCandidateInvitation = await app.inject({
          method: "GET",
          url: "/api/employer/interviews",
          headers: candidateHeaders,
        });
        assert.equal(savedCandidateInvitation.statusCode, 200);
        assert.ok(
          savedCandidateInvitation
            .json()
            .some(
              (interview: { id: string; status: string }) =>
                interview.id === directCandidateId && interview.status === "invited",
            ),
        );
        const clarification = await app.inject({
          method: "POST",
          url: `/api/employer/interviews/${invitationToken}/clarify`,
          headers: candidateHeaders,
          payload: { questionIndex: 0, userMessage: "منظور سؤال را روشن‌تر می‌گویی؟" },
        });
        assert.equal(clarification.statusCode, 200);
        assert.match(clarification.json().clarifications[0].reply, /مثال واقعی/);
        assert.equal(clarificationCalls, 1);
        const firstTurn = await app.inject({
          method: "POST",
          url: `/api/employer/interviews/${invitationToken}/turn`,
          headers: candidateHeaders,
          payload: { questionIndex: 0, answer: "پاسخ ثبت‌شده پیش از خروج" },
        });
        assert.equal(firstTurn.statusCode, 200);
        assert.ok(interviewerBodies.some((body) => body.chat_uuid === candidateChatUuid));
        assert.equal(firstTurn.json().answers.length, 1);
        assert.match(firstTurn.json().questions[1], /اختلاف نظر/);
        assert.match(firstTurn.json().replies[0], /همکاری تیمی/);
        assert.equal(turnCalls, 1);
        const resumedConversation = await app.inject({
          method: "GET",
          url: `/api/employer/interviews/${invitationToken}`,
          headers: candidateHeaders,
        });
        assert.equal(resumedConversation.json().questions[1], firstTurn.json().questions[1]);
        assert.equal(resumedConversation.json().replies[0], firstTurn.json().replies[0]);
        assert.equal(resumedConversation.json().clarifications[0].user, "منظور سؤال را روشن‌تر می‌گویی؟");
        const exited = await app.inject({
          method: "POST",
          url: `/api/employer/interviews/${invitationToken}/exit`,
          headers: candidateHeaders,
          payload: { answers: ["پاسخ ثبت‌شده پیش از خروج"] },
        });
        assert.equal(exited.statusCode, 200);
        assert.equal(exited.json().exitedEarly, true);
        const afterExit = await db
          .select()
          .from(employerCandidates)
          .where(eq(employerCandidates.id, directCandidateId))
          .limit(1);
        assert.equal(afterExit[0].invitationStatus, "completed");
        assert.deepEqual(afterExit[0].interviewAnswers, ["پاسخ ثبت‌شده پیش از خروج"]);
        assert.match(afterExit[0].interviewReport?.summary ?? "", /خروج|تکمیل/);
        assert.equal(afterExit[0].interviewReport?.score, 16);
        const completedCandidateView = await app.inject({
          method: "GET",
          url: `/api/employer/interviews/${invitationToken}`,
          headers: candidateHeaders,
        });
        assert.equal(completedCandidateView.statusCode, 200);
        assert.equal(completedCandidateView.json().reportReady, true);
        assert.equal(completedCandidateView.json().report, null);
        assert.equal(completedCandidateView.json().feedbackShared, false);
        const candidateCannotShareFeedback = await app.inject({
          method: "PATCH",
          url: `/api/employer/positions/${directPositionId}/interviews/${directCandidateId}/feedback-sharing`,
          headers: candidateHeaders,
          payload: { shared: true },
        });
        assert.equal(candidateCannotShareFeedback.statusCode, 403);
        const sharedFeedback = await app.inject({
          method: "PATCH",
          url: `/api/employer/positions/${directPositionId}/interviews/${directCandidateId}/feedback-sharing`,
          payload: { shared: true },
        });
        assert.equal(sharedFeedback.statusCode, 200);
        assert.equal(sharedFeedback.json().shared, true);
        assert.ok(sharedFeedback.json().sharedAt);
        const sharedCandidateView = await app.inject({
          method: "GET",
          url: `/api/employer/interviews/${invitationToken}`,
          headers: candidateHeaders,
        });
        assert.equal(sharedCandidateView.json().feedbackShared, true);
        assert.equal(sharedCandidateView.json().report.score, 16);
        assert.match(sharedCandidateView.json().report.summary, /خروج|تکمیل/);
        assert.deepEqual(sharedCandidateView.json().report.strengths, afterExit[0].interviewReport?.strengths);
        assert.deepEqual(sharedCandidateView.json().report.improvements, afterExit[0].interviewReport?.improvements);
        const unsharedFeedback = await app.inject({
          method: "PATCH",
          url: `/api/employer/positions/${directPositionId}/interviews/${directCandidateId}/feedback-sharing`,
          payload: { shared: false },
        });
        assert.equal(unsharedFeedback.statusCode, 200);
        assert.equal(unsharedFeedback.json().shared, false);
        assert.equal(unsharedFeedback.json().sharedAt, null);
        const privateCandidateView = await app.inject({
          method: "GET",
          url: `/api/employer/interviews/${invitationToken}`,
          headers: candidateHeaders,
        });
        assert.equal(privateCandidateView.json().feedbackShared, false);
        assert.equal(privateCandidateView.json().report, null);
        const cannotRestart = await app.inject({
          method: "POST",
          url: `/api/employer/interviews/${invitationToken}/exit`,
          headers: candidateHeaders,
          payload: { answers: ["تلاش دوباره"] },
        });
        assert.equal(cannotRestart.statusCode, 409);
        const secondCandidateId = (
          await app.inject({ method: "GET", url: `/api/employer/positions/${directPositionId}` })
        )
          .json()
          .candidates.find((item: { id: string }) => item.id !== directCandidateId).id as string;
        await db
          .update(employerCandidates)
          .set({ phone: "09120000402" })
          .where(eq(employerCandidates.id, secondCandidateId));
        const secondInvite = await app.inject({
          method: "POST",
          url: `/api/employer/positions/${directPositionId}/invitations`,
          payload: {
            candidateIds: [secondCandidateId],
            deadline: new Date(Date.now() + 2 * 60 * 60_000).toISOString(),
          },
        });
        assert.equal(secondInvite.statusCode, 201);
        assert.equal(secondInvite.json().invitations[0].delivery, "in_app");
        assert.equal(invitationDeliveries.length, 1);
        const [linkedExistingMember] = await db
          .select()
          .from(employerCandidates)
          .where(eq(employerCandidates.id, secondCandidateId))
          .limit(1);
        assert.equal(linkedExistingMember.invitedUserId, actor);
        assert.equal(linkedExistingMember.invitationStatus, "invited");
        const [invitationNotification] = await db
          .select()
          .from(userNotifications)
          .where(
            and(
              eq(userNotifications.userId, actor),
              eq(userNotifications.sourceKey, `employer-interview:${secondCandidateId}`),
            ),
          )
          .limit(1);
        assert.equal(invitationNotification.href, `/interview-invites/${secondCandidateId}`);
        assert.match(invitationNotification.message, /مدیر محصول|موقعیت/);
        const candidateNotifications = await app.inject({
          method: "GET",
          url: "/api/notifications",
          headers: candidateHeaders,
        });
        assert.equal(candidateNotifications.statusCode, 200);
        assert.equal(candidateNotifications.json().unreadCount, 2);
        assert.ok(
          candidateNotifications
            .json()
            .items.some(
              (item: { href: string }) => item.href === `/interview-invites/${secondCandidateId}`,
            ),
        );
        assert.equal(
          (
            await app.inject({
              method: "POST",
              url: "/api/notifications/read-all",
              headers: candidateHeaders,
            })
          ).statusCode,
          204,
        );
        assert.equal(
          (
            await app.inject({ method: "GET", url: "/api/notifications", headers: candidateHeaders })
          ).json().unreadCount,
          0,
        );
        const secondToken = (secondInvite.json().invitations[0].url as string).split("/").at(-1)!;
        assert.equal(
          (
            await app.inject({
              method: "POST",
              url: `/api/employer/invitations/${secondToken}/accept`,
              headers: candidateHeaders,
            })
          ).statusCode,
          200,
        );
        const fullAnswers = Array.from({ length: 5 }, (_, index) => `پاسخ آزمایشی کامل برای سؤال شماره ${index + 1}`);
        assert.equal(
          (
            await app.inject({
              method: "PUT",
              url: `/api/employer/interviews/${secondToken}/answers`,
              headers: candidateHeaders,
              payload: { answers: fullAnswers },
            })
          ).statusCode,
          200,
        );
        reportShouldFail = true;
        const failedReport = await app.inject({
          method: "POST",
          url: `/api/employer/interviews/${secondToken}/complete`,
          headers: candidateHeaders,
        });
        assert.equal(failedReport.statusCode, 502);
        assert.match(failedReport.json().error, /پاسخ‌ها ذخیره شده‌اند/);
        const [beforeRetry] = await db
          .select()
          .from(employerCandidates)
          .where(eq(employerCandidates.id, secondCandidateId));
        assert.equal(beforeRetry.invitationStatus, "started");
        assert.deepEqual(beforeRetry.interviewAnswers, fullAnswers);
        reportShouldFail = false;
        const completedReport = await app.inject({
          method: "POST",
          url: `/api/employer/interviews/${secondToken}/complete`,
          headers: candidateHeaders,
        });
        assert.equal(completedReport.statusCode, 200);
        const [afterRetry] = await db
          .select()
          .from(employerCandidates)
          .where(eq(employerCandidates.id, secondCandidateId));
        assert.equal(afterRetry.invitationStatus, "completed");
        assert.equal(afterRetry.interviewReport?.score, 80);
        assert.equal(reportCalls, 3);
        assert.equal(
          (
            await app.inject({
              method: "DELETE",
              url: `/api/employer/positions/${directPositionId}/resumes/${directCandidateId}`,
            })
          ).statusCode,
          409,
        );
        const bankResumeId = randomUUID();
        const bankBytes = Buffer.from("%PDF-1.4\\nbank-resume");
        await db.insert(employerResumeBank).values({
          id: bankResumeId,
          ownerUserId: owner,
          fileName: "bank-resume.pdf",
          fileHash: createHash("sha256").update(bankBytes).digest("hex"),
          fileData: bankBytes,
          resumeText: "رزومهٔ موجود در بانک رزومه با ایمیل bank@example.com و شماره ۰۹۱۵ ۸۱۳ ۵۵۸۰",
          name: "نامزد بانک",
          specialty: "junior Backend یا کارآموزی فرصت دنبال افزاری.به نرم های پروژه سازی",
          email: "bank@example.com",
          phone: "09158135580",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        const duplicateContactBankResumeId = randomUUID();
        await db.insert(employerResumeBank).values({
          id: duplicateContactBankResumeId,
          ownerUserId: owner,
          fileName: "bank-resume-updated.pdf",
          fileHash: createHash("sha256").update("bank-resume-updated").digest("hex"),
          fileData: Buffer.from("%PDF-1.4\\nbank-resume-updated"),
          resumeText: "رزومهٔ جدید همان کارجو",
          name: "نامزد بانک",
          specialty: "Backend Developer",
          email: "BANK@example.com",
          phone: "09158135580",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        const bankList = await app.inject({ method: "GET", url: "/api/employer/resume-bank" });
        assert.equal(bankList.statusCode, 200);
        assert.equal(
          bankList.json().some((resume: { id: string }) => resume.id === bankResumeId),
          true,
        );
        assert.equal(
          bankList.json().find((resume: { id: string }) => resume.id === bankResumeId)?.specialty,
          "junior Backend یا کارآموزی فرصت دنبال افزاری.به نرم های پروژه سازی",
        );
        const bankBoundary = "radikar-bank-duplicate-test";
        const newBankBytes = Buffer.from("%PDF-1.4\\nnew-bank-resume");
        const bankUploadPayload = Buffer.concat([
          ...[
            { name: "already-in-bank.pdf", bytes: bankBytes },
            { name: "new-bank-resume.pdf", bytes: newBankBytes },
            { name: "new-bank-copy.pdf", bytes: newBankBytes },
          ].flatMap(({ name, bytes }) => [
            Buffer.from(
              `--${bankBoundary}\r\nContent-Disposition: form-data; name="files"; filename="${name}"\r\nContent-Type: application/pdf\r\n\r\n`,
            ),
            bytes,
            Buffer.from("\r\n"),
          ]),
          Buffer.from(`--${bankBoundary}--\r\n`),
        ]);
        const bankUpload = await app.inject({
          method: "POST",
          url: "/api/employer/resume-bank",
          headers: { "content-type": `multipart/form-data; boundary=${bankBoundary}` },
          payload: bankUploadPayload,
        });
        assert.equal(bankUpload.statusCode, 201);
        assert.deepEqual(bankUpload.json(), { count: 1, duplicateCount: 2 });
        const repeatedBankUpload = await app.inject({
          method: "POST",
          url: "/api/employer/resume-bank",
          headers: { "content-type": `multipart/form-data; boundary=${bankBoundary}` },
          payload: bankUploadPayload,
        });
        assert.equal(repeatedBankUpload.statusCode, 201);
        assert.deepEqual(repeatedBankUpload.json(), { count: 0, duplicateCount: 3 });
        const bankAfterUpload = (await app.inject({ method: "GET", url: "/api/employer/resume-bank" })).json();
        assert.equal(bankAfterUpload.length, bankList.json().length + 1);
        const bankPosition = await app.inject({
          method: "POST",
          url: "/api/employer/positions",
          payload: positionInput,
        });
        const bankPositionId = bankPosition.json().id as string;
        assert.equal(
          (await app.inject({ method: "POST", url: `/api/employer/positions/${bankPositionId}/continue` })).statusCode,
          422,
        );
        const importFromBank = await app.inject({
          method: "POST",
          url: `/api/employer/positions/${bankPositionId}/resume-bank`,
          payload: { resumeIds: [bankResumeId, duplicateContactBankResumeId] },
        });
        assert.equal(importFromBank.statusCode, 201);
        assert.deepEqual(importFromBank.json(), { count: 1, duplicateCount: 1 });
        const continueBankFlow = await app.inject({
          method: "POST",
          url: `/api/employer/positions/${bankPositionId}/continue`,
        });
        assert.equal(continueBankFlow.statusCode, 200);
        assert.equal(continueBankFlow.json().workflowStage, 3);
        const manualReview = await app.inject({
          method: "POST",
          url: `/api/employer/positions/${bankPositionId}/review-method`,
          payload: { method: "manual" },
        });
        assert.equal(manualReview.statusCode, 200);
        assert.equal(manualReview.json().workflowStage, 4);
        assert.equal(manualReview.json().reviewMethod, "manual");
        assert.equal(
          (await app.inject({ method: "POST", url: `/api/employer/positions/${bankPositionId}/screen` })).statusCode,
          409,
        );
        const smartReview = await app.inject({
          method: "POST",
          url: `/api/employer/positions/${bankPositionId}/review-method`,
          payload: { method: "smart" },
        });
        assert.equal(smartReview.statusCode, 200);
        assert.equal(smartReview.json().workflowStage, 3);
        assert.equal(smartReview.json().reviewMethod, "smart");
        await db
          .update(employerPositions)
          .set({ screeningStatus: "failed", screeningError: "پایش ناموفق بود؛ هزینه‌ای کسر نشد." })
          .where(eq(employerPositions.id, bankPositionId));
        const manualAfterFailure = await app.inject({
          method: "POST",
          url: `/api/employer/positions/${bankPositionId}/review-method`,
          payload: { method: "manual" },
        });
        assert.equal(manualAfterFailure.statusCode, 200);
        assert.equal(manualAfterFailure.json().reviewMethod, "manual");
        assert.equal(manualAfterFailure.json().workflowStage, 4);
        await db
          .update(employerPositions)
          .set({ screeningStatus: "processing" })
          .where(eq(employerPositions.id, bankPositionId));
        assert.equal(
          (
            await app.inject({
              method: "POST",
              url: `/api/employer/positions/${bankPositionId}/review-method`,
              payload: { method: "smart" },
            })
          ).statusCode,
          409,
        );
        await db
          .update(employerPositions)
          .set({ screeningStatus: "not_started", reviewMethod: "smart", workflowStage: 3, screeningError: null })
          .where(eq(employerPositions.id, bankPositionId));
        assert.equal(
          (await app.inject({ method: "GET", url: `/api/employer/positions/${bankPositionId}` })).json().position
            .workflowStage,
          3,
        );
        const bankCandidate = (
          await app.inject({ method: "GET", url: `/api/employer/positions/${bankPositionId}` })
        ).json().candidates[0];
        assert.equal(bankCandidate.resumeBankId, bankResumeId);
        assert.equal(bankCandidate.email, "bank@example.com");
        const secondPosition = await app.inject({
          method: "POST",
          url: "/api/employer/positions",
          payload: { ...positionInput, title: "پوزیشن دوم" },
        });
        const secondPositionId = secondPosition.json().id as string;
        assert.equal(
          (
            await app.inject({
              method: "POST",
              url: `/api/employer/positions/${secondPositionId}/resume-bank`,
              payload: { resumeIds: [bankResumeId] },
            })
          ).statusCode,
          201,
        );
        const contactPath = `/api/employer/positions/${bankPositionId}/resumes/${bankCandidate.id}/contact`;
        assert.equal(
          (
            await app.inject({
              method: "PATCH",
              url: contactPath,
              payload: { phone: "۰۹۱۲ ۳۴۵ ۶۷۸۹" },
              headers: { "x-test-account-type": "candidate" },
            })
          ).statusCode,
          403,
        );
        assert.equal(
          (await app.inject({ method: "PATCH", url: contactPath, payload: { phone: "123" } })).statusCode,
          422,
        );
        const savedContact = await app.inject({
          method: "PATCH",
          url: contactPath,
          payload: { phone: "۰۹۱۲ ۳۴۵ ۶۷۸۹" },
        });
        assert.equal(savedContact.statusCode, 200);
        assert.equal(savedContact.json().phone, "09123456789");
        assert.equal(
          (await app.inject({ method: "GET", url: "/api/employer/resume-bank" }))
            .json()
            .find((resume: { id: string }) => resume.id === bankResumeId)?.phone,
          "09123456789",
        );
        for (const linkedPositionId of [bankPositionId, secondPositionId]) {
          const linked = (
            await app.inject({ method: "GET", url: `/api/employer/positions/${linkedPositionId}` })
          ).json().candidates[0];
          assert.equal(linked.phone, "09123456789");
        }
        await db
          .update(employerCandidates)
          .set({
            invitationStatus: "completed",
            interviewReport: { score: 82, summary: "مناسب", strengths: ["تجربه"], improvements: [] },
          })
          .where(eq(employerCandidates.id, bankCandidate.id));
        const bankWithInterviews = (await app.inject({ method: "GET", url: "/api/employer/resume-bank" })).json();
        const linkedPositions = bankWithInterviews.find(
          (resume: { id: string }) => resume.id === bankResumeId,
        )?.positions;
        assert.equal(linkedPositions.length, 2);
        assert.deepEqual(
          linkedPositions
            .map((item: { positionId: string; invitationStatus: string; interviewScore: number | null }) => ({
              positionId: item.positionId,
              invitationStatus: item.invitationStatus,
              interviewScore: item.interviewScore,
            }))
            .sort((left: { positionId: string }, right: { positionId: string }) =>
              left.positionId.localeCompare(right.positionId),
            ),
          [
            { positionId: bankPositionId, invitationStatus: "completed", interviewScore: 82 },
            { positionId: secondPositionId, invitationStatus: "not_invited", interviewScore: null },
          ].sort((left, right) => left.positionId.localeCompare(right.positionId)),
        );
        assert.equal(
          (await app.inject({ method: "DELETE", url: `/api/employer/resume-bank/${bankResumeId}` })).statusCode,
          409,
        );
        await db
          .update(employerCandidates)
          .set({ invitationStatus: "not_invited", interviewReport: null })
          .where(eq(employerCandidates.id, bankCandidate.id));
        assert.equal(
          (await app.inject({ method: "DELETE", url: `/api/employer/resume-bank/${bankResumeId}` })).statusCode,
          200,
        );
        assert.equal(
          (await app.inject({ method: "GET", url: `/api/employer/positions/${bankPositionId}` })).json().candidates
            .length,
          0,
        );
        await radicoin.adjust(owner, 5, "اعتبار تست پایش ایجنت", actor, "employer-ranker-test-fund");
        const rankPosition = await app.inject({
          method: "POST",
          url: "/api/employer/positions",
          payload: positionInput,
        });
        assert.equal(rankPosition.statusCode, 201);
        const rankPositionId = rankPosition.json().id as string;
        const rankCandidateId = randomUUID();
        await db.insert(employerCandidates).values({
          id: rankCandidateId,
          positionId: rankPositionId,
          fileName: "candidate.pdf",
          fileHash: "ranker-test-file",
          resumeText: "توسعه‌دهنده Java با چهار سال سابقه. contact@example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        assert.equal(
          (
            await app.inject({
              method: "POST",
              url: `/api/employer/positions/${rankPositionId}/screen`,
            })
          ).statusCode,
          200,
        );
        assert.equal(
          (
            await app.inject({
              method: "POST",
              url: `/api/employer/positions/${rankPositionId}/screen/next`,
            })
          ).statusCode,
          200,
        );
        const [ranked] = await db.select().from(employerCandidates).where(eq(employerCandidates.id, rankCandidateId));
        assert.equal(ranked.screeningStatus, "ready");
        assert.equal(ranked.matchEvidence?.score, 82);
        assert.equal(rankerCalls, 1);
        assert.doesNotMatch(rankerPrompt, /contact@example\.com/);
        assert.equal(
          (
            await app.inject({
              method: "POST",
              url: `/api/employer/positions/${rankPositionId}/screen/next`,
            })
          ).json().status,
          "completed",
        );
        const removablePosition = await app.inject({
          method: "POST",
          url: "/api/employer/positions",
          payload: positionInput,
        });
        const removablePositionId = removablePosition.json().id as string;
        assert.equal(
          (await app.inject({ method: "DELETE", url: `/api/employer/positions/${removablePositionId}` })).statusCode,
          204,
        );
        assert.equal(
          (await app.inject({ method: "GET", url: `/api/employer/positions/${removablePositionId}` })).statusCode,
          404,
        );
        assert.equal((await radicoin.getWallet(owner, 0)).wallet?.availableCoins, 9);
      } finally {
        await sql.end({ timeout: 5 });
      }
    } finally {
      await app.close();
      await connection?.close();
      await admin.unsafe(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
      await admin.end({ timeout: 5 });
    }
  },
);
