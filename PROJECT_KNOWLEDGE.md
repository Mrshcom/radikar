# Radikar — Project Knowledge Base

> Last curated: 2026-09-18
>
> این سند نقشهٔ سریع پروژه است. پیش از اسکن وسیع repository، ابتدا همین فایل،
> `AGENTS.md` و در صورت نیاز `graphify query` را بخوانید. پس از هر تغییر
> معماری، مسیر API، قرارداد داده یا روند استقرار، این فایل را به‌روزرسانی کنید.

## هدف و معماری

Radikar یک SaaS فارسی/RTL برای ساخت رزومه، مدیریت فرصت‌های شغلی، تطبیق شغل،
مصاحبه و دانش حرفه‌ای است.

```text
Browser → Next.js Web → Fastify API → Neon/PostgreSQL
                           └→ LLM provider / Zarinpal / OTP provider
```

- Web هرگز مستقیم به دیتابیس متصل نمی‌شود.
- داده‌های دامنه در Local Storage یا IndexedDB نگهداری نمی‌شوند.
- Web مسیرهای API را از طریق `NEXT_PUBLIC_API_BASE_URL` فراخوانی می‌کند؛ در
  Vercel، proxyهای Web، مسیرهای `/api/*` و `/v1/*` را به API هدایت می‌کنند.

## ساختار سریع repository

| مسیر                    | مسئولیت                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `apps/web`              | Next.js App Router؛ رابط فارسی/RTL، پنل کاربر و مدیریت                                   |
| `apps/api`              | Fastify؛ احراز هویت، داده، پرداخت، AI، import و health checks                            |
| `packages/database`     | Drizzle schema، migration و seed PostgreSQL                                              |
| `packages/validators`   | قراردادها و اعتبارسنجی‌های مشترک Zod                                                     |
| `packages/shared-types` | typeهای مشترک بدون وابستگی به framework                                                  |
| `packages/ai`           | adapter/provider و پردازش پاسخ مدل‌های زبانی                                             |
| `packages/config`       | بارگذاری و اعتبارسنجی تنظیمات server                                                     |
| `deploy`                | Docker/Caddy و دستورالعمل استقرار VPS                                                    |
| `graphify-out`          | graph تولیدشدهٔ محلی؛ در Git نادیده گرفته می‌شود و با `graphify update .` بازسازی می‌شود |

## نقاط ورود و مسیرهای مهم

| موضوع                            | Web                                                                   | API                                                            |
| -------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------- |
| API client و proxy               | `apps/web/lib/api-client.ts` و routeهای `apps/web/app/api` / `app/v1` | `apps/api/src/app.ts` و `build-app.ts`                         |
| احراز هویت و OTP                 | `apps/web/app/login` و `app/_components/auth.tsx`                     | `modules/auth/routes.ts` و `service.ts`                        |
| رزومه                            | `apps/web/app/(panel)/resumes`                                        | data routes و `modules/imports`                                |
| jobs/applications/knowledge base | routeهای متناظر در `apps/web/app/(panel)`                             | `modules/data/routes.ts`                                       |
| تحلیل AI، تطبیق و مصاحبه         | `match`، `interview` و provider taskهای Web                           | `modules/ai/routes.ts` و `packages/ai`                         |
| پرداخت و عضویت                   | `orders`، `upgrade` و admin pages                                     | `modules/billing/*` و providerهای پرداخت                       |
| تایم‌لاین محصول و استوری         | `updates` و `admin/updates`                                           | `modules/product-timeline/*` و جدول `product_timeline_entries` |
| تیکت پشتیبانی                    | `/support`، `/employer/support` و `/admin/support`                    | `modules/support/routes.ts` و جدول‌های `support_tickets` / `support_messages` |
| بررسی سرویس                      | —                                                                     | `/health` و `/ready` در `modules/health/routes.ts`             |

