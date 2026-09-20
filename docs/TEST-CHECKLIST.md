# چک‌لیست فازبندی تست رادیکار

این چک‌لیست مسیر تست را از تغییر کوچک تا انتشار production پوشش می‌دهد. هر مورد باید با وضعیت، تاریخ، محیط اجرا و لینک لاگ یا گزارش تکمیل شود.

## روش ثبت نتیجه

- [ ] وضعیت هر مورد ثبت شد: `Pass`، `Fail`، `Blocked` یا `Not applicable`
- [ ] برای هر `Fail`، issue، شدت (`Blocker`، `Critical`، `Major`، `Minor`) و reproduction step ثبت شد
- [ ] تست‌های وابسته به provider، درگاه و پیامک با mock یا sandbox قابل تکرار هستند
- [ ] دادهٔ واقعی کاربران در تست استفاده نمی‌شود و دادهٔ تست قابل پاک‌سازی است

## فاز صفر: آماده‌سازی محیط و قراردادها

- [ ] Node، npm، Docker، PostgreSQL و پورت‌های Web/API بررسی شدند
- [ ] `npm ci` بدون خطا اجرا شد و lockfile با packageها هماهنگ است
- [ ] فایل‌های env برای Web، API و providerها ساخته و secretها خارج از Git هستند
- [ ] PostgreSQL بالا است، migrationها اجرا شده‌اند و seed فقط در محیط تست اعمال شده است
- [ ] CORS، cookie، دامنهٔ Web/API، timezone و `dir=rtl` بررسی شدند
- [ ] نسخهٔ schema، API contract، مدل‌های مشترک و feature flagها ثبت شدند
- [ ] گزارش baseline از `npm run typecheck`، `npm run lint` و `npm run build:web` ذخیره شد

## فاز یک: تست packageهای مشترک

### Validators و typeها

- [ ] schemaهای Zod برای ورودی معتبر، ناقص، null، نوع اشتباه و ارقام فارسی تست شدند
- [ ] نرمال‌سازی رزومه، متن، آرایه‌ها، تاریخ‌ها، زبان‌ها و شمارهٔ تلفن بررسی شد
- [ ] payloadهای ناشناخته حذف یا کنترل می‌شوند و دادهٔ ناامن عبور نمی‌کند
- [ ] typeهای مشترک Web و API بدون تفاوت compile می‌شوند

### Config و Database

- [ ] env اجباری، مقدار پیش‌فرض، مقدار نامعتبر و secret گمشده تست شدند
- [ ] migration از دیتابیس خالی، دیتابیس موجود و اجرای دوباره عبور می‌کند
- [ ] constraint، unique، relation، index، pagination و ترتیب رکوردها بررسی شدند
- [ ] transaction، rollback، خطای اتصال و قطع موقت دیتابیس تست شدند
- [ ] repositoryها برای create، read، update، delete، filter و empty result تست شدند

### AI client

- [ ] provider پیش‌فرض `gapgpt` و مدل `gapgpt-qwen-3.6` بررسی شد
- [ ] providerهای GapGPT، DeepSeek و OpenAI-compatible با تنظیم درست تست شدند
- [ ] پاسخ معتبر JSON، JSON داخل markdown، پاسخ خالی، پاسخ ناقص و مدل نامعتبر تست شدند
- [ ] timeout، abort، retry، HTTP 4xx/5xx، DNS و خطای شبکه تست شدند
- [ ] مصرف token، هزینه، model usage و عدم ثبت secret در log بررسی شدند

## فاز دو: تست بک‌اند API

### زیرساخت و middleware

- [ ] `/health` و `/ready` در وضعیت سالم و ناسالم پاسخ درست می‌دهند
- [ ] request id در پاسخ و log وجود دارد و برای trace قابل استفاده است
- [ ] CORS فقط originهای مجاز را قبول می‌کند و credentialها درست کار می‌کنند
- [ ] body limit، multipart limit، rate limit و headerهای امنیتی بررسی شدند
- [ ] خطای validation به 400/422، عدم احراز هویت به 401 و عدم دسترسی به 403 تبدیل می‌شود
- [ ] خطای داخلی اطلاعات stack، token یا secret را به کاربر برنمی‌گرداند

### احراز هویت و حساب

