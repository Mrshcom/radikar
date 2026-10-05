ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" text;

CREATE TABLE IF NOT EXISTS "user_identities" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider" text NOT NULL,
  "provider_subject" text NOT NULL,
  "email" text,
  "email_verified" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
  "last_login_at" timestamp with time zone NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_identities_provider_subject_unique"
  ON "user_identities" ("provider", "provider_subject");
CREATE INDEX IF NOT EXISTS "user_identities_user_idx"
  ON "user_identities" ("user_id");

CREATE TABLE IF NOT EXISTS "oauth_login_attempts" (
  "id" uuid PRIMARY KEY,
  "provider" text NOT NULL,
  "state_hash" text NOT NULL,
  "nonce" text NOT NULL,
  "code_verifier" text NOT NULL,
  "next_path" text DEFAULT '/dashboard' NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "consumed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "oauth_login_attempts_state_unique"
  ON "oauth_login_attempts" ("state_hash");
CREATE INDEX IF NOT EXISTS "oauth_login_attempts_expiry_idx"
  ON "oauth_login_attempts" ("expires_at");
