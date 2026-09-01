# رادیکار — Resume Maker

رادیکار یک Monorepo ماژولار برای ساخت و مدیریت رزومه فارسی است. رابط کاربری با
Next.js App Router، بک‌اند با Node.js و Fastify و دیتابیس با PostgreSQL و Drizzle
ساخته شده است.

داده‌های اصلی برنامه فقط از مسیر زیر عبور می‌کنند:

```text
Browser → Next.js Web → Node.js API → PostgreSQL
```

Web مستقیماً به دیتابیس وصل نمی‌شود و اطلاعات دامنه در Local Storage یا IndexedDB
نگهداری نمی‌شوند.

## ساختار Monorepo

```text
.
├── apps/
│   ├── web/                 # Next.js رسمی + App Router + Turbopack
│   └── api/                 # Node.js + Fastify modular API
├── packages/
│   ├── ai/                  # اتصال و parsing پاسخ مدل‌های زبانی
│   ├── config/              # اعتبارسنجی تنظیمات محیطی
│   ├── database/            # Drizzle schema, migrations و seed
│   ├── shared-types/        # Typeهای مشترک بدون وابستگی به framework
│   └── validators/          # Schemaهای مشترک Zod
├── docker-compose.yml       # PostgreSQL و API محلی
├── tsconfig.base.json       # تنظیمات مشترک TypeScript
├── turbo.json               # اجرای هماهنگ workspaceها
└── package.json             # npm workspaces و فرمان‌های ریشه
```

ریشه پروژه فقط نقش orchestrator دارد. Web، API و packageهای مشترک مستقل هستند و
می‌توانند جداگانه Build، Deploy و Scale شوند.

## پیش‌نیازها

- Node.js نسخه `22.13.0` یا جدیدتر
- npm نسخه `10` یا جدیدتر
- Docker Desktop برای اجرای PostgreSQL محلی
- پورت‌های آزاد زیر:
  - `3161` برای Web
  - `3162` برای API
  - `5433` برای PostgreSQL روی سیستم میزبان

نسخه‌های نصب‌شده را بررسی کنید:

```bash
node --version
npm --version
docker --version
docker compose version
```

تمام فرمان‌های این README باید از ریشه repository اجرا شوند.

## راه‌اندازی سریع پیشنهادی

در این روش PostgreSQL داخل Docker و Web و API روی سیستم شما اجرا می‌شوند. این
ساده‌ترین حالت برای توسعه و دیباگ است.

### ۱. نصب dependencyها

برای اولین اجرا یا بعد از دریافت تغییرات repository:

```bash
npm ci
```

اگر عمداً dependency جدیدی به `package.json` اضافه کرده‌اید، به‌جای آن از
`npm install` استفاده کنید تا lockfile نیز به‌روزرسانی شود.

### ۲. ساخت فایل‌های تنظیمات محلی

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

فایل‌های `.env` در Git ثبت نمی‌شوند. اگر این فایل‌ها از قبل وجود دارند، آن‌ها را
بدون بررسی overwrite نکنید.

