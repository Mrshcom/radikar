import { randomUUID } from "node:crypto";
import { and, count, desc, eq, ilike, inArray, lte, or, sql } from "drizzle-orm";
import {
  radicoinSettings,
  radicoinTransactions,
  radicoinWallets,
  referrals,
  plans,
  users,
  type Database,
} from "@radikar/database";

export type RadicoinSource =
  | "daily_login"
  | "activity"
  | "referral_signup"
  | "referral_activation"
  | "referral_upgrade"
  | "purchase"
  | "campaign"
  | "birthday"
  | "admin_adjustment"
  | "redemption"
  | "reversal";

type Executor = Pick<Database, "execute" | "insert" | "select" | "update">;
type CoinStatus = "pending" | "available" | "reversed" | "expired";

type CreditInput = {
  userId: string;
  amount: number;
  source: RadicoinSource;
  idempotencyKey: string;
  description: string;
  awardDay?: string;
  referralId?: string;
  orderId?: string;
  bucket?: "earned" | "promotional";
  status?: CoinStatus;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
};

export type RadicoinSettingsInput = Omit<typeof radicoinSettings.$inferInsert, "id" | "updatedAt">;

function tehranDay(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export class RadicoinError extends Error {
  constructor(readonly statusCode: number, message: string) {
    super(message);
  }
}

export class RadicoinService {
  constructor(private readonly database: Database) {}

  private async settings(executor: Executor) {
    await executor
      .insert(radicoinSettings)
      .values({ id: "default", updatedAt: new Date() })
      .onConflictDoNothing();
    const [settings] = await executor
      .select()
      .from(radicoinSettings)
      .where(eq(radicoinSettings.id, "default"))
      .limit(1);
    if (!settings) throw new Error("Radicoin settings are unavailable");
    return settings;
  }

  private async ensureWallet(executor: Executor, userId: string, now: Date) {
    await executor
      .insert(radicoinWallets)
      .values({ userId, updatedAt: now })
      .onConflictDoNothing();
    await executor.execute(sql`select user_id from radicoin_wallets where user_id = ${userId} for update`);
  }

  private async expirePromotionalCoins(executor: Executor, userId: string, now: Date) {
    const expired = await executor
      .select({ id: radicoinTransactions.id, amount: radicoinTransactions.amount })
      .from(radicoinTransactions)
      .where(
        and(
          eq(radicoinTransactions.userId, userId),
          eq(radicoinTransactions.bucket, "promotional"),
          eq(radicoinTransactions.status, "available"),
          lte(radicoinTransactions.expiresAt, now),
        ),
      );
    if (!expired.length) return;
    const total = expired.reduce((sum, entry) => sum + entry.amount, 0);
    await executor
      .update(radicoinTransactions)
      .set({ status: "expired" })
      .where(inArray(radicoinTransactions.id, expired.map((entry) => entry.id)));
    await executor
      .update(radicoinWallets)
      .set({
        availableCoins: sql`${radicoinWallets.availableCoins} - ${total}`,
        updatedAt: now,
      })
      .where(eq(radicoinWallets.userId, userId));
  }

  private async creditInTransaction(executor: Executor, input: CreditInput, now: Date) {
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
      throw new RadicoinError(400, "مقدار رادیکوین باید عدد صحیح مثبت باشد.");
    }
    await this.ensureWallet(executor, input.userId, now);
    const status = input.status ?? "available";
    const [created] = await executor
      .insert(radicoinTransactions)
      .values({
        id: randomUUID(),
        userId: input.userId,
        referralId: input.referralId ?? null,
        orderId: input.orderId ?? null,
        source: input.source,
        bucket: input.bucket ?? "earned",
        status,
        amount: input.amount,
        idempotencyKey: input.idempotencyKey,
        awardDay: input.awardDay ?? null,
        description: input.description,
        metadata: input.metadata,
        availableAt: status === "available" ? now : null,
        expiresAt: input.expiresAt ?? null,
        createdAt: now,
      })
      .onConflictDoNothing()
      .returning({ id: radicoinTransactions.id });
    if (!created) return false;
    await executor
      .update(radicoinWallets)
      .set(
        status === "pending"
          ? {
              pendingCoins: sql`${radicoinWallets.pendingCoins} + ${input.amount}`,
              updatedAt: now,
            }
          : {
              availableCoins: sql`${radicoinWallets.availableCoins} + ${input.amount}`,
              lifetimeEarnedCoins: sql`${radicoinWallets.lifetimeEarnedCoins} + ${input.amount}`,
              updatedAt: now,
            },
      )
      .where(eq(radicoinWallets.userId, input.userId));
    return true;
  }

  async grantDailyLogin(userId: string, now = new Date()) {
    const awardDay = tehranDay(now);
    return this.database.transaction(async (tx) => {
      const settings = await this.settings(tx);
      return this.creditInTransaction(
        tx,
        {
          userId,
          amount: settings.dailyLoginCoins,
          source: "daily_login",
          idempotencyKey: `daily-login:${userId}:${awardDay}`,
          awardDay,
          description: "پاداش ورود روزانه",
        },
        now,
      );
    });
  }

  async grantReferralSignup(referralId: string, referrerUserId: string, referredUserId: string, now = new Date()) {
    return this.database.transaction((tx) =>
      this.grantReferralSignupInTransaction(tx, referralId, referrerUserId, referredUserId, now),
    );
  }

  async grantReferralSignupInTransaction(executor: Executor, referralId: string, referrerUserId: string, referredUserId: string, now = new Date()) {
    const settings = await this.settings(executor);
    await this.creditInTransaction(executor, {
      userId: referrerUserId,
      amount: settings.referrerSignupCoins,
      source: "referral_signup",
      idempotencyKey: `referral-signup:${referralId}:referrer`,
      referralId,
      description: "رادیکوین دعوتِ ثبت‌نام تأییدشده",
    }, now);
    return this.creditInTransaction(executor, {
      userId: referredUserId,
      amount: settings.referredSignupCoins,
      source: "referral_signup",
      idempotencyKey: `referral-signup:${referralId}:referred`,
      referralId,
      description: "هدیه عضویت با دعوت",
    }, now);
  }

  async grantReferralActivation(userId: string, qualifyingEventId: string, now = new Date()) {
    return this.database.transaction(async (tx) => {
      const [referral] = await tx
        .select()
        .from(referrals)
        .where(and(eq(referrals.referredUserId, userId), eq(referrals.status, "confirmed")))
        .limit(1);
      if (!referral) return false;
      const settings = await this.settings(tx);
      const referrerGranted = await this.creditInTransaction(tx, {
        userId: referral.referrerUserId,
        amount: settings.referrerActivationCoins,
        source: "referral_activation",
        idempotencyKey: `referral-activation:${referral.id}:referrer`,
        referralId: referral.id,
        description: "رادیکوین اولین فعالیت جدی دعوت‌شونده",
        metadata: { qualifyingEventId },
      }, now);
      await this.creditInTransaction(tx, {
        userId,
        amount: settings.referredActivationCoins,
        source: "referral_activation",
        idempotencyKey: `referral-activation:${referral.id}:referred`,
        referralId: referral.id,
        description: "هدیه اولین فعالیت جدی",
        metadata: { qualifyingEventId },
      }, now);
      return referrerGranted;
    });
  }

  async grantReferralUpgradeInTransaction(executor: Executor, userId: string, orderId: string, now = new Date()) {
    const [referral] = await executor
      .select()
      .from(referrals)
      .where(and(eq(referrals.referredUserId, userId), eq(referrals.status, "confirmed")))
      .limit(1);
    if (!referral) return false;
    const settings = await this.settings(executor);
    return this.creditInTransaction(executor, {
      userId: referral.referrerUserId,
      amount: settings.referrerUpgradeCoins,
      source: "referral_upgrade",
      idempotencyKey: `referral-upgrade:${referral.id}:${orderId}`,
      referralId: referral.id,
      orderId,
      description: "رادیکوین ارتقای حساب دعوت‌شونده",
    }, now);
  }

  async grantPurchaseInTransaction(executor: Executor, userId: string, orderId: string, now = new Date()) {
    const settings = await this.settings(executor);
    return this.creditInTransaction(executor, {
      userId,
      amount: settings.purchaserCoins,
      source: "purchase",
      idempotencyKey: `purchase:${orderId}`,
      orderId,
      description: "رادیکوین هدیه خرید بسته",
    }, now);
  }

  async grantUsageActivityInTransaction(executor: Executor, userId: string, requestId: string, now = new Date()) {
    const settings = await this.settings(executor);
    const awardDay = tehranDay(now);
    const [total] = await executor
      .select({ value: sql<number>`coalesce(sum(${radicoinTransactions.amount}), 0)` })
      .from(radicoinTransactions)
      .where(
        and(
          eq(radicoinTransactions.userId, userId),
          eq(radicoinTransactions.awardDay, awardDay),
          eq(radicoinTransactions.source, "activity"),
          eq(radicoinTransactions.status, "available"),
        ),
      );
    const remaining = Math.max(0, settings.dailyActivityCoinCap - Number(total?.value ?? 0));
    if (!remaining) return false;
    return this.creditInTransaction(executor, {
      userId,
      amount: Math.min(settings.activityCoins, remaining),
      source: "activity",
      idempotencyKey: `activity:${requestId}`,
      awardDay,
      description: "رادیکوین فعالیت هزینه‌بر",
    }, now);
  }

  async spend(userId: string, coins: number, idempotencyKey: string, description: string) {
    if (!Number.isInteger(coins) || coins <= 0) {
      throw new RadicoinError(400, "مقدار مصرف رادیکوین معتبر نیست.");
    }
    return this.database.transaction(async (tx) => {
      const now = new Date();
      await this.ensureWallet(tx, userId, now);
      await this.expirePromotionalCoins(tx, userId, now);
      const [existing] = await tx
        .select({ id: radicoinTransactions.id })
        .from(radicoinTransactions)
        .where(eq(radicoinTransactions.idempotencyKey, idempotencyKey))
        .limit(1);
      if (existing) return existing.id;
      const [wallet] = await tx
        .select()
        .from(radicoinWallets)
        .where(eq(radicoinWallets.userId, userId))
        .limit(1);
      if (!wallet || wallet.availableCoins < coins) {
        throw new RadicoinError(402, "موجودی رادیکوین کافی نیست.");
      }
      const [transaction] = await tx
        .insert(radicoinTransactions)
        .values({
          id: randomUUID(), userId, source: "redemption", bucket: "earned", status: "available",
          amount: -coins, idempotencyKey, description, availableAt: now, createdAt: now,
        })
        .returning({ id: radicoinTransactions.id });
      await tx.update(radicoinWallets).set({
        availableCoins: sql`${radicoinWallets.availableCoins} - ${coins}`,
        lifetimeSpentCoins: sql`${radicoinWallets.lifetimeSpentCoins} + ${coins}`,
        updatedAt: now,
      }).where(eq(radicoinWallets.userId, userId));
      return transaction!.id;
    });
  }

  async spendInTransaction(executor: Executor, userId: string, coins: number, idempotencyKey: string, description: string, now = new Date()) {
    if (!Number.isInteger(coins) || coins <= 0) throw new RadicoinError(400, "مقدار مصرف رادیکوین معتبر نیست.");
    await this.ensureWallet(executor, userId, now);
    await this.expirePromotionalCoins(executor, userId, now);
    const [existing] = await executor.select({ id: radicoinTransactions.id }).from(radicoinTransactions).where(eq(radicoinTransactions.idempotencyKey, idempotencyKey)).limit(1);
    if (existing) return { id: existing.id, created: false };
    const [wallet] = await executor.select().from(radicoinWallets).where(eq(radicoinWallets.userId, userId)).limit(1);
    if (!wallet || wallet.availableCoins < coins) throw new RadicoinError(402, "موجودی رادیکوین کافی نیست.");
    const [entry] = await executor.insert(radicoinTransactions).values({ id: randomUUID(), userId, source: "redemption", bucket: "earned", status: "available", amount: -coins, idempotencyKey, description, availableAt: now, createdAt: now }).returning({ id: radicoinTransactions.id });
    await executor.update(radicoinWallets).set({ availableCoins: sql`${radicoinWallets.availableCoins} - ${coins}`, lifetimeSpentCoins: sql`${radicoinWallets.lifetimeSpentCoins} + ${coins}`, updatedAt: now }).where(eq(radicoinWallets.userId, userId));
    return { id: entry!.id, created: true };
  }

  async reserveSpendInTransaction(executor: Executor, userId: string, maxCoins: number, orderId: string, description: string, now = new Date()) {
    if (!Number.isInteger(maxCoins) || maxCoins < 0) throw new RadicoinError(400, "مقدار رزرو رادیکوین معتبر نیست.");
    if (maxCoins === 0) return { coins: 0, created: false };
    const idempotencyKey = `checkout-reservation:${orderId}`;
    await this.ensureWallet(executor, userId, now);
    await this.expirePromotionalCoins(executor, userId, now);
    await executor.execute(sql`select user_id from radicoin_wallets where user_id = ${userId} for update`);
    const [existing] = await executor.select({ id: radicoinTransactions.id, amount: radicoinTransactions.amount }).from(radicoinTransactions).where(eq(radicoinTransactions.idempotencyKey, idempotencyKey)).limit(1);
    if (existing) return { coins: Math.abs(existing.amount), created: false };
    const [wallet] = await executor.select({ availableCoins: radicoinWallets.availableCoins }).from(radicoinWallets).where(eq(radicoinWallets.userId, userId)).limit(1);
    const coins = Math.min(maxCoins, wallet?.availableCoins ?? 0);
    if (coins <= 0) return { coins: 0, created: false };
    const [entry] = await executor.insert(radicoinTransactions).values({
      id: randomUUID(), userId, orderId, source: "redemption", bucket: "earned", status: "pending",
      amount: -coins, idempotencyKey, description, metadata: { kind: "hybrid_payment_reservation" }, createdAt: now,
    }).returning({ id: radicoinTransactions.id });
    await executor.update(radicoinWallets).set({
      availableCoins: sql`${radicoinWallets.availableCoins} - ${coins}`,
      pendingCoins: sql`${radicoinWallets.pendingCoins} + ${coins}`,
      updatedAt: now,
    }).where(eq(radicoinWallets.userId, userId));
    return { coins, created: true, id: entry!.id };
  }

  async commitReservedSpendInTransaction(executor: Executor, orderId: string, now = new Date()) {
    const [entry] = await executor.update(radicoinTransactions).set({ status: "available", availableAt: now }).where(and(
      eq(radicoinTransactions.orderId, orderId),
      eq(radicoinTransactions.source, "redemption"),
      eq(radicoinTransactions.status, "pending"),
    )).returning({ userId: radicoinTransactions.userId, amount: radicoinTransactions.amount });
    if (!entry) return 0;
    const coins = Math.abs(entry.amount);
    await executor.update(radicoinWallets).set({
      pendingCoins: sql`greatest(${radicoinWallets.pendingCoins} - ${coins}, 0)`,
      lifetimeSpentCoins: sql`${radicoinWallets.lifetimeSpentCoins} + ${coins}`,
      updatedAt: now,
    }).where(eq(radicoinWallets.userId, entry.userId));
    return coins;
  }

  async releaseReservedSpendInTransaction(executor: Executor, orderId: string, now = new Date()) {
    const [entry] = await executor.update(radicoinTransactions).set({ status: "reversed" }).where(and(
      eq(radicoinTransactions.orderId, orderId),
      eq(radicoinTransactions.source, "redemption"),
      eq(radicoinTransactions.status, "pending"),
    )).returning({
      id: radicoinTransactions.id,
      userId: radicoinTransactions.userId,
      orderId: radicoinTransactions.orderId,
      bucket: radicoinTransactions.bucket,
      amount: radicoinTransactions.amount,
    });
    if (!entry) return 0;
    const coins = Math.abs(entry.amount);
    await executor.insert(radicoinTransactions).values({
      id: randomUUID(),
      userId: entry.userId,
      orderId: entry.orderId,
      source: "reversal",
      bucket: entry.bucket,
      status: "available",
      amount: coins,
      idempotencyKey: `reversal:${entry.id}`,
      description: "بازگشت رادیکوین از تراکنش لغوشده",
      metadata: { reversedTransactionId: entry.id },
      availableAt: now,
      createdAt: now,
    }).onConflictDoNothing();
    await executor.update(radicoinWallets).set({
      availableCoins: sql`${radicoinWallets.availableCoins} + ${coins}`,
      pendingCoins: sql`greatest(${radicoinWallets.pendingCoins} - ${coins}, 0)`,
      updatedAt: now,
    }).where(eq(radicoinWallets.userId, entry.userId));
    return coins;
  }

  async getAdminSettings() {
    const [settings, storePlans] = await Promise.all([
      this.settings(this.database),
      this.database.select({ id: plans.id, name: plans.name, radicoinCost: plans.radicoinCost, isActive: plans.isActive }).from(plans).orderBy(plans.sortOrder),
    ]);
    return { settings, plans: storePlans };
  }

  async updateAdminSettings(input: RadicoinSettingsInput, planCosts: Array<{ id: string; radicoinCost: number | null }>) {
    return this.database.transaction(async (tx) => {
      await this.settings(tx);
      const [settings] = await tx.update(radicoinSettings).set({ ...input, updatedAt: new Date() }).where(eq(radicoinSettings.id, "default")).returning();
      for (const plan of planCosts) await tx.update(plans).set({ radicoinCost: plan.radicoinCost, updatedAt: new Date() }).where(eq(plans.id, plan.id));
      return settings!;
    });
  }

  async listWallets(search = "", page = 1, pageSize = 20) {
    const filter = search.trim() ? or(ilike(users.fullName, `%${search.trim()}%`), ilike(users.phone, `%${search.trim()}%`), ilike(users.email, `%${search.trim()}%`)) : undefined;
    const [items, totals] = await Promise.all([
      this.database.select({ user: { id: users.id, fullName: users.fullName, phone: users.phone, email: users.email }, wallet: radicoinWallets }).from(users).leftJoin(radicoinWallets, eq(radicoinWallets.userId, users.id)).where(and(eq(users.role, "user"), filter)).orderBy(desc(radicoinWallets.availableCoins), desc(users.createdAt)).limit(pageSize).offset((page - 1) * pageSize),
      this.database.select({ value: count() }).from(users).where(and(eq(users.role, "user"), filter)),
    ]);
    return { items, total: Number(totals[0]?.value ?? 0), page, pageSize };
  }

  async grantPromotional(userId: string, amount: number, description: string, expiresAt: Date | undefined, actorUserId: string, idempotencyKey: string) {
    return this.database.transaction((tx) => this.creditInTransaction(tx, { userId, amount, source: "campaign", bucket: "promotional", idempotencyKey: `campaign:${actorUserId}:${idempotencyKey}`, description, expiresAt, metadata: { actorUserId } }, new Date()));
  }

  async revokeUsageActivityInTransaction(executor: Executor, userId: string, requestId: string, now = new Date()) {
    await this.ensureWallet(executor, userId, now);
    const [entry] = await executor
      .select({ id: radicoinTransactions.id, amount: radicoinTransactions.amount })
      .from(radicoinTransactions)
      .where(and(
        eq(radicoinTransactions.userId, userId),
        eq(radicoinTransactions.idempotencyKey, `activity:${requestId}`),
        eq(radicoinTransactions.status, "available"),
      ))
      .limit(1);
    if (!entry) return false;
    await executor.update(radicoinTransactions).set({ status: "reversed" }).where(eq(radicoinTransactions.id, entry.id));
    await executor.update(radicoinWallets).set({
      availableCoins: sql`${radicoinWallets.availableCoins} - ${entry.amount}`,
      lifetimeEarnedCoins: sql`${radicoinWallets.lifetimeEarnedCoins} - ${entry.amount}`,
      updatedAt: now,
    }).where(eq(radicoinWallets.userId, userId));
    return true;
  }

  async adjust(userId: string, amount: number, description: string, actorUserId: string, requestId: string = randomUUID()) {
    if (!Number.isInteger(amount) || amount === 0) {
      throw new RadicoinError(400, "اصلاح رادیکوین معتبر نیست.");
    }
    const idempotencyKey = `admin-adjustment:${actorUserId}:${requestId}`;
    if (amount > 0) {
      return this.database.transaction((tx) => this.creditInTransaction(tx, {
        userId, amount, source: "admin_adjustment", idempotencyKey, description,
        metadata: { actorUserId },
      }, new Date()));
    }
    return this.database.transaction(async (tx) => {
      const now = new Date();
      await this.ensureWallet(tx, userId, now);
      await this.expirePromotionalCoins(tx, userId, now);
      const [existing] = await tx.select({ id: radicoinTransactions.id }).from(radicoinTransactions).where(eq(radicoinTransactions.idempotencyKey, idempotencyKey)).limit(1);
      if (existing) return existing.id;
      const [wallet] = await tx.select().from(radicoinWallets).where(eq(radicoinWallets.userId, userId)).limit(1);
      if (!wallet || wallet.availableCoins < Math.abs(amount)) {
        throw new RadicoinError(409, "کسر رادیکوین از موجودی قابل‌استفاده بیشتر است.");
      }
      const [entry] = await tx.insert(radicoinTransactions).values({
        id: randomUUID(), userId, source: "admin_adjustment", bucket: "earned", status: "available",
        amount, idempotencyKey, description, metadata: { actorUserId }, availableAt: now, createdAt: now,
      }).returning({ id: radicoinTransactions.id });
      await tx.update(radicoinWallets).set({
        availableCoins: sql`${radicoinWallets.availableCoins} + ${amount}`,
        updatedAt: now,
      }).where(eq(radicoinWallets.userId, userId));
      return entry!.id;
    });
  }

  async getWallet(userId: string, limit = 30) {
    await this.database.transaction(async (tx) => {
      await this.ensureWallet(tx, userId, new Date());
      await this.expirePromotionalCoins(tx, userId, new Date());
    });
    const [walletRows, transactions] = await Promise.all([
      this.database.select().from(radicoinWallets).where(eq(radicoinWallets.userId, userId)).limit(1),
      this.database.select().from(radicoinTransactions).where(eq(radicoinTransactions.userId, userId)).orderBy(desc(radicoinTransactions.createdAt)).limit(limit),
    ]);
    return { wallet: walletRows[0] ?? null, transactions };
  }
}
