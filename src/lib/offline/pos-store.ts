/**
 * Lưu trữ offline cho POS (IndexedDB, không phụ thuộc thư viện).
 * - catalog: snapshot dữ liệu POS để tìm/duyệt khi mất mạng.
 * - outbox: hàng đợi đơn bán tạo khi offline, đồng bộ lại khi có mạng.
 * Mọi hàm an toàn ở client; trả về giá trị mặc định nếu IndexedDB không khả dụng.
 */
const DB_NAME = "sales-pos-offline";
const DB_VER = 1;

function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("catalog")) db.createObjectStore("catalog");
      if (!db.objectStoreNames.contains("outbox")) db.createObjectStore("outbox", { keyPath: "localId" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

function run<T>(storeName: string, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T | null> {
  return openDB().then((db) => {
    if (!db) return null;
    return new Promise<T | null>((resolve) => {
      const tx = db.transaction(storeName, mode);
      const req = fn(tx.objectStore(storeName));
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => resolve(null);
    });
  });
}

// ---- catalog ----
export async function saveCatalog(data: unknown): Promise<void> {
  await run("catalog", "readwrite", (s) => s.put(data, "snapshot"));
}
export async function loadCatalog<T = unknown>(): Promise<T | null> {
  return run<T>("catalog", "readonly", (s) => s.get("snapshot"));
}

// ---- outbox ----
export interface OutboxOrder {
  localId: string;
  payload: unknown;   // input của createOrder
  savedAt: number;
  failed?: boolean;
  failReason?: string;
}
export async function enqueueOrder(rec: OutboxOrder): Promise<void> {
  await run("outbox", "readwrite", (s) => s.put(rec));
}
export async function getOutbox(): Promise<OutboxOrder[]> {
  const all = await run<OutboxOrder[]>("outbox", "readonly", (s) => s.getAll());
  return all ?? [];
}
export async function removeOutbox(localId: string): Promise<void> {
  await run("outbox", "readwrite", (s) => s.delete(localId));
}
export async function markFailed(localId: string, reason: string): Promise<void> {
  const item = await run<OutboxOrder>("outbox", "readonly", (s) => s.get(localId));
  if (item) await run("outbox", "readwrite", (s) => s.put({ ...item, failed: true, failReason: reason }));
}
