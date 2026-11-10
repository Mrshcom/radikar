ALTER TABLE "users" ADD COLUMN "account_type" text NOT NULL DEFAULT 'candidate';
ALTER TABLE "oauth_login_attempts" ADD COLUMN "account_type" text NOT NULL DEFAULT 'candidate';

-- Employer profiles created before account separation belong to employer identities.
UPDATE "users" SET "account_type" = 'employer'
WHERE "id" IN (SELECT "user_id" FROM "employer_profiles");
