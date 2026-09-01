import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { normalizeDigits } from "@radicar/validators";
import { and, count, desc, eq, gt, ilike, isNotNull, isNull, ne, or, sql } from "drizzle-orm";
import {
  authSessions,
  dataRecords,
  membershipEvents,
  otpChallenges,
  orders,
  plans,
  userMemberships,
  users,
  type Database,
} from "@radicar/database";
import type { AuthUser, SessionIdentity, UserRole, UserStatus } from "./types";

export type AuthServiceOptions = {
  secret: string;
  otpTtlSeconds: number;
  sessionTtlDays: number;
  bootstrapSuperadminPhone?: string;
  allowFirstUserSuperadmin: boolean;
  exposeDevelopmentOtp: boolean;
  otpWebhookUrl?: string;
  otpWebhookToken?: string;
  grantSignupMembership?: (userId: string) => Promise<void>;
};

export type RequestOtpResult = {
  challengeId: string;
  expiresInSeconds: number;
  developmentCode?: string;
};

export type VerifyOtpResult = {
  user: AuthUser;
  sessionToken: string;
  sessionExpiresAt: Date;
};

function normalizePhone(value: string) {
  const digits = normalizeDigits(value.trim());
  if (!/^09\d{9}$/.test(digits)) throw new AuthError(400, "شماره همراه معتبر نیست.");
  return digits;
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function toAuthUser(row: typeof users.$inferSelect): AuthUser {
  return {
    id: row.id,
    phone: row.phone,
    fullName: row.fullName,
    role: row.role as UserRole,
    status: row.status as UserStatus,
    createdAt: row.createdAt.toISOString(),
    lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
    tablePageSize: row.tablePageSize as AuthUser["tablePageSize"],
  };
}

export class AuthError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export class AuthService {
  constructor(
    private readonly database: Database,
    private readonly options: AuthServiceOptions,
  ) {}

  private hashOtp(challengeId: string, phone: string, code: string) {
    return createHmac("sha256", this.options.secret)
      .update(`${challengeId}:${phone}:${code}`)
      .digest("hex");
  }

  async requestOtp(rawPhone: string): Promise<RequestOtpResult> {
    const phone = normalizePhone(rawPhone);
    const since = new Date(Date.now() - 10 * 60 * 1000);
    const [{ value: recentCount }] = await this.database
      .select({ value: count() })
      .from(otpChallenges)
      .where(and(eq(otpChallenges.phone, phone), gt(otpChallenges.createdAt, since)));
    if (recentCount >= 5) {
      throw new AuthError(429, "تعداد درخواست‌ها زیاد است؛ چند دقیقه دیگر دوباره تلاش کن.");
    }

    const challengeId = randomUUID();
    const code = String(randomInt(100_000, 1_000_000));
    const createdAt = new Date();
    await this.database.insert(otpChallenges).values({
      id: challengeId,
      phone,
      codeHash: this.hashOtp(challengeId, phone, code),
      expiresAt: new Date(createdAt.getTime() + this.options.otpTtlSeconds * 1000),
      createdAt,
    });

    if (this.options.otpWebhookUrl) {
      const response = await fetch(this.options.otpWebhookUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(this.options.otpWebhookToken
            ? { authorization: `Bearer ${this.options.otpWebhookToken}` }
            : {}),
        },
        body: JSON.stringify({ phone, code, purpose: "login" }),
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) throw new AuthError(502, "ارسال پیامک ورود ناموفق بود.");
    }

    return {
      challengeId,
      expiresInSeconds: this.options.otpTtlSeconds,
      ...(this.options.exposeDevelopmentOtp ? { developmentCode: code } : {}),
    };
  }

  async verifyOtp(challengeId: string, rawPhone: string, code: string): Promise<VerifyOtpResult> {
    const phone = normalizePhone(rawPhone);
    const [challenge] = await this.database
      .select()
      .from(otpChallenges)
      .where(and(eq(otpChallenges.id, challengeId), eq(otpChallenges.phone, phone)))
      .limit(1);
    if (!challenge || challenge.consumed || challenge.expiresAt <= new Date()) {
      throw new AuthError(400, "کد ورود منقضی یا نامعتبر است.");
    }
    if (challenge.attempts >= 5) throw new AuthError(429, "تعداد تلاش‌های ورود بیش از حد مجاز است.");

    const expected = Buffer.from(challenge.codeHash, "hex");
    const received = Buffer.from(this.hashOtp(challengeId, phone, code), "hex");
    const valid = expected.length === received.length && timingSafeEqual(expected, received);
    if (!valid) {
      await this.database
        .update(otpChallenges)
        .set({ attempts: challenge.attempts + 1 })
        .where(eq(otpChallenges.id, challenge.id));
      throw new AuthError(400, "کد یک‌بارمصرف صحیح نیست.");
    }

    const now = new Date();
    const [existingUser] = await this.database
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);
    const [{ value: usersCount }] = await this.database.select({ value: count() }).from(users);
    const bootstrap =
      phone === this.options.bootstrapSuperadminPhone ||
      (usersCount === 0 && this.options.allowFirstUserSuperadmin);
    const role: UserRole = bootstrap ? "superadmin" : "user";

    const [userRow] = existingUser
      ? await this.database
          .update(users)
          .set({ lastLoginAt: now, updatedAt: now })
          .where(eq(users.id, existingUser.id))
          .returning()
      : await this.database
          .insert(users)
          .values({ id: randomUUID(), phone, role, createdAt: now, updatedAt: now, lastLoginAt: now })
          .returning();
    if (userRow.status !== "active") throw new AuthError(403, "حساب کاربری شما غیرفعال است.");
    await this.options.grantSignupMembership?.(userRow.id);

    await this.database
      .update(otpChallenges)
      .set({ consumed: true })
      .where(eq(otpChallenges.id, challenge.id));
    if (usersCount === 0) {
      await this.database
        .update(dataRecords)
        .set({ ownerUserId: userRow.id })
        .where(isNull(dataRecords.ownerUserId));
    }

    const sessionToken = randomBytes(32).toString("base64url");
    const sessionExpiresAt = new Date(now.getTime() + this.options.sessionTtlDays * 86_400_000);
    await this.database.insert(authSessions).values({
      id: randomUUID(),
      userId: userRow.id,
      tokenHash: tokenHash(sessionToken),
      expiresAt: sessionExpiresAt,
      createdAt: now,
      lastSeenAt: now,
    });
    return { user: toAuthUser(userRow), sessionToken, sessionExpiresAt };
  }

  async resolveSession(token?: string): Promise<SessionIdentity | null> {
    if (!token) return null;
    const [row] = await this.database
      .select({ session: authSessions, user: users })
      .from(authSessions)
      .innerJoin(users, eq(authSessions.userId, users.id))
      .where(
        and(
          eq(authSessions.tokenHash, tokenHash(token)),
          isNull(authSessions.revokedAt),
          gt(authSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);
    if (!row || row.user.status !== "active") return null;
    const stale = Date.now() - row.session.lastSeenAt.getTime() > 5 * 60 * 1000;
    if (stale) {
      await this.database
        .update(authSessions)
        .set({ lastSeenAt: new Date() })
        .where(eq(authSessions.id, row.session.id));
    }
    return { user: toAuthUser(row.user), sessionId: row.session.id };
  }

  async revokeSession(sessionId: string) {
    await this.database
      .update(authSessions)
      .set({ revokedAt: new Date() })
      .where(eq(authSessions.id, sessionId));
  }

  async getStats() {
    const [userTotals, recordTotals, roleRows, collectionRows] = await Promise.all([
      this.database
        .select({
          total: count(),
          active: sql<number>`count(*) filter (where ${users.status} = 'active')`,
          registeredToday: sql<number>`count(*) filter (where ${users.createdAt} >= (date_trunc('day', now() at time zone 'Asia/Tehran') at time zone 'Asia/Tehran'))`,
          activeToday: sql<number>`count(*) filter (where ${users.lastLoginAt} >= (date_trunc('day', now() at time zone 'Asia/Tehran') at time zone 'Asia/Tehran'))`,
        })
        .from(users)
        .where(ne(users.role, "superadmin")),
      this.database
        .select({
          total: count(),
          resumes: sql<number>`count(*) filter (where ${dataRecords.collection} = 'resumes')`,
          resumesToday: sql<number>`count(*) filter (where ${dataRecords.collection} = 'resumes' and ${dataRecords.createdAt} >= (date_trunc('day', now() at time zone 'Asia/Tehran') at time zone 'Asia/Tehran'))`,
        })
        .from(dataRecords)
        .innerJoin(users, eq(dataRecords.ownerUserId, users.id))
        .where(ne(users.role, "superadmin")),
      this.database
        .select({ role: users.role, total: count() })
        .from(users)
        .where(ne(users.role, "superadmin"))
        .groupBy(users.role),
      this.database
        .select({ collection: dataRecords.collection, total: count() })
        .from(dataRecords)
        .innerJoin(users, eq(dataRecords.ownerUserId, users.id))
        .where(ne(users.role, "superadmin"))
        .groupBy(dataRecords.collection),
    ]);
    return {
      users: {
        total: Number(userTotals[0]?.total ?? 0),
        active: Number(userTotals[0]?.active ?? 0),
        registeredToday: Number(userTotals[0]?.registeredToday ?? 0),
        activeToday: Number(userTotals[0]?.activeToday ?? 0),
      },
      records: {
        total: Number(recordTotals[0]?.total ?? 0),
        resumes: Number(recordTotals[0]?.resumes ?? 0),
        resumesToday: Number(recordTotals[0]?.resumesToday ?? 0),
        byCollection: collectionRows,
      },
      usersByRole: roleRows,
    };
  }

  async getRecentEvents(limit = 30) {
    const [signupRows, loginRows, purchaseRows, resumeRows] = await Promise.all([
      this.database
        .select({
          userId: users.id,
          phone: users.phone,
          fullName: users.fullName,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(ne(users.role, "superadmin"))
        .orderBy(desc(users.createdAt))
        .limit(limit),
      this.database
        .select({
          userId: users.id,
          phone: users.phone,
          fullName: users.fullName,
          createdAt: users.lastLoginAt,
        })
        .from(users)
        .where(
          and(
            ne(users.role, "superadmin"),
            isNotNull(users.lastLoginAt),
            sql`${users.lastLoginAt} > ${users.createdAt} + interval '1 second'`,
          ),
        )
        .orderBy(desc(users.lastLoginAt))
        .limit(limit),
      this.database
        .select({
          orderId: orders.id,
          userId: users.id,
          phone: users.phone,
          fullName: users.fullName,
          planName: plans.name,
          amountRials: orders.amountRials,
          refId: orders.refId,
          createdAt: orders.paidAt,
        })
        .from(orders)
        .innerJoin(users, eq(orders.userId, users.id))
        .innerJoin(plans, eq(orders.planId, plans.id))
        .where(
          and(
            ne(users.role, "superadmin"),
            eq(orders.status, "paid"),
            isNotNull(orders.paidAt),
          ),
        )
        .orderBy(desc(orders.paidAt))
        .limit(limit),
      this.database
        .select({
          recordId: dataRecords.id,
          userId: users.id,
          phone: users.phone,
          fullName: users.fullName,
          profileId: dataRecords.profileId,
          createdAt: dataRecords.createdAt,
        })
        .from(dataRecords)
        .innerJoin(users, eq(dataRecords.ownerUserId, users.id))
        .where(
          and(
            ne(users.role, "superadmin"),
            eq(dataRecords.collection, "resumes"),
          ),
        )
        .orderBy(desc(dataRecords.createdAt))
        .limit(limit),
    ]);

    const events = [
      ...signupRows.map((row) => ({
        id: `signup:${row.userId}:${row.createdAt.toISOString()}`,
        type: "signup" as const,
        createdAt: row.createdAt.toISOString(),
        user: { id: row.userId, phone: row.phone, fullName: row.fullName },
        details: {},
      })),
      ...loginRows.flatMap((row) =>
        row.createdAt
          ? [{
              id: `login:${row.userId}:${row.createdAt.toISOString()}`,
              type: "login" as const,
              createdAt: row.createdAt.toISOString(),
              user: { id: row.userId, phone: row.phone, fullName: row.fullName },
              details: {},
            }]
          : [],
      ),
      ...purchaseRows.flatMap((row) =>
        row.createdAt
          ? [{
              id: `purchase:${row.orderId}`,
              type: "purchase" as const,
              createdAt: row.createdAt.toISOString(),
              user: { id: row.userId, phone: row.phone, fullName: row.fullName },
              details: {
                orderId: row.orderId,
                planName: row.planName,
                amountRials: row.amountRials,
                refId: row.refId,
              },
            }]
          : [],
      ),
      ...resumeRows.map((row) => ({
        id: `resume:${row.recordId}:${row.createdAt.toISOString()}`,
        type: "resume" as const,
        createdAt: row.createdAt.toISOString(),
        user: { id: row.userId, phone: row.phone, fullName: row.fullName },
        details: { recordId: row.recordId, profileId: row.profileId },
      })),
    ];

    return {
      items: events
        .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
        .slice(0, limit),
    };
  }

  async listUsers(
    search = "",
    page = 1,
    pageSize = 20,
    role?: UserRole,
    status?: UserStatus,
  ) {
    const term = `%${search.trim()}%`;
    const filter = and(
      ne(users.role, "superadmin"),
      search.trim()
        ? sql`${users.phone} ILIKE ${term} OR COALESCE(${users.fullName}, '') ILIKE ${term}`
        : undefined,
      role ? eq(users.role, role) : undefined,
      status ? eq(users.status, status) : undefined,
    );
    const [rows, totals] = await Promise.all([
      this.database
        .select({
          id: users.id,
          phone: users.phone,
          fullName: users.fullName,
          role: users.role,
          status: users.status,
          createdAt: users.createdAt,
          lastLoginAt: users.lastLoginAt,
          recordsCount: count(dataRecords.id),
        })
        .from(users)
        .leftJoin(dataRecords, eq(dataRecords.ownerUserId, users.id))
        .where(filter)
        .groupBy(users.id)
        .orderBy(desc(users.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.database.select({ total: count() }).from(users).where(filter),
    ]);
    return { items: rows, total: totals[0]?.total ?? 0, page, pageSize };
  }

  async listAllRecords(page = 1, pageSize = 20, search = "", collection?: string) {
    const term = `%${search.trim()}%`;
    const filter = and(
      search.trim()
        ? or(
            ilike(dataRecords.id, term),
            ilike(dataRecords.profileId, term),
            ilike(users.phone, term),
          )
        : undefined,
      collection ? eq(dataRecords.collection, collection) : undefined,
    );
    const [rows, totals] = await Promise.all([
      this.database
        .select({
          id: dataRecords.id,
          collection: dataRecords.collection,
          profileId: dataRecords.profileId,
          ownerUserId: dataRecords.ownerUserId,
          ownerPhone: users.phone,
          updatedAt: dataRecords.updatedAt,
        })
        .from(dataRecords)
        .leftJoin(users, eq(dataRecords.ownerUserId, users.id))
        .where(filter)
        .orderBy(desc(dataRecords.updatedAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.database
        .select({ total: count() })
        .from(dataRecords)
        .leftJoin(users, eq(dataRecords.ownerUserId, users.id))
        .where(filter),
    ]);
    return { items: rows, total: totals[0]?.total ?? 0, page, pageSize };
  }

  async getUserDetails(userId: string) {
    const [user] = await this.database.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new AuthError(404, "کاربر پیدا نشد.");
    const records = await this.database
      .select({ collection: dataRecords.collection, total: count() })
      .from(dataRecords)
      .where(eq(dataRecords.ownerUserId, userId))
      .groupBy(dataRecords.collection);
    return { ...toAuthUser(user), records };
  }

  async updateUser(
    userId: string,
    input: { role?: UserRole; status?: UserStatus },
    actorUserId?: string,
  ) {
    const [current] = await this.database
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!current) throw new AuthError(404, "کاربر پیدا نشد.");

    return this.database.transaction(async (tx) => {
      const now = new Date();
      const [user] = await tx
        .update(users)
        .set({ ...input, updatedAt: now })
        .where(eq(users.id, userId))
        .returning();
      if (!user) throw new AuthError(404, "کاربر پیدا نشد.");

      if (input.status === "suspended") {
        await tx
          .update(authSessions)
          .set({ revokedAt: now })
          .where(and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)));
      }

      if (actorUserId && input.status && input.status !== current.status) {
        const [membership] = await tx
          .select({ id: userMemberships.id, planId: userMemberships.planId })
          .from(userMemberships)
          .where(eq(userMemberships.userId, userId))
          .limit(1);
        await tx.insert(membershipEvents).values({
          id: randomUUID(),
          userId,
          membershipId: membership?.id,
          planId: membership?.planId,
          actorUserId,
          type: input.status === "suspended" ? "account_suspended" : "account_activated",
          details: { previousStatus: current.status, nextStatus: input.status },
          createdAt: now,
        });
      }

      return toAuthUser(user);
    });
  }

  async updateProfile(userId: string, input: { fullName: string }) {
    const [user] = await this.database
      .update(users)
      .set({ fullName: input.fullName, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!user) throw new AuthError(404, "کاربر پیدا نشد.");
    return toAuthUser(user);
  }

  async updatePreferences(
    userId: string,
    input: { tablePageSize: AuthUser["tablePageSize"] },
  ) {
    const [user] = await this.database
      .update(users)
      .set({ tablePageSize: input.tablePageSize, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!user) throw new AuthError(404, "کاربر پیدا نشد.");
    return toAuthUser(user);
  }
}
