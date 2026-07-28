import type { BaseRecord, DataCollection } from "./models";

export interface DataRepository {
  list<T extends BaseRecord>(collection: DataCollection): Promise<T[]>;
  get<T extends BaseRecord>(collection: DataCollection, id: string): Promise<T | undefined>;
  put<T extends BaseRecord>(collection: DataCollection, record: T): Promise<T>;
  remove(collection: DataCollection, id: string): Promise<void>;
  clear(collection: DataCollection): Promise<void>;
}

const DATABASE_NAME = "radicar-resume-maker";
const DATABASE_VERSION = 3;
const LEGACY_DATABASE_NAME = ["ma", "sir", "-resume-maker"].join("");
const INTERNAL_STORE = "__radicar_meta";
const LEGACY_MIGRATION_KEY = "legacy-database-migrated";
const COLLECTIONS: DataCollection[] = [
  "appProfiles",
  "workspaceState",
  "userProfiles",
  "knowledgeProfiles",
  "resumes",
  "jobs",
  "applications",
  "interviewSessions",
  "matchAnalyses",
  "dashboardSnapshots",
];

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("عملیات IndexedDB ناموفق بود."));
  });
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("تراکنش IndexedDB ناموفق بود."));
    transaction.onabort = () => reject(transaction.error ?? new Error("تراکنش IndexedDB لغو شد."));
  });
}

class IndexedDbRepository implements DataRepository {
  private databasePromise?: Promise<IDBDatabase>;

  private openNamedDatabase(name: string, version?: number) {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = version ? indexedDB.open(name, version) : indexedDB.open(name);

      request.onupgradeneeded = () => {
        if (name !== DATABASE_NAME) return;
        const database = request.result;
        COLLECTIONS.forEach((collection) => {
          if (!database.objectStoreNames.contains(collection)) {
            database.createObjectStore(collection, { keyPath: "id" });
          }
        });
        if (!database.objectStoreNames.contains(INTERNAL_STORE)) {
          database.createObjectStore(INTERNAL_STORE);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("بازکردن IndexedDB ناموفق بود."));
      request.onblocked = () => reject(new Error("نسخه دیگری از برنامه مانع ارتقای IndexedDB شده است."));
    });
  }

  private async migrateLegacyDatabase(database: IDBDatabase) {
    const markerTransaction = database.transaction(INTERNAL_STORE, "readonly");
    const migrated = await requestToPromise(markerTransaction.objectStore(INTERNAL_STORE).get(LEGACY_MIGRATION_KEY));
    if (migrated) return;

    const availableDatabases = await indexedDB.databases();
    if (!availableDatabases.some(({ name }) => name === LEGACY_DATABASE_NAME)) {
      const transaction = database.transaction(INTERNAL_STORE, "readwrite");
      transaction.objectStore(INTERNAL_STORE).put(true, LEGACY_MIGRATION_KEY);
      await transactionToPromise(transaction);
      return;
    }

    const legacyDatabase = await this.openNamedDatabase(LEGACY_DATABASE_NAME);
    try {
      const existingCollections = COLLECTIONS.filter((collection) => legacyDatabase.objectStoreNames.contains(collection));
      for (const collection of existingCollections) {
        const readTransaction = legacyDatabase.transaction(collection, "readonly");
        const records = await requestToPromise(readTransaction.objectStore(collection).getAll()) as BaseRecord[];
        if (!records.length) continue;

        const writeTransaction = database.transaction(collection, "readwrite");
        const store = writeTransaction.objectStore(collection);
        records.forEach((record) => store.put(record));
        await transactionToPromise(writeTransaction);
      }
    } finally {
      legacyDatabase.close();
    }

    const transaction = database.transaction(INTERNAL_STORE, "readwrite");
    transaction.objectStore(INTERNAL_STORE).put(true, LEGACY_MIGRATION_KEY);
    await transactionToPromise(transaction);
  }

  private openDatabase() {
    if (typeof indexedDB === "undefined") {
      return Promise.reject(new Error("IndexedDB در این محیط در دسترس نیست."));
    }

    if (!this.databasePromise) {
      this.databasePromise = this.openNamedDatabase(DATABASE_NAME, DATABASE_VERSION)
        .then(async (database) => {
          await this.migrateLegacyDatabase(database);
          return database;
        })
        .catch((error) => {
          this.databasePromise = undefined;
          throw error;
        });
    }

    return this.databasePromise;
  }

  async list<T extends BaseRecord>(collection: DataCollection) {
    const database = await this.openDatabase();
    const transaction = database.transaction(collection, "readonly");
    return requestToPromise(transaction.objectStore(collection).getAll()) as Promise<T[]>;
  }

  async get<T extends BaseRecord>(collection: DataCollection, id: string) {
    const database = await this.openDatabase();
    const transaction = database.transaction(collection, "readonly");
    return requestToPromise(transaction.objectStore(collection).get(id)) as Promise<T | undefined>;
  }

  async put<T extends BaseRecord>(collection: DataCollection, record: T) {
    const database = await this.openDatabase();
    const transaction = database.transaction(collection, "readwrite");
    transaction.objectStore(collection).put(record);
    await transactionToPromise(transaction);
    return record;
  }

  async remove(collection: DataCollection, id: string) {
    const database = await this.openDatabase();
    const transaction = database.transaction(collection, "readwrite");
    transaction.objectStore(collection).delete(id);
    await transactionToPromise(transaction);
  }

  async clear(collection: DataCollection) {
    const database = await this.openDatabase();
    const transaction = database.transaction(collection, "readwrite");
    transaction.objectStore(collection).clear();
    await transactionToPromise(transaction);
  }
}

class HttpDataRepository implements DataRepository {
  constructor(private readonly baseUrl: string) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(body.error || `درخواست سرویس داده با خطای ${response.status} روبه‌رو شد.`);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  list<T extends BaseRecord>(collection: DataCollection) {
    return this.request<T[]>(`/${collection}`);
  }

  get<T extends BaseRecord>(collection: DataCollection, id: string) {
    return this.request<T | undefined>(`/${collection}/${encodeURIComponent(id)}`);
  }

  put<T extends BaseRecord>(collection: DataCollection, record: T) {
    return this.request<T>(`/${collection}/${encodeURIComponent(record.id)}`, {
      method: "PUT",
      body: JSON.stringify(record),
    });
  }

  remove(collection: DataCollection, id: string) {
    return this.request<void>(`/${collection}/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  clear(collection: DataCollection) {
    return this.request<void>(`/${collection}`, { method: "DELETE" });
  }
}

let repository: DataRepository | undefined;

export function getDataRepository(): DataRepository {
  if (repository) return repository;

  const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE ?? "indexeddb";
  repository = dataSource === "api"
    ? new HttpDataRepository(process.env.NEXT_PUBLIC_DATA_API_BASE_URL ?? "/api/data")
    : new IndexedDbRepository();

  return repository;
}
