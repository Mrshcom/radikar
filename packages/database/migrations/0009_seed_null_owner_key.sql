-- The tenant key is intentionally nullable for system seed records. A partial
-- index makes that key explicit for direct SQL callers as well.
CREATE UNIQUE INDEX IF NOT EXISTS "data_records_system_collection_id_unique"
  ON "data_records" ("collection", "id")
  WHERE "owner_user_id" IS NULL;
