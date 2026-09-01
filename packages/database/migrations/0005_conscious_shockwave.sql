CREATE TABLE "model_usage_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"request_id" text NOT NULL,
	"operation" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"token_source" text NOT NULL,
	"estimated_cost_micros" integer DEFAULT 0 NOT NULL,
	"status_code" integer NOT NULL,
	"successful" boolean NOT NULL,
	"duration_ms" integer NOT NULL,
	"attempt" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "model_usage_events" ADD CONSTRAINT "model_usage_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "model_usage_events_request_unique" ON "model_usage_events" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "model_usage_events_created_idx" ON "model_usage_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "model_usage_events_user_created_idx" ON "model_usage_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "model_usage_events_model_created_idx" ON "model_usage_events" USING btree ("provider","model","created_at");--> statement-breakpoint
CREATE INDEX "model_usage_events_operation_created_idx" ON "model_usage_events" USING btree ("operation","created_at");