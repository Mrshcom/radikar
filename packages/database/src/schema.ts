import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { DataRecord } from "@radikar/shared-types";

export type OnboardingStepId = "profile" | "match" | "resume" | "application";

export type OnboardingState = {
  version: number;
  status: "not_started" | "active" | "dismissed" | "completed";
  completedSteps: OnboardingStepId[];
};

export const defaultOnboardingState: OnboardingState = {
  version: 1,
  status: "not_started",
  completedSteps: [],
};

export const aiSettings = pgTable("ai_settings", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  dollarRateRials: integer("dollar_rate_rials").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const dataRecords = pgTable(
  "data_records",
  {
    collection: text("collection").notNull(),
    id: text("id").notNull(),
    ownerUserId: uuid("owner_user_id"),
    profileId: text("profile_id"),
    payload: jsonb("payload").$type<DataRecord>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("data_records_owner_collection_id_unique").on(
      table.ownerUserId,
      table.collection,
      table.id,
    ),
    index("data_records_collection_updated_idx").on(
      table.collection,
      table.updatedAt,
    ),
    index("data_records_profile_idx").on(
      table.collection,
      table.profileId,
    ),
    index("data_records_owner_collection_idx").on(
      table.ownerUserId,
      table.collection,
      table.updatedAt,
    ),
  ],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    phone: text("phone"),
    email: text("email"),
    fullName: text("full_name"),
    // Internal label for super-admins; never returned by user-facing profile APIs.
    adminAlias: text("admin_alias"),
    role: text("role", { enum: ["user", "admin", "superadmin"] })
      .notNull()
      .default("user"),
    status: text("status", { enum: ["active", "suspended"] })
      .notNull()
      .default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    tablePageSize: integer("table_page_size").notNull().default(20),
    onboardingState: jsonb("onboarding_state")
      .$type<OnboardingState>()
      .notNull()
      .default(defaultOnboardingState),
  },
  (table) => [uniqueIndex("users_phone_unique").on(table.phone)],
);

export const userIdentities = pgTable(
  "user_identities",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: ["google"] }).notNull(),
    providerSubject: text("provider_subject").notNull(),
    email: text("email"),
    emailVerified: boolean("email_verified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("user_identities_provider_subject_unique").on(
      table.provider,
      table.providerSubject,
    ),
    index("user_identities_user_idx").on(table.userId),
  ],
);