تنظیم پیش‌فرض Web:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:3162
```

تنظیم پیش‌فرض اتصال API به PostgreSQL محلی:

```dotenv
DATABASE_URL=postgresql://radicar:radicar@127.0.0.1:5433/radicar
```

### ۳. بالا آوردن PostgreSQL

```bash
npm run infra:up
```

وضعیت container را بررسی کنید:

```bash
docker compose ps
docker compose logs postgres
```

### ۴. اجرای migrationها

```bash
npm run db:migrate
```

این فرمان migrationهای موجود در `packages/database/migrations` را روی دیتابیس
اعمال می‌کند و مقدار `DATABASE_URL` را از `apps/api/.env` می‌خواند.

### ۵. ایجاد داده اولیه

```bash
npm run db:seed
```

Seed فضای کاری اولیه و سه پلن عضویت را ایجاد می‌کند و تکرار اجرای آن داده تکراری
نمی‌سازد.

### ۶. اجرای هم‌زمان Web و API

```bash
npm run dev:stack
```

پس از آماده‌شدن سرویس‌ها:

- Web: <http://localhost:3161>
- صفحه ورود: <http://localhost:3161/login>
- API: <http://localhost:3162>
- Health: <http://localhost:3162/health>
- Readiness: <http://localhost:3162/ready>

سلامت API و اتصال دیتابیس را می‌توانید با این دو فرمان بررسی کنید:

```bash
curl http://localhost:3162/health
curl http://localhost:3162/ready
```

خروجی موفق endpoint دوم باید شبیه زیر باشد:

```json
{"status":"ready"}
```

## اجرای Web و API در terminalهای جدا

اگر می‌خواهید log هر سرویس جدا باشد، بعد از اجرای PostgreSQL و migrationها دو
terminal باز کنید.

Terminal اول:

```bash
npm run dev:api
```

Terminal دوم:

```bash
npm run dev:web
```

فرمان `npm run dev` نیز تمام workspaceهای دارای dev script را از طریق Turborepo
اجرا می‌کند؛ برای این پروژه `npm run dev:stack` صریح‌تر است.

## اجرای PostgreSQL و API داخل Docker

در این حالت PostgreSQL و API داخل Docker اجرا می‌شوند و فقط Web روی سیستم شما
اجرا می‌شود. ابتدا فایل `apps/api/.env` را مطابق بخش راه‌اندازی بسازید، سپس:

```bash
docker compose --profile full up -d --build
```

API داخل container هنگام شروع migrationها را اجرا می‌کند. برای ساخت داده اولیه:

```bash
npm run db:seed
```

سپس Web را اجرا کنید:

```bash
npm run dev:web
```

مشاهده logها:

```bash
docker compose logs -f api
docker compose logs -f postgres
```

توقف containerها بدون حذف اطلاعات دیتابیس:

```bash
docker compose down
```

پروفایل `full` برای توسعه محلی است و API را با `NODE_ENV=development` اجرا
می‌کند. از همین Compose بدون سخت‌سازی تنظیمات برای Production استفاده نکنید.

## ورود با OTP در محیط توسعه

در تنظیمات نمونه این دو مقدار فعال‌اند:

```dotenv
EXPOSE_DEVELOPMENT_OTP=true
ALLOW_FIRST_USER_SUPERADMIN=true
```

در نتیجه:

1. یک شماره موبایل با الگوی `09xxxxxxxxx` در صفحه ورود وارد کنید.
2. کد شش‌رقمی توسعه در همان صفحه نمایش داده می‌شود.
3. اولین کاربری که در دیتابیس خالی ثبت شود نقش `superadmin` می‌گیرد.
4. سوپرادمین بعد از ورود به `/admin` هدایت می‌شود؛ کاربران معمولی به
   `/dashboard` می‌روند.

برای تعیین یک سوپرادمین مشخص می‌توانید در `apps/api/.env` مقدار زیر را فعال کنید:

```dotenv
BOOTSTRAP_SUPERADMIN_PHONE=09123456789
```

پس از ساخت اولین سوپرادمین، بهتر است `ALLOW_FIRST_USER_SUPERADMIN` را `false`
کنید.

## پلن‌ها و درگاه زرین‌پال Sandbox

سه پلن اولیه هنگام اجرای `npm run db:seed` ثبت می‌شوند:

| پلن | قیمت | مدت | رزومه | PDF | AI | تطبیق | مصاحبه |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| رایگان | ۰ | ۳۰ روز | ۱ | ۳ | ۵ | ۱ | ۱ |
| جست‌وجوی شغلی | ۴۹۹٬۰۰۰ تومان | ۳۰ روز | ۵ | نامحدود | ۴۰ | ۱۵ | ۵ |
| حرفه‌ای | ۷۹۹٬۰۰۰ تومان | ۳۰ روز | نامحدود | نامحدود | ۱۵۰ | ۵۰ | ۱۵ |

پلن رایگان فقط یک‌بار و هم‌زمان با اولین ثبت‌نام کاربر اعطا می‌شود و خودکار
تمدید نمی‌شود. تمدید پلن فعلی، ۳۰ روز و اعتبارهای همان پلن را اضافه می‌کند. ارتقا
فوری است و ۳۰ روز جدید به تاریخ انقضای موجود افزوده می‌شود. خرید پلن پایین‌تر تا
پایان پلن بالاتر غیرفعال است.

برای توسعه، تنظیمات زیر در `apps/api/.env` قرار می‌گیرند:

```dotenv
API_PUBLIC_URL=http://localhost:3162
WEB_APP_URL=http://localhost:3161
ZARINPAL_BASE_URL=https://sandbox.zarinpal.com
ZARINPAL_MERCHANT_ID=00000000-0000-4000-8000-000000000000
```

Sandbox طبق مستندات زرین‌پال هر UUID معتبر را به‌عنوان Merchant ID می‌پذیرد.
مبالغ ارسالی به API زرین‌پال بر حسب ریال هستند و رابط کاربری آن‌ها را به تومان
نمایش می‌دهد. callback روی `/api/billing/callback` دریافت و سپس نتیجه به
`/billing/result` در Web هدایت می‌شود.

صفحات کاربر:

- `/upgrade`: خرید و ارتقای بسته
- `/orders`: سفارش‌ها و کدهای پیگیری کاربر
- `/account`: نام و اطلاعات حساب؛ شماره همراه قابل تغییر نیست
- `/settings`: تنظیمات امنیت و نشست

صفحات مدیریت:

- `/admin/memberships`: اعطای پلن، تمدید، تغییر اعتبار، لغو و تعلیق کاربر
- `/admin/orders`: سفارش‌ها و وضعیت پیگیری
- `/admin/payments`: تراکنش‌ها و واریزی‌های درگاه

## تنظیم مدل هوش مصنوعی

بخش‌های معمول برنامه بدون تنظیم LLM بالا می‌آیند، اما تحلیل شغل، تولید رزومه،
مصاحبه و import هوشمند به provider مدل نیاز دارند.

### API سازگار با OpenAI

در `apps/api/.env`:

```dotenv
LLM_PROVIDER=openai-compatible
LLM_MODEL=your-model-name
LLM_API_KEY=your-api-key
LLM_BASE_URL=https://your-provider.example/v1
LLM_INPUT_PRICE_PER_MILLION_USD=0
LLM_OUTPUT_PRICE_PER_MILLION_USD=0
```

برای عملیات نوشتاری می‌توانید provider جدا تعریف کنید. اگر تعریف نشود، تنظیمات
اصلی `LLM_*` استفاده می‌شوند:

```dotenv
LLM_WRITE_PROVIDER=openai-compatible
LLM_WRITE_MODEL=your-writing-model
LLM_WRITE_API_KEY=your-api-key
LLM_WRITE_BASE_URL=https://your-provider.example/v1
LLM_WRITE_INPUT_PRICE_PER_MILLION_USD=0
LLM_WRITE_OUTPUT_PRICE_PER_MILLION_USD=0
```

### Proxy محلی DeepSeek

اگر proxy محلی سازگار با پروژه را روی پورت `9655` اجرا کرده‌اید:

```dotenv
LLM_PROVIDER=freeDeepseekAPI
LLM_MODEL=deepseek-chat
FREE_DEEPSEEK_PORT=9655
```

بعد از تغییر `.env`، API را restart کنید.

## متغیرهای محیطی API

| متغیر | پیش‌فرض توسعه | توضیح |
| --- | --- | --- |
| `API_HOST` | `127.0.0.1` | آدرس listen شدن API |
| `API_PORT` | `3162` | پورت API |
| `CORS_ORIGINS` | `http://localhost:3161` | originهای مجاز، جداشده با کاما |
| `DATABASE_URL` | PostgreSQL روی پورت `5433` | رشته اتصال دیتابیس |
| `DATABASE_MAX_CONNECTIONS` | `10` | سقف connection pool هر API instance |
| `LOG_LEVEL` | `info` | سطح log بک‌اند |
| `AUTH_SECRET` | فقط مقدار توسعه | کلید امضای session و OTP؛ در Production حتماً عوض شود |
| `SESSION_TTL_DAYS` | `30` | عمر session |
| `OTP_TTL_SECONDS` | `180` | عمر کد یک‌بارمصرف |
| `EXPOSE_DEVELOPMENT_OTP` | `true` | نمایش کد OTP فقط در توسعه |
| `ALLOW_FIRST_USER_SUPERADMIN` | `true` در env نمونه | ارتقای اولین کاربر دیتابیس خالی |
| `BOOTSTRAP_SUPERADMIN_PHONE` | خالی | شماره مجاز برای bootstrap سوپرادمین |
| `OTP_WEBHOOK_URL` | خالی | endpoint سرویس ارسال پیامک |
| `OTP_WEBHOOK_TOKEN` | خالی | Bearer token اختیاری سرویس پیامک |
| `API_PUBLIC_URL` | `http://localhost:3162` | آدرس عمومی callback بک‌اند |
| `WEB_APP_URL` | `http://localhost:3161` | آدرس Web برای redirect نتیجه پرداخت |
| `ZARINPAL_BASE_URL` | `https://sandbox.zarinpal.com` | آدرس درگاه؛ در توسعه Sandbox |
| `ZARINPAL_MERCHANT_ID` | UUID توسعه | شناسه پذیرنده Sandbox |