پنل کارفرما (نسخهٔ محلی): `/employer` داشبورد اولیه و
`/employer/positions` فهرست مستقل پوزیشن‌هاست؛ `/employer/positions/new` ساخت،
`/employer/positions/[id]/edit` ویرایش و `/employer/positions/[id]` جزئیات و
پایش را جدا می‌کنند. ویرایش عنوان/شرح فقط پیش از شروع پایش و ساخت دعوت مجاز است
تا نتیجه‌ها و دعوت‌های ساخته‌شده با متن قبلی ناسازگار نشوند.
ماژول `apps/api/src/modules/employer/routes.ts` و جدول‌های `employer_positions` و
`employer_candidates` (migration `0028_employer_hiring.sql`) جریان ساخت پوزیشن،
ورود گروهی PDF/DOCX، پایش فایل و تطبیق AI، دعوت و گزارش مصاحبه را نگه می‌دارند.
جریان جذب در چهار گام ثبت پوزیشن، افزودن رزومه، انتخاب روش بررسی، و انتخاب و دعوت
نمایش داده می‌شود؛ نوار گام‌ها و دکمه‌های قبلی/بعدی امکان جابه‌جایی میان گام‌های
بازشده را بدون پاک‌کردن پیشرفت ذخیره‌شده می‌دهند. گام‌های آینده تا تکمیل شرط‌ها
قفل‌اند. روش بررسی تا پیش از شروع پایش هوشمند یا پس از پایش ناموفق، حتی اگر
لینک دعوت ساخته شده باشد، قابل تغییر است؛ هنگام پایش و پس از تکمیل آن قفل می‌شود.
`employer_positions.workflow_stage` و `review_method` (migrationهای `0036` و
`0037`) گام و روش دستی/هوشمند را نگه می‌دارند. APIهای `:id/continue` و
`:id/review-method` گذار مرحله را ثبت و اعتبارسنجی می‌کنند. در جزئیات پوزیشن،
تعداد رزومه‌ها و ظرفیت باقی‌مانده نمایش داده می‌شود؛ ورود فایل‌های انتخاب‌شده
تنها پس از تأیید کارفرما شروع می‌شود و نوبت ناموفق قابل تلاش دوباره است.
فایل اصلی در `employer_candidates.file_data` (migration
`0031_employer_resume_files.sql`) ذخیره می‌شود و فقط صاحب پوزیشن از مسیر خصوصی
`/api/employer/positions/:id/resumes/:candidateId/file` به آن دسترسی دارد؛ PDF
اصلی در مودال باز می‌شود. DOCX برای دریافت نسخهٔ اصلی و بررسی متن استخراج‌شده
ارائه می‌شود. فایل‌های واردشده پیش از این مهاجرت فقط متن استخراج‌شده دارند.
رزومهٔ اشتباه تا پیش از شروع پایش و تا پیش از دعوت همان نامزد قابل حذف است.
فایل‌های سالم/تکراری/غیرقابل‌خواندن فقط در جریان پایش هزینه‌دار طبقه‌بندی و
نمایش داده می‌شوند. هزینهٔ آزمایشی پایش ۵ رادیکوین برای هر نوبت است. برای هر
دعوت ۵ رادیکوین رزرو می‌شود و فقط پس از تولید موفق گزارش مصرف قطعی می‌شود؛
دعوت منقضی‌شده در اولین درخواست مرتبط آزاد می‌شود. فعلاً ارسال خودکار دعوت
وجود ندارد و کارفرما لینک ساخته‌شده را کپی می‌کند.
کارفرما می‌تواند از پایش هزینه‌دار بگذرد و نامزدها را بدون رتبه‌بندی مدل به‌صورت
دستی برای مصاحبه انتخاب کند. در هر دو مسیر، هزینهٔ مصاحبه هنگام دعوت رزرو و
فقط پس از تکمیل معتبر مصرف می‌شود. خطای کمبود رادیکوین از خطای ارتقای پلن جداست.
سوپرادمین می‌تواند از منوی «تغییر اعتبار» در فهرست `/admin/memberships`،
رادیکوین را با ثبت دلیل به کیف پول کاربر اضافه کند. این گزینه از عملیات
`/api/admin/radicoin/wallets/:id/adjust` استفاده می‌کند و اعتبار پلن را تغییر
نمی‌دهد؛ صفحهٔ `/admin/users` فقط برای نقش و وضعیت دسترسی است.
فهرست‌های مدیریتی `/admin/users`، `/admin/memberships` و `/admin/radicoins`
نوع حساب کارجو/کارفرما را نمایش می‌دهند و با پارامتر اختیاری `accountType` در
API فیلتر می‌شوند؛ فیلتر سمت سرور پیش از صفحه‌بندی و شمارش کل اعمال می‌شود.
لینک گم‌شده را می‌توان از صفحهٔ پوزیشن دوباره ساخت؛ لینک قبلی باطل می‌شود. صفحهٔ
`/employer/positions/[id]/interviews` برای صاحب پوزیشن، وضعیت همهٔ دعوت‌ها،
شرکت در مصاحبه، نمره و گزارش پاسخ‌ها را از همان API جزئیات پوزیشن نمایش می‌دهد
و هنگام بازبودن هر ۱۵ ثانیه تازه می‌شود؛ وضعیت «دعوت‌شده» فقط ساخته‌شدن لینک را
نشان می‌دهد و به معنای ارسال خودکار آن نیست.
در کارت نامزدِ فاقد موبایل، کارفرما می‌تواند شمارهٔ همراه را در مودال ثبت کند.
`PATCH /api/employer/positions/:id/resumes/:candidateId/contact` شماره را پس از
اعتبارسنجی مالکیت و قالب موبایل، در رکورد نامزد و رزومهٔ مرتبطِ بانک ذخیره می‌کند؛
نامزدهای پوزیشن‌های دیگرِ متصل به همان رزومه نیز در همان تراکنش به‌روز می‌شوند.
وضعیت دعوت در صفحهٔ پوزیشن «لینک دعوت ساخته شد» است و ارسال خودکار را القا نمی‌کند.
ورودی اصلی پیگیری مصاحبه از صفحهٔ پوزیشن اکنون به `/employer/resume-bank` با فیلتر
همان پوزیشن و رزومه‌های دعوت‌شده می‌رود. API فهرست بانک برای هر رزومه، نام پوزیشن‌های
مرتبط، وضعیت دعوت و نمرهٔ مصاحبه را با محدودسازی مالکیت کارفرما برمی‌گرداند؛ اگر
رزومه در چند پوزیشن باشد، وضعیت هر پوزیشن مستقل می‌ماند. فیلترهای پوزیشن، دعوت و
شرکت در مصاحبه در همان صفحه قرار دارند. جزئیات گزارش و پاسخ‌ها هنگام بازکردن
مودال، از API جزئیات همان پوزیشن دریافت می‌شوند.
`/interview-invites/[value]` مصاحبهٔ غیرهم‌زمان کارجو را اجرا می‌کند و
`/interview-invites` جلسه‌های پذیرفته‌شده را نشان می‌دهد. رزومهٔ کارفرما به
پروفایل کارجو منتقل نمی‌شود. migration روی دیتابیس لوکال اعمال شده است؛ هیچ
استقرار پروداکشن در این تغییر انجام نشده است.
مصاحبهٔ دعوتی اکنون پس از هر پاسخ، واکنش و سؤال بعدی متناسب با گفت‌وگو را از
`POST /api/employer/interviews/:value/turn` می‌گیرد. کارجو می‌تواند با
`POST /api/employer/interviews/:value/clarify` دربارهٔ سؤال جاری از مصاحبه‌گر
بپرسد، بدون اینکه مرحله جلو برود. سؤال‌ها، واکنش‌ها و توضیحات مخصوص هر نامزد در
`employer_candidates` ذخیره می‌شوند (migrationهای `0038` و `0039`) و پس از
بازکردن مجدد لینک بازیابی می‌شوند؛ گزارش نیز همین سؤال‌های شخصی‌سازی‌شده را
نمایش می‌دهد. اگر تولید سؤال بعدی شکست بخورد، سؤال از پیش آماده‌شده استفاده
می‌شود. پیام کوتاه پرسشی در کادر گفت‌وگو به‌طور خودکار درخواست توضیح شناخته
می‌شود و پاسخ مصاحبه را جلو نمی‌برد.
در حالت `LLM_PROVIDER=agent`، هر نامزد چت جداگانه‌ای در ابروهوش دارد؛ UUID چت
در `employer_candidates.agent_chat_uuid` (migration `0040`) ذخیره می‌شود و
در درخواست‌های بعدی به‌صورت `chat_uuid` به همان ایجنت ارسال می‌شود. UUID چت
ساخت سؤال‌های اولیهٔ پوزیشن بین نامزدها به اشتراک گذاشته نمی‌شود.

