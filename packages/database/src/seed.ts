import { dataRecords, plans } from "./schema";
import { createDatabase } from "./client";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://radicar:radicar@localhost:5433/radicar";
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

  await database.db
    .insert(dataRecords)
    .values([
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
    ])
    .onConflictDoNothing();
  console.info("Database seed completed.");
} finally {
  await database.close();
}
