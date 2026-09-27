ALTER TABLE "auth_sessions" ADD COLUMN IF NOT EXISTS "login_ip" text;
ALTER TABLE "auth_sessions" ADD COLUMN IF NOT EXISTS "logout_ip" text;