ورود کارجو/کارفرما: صفحهٔ `/login` پیش از OTP یا Google انتخاب نوع ورود دارد.
این انتخاب نوع ثابت حساب (`users.account_type` در migration `0030_account_types.sql`)
را هنگام اولین ورود ثبت می‌کند و ورود بعدی با نوع دیگر را رد می‌کند. Google هم
نوع حساب را در OAuth attempt نگه می‌دارد. نقش فنی `users.role` همچنان
`user/admin/superadmin` است، اما هر کاربر عادی فقط کارجو یا فقط کارفرماست.
دو پنل از `PanelShell` مشترک با هدر و منوی حساب یکسان و ناوبری متفاوت استفاده
می‌کنند؛ `AuthGate` مسیر پنل دیگر را برای هر نوع حساب مسدود می‌کند. در API نیز
مسیرهای داده و AI کارجو از حساب کارفرما جدا شده‌اند؛ endpointهای
کارفرما فقط نوع حساب کارفرما و endpointهای دعوت مصاحبه فقط کارجو را می‌پذیرند.
پوستهٔ کارفرما providerهای فعالیت هوشمند و Onboarding کارجو را بارگذاری نمی‌کند.
برای کار
در پنل کارفرما، ثبت یک‌بارهٔ نام مجموعه در `employer_profiles` (migration
`0029_employer_profiles.sql`) لازم است. API اجازهٔ ساخت پوزیشن بدون این پروفایل
را نمی‌دهد و نام شرکت پوزیشن را از پروفایل می‌گیرد، نه از ورودی آزاد درخواست.
ثبت نام مجموعه خوداظهاری است؛ تأیید مالکیت شرکت و دسترسی تیمی هنوز وجود ندارد.

