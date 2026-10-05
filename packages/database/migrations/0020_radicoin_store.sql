ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "radicoin_cost" integer;
UPDATE "plans" SET "radicoin_cost" = 1000 WHERE "id" = 'job-search' AND "radicoin_cost" IS NULL;
UPDATE "plans" SET "radicoin_cost" = 2500 WHERE "id" = 'professional' AND "radicoin_cost" IS NULL;
ALTER TABLE "plans" ADD CONSTRAINT "plans_radicoin_cost_positive" CHECK ("radicoin_cost" IS NULL OR "radicoin_cost" > 0);
