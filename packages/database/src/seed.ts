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
        name: "شروع",
        description: "برای تجربهٔ نخستین تحلیل و شناخت فضای رادیکار",
        features: ["۱ رزومه", "۳ خروجی PDF", "۱ تحلیل تطبیق شغلی", "۳ تحلیل کوتاه داشبورد"],
        priceRials: 0,
        radicoinCost: null,
        durationDays: 30,
        resumeLimit: 1,
        pdfDownloadLimit: 3,
        aiCredits: 5,
        matchCredits: 1,
        interviewCredits: 0,
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
        description: "برای یک ماه اپلای هدفمند و آمادگی مصاحبه",
        features: [
          "۵ رزومه",
          "خروجی PDF نامحدود",
          "۸ تحلیل تطبیق شغلی",
          "۲ رزومهٔ هدفمند",
          "۳ مصاحبهٔ تمرینی",
          "۱۰ تحلیل کوتاه داشبورد",
        ],
        priceRials: 5_490_000,
        radicoinCost: 549,
        durationDays: 30,
        resumeLimit: 5,
        pdfDownloadLimit: null,
        aiCredits: 51,
        matchCredits: 8,
        interviewCredits: 3,
        sortOrder: 20,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "professional",
        accountType: "candidate",
        name: "حرفه‌ای",
        description: "برای پیگیری جدی فرصت‌ها و آمادگی حرفه‌ای برای مصاحبه",
        features: [
          "رزومه و خروجی PDF نامحدود",
          "۱۵ تحلیل تطبیق شغلی",
          "۳ رزومهٔ هدفمند",
          "۴ مصاحبهٔ تمرینی",
          "۲۰ تحلیل کوتاه داشبورد",
          "اولویت در قابلیت‌های حرفه‌ای",
        ],
        priceRials: 8_990_000,
        radicoinCost: 899,
        durationDays: 30,
        resumeLimit: null,
        pdfDownloadLimit: null,
        aiCredits: 85,
        matchCredits: 15,
        interviewCredits: 4,
        sortOrder: 30,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "employer-free",
        accountType: "employer",
        name: "شروع استخدام",
        description: "برای ساخت نخستین پوزیشن و آشنایی با فرایند استخدام",
        features: [
          "ساخت و مدیریت ۱ پوزیشن فعال",
          "ورود رزومه و مشاهده فایل اصلی",
          "مدیریت نامزدها در مراحل استخدام",
          "۳ تحلیل کوتاه پوزیشن",
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
        description: "برای مدیریت فعال فرایند جذب در چند موقعیت شغلی",
        features: [
          "مدیریت ۳ پوزیشن هم‌زمان",
          "ورود گروهی رزومه‌ها",
          "۲۰ پایش هوشمند رزومه",
          "۳ مصاحبهٔ دعوتی نامزد",
          "۱۰ تحلیل کوتاه پوزیشن و داشبورد",
        ],
        priceRials: 5_990_000,
        radicoinCost: 599,
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
        description: "برای استخدام مستمر و بررسی حجم بالاتر رزومه‌ها",
        features: [
          "مدیریت ۱۰ پوزیشن هم‌زمان",
          "ورود گروهی رزومه‌ها",
          "۴۰ پایش هوشمند رزومه",
          "۷ مصاحبهٔ دعوتی نامزد",
          "۲۰ تحلیل کوتاه پوزیشن و داشبورد",
        ],
        priceRials: 12_990_000,
        radicoinCost: 1_299,
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
        resumeLimit: sql`excluded.resume_limit`,
        pdfDownloadLimit: sql`excluded.pdf_download_limit`,
        aiCredits: sql`excluded.ai_credits`,
        matchCredits: sql`excluded.match_credits`,
        interviewCredits: sql`excluded.interview_credits`,
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