مصاحبه: پاسخ‌ها و مرحلهٔ جاری با `answers` و `currentQuestionIndex` داخل رکورد
`interviewSessions` ذخیره می‌شوند. در سؤال آخر، `POST /api/interview/report` همهٔ
پاسخ‌ها را یک‌جا و در یک درخواست تازه ارزیابی می‌کند؛ خروجی اعتبارسنجی‌شده با
امتیاز مباحث بررسی‌شده در `report` همان رکورد نگهداری می‌شود. گزارش‌های جدید
به‌جای بازخورد سؤال‌به‌سؤال، امتیاز مباحث را برمی‌گردانند؛ گزارش‌های قدیمی نیز
همچنان قابل خواندن‌اند. نمودار رادار در کامپوننت مستقل
`interview/interview-radar-chart.tsx` و جدا از کارت توضیحات مباحث قرار دارد؛
UI گزارش در `interview/interview-result.tsx`
است و در مسیر مستقل `/interview/results/[sessionId]` نمایش داده می‌شود. فهرست
گزارش‌های قبلی در صفحهٔ `/interview` قرار دارد و تمرین فعال در مودال تمام‌صفحهٔ
`interview/interview-practice-dialog.tsx` انجام می‌شود؛ بستن آن پاسخ جاری را ذخیره
می‌کند. صفحهٔ `/interview` فقط آمادگی مصاحبه را نشان می‌دهد؛ مصاحبه‌های دعوتی در
صفحهٔ مستقل `/interview-invites` هستند. هر دو به‌صورت زیرمنو زیر «مصاحبه‌ها» در
ناوبری دسکتاپ و موبایل قرار دارند. مسیر جزئیات دعوت همچنان
`/interview-invites/[value]` است. پیش از ساخت جلسهٔ جدید، انتخاب «سریع/استاندارد/عمیق» در
`interview-depth-chooser.tsx` انجام می‌شود؛ `depth` در درخواست جلسه و رکورد ذخیره
می‌شود. حالت‌های سریع، استاندارد و عمیق به‌ترتیب ۸، ۱۵ و ۲۵ دقیقهٔ فعال دارند؛
تعداد سؤال از پیش تعیین نشده و فهرست اولیه فقط موضوع‌های پیشنهادی است. پس از
هر پاسخ، سؤال پیگیر متناسب با شواهد فنی و مهارت نرمِ هنوز بررسی‌نشده ساخته
می‌شود. زمان فقط هدف تقریبی است و پایان را تعیین نمی‌کند؛ ایجنت پس از کفایت
شواهد، پیام جمع‌بندی را در چت نشان می‌دهد و کاربر سپس گزارش را درخواست می‌کند.
برای جلوگیری از گفت‌وگوی بی‌پایان سقف ایمنی ۳۰ نوبت وجود دارد. زمان فعال هنگام
خروج ذخیره و هنگام ادامه از همان‌جا محاسبه می‌شود. قرارداد
مشترک `InterviewReport` در `packages/shared-types` و اعتبارسنجی API
در `modules/ai/interview-report.ts` قرار دارند. مسیر قدیمی `/api/interview/feedback`
برای سازگاری باقی است و UI جدید آن را فراخوانی نمی‌کند.
تمرین مصاحبه پس از هر پاسخ از `/api/interview/next-question` واکنش متناسب با پاسخ
و سؤال بعدی را می‌گیرد. `/api/interview/clarify` به سؤال کارجو دربارهٔ سؤال فعلی
پاسخ می‌دهد و شمارندهٔ مصاحبه را جلو نمی‌برد. واکنش‌ها و پرسش‌های توضیحی در
رکورد محلی جلسه نگهداری و در `interview-conversation.tsx` مانند گفت‌وگو نشان
داده می‌شوند؛ سؤال و پاسخ اصلی همچنان در جلسهٔ سمت سرور ذخیره می‌شوند.
در حالت ایجنت، شرح فشردهٔ رزومه و قواعد مصاحبه فقط هنگام ساخت چت فرستاده می‌شود؛
در نوبت‌های بعدی با همان `chat_uuid` فقط پاسخ تازه یا پیام توضیح‌خواهی
فرستاده می‌شود. برای جلسه‌های قدیمی بدون شناسهٔ چت، فقط چهار نوبت اخیر به‌عنوان
زمینهٔ جایگزین ارسال می‌شود.
اگر ایجنت هنگام ساخت تمرین جامع کمتر از چهار موضوع بدهد، موضوع‌های مکملِ متنوع
از نقش کاربر ساخته می‌شوند. وقفهٔ موقت در خواندن وضعیت چت تا پایان مهلت جلسه
دوباره بررسی می‌شود؛ درخواست ساخت چت تکرار نمی‌شود.
پیام کوتاه پرسشی در تمرین هم توضیح‌خواهی محسوب می‌شود؛ کادر گفت‌وگو شمارندهٔ
سؤال ندارد و زمان پیشنهادی جلسه را نشان می‌دهد.
در مصاحبهٔ دعوتی نیز پنج سؤال اولیه فقط موضوع‌های آغازین هستند؛ ایجنت می‌تواند
پیش از آن‌ها یا پس از آن‌ها، با توجه به شواهد مهارت فنی و نرم، مصاحبه را جمع‌بندی
کند. پیام پایانی پیش از دکمهٔ ثبت نتیجه در چت دیده می‌شود و سقف ایمنی آن ۱۲ نوبت
است.
در حالت ایجنت، UUID چت تمرین داخل توکن امضاشده به حساب کارجو محدود و در رکورد
محلی جلسه نگهداری می‌شود. ساخت جلسه، پاسخ‌ها، توضیح‌خواهی و گزارش همان
`chat_uuid` را ادامه می‌دهند؛ رفرش صفحه چت تازه‌ای نمی‌سازد. مسیرهای قدیمی
بدون توکن می‌توانند با تاریخچهٔ موجود یک چت تازه آغاز کنند.