export const oauthLoginAttempts = pgTable(
  "oauth_login_attempts",
  {
    id: uuid("id").primaryKey(),
    provider: text("provider", { enum: ["google"] }).notNull(),
    stateHash: text("state_hash").notNull(),
    nonce: text("nonce").notNull(),
    codeVerifier: text("code_verifier").notNull(),
    nextPath: text("next_path").notNull().default("/dashboard"),
    referralCode: text("referral_code"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("oauth_login_attempts_state_unique").on(table.stateHash),
    index("oauth_login_attempts_expiry_idx").on(table.expiresAt),
  ],
);

export const otpChallenges = pgTable(
  "otp_challenges",
  {
    id: uuid("id").primaryKey(),
    phone: text("phone").notNull(),
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    consumed: boolean("consumed").notNull().default(false),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("otp_phone_created_idx").on(table.phone, table.createdAt)],
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
    loginIp: text("login_ip"),
    logoutIp: text("logout_ip"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("auth_sessions_token_unique").on(table.tokenHash),
    index("auth_sessions_user_idx").on(table.userId, table.expiresAt),
  ],
);

export const referralSettings = pgTable("referral_settings", {
  id: text("id").primaryKey(),
  isActive: boolean("is_active").notNull().default(true),
  referrerPoints: integer("referrer_points").notNull().default(100),
  referredPoints: integer("referred_points").notNull().default(50),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const referralCodes = pgTable(
  "referral_codes",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("referral_codes_user_unique").on(table.userId),
    uniqueIndex("referral_codes_code_unique").on(table.code),
  ],
);

export const referralVisits = pgTable(
  "referral_visits",
  {
    id: uuid("id").primaryKey(),
    referralCodeId: uuid("referral_code_id").notNull().references(() => referralCodes.id, { onDelete: "cascade" }),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("referral_visits_code_created_idx").on(table.referralCodeId, table.createdAt)],
);

export const referrals = pgTable(
  "referrals",
  {
    id: uuid("id").primaryKey(),
    referralCodeId: uuid("referral_code_id").notNull().references(() => referralCodes.id, { onDelete: "restrict" }),
    referrerUserId: uuid("referrer_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    referredUserId: uuid("referred_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["pending", "confirmed", "rejected"] }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("referrals_referred_user_unique").on(table.referredUserId),
    index("referrals_referrer_created_idx").on(table.referrerUserId, table.createdAt),
    index("referrals_status_created_idx").on(table.status, table.createdAt),
  ],
);

export const referralPointEvents = pgTable(
  "referral_point_events",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    referralId: uuid("referral_id").references(() => referrals.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["referrer_signup", "referred_signup", "admin_adjustment"] }).notNull(),
    status: text("status", { enum: ["pending", "confirmed", "revoked"] }).notNull().default("pending"),
    points: integer("points").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("referral_point_events_referral_user_type_unique").on(table.referralId, table.userId, table.type),
    index("referral_point_events_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const radicoinSettings = pgTable("radicoin_settings", {
  id: text("id").primaryKey(),
  dailyLoginCoins: integer("daily_login_coins").notNull().default(2),
  dailyActivityCoinCap: integer("daily_activity_coin_cap").notNull().default(15),
  activityCoins: integer("activity_coins").notNull().default(3),
  referrerSignupCoins: integer("referrer_signup_coins").notNull().default(40),
  referredSignupCoins: integer("referred_signup_coins").notNull().default(30),
  referrerActivationCoins: integer("referrer_activation_coins").notNull().default(80),
  referredActivationCoins: integer("referred_activation_coins").notNull().default(50),
  referrerUpgradeCoins: integer("referrer_upgrade_coins").notNull().default(200),
  purchaserCoins: integer("purchaser_coins").notNull().default(30),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const radicoinWallets = pgTable("radicoin_wallets", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  availableCoins: integer("available_coins").notNull().default(0),
  pendingCoins: integer("pending_coins").notNull().default(0),
  lifetimeEarnedCoins: integer("lifetime_earned_coins").notNull().default(0),
  lifetimeSpentCoins: integer("lifetime_spent_coins").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const radicoinTransactions = pgTable(
  "radicoin_transactions",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    referralId: uuid("referral_id").references(() => referrals.id, { onDelete: "set null" }),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    source: text("source", {
      enum: ["daily_login", "activity", "referral_signup", "referral_activation", "referral_upgrade", "purchase", "campaign", "birthday", "admin_adjustment", "redemption", "reversal"],
    }).notNull(),
    bucket: text("bucket", { enum: ["earned", "promotional"] }).notNull().default("earned"),
    status: text("status", { enum: ["pending", "available", "reversed", "expired"] }).notNull().default("available"),
    amount: integer("amount").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    awardDay: text("award_day"),
    description: text("description").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    availableAt: timestamp("available_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("radicoin_transactions_idempotency_unique").on(table.idempotencyKey),
    index("radicoin_transactions_user_created_idx").on(table.userId, table.createdAt),
    index("radicoin_transactions_expiry_idx").on(table.status, table.expiresAt),
    index("radicoin_transactions_user_day_idx").on(table.userId, table.awardDay),
  ],
);

export const plans = pgTable(
  "plans",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    priceRials: integer("price_rials").notNull(),
    radicoinCost: integer("radicoin_cost"),
    durationDays: integer("duration_days").notNull().default(30),
    resumeLimit: integer("resume_limit"),
    pdfDownloadLimit: integer("pdf_download_limit"),
    aiCredits: integer("ai_credits").notNull().default(0),
    matchCredits: integer("match_credits").notNull().default(0),
    interviewCredits: integer("interview_credits").notNull().default(0),
    isFree: boolean("is_free").notNull().default(false),
    isPurchasable: boolean("is_purchasable").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("plans_active_sort_idx").on(table.isActive, table.sortOrder),
  ],
);

export const userMemberships = pgTable(
  "user_memberships",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id),
    status: text("status", { enum: ["active", "canceled", "expired"] })
      .notNull()
      .default("active"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    freeGrantedAt: timestamp("free_granted_at", { withTimezone: true }),
    resumesRemaining: integer("resumes_remaining"),
    pdfDownloadsRemaining: integer("pdf_downloads_remaining"),
    aiCreditsRemaining: integer("ai_credits_remaining").notNull().default(0),
    matchCreditsRemaining: integer("match_credits_remaining")
      .notNull()
      .default(0),
    interviewCreditsRemaining: integer("interview_credits_remaining")
      .notNull()
      .default(0),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    canceledByUserId: uuid("canceled_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    cancelReason: text("cancel_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("user_memberships_user_unique").on(table.userId),
    index("user_memberships_plan_status_idx").on(table.planId, table.status),
    index("user_memberships_expiry_idx").on(table.status, table.expiresAt),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey(),
    orderNumber: text("order_number").notNull(),
    checkoutKey: uuid("checkout_key"),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id),
    amountRials: integer("amount_rials").notNull(),
    status: text("status", {
      enum: ["pending", "paid", "failed", "canceled", "refunded"],
    })
      .notNull()
      .default("pending"),
    gateway: text("gateway").notNull().default("zarinpal_sandbox"),
    authority: text("authority"),
    refId: text("ref_id"),
    callbackStatus: text("callback_status"),
    failureCode: integer("failure_code"),
    failureMessage: text("failure_message"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("orders_order_number_unique").on(table.orderNumber),
    uniqueIndex("orders_user_checkout_key_unique").on(table.userId, table.checkoutKey),
    uniqueIndex("orders_authority_unique").on(table.authority),
    index("orders_user_created_idx").on(table.userId, table.createdAt),
    index("orders_status_created_idx").on(table.status, table.createdAt),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("zarinpal_sandbox"),
    authority: text("authority").notNull(),
    amountRials: integer("amount_rials").notNull(),
    status: text("status", {
      enum: ["initiated", "verified", "failed", "canceled", "refunded"],
    })
      .notNull()
      .default("initiated"),
    providerCode: integer("provider_code"),
    refId: text("ref_id"),
    cardPan: text("card_pan"),
    cardHash: text("card_hash"),
    providerData: jsonb("provider_data").$type<Record<string, unknown>>(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("payments_authority_unique").on(table.authority),
    index("payments_order_idx").on(table.orderId, table.createdAt),
    index("payments_status_created_idx").on(table.status, table.createdAt),
  ],
);

export const membershipEvents = pgTable(
  "membership_events",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id").references(() => userMemberships.id, {
      onDelete: "set null",
    }),
    planId: text("plan_id").references(() => plans.id, {
      onDelete: "set null",
    }),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    type: text("type", {
      enum: [
        "signup_grant",
        "purchase",
        "renewal",
        "upgrade",
        "admin_grant",
        "admin_extend",
        "admin_adjust",
        "account_suspended",
        "account_activated",
        "cancel",
        "expire",
      ],
    }).notNull(),
    durationDays: integer("duration_days"),
    details: jsonb("details").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("membership_events_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
    index("membership_events_type_created_idx").on(table.type, table.createdAt),
  ],
);

export const usageEvents = pgTable(
  "usage_events",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id").references(() => userMemberships.id, {
      onDelete: "set null",
    }),
    resource: text("resource", {
      enum: ["resume", "pdf", "ai", "match", "interview"],
    }).notNull(),
    units: integer("units").notNull(),
    operation: text("operation").notNull(),
    requestId: text("request_id"),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    details: jsonb("details").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("usage_events_request_unique").on(table.requestId),
    index("usage_events_user_created_idx").on(table.userId, table.createdAt),
    index("usage_events_resource_created_idx").on(
      table.resource,
      table.createdAt,
    ),
  ],
);

