CREATE TABLE "credit_pack_orders" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "checkout_key" uuid NOT NULL,
  "pack_id" text NOT NULL,
  "amount_rials" integer NOT NULL,
  "radicoin_cost" integer NOT NULL,
  "ai_credits" integer NOT NULL,
  "interview_credits" integer NOT NULL,
  "payment_method" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "authority" text,
  "ref_id" text,
  "failure_message" text,
  "paid_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "credit_pack_orders_user_checkout_unique" ON "credit_pack_orders" ("user_id", "checkout_key");
--> statement-breakpoint
CREATE UNIQUE INDEX "credit_pack_orders_authority_unique" ON "credit_pack_orders" ("authority");
--> statement-breakpoint
CREATE INDEX "credit_pack_orders_pending_idx" ON "credit_pack_orders" ("status", "created_at");