اتصال مصاحبه و پایش رزومه به API ایجنت با `LLM_PROVIDER=agent` فقط در API فعال
می‌شود؛ پیش‌فرض مدل عمومی است. کلاینت، prompt و اعتبارسنجی ایجنت در
`apps/api/src/modules/ai/interview-agent.ts` و پیاده‌سازی قابل‌حذف قبلی در
`interview-legacy.ts` جدا شده‌اند. Routeهای جلسه و گزارش قرارداد JSON فعلی Web
را نگه می‌دارند؛ در حالت ایجنت، API چت را شروع می‌کند و تا تکمیل یا خطا poll
می‌کند. در حالت `LLM_PROVIDER=agent`، نام ایجنت مصاحبه و رتبه‌بندی رزومه جداگانه در env سرور تعیین می‌شوند.
UUID چت برای مصاحبهٔ دعوتی در دیتابیس و برای تمرین در رکورد محلی جلسه ذخیره
می‌شود. وضعیت درخواست در حال اجرای ایجنت هنوز job پایدار ندارد؛ اگر انتظار از
timeout بگذرد، نتیجهٔ همان درخواست به‌طور خودکار بازیابی نمی‌شود. برای این
حالت به job پایدار و endpoint وضعیت نیاز است.

بستهٔ آزمایشی مصاحبه از سفارش پلن جداست: `CreditPackService` در
`modules/billing/credit-pack.ts` و جدول `credit_pack_orders` (مهاجرت `0026`)
خرید ۳ جلسه به قیمت ۳۹۰٬۰۰۰ ریال یا ۱۰۰ رادیکوین را برای پلن حرفه‌ای فعالِ
بدون اعتبار مصاحبه مدیریت می‌کنند. هر خرید ۳ اعتبار مصاحبه و ۱۵ اعتبار AI به
عضویت فعلی اضافه می‌کند؛ اعتبارها با پایان همان عضویت منقضی می‌شوند. مسیرهای
`/api/billing/credit-packs` و `/orders` زیر آن فهرست و خرید را ارائه می‌دهند؛
callback عمومی مستقل، پرداخت درگاه را تأیید می‌کند و reconciliation سفارش‌های
pending را دوباره بررسی می‌کند. در Web، `interview-pack-action.tsx` از کارت مصرف
مصاحبه در `/account` باز می‌شود. این خرید به شارژ کیف پول وابسته نیست: کاربر
می‌تواند مستقیم درگاه را انتخاب کند. سفارش، کلید checkout و ثبت رویداد عضویت
برای جلوگیری از اعطای دوباره در تراکنش ثبت می‌شوند.

درگاه‌های پرداخت با `PAYMENT_PROVIDER=zarinpal|abropay` برای سفارش‌های جدید
انتخاب می‌شوند؛ پیش‌فرض فعلاً زرین‌پال است. برای ابروپی، کلید محرمانهٔ سمت سرور
در `PAYMENT_PROVIDER_SECRET_KEY`، محیط در `PAYMENT_PROVIDER_ENVIRONMENT=sandbox|live`
و URL پایه در `PAYMENT_PROVIDER_BASE_URL` قرار می‌گیرد.
در حالت live، `API_PUBLIC_URL` باید HTTPS عمومی و متصل به همان API سازندهٔ سفارش
باشد. برای تست محلی، `WEB_APP_URL=http://localhost:3161` مجاز است و فقط API
نیاز به تونل HTTPS دارد؛ در `NODE_ENV=production` وب نیز باید HTTPS باشد.
`payment-gateway.ts`
ساخت gateway و انتخاب provider ثبت‌شدهٔ هر سفارش را انجام می‌دهد؛ کلاینت ابروپی
در `abropay-client.ts` مسیرهای `/sendbox/payments/request` و
`/sendbox/payments/{id}/verify` سندباکس یا معادل بدون `/sendbox` در live را
فراخوانی می‌کند. مبلغ ریالی، شناسهٔ سفارش به‌عنوان `client_reference` و
`return_url` فرستاده می‌شوند. callback پارامترهای `transaction_id/status` را
می‌پذیرد، اما فقط پاسخ server-to-server با وضعیت `verified` و شناسه، مبلغ و
reference مطابق سفارش سبب فعال‌سازی می‌شود. مهاجرت `0027`، provider و
`redirect_url` را برای بسته‌ها و `redirect_url` را برای سفارش پلن ذخیره می‌کند؛
سفارش‌های قدیمی زرین‌پال از provider ثبت‌شدهٔ خودشان تأیید می‌شوند. worker
reconciliation نیز همین مسیر تأیید را برای پرداخت‌های pending اجرا می‌کند.

پاداش مسیر: `GET /api/radicoin/onboarding-reward` شش مرحله را از داده‌های فضای
کاری فعال و دعوت تأییدشده بررسی می‌کند و وضعیت دریافت را بدون واریز برمی‌گرداند.
واریز فقط با `POST /api/radicoin/onboarding-reward/claim` انجام می‌شود؛ ۱۰۰ رادیکوین
با کلید ثابت `onboarding-completion:v1:<userId>` و قفل کیف پول در یک تراکنش ثبت
می‌شود. کامل‌شدن وضعیت راهنما به‌تنهایی پاداشی واریز نمی‌کند. گزارش جدید مصاحبه
و بازخوردهای قدیمی هر دو برای مرحلهٔ مصاحبه پذیرفته می‌شوند.

