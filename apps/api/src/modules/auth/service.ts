import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { and, count, desc, eq, gt, isNull, sql } from "drizzle-orm";
import {
  authSessions,
  dataRecords,
  otpChallenges,
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
  const digits = value
    .trim()
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
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
        .select({ total: count(), active: sql<number>`count(*) filter (where ${users.status} = 'active')` })
        .from(users),
      this.database.select({ total: count() }).from(dataRecords),
      this.database.select({ role: users.role, total: count() }).from(users).groupBy(users.role),
      this.database
        .select({ collection: dataRecords.collection, total: count() })
        .from(dataRecords)
        .groupBy(dataRecords.collection),
    ]);
    return {
      users: { total: userTotals[0]?.total ?? 0, active: Number(userTotals[0]?.active ?? 0) },
      records: { total: recordTotals[0]?.total ?? 0, byCollection: collectionRows },
      usersByRole: roleRows,
    };
  }

  async listUsers(search = "", page = 1, pageSize = 20) {
    const term = `%${search.trim()}%`;
    const filter = search.trim()
      ? sql`${users.phone} ILIKE ${term} OR COALESCE(${users.fullName}, '') ILIKE ${term}`
      : undefined;
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

  async listAllRecords(page = 1, pageSize = 20) {
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
        .orderBy(desc(dataRecords.updatedAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.database.select({ total: count() }).from(dataRecords),
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

  async updateUser(userId: string, input: { role?: UserRole; status?: UserStatus }) {
    const [user] = await this.database
      .update(users)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!user) throw new AuthError(404, "کاربر پیدا نشد.");
    if (input.status === "suspended") {
      await this.database
        .update(authSessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)));
    }
    return toAuthUser(user);
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
}
