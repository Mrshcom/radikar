CREATE TABLE IF NOT EXISTS "product_events" (
  "id" uuid PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "idempotency_key" text NOT NULL,
  "properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "occurred_at" timestamp with time zone NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "product_events_idempotency_unique" ON "product_events" ("idempotency_key");
CREATE INDEX IF NOT EXISTS "product_events_name_occurred_idx" ON "product_events" ("name", "occurred_at");
CREATE INDEX IF NOT EXISTS "product_events_user_occurred_idx" ON "product_events" ("user_id", "occurred_at");