## اجرای محلی

پیش‌نیاز: Node `>=22.13.0`، npm `>=10` و Docker Desktop.

```bash
npm ci
npm run infra:up
npm run db:migrate
npm run db:seed
npm run dev:stack
```

| سرویس             | آدرس                           |
| ----------------- | ------------------------------ |
| Web               | `http://localhost:3161`        |
| API               | `http://localhost:3162`        |
| API health        | `http://localhost:3162/health` |
| API readiness     | `http://localhost:3162/ready`  |
| PostgreSQL میزبان | `127.0.0.1:5433`               |

برای حفظ session، hostnameهای `localhost` و `127.0.0.1` را با هم ترکیب نکنید.

## تنظیمات محیطی و امنیت

- نمونه‌ها: `apps/web/.env.example` و `apps/api/.env.example`.
- فایل‌های واقعی `.env` و `.env.local` secret هستند؛ آن‌ها را در این سند، logها
  یا Git ثبت نکنید.
- API برای توسعه به `DATABASE_URL` محلی یا اتصال Neon نیاز دارد.
- حالت ایجنت فقط سمت سرور است: `LLM_PROVIDER=agent`. این حالت
  بدون `LLM_BASE_URL`، `LLM_API_KEY`، `LLM_AGENT_RESUME_RANKER` و
  `LLM_AGENT_INTERVIEWER` اجرا نمی‌شود؛ `LLM_TIMEOUT_MS` سقف انتظار API را
  کنترل می‌کند. سؤال‌ها و گزارش مصاحبه به ایجنت مصاحبه‌گر و پایش رزومه به
  ایجنت رتبه‌بندی ارسال می‌شوند. در این حالت، مدل عمومی بخش‌های دیگر با
  `LLM_GENERAL_PROVIDER` و در صورت نیاز `LLM_GENERAL_MODEL`،
  `LLM_GENERAL_API_KEY` و `LLM_GENERAL_BASE_URL` تنظیم می‌شود. کلید را در Web یا
  مخزن ثبت نکنید. برای محیط توسعه، origin API برابر
  `https://api.dev.ai.abrodev.ir` است، نه آدرس مرورگری `app.dev.abroai.ir`.
  پس از پایدارشدن اتصال، `interview-legacy.ts` و branch مربوطه
  در `modules/ai/routes.ts` قابل حذف‌اند.
- Production باید `AUTH_SECRET` تصادفی، ارسال OTP واقعی و CORS محدود داشته باشد.
- OTP در همهٔ محیط‌ها از abstraction عمومی provider استفاده می‌کند. adapter فعلی `kavenegar` است و با `POST /v1/{API-KEY}/verify/lookup.json` کار می‌کند؛ در حالت ارسال واقعی `OTP_PROVIDER=kavenegar`، `OTP_PROVIDER_API_KEY` و `OTP_PROVIDER_TEMPLATE` الزامی‌اند و الگو باید شامل `%token` باشد. حالت موقت پیش‌فرض `OTP_DELIVERY_MODE=console` حتی بدون کلید provider چالش معتبر می‌سازد اما تابع ارسال را فراخوانی نمی‌کند. با `OTP_LOG_REVERSED_CODE=true` کد معکوس در کنسول API و از طریق هدر پاسخ در کنسول مرورگر ثبت می‌شود. این حالت در Production کد را به درخواست‌کنندهٔ ناشناس می‌دهد و خطر تصاحب حساب دارد. برای فعال‌سازی ارسال واقعی و حذف لاگ، هر دو متغیر را به‌ترتیب `provider` و `false` تنظیم کنید. در حالت provider خطای ارسال به کاربر نمایش داده شده و چالش ناموفق حذف می‌شود. افزودن provider بعدی فقط به adapter/factory عمومی OTP محدود است.
- شماره bootstrap فقط برای راه‌اندازی کنترل‌شدهٔ سوپرادمین استفاده شود و بعد
  حذف شود.

## دیتابیس، داده و پلن‌ها

تیکت‌های پشتیبانی با migration `0041_support_tickets.sql` در دو جدول تیکت و پیام ذخیره می‌شوند. کارجو و کارفرما از مسیرهای `/api/support/tickets` فقط درخواست‌های خود را ثبت و پیگیری می‌کنند. مسیرهای `/api/admin/support/tickets` فقط برای سوپرادمین است و فهرست صفحه‌بندی‌شده، فیلتر وضعیت/نوع حساب، پاسخ و بستن/بازکردن تیکت را فراهم می‌کند. ورودی پشتیبانی در منوی کاربری هدر و مرکز حساب/کارفرما قرار دارد.

- migration: `npm run db:migrate`
- تولید migration پس از تغییر schema: `npm run db:generate`
- seed idempotent: `npm run db:seed`
- seed سه پلن پایه و workspace اولیه را ایجاد می‌کند.
- `docker compose down -v` تمام دیتای محلی PostgreSQL را حذف می‌کند؛ فقط با
  درخواست صریح اجرا شود.

