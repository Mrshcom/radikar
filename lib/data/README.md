# Data access

رابط کاربری فقط از Storeهای موجود در `stores.ts` استفاده می‌کند و به IndexedDB یا
HTTP وابستگی مستقیم ندارد. مخزن پیش‌فرض `IndexedDbRepository` است و هیچ داده نمونه‌ای
در شروع برنامه seed نمی‌شود.

برای انتقال به بک‌اند، بدون تغییر صفحات و کامپوننت‌ها، متغیرهای عمومی زیر را تنظیم کنید:

```env
NEXT_PUBLIC_DATA_SOURCE=api
NEXT_PUBLIC_DATA_API_BASE_URL=/api/data
```

`HttpDataRepository` قرارداد یکسانی برای تمام collectionها دارد:

- `GET /{collection}`: فهرست رکوردها
- `GET /{collection}/{id}`: یک رکورد
- `PUT /{collection}/{id}`: ایجاد یا به‌روزرسانی رکورد
- `DELETE /{collection}/{id}`: حذف رکورد
- `DELETE /{collection}`: پاک‌کردن collection

نام collectionها در `models.ts` تعریف شده است. هنگام آماده‌شدن سرویس‌ها، احراز هویت
و هدرهای لازم را فقط در `HttpDataRepository.request` اضافه کنید.
