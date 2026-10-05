CREATE TABLE IF NOT EXISTS "radicoin_settings" (
  "id" text PRIMARY KEY,
  "daily_login_coins" integer NOT NULL DEFAULT 2,
  "daily_activity_coin_cap" integer NOT NULL DEFAULT 15,
  "activity_coins" integer NOT NULL DEFAULT 3,
  "referrer_signup_coins" integer NOT NULL DEFAULT 40,
  "referred_signup_coins" integer NOT NULL DEFAULT 30,
  "referrer_activation_coins" integer NOT NULL DEFAULT 80,
  "referred_activation_coins" integer NOT NULL DEFAULT 50,
  "referrer_upgrade_coins" integer NOT NULL DEFAULT 200,
  "purchaser_coins" integer NOT NULL DEFAULT 30,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS "radicoin_wallets" (
  "user_id" uuid PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "available_coins" integer NOT NULL DEFAULT 0,
  "pending_coins" integer NOT NULL DEFAULT 0,
  "lifetime_earned_coins" integer NOT NULL DEFAULT 0,
  "lifetime_spent_coins" integer NOT NULL DEFAULT 0,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS "radicoin_transactions" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "referral_id" uuid REFERENCES "referrals"("id") ON DELETE SET NULL,
  "order_id" uuid REFERENCES "orders"("id") ON DELETE SET NULL,
  "source" text NOT NULL,
  "bucket" text NOT NULL DEFAULT 'earned',
  "status" text NOT NULL DEFAULT 'available',
  "amount" integer NOT NULL CHECK ("amount" <> 0),
  "idempotency_key" text NOT NULL,
  "award_day" text,
  "description" text NOT NULL,
  "metadata" jsonb,
  "available_at" timestamp with time zone,
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "radicoin_transactions_idempotency_unique" ON "radicoin_transactions" ("idempotency_key");
CREATE INDEX IF NOT EXISTS "radicoin_transactions_user_created_idx" ON "radicoin_transactions" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "radicoin_transactions_expiry_idx" ON "radicoin_transactions" ("status", "expires_at");
CREATE INDEX IF NOT EXISTS "radicoin_transactions_user_day_idx" ON "radicoin_transactions" ("user_id", "award_day");

INSERT INTO "radicoin_settings" ("id", "updated_at") VALUES ('default', now()) ON CONFLICT DO NOTHING;

INSERT INTO "radicoin_wallets" ("user_id", "available_coins", "lifetime_earned_coins", "updated_at")
SELECT "user_id", COALESCE(SUM("points") FILTER (WHERE "status" = 'confirmed'), 0), COALESCE(SUM("points") FILTER (WHERE "status" = 'confirmed' AND "points" > 0), 0), now()
FROM "referral_point_events"
GROUP BY "user_id"
ON CONFLICT ("user_id") DO NOTHING;

INSERT INTO "radicoin_transactions" ("id", "user_id", "referral_id", "source", "bucket", "status", "amount", "idempotency_key", "description", "created_at")
SELECT "id", "user_id", "referral_id", 'referral_signup', 'earned', CASE WHEN "status" = 'confirmed' THEN 'available' ELSE 'reversed' END, "points", 'legacy-referral:' || "id"::text, "description", "created_at"
FROM "referral_point_events"
ON CONFLICT ("idempotency_key") DO NOTHING;
