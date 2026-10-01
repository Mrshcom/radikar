import { dataRecords, plans } from "./schema";
import { createDatabase } from "./client";
import { and, eq, isNull, sql } from "drizzle-orm";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://radikar:radikar@localhost:5433/radikar";
const database = createDatabase(databaseUrl, 1);
const now = new Date();
const timestamp = now.toISOString();

try {
  await database.db
    .insert(plans)
    .values([
      {
        id: "free",
        name: "رایگان",
        description: "شروع کار و ساخت اولین رزومه",
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
        name: "جست‌وجوی شغلی",
        description: "برای جست‌وجوی فعال شغل و ارسال رزومه‌های هدفمند",
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
        name: "حرفه‌ای",
        description: "برای استفاده حرفه‌ای و پیگیری هم‌زمان چند فرصت شغلی",
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
    ])
    .onConflictDoUpdate({
      target: plans.id,
      set: {
        durationDays: 30,
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
