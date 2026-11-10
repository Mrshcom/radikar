import { dataRecords, plans } from "./schema";
import { createDatabase } from "./client";
import { and, eq, isNull, sql } from "drizzle-orm";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://radikar:radikar@localhost:5433/radikar";
const database = createDatabase(databaseUrl, 1);
const now = new Date();
const timestamp = now.toISOString();

try {
  await database.db
    .insert(plans)
    .values([
      {
        id: "free",
        accountType: "candidate",
        name: "رایگان",
        description: "شروع کار و ساخت اولین رزومه",
        features: ["۱ رزومه", "۳ خروجی PDF", "۵ اعتبار هوش مصنوعی", "۱ تحلیل تطبیق شغلی", "۱ جلسه آمادگی مصاحبه"],
        priceRials: 0,
        radicoinCost: null,
        durationDays: 30,
        resumeLimit: 1,
        pdfDownloadLimit: 3,
        aiCredits: 5,
        matchCredits: 1,
        interviewCredits: 1,
        isFree: true,
        isPurchasable: false,
        sortOrder: 10,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "job-search",
        accountType: "candidate",
        name: "جست‌وجوی شغلی",
        description: "برای جست‌وجوی فعال شغل و ارسال رزومه‌های هدفمند",
        features: [
          "۵ رزومه",
          "خروجی PDF نامحدود",
          "۴۰ اعتبار هوش مصنوعی",
          "۱۵ تحلیل تطبیق شغلی",
          "۵ جلسه آمادگی مصاحبه",
        ],
        priceRials: 4_990_000,
        radicoinCost: 1_000,
        durationDays: 30,
        resumeLimit: 5,
        pdfDownloadLimit: null,
        aiCredits: 40,
        matchCredits: 15,
        interviewCredits: 5,
        sortOrder: 20,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "professional",
        accountType: "candidate",
        name: "حرفه‌ای",
        description: "برای استفاده حرفه‌ای و پیگیری هم‌زمان چند فرصت شغلی",
        features: [
          "رزومه و خروجی PDF نامحدود",
          "۱۵۰ اعتبار هوش مصنوعی",
          "۵۰ تحلیل تطبیق شغلی",
          "۱۵ جلسه آمادگی مصاحبه",
          "اولویت در قابلیت‌های حرفه‌ای",
        ],
        priceRials: 7_990_000,
        radicoinCost: 2_500,
        durationDays: 30,
        resumeLimit: null,
        pdfDownloadLimit: null,
        aiCredits: 150,
        matchCredits: 50,
        interviewCredits: 15,
        sortOrder: 30,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "employer-free",
        accountType: "employer",
        name: "شروع استخدام",
        description: "برای آشنایی با فضای استخدام و مدیریت اولین پوزیشن",
        features: [
          "ساخت و مدیریت ۱ پوزیشن فعال",
          "ورود رزومه و مشاهده فایل اصلی",
          "مدیریت نامزدها در مراحل استخدام",
          "پایش و دعوت به مصاحبه با رادیکوین",
        ],
        priceRials: 0,
        radicoinCost: null,
        durationDays: 30,
        resumeLimit: 0,
        pdfDownloadLimit: 0,
        aiCredits: 0,
        matchCredits: 0,
        interviewCredits: 0,
        isFree: true,
        isPurchasable: false,
        sortOrder: 10,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "employer-growth",
        accountType: "employer",
        name: "جذب حرفه‌ای",
        description: "برای تیم‌هایی که چند موقعیت شغلی را هم‌زمان پیش می‌برند",
        features: [
          "مدیریت هم‌زمان پوزیشن‌های استخدامی",
          "ورود گروهی رزومه‌ها",
          "پایش هوشمند و رتبه‌بندی نامزدها",
          "دعوت مستقیم به مصاحبه",
          "نمای یکپارچه فرایند جذب",
        ],
        priceRials: 5_990_000,
        radicoinCost: 1_200,
        durationDays: 30,
        resumeLimit: 0,
        pdfDownloadLimit: 0,
        aiCredits: 0,
        matchCredits: 0,
        interviewCredits: 0,
        sortOrder: 20,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "employer-scale",
        accountType: "employer",
        name: "استخدام تیمی",
        description: "برای جذب مستمر، حجم رزومه بیشتر و همکاری تیم استخدام",
        features: [
          "همه امکانات جذب حرفه‌ای",
          "مدیریت حجم بالاتر رزومه و نامزد",
          "گردش‌کار یکپارچه پایش تا مصاحبه",
          "دسترسی سریع به سوابق سفارش و اعتبار",
          "مناسب تیم‌های در حال رشد",
        ],
        priceRials: 11_990_000,
        radicoinCost: 3_000,
        durationDays: 30,
        resumeLimit: 0,
        pdfDownloadLimit: 0,
        aiCredits: 0,
        matchCredits: 0,
        interviewCredits: 0,
        sortOrder: 30,
        createdAt: now,
        updatedAt: now,
      },
    ])
    .onConflictDoUpdate({
      target: plans.id,
      set: {
        durationDays: 30,
        accountType: sql`excluded.account_type`,
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        features: sql`excluded.features`,
        priceRials: sql`excluded.price_rials`,
        radicoinCost: sql`excluded.radicoin_cost`,
        isFree: sql`excluded.is_free`,
        isPurchasable: sql`excluded.is_purchasable`,
        sortOrder: sql`excluded.sort_order`,
        updatedAt: now,
      },
    });

  const initialRecords = [
    {
      collection: "appProfiles",
      id: "profile-default",
      payload: {
        id: "profile-default",
        workspaceName: "فضای کاری اصلی",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      collection: "workspaceState",
      id: "active-profile",
      payload: {
        id: "active-profile",
        activeProfileId: "profile-default",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      createdAt: now,
      updatedAt: now,
    },
  ];
  // `NULL` values do not conflict in a normal Postgres unique index. Serialize
  // this small global seed section so parallel deploy/CI processes are safe too.
  await database.db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(783241)`);
    for (const record of initialRecords) {
      const [existing] = await tx
        .select({ id: dataRecords.id })
        .from(dataRecords)
        .where(
          and(
            eq(dataRecords.collection, record.collection),
            eq(dataRecords.id, record.id),
            isNull(dataRecords.ownerUserId),
          ),
        )
        .limit(1);
      if (!existing) await tx.insert(dataRecords).values(record);
    }
  });
  console.info("Database seed completed.");
} finally {
  await database.close();
}
