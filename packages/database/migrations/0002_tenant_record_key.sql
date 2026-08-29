ALTER TABLE "data_records" DROP CONSTRAINT "data_records_collection_id_pk";
CREATE UNIQUE INDEX "data_records_owner_collection_id_unique"
  ON "data_records" ("owner_user_id", "collection", "id");
