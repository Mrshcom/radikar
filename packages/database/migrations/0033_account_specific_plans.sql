ALTER TABLE "plans" ADD COLUMN "account_type" text DEFAULT 'candidate' NOT NULL;
ALTER TABLE "plans" ADD COLUMN "features" jsonb DEFAULT '[]'::jsonb NOT NULL;

UPDATE "plans" SET "features" = CASE "id"
  WHEN 'free' THEN '["۱ رزومه","۳ خروجی PDF","۵ اعتبار هوش مصنوعی","۱ تحلیل تطبیق شغلی","۱ جلسه آمادگی مصاحبه"]'::jsonb
  WHEN 'job-search' THEN '["۵ رزومه","خروجی PDF نامحدود","۴۰ اعتبار هوش مصنوعی","۱۵ تحلیل تطبیق شغلی","۵ جلسه آمادگی مصاحبه"]'::jsonb
  WHEN 'professional' THEN '["رزومه و خروجی PDF نامحدود","۱۵۰ اعتبار هوش مصنوعی","۵۰ تحلیل تطبیق شغلی","۱۵ جلسه آمادگی مصاحبه","اولویت در قابلیت‌های حرفه‌ای"]'::jsonb
  ELSE "features"
END;

INSERT INTO "plans" ("id", "account_type", "name", "description", "features", "price_rials", "radicoin_cost", "duration_days", "resume_limit", "pdf_download_limit", "ai_credits", "match_credits", "interview_credits", "is_free", "is_purchasable", "is_active", "sort_order", "created_at", "updated_at") VALUES
('employer-free', 'employer', 'شروع استخدام', 'برای آشنایی با فضای استخدام و مدیریت اولین پوزیشن', '["ساخت و مدیریت ۱ پوزیشن فعال","ورود رزومه و مشاهده فایل اصلی","مدیریت نامزدها در مراحل استخدام","پایش و دعوت به مصاحبه با رادیکوین"]'::jsonb, 0, NULL, 30, 0, 0, 0, 0, 0, true, false, true, 10, now(), now()),
('employer-growth', 'employer', 'جذب حرفه‌ای', 'برای تیم‌هایی که چند موقعیت شغلی را هم‌زمان پیش می‌برند', '["مدیریت هم‌زمان پوزیشن‌های استخدامی","ورود گروهی رزومه‌ها","پایش هوشمند و رتبه‌بندی نامزدها","دعوت مستقیم به مصاحبه","نمای یکپارچه فرایند جذب"]'::jsonb, 5990000, 1200, 30, 0, 0, 0, 0, 0, false, true, true, 20, now(), now()),
('employer-scale', 'employer', 'استخدام تیمی', 'برای جذب مستمر، حجم رزومه بیشتر و همکاری تیم استخدام', '["همه امکانات جذب حرفه‌ای","مدیریت حجم بالاتر رزومه و نامزد","گردش‌کار یکپارچه پایش تا مصاحبه","دسترسی سریع به سوابق سفارش و اعتبار","مناسب تیم‌های در حال رشد"]'::jsonb, 11990000, 3000, 30, 0, 0, 0, 0, 0, false, true, true, 30, now(), now());

UPDATE "user_memberships" AS membership
SET "plan_id" = 'employer-free', "resumes_remaining" = 0, "pdf_downloads_remaining" = 0,
    "ai_credits_remaining" = 0, "match_credits_remaining" = 0, "interview_credits_remaining" = 0,
    "updated_at" = now()
FROM "users" AS app_user
WHERE membership."user_id" = app_user."id" AND app_user."account_type" = 'employer';

DROP INDEX IF EXISTS "plans_active_sort_idx";
CREATE INDEX "plans_account_active_sort_idx" ON "plans" USING btree ("account_type", "is_active", "sort_order");
