import {
  createHash,
  createHmac,
  createPublicKey,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
  verify as verifySignature,
} from "node:crypto";
import type { JsonWebKey as NodeJsonWebKey } from "node:crypto";
import { normalizeDigits } from "@radikar/validators";
import type { UpdateAdminAliasInput } from "@radikar/validators";
import { and, asc, count, desc, eq, gt, ilike, isNotNull, isNull, lt, ne, or, sql } from "drizzle-orm";
import {
  authSessions,
  dataRecords,
  membershipEvents,
  oauthLoginAttempts,
  otpChallenges,
  orders,
  plans,
  userMemberships,
  userIdentities,
  users,
  type Database,
} from "@radikar/database";
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
  googleClientId?: string;
  googleClientSecret?: string;
  googleRedirectUri?: string;
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

export type GoogleLoginStart = {
  authorizationUrl: string;
  state: string;
};

export type GoogleLoginResult = VerifyOtpResult & { nextPath: string };

type GoogleIdTokenClaims = {
  iss?: string;
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  nonce?: string;
  exp?: number;
  iat?: number;
};

type GoogleJwk = NodeJsonWebKey & { kid?: string; alg?: string; use?: string };

let googleJwksCache: { expiresAt: number; keys: GoogleJwk[] } | undefined;

function normalizePhone(value: string) {
  const digits = normalizeDigits(value.trim());
  if (!/^09\d{9}$/.test(digits)) throw new AuthError(400, "شماره همراه معتبر نیست.");
  return digits;
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function safeNextPath(value?: string) {
  return value?.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !/[\r\n]/.test(value)
    ? value
    : "/dashboard";
}

function decodeJwtPart<T>(value: string): T {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    throw new AuthError(400, "پاسخ هویتی Google معتبر نیست.");
  }
}

