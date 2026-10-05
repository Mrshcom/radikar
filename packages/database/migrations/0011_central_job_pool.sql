CREATE TABLE IF NOT EXISTS "job_pool_segments" (
  "id" text PRIMARY KEY NOT NULL,
  "label" text NOT NULL,
  "keyword" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_pool_segments_active_sort_idx" ON "job_pool_segments" USING btree ("is_active", "sort_order");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_pool_runs" (
  "id" uuid PRIMARY KEY NOT NULL,
  "source" text NOT NULL,
  "status" text NOT NULL,
  "requested_limit" integer NOT NULL,
  "received_count" integer DEFAULT 0 NOT NULL,
  "inserted_count" integer DEFAULT 0 NOT NULL,
  "updated_count" integer DEFAULT 0 NOT NULL,
  "estimated_cost_usd_micros" integer DEFAULT 0 NOT NULL,
  "error_message" text,
  "started_at" timestamp with time zone NOT NULL,
  "completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_pool_runs_source_started_idx" ON "job_pool_runs" USING btree ("source", "started_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_listings" (
  "id" uuid PRIMARY KEY NOT NULL,
  "source" text NOT NULL,
  "external_id" text NOT NULL,
  "canonical_url" text NOT NULL,
  "fingerprint" text NOT NULL,
  "title" text NOT NULL,
  "company_name" text NOT NULL,
  "location" text,
  "workplace_type" text,
  "employment_type" text,
  "seniority" text,
  "description" text,
  "skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "posted_at" timestamp with time zone,
  "discovered_at" timestamp with time zone NOT NULL,
  "last_seen_at" timestamp with time zone NOT NULL,
  "expires_at" timestamp with time zone,
  "is_active" boolean DEFAULT true NOT NULL,
  "raw_payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "job_listings_source_external_unique" ON "job_listings" USING btree ("source", "external_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "job_listings_source_fingerprint_unique" ON "job_listings" USING btree ("source", "fingerprint");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_listings_active_posted_idx" ON "job_listings" USING btree ("is_active", "posted_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_listings_title_idx" ON "job_listings" USING btree ("title");
