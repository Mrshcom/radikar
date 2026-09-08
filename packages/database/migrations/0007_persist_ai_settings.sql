CREATE TABLE "ai_settings" (
  "id" text PRIMARY KEY NOT NULL,
  "provider" text NOT NULL,
  "model" text NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);