## مدیریت دیتابیس

اجرای migrationهای موجود:

```bash
npm run db:migrate
```

ساخت migration جدید بعد از تغییر Drizzle schema:

```bash
npm run db:generate
```

اجرای seed:

```bash
npm run db:seed
```

ورود به PostgreSQL داخل Docker:

```bash
docker compose exec postgres psql -U radicar -d radicar
```

اطلاعات PostgreSQL داخل volume با نام `radicar_postgres_data` باقی می‌ماند؛ بنابراین
`docker compose down` داده‌ها را حذف نمی‌کند.

برای حذف کامل دیتابیس محلی و شروع از صفر، فقط در صورتی که مطمئن هستید داده‌ای
لازم ندارید اجرا کنید:

```bash
docker compose down -v
npm run infra:up
npm run db:migrate
npm run db:seed
```

فرمان `down -v` غیرقابل‌بازگشت است و تمام داده‌های دیتابیس محلی Docker را حذف
می‌کند.

## تست و کنترل کیفیت

اجرای تمام تست‌های Web، API و AI:

```bash
npm run test
```

فرمان‌های تفکیک‌شده:

```bash
npm run test:web
npm run test:api
npm run typecheck
npm run lint
```

Production build کامل Monorepo:

```bash
npm run build
```

این فرمان dependency graph را با Turborepo رعایت می‌کند، packageها و API را
اعتبارسنجی می‌کند و Web را با Build رسمی Next.js در `apps/web/.next` می‌سازد.

