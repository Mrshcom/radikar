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

| مسیر | مسئولیت |
| --- | --- |
| `apps/web` | Next.js App Router؛ رابط فارسی/RTL، پنل کاربر و مدیریت |
| `apps/api` | Fastify؛ احراز هویت، داده، پرداخت، AI، import و health checks |
| `packages/database` | Drizzle schema، migration و seed PostgreSQL |
| `packages/validators` | قراردادها و اعتبارسنجی‌های مشترک Zod |
| `packages/shared-types` | typeهای مشترک بدون وابستگی به framework |
| `packages/ai` | adapter/provider و پردازش پاسخ مدل‌های زبانی |
| `packages/config` | بارگذاری و اعتبارسنجی تنظیمات server |
| `deploy` | Docker/Caddy و دستورالعمل استقرار VPS |
| `graphify-out` | graph تولیدشده؛ فایل‌های dirty آن طبیعی‌اند |

## نقاط ورود و مسیرهای مهم

| موضوع | Web | API |
| --- | --- | --- |
| API client و proxy | `apps/web/lib/api-client.ts` و routeهای `apps/web/app/api` / `app/v1` | `apps/api/src/app.ts` و `build-app.ts` |
| احراز هویت و OTP | `apps/web/app/login` و `app/_components/auth.tsx` | `modules/auth/routes.ts` و `service.ts` |
| رزومه | `apps/web/app/(panel)/resumes` | data routes و `modules/imports` |
| jobs/applications/knowledge base | routeهای متناظر در `apps/web/app/(panel)` | `modules/data/routes.ts` |
| تحلیل AI، تطبیق و مصاحبه | `match`، `interview` و provider taskهای Web | `modules/ai/routes.ts` و `packages/ai` |
| پرداخت و عضویت | `orders`، `upgrade` و admin pages | `modules/billing/*` و Zarinpal client |
| بررسی سرویس | — | `/health` و `/ready` در `modules/health/routes.ts` |

## اجرای محلی

پیش‌نیاز: Node `>=22.13.0`، npm `>=10` و Docker Desktop.

```bash
npm ci
npm run infra:up
npm run db:migrate
npm run db:seed
npm run dev:stack
```

| سرویس | آدرس |
| --- | --- |
| Web | `http://localhost:3161` |
| API | `http://localhost:3162` |
| API health | `http://localhost:3162/health` |
| API readiness | `http://localhost:3162/ready` |
| PostgreSQL میزبان | `127.0.0.1:5433` |

برای حفظ session، hostnameهای `localhost` و `127.0.0.1` را با هم ترکیب نکنید.

## تنظیمات محیطی و امنیت

- نمونه‌ها: `apps/web/.env.example` و `apps/api/.env.example`.
- فایل‌های واقعی `.env` و `.env.local` secret هستند؛ آن‌ها را در این سند، logها
  یا Git ثبت نکنید.
- API برای توسعه به `DATABASE_URL` محلی یا اتصال Neon نیاز دارد.
- Production باید `AUTH_SECRET` تصادفی، OTP واقعی، CORS محدود و
  `EXPOSE_DEVELOPMENT_OTP=false` داشته باشد.
- شماره bootstrap فقط برای راه‌اندازی کنترل‌شدهٔ سوپرادمین استفاده شود و بعد
  حذف شود.

## دیتابیس، داده و پلن‌ها

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
- VPS فعلی رادیکار در مسیر `/home/sport724/mampel/radikar` اجرا می‌شود؛ پورت
  تست HTTP `5000` و HTTPS `5443` است و پورت‌های داخلی API/Web عمومی نیستند.
- در تست IP، OTP پیامک نمی‌شود و `developmentCode` نمایش داده می‌شود؛ پیش از
  انتشار دامنه باید این حالت خاموش، CORS محدود و cookie امن فعال شود.
- خروجی provider هوش مصنوعی از کانتینر API روی HTTPS استفاده می‌کند و برای
  پایداری، `api.gapgpt.app` در Compose به edge سالم pin شده است.
- CI/CD در `.github/workflows/deploy-production.yml` با push تگ‌هایی مثل
  `0.1.11-p` اجرا می‌شود و فقط مسیر VPS بالا را sync و stack را recreate می‌کند.
- پس از تغییر `NEXT_PUBLIC_API_BASE_URL` باید Web دوباره build/deploy شود.

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

1. `AGENTS.md` را اول بخوانید. این فایل را فقط برای کار معماری، route، env،
   deploy یا incident و فقط در بخش مرتبط بخوانید.
2. برای تغییر کوچک در فایل شناخته‌شده، مستقیم همان فایل را باز کنید.
3. برای codebase question از graphify query با پرسش محدود استفاده کنید.
4. تغییرات ناخواستهٔ worktree را متعلق به کاربر بدانید؛ reset یا حذف نکنید.
5. برای پروژهٔ فارسی، Vazirmatn محلی و RTL الزامی است؛ برای UI از Tailwind استفاده
   کنید. فرم‌ها با React Hook Form + Zod و fetching سمت کلاینت با TanStack Query.
6. پس از تغییر code، بررسی متناسب (test/typecheck/build) و `graphify update .`
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
- artifactهای تولیدی مانند `.turbo`، `.next` و `graphify-out` از این کنترل خارج‌اند.
