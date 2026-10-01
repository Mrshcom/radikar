ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "onboarding_state" jsonb NOT NULL
  DEFAULT '{"version":1,"status":"not_started","completedSteps":[]}'::jsonb;
