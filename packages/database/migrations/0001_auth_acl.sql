ALTER TABLE "data_records" ADD COLUMN "owner_user_id" uuid;

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY NOT NULL,
  "phone" text NOT NULL,
  "full_name" text,
  "role" text DEFAULT 'user' NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
  "last_login_at" timestamp with time zone
);

CREATE UNIQUE INDEX "users_phone_unique" ON "users" ("phone");

CREATE TABLE "otp_challenges" (
  "id" uuid PRIMARY KEY NOT NULL,
  "phone" text NOT NULL,
  "code_hash" text NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "consumed" boolean DEFAULT false NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone NOT NULL
);

CREATE INDEX "otp_phone_created_idx" ON "otp_challenges" ("phone", "created_at");

CREATE TABLE "auth_sessions" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "last_seen_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone
);

CREATE UNIQUE INDEX "auth_sessions_token_unique" ON "auth_sessions" ("token_hash");
CREATE INDEX "auth_sessions_user_idx" ON "auth_sessions" ("user_id", "expires_at");
CREATE INDEX "data_records_owner_collection_idx" ON "data_records" ("owner_user_id", "collection", "updated_at");