export const modelUsageEvents = pgTable(
  "model_usage_events",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requestId: text("request_id").notNull(),
    operation: text("operation").notNull(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    totalTokens: integer("total_tokens").notNull().default(0),
    tokenSource: text("token_source", {
      enum: ["provider", "estimated"],
    }).notNull(),
    estimatedCostMicros: integer("estimated_cost_micros")
      .notNull()
      .default(0),
    statusCode: integer("status_code").notNull(),
    successful: boolean("successful").notNull(),
    durationMs: integer("duration_ms").notNull(),
    attempt: integer("attempt").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("model_usage_events_request_unique").on(table.requestId),
    index("model_usage_events_created_idx").on(table.createdAt),
    index("model_usage_events_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
    index("model_usage_events_model_created_idx").on(
      table.provider,
      table.model,
      table.createdAt,
    ),
    index("model_usage_events_operation_created_idx").on(
      table.operation,
      table.createdAt,
    ),
  ],
);

export const jobPoolSegments = pgTable(
  "job_pool_segments",
  {
    id: text("id").primaryKey(),
    label: text("label").notNull(),
    keyword: text("keyword").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("job_pool_segments_active_sort_idx").on(table.isActive, table.sortOrder)],
);

export const jobPoolSettings = pgTable("job_pool_settings", {
  id: text("id").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  dailyLimit: integer("daily_limit").notNull().default(500),
  intervalHours: integer("interval_hours").notNull().default(24),
  publishedAt: text("published_at").notNull().default("r86400"),
  locations: jsonb("locations").$type<string[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const jobPoolRuns = pgTable(
  "job_pool_runs",
  {
    id: uuid("id").primaryKey(),
    source: text("source").notNull(),
    status: text("status", { enum: ["running", "completed", "failed"] }).notNull(),
    requestedLimit: integer("requested_limit").notNull(),
    searchCount: integer("search_count").notNull().default(0),
    receivedCount: integer("received_count").notNull().default(0),
    insertedCount: integer("inserted_count").notNull().default(0),
    updatedCount: integer("updated_count").notNull().default(0),
    estimatedCostUsdMicros: integer("estimated_cost_usd_micros").notNull().default(0),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [index("job_pool_runs_source_started_idx").on(table.source, table.startedAt)],
);

export const jobListings = pgTable(
  "job_listings",
  {
    id: uuid("id").primaryKey(),
    source: text("source").notNull(),
    externalId: text("external_id").notNull(),
    canonicalUrl: text("canonical_url").notNull(),
    fingerprint: text("fingerprint").notNull(),
    title: text("title").notNull(),
    companyName: text("company_name").notNull(),
    location: text("location"),
    workplaceType: text("workplace_type"),
    employmentType: text("employment_type"),
    seniority: text("seniority"),
    salaryText: text("salary_text"),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    salaryCurrency: text("salary_currency"),
    description: text("description"),
    skills: jsonb("skills").$type<string[]>().notNull().default([]),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    discoveredAt: timestamp("discovered_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    rawPayload: jsonb("raw_payload").$type<Record<string, unknown>>().notNull(),
  },
  (table) => [
    uniqueIndex("job_listings_source_external_unique").on(table.source, table.externalId),
    uniqueIndex("job_listings_source_fingerprint_unique").on(table.source, table.fingerprint),
    index("job_listings_active_posted_idx").on(table.isActive, table.postedAt),
    index("job_listings_title_idx").on(table.title),
  ],
);
