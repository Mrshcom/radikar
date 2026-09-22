import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { promisify } from "node:util";
import postgres from "postgres";

const execFileAsync = promisify(execFile);
const root = new URL("../../../", import.meta.url).pathname;
const databaseName = `radikar_test_${randomUUID().replaceAll("-", "")}`;
const adminUrl = "postgresql://radikar:radikar@localhost:5433/postgres";
const databaseUrl = `postgresql://radikar:radikar@localhost:5433/${databaseName}`;

test("migrations from an empty database seed plans and enforce PostgreSQL constraints", { timeout: 60_000 }, async () => {
  const admin = postgres(adminUrl, { max: 1 });
  try {
    await admin.unsafe(`CREATE DATABASE ${databaseName}`);
    const env = { ...process.env, DATABASE_URL: databaseUrl };
    await execFileAsync("node", ["--import", "tsx", "packages/database/src/migrate.ts"], { cwd: root, env });
    await execFileAsync("node", ["--import", "tsx", "packages/database/src/seed.ts"], { cwd: root, env });
    await Promise.all([
      execFileAsync("node", ["--import", "tsx", "packages/database/src/seed.ts"], { cwd: root, env }),
      execFileAsync("node", ["--import", "tsx", "packages/database/src/seed.ts"], { cwd: root, env }),
    ]);
    await execFileAsync("node", ["--import", "tsx", "packages/database/src/migrate.ts"], { cwd: root, env });
    await execFileAsync("node", ["--import", "tsx", "packages/database/src/seed.ts"], { cwd: root, env });
    const db = postgres(databaseUrl, { max: 1 });
    try {
      const plans = await db<{ id: string; price_rials: number; duration_days: number; resume_limit: number | null; pdf_download_limit: number | null; ai_credits: number; match_credits: number; interview_credits: number; is_free: boolean; is_purchasable: boolean; is_active: boolean; sort_order: number }[]>`select id, price_rials, duration_days, resume_limit, pdf_download_limit, ai_credits, match_credits, interview_credits, is_free, is_purchasable, is_active, sort_order from plans order by sort_order`;
      assert.deepEqual([...plans], [
        { id: "free", price_rials: 0, duration_days: 30, resume_limit: 1, pdf_download_limit: 3, ai_credits: 5, match_credits: 1, interview_credits: 1, is_free: true, is_purchasable: false, is_active: true, sort_order: 10 },
        { id: "job-search", price_rials: 4_990_000, duration_days: 30, resume_limit: 5, pdf_download_limit: null, ai_credits: 40, match_credits: 15, interview_credits: 5, is_free: false, is_purchasable: true, is_active: true, sort_order: 20 },
        { id: "professional", price_rials: 7_990_000, duration_days: 30, resume_limit: null, pdf_download_limit: null, ai_credits: 150, match_credits: 50, interview_credits: 15, is_free: false, is_purchasable: true, is_active: true, sort_order: 30 },
      ]);
      assert.deepEqual((await db`select collection, id from data_records order by collection`).map((row) => `${row.collection}:${row.id}`), ["appProfiles:profile-default", "workspaceState:active-profile"]);
      await assert.rejects(() => db`insert into data_records (collection, id, payload, created_at, updated_at) values ('appProfiles', 'profile-default', '{}'::jsonb, now(), now())`, (error: unknown) => (error as { code?: string }).code === "23505");
      const userId = randomUUID();
      await db`insert into users (id, phone, role, status, created_at, updated_at, table_page_size) values (${userId}, '09129999999', 'user', 'active', now(), now(), 20)`;
      await assert.rejects(
        () => db`insert into users (id, phone, role, status, created_at, updated_at, table_page_size) values (${randomUUID()}, '09129999999', 'user', 'active', now(), now(), 20)`,
        (error: unknown) => (error as { code?: string }).code === "23505",
      );
      await assert.rejects(
        () => db`insert into auth_sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at) values (${randomUUID()}, ${randomUUID()}, 'invalid-owner', now() + interval '1 day', now(), now())`,
        (error: unknown) => (error as { code?: string }).code === "23503",
      );
      await db`insert into auth_sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at) values (${randomUUID()}, ${userId}, 'valid-owner', now() + interval '1 day', now(), now())`;
      await assert.rejects(() => db`insert into auth_sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at) values (${randomUUID()}, ${userId}, 'valid-owner', now() + interval '1 day', now(), now())`, (error: unknown) => (error as { code?: string }).code === "23505");
      const membershipId = randomUUID(); const orderId = randomUUID();
      await db`insert into user_memberships (id, user_id, plan_id, status, starts_at, expires_at, ai_credits_remaining, match_credits_remaining, interview_credits_remaining, created_at, updated_at) values (${membershipId}, ${userId}, 'free', 'active', now(), now() + interval '1 day', 1, 1, 1, now(), now())`;
      await assert.rejects(() => db`insert into user_memberships (id, user_id, plan_id, status, starts_at, expires_at, ai_credits_remaining, match_credits_remaining, interview_credits_remaining, created_at, updated_at) values (${randomUUID()}, ${userId}, 'free', 'active', now(), now(), 1, 1, 1, now(), now())`, (error: unknown) => (error as { code?: string }).code === "23505");
      await db`insert into orders (id, order_number, user_id, plan_id, amount_rials, authority, created_at, updated_at) values (${orderId}, 'ORDER-ONE', ${userId}, 'free', 0, 'AUTH-ONE', now(), now())`;
      await assert.rejects(() => db`insert into orders (id, order_number, user_id, plan_id, amount_rials, authority, created_at, updated_at) values (${randomUUID()}, 'ORDER-ONE', ${userId}, 'free', 0, 'AUTH-TWO', now(), now())`, (error: unknown) => (error as { code?: string }).code === "23505");
      await assert.rejects(() => db`insert into orders (id, order_number, user_id, plan_id, amount_rials, authority, created_at, updated_at) values (${randomUUID()}, 'ORDER-TWO', ${userId}, 'free', 0, 'AUTH-ONE', now(), now())`, (error: unknown) => (error as { code?: string }).code === "23505");
      await db`insert into payments (id, order_id, authority, amount_rials, created_at, updated_at) values (${randomUUID()}, ${orderId}, 'PAY-ONE', 0, now(), now())`;
      await assert.rejects(() => db`insert into payments (id, order_id, authority, amount_rials, created_at, updated_at) values (${randomUUID()}, ${orderId}, 'PAY-ONE', 0, now(), now())`, (error: unknown) => (error as { code?: string }).code === "23505");
      await db`insert into usage_events (id, user_id, membership_id, resource, units, operation, request_id, created_at) values (${randomUUID()}, ${userId}, ${membershipId}, 'ai', -1, 'test', 'usage-one', now())`;
      await assert.rejects(() => db`insert into usage_events (id, user_id, resource, units, operation, request_id, created_at) values (${randomUUID()}, ${userId}, 'ai', -1, 'test', 'usage-one', now())`, (error: unknown) => (error as { code?: string }).code === "23505");
      await db`insert into model_usage_events (id, user_id, request_id, operation, provider, model, token_source, status_code, successful, duration_ms, attempt, created_at) values (${randomUUID()}, ${userId}, 'model-one', 'test', 'gapgpt', 'model', 'provider', 200, true, 1, 1, now())`;
      await assert.rejects(() => db`insert into model_usage_events (id, user_id, request_id, operation, provider, model, token_source, status_code, successful, duration_ms, attempt, created_at) values (${randomUUID()}, ${userId}, 'model-one', 'test', 'gapgpt', 'model', 'provider', 200, true, 1, 1, now())`, (error: unknown) => (error as { code?: string }).code === "23505");
      await assert.rejects(() => db`delete from plans where id = 'free'`, (error: unknown) => (error as { code?: string }).code === "23503");
      await db`insert into data_records (collection, id, owner_user_id, payload, created_at, updated_at) values ('resumes', 'tenant-key', ${userId}, '{}'::jsonb, now(), now())`;
      await assert.rejects(() => db`insert into data_records (collection, id, owner_user_id, payload, created_at, updated_at) values ('resumes', 'tenant-key', ${userId}, '{}'::jsonb, now(), now())`, (error: unknown) => (error as { code?: string }).code === "23505");
      await db`delete from users where id = ${userId}`;
      for (const table of ["auth_sessions", "orders", "payments", "usage_events", "model_usage_events"] as const) assert.equal((await db.unsafe(`select count(*)::int as count from ${table}`))[0].count, 0, `${table} cascades`);

      const owner = randomUUID(); const actor = randomUUID(); const detachedMembership = randomUUID();
      await db`insert into users (id, phone, role, status, created_at, updated_at, table_page_size) values (${owner}, '09129999998', 'user', 'active', now(), now(), 20), (${actor}, '09129999997', 'admin', 'active', now(), now(), 20)`;
      await db`insert into user_memberships (id, user_id, plan_id, status, starts_at, expires_at, ai_credits_remaining, match_credits_remaining, interview_credits_remaining, canceled_by_user_id, created_at, updated_at) values (${detachedMembership}, ${owner}, 'job-search', 'active', now(), now() + interval '1 day', 1, 1, 1, ${actor}, now(), now())`;
      await db`insert into membership_events (id, user_id, membership_id, plan_id, actor_user_id, type, created_at) values (${randomUUID()}, ${actor}, ${detachedMembership}, 'job-search', ${actor}, 'admin_adjust', now())`;
      await db`insert into usage_events (id, user_id, membership_id, resource, units, operation, request_id, actor_user_id, created_at) values (${randomUUID()}, ${actor}, ${detachedMembership}, 'ai', 1, 'test', 'nullable-membership', ${actor}, now())`;
      await db`delete from user_memberships where id = ${detachedMembership}`;
      assert.equal((await db`select membership_id from membership_events where user_id = ${actor}`)[0].membership_id, null);
      assert.equal((await db`select membership_id from usage_events where request_id = 'nullable-membership'`)[0].membership_id, null);
      const canceledMembership = randomUUID();
      await db`insert into user_memberships (id, user_id, plan_id, status, starts_at, expires_at, ai_credits_remaining, match_credits_remaining, interview_credits_remaining, canceled_by_user_id, created_at, updated_at) values (${canceledMembership}, ${owner}, 'job-search', 'active', now(), now() + interval '1 day', 1, 1, 1, ${actor}, now(), now())`;
      await db`delete from users where id = ${actor}`;
      assert.equal((await db`select canceled_by_user_id from user_memberships where id = ${canceledMembership}`)[0].canceled_by_user_id, null);
    } finally {
      await db.end({ timeout: 5 });
    }
  } finally {
    await admin.unsafe(`DROP DATABASE IF EXISTS ${databaseName} WITH (FORCE)`);
    await admin.end({ timeout: 5 });
  }
});
