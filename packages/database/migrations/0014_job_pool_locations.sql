ALTER TABLE "job_pool_settings" ADD COLUMN IF NOT EXISTS "locations" jsonb DEFAULT '[]'::jsonb NOT NULL;