- [ ] درخواست OTP، فرمت شماره، rate limit، انقضا و ارسال دوباره تست شدند
- [ ] OTP درست، غلط، منقضی، چندبارمصرف و خروج از حساب تست شدند
- [ ] cookieهای session در HTTP توسعه و HTTPS production تنظیم درست دارند
- [ ] session بعد از refresh، چند تب، logout و expiry رفتار درست دارد
- [ ] نقش‌های user، admin و superadmin برای هر route بررسی شدند

### داده و پنل مدیریت

- [ ] routeهای کاربران، عضویت‌ها، سفارش‌ها، پرداخت‌ها، رکوردها و آمار تست شدند
- [ ] فیلتر، جست‌وجو، sort، pagination، page size و دادهٔ خالی تست شدند
- [ ] تغییر پلن، اعتبار، وضعیت، حذف و عملیات تکراری idempotent هستند
- [ ] کاربر عادی به داده یا mutation مدیریتی دسترسی ندارد
- [ ] تنظیم provider از پنل ذخیره، از دیتابیس خوانده و بعد از restart حفظ می‌شود
- [ ] تغییر provider بین `gapgpt-qwen-3.6` و providerهای دیگر روی همهٔ عملیات اعمال می‌شود

### رزومه و پایگاه دانش

- [ ] import فایل PDF، DOCX و TXT معتبر انجام می‌شود
- [ ] فرمت نامعتبر، فایل خالی، فایل بزرگ، PDF اسکن‌شده و PDF بیشتر از ۳۰ صفحه تست شدند
- [ ] استخراج تماس، خلاصه، تجربه، تحصیل، پروژه، مهارت، زبان و لینک LinkedIn بررسی شد
- [ ] دادهٔ موجود هنگام merge از بین نمی‌رود و کلیدهای ناشناخته حذف می‌شوند
- [ ] خطای provider، timeout و قطع شبکه با پیام قابل فهم و status درست ثبت می‌شوند
- [ ] import تکراری، هم‌زمان و لغوشده رفتار مشخص دارد

### شغل، تطبیق و اپلای

- [ ] دریافت، ذخیره، حذف و تغییر وضعیت فرصت شغلی تست شد
- [ ] استخراج لینک آگهی، URL نامعتبر، redirect، SSRF و لینک خصوصی بررسی شد
- [ ] تحلیل تطبیق با رزومهٔ خالی، آگهی نامعتبر، پاسخ معتبر و provider خطادار تست شد
- [ ] ساخت رزومهٔ اختصاصی، ذخیره، دانلود و خطای مدل تست شد
- [ ] ایجاد، ویرایش، جابه‌جایی مرحله و حذف اپلای تست شدند

### پرداخت و مصرف

- [ ] ساخت سفارش، callback، verify، cancel، duplicate callback و refund تست شدند
- [ ] sandbox درگاه، خطای provider و timeout پرداخت بررسی شدند
- [ ] مصرف اعتبار در موفقیت، شکست، retry و درخواست هم‌زمان دوباره کسر نمی‌شود
- [ ] گزارش هزینه و model usage با provider و model درست ثبت می‌شود

## فاز سه: تست فرانت‌اند و کامپوننت‌ها

### عمومی و stateها

- [ ] loading، skeleton، empty، error، retry، success و disabled state همهٔ صفحات دیده شدند
- [ ] خطاها کنار context مربوط نمایش داده می‌شوند و روی CTA یا bottom navigation نمی‌افتند
- [ ] toast، alert و modal قابل بستن، قابل خواندن و دارای `aria-live` مناسب هستند
- [ ] refresh، back/forward، deep link و خروج از حساب تست شدند
- [ ] API requestها از TanStack Query یا لایهٔ مشترک استفاده می‌کنند و fetch تکراری ندارند

### صفحات عمومی و ورود

- [ ] خانه، درباره، تماس، راهنماها، حریم خصوصی و شرایط استفاده
- [ ] ورود، دریافت OTP، ورود با OTP، خطا و redirect بعد از ورود
- [ ] فونت Vazirmatn محلی، RTL، ارقام فارسی و متن‌های طولانی بررسی شدند

### پنل کاربر

- [ ] داشبورد و کارت‌های آمار
- [ ] رزومه‌ها، ساخت رزومه، ویرایش مرحله‌ای، preview، ذخیره و دانلود
- [ ] پایگاه دانش و import رزومه
- [ ] فرصت‌های شغلی، جست‌وجو، فیلتر، ذخیره و empty state
- [ ] تطبیق رزومه و شغل، ساخت نسخهٔ اختصاصی و خطاهای مدل
- [ ] مدیریت اپلای، مصاحبه، حساب و تنظیمات
- [ ] ارتقای پلن، سفارش‌ها و نتیجهٔ پرداخت