async function getGoogleJwks(forceRefresh = false) {
  if (!forceRefresh && googleJwksCache && googleJwksCache.expiresAt > Date.now()) {
    return googleJwksCache.keys;
  }
  const response = await fetch("https://www.googleapis.com/oauth2/v3/certs", {
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new AuthError(502, "اعتبارسنجی ورود Google در دسترس نیست.");
  const body = (await response.json()) as { keys?: GoogleJwk[] };
  if (!Array.isArray(body.keys) || !body.keys.length) {
    throw new AuthError(502, "کلیدهای اعتبارسنجی Google دریافت نشد.");
  }
  const maxAge = Number(response.headers.get("cache-control")?.match(/max-age=(\d+)/)?.[1] ?? 3600);
  googleJwksCache = {
    keys: body.keys,
    expiresAt: Date.now() + Math.max(60, Math.min(maxAge, 86_400)) * 1_000,
  };
  return body.keys;
}

async function verifyGoogleIdToken(
  idToken: string,
  clientId: string,
  expectedNonce: string,
) {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new AuthError(400, "توکن هویتی Google معتبر نیست.");
  const header = decodeJwtPart<{ alg?: string; kid?: string }>(parts[0]);
  if (header.alg !== "RS256" || !header.kid) {
    throw new AuthError(400, "الگوریتم توکن Google معتبر نیست.");
  }
  let key = (await getGoogleJwks()).find((item) => item.kid === header.kid);
  if (!key) {
    key = (await getGoogleJwks(true)).find((item) => item.kid === header.kid);
  }
  if (!key) {
    throw new AuthError(400, "کلید امضای Google پیدا نشد؛ دوباره تلاش کن.");
  }
  const validSignature = verifySignature(
    "RSA-SHA256",
    Buffer.from(`${parts[0]}.${parts[1]}`),
    createPublicKey({ key, format: "jwk" }),
    Buffer.from(parts[2], "base64url"),
  );
  if (!validSignature) throw new AuthError(400, "امضای توکن Google معتبر نیست.");

  const claims = decodeJwtPart<GoogleIdTokenClaims>(parts[1]);
  const now = Math.floor(Date.now() / 1_000);
  if (
    !["https://accounts.google.com", "accounts.google.com"].includes(claims.iss ?? "") ||
    claims.aud !== clientId ||
    !claims.sub ||
    !claims.email ||
    claims.email_verified !== true ||
    claims.nonce !== expectedNonce ||
    !claims.exp ||
    claims.exp < now - 60 ||
    (claims.iat != null && claims.iat > now + 60)
  ) {
    throw new AuthError(400, "اطلاعات هویتی Google قابل تأیید نیست.");
  }
  return claims as Required<Pick<GoogleIdTokenClaims, "sub" | "email">> & GoogleIdTokenClaims;
}

function toAuthUser(row: typeof users.$inferSelect): AuthUser {
  return {
    id: row.id,
    phone: row.phone,
    email: row.email,
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

  isGoogleLoginEnabled() {
    return Boolean(
      this.options.googleClientId &&
        this.options.googleClientSecret &&
        this.options.googleRedirectUri,
    );
  }

  private requireGoogleOptions() {
    const { googleClientId, googleClientSecret, googleRedirectUri } = this.options;
    if (!googleClientId || !googleClientSecret || !googleRedirectUri) {
      throw new AuthError(503, "ورود با Google هنوز پیکربندی نشده است.");
    }
    return { googleClientId, googleClientSecret, googleRedirectUri };
  }

  private async createSession(userRow: typeof users.$inferSelect, now = new Date()) {
    const sessionToken = randomBytes(32).toString("base64url");
    const sessionExpiresAt = new Date(
      now.getTime() + this.options.sessionTtlDays * 86_400_000,
    );
    await this.database.insert(authSessions).values({
      id: randomUUID(),
      userId: userRow.id,
      tokenHash: tokenHash(sessionToken),
      expiresAt: sessionExpiresAt,
      createdAt: now,
      lastSeenAt: now,
    });
    return {
      user: toAuthUser(userRow),
      sessionToken,
      sessionExpiresAt,
    } satisfies VerifyOtpResult;
  }

  async beginGoogleLogin(nextPath?: string): Promise<GoogleLoginStart> {
    const { googleClientId, googleRedirectUri } = this.requireGoogleOptions();
    const state = randomBytes(32).toString("base64url");
    const nonce = randomBytes(32).toString("base64url");
    const codeVerifier = randomBytes(64).toString("base64url");
    const codeChallenge = createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");
    const now = new Date();
    await this.database
      .delete(oauthLoginAttempts)
      .where(lt(oauthLoginAttempts.expiresAt, now));
    await this.database.insert(oauthLoginAttempts).values({
      id: randomUUID(),
      provider: "google",
      stateHash: tokenHash(state),
      nonce,
      codeVerifier,
      nextPath: safeNextPath(nextPath),
      expiresAt: new Date(now.getTime() + 10 * 60_000),
      createdAt: now,
    });
    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: googleRedirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "select_account",
    });
    return {
      state,
      authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    };
  }

  async completeGoogleLogin(
    code: string,
    state: string,
    cookieState?: string,
  ): Promise<GoogleLoginResult> {
    const { googleClientId, googleClientSecret, googleRedirectUri } =
      this.requireGoogleOptions();
    if (!cookieState) throw new AuthError(400, "نشست ورود Google پیدا نشد.");
    const expectedState = Buffer.from(cookieState);
    const receivedState = Buffer.from(state);
    if (
      expectedState.length !== receivedState.length ||
      !timingSafeEqual(expectedState, receivedState)
    ) {
      throw new AuthError(400, "درخواست ورود Google معتبر نیست.");
    }

    const now = new Date();
    const [attempt] = await this.database
      .update(oauthLoginAttempts)
      .set({ consumedAt: now })
      .where(
        and(
          eq(oauthLoginAttempts.stateHash, tokenHash(state)),
          eq(oauthLoginAttempts.provider, "google"),
          isNull(oauthLoginAttempts.consumedAt),
          gt(oauthLoginAttempts.expiresAt, now),
        ),
      )
      .returning();
    if (!attempt) throw new AuthError(400, "درخواست ورود Google منقضی یا استفاده شده است.");

    let tokenResponse: Response;
    try {
      tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: googleClientId,
          client_secret: googleClientSecret,
          redirect_uri: googleRedirectUri,
          grant_type: "authorization_code",
          code_verifier: attempt.codeVerifier,
        }),
        signal: AbortSignal.timeout(8_000),
      });
    } catch {
      throw new AuthError(502, "ارتباط با Google برقرار نشد؛ دوباره تلاش کن.");
    }
    const tokenBody = (await tokenResponse.json().catch(() => ({}))) as {
      id_token?: string;
    };
    if (!tokenResponse.ok || !tokenBody.id_token) {
      throw new AuthError(400, "تأیید ورود Google ناموفق بود.");
    }
    const claims = await verifyGoogleIdToken(
      tokenBody.id_token,
      googleClientId,
      attempt.nonce,
    );
    const email = claims.email.trim().toLocaleLowerCase("en");
    const displayName = claims.name?.trim().slice(0, 100) || null;

    const { userRow, isFirstUser } = await this.database.transaction(async (tx) => {
      // Serializes simultaneous callbacks for the same Google account and prevents
      // duplicate local users when two login tabs finish at nearly the same time.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`google:${claims.sub}`}))`);
      const [existingIdentity] = await tx
        .select({ identity: userIdentities, user: users })
        .from(userIdentities)
        .innerJoin(users, eq(userIdentities.userId, users.id))
        .where(
          and(
            eq(userIdentities.provider, "google"),
            eq(userIdentities.providerSubject, claims.sub),
          ),
        )
        .limit(1);

      if (existingIdentity) {
        if (existingIdentity.user.status !== "active") {
          throw new AuthError(403, "حساب کاربری شما غیرفعال است.");
        }
        const [updatedUser] = await tx
          .update(users)
          .set({
            email,
            fullName: existingIdentity.user.fullName || displayName,
            lastLoginAt: now,
            updatedAt: now,
          })
          .where(eq(users.id, existingIdentity.user.id))
          .returning();
        await tx
          .update(userIdentities)
          .set({ email, emailVerified: true, lastLoginAt: now, updatedAt: now })
          .where(eq(userIdentities.id, existingIdentity.identity.id));
        return { userRow: updatedUser, isFirstUser: false };
      }

      const [{ value: usersCount }] = await tx.select({ value: count() }).from(users);
      const [newUser] = await tx
        .insert(users)
        .values({
          id: randomUUID(),
          phone: null,
          email,
          fullName: displayName,
          role: "user",
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now,
        })
        .returning();
      await tx.insert(userIdentities).values({
        id: randomUUID(),
        userId: newUser.id,
        provider: "google",
        providerSubject: claims.sub,
        email,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      });
      return { userRow: newUser, isFirstUser: usersCount === 0 };
    });

    await this.options.grantSignupMembership?.(userRow.id);
    if (isFirstUser) {
      await this.database
        .update(dataRecords)
        .set({ ownerUserId: userRow.id })
        .where(isNull(dataRecords.ownerUserId));
    }
    return {
      ...(await this.createSession(userRow, now)),
      nextPath: attempt.nextPath,
    };
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
      try {
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
        if (!response.ok) throw new Error("OTP webhook rejected the request");
      } catch {
        throw new AuthError(502, "ارسال پیامک ورود ناموفق بود.");
      }
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

    return this.createSession(userRow, now);
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
          email: users.email,
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
          email: users.email,
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
          email: users.email,
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
          email: users.email,
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
        user: { id: row.userId, phone: row.phone, email: row.email, fullName: row.fullName },
        details: {},
      })),
      ...loginRows.flatMap((row) =>
        row.createdAt
          ? [{
              id: `login:${row.userId}:${row.createdAt.toISOString()}`,
              type: "login" as const,
              createdAt: row.createdAt.toISOString(),
              user: { id: row.userId, phone: row.phone, email: row.email, fullName: row.fullName },
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
              user: { id: row.userId, phone: row.phone, email: row.email, fullName: row.fullName },
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
        user: { id: row.userId, phone: row.phone, email: row.email, fullName: row.fullName },
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
    sortBy?: string,
    sortDirection: "asc" | "desc" = "desc",
  ) {
    const term = `%${search.trim()}%`;
    const filter = and(
      ne(users.role, "superadmin"),
      search.trim()
        ? sql`COALESCE(${users.phone}, '') ILIKE ${term} OR COALESCE(${users.email}, '') ILIKE ${term} OR COALESCE(${users.fullName}, '') ILIKE ${term}`
        : undefined,
      role ? eq(users.role, role) : undefined,
      status ? eq(users.status, status) : undefined,
    );
    const sortColumn = sortBy === "user" ? sql`coalesce(${users.fullName}, ${users.phone}, ${users.email})` : sortBy === "alias" ? users.adminAlias : sortBy === "role" ? users.role : sortBy === "status" ? users.status : sortBy === "records" ? sql`count(${dataRecords.id})` : sortBy === "login" ? users.lastLoginAt : users.createdAt;
    const order = sortDirection === "asc" ? asc(sortColumn) : desc(sortColumn);
    const [rows, totals] = await Promise.all([
      this.database
        .select({
          id: users.id,
          phone: users.phone,
          email: users.email,
          fullName: users.fullName,
          adminAlias: users.adminAlias,
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
        .orderBy(order)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.database.select({ total: count() }).from(users).where(filter),
    ]);
    return { items: rows, total: totals[0]?.total ?? 0, page, pageSize };
  }

  async listAllRecords(page = 1, pageSize = 20, search = "", collection?: string, sortBy?: string, sortDirection: "asc" | "desc" = "desc") {
    const term = `%${search.trim()}%`;
    const filter = and(
      search.trim()
        ? or(
            ilike(dataRecords.id, term),
            ilike(dataRecords.profileId, term),
            ilike(users.phone, term),
            ilike(users.email, term),
          )
        : undefined,
      collection ? eq(dataRecords.collection, collection) : undefined,
    );
    const sortColumn = sortBy === "collection" ? dataRecords.collection : sortBy === "id" ? dataRecords.id : sortBy === "owner" ? sql`coalesce(${users.phone}, ${users.email})` : sortBy === "workspace" ? dataRecords.profileId : dataRecords.updatedAt;
    const order = sortDirection === "asc" ? asc(sortColumn) : desc(sortColumn);
    const [rows, totals] = await Promise.all([
      this.database
        .select({
          id: dataRecords.id,
          collection: dataRecords.collection,
          profileId: dataRecords.profileId,
          ownerUserId: dataRecords.ownerUserId,
          ownerPhone: users.phone,
          ownerEmail: users.email,
          updatedAt: dataRecords.updatedAt,
        })
        .from(dataRecords)
        .leftJoin(users, eq(dataRecords.ownerUserId, users.id))
        .where(filter)
        .orderBy(order)
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

  async updateAdminAlias(userId: string, input: UpdateAdminAliasInput) {
    const [updated] = await this.database
      .update(users)
      .set({ adminAlias: input.adminAlias?.trim() || null, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({ id: users.id, adminAlias: users.adminAlias });
    if (!updated) throw new AuthError(404, "کاربر پیدا نشد.");
    return updated;
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
