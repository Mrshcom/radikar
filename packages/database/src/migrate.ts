import { migrate } from "drizzle-orm/postgres-js/migrator";
import { fileURLToPath } from "node:url";
import { createDatabase } from "./client";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://radicar:radicar@localhost:5433/radicar";
const migrationsFolder = fileURLToPath(new URL("../migrations", import.meta.url));
const database = createDatabase(databaseUrl, 1);

try {
  await migrate(database.db, { migrationsFolder });
  console.info("Database migrations completed.");
} finally {
  await database.close();
}
