CREATE TABLE IF NOT EXISTS "referral_settings" (
  "id" text PRIMARY KEY,
  "is_active" boolean NOT NULL DEFAULT true,
  "referrer_points" integer NOT NULL DEFAULT 100,
  "referred_points" integer NOT NULL DEFAULT 50,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS "referral_codes" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "code" text NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "referral_codes_user_unique" ON "referral_codes" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "referral_codes_code_unique" ON "referral_codes" ("code");

CREATE TABLE IF NOT EXISTS "referral_visits" (
  "id" uuid PRIMARY KEY,
  "referral_code_id" uuid NOT NULL REFERENCES "referral_codes"("id") ON DELETE CASCADE,
  "ip" text,
  "user_agent" text,
  "created_at" timestamp with time zone NOT NULL
);
CREATE INDEX IF NOT EXISTS "referral_visits_code_created_idx" ON "referral_visits" ("referral_code_id", "created_at");

CREATE TABLE IF NOT EXISTS "referrals" (
  "id" uuid PRIMARY KEY,
  "referral_code_id" uuid NOT NULL REFERENCES "referral_codes"("id") ON DELETE RESTRICT,
  "referrer_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "referred_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp with time zone NOT NULL,
  "confirmed_at" timestamp with time zone
);
CREATE UNIQUE INDEX IF NOT EXISTS "referrals_referred_user_unique" ON "referrals" ("referred_user_id");
CREATE INDEX IF NOT EXISTS "referrals_referrer_created_idx" ON "referrals" ("referrer_user_id", "created_at");
CREATE INDEX IF NOT EXISTS "referrals_status_created_idx" ON "referrals" ("status", "created_at");

CREATE TABLE IF NOT EXISTS "referral_point_events" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "referral_id" uuid REFERENCES "referrals"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "points" integer NOT NULL,
  "description" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "referral_point_events_referral_user_type_unique" ON "referral_point_events" ("referral_id", "user_id", "type");
CREATE INDEX IF NOT EXISTS "referral_point_events_user_created_idx" ON "referral_point_events" ("user_id", "created_at");

ALTER TABLE "oauth_login_attempts" ADD COLUMN IF NOT EXISTS "referral_code" text;
