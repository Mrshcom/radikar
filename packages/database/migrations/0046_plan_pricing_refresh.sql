UPDATE "plans"
SET
  "name" = 'شروع',
  "description" = 'برای تجربهٔ نخستین تحلیل و شناخت فضای رادیکار',
  "features" = '["۱ رزومه","۳ خروجی PDF","۱ تحلیل تطبیق شغلی","۳ تحلیل کوتاه داشبورد"]'::jsonb,
  "ai_credits" = 5,
  "match_credits" = 1,
  "interview_credits" = 0,
  "updated_at" = now()
WHERE "id" = 'free';

UPDATE "plans"
SET
  "name" = 'جست‌وجوی شغلی',
  "description" = 'برای یک ماه اپلای هدفمند و آمادگی مصاحبه',
  "features" = '["۵ رزومه","خروجی PDF نامحدود","۸ تحلیل تطبیق شغلی","۲ رزومهٔ هدفمند","۳ مصاحبهٔ تمرینی","۱۰ تحلیل کوتاه داشبورد"]'::jsonb,
  "price_rials" = 5490000,
  "radicoin_cost" = 549,
  "ai_credits" = 51,
  "match_credits" = 8,
  "interview_credits" = 3,
  "updated_at" = now()
WHERE "id" = 'job-search';

UPDATE "plans"
SET
  "name" = 'حرفه‌ای',
  "description" = 'برای پیگیری جدی فرصت‌ها و آمادگی حرفه‌ای برای مصاحبه',
  "features" = '["رزومه و خروجی PDF نامحدود","۱۵ تحلیل تطبیق شغلی","۳ رزومهٔ هدفمند","۴ مصاحبهٔ تمرینی","۲۰ تحلیل کوتاه داشبورد","اولویت در قابلیت‌های حرفه‌ای"]'::jsonb,
  "price_rials" = 8990000,
  "radicoin_cost" = 899,
  "ai_credits" = 85,
  "match_credits" = 15,
  "interview_credits" = 4,
  "updated_at" = now()
WHERE "id" = 'professional';

UPDATE "plans"
SET
  "name" = 'شروع استخدام',
  "description" = 'برای ساخت نخستین پوزیشن و آشنایی با فرایند استخدام',
  "features" = '["ساخت و مدیریت ۱ پوزیشن فعال","ورود رزومه و مشاهده فایل اصلی","مدیریت نامزدها در مراحل استخدام","۳ تحلیل کوتاه پوزیشن","پایش و دعوت به مصاحبه با رادیکوین"]'::jsonb,
  "updated_at" = now()
WHERE "id" = 'employer-free';

UPDATE "plans"
SET
  "name" = 'جذب حرفه‌ای',
  "description" = 'برای مدیریت فعال فرایند جذب در چند موقعیت شغلی',
  "features" = '["مدیریت ۳ پوزیشن هم‌زمان","ورود گروهی رزومه‌ها","۲۰ پایش هوشمند رزومه","۳ مصاحبهٔ دعوتی نامزد","۱۰ تحلیل کوتاه پوزیشن و داشبورد"]'::jsonb,
  "price_rials" = 5990000,
  "radicoin_cost" = 599,
  "updated_at" = now()
WHERE "id" = 'employer-growth';

UPDATE "plans"
SET
  "name" = 'استخدام تیمی',
  "description" = 'برای استخدام مستمر و بررسی حجم بالاتر رزومه‌ها',
  "features" = '["مدیریت ۱۰ پوزیشن هم‌زمان","ورود گروهی رزومه‌ها","۴۰ پایش هوشمند رزومه","۷ مصاحبهٔ دعوتی نامزد","۲۰ تحلیل کوتاه پوزیشن و داشبورد"]'::jsonb,
  "price_rials" = 12990000,
  "radicoin_cost" = 1299,
  "updated_at" = now()
WHERE "id" = 'employer-scale';

UPDATE "user_memberships" AS membership
SET
  "resumes_remaining" = plan."resume_limit",
  "pdf_downloads_remaining" = plan."pdf_download_limit",
  "ai_credits_remaining" = plan."ai_credits",
  "match_credits_remaining" = plan."match_credits",
  "interview_credits_remaining" = plan."interview_credits",
  "updated_at" = now()
FROM "plans" AS plan
WHERE membership."plan_id" = plan."id";
