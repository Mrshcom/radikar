import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { promisify } from "node:util";
import { createDatabase } from "@radikar/database";
import postgres from "postgres";
import { AuthError, AuthService } from "../src/modules/auth/service";
import { BillingService } from "../src/modules/billing/service";

const execFileAsync = promisify(execFile);
const root = new URL("../../../", import.meta.url).pathname;
const adminUrl = "postgresql://radikar:radikar@localhost:5433/postgres";

async function withDatabase(run: (input: {
  database: ReturnType<typeof createDatabase>["db"];
  sql: postgres.Sql;
}) => Promise<void>) {
  const databaseName = `radikar_auth_test_${randomUUID().replaceAll("-", "")}`;
  const databaseUrl = `postgresql://radikar:radikar@localhost:5433/${databaseName}`;
  const admin = postgres(adminUrl, { max: 1 });
  let database: ReturnType<typeof createDatabase> | undefined;
  let sql: postgres.Sql | undefined;
  try {
    await admin.unsafe(`CREATE DATABASE ${databaseName}`);
    const env = { ...process.env, DATABASE_URL: databaseUrl };
    await execFileAsync("node", ["--import", "tsx", "packages/database/src/migrate.ts"], {
      cwd: root,
      env,
    });
    await execFileAsync("node", ["--import", "tsx", "packages/database/src/seed.ts"], {
      cwd: root,
      env,
    });
    database = createDatabase(databaseUrl, 2);
    sql = postgres(databaseUrl, { max: 1 });
    await run({ database: database.db, sql });
  } finally {
    await database?.close();
    await sql?.end({ timeout: 5 });
    await admin.unsafe(`DROP DATABASE IF EXISTS ${databaseName} WITH (FORCE)`);
    await admin.end({ timeout: 5 });
  }
}

const billingOptions = {
  apiPublicUrl: "http://api.test",
  webAppUrl: "http://web.test",
  zarinpalBaseUrl: "http://gateway.test",
  zarinpalMerchantId: "merchant",
};

test("AuthService resolves, refreshes and revokes real PostgreSQL sessions", { timeout: 60_000 }, async () => {
  await withDatabase(async ({ database, sql }) => {
    const billing = new BillingService(database, billingOptions);
    const auth = new AuthService(database, {
      secret: "auth-real-test",
      otpTtlSeconds: 180,
      sessionTtlDays: 30,
      allowFirstUserSuperadmin: true,
      exposeDevelopmentOtp: true,
      grantSignupMembership: (userId) => billing.ensureSignupMembership(userId),
    });

    assert.equal(await auth.resolveSession(), null);
    assert.equal(await auth.resolveSession("missing"), null);

    const challenge = await auth.requestOtp("09120000001");
    const verified = await auth.verifyOtp(challenge.challengeId, "09120000001", challenge.developmentCode!);
    assert.equal(verified.user.role, "superadmin");
    assert.equal((await sql`select count(*)::int as count from user_memberships where user_id = ${verified.user.id}`)[0].count, 1);

    const resolved = await auth.resolveSession(verified.sessionToken);
    assert.equal(resolved?.user.id, verified.user.id);
    assert.equal(resolved?.sessionId.length, 36);

    await sql`update auth_sessions set last_seen_at = now() - interval '6 minutes' where id = ${resolved!.sessionId}`;
    const staleLastSeenAt = (await sql<{ last_seen_at: Date }[]>`select last_seen_at from auth_sessions where id = ${resolved!.sessionId}`)[0].last_seen_at;
    await auth.resolveSession(verified.sessionToken);
    const refreshedLastSeenAt = (await sql<{ last_seen_at: Date }[]>`select last_seen_at from auth_sessions where id = ${resolved!.sessionId}`)[0].last_seen_at;
    assert.ok(refreshedLastSeenAt > staleLastSeenAt);

    await auth.revokeSession(resolved!.sessionId);
    assert.equal(await auth.resolveSession(verified.sessionToken), null);

    const activeChallenge = await auth.requestOtp("09120000002");
    const activeUser = await auth.verifyOtp(activeChallenge.challengeId, "09120000002", activeChallenge.developmentCode!);
    await sql`update auth_sessions set expires_at = now() - interval '1 second' where token_hash = encode(sha256(${activeUser.sessionToken}::bytea), 'hex')`;
    assert.equal(await auth.resolveSession(activeUser.sessionToken), null);

    const suspendedChallenge = await auth.requestOtp("09120000003");
    const suspendedUser = await auth.verifyOtp(suspendedChallenge.challengeId, "09120000003", suspendedChallenge.developmentCode!);
    await sql`update users set status = 'suspended' where id = ${suspendedUser.user.id}`;
    assert.equal(await auth.resolveSession(suspendedUser.sessionToken), null);
  });
});

