ALTER TABLE "employer_positions" ADD COLUMN "workflow_stage" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "employer_positions" ADD COLUMN "review_method" text;
