CREATE TABLE IF NOT EXISTS "product_timeline_entries" (
  "id" uuid PRIMARY KEY NOT NULL,
  "kind" text NOT NULL,
  "phase_id" uuid,
  "title" text NOT NULL,
  "summary" text NOT NULL,
  "status" text NOT NULL DEFAULT 'planned',
  "sort_order" integer NOT NULL DEFAULT 0,
  "story_slides" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "published_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
  CONSTRAINT "product_timeline_phase_fk" FOREIGN KEY ("phase_id") REFERENCES "product_timeline_entries"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "product_timeline_kind_order_idx" ON "product_timeline_entries" ("kind", "sort_order");
CREATE INDEX IF NOT EXISTS "product_timeline_phase_idx" ON "product_timeline_entries" ("phase_id");
CREATE INDEX IF NOT EXISTS "product_timeline_published_idx" ON "product_timeline_entries" ("published_at");
