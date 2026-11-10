CREATE TABLE "employer_resume_bank" (
  "id" uuid PRIMARY KEY NOT NULL,
  "owner_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "file_name" text NOT NULL,
  "file_hash" text NOT NULL,
  "file_data" bytea,
  "resume_text" text NOT NULL DEFAULT '',
  "extraction_error" text,
  "name" text,
  "email" text,
  "phone" text,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);
CREATE INDEX "employer_resume_bank_owner_created_idx" ON "employer_resume_bank" USING btree ("owner_user_id", "created_at");
CREATE INDEX "employer_resume_bank_owner_hash_idx" ON "employer_resume_bank" USING btree ("owner_user_id", "file_hash");
ALTER TABLE "employer_candidates" ADD COLUMN "resume_bank_id" uuid REFERENCES "employer_resume_bank"("id") ON DELETE SET NULL;