## کیفیت و فرمان‌های متداول

```bash
npm run build                 # Build کامل monorepo
npm run build:web             # Web با dependencyها
npm run build:api             # API با dependencyها
npm run test                  # همه تست‌ها
npm run test:web
npm run test:api
npm run typecheck
npm run lint
```

برای سؤال‌های کد، به‌جای جست‌وجوی کور:

```bash
graphify query "سؤال دقیق"
graphify explain "concept"
graphify path "A" "B"
```

بعد از تغییر source: `graphify update .`

## استقرار

- Production فعلی: Web و API روی Vercel؛ دیتابیس Neon PostgreSQL.
- API Vercel در region `fra1` اجرا می‌شود.
- جزئیات گزینهٔ VPS/Docker/Caddy در `deploy/README.md` است.
- API build روی Vercel migration و seed idempotent پلن‌ها را اجرا می‌کند.
- VPS فعلی رادیکار در مسیر `/home/sport724/mampel/radikar` اجرا می‌شود؛ دامنهٔ
  production از پورت‌های استاندارد HTTP `80` و HTTPS `443` استفاده می‌کند و
  پورت‌های داخلی API/Web عمومی نیستند.
- OTP فعلاً در همهٔ محیط‌ها با `OTP_DELIVERY_MODE=console` بدون ارسال پیامک ساخته می‌شود و کد معکوس در هدر پاسخ API برای کنسول مرورگر قرار می‌گیرد؛ فعال‌سازی بعدی کاوه‌نگار با `provider` و خاموش‌کردن لاگ انجام می‌شود.
- خروجی provider هوش مصنوعی از کانتینر API روی HTTPS استفاده می‌کند و برای
  پایداری، `api.gapgpt.app` در Compose به edge سالم pin شده است.
- CI/CD در `.github/workflows/deploy-production.yml` با push تگ‌هایی مثل
  `0.1.11-p` اجرا می‌شود و فقط مسیر VPS بالا را sync و stack را recreate می‌کند.
- خطاهای ساخت سفارش پرداخت در صفحهٔ ارتقا داخل مودال پیش‌فاکتور نمایش داده
  می‌شوند تا هنگام بازبودن پیش‌فاکتور از دید کاربر خارج نباشند.
- پس از تغییر `NEXT_PUBLIC_API_BASE_URL` باید Web دوباره build/deploy شود.

## SEO، AEO و GEO عمومی

- تنظیمات canonical، Open Graph، Twitter Card و URL پایه در `apps/web/lib/site.ts`
  متمرکز است؛ داده‌های ساختاریافته با کامپوننت امن `JsonLd` تولید می‌شوند.
- routeهای عمومی قابل ایندکس شامل صفحه خانه، رزومه‌ساز، رزومه‌ساز هوشمند، تطبیق
  رزومه و شغل، تمرین مصاحبه، مدیریت اپلای، راهنماها، درباره، تماس، حریم خصوصی و
  شرایط استفاده هستند و در `sitemap.xml` ثبت شده‌اند.
- `robots.txt` صفحه‌های عمومی و crawlerهای جست‌وجوی پاسخ‌گو را مجاز می‌کند،
  routeهای حساب/API را می‌بندد و crawlerهای آموزش مدل را مسدود می‌کند. محدودیت
  `/interview` باید فقط خود پنل و زیرمسیرهای آن را بگیرد، نه لندینگ عمومی
  `/interview-practice`.
- `sitemap.xml` فقط URLهای عمومی را ثبت می‌کند؛ تا وقتی تاریخ به‌روزرسانی مهم
  هر صفحه از منبع قابل‌اعتماد به‌دست نیاید، `lastmod` منتشر نمی‌شود.
- `llms.txt` خلاصهٔ factual محصول و لینک صفحه‌های مرجع را ارائه می‌کند.
- تمام routeهای ورود و پنل metadata صریح `noindex, nofollow` دارند.
- لندینگ server-rendered است و providerهای کلاینتی فقط در layoutهای ورود و پنل
  بارگذاری می‌شوند تا JavaScript عمومی و زمان تعامل کمتر باشد.

## وضعیت‌ها و تصمیم‌های شناخته‌شده

- آخرین commit ثبت‌شده برای اجرای API در Frankfurt: `6528c7e`.
- proxyهای Vercel برای `/api/*` و `/v1/*` اضافه شده‌اند تا routeهای data Web
  خطای 404 ندهند.
- خطای `ERR_CONTENT_DECODING_FAILED` در API proxy اصلاح شده است.
- import هوشمند رزومه محدود به یک درخواست، 4096 توکن و timeout بیست‌ثانیه‌ای است؛
  خطای provider log می‌شود.
- GapGPT در Production از Vercel پاسخ نمی‌دهد و در پنل GapGPT نیز request ثبت
  نمی‌شود. با مدل‌های `gapgpt-qwen-3.6`، `gapgpt-qwen-3.8` و `gpt-5.6-luna`
  timeout دیده شده است. محتمل‌ترین علت egress/allowlist/IP یا endpoint provider
  است، نه build یا API application. مسیرهای جایگزین: allowlist کردن egress
  Vercel، اجرای API روی میزبان مجاز، یا گرفتن endpoint جایگزین از GapGPT.

