# متریک‌های هفتگی رادیکار و قرارداد رویدادها

> بازبینی‌شده در ۲ مهر ۱۴۰۵ بر اساس جریان فعلی Web/API، onboarding، عضویت، ریفرال و رادیکوین. در این نسخه event analytics اختصاصی وجود ندارد؛ بنابراین این سند میان دادهٔ عملیاتیِ قابل استخراج و instrumentation لازم تمایز می‌گذارد. هیچ baseline یا benchmark خارجی فرض نشده است.

## جریان فعلی که اندازه می‌گیریم

```text
درخواست OTP → تأیید ورود/ساخت حساب → عضویت رایگان
  → onboarding: پروفایل → تحلیل تطابق → رزومه → ثبت اپلای
  → ورود یا ساخت رزومهٔ اول
  → ورود متن/لینک/فرصت Job Pool → تحلیل تطابق
  → رزومهٔ هدفمند / ثبت اپلای / تمرین مصاحبه
  → ارتقای عضویت یا مصرف رادیکوین
```

دو نکتهٔ مهم دربارهٔ وضعیت فعلی:

- checklist فعلی تکمیل onboarding را از وجود رکوردهای `knowledgeProfiles`، `resumes`، `matchAnalyses` و `applications` تشخیص می‌دهد؛ ترتیب نمایش آن «پروفایل → تحلیل → رزومه → اپلای» است. در عین حال کاربر می‌تواند رزومه را پیش یا پس از تحلیل بسازد. بنابراین فرمول‌ها باید ترتیب زمانی را صریح کنند، نه اینکه فقط به تیک checklist تکیه کنند.
- داده‌های عملیاتیِ فعلی شامل `users`، `auth_sessions`، `data_records`، `user_memberships`، `orders/payments`، `referrals` و `radicoin_transactions` هستند. این‌ها برای بازسازی اولیه مفیدند، اما برای فهم دلیل ریزش یا خطای provider کافی نیستند.

## پنج متریک اصلی، در مرور هفتگی

برای هر متریک، هفته با منطقهٔ زمانی `Asia/Tehran` بسته شود. ابتدا دو هفته دادهٔ کامل جمع شود؛ تا آن زمان **هدف عملکردی عددی تعیین نمی‌کنیم**. تنها هدف اولیهٔ غیرقابل‌مذاکره، کامل‌بودن حداقل ۹۵٪ رویدادهای تعریف‌شده در هر قیف است. بعد از baseline، هدف و آستانهٔ هشدار با دادهٔ خود رادیکار تصویب می‌شود، نه با benchmark ساختگی.

| # | متریک | فرمول شفاف | منبع فعلی / event لازم | برش‌های ضروری | تصمیم و اقدام اگر پایین بود |
| --- | --- | --- | --- | --- | --- |
| ۱ | **نرخ فعال‌سازی ۷روزهٔ حلقهٔ اصلی** | تعداد کاربران تازه‌ثبت‌نام‌شده که ظرف ۷ روز هم یک `resume_saved` و هم یک `match_analysis_completed` موفق دارند ÷ همهٔ کاربران تازه‌ثبت‌نام‌شدهٔ همان cohort | اکنون بخشی از آن با `users.created_at` و `data_records` قابل بازسازی است؛ رویدادهای قطعی لازم‌اند. | روش ورود، referral/organic، دستگاه، منبع آگهی، تکمیل پروفایل | آیا onboarding کاربر را به اولین ارزش می‌رساند؟ اگر زیر baseline رفت، قیف را بین OTP، پروفایل، رزومه و تحلیل بشکنید؛ یک مانع را در هر آزمایش حذف/شفاف کنید. |
| ۲ | **زمان تا اولین ارزش** | میانهٔ فاصلهٔ زمانی از `auth_signup_completed` تا نخستین `match_analysis_completed` موفق، فقط برای کاربران فعال‌شده | اکنون تقریبی و نیازمند join زمانی رکوردهاست؛ eventهای آغاز/موفقیت تحلیل لازم‌اند. | ورود دستی متن در برابر URL/Job Pool، نوع رزومه، دستگاه | آیا ارزش خیلی دیر می‌رسد؟ اگر میانه بدتر از baseline شد، ورودی آگهی، انتخاب رزومه و انتظار مدل را جداگانه بررسی کنید؛ کوتاه‌ترین گلوگاه را اول اصلاح کنید. |
| ۳ | **تبدیل تحلیل به اقدام شغلی** | کاربران دارای `match_analysis_completed` که حداکثر تا ۷ روز یک `tailored_resume_created` یا `application_created` ثبت می‌کنند ÷ کاربران دارای تحلیل کامل | تحلیل و اپلای در `data_records` قابل مشاهده‌اند؛ تمایز رزومهٔ هدفمند و پیوند به تحلیل instrumentation می‌خواهد. | score band، منبع آگهی، gap count، نوع پلن، referral | آیا تحلیل واقعاً تصمیم و اقدام می‌سازد؟ اگر پایین بود، گزارش تطابق و CTAهای «ساخت رزومه/ثبت اپلای» را بازبینی کنید؛ برش‌های امتیاز پایین را به‌عنوان failure پنهان نگیرید. |
| ۴ | **ماندگاری جست‌وجوی شغلی در هفتهٔ چهارم** | کاربران فعال‌شده در cohort که در روزهای ۲۲ تا ۲۸ حداقل یک `meaningful_job_search_event` دارند ÷ کاربران فعال‌شدهٔ همان cohort | اکنون از timestamp رکوردهای رزومه/تحلیل/اپلای/مصاحبه قابل تقریب است؛ event واحد لازم است. | cohort عضویت، منبع ثبت‌نام، وضعیت referral، موجودی/مصرف رادیکوین | آیا رادیکار به ابزار پیگیری مداوم تبدیل می‌شود؟ اگر پایین بود، به‌جای پاداش ورود صرف، یادآوری و پیشنهاد اقدام بعدی را بر پایهٔ آخرین فرصت/مرحلهٔ اپلای آزمایش کنید. |
| ۵ | **تبدیل ارزش به ارتقا** | کاربران فعال‌شده‌ای که ظرف ۳۰ روز `membership_upgraded` موفق یا `radicoin_plan_redeemed` دارند ÷ کاربران فعال‌شدهٔ همان cohort | خرید/عضویت و تراکنش رادیکوین در دیتابیس هست؛ attribution به فعال‌سازی و eventهای checkout لازم است. | پلن، مسیر پرداخت در برابر رادیکوین، تعداد تحلیل/رزومه هدفمند، referral، استفاده از سهمیه | آیا ارزش پیش از paywall قابل لمس است؟ اگر پایین بود، ابتدا تفاوت پلن/سهمیه و نقطهٔ upgrade را بازبینی کنید؛ افزایش صرف پاداش رادیکوین یا تخفیف بدون شواهد مجاز نیست. |

