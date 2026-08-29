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
import type { DataRecord } from "@radicar/shared-types";

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
    phone: text("phone").notNull(),
    fullName: text("full_name"),
    role: text("role", { enum: ["user", "admin", "superadmin"] })
      .notNull()
      .default("user"),
    status: text("status", { enum: ["active", "suspended"] })
      .notNull()
      .default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("users_phone_unique").on(table.phone)],
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
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("auth_sessions_token_unique").on(table.tokenHash),
    index("auth_sessions_user_idx").on(table.userId, table.expiresAt),
  ],
);

export const plans = pgTable(
  "plans",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    priceRials: integer("price_rials").notNull(),
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
