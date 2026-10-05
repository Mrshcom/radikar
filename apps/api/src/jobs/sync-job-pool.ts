import { createDatabase } from "@radikar/database";
import { loadLocalEnvironment, readConfig } from "@radikar/config/server";
import { JobPoolService } from "../modules/job-pool/service";

loadLocalEnvironment();
const config = readConfig();
const database = createDatabase(config.DATABASE_URL, 1);
const service = new JobPoolService(database.db, {
  enabled: config.JOB_POOL_ENABLED,
  apifyApiToken: config.APIFY_API_TOKEN,
  actorId: config.APIFY_LINKEDIN_JOBS_ACTOR_ID,
  dailyLimit: config.JOB_POOL_DAILY_LIMIT,
  intervalHours: config.JOB_POOL_INTERVAL_HOURS,
  locations: config.JOB_POOL_LOCATIONS.split(",")
    .map((location) => location.trim())
    .filter(Boolean),
  publishedAt: config.JOB_POOL_PUBLISHED_AT,
  costPerThousandUsdMicros: config.JOB_POOL_COST_PER_1000_USD_MICROS,
  actorStartCostUsdMicros: config.JOB_POOL_ACTOR_START_COST_USD_MICROS,
});

try {
  console.info(JSON.stringify(await service.syncDailyPool()));
} finally {
  await database.close();
}
