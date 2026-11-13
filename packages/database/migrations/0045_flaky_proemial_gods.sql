CREATE TABLE "employer_invitation_history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"candidate_id" uuid NOT NULL,
	"position_id" uuid NOT NULL,
	"invited_user_id" uuid,
	"token_hash" text NOT NULL,
	"deadline" timestamp with time zone,
	"status" text DEFAULT 'cancelled' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"cancelled_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employer_invitation_history" ADD CONSTRAINT "employer_invitation_history_candidate_id_employer_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."employer_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employer_invitation_history" ADD CONSTRAINT "employer_invitation_history_position_id_employer_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."employer_positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employer_invitation_history" ADD CONSTRAINT "employer_invitation_history_invited_user_id_users_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "employer_invitation_history_token_unique" ON "employer_invitation_history" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "employer_invitation_history_user_created_idx" ON "employer_invitation_history" USING btree ("invited_user_id","created_at");--> statement-breakpoint
CREATE INDEX "employer_invitation_history_candidate_idx" ON "employer_invitation_history" USING btree ("candidate_id");