## پروتکل تغییرات برای agentها

1. نام canonical پروژه فقط `radikar` / «رادیکار» است؛ هیچ نام یا املای قدیمی در
   کد، مستندات، زیرساخت، دیتابیس، volumeها، artifactها یا مسیر پروژه مجاز نیست.
2. همهٔ تغییرات به‌صورت پیش‌فرض فقط روی پروژهٔ لوکال انجام می‌شوند. تغییر، sync،
   deploy یا restart سرور فقط با درخواست صریح کاربر در همان درخواست مجاز است.
3. `AGENTS.md` را اول بخوانید. این فایل را فقط برای کار معماری، route، env،
   deploy یا incident و فقط در بخش مرتبط بخوانید.
4. برای تغییر کوچک در فایل شناخته‌شده، مستقیم همان فایل را باز کنید.
5. برای codebase question از graphify query با پرسش محدود استفاده کنید.
6. تغییرات ناخواستهٔ worktree را متعلق به کاربر بدانید؛ reset یا حذف نکنید.
7. برای پروژهٔ فارسی، Vazirmatn محلی و RTL الزامی است؛ برای UI از Tailwind استفاده
   کنید. فرم‌ها با React Hook Form + Zod و fetching سمت کلاینت با TanStack Query.
8. پس از تغییر code، بررسی متناسب (test/typecheck/build) و `graphify update .`
   را اجرا کنید و بخش مرتبط همین سند را تازه‌سازی کنید.

## تضمین به‌روزرسانی knowledge base

- `npm install` یا `npm ci` hook نسخه‌بندی‌شدهٔ `.githooks/commit-msg` را فعال
  می‌کند.
- هر commit که بخش‌های `apps/`، `packages/`، `deploy/`، تنظیمات ریشه یا README و
  AGENTS را تغییر دهد، باید بازبینی knowledge base را ثبت کند. اگر دانش پروژه
  تغییر کرده، `PROJECT_KNOWLEDGE.md` را stage کنید؛ اگر تغییر موضعی است، در پیام
  commit trailer دقیق `Knowledge-Base: n/a — دلیل` را اضافه کنید.
- این روش هم مرور دانش را قابل‌ردیابی می‌کند و هم از پرشدن سند با یادداشت‌های
  بی‌ارزش برای تغییرات کوچک جلوگیری می‌کند.
- artifactهای تولیدی مانند `.turbo`، `.next` و `graphify-out` از این کنترل خارج‌اند و
  در Git commit نمی‌شوند؛ در صورت نیاز با `graphify update .` بازسازی شوند.

> Automated review: 2026-09-18 — project changes were committed; review the affected sections if behavior or architecture changed.

> Automated review: 2026-09-19 — project changes were committed; review the affected sections if behavior or architecture changed.

> Automated review: 2026-09-20 — project changes were committed; review the affected sections if behavior or architecture changed.

> Automated review: 2026-09-20 — project changes were committed; review the affected sections if behavior or architecture changed.

> Automated review: 2026-09-20 — project changes were committed; review the affected sections if behavior or architecture changed.

> Automated review: 2026-09-27 — project changes were committed; review the affected sections if behavior or architecture changed.

> Automated review: 2026-10-02 — project changes were committed; review the affected sections if behavior or architecture changed.

> Automated review: 2026-10-02 — project changes were committed; review the affected sections if behavior or architecture changed.

> Automated review: 2026-10-05 — project changes were committed; review the affected sections if behavior or architecture changed.

> Automated review: 2026-10-05 — project changes were committed; review the affected sections if behavior or architecture changed.

> Automated review: 2026-10-05 — project changes were committed; review the affected sections if behavior or architecture changed.

> Automated review: 2026-10-05 — project changes were committed; review the affected sections if behavior or architecture changed.

> Automated review: 2026-10-09 — project changes were committed; review the affected sections if behavior or architecture changed.

> Automated review: 2026-10-13 — project changes were committed; review the affected sections if behavior or architecture changed.

> Automated review: 2026-10-25 — project changes were committed; review the affected sections if behavior or architecture changed.

> Automated review: 2026-11-11 — project changes were committed; review the affected sections if behavior or architecture changed.

> Automated review: 2026-11-13 — project changes were committed; review the affected sections if behavior or architecture changed.

> Automated review: 2026-11-15 — project changes were committed; review the affected sections if behavior or architecture changed.

> Automated review: 2026-11-15 — project changes were committed; review the affected sections if behavior or architecture changed.

> Automated review: 2026-11-18 — project changes were committed; review the affected sections if behavior or architecture changed.

> Automated review: 2026-11-18 — project changes were committed; review the affected sections if behavior or architecture changed.

> Automated review: 2026-11-18 — project changes were committed; review the affected sections if behavior or architecture changed.

> Automated review: 2026-11-18 — project changes were committed; review the affected sections if behavior or architecture changed.
