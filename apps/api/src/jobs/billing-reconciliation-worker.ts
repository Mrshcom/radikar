import { createDatabase } from "@radikar/database";
import { loadLocalEnvironment, readConfig } from "@radikar/config/server";
import { BillingService } from "../modules/billing/service";
import { RadicoinService } from "../modules/radicoin/service";

const reconciliationIntervalMs = 5 * 60_000;

loadLocalEnvironment();
const config = readConfig();
const database = createDatabase(config.DATABASE_URL, 1);
const radicoinService = new RadicoinService(database.db);
const billingService = new BillingService(database.db, {
  apiPublicUrl: config.API_PUBLIC_URL,
  webAppUrl: config.WEB_APP_URL,
  zarinpalBaseUrl: config.ZARINPAL_BASE_URL,
  zarinpalMerchantId: config.ZARINPAL_MERCHANT_ID,
  radicoinService,
});

async function tick() {
  try {
    const result = await billingService.reconcilePendingOrders();
    if (result.scanned > 0) console.info(JSON.stringify({ worker: "billing-reconciliation", ...result }));
  } catch (error) {
    console.error(error);
  }
}

async function shutdown() {
  await database.close();
  process.exit(0);
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());

await tick();
if (process.argv.includes("--once")) {
  await shutdown();
}
setInterval(() => void tick(), reconciliationIntervalMs);
