CREATE TABLE IF NOT EXISTS "job_pool_settings" (
  "id" text PRIMARY KEY NOT NULL,
  "enabled" boolean DEFAULT false NOT NULL,
  "daily_limit" integer DEFAULT 500 NOT NULL,
  "interval_hours" integer DEFAULT 24 NOT NULL,
  "published_at" text DEFAULT 'r86400' NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);