test("AuthService creates users, memberships and sessions and reports OTP webhook failures", { timeout: 60_000 }, async () => {
  await withDatabase(async ({ database, sql }) => {
    const billing = new BillingService(database, billingOptions);
    const options = {
      secret: "auth-webhook-test",
      otpTtlSeconds: 180,
      sessionTtlDays: 30,
      allowFirstUserSuperadmin: false,
      exposeDevelopmentOtp: true,
      grantSignupMembership: (userId: string) => billing.ensureSignupMembership(userId),
    };
    const auth = new AuthService(database, options);
    const challenge = await auth.requestOtp("09120000004");
    const result = await auth.verifyOtp(challenge.challengeId, "09120000004", challenge.developmentCode!);
    assert.equal(result.user.role, "user");
    assert.match(result.sessionToken, /^[A-Za-z0-9_-]{32,}$/);
    assert.equal((await sql`select consumed from otp_challenges where id = ${challenge.challengeId}`)[0].consumed, true);
    assert.equal((await sql`select count(*)::int as count from auth_sessions where user_id = ${result.user.id}`)[0].count, 1);
    assert.equal((await sql`select plan_id from user_memberships where user_id = ${result.user.id}`)[0].plan_id, "free");

    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => new Response("down", { status: 503 });
      const failedWebhook = new AuthService(database, { ...options, otpWebhookUrl: "https://sms.test/send" });
      await assert.rejects(
        () => failedWebhook.requestOtp("09120000005"),
        (error: unknown) => error instanceof AuthError && error.statusCode === 502,
      );

      const originalTimeout = AbortSignal.timeout;
      try {
        AbortSignal.timeout = () => AbortSignal.abort();
        globalThis.fetch = async (_url, init) => {
          assert.equal(init?.signal?.aborted, true);
          throw new DOMException("aborted", "AbortError");
        };
        await assert.rejects(
          () => failedWebhook.requestOtp("09120000006"),
          (error: unknown) => error instanceof AuthError && error.statusCode === 502,
        );
      } finally {
        AbortSignal.timeout = originalTimeout;
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test("AuthService manages users, profiles, preferences, statistics and events in PostgreSQL", { timeout: 60_000 }, async () => {
  await withDatabase(async ({ database, sql }) => {
    const billing = new BillingService(database, billingOptions);
    const auth = new AuthService(database, {
      secret: "auth-management-test",
      otpTtlSeconds: 180,
      sessionTtlDays: 30,
      allowFirstUserSuperadmin: true,
      exposeDevelopmentOtp: true,
      grantSignupMembership: (userId) => billing.ensureSignupMembership(userId),
    });
    const superadminChallenge = await auth.requestOtp("09120000007");
    const superadmin = await auth.verifyOtp(
      superadminChallenge.challengeId,
      "09120000007",
      superadminChallenge.developmentCode!,
    );
    const userChallenge = await auth.requestOtp("09120000008");
    const user = await auth.verifyOtp(userChallenge.challengeId, "09120000008", userChallenge.developmentCode!);

    const profile = await auth.updateProfile(user.user.id, { fullName: "کاربر آزمون" });
    assert.equal(profile.fullName, "کاربر آزمون");
    const preferences = await auth.updatePreferences(user.user.id, { tablePageSize: 50 });
    assert.equal(preferences.tablePageSize, 50);
    const promoted = await auth.updateUser(user.user.id, { role: "admin" });
    assert.equal(promoted.role, "admin");
    await auth.updateUser(user.user.id, { status: "suspended" }, superadmin.user.id);
    assert.equal(await auth.resolveSession(user.sessionToken), null);
    assert.equal((await sql`select count(*)::int as count from auth_sessions where user_id = ${user.user.id} and revoked_at is not null`)[0].count, 1);
    assert.equal((await sql`select type from membership_events where user_id = ${user.user.id} order by created_at desc limit 1`)[0].type, "account_suspended");
    await auth.updateUser(user.user.id, { status: "active" }, superadmin.user.id);
    assert.equal((await sql`select type from membership_events where user_id = ${user.user.id} order by created_at desc limit 1`)[0].type, "account_activated");

    await sql`insert into data_records (collection, id, owner_user_id, profile_id, payload, created_at, updated_at) values ('resumes', 'resume-auth-test', ${user.user.id}, 'profile-auth-test', '{"id":"resume-auth-test"}'::jsonb, now(), now())`;
    await sql`insert into orders (id, order_number, user_id, plan_id, amount_rials, status, authority, ref_id, paid_at, created_at, updated_at) values (${randomUUID()}, 'RM-AUTH-TEST', ${user.user.id}, 'free', 0, 'paid', 'AUTH-TEST', '42', now(), now(), now())`;

    const users = await auth.listUsers("کاربر آزمون", 1, 20, "admin", "active");
    assert.deepEqual(users.items.map((item) => item.id), [user.user.id]);
    assert.equal(users.items[0].recordsCount, 1);
    const records = await auth.listAllRecords(1, 20, "resume-auth", "resumes");
    assert.equal(records.items[0].ownerUserId, user.user.id);
    const details = await auth.getUserDetails(user.user.id);
    assert.deepEqual(details.records, [{ collection: "resumes", total: 1 }]);
    const stats = await auth.getStats();
    assert.equal(stats.users.total, 1);
    assert.equal(stats.records.resumes, 1);
    const events = await auth.getRecentEvents(10);
    assert.deepEqual(new Set(events.items.map((event) => event.type)), new Set(["signup", "purchase", "resume"]));
    await assert.rejects(() => auth.getUserDetails(randomUUID()), (error: unknown) => error instanceof AuthError && error.statusCode === 404);
  });
});
