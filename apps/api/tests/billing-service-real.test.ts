import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { promisify } from "node:util";
import { createDatabase } from "@radikar/database";
import postgres from "postgres";
import { BillingError, BillingService } from "../src/modules/billing/service";
import { ZarinpalError } from "../src/modules/billing/zarinpal-client";
import { RadicoinService } from "../src/modules/radicoin/service";

const execFileAsync = promisify(execFile);
const root = new URL("../../../", import.meta.url).pathname;
const adminUrl = "postgresql://radikar:radikar@localhost:5433/postgres";
const options = {
  apiPublicUrl: "http://api.test",
  webAppUrl: "http://web.test",
  zarinpalBaseUrl: "http://gateway.test",
  zarinpalMerchantId: "merchant",
};

async function withDatabase(
  run: (database: ReturnType<typeof createDatabase>["db"], sql: postgres.Sql) => Promise<void>,
) {
  const name = `radikar_billing_test_${randomUUID().replaceAll("-", "")}`;
  const url = `postgresql://radikar:radikar@localhost:5433/${name}`;
  const admin = postgres(adminUrl, { max: 1 });
  let connection: ReturnType<typeof createDatabase> | undefined;
  let sql: postgres.Sql | undefined;
  try {
    await admin.unsafe(`CREATE DATABASE ${name}`);
    const env = { ...process.env, DATABASE_URL: url };
    await execFileAsync("node", ["--import", "tsx", "packages/database/src/migrate.ts"], { cwd: root, env });
    await execFileAsync("node", ["--import", "tsx", "packages/database/src/seed.ts"], { cwd: root, env });
    connection = createDatabase(url, 4);
    sql = postgres(url, { max: 1 });
    await run(connection.db, sql);
  } finally {
    await connection?.close();
    await sql?.end({ timeout: 5 });
    await admin.unsafe(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
    await admin.end({ timeout: 5 });
  }
}

async function user(sql: postgres.Sql, phone: string) {
  const id = randomUUID();
  await sql`insert into users (id, phone, role, status, created_at, updated_at, table_page_size) values (${id}, ${phone}, 'user', 'active', now(), now(), 20)`;
  return id;
}

function gateway(billing: BillingService, authority: string, verify: boolean | "transient" = true) {
  (billing as any).gateway = {
    requestPayment: async () => ({
      authority,
      paymentUrl: `https://pay.test/${authority}`,
      providerData: { code: 100 },
    }),
    verifyPayment: async () => {
      if (verify === "transient") throw new Error("gateway temporarily unavailable");
      if (!verify) throw new ZarinpalError("gateway verification failed", -51);
      return {
        code: 100,
        refId: `ref-${authority}`,
        cardPan: "6037",
        cardHash: "hash",
        providerData: { verified: true },
      };
    },
  };
}

test(
  "BillingService commits successful, concurrent, renewal, upgrade and expired callbacks in PostgreSQL",
  { timeout: 60_000 },
  async () => {
    await withDatabase(async (database, sql) => {
      const id = await user(sql, "09120000101");
      const billing = new BillingService(database, options);
      await billing.ensureSignupMembership(id);
      gateway(billing, "AUTH-ONE");
      const created = await billing.createOrder(id, "09120000101", "job-search");
      assert.equal(created.checkout, "gateway");
      if (created.checkout !== "gateway") throw new Error("expected gateway checkout");
      assert.match(created.paymentUrl, /AUTH-ONE/);
      await Promise.all([billing.handleCallback("AUTH-ONE", "OK"), billing.handleCallback("AUTH-ONE", "OK")]);
      const paid = (
        await sql`select o.status as order_status, p.status as payment_status, m.plan_id, m.ai_credits_remaining from orders o join payments p on p.order_id = o.id join user_memberships m on m.user_id = o.user_id where o.id = ${created.orderId}`
      )[0];
      assert.deepEqual([paid.order_status, paid.payment_status, paid.plan_id], ["paid", "verified", "job-search"]);
      assert.equal(
        (await sql`select count(*)::int as count from membership_events where order_id = ${created.orderId}`)[0].count,
        1,
      );

      gateway(billing, "AUTH-TWO");
      await billing.createOrder(id, "09120000101", "job-search");
      await billing.handleCallback("AUTH-TWO", "OK");
      assert.equal((await sql`select type from membership_events order by created_at desc limit 1`)[0].type, "renewal");

      gateway(billing, "AUTH-THREE");
      await billing.createOrder(id, "09120000101", "professional");
      await billing.handleCallback("AUTH-THREE", "OK");
      assert.equal((await sql`select type from membership_events order by created_at desc limit 1`)[0].type, "upgrade");
      await assert.rejects(
        () => billing.createOrder(id, "09120000101", "job-search"),
        (error: unknown) => error instanceof BillingError && error.statusCode === 409,
      );

      await sql`update user_memberships set expires_at = now() - interval '1 second' where user_id = ${id}`;
      gateway(billing, "AUTH-FOUR");
      await billing.createOrder(id, "09120000101", "job-search");
      await billing.handleCallback("AUTH-FOUR", "OK");
      assert.equal(
        (await sql`select type from membership_events order by created_at desc limit 1`)[0].type,
        "purchase",
      );

      gateway(billing, "AUTH-BAD", false);
      const failed = await billing.createOrder(id, "09120000101", "professional");
      assert.equal(failed.checkout, "gateway");
      if (failed.checkout !== "gateway") throw new Error("expected gateway checkout");
      const result = await billing.handleCallback("AUTH-BAD", "OK");
      assert.match(result, /status=failed/);
      assert.equal((await sql`select status from orders where id = ${failed.orderId}`)[0].status, "failed");

      gateway(billing, "AUTH-RETRY", "transient");
      const retryable = await billing.createOrder(id, "09120000101", "professional");
      if (retryable.checkout !== "gateway") throw new Error("expected gateway checkout");
      const retryResult = await billing.handleCallback("AUTH-RETRY", "OK");
      assert.match(retryResult, /status=pending/);
      assert.equal((await sql`select status from orders where id = ${retryable.orderId}`)[0].status, "pending");
      const userOrders = await billing.listUserOrders(id, 1, 2, "RM-", "paid");
      assert.equal(userOrders.total, 4);
      assert.equal(userOrders.items.length, 2);
      const adminOrders = await billing.listAdminOrders("09120000101", 2, 2, "paid", "job-search");
      assert.equal(adminOrders.total, 3);
      assert.equal(adminOrders.items.length, 1);
      const payments = await billing.listAdminPayments(1, 2, "AUTH-", "verified");
      assert.equal(payments.total, 4);
      assert.equal(payments.items.length, 2);
    });
  },
);

test("BillingService atomically consumes, refunds and protects every usage resource", { timeout: 60_000 }, async () => {
  await withDatabase(async (database, sql) => {
    const id = await user(sql, "09120000102");
    const billing = new BillingService(database, options);
    await billing.ensureSignupMembership(id);
    const costs = { resume: 1, pdf: 1, ai: 1, match: 1, interview: 1 } as const;
    await billing.consumeUsage(id, costs, "all-resources", "consume-1");
    const afterConsume = (
      await sql`select resumes_remaining, pdf_downloads_remaining, ai_credits_remaining, match_credits_remaining, interview_credits_remaining from user_memberships where user_id = ${id}`
    )[0];
    assert.deepEqual(Object.values(afterConsume).map(Number), [0, 2, 4, 0, 0]);
    await assert.rejects(() => billing.consumeUsage(id, costs, "all-resources", "consume-1"));
    const afterRollback = (
      await sql`select count(*)::int as count from usage_events where request_id like 'consume-1:%'`
    )[0];
    assert.equal(afterRollback.count, 5);
    await billing.refundUsage(id, costs, "all-resources", "consume-1");
    const afterRefund = (
      await sql`select resumes_remaining, pdf_downloads_remaining, ai_credits_remaining, match_credits_remaining, interview_credits_remaining from user_memberships where user_id = ${id}`
    )[0];
    assert.deepEqual(Object.values(afterRefund).map(Number), [1, 3, 5, 1, 1]);
    await sql`update user_memberships set expires_at = now() - interval '1 second' where user_id = ${id}`;
    await assert.rejects(
      () => billing.consumeUsage(id, { ai: 1 }, "expired", "expired-1"),
      (error: unknown) => error instanceof BillingError && error.statusCode === 402,
    );
  });
});

test("BillingService filters real reports and persists every admin mutation", { timeout: 60_000 }, async () => {
  await withDatabase(async (database, sql) => {
    const id = await user(sql, "09120000103");
    const actor = await user(sql, "09120000104");
    const billing = new BillingService(database, options);
    await billing.ensureSignupMembership(id);
    await billing.adminGrantPlan(id, "job-search", actor);
    await billing.adminExtendMembership(id, 7, actor);
    await billing.adminAdjustCredit(id, "ai", -999, actor, "audit");
    const canceled = await billing.adminCancelMembership(id, actor, "requested");
    assert.equal(canceled.status, "canceled");
    assert.equal(
      (
        await sql`select count(*)::int as count from membership_events where user_id = ${id} and actor_user_id = ${actor}`
      )[0].count,
      4,
    );
    assert.equal(
      (await sql`select ai_credits_remaining from user_memberships where user_id = ${id}`)[0].ai_credits_remaining,
      0,
    );
    await assert.rejects(
      () => billing.adminGrantPlan(id, "missing", actor),
      (error: unknown) => error instanceof BillingError && error.statusCode === 404,
    );

    for (const [requestId, provider, successful] of [
      ["model-1", "gapgpt", true],
      ["model-2", "freeDeepseekAPI", false],
      ["model-3", "gapgpt", true],
    ] as const) {
      await billing.recordModelUsage(id, requestId, "match", {
        provider,
        model: "model",
        inputTokens: 2,
        outputTokens: 3,
        totalTokens: 5,
        tokenSource: "provider",
        estimatedCostMicros: 7,
        statusCode: successful ? 200 : 502,
        successful,
        durationMs: 10,
        attempt: 1,
      });
    }
    await billing.recordModelUsage(id, "model-1", "match", {
      provider: "gapgpt",
      model: "model",
      inputTokens: 2,
      outputTokens: 3,
      totalTokens: 5,
      tokenSource: "provider",
      estimatedCostMicros: 7,
      statusCode: 200,
      successful: true,
      durationMs: 10,
      attempt: 1,
    });
    const usage = await billing.getModelUsageStats(30, 1, 1, "gapgpt");
    assert.equal(usage.totals.requests, 2);
    assert.equal(usage.recentRequests.items.length, 1);
    const memberships = await billing.listMembershipUsers("09120000103", 1, 20, "free", "canceled", "active");
    assert.equal(memberships.total, 1);
    const history = await billing.getAdminMembership(id);
    assert.equal(history.history.length, 4);
  });
});

test("Radicoin daily rewards and plan redemption stay idempotent in PostgreSQL", { timeout: 60_000 }, async () => {
  await withDatabase(async (database, sql) => {
    const id = await user(sql, "09120000105");
    const actor = await user(sql, "09120000106");
    const radicoin = new RadicoinService(database);
    const billing = new BillingService(database, { ...options, radicoinService: radicoin });
    await billing.ensureSignupMembership(id);

    const loginTime = new Date("2026-09-29T08:00:00.000Z");
    await Promise.all([radicoin.grantDailyLogin(id, loginTime), radicoin.grantDailyLogin(id, loginTime)]);
    assert.equal(
      (
        await sql`select count(*)::int as count from radicoin_transactions where user_id = ${id} and source = 'daily_login'`
      )[0].count,
      1,
    );

    await radicoin.adjust(id, 3_000, "اعتبار تست تبدیل پلن", actor, "fund-redemption-test");
    const requestId = randomUUID();
    const first = await billing.redeemPlanWithRadicoins(id, "job-search", requestId);
    const second = await billing.redeemPlanWithRadicoins(id, "job-search", requestId);
    assert.equal(first.expiresAt, second.expiresAt);

    const wallet = (
      await sql`select available_coins, lifetime_spent_coins from radicoin_wallets where user_id = ${id}`
    )[0];
    assert.deepEqual([Number(wallet.available_coins), Number(wallet.lifetime_spent_coins)], [2_002, 1_000]);
    assert.equal(
      (
        await sql`select count(*)::int as count from radicoin_transactions where user_id = ${id} and source = 'redemption'`
      )[0].count,
      1,
    );
    assert.equal(
      (
        await sql`select count(*)::int as count from membership_events where user_id = ${id} and details->>'paymentMethod' = 'radicoin'`
      )[0].count,
      1,
    );
  });
});

test("Hybrid checkout reserves, commits and releases Radicoins atomically", { timeout: 60_000 }, async () => {
  await withDatabase(async (database, sql) => {
    const successfulUser = await user(sql, "09120000107");
    const canceledUser = await user(sql, "09120000108");
    const actor = await user(sql, "09120000109");
    const radicoin = new RadicoinService(database);
    const billing = new BillingService(database, { ...options, radicoinService: radicoin });
    await Promise.all([billing.ensureSignupMembership(successfulUser), billing.ensureSignupMembership(canceledUser)]);
    await Promise.all([
      radicoin.adjust(successfulUser, 400, "اعتبار تست پرداخت ترکیبی", actor, "hybrid-success-fund"),
      radicoin.adjust(canceledUser, 400, "اعتبار تست لغو پرداخت ترکیبی", actor, "hybrid-cancel-fund"),
    ]);

    gateway(billing, "AUTH-HYBRID-SUCCESS");
    const successfulCheckoutKey = randomUUID();
    const successful = await billing.createOrder(
      successfulUser,
      "09120000107",
      "job-search",
      "radicoin",
      successfulCheckoutKey,
    );
    assert.equal(successful.checkout, "gateway");
    if (successful.checkout !== "gateway") throw new Error("expected hybrid gateway checkout");
    assert.deepEqual([successful.appliedCoins, successful.amountRials], [400, 2_994_000]);
    const replay = await billing.createOrder(
      successfulUser,
      "09120000107",
      "job-search",
      "radicoin",
      successfulCheckoutKey,
    );
    assert.equal(replay.checkout, "gateway");
    if (replay.checkout !== "gateway") throw new Error("expected idempotent gateway checkout");
    assert.equal(replay.orderId, successful.orderId);
    assert.equal((await sql`select count(*)::int as count from orders where user_id = ${successfulUser}`)[0].count, 1);
    const reservedWallet = (
      await sql`select available_coins, pending_coins, lifetime_spent_coins from radicoin_wallets where user_id = ${successfulUser}`
    )[0];
    assert.deepEqual(
      [
        Number(reservedWallet.available_coins),
        Number(reservedWallet.pending_coins),
        Number(reservedWallet.lifetime_spent_coins),
      ],
      [0, 400, 0],
    );
    assert.equal(
      (await sql`select status from radicoin_transactions where order_id = ${successful.orderId}`)[0].status,
      "pending",
    );

    await billing.handleCallback("AUTH-HYBRID-SUCCESS", "OK");
    const committedWallet = (
      await sql`select available_coins, pending_coins, lifetime_spent_coins from radicoin_wallets where user_id = ${successfulUser}`
    )[0];
    assert.deepEqual(
      [
        Number(committedWallet.available_coins),
        Number(committedWallet.pending_coins),
        Number(committedWallet.lifetime_spent_coins),
      ],
      [30, 0, 400],
    );
    assert.equal(
      (
        await sql`select status from radicoin_transactions where order_id = ${successful.orderId} and source = 'redemption'`
      )[0].status,
      "available",
    );
    assert.equal(
      (
        await sql`select details->>'paymentMethod' as method from membership_events where order_id = ${successful.orderId}`
      )[0].method,
      "hybrid",
    );

    gateway(billing, "AUTH-HYBRID-CANCELED", false);
    const canceled = await billing.createOrder(canceledUser, "09120000108", "job-search", "radicoin", randomUUID());
    assert.equal(canceled.checkout, "gateway");
    if (canceled.checkout !== "gateway") throw new Error("expected hybrid gateway checkout");
    await billing.handleCallback("AUTH-HYBRID-CANCELED", "NOK");
    const releasedWallet = (
      await sql`select available_coins, pending_coins, lifetime_spent_coins from radicoin_wallets where user_id = ${canceledUser}`
    )[0];
    assert.deepEqual(
      [
        Number(releasedWallet.available_coins),
        Number(releasedWallet.pending_coins),
        Number(releasedWallet.lifetime_spent_coins),
      ],
      [400, 0, 0],
    );
    const canceledTransactions =
      await sql`select source, status, amount from radicoin_transactions where order_id = ${canceled.orderId} order by created_at asc`;
    assert.deepEqual(
      canceledTransactions.map((transaction) => [transaction.source, transaction.status, Number(transaction.amount)]),
      [
        ["redemption", "reversed", -400],
        ["reversal", "available", 400],
      ],
    );

    gateway(billing, "AUTH-HYBRID-RECONCILE", false);
    const pending = await billing.createOrder(canceledUser, "09120000108", "job-search", "radicoin", randomUUID());
    if (pending.checkout !== "gateway") throw new Error("expected hybrid gateway checkout");
    await sql`update orders set created_at = now() - interval '31 minutes' where id = ${pending.orderId}`;
    assert.deepEqual(await billing.reconcilePendingOrders(), {
      scanned: 1,
      paid: 0,
      canceled: 0,
      failed: 1,
      pending: 0,
    });
    const reconciledWallet = (
      await sql`select available_coins, pending_coins, lifetime_spent_coins from radicoin_wallets where user_id = ${canceledUser}`
    )[0];
    assert.deepEqual(
      [
        Number(reconciledWallet.available_coins),
        Number(reconciledWallet.pending_coins),
        Number(reconciledWallet.lifetime_spent_coins),
      ],
      [400, 0, 0],
    );
  });
});
