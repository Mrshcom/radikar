import type { BaseRecord, DataCollection } from "./models";
import { apiRequest } from "@/lib/api-client";
import { getBrowserQueryClient } from "@/lib/query-client";

export interface DataRepository {
  list<T extends BaseRecord>(collection: DataCollection): Promise<T[]>;
  get<T extends BaseRecord>(
    collection: DataCollection,
    id: string,
  ): Promise<T | undefined>;
  put<T extends BaseRecord>(collection: DataCollection, record: T): Promise<T>;
  remove(collection: DataCollection, id: string): Promise<void>;
  clear(collection: DataCollection): Promise<void>;
}

class HttpDataRepository implements DataRepository {
  private collectionPath(collection: DataCollection) {
    return `/v1/data/${collection}`;
  }

  list<T extends BaseRecord>(collection: DataCollection) {
    return getBrowserQueryClient().fetchQuery({
      queryKey: ["data", collection],
      queryFn: () => apiRequest<T[]>(this.collectionPath(collection)),
    });
  }

  async get<T extends BaseRecord>(collection: DataCollection, id: string) {
    const record = await getBrowserQueryClient().fetchQuery({
      queryKey: ["data", collection, id],
      queryFn: () =>
        apiRequest<T | null>(
          `${this.collectionPath(collection)}/${encodeURIComponent(id)}`,
        ),
    });
    return record ?? undefined;
  }

  async put<T extends BaseRecord>(collection: DataCollection, record: T) {
    const saved = await apiRequest<T>(
      `${this.collectionPath(collection)}/${encodeURIComponent(record.id)}`,
      {
        method: "PUT",
        body: JSON.stringify(record),
      },
    );
    const queryClient = getBrowserQueryClient();
    queryClient.setQueryData(["data", collection, record.id], saved);
    await queryClient.invalidateQueries({ queryKey: ["data", collection] });
    return saved;
  }

  async remove(collection: DataCollection, id: string) {
    await apiRequest<void>(
      `${this.collectionPath(collection)}/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    const queryClient = getBrowserQueryClient();
    queryClient.removeQueries({ queryKey: ["data", collection, id] });
    await queryClient.invalidateQueries({ queryKey: ["data", collection] });
  }

  async clear(collection: DataCollection) {
    await apiRequest<void>(this.collectionPath(collection), {
      method: "DELETE",
    });
    getBrowserQueryClient().removeQueries({ queryKey: ["data", collection] });
  }
}

let repository: DataRepository | undefined;

export function getDataRepository(): DataRepository {
  repository ??= new HttpDataRepository();
  return repository;
}
