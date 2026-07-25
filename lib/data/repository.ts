import type { BaseRecord, DataCollection } from "./models";

export interface DataRepository {
  list<T extends BaseRecord>(collection: DataCollection): Promise<T[]>;
  get<T extends BaseRecord>(collection: DataCollection, id: string): Promise<T | undefined>;
  put<T extends BaseRecord>(collection: DataCollection, record: T): Promise<T>;
  remove(collection: DataCollection, id: string): Promise<void>;
  clear(collection: DataCollection): Promise<void>;
}

const DATABASE_NAME = "masir-resume-maker";
const DATABASE_VERSION = 2;
const COLLECTIONS: DataCollection[] = [
  "userProfiles",
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

  private openDatabase() {
    if (typeof indexedDB === "undefined") {
      return Promise.reject(new Error("IndexedDB در این محیط در دسترس نیست."));
    }

    if (!this.databasePromise) {
      this.databasePromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

        request.onupgradeneeded = () => {
          const database = request.result;
          COLLECTIONS.forEach((collection) => {
            if (!database.objectStoreNames.contains(collection)) {
              database.createObjectStore(collection, { keyPath: "id" });
            }
          });
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("بازکردن IndexedDB ناموفق بود."));
        request.onblocked = () => reject(new Error("نسخه دیگری از برنامه مانع ارتقای IndexedDB شده است."));
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
