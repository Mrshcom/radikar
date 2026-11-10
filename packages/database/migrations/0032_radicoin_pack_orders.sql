CREATE TABLE IF NOT EXISTS "radicoin_pack_orders" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "checkout_key" uuid NOT NULL,
  "pack_id" text NOT NULL,
  "amount_rials" integer NOT NULL,
  "coins" integer NOT NULL,
  "provider" text DEFAULT 'zarinpal_sandbox' NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "authority" text,
  "redirect_url" text,
  "ref_id" text,
  "failure_message" text,
  "paid_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
  CONSTRAINT "radicoin_pack_orders_amount_positive" CHECK ("amount_rials" > 0),
  CONSTRAINT "radicoin_pack_orders_coins_positive" CHECK ("coins" > 0),
  CONSTRAINT "radicoin_pack_orders_status_valid" CHECK ("status" IN ('pending', 'paid', 'failed', 'canceled'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "radicoin_pack_orders_user_checkout_unique" ON "radicoin_pack_orders" ("user_id", "checkout_key");
CREATE UNIQUE INDEX IF NOT EXISTS "radicoin_pack_orders_authority_unique" ON "radicoin_pack_orders" ("authority");
CREATE INDEX IF NOT EXISTS "radicoin_pack_orders_user_created_idx" ON "radicoin_pack_orders" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "radicoin_pack_orders_pending_idx" ON "radicoin_pack_orders" ("status", "created_at");
