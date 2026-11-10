CREATE TABLE "employer_positions" (
  "id" uuid PRIMARY KEY NOT NULL,
  "owner_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "company_name" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "screening_status" text DEFAULT 'not_started' NOT NULL,
  "screening_error" text,
  "interview_questions" jsonb,
  "screening_started_at" timestamp with time zone,
  "screening_completed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "employer_positions_owner_created_idx" ON "employer_positions" USING btree ("owner_user_id","created_at");
--> statement-breakpoint
CREATE TABLE "employer_candidates" (
  "id" uuid PRIMARY KEY NOT NULL,
  "position_id" uuid NOT NULL REFERENCES "employer_positions"("id") ON DELETE cascade,
  "file_name" text NOT NULL,
  "file_hash" text NOT NULL,
  "resume_text" text DEFAULT '' NOT NULL,
  "extraction_error" text,
  "name" text,
  "email" text,
  "phone" text,
  "screening_status" text DEFAULT 'pending' NOT NULL,
  "match_evidence" jsonb,
  "invitation_token_hash" text,
  "invitation_deadline" timestamp with time zone,
  "invitation_status" text DEFAULT 'not_invited' NOT NULL,
  "invited_user_id" uuid REFERENCES "users"("id") ON DELETE set null,
  "interview_answers" jsonb,
  "interview_report" jsonb,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "employer_candidates_position_idx" ON "employer_candidates" USING btree ("position_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "employer_candidates_invitation_token_unique" ON "employer_candidates" USING btree ("invitation_token_hash");
--> statement-breakpoint
CREATE INDEX "employer_candidates_invited_user_idx" ON "employer_candidates" USING btree ("invited_user_id");