`meaningful_job_search_event` فقط یکی از این رویدادهاست: ذخیرهٔ رزومه، تکمیل تحلیل تطابق، ساخت رزومهٔ هدفمند، ایجاد/تغییر مرحلهٔ اپلای، یا تکمیل جلسه/ارزیابی مصاحبه. login، بازدید صفحه و دریافت رادیکوین روزانه به‌تنهایی نباید این متریک را بالا ببرند.

## وضعیت مشاهده‌پذیری امروز

| موضوع | امروز قابل مشاهده است | شکاف |
| --- | --- | --- |
| حساب و ورود | ایجاد کاربر، session و زمان آخرین ورود؛ پاداش ورود روزانه در `radicoin_transactions` | درخواست OTP، موفقیت تحویل SMS، خطا به تفکیک provider/خط و تأیید OTP به‌صورت قیفی ثبت نمی‌شوند. |
| onboarding | state checklist روی کاربر و وجود رکوردهای چهار قدم | بازشدن/ردکردن checklist و علت ناتمام‌ماندن هر قدم نداریم. |
| رزومه و تحلیل | رکوردهای رزومه، فرصت، تحلیل و زمان ایجاد/به‌روزرسانی | پیوند استاندارد «کدام رزومه/آگهی/تحلیل به چه اقدام بعدی رسید» و outcome خطا نداریم. |
| پرداخت و رادیکوین | order/payment/membership، wallet و دفتر تراکنش idempotent | نمایش paywall، شروع checkout، لغو/خطای checkout و انگیزهٔ واقعی استفاده از coin ثبت نمی‌شوند. |
| referral | visit، referral تأییدشده و پاداش ثبت‌نام/فعال‌سازی/ارتقا | attribution پایدار از کانال دعوت تا فعال‌سازی و کیفیت cohort دعوت‌شده در گزارش هفتگی وجود ندارد. |

## حداقل taxonomy رویدادها

همهٔ رویدادها باید server-side یا از یک endpoint trusted ثبت شوند، `event_id` یکتا و `occurred_at` با زمان UTC داشته باشند؛ گزارش هفتگی سپس آن‌ها را به تهران تبدیل می‌کند. از ارسال شماره همراه، ایمیل، متن رزومه، متن آگهی، URL خصوصی یا متن پاسخ مصاحبه در properties خودداری کنید.

