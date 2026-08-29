CREATE TABLE IF NOT EXISTS "data_records" (
  "collection" text NOT NULL,
  "id" text NOT NULL,
  "profile_id" text,
  "payload" jsonb NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
  CONSTRAINT "data_records_collection_id_pk" PRIMARY KEY("collection", "id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "data_records_collection_updated_idx"
  ON "data_records" USING btree ("collection", "updated_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "data_records_profile_idx"
  ON "data_records" USING btree ("collection", "profile_id");
