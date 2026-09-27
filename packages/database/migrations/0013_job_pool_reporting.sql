ALTER TABLE "job_pool_runs" ADD COLUMN IF NOT EXISTS "search_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "job_listings" ADD COLUMN IF NOT EXISTS "salary_text" text;
--> statement-breakpoint
ALTER TABLE "job_listings" ADD COLUMN IF NOT EXISTS "salary_min" integer;
--> statement-breakpoint
ALTER TABLE "job_listings" ADD COLUMN IF NOT EXISTS "salary_max" integer;
--> statement-breakpoint
ALTER TABLE "job_listings" ADD COLUMN IF NOT EXISTS "salary_currency" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_listings_salary_idx" ON "job_listings" USING btree ("salary_currency", "salary_min", "salary_max");
