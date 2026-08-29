# لایه داده Web

رابط کاربری فقط Storeهای `stores.ts` را مصرف می‌کند. این Storeها از یک
`HttpDataRepository` استفاده می‌کنند و همه داده‌های پایدار را به Node API می‌فرستند.
هیچ fallback، migration یا ذخیره‌سازی دامنه‌ای در IndexedDB، `localStorage` یا
`sessionStorage` وجود ندارد.

## تنظیم Web

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3162
```

در production این مقدار باید آدرس عمومی و امن API مستقل باشد. درخواست‌های کلاینت با
cookie نشست HttpOnly ارسال می‌شوند و کش خواندن‌ها در QueryClient مشترک TanStack Query
نگهداری می‌شود. mutationها cache همان collection را invalidate می‌کنند و خروج از حساب
کل cache کاربر را پاک می‌کند.

## قرارداد HTTP

Base URL داده: `${NEXT_PUBLIC_API_BASE_URL}/v1/data`

- `GET /{collection}`: فهرست رکوردهای کاربر واردشده
- `GET /{collection}/{id}`: یک رکورد متعلق به همان کاربر
- `PUT /{collection}/{id}`: ایجاد یا به‌روزرسانی idempotent
- `DELETE /{collection}/{id}`: حذف رکورد
- `DELETE /{collection}`: پاک‌کردن collection همان کاربر

نام collectionها در `@radicar/shared-types` مشترک است و ساختار پایه رکورد با Zod
در `@radicar/validators` اعتبارسنجی می‌شود.
Node API مالکیت را از نشست سرور استخراج می‌کند و به `profileId` ارسالی مرورگر برای
تشخیص کاربر اعتماد نمی‌کند. PostgreSQL تنها منبع حقیقت داده‌های پایدار است.