| نام پایدار event | نقطهٔ trigger | properties حداقلی | وضعیت |
| --- | --- | --- | --- |
| `auth_otp_requested` | پس از اعتبارسنجی شماره و پیش از تماس provider | `request_id`, `auth_method=phone`, `is_retry` | لازم |
| `auth_otp_delivery_result` | پاسخ نهایی provider | `request_id`, `provider`, `result=success|failure`, `failure_code` امن، `latency_ms` | لازم |
| `auth_signup_completed` | ساخت نخستین حساب پس از تأیید OTP | `auth_method`, `referral_present`, `user_role` | لازم |
| `onboarding_step_completed` | هر بار که یکی از چهار signal checklist برای نخستین‌بار کامل می‌شود | `step=profile|resume|match|application`, `completion_source` | لازم |
| `resume_saved` | ذخیرهٔ موفق رکورد رزومه | `resume_id`, `is_first_resume`, `source=manual|import|tailored`, `template_id?` | لازم؛ ذخیرهٔ رکورد امروز قابل استخراج است |
| `job_input_submitted` | ارسال متن، URL یا انتخاب فرصت Job Pool برای تحلیل | `job_id`, `source=text|url|job_pool`, `is_first_job_input` | لازم |
| `match_analysis_result` | پایان تحلیل مدل، موفق یا ناموفق | `analysis_id`, `job_id`, `resume_id`, `result=success|failure`, `source`, `latency_ms`, `failure_class?` | لازم؛ رکورد موفق امروز قابل استخراج است |
| `tailored_resume_created` | ذخیرهٔ موفق رزومهٔ خروجی تحلیل | `resume_id`, `source_analysis_id`, `job_id`, `is_first_tailored_resume` | لازم |
| `application_changed` | ایجاد اپلای یا تغییر مرحلهٔ آن | `application_id`, `job_id`, `action=created|stage_changed`, `from_stage?`, `to_stage?` | لازم؛ رکورد اپلای امروز قابل استخراج است |
| `interview_session_result` | ایجاد یا ارزیابی جلسهٔ مصاحبه | `session_id`, `action=created|answer_evaluated|completed`, `job_id?`, `result` | لازم |
| `membership_checkout_result` | شروع و پایان checkout یا redemption | `plan_id`, `payment_mode=cash|radicoin|hybrid`, `result=started|paid|failed|cancelled`, `order_id?` | لازم؛ payment موفق امروز قابل استخراج است |
| `radicoin_transaction_recorded` | پس از ثبت تراکنش wallet | `source`, `bucket`, `status`, `amount`, `related_event_id?` | تا حد زیادی از دفتر تراکنش موجود قابل استخراج است |
| `referral_outcome_recorded` | ثبت visit، signup، activation یا upgrade referral | `action=visited|signup_confirmed|activated|upgraded`, `referral_id` | لازم؛ بخش‌هایی از آن در referral/radicoin موجود است |

### قواعد مشترک properties

- `user_id` فقط در لایهٔ تحلیل داخلی و ترجیحاً pseudonymous نگهداری شود؛ در payload کلاینت قابل جعل نباشد.
- `request_id` یا `idempotency_key` باید رویدادهای retry را deduplicate کند.
- `result` و `failure_class` واژگان کنترل‌شده داشته باشند، نه متن خام provider یا LLM.
- `plan_id`، `job_id` و `resume_id` شناسه‌های داخلی‌اند؛ محتوای آن‌ها event property نیست.
- برای رویدادهای AI، تعداد اعتبار مصرف‌شده و latency ثبت شود، اما prompt و response در analytics نرود.

## گزارش هفتگی ۳۰ دقیقه‌ای

1. **کیفیت داده:** درصد رخدادهای کامل، eventهای duplicate و gapهای provider را بررسی کنید.
2. **پنج متریک:** مقدار این هفته، cohort/segment تغییرکرده و مقایسه با baseline دو هفته‌ای را در یک جدول ثبت کنید.
3. **یک گلوگاه:** فقط بزرگ‌ترین افت قیف را انتخاب کنید؛ فرض، مالک، تغییر و تاریخ ارزیابی را بنویسید.
4. **کیفیت محصول:** پنج نمونه تحلیل ناموفق/کم‌ارزش و پنج نمونه موفق را بدون اطلاعات هویتی مرور کنید.
5. **تصمیم:** یک آزمایش یا اصلاح برای هفتهٔ بعد؛ معیار توقف/ادامه و مخاطب هدف آن مشخص باشد.

## ترتیب پیاده‌سازی instrumentation

1. رویدادهای OTP و `auth_signup_completed` را server-side اضافه کنید؛ تا تحویل واقعی SMS پایدار نشده، قیف ثبت‌نام قابل قضاوت نیست.
2. سپس `resume_saved`، `job_input_submitted` و `match_analysis_result` را با شناسه‌های ارتباطی اضافه کنید؛ این سه برای متریک‌های ۱ تا ۳ حیاتی‌اند.
3. `application_changed` و eventهای checkout را برای متریک‌های ماندگاری و تبدیل اضافه کنید.
4. در آخر، attribution کامل referral/radicoin را وصل کنید. رادیکوین باید به رویداد معنادار متصل بماند، نه اینکه جانشین سنجش ارزش محصول شود.