## اجرای خروجی Build روی سیستم محلی

ابتدا Build بگیرید:

```bash
npm run build
```

سپس در دو terminal اجرا کنید:

```bash
npm run start:api
```

```bash
npm run start:web
```

PostgreSQL باید قبل از start شدن API در دسترس باشد و migrationها نیز باید اجرا
شده باشند.

## الزامات Production

در Production حداقل این موارد را رعایت کنید:

- `NODE_ENV=production`
- یک `AUTH_SECRET` تصادفی و حداقل ۳۲ کاراکتری
- `EXPOSE_DEVELOPMENT_OTP=false`
- `ALLOW_FIRST_USER_SUPERADMIN=false`
- تنظیم `BOOTSTRAP_SUPERADMIN_PHONE` برای bootstrap کنترل‌شده یا مدیریت نقش از
  قبل
- تنظیم `OTP_WEBHOOK_URL` و در صورت نیاز `OTP_WEBHOOK_TOKEN`
- محدودکردن `CORS_ORIGINS` به دامنه واقعی Web
- استفاده از PostgreSQL production با backup، connection pooling و SSL
- نگهداری secretها در Secret Manager، نه داخل repository یا Docker image

API در حالت Production با secret توسعه، بدون webhook پیامک یا با نمایش OTP بالا
نمی‌آید و عمداً startup را متوقف می‌کند.

## فرمان‌های مهم Monorepo

