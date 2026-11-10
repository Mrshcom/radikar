UPDATE "employer_positions" SET "workflow_stage" = 4, "review_method" = 'smart' WHERE "screening_status" = 'completed';--> statement-breakpoint
UPDATE "employer_positions" SET "workflow_stage" = 3, "review_method" = 'smart' WHERE "screening_status" IN ('processing', 'failed');--> statement-breakpoint
UPDATE "employer_positions" AS position SET "workflow_stage" = 4, "review_method" = 'manual' WHERE "screening_status" = 'not_started' AND EXISTS (SELECT 1 FROM "employer_candidates" AS candidate WHERE candidate."position_id" = position."id" AND candidate."invitation_status" <> 'not_invited');
