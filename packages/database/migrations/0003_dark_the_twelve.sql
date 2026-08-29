CREATE TABLE "plans" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price_rials" integer NOT NULL,
	"duration_days" integer DEFAULT 30 NOT NULL,
	"resume_limit" integer,
	"pdf_download_limit" integer,
	"ai_credits" integer DEFAULT 0 NOT NULL,
	"match_credits" integer DEFAULT 0 NOT NULL,
	"interview_credits" integer DEFAULT 0 NOT NULL,
	"is_free" boolean DEFAULT false NOT NULL,
	"is_purchasable" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_memberships" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"free_granted_at" timestamp with time zone,
	"resumes_remaining" integer,
	"pdf_downloads_remaining" integer,
	"ai_credits_remaining" integer DEFAULT 0 NOT NULL,
	"match_credits_remaining" integer DEFAULT 0 NOT NULL,
	"interview_credits_remaining" integer DEFAULT 0 NOT NULL,
	"canceled_at" timestamp with time zone,
	"canceled_by_user_id" uuid,
	"cancel_reason" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" text NOT NULL,
	"amount_rials" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"gateway" text DEFAULT 'zarinpal_sandbox' NOT NULL,
	"authority" text,
	"ref_id" text,
	"callback_status" text,
	"failure_code" integer,
	"failure_message" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" text DEFAULT 'zarinpal_sandbox' NOT NULL,
	"authority" text NOT NULL,
	"amount_rials" integer NOT NULL,
	"status" text DEFAULT 'initiated' NOT NULL,
	"provider_code" integer,
	"ref_id" text,
	"card_pan" text,
	"card_hash" text,
	"provider_data" jsonb,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"membership_id" uuid,
	"plan_id" text,
	"order_id" uuid,
	"actor_user_id" uuid,
	"type" text NOT NULL,
	"duration_days" integer,
	"details" jsonb,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"membership_id" uuid,
	"resource" text NOT NULL,
	"units" integer NOT NULL,
	"operation" text NOT NULL,
	"request_id" text,
	"actor_user_id" uuid,
	"details" jsonb,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_memberships" ADD CONSTRAINT "user_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_memberships" ADD CONSTRAINT "user_memberships_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_memberships" ADD CONSTRAINT "user_memberships_canceled_by_user_id_users_id_fk" FOREIGN KEY ("canceled_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "membership_events" ADD CONSTRAINT "membership_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "membership_events" ADD CONSTRAINT "membership_events_membership_id_user_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."user_memberships"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "membership_events" ADD CONSTRAINT "membership_events_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "membership_events" ADD CONSTRAINT "membership_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "membership_events" ADD CONSTRAINT "membership_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_membership_id_user_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."user_memberships"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "plans_active_sort_idx" ON "plans" USING btree ("is_active", "sort_order");
--> statement-breakpoint
CREATE UNIQUE INDEX "user_memberships_user_unique" ON "user_memberships" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "user_memberships_plan_status_idx" ON "user_memberships" USING btree ("plan_id", "status");
--> statement-breakpoint
CREATE INDEX "user_memberships_expiry_idx" ON "user_memberships" USING btree ("status", "expires_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "orders_order_number_unique" ON "orders" USING btree ("order_number");
--> statement-breakpoint
CREATE UNIQUE INDEX "orders_authority_unique" ON "orders" USING btree ("authority");
--> statement-breakpoint
CREATE INDEX "orders_user_created_idx" ON "orders" USING btree ("user_id", "created_at");
--> statement-breakpoint
CREATE INDEX "orders_status_created_idx" ON "orders" USING btree ("status", "created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "payments_authority_unique" ON "payments" USING btree ("authority");
--> statement-breakpoint
CREATE INDEX "payments_order_idx" ON "payments" USING btree ("order_id", "created_at");
--> statement-breakpoint
CREATE INDEX "payments_status_created_idx" ON "payments" USING btree ("status", "created_at");
--> statement-breakpoint
CREATE INDEX "membership_events_user_created_idx" ON "membership_events" USING btree ("user_id", "created_at");
--> statement-breakpoint
CREATE INDEX "membership_events_type_created_idx" ON "membership_events" USING btree ("type", "created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "usage_events_request_unique" ON "usage_events" USING btree ("request_id");
--> statement-breakpoint
CREATE INDEX "usage_events_user_created_idx" ON "usage_events" USING btree ("user_id", "created_at");
--> statement-breakpoint
CREATE INDEX "usage_events_resource_created_idx" ON "usage_events" USING btree ("resource", "created_at");