### پنل مدیریت

- [ ] داشبورد superadmin و چیدمان کارت‌ها در موبایل، تبلت و دسکتاپ
- [ ] کاربران، عضویت‌ها، سفارش‌ها، پرداخت‌ها و رکوردها
- [ ] تنظیم provider، انتخاب مدل، نرخ دلار و حفظ تنظیمات بعد از refresh
- [ ] model usage، فیلتر provider/model، صفحه‌بندی و دادهٔ خالی
- [ ] مدیریت فضای کاری و عملیات حساس با confirmation

## فاز چهار: responsive، دسترسی‌پذیری و سازگاری

- [ ] موبایل 320، 360، 390 و 430 پیکسل در iOS Safari و Android Chrome
- [ ] تبلت portrait و landscape
- [ ] دسکتاپ 1024، 1280، 1440 و 1920 پیکسل
- [ ] bottom navigation، modal، pagination، dropdown و جدول در safe area درست هستند
- [ ] keyboard navigation، focus visible، tab order و Escape برای modal تست شدند
- [ ] label، role، aria-label، aria-live، contrast و اندازهٔ touch target بررسی شدند
- [ ] فونت، overflow افقی، متن طولانی فارسی/انگلیسی و اعداد در RTL بررسی شدند
- [ ] کاهش حرکت، zoom مرورگر، dark/light system preference و چاپ رزومه بررسی شدند

## فاز پنج: تست E2E سناریوهای اصلی

- [ ] ثبت‌نام/ورود → تکمیل پروفایل → ساخت رزومه → ذخیره → preview
- [ ] import رزومه → بازبینی فیلدها → ذخیره پایگاه دانش → استفاده در تطبیق
- [ ] فرصت شغلی → ذخیره → تحلیل تطبیق → ساخت رزومهٔ اختصاصی → اپلای
- [ ] ارتقای پلن → پرداخت sandbox → callback → افزایش اعتبار → مصرف AI
- [ ] superadmin → تغییر provider/model → refresh/restart → import موفق با provider جدید
- [ ] قطع API، timeout مدل و بازیابی سرویس بدون از دست رفتن فرم یا داده

## فاز شش: امنیت، عملکرد و پایداری

- [ ] تست دسترسی افقی و عمودی روی تمام routeها
- [ ] تست XSS در نام، متن رزومه، URL، شرکت و فایل واردشده
- [ ] تست SSRF برای لینک‌های import و logo
- [ ] تست upload با فایل جعلی، MIME اشتباه، zip bomb و حجم بیش از limit
- [ ] secret، cookie، OTP، authorization و دادهٔ شخصی در log یا response افشا نمی‌شوند
- [ ] baseline زمان پاسخ API، import، dashboard و first load ثبت شد
- [ ] pagination سمت سرور برای دادهٔ بزرگ فعال است و query بدون index شناسایی شد
- [ ] چند درخواست هم‌زمان، retry و refresh token باعث duplicate mutation نمی‌شوند
- [ ] memory leak، connection pool، timeout و shutdown graceful بررسی شدند

## فاز هفت: regression و انتشار

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test:all`
- [ ] `npm run build:web`
- [ ] migration production روی backup یا staging امتحان شد
- [ ] env production، provider، API key، CORS، cookie و callback URL بازبینی شدند
- [ ] smoke test بعد از deploy برای Web، API، auth، import، AI و payment انجام شد
- [ ] log، health check، alert و rollback plan فعال هستند
- [ ] گزارش نهایی شامل commit، محیط، زمان اجرا، موارد fail و تأیید release ثبت شد

## معیار خروج هر فاز

- [ ] هیچ `Blocker` یا `Critical` باز باقی نمانده است
- [ ] `Major`ها یا رفع شده‌اند یا owner و deadline مشخص دارند
- [ ] تست‌های خودکار و smoke test محیط مقصد موفق هستند
- [ ] تغییرات قابل بازگشت و migration/backup قابل بازیابی است
- [ ] مالک محصول، backend و frontend نتیجهٔ فاز را تأیید کرده‌اند
