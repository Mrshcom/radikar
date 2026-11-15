ALTER TABLE "employer_positions" ADD COLUMN "closed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "employer_positions" ADD COLUMN "closure_reason" text;--> statement-breakpoint
ALTER TABLE "employer_positions" ADD COLUMN "closure_note" text;--> statement-breakpoint
ALTER TABLE "employer_positions" ADD COLUMN "hired_candidate_id" uuid;--> statement-breakpoint
ALTER TABLE "employer_positions" ADD COLUMN "hiring_rewarded_at" timestamp with time zone;