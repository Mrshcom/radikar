import { randomBytes, randomUUID } from "node:crypto";
import { and, count, desc, eq, gt, ilike, or, sql } from "drizzle-orm";
import {
  membershipEvents,
  orders,
  payments,
  plans,
  usageEvents,
  userMemberships,
  users,
  type Database,
} from "@radicar/database";
import { ZarinpalClient, ZarinpalError } from "./zarinpal-client";

export class BillingError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000);
}

function addLimit(current: number | null, grant: number | null) {
  if (grant === null || current === null) return null;
  return current + grant;
}

function orderNumber() {
  return `RM-${Date.now()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export type BillingServiceOptions = {
  apiPublicUrl: string;
  webAppUrl: string;
  zarinpalBaseUrl: string;
  zarinpalMerchantId: string;
};

export type UsageResource = "resume" | "pdf" | "ai" | "match" | "interview";
export type UsageCosts = Partial<Record<UsageResource, number>>;

export class BillingService {
  private readonly gateway: ZarinpalClient;

  constructor(
    private readonly database: Database,
    private readonly options: BillingServiceOptions,
  ) {
    this.gateway = new ZarinpalClient(
      options.zarinpalBaseUrl,
      options.zarinpalMerchantId,
    );
  }

  listPlans() {
    return this.database
      .select()
      .from(plans)
      .where(eq(plans.isActive, true))
      .orderBy(plans.sortOrder);
  }

  async ensureSignupMembership(userId: string) {
    const [existing] = await this.database
      .select({ id: userMemberships.id })
      .from(userMemberships)
      .where(eq(userMemberships.userId, userId))
      .limit(1);
    if (existing) return;

    const [freePlan] = await this.database
      .select()
      .from(plans)
      .where(and(eq(plans.id, "free"), eq(plans.isActive, true)))
      .limit(1);
    if (!freePlan) throw new BillingError(503, "پلن رایگان هنوز پیکربندی نشده است.");

    const now = new Date();
    const membershipId = randomUUID();
    const inserted = await this.database
      .insert(userMemberships)
      .values({
        id: membershipId,
        userId,
        planId: freePlan.id,
        status: "active",
        startsAt: now,
        expiresAt: addDays(now, freePlan.durationDays),
        freeGrantedAt: now,
        resumesRemaining: freePlan.resumeLimit,
        pdfDownloadsRemaining: freePlan.pdfDownloadLimit,
        aiCreditsRemaining: freePlan.aiCredits,
        matchCreditsRemaining: freePlan.matchCredits,
        interviewCreditsRemaining: freePlan.interviewCredits,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({ target: userMemberships.userId })
      .returning({ id: userMemberships.id });
    if (!inserted.length) return;
    await this.database.insert(membershipEvents).values({
      id: randomUUID(),
      userId,
      membershipId,
      planId: freePlan.id,
      type: "signup_grant",
      durationDays: freePlan.durationDays,
      details: { oneTime: true },
      createdAt: now,
    });
  }

  async getMembership(userId: string) {
    await this.ensureSignupMembership(userId);
    const [row] = await this.database
      .select({ membership: userMemberships, plan: plans })
      .from(userMemberships)
      .innerJoin(plans, eq(userMemberships.planId, plans.id))
      .where(eq(userMemberships.userId, userId))
      .limit(1);
    if (!row) throw new BillingError(404, "عضویت کاربر پیدا نشد.");
    const expired = row.membership.expiresAt <= new Date();
    return {
      ...row.membership,
      status: expired && row.membership.status === "active" ? "expired" : row.membership.status,
      plan: row.plan,
    };
  }

  async consumeUsage(
    userId: string,
    costs: UsageCosts,
    operation: string,
    requestId: string,
  ) {
    await this.ensureSignupMembership(userId);
    const entries = Object.entries(costs).filter(
      (entry): entry is [UsageResource, number] =>
        typeof entry[1] === "number" && entry[1] > 0,
    );
    if (!entries.length) return;
    await this.database.transaction(async (tx) => {
      await tx.execute(sql`select id from user_memberships where user_id = ${userId} for update`);
      const [membership] = await tx
        .select()
        .from(userMemberships)
        .where(eq(userMemberships.userId, userId))
        .limit(1);
      if (!membership || membership.status !== "active" || membership.expiresAt <= new Date()) {
        throw new BillingError(402, "اعتبار پلن شما منقضی شده است؛ برای ادامه بسته را تمدید کن.");
      }
      const fields = {
        resume: "resumesRemaining",
        pdf: "pdfDownloadsRemaining",
        ai: "aiCreditsRemaining",
        match: "matchCreditsRemaining",
        interview: "interviewCreditsRemaining",
      } as const;
      const changes: Partial<typeof userMemberships.$inferInsert> = { updatedAt: new Date() };
      for (const [resource, units] of entries) {
        const field = fields[resource];
        const current = membership[field];
        if (current !== null && current < units) {
          throw new BillingError(402, `اعتبار ${resource} این پلن کافی نیست.`);
        }
        if (current !== null) changes[field] = current - units;
      }
      await tx.update(userMemberships).set(changes).where(eq(userMemberships.id, membership.id));
      await tx.insert(usageEvents).values(
        entries.map(([resource, units]) => ({
          id: randomUUID(),
          userId,
          membershipId: membership.id,
          resource,
          units: -units,
          operation,
          requestId: `${requestId}:${resource}`,
          createdAt: new Date(),
        })),
      );
    });
  }

  async refundUsage(
    userId: string,
    costs: UsageCosts,
    operation: string,
    requestId: string,
  ) {
    const entries = Object.entries(costs).filter(
      (entry): entry is [UsageResource, number] =>
        typeof entry[1] === "number" && entry[1] > 0,
    );
    if (!entries.length) return;
    await this.database.transaction(async (tx) => {
      await tx.execute(sql`select id from user_memberships where user_id = ${userId} for update`);
      const [membership] = await tx
        .select()
        .from(userMemberships)
        .where(eq(userMemberships.userId, userId))
        .limit(1);
      if (!membership) return;
      const fields = {
        resume: "resumesRemaining",
        pdf: "pdfDownloadsRemaining",
        ai: "aiCreditsRemaining",
        match: "matchCreditsRemaining",
        interview: "interviewCreditsRemaining",
      } as const;
      const changes: Partial<typeof userMemberships.$inferInsert> = { updatedAt: new Date() };
      for (const [resource, units] of entries) {
        const field = fields[resource];
        const current = membership[field];
        if (current !== null) changes[field] = current + units;
      }
      await tx.update(userMemberships).set(changes).where(eq(userMemberships.id, membership.id));
      await tx.insert(usageEvents).values(
        entries.map(([resource, units]) => ({
          id: randomUUID(),
          userId,
          membershipId: membership.id,
          resource,
          units,
          operation: `${operation}:refund`,
          requestId: `${requestId}:refund:${resource}`,
          createdAt: new Date(),
        })),
      );
    });
  }

  async listUserOrders(userId: string, page = 1, pageSize = 20) {
    const [items, totalRows] = await Promise.all([
      this.database
        .select({ order: orders, plan: plans })
        .from(orders)
        .innerJoin(plans, eq(orders.planId, plans.id))
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.database.select({ total: count() }).from(orders).where(eq(orders.userId, userId)),
    ]);
    return { items, total: totalRows[0]?.total ?? 0, page, pageSize };
  }

  async createOrder(userId: string, phone: string, planId: string) {
    const [plan] = await this.database
      .select()
      .from(plans)
      .where(and(eq(plans.id, planId), eq(plans.isActive, true)))
      .limit(1);
    if (!plan || !plan.isPurchasable || plan.priceRials <= 0) {
      throw new BillingError(400, "این پلن قابل خرید نیست.");
    }

    const membership = await this.getMembership(userId);
    if (
      membership.status === "active" &&
      membership.expiresAt > new Date() &&
      membership.plan.sortOrder > plan.sortOrder
    ) {
      throw new BillingError(
        409,
        "خرید پلن پایین‌تر پس از پایان عضویت فعلی امکان‌پذیر است.",
      );
    }

    const now = new Date();
    const id = randomUUID();
    const number = orderNumber();
    await this.database.insert(orders).values({
      id,
      orderNumber: number,
      userId,
      planId: plan.id,
      amountRials: plan.priceRials,
      createdAt: now,
      updatedAt: now,
    });

    try {
      const result = await this.gateway.requestPayment({
        amountRials: plan.priceRials,
        callbackUrl: `${this.options.apiPublicUrl}/api/billing/callback`,
        description: `خرید پلن ${plan.name} - سفارش ${number}`,
        mobile: phone,
      });
      await this.database.transaction(async (tx) => {
        await tx
          .update(orders)
          .set({ authority: result.authority, updatedAt: new Date() })
          .where(eq(orders.id, id));
        await tx.insert(payments).values({
          id: randomUUID(),
          orderId: id,
          authority: result.authority,
          amountRials: plan.priceRials,
          providerData: result.providerData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
      return { orderId: id, orderNumber: number, paymentUrl: result.paymentUrl };
    } catch (error) {
      const failure = error instanceof ZarinpalError ? error : undefined;
      await this.database
        .update(orders)
        .set({
          status: "failed",
          failureCode: failure?.code,
          failureMessage: error instanceof Error ? error.message : "خطای درگاه",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id));
      throw new BillingError(502, "ساخت تراکنش در درگاه زرین‌پال ناموفق بود.");
    }
  }

  async handleCallback(authority: string, callbackStatus: string) {
    const [row] = await this.database
      .select({ order: orders, plan: plans })
      .from(orders)
      .innerJoin(plans, eq(orders.planId, plans.id))
      .where(eq(orders.authority, authority))
      .limit(1);
    if (!row) throw new BillingError(404, "سفارش مربوط به پرداخت پیدا نشد.");

    const resultUrl = new URL("/billing/result", this.options.webAppUrl);
    resultUrl.searchParams.set("order", row.order.id);
    if (row.order.status === "paid") {
      resultUrl.searchParams.set("status", "success");
      return resultUrl.toString();
    }
    if (callbackStatus !== "OK") {
      const now = new Date();
      await this.database.transaction(async (tx) => {
        await tx
          .update(orders)
          .set({ status: "canceled", callbackStatus, updatedAt: now })
          .where(eq(orders.id, row.order.id));
        await tx
          .update(payments)
          .set({ status: "canceled", updatedAt: now })
          .where(eq(payments.authority, authority));
      });
      resultUrl.searchParams.set("status", "canceled");
      return resultUrl.toString();
    }

    try {
      const verification = await this.gateway.verifyPayment({
        authority,
        amountRials: row.order.amountRials,
      });
      const now = new Date();
      await this.database.transaction(async (tx) => {
        const locked = await tx.execute(sql`
          select id, status from orders where id = ${row.order.id} for update
        `);
        const current = locked[0] as { status?: string } | undefined;
        if (current?.status === "paid") return;

        const [currentMembership] = await tx
          .select({ membership: userMemberships, plan: plans })
          .from(userMemberships)
          .innerJoin(plans, eq(userMemberships.planId, plans.id))
          .where(eq(userMemberships.userId, row.order.userId))
          .limit(1);
        if (!currentMembership) throw new BillingError(409, "عضویت کاربر آماده فعال‌سازی نیست.");
        if (
          currentMembership.membership.status === "active" &&
          currentMembership.membership.expiresAt > now &&
          currentMembership.plan.sortOrder > row.plan.sortOrder
        ) {
          throw new BillingError(409, "پلن خریداری‌شده پایین‌تر از پلن فعال است.");
        }

        const active =
          currentMembership.membership.status === "active" &&
          currentMembership.membership.expiresAt > now;
        const baseExpiry = active ? currentMembership.membership.expiresAt : now;
        const eventType =
          currentMembership.plan.id === row.plan.id
            ? "renewal"
            : active
              ? "upgrade"
              : "purchase";
        await tx
          .update(userMemberships)
          .set({
            planId: row.plan.id,
            status: "active",
            startsAt: now,
            expiresAt: addDays(baseExpiry, row.plan.durationDays),
            resumesRemaining: addLimit(
              currentMembership.membership.resumesRemaining,
              row.plan.resumeLimit,
            ),
            pdfDownloadsRemaining: addLimit(
              currentMembership.membership.pdfDownloadsRemaining,
              row.plan.pdfDownloadLimit,
            ),
            aiCreditsRemaining:
              currentMembership.membership.aiCreditsRemaining + row.plan.aiCredits,
            matchCreditsRemaining:
              currentMembership.membership.matchCreditsRemaining + row.plan.matchCredits,
            interviewCreditsRemaining:
              currentMembership.membership.interviewCreditsRemaining +
              row.plan.interviewCredits,
            canceledAt: null,
            canceledByUserId: null,
            cancelReason: null,
            updatedAt: now,
          })
          .where(eq(userMemberships.id, currentMembership.membership.id));
        await tx.insert(membershipEvents).values({
          id: randomUUID(),
          userId: row.order.userId,
          membershipId: currentMembership.membership.id,
          planId: row.plan.id,
          orderId: row.order.id,
          type: eventType,
          durationDays: row.plan.durationDays,
          createdAt: now,
        });
        await tx
          .update(orders)
          .set({
            status: "paid",
            callbackStatus,
            refId: verification.refId,
            paidAt: now,
            updatedAt: now,
          })
          .where(eq(orders.id, row.order.id));
        await tx
          .update(payments)
          .set({
            status: "verified",
            providerCode: verification.code,
            refId: verification.refId,
            cardPan: verification.cardPan,
            cardHash: verification.cardHash,
            providerData: verification.providerData,
            verifiedAt: now,
            updatedAt: now,
          })
          .where(eq(payments.authority, authority));
      });
      resultUrl.searchParams.set("status", "success");
      return resultUrl.toString();
    } catch (error) {
      const failure = error instanceof ZarinpalError ? error : undefined;
      await this.database.transaction(async (tx) => {
        await tx
          .update(orders)
          .set({
            status: "failed",
            callbackStatus,
            failureCode: failure?.code,
            failureMessage: error instanceof Error ? error.message : "خطای تأیید پرداخت",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, row.order.id));
        await tx
          .update(payments)
          .set({ status: "failed", providerCode: failure?.code, updatedAt: new Date() })
          .where(eq(payments.authority, authority));
      });
      resultUrl.searchParams.set("status", "failed");
      return resultUrl.toString();
    }
  }

  async listAdminOrders(search = "", page = 1, pageSize = 20) {
    const filter = search.trim()
      ? or(
          ilike(orders.orderNumber, `%${search.trim()}%`),
          ilike(users.phone, `%${search.trim()}%`),
        )
      : undefined;
    const [items, totals] = await Promise.all([
      this.database
        .select({ order: orders, plan: plans, user: users })
        .from(orders)
        .innerJoin(plans, eq(orders.planId, plans.id))
        .innerJoin(users, eq(orders.userId, users.id))
        .where(filter)
        .orderBy(desc(orders.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.database
        .select({ total: count() })
        .from(orders)
        .innerJoin(users, eq(orders.userId, users.id))
        .where(filter),
    ]);
    return { items, total: totals[0]?.total ?? 0, page, pageSize };
  }

  async getBillingStats() {
    const [row] = await this.database
      .select({
        totalOrders: count(),
        paidOrders: sql<number>`count(*) filter (where ${orders.status} = 'paid')`,
        pendingOrders: sql<number>`count(*) filter (where ${orders.status} = 'pending')`,
        revenueRials: sql<number>`coalesce(sum(${orders.amountRials}) filter (where ${orders.status} = 'paid'), 0)`,
      })
      .from(orders);
    return {
      totalOrders: Number(row?.totalOrders ?? 0),
      paidOrders: Number(row?.paidOrders ?? 0),
      pendingOrders: Number(row?.pendingOrders ?? 0),
      revenueRials: Number(row?.revenueRials ?? 0),
    };
  }

  async listAdminPayments(page = 1, pageSize = 20) {
    const [items, totals] = await Promise.all([
      this.database
        .select({ payment: payments, order: orders, user: users })
        .from(payments)
        .innerJoin(orders, eq(payments.orderId, orders.id))
        .innerJoin(users, eq(orders.userId, users.id))
        .orderBy(desc(payments.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.database.select({ total: count() }).from(payments),
    ]);
    return { items, total: totals[0]?.total ?? 0, page, pageSize };
  }

  async listMembershipUsers(search = "", page = 1, pageSize = 20) {
    const filter = search.trim()
      ? or(
          ilike(users.phone, `%${search.trim()}%`),
          ilike(users.fullName, `%${search.trim()}%`),
        )
      : undefined;
    const [items, totals] = await Promise.all([
      this.database
        .select({ user: users, membership: userMemberships, plan: plans })
        .from(users)
        .leftJoin(userMemberships, eq(userMemberships.userId, users.id))
        .leftJoin(plans, eq(userMemberships.planId, plans.id))
        .where(filter)
        .orderBy(desc(users.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.database.select({ total: count() }).from(users).where(filter),
    ]);
    return { items, total: totals[0]?.total ?? 0, page, pageSize };
  }

  async getAdminMembership(userId: string) {
    const membership = await this.getMembership(userId);
    const history = await this.database
      .select()
      .from(membershipEvents)
      .where(eq(membershipEvents.userId, userId))
      .orderBy(desc(membershipEvents.createdAt))
      .limit(100);
    return { membership, history };
  }

  async adminGrantPlan(userId: string, planId: string, actorUserId: string) {
    const [plan] = await this.database
      .select()
      .from(plans)
      .where(and(eq(plans.id, planId), eq(plans.isActive, true)))
      .limit(1);
    if (!plan) throw new BillingError(404, "پلن پیدا نشد.");
    await this.ensureSignupMembership(userId);
    const [membership] = await this.database
      .select()
      .from(userMemberships)
      .where(eq(userMemberships.userId, userId))
      .limit(1);
    if (!membership) throw new BillingError(404, "عضویت کاربر پیدا نشد.");

    const now = new Date();
    const baseExpiry = membership.expiresAt > now ? membership.expiresAt : now;
    await this.database.transaction(async (tx) => {
      await tx
        .update(userMemberships)
        .set({
          planId: plan.id,
          status: "active",
          startsAt: now,
          expiresAt: addDays(baseExpiry, plan.durationDays),
          resumesRemaining: addLimit(membership.resumesRemaining, plan.resumeLimit),
          pdfDownloadsRemaining: addLimit(
            membership.pdfDownloadsRemaining,
            plan.pdfDownloadLimit,
          ),
          aiCreditsRemaining: membership.aiCreditsRemaining + plan.aiCredits,
          matchCreditsRemaining: membership.matchCreditsRemaining + plan.matchCredits,
          interviewCreditsRemaining:
            membership.interviewCreditsRemaining + plan.interviewCredits,
          canceledAt: null,
          canceledByUserId: null,
          cancelReason: null,
          updatedAt: now,
        })
        .where(eq(userMemberships.id, membership.id));
      await tx.insert(membershipEvents).values({
        id: randomUUID(),
        userId,
        membershipId: membership.id,
        planId: plan.id,
        actorUserId,
        type: "admin_grant",
        durationDays: plan.durationDays,
        createdAt: now,
      });
    });
    return this.getMembership(userId);
  }

  async adminExtendMembership(userId: string, days: number, actorUserId: string) {
    await this.ensureSignupMembership(userId);
    const [membership] = await this.database
      .select()
      .from(userMemberships)
      .where(eq(userMemberships.userId, userId))
      .limit(1);
    if (!membership) throw new BillingError(404, "عضویت کاربر پیدا نشد.");
    const now = new Date();
    const baseExpiry = membership.expiresAt > now ? membership.expiresAt : now;
    await this.database.transaction(async (tx) => {
      await tx
        .update(userMemberships)
        .set({ status: "active", expiresAt: addDays(baseExpiry, days), updatedAt: now })
        .where(eq(userMemberships.id, membership.id));
      await tx.insert(membershipEvents).values({
        id: randomUUID(),
        userId,
        membershipId: membership.id,
        planId: membership.planId,
        actorUserId,
        type: "admin_extend",
        durationDays: days,
        createdAt: now,
      });
    });
    return this.getMembership(userId);
  }

  async adminAdjustCredit(
    userId: string,
    resource: "resume" | "pdf" | "ai" | "match" | "interview",
    units: number,
    actorUserId: string,
    reason?: string,
  ) {
    await this.ensureSignupMembership(userId);
    const [membership] = await this.database
      .select()
      .from(userMemberships)
      .where(eq(userMemberships.userId, userId))
      .limit(1);
    if (!membership) throw new BillingError(404, "عضویت کاربر پیدا نشد.");
    const field = {
      resume: "resumesRemaining",
      pdf: "pdfDownloadsRemaining",
      ai: "aiCreditsRemaining",
      match: "matchCreditsRemaining",
      interview: "interviewCreditsRemaining",
    } as const;
    const key = field[resource];
    const current = membership[key];
    const next = current === null ? null : Math.max(0, current + units);
    const now = new Date();
    await this.database.transaction(async (tx) => {
      await tx
        .update(userMemberships)
        .set({ [key]: next, updatedAt: now })
        .where(eq(userMemberships.id, membership.id));
      await tx.insert(usageEvents).values({
        id: randomUUID(),
        userId,
        membershipId: membership.id,
        resource,
        units,
        operation: "admin_adjust",
        actorUserId,
        details: reason ? { reason } : undefined,
        createdAt: now,
      });
      await tx.insert(membershipEvents).values({
        id: randomUUID(),
        userId,
        membershipId: membership.id,
        planId: membership.planId,
        actorUserId,
        type: "admin_adjust",
        details: { resource, units, reason },
        createdAt: now,
      });
    });
    return this.getMembership(userId);
  }

  async adminCancelMembership(userId: string, actorUserId: string, reason?: string) {
    await this.ensureSignupMembership(userId);
    const [membership] = await this.database
      .select()
      .from(userMemberships)
      .where(eq(userMemberships.userId, userId))
      .limit(1);
    if (!membership) throw new BillingError(404, "عضویت کاربر پیدا نشد.");
    const now = new Date();
    await this.database.transaction(async (tx) => {
      await tx
        .update(userMemberships)
        .set({
          planId: "free",
          status: "canceled",
          expiresAt: now,
          resumesRemaining: 0,
          pdfDownloadsRemaining: 0,
          aiCreditsRemaining: 0,
          matchCreditsRemaining: 0,
          interviewCreditsRemaining: 0,
          canceledAt: now,
          canceledByUserId: actorUserId,
          cancelReason: reason,
          updatedAt: now,
        })
        .where(eq(userMemberships.id, membership.id));
      await tx.insert(membershipEvents).values({
        id: randomUUID(),
        userId,
        membershipId: membership.id,
        planId: membership.planId,
        actorUserId,
        type: "cancel",
        details: reason ? { reason } : undefined,
        createdAt: now,
      });
    });
    return this.getMembership(userId);
  }
}
