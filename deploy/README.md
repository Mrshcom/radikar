# استقرار Production رادیکار

این پیکربندی Web، API، PostgreSQL و Caddy را روی یک سرور اجرا می‌کند. فقط
پورت‌های ۸۰ و ۴۴۳ عمومی می‌شوند و Caddy گواهی HTTPS را مدیریت می‌کند.

## پیش‌نیاز

- یک VPS لینوکسی با Docker Engine و Docker Compose
- دامنه‌ای که رکوردهای `A` دامنه اصلی و `www` آن به IP سرور اشاره کنند
- سرویس پیامک Production، Merchant ID واقعی زرین‌پال و کلید Provider هوش مصنوعی

## آماده‌سازی

از ریشه پروژه اجرا کنید:

```bash
cp deploy/.env.example deploy/.env.production
chmod 600 deploy/.env.production
```

مقادیر نمونه و تمام `replace-me`ها را تغییر دهید. برای ساخت secret مناسب:

```bash
openssl rand -base64 48
```

در نخستین راه‌اندازی می‌توانید `BOOTSTRAP_SUPERADMIN_PHONE` را موقتاً تنظیم
کنید. بعد از ساخته‌شدن سوپرادمین آن را حذف کنید و کانتینر API را دوباره بسازید.

## اجرا

ابتدا تنظیمات نهایی Compose را بررسی کنید:

```bash
PRODUCTION_ENV_FILE=deploy/.env.production \
  docker compose --env-file deploy/.env.production -f compose.production.yml config
```

سپس imageها را بسازید و سرویس‌ها را اجرا کنید:

```bash
docker compose --env-file deploy/.env.production -f compose.production.yml build
docker compose --env-file deploy/.env.production -f compose.production.yml up -d
```

API قبل از شروع، migrationهای دیتابیس را اجرا می‌کند. وضعیت سرویس‌ها:

```bash
docker compose --env-file deploy/.env.production -f compose.production.yml ps
docker compose --env-file deploy/.env.production -f compose.production.yml logs --tail=100 api web caddy
curl https://YOUR_DOMAIN/health
curl https://YOUR_DOMAIN/ready
```

## انتشار نسخه جدید

```bash
git pull --ff-only
docker compose --env-file deploy/.env.production -f compose.production.yml build
docker compose --env-file deploy/.env.production -f compose.production.yml up -d
```

مقدار `NEXT_PUBLIC_API_BASE_URL` هنگام build داخل Web قرار می‌گیرد؛ پس بعد از
تغییر دامنه حتماً image وب را دوباره بسازید.

## پشتیبان‌گیری PostgreSQL

```bash
chmod +x deploy/backup-postgres.sh
./deploy/backup-postgres.sh
```

فایل‌ها در پوشه `backups/` ساخته می‌شوند. آن‌ها را به فضای ذخیره‌سازی خارج از
VPS منتقل و بازیابی آزمایشی را به‌صورت دوره‌ای اجرا کنید.

## DeepSeek محلی

اگر proxy مدل روی خود میزبان Docker و پورت ۹۶۵۵ اجرا می‌شود، مقدار زیر را حفظ
کنید:

```dotenv
FREE_DEEPSEEK_BASE_URL=http://host.docker.internal:9655/v1
```

سرویس proxy باید روی آدرسی قابل‌دسترسی از شبکه Docker گوش دهد؛ اگر فقط به
`127.0.0.1` متصل باشد، کانتینر API به آن دسترسی نخواهد داشت. دسترسی پورت را
در فایروال فقط به شبکه داخلی Docker محدود کنید و آن را مستقیماً عمومی نکنید.

اگر مدل در کانتینر یا سرور دیگری است، URL داخلی یا HTTPS همان سرویس را جایگزین
کنید.
