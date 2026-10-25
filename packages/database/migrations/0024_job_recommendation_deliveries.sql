CREATE TABLE IF NOT EXISTS "job_recommendation_deliveries" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "job_listing_id" uuid NOT NULL REFERENCES "job_listings"("id") ON DELETE CASCADE,
  "score" integer NOT NULL,
  "status" text NOT NULL DEFAULT 'available',
  "delivered_at" timestamp with time zone NOT NULL,
  "seen_at" timestamp with time zone,
  "saved_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "job_recommendation_deliveries_user_job_unique"
  ON "job_recommendation_deliveries" ("user_id", "job_listing_id");
CREATE INDEX IF NOT EXISTS "job_recommendation_deliveries_user_delivered_idx"
  ON "job_recommendation_deliveries" ("user_id", "delivered_at");
CREATE INDEX IF NOT EXISTS "job_recommendation_deliveries_user_status_idx"
  ON "job_recommendation_deliveries" ("user_id", "status");