| فرمان | کاربرد |
| --- | --- |
| `npm run dev:stack` | اجرای هم‌زمان Web و API |
| `npm run dev:web` | فقط Web روی پورت 3161 |
| `npm run dev:api` | فقط API روی پورت 3162 |
| `npm run build` | Build کامل Monorepo با Next.js رسمی |
| `npm run build:web` | Build فقط Web و dependencyهای آن |
| `npm run build:api` | بررسی Build API و dependencyهای آن |
| `npm run build:packages` | Build packageهای مشترک |
| `npm run test` | تمام تست‌ها |
| `npm run test:web` | تست‌های Web |
| `npm run test:api` | تست‌های API |
| `npm run typecheck` | TypeScript تمام workspaceها |
| `npm run lint` | lint تمام workspaceها |
| `npm run infra:up` | اجرای PostgreSQL محلی |
| `npm run infra:down` | توقف containerها بدون حذف volume |
| `npm run db:generate` | تولید migration جدید |
| `npm run db:migrate` | اجرای migrationها |
| `npm run db:seed` | ایجاد داده اولیه |

## رفع خطاهای رایج

### Web پیام اتصال به Node API می‌دهد

- مقدار `NEXT_PUBLIC_API_BASE_URL` را در `apps/web/.env.local` بررسی کنید.
- مطمئن شوید API روی `http://localhost:3162` اجرا شده است.
- بعد از تغییر env، Web را restart کنید.

برای حفظ نشست ورود، در مرورگر `localhost` و `127.0.0.1` را با هم ترکیب نکنید.
Web و `NEXT_PUBLIC_API_BASE_URL` باید هر دو از hostname یکسان `localhost` استفاده
کنند؛ در غیر این صورت مرورگر ممکن است کوکی SameSite را به API نفرستد.

### endpoint `/ready` کد 503 می‌دهد

- وضعیت PostgreSQL را با `docker compose ps` بررسی کنید.
- log دیتابیس را با `docker compose logs postgres` ببینید.
- `DATABASE_URL` در `apps/api/.env` باید به پورت `5433` میزبان اشاره کند.
- migrationها را با `npm run db:migrate` اجرا کنید.

### خطای CORS دیده می‌شود

مقدار `CORS_ORIGINS` باید دقیقاً origin مرورگر، بدون مسیر اضافی، باشد:

```dotenv
CORS_ORIGINS=http://localhost:3161
```

برای چند origin از کاما استفاده کنید.

Web را فقط از `http://localhost:3161` باز کنید. پورت `3162` مخصوص API است. اگر
مرورگر صفحه Web را روی `localhost:3162` نشان می‌دهد، یک اجرای تکراری Web فعال
است؛ همه اجراهای قبلی را متوقف و فقط یک‌بار `npm run dev:stack` را اجرا کنید.
Next.js با پورت صریح `3161` اجرا می‌شود و در صورت اشغال‌بودن آن با خطای واضح
متوقف می‌شود.

### کد OTP در توسعه نمایش داده نمی‌شود

این مقادیر را بررسی و API را restart کنید:

```dotenv
EXPOSE_DEVELOPMENT_OTP=true
NODE_ENV=development
```

### قابلیت‌های AI خطای provider می‌دهند

حداقل `LLM_PROVIDER`، `LLM_MODEL`، `LLM_API_KEY` و `LLM_BASE_URL` را در
`apps/api/.env` تنظیم و API را restart کنید.

### یکی از پورت‌ها اشغال است

```bash
lsof -nP -iTCP:3161 -sTCP:LISTEN
lsof -nP -iTCP:3162 -sTCP:LISTEN
lsof -nP -iTCP:5433 -sTCP:LISTEN
```

فرآیند درست را متوقف کنید یا پورت متناظر را در تنظیمات تغییر دهید.

### dependencyها نامعتبر یا ناقص‌اند

اگر `package.json` و `package-lock.json` هماهنگ‌اند:

```bash
npm ci
```

از `npm audit fix --force` بدون بررسی تغییرات breaking استفاده نکنید.

## مستندات بیشتر

جزئیات مرز داده Web در
[`apps/web/lib/data/README.md`](apps/web/lib/data/README.md) آمده است.
