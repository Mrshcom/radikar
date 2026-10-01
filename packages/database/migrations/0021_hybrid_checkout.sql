ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "checkout_key" uuid;
CREATE UNIQUE INDEX IF NOT EXISTS "orders_user_checkout_key_unique" ON "orders" ("user_id", "checkout_key");
