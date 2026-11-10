ALTER TABLE "orders" ADD COLUMN "redirect_url" text;
--> statement-breakpoint
ALTER TABLE "credit_pack_orders" ADD COLUMN "provider" text DEFAULT 'zarinpal_sandbox' NOT NULL;
--> statement-breakpoint
ALTER TABLE "credit_pack_orders" ADD COLUMN "redirect_url" text;
