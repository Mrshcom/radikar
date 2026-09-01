import { and, desc, eq } from "drizzle-orm";
import type { DataCollection, DataRecord } from "@radicar/shared-types";
import { dataRecords, type Database } from "@radicar/database";
import { normalizeDataRecordForStorage } from "@radicar/validators";

export interface RecordRepository {
  list(ownerUserId: string, collection: DataCollection): Promise<DataRecord[]>;
  get(ownerUserId: string, collection: DataCollection, id: string): Promise<DataRecord | null>;
  put(ownerUserId: string, collection: DataCollection, record: DataRecord): Promise<DataRecord>;
  remove(ownerUserId: string, collection: DataCollection, id: string): Promise<void>;
  clear(ownerUserId: string, collection: DataCollection): Promise<void>;
}

export class PostgresRecordRepository implements RecordRepository {
  constructor(private readonly database: Database) {}

  async list(ownerUserId: string, collection: DataCollection) {
    const rows = await this.database
      .select({ payload: dataRecords.payload })
      .from(dataRecords)
      .where(and(eq(dataRecords.ownerUserId, ownerUserId), eq(dataRecords.collection, collection)))
      .orderBy(desc(dataRecords.updatedAt));
    return rows.map(({ payload }) =>
      normalizeDataRecordForStorage(collection, payload),
    );
  }

  async get(ownerUserId: string, collection: DataCollection, id: string) {
    const [row] = await this.database
      .select({ payload: dataRecords.payload })
      .from(dataRecords)
      .where(
        and(
          eq(dataRecords.collection, collection),
          eq(dataRecords.id, id),
          eq(dataRecords.ownerUserId, ownerUserId),
        ),
      )
      .limit(1);
    return row?.payload
      ? normalizeDataRecordForStorage(collection, row.payload)
      : null;
  }

  async put(ownerUserId: string, collection: DataCollection, record: DataRecord) {
    const safeRecord = normalizeDataRecordForStorage(collection, record);
    const values = {
      collection,
      id: safeRecord.id,
      ownerUserId,
      profileId: safeRecord.profileId ?? null,
      payload: safeRecord,
      createdAt: new Date(safeRecord.createdAt),
      updatedAt: new Date(safeRecord.updatedAt),
    };

    const savedRows = await this.database
      .insert(dataRecords)
      .values(values)
      .onConflictDoUpdate({
        target: [dataRecords.ownerUserId, dataRecords.collection, dataRecords.id],
        set: {
          profileId: values.profileId,
          ownerUserId,
          payload: values.payload,
          updatedAt: values.updatedAt,
        },
      })
      .returning({ id: dataRecords.id });
    if (savedRows.length === 0) throw new Error("Record could not be saved.");
    return safeRecord;
  }

  async remove(ownerUserId: string, collection: DataCollection, id: string) {
    await this.database
      .delete(dataRecords)
      .where(
        and(
          eq(dataRecords.collection, collection),
          eq(dataRecords.id, id),
          eq(dataRecords.ownerUserId, ownerUserId),
        ),
      );
  }

  async clear(ownerUserId: string, collection: DataCollection) {
    await this.database
      .delete(dataRecords)
      .where(and(eq(dataRecords.ownerUserId, ownerUserId), eq(dataRecords.collection, collection)));
  }
}
