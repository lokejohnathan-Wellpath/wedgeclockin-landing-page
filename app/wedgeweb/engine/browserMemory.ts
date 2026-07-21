const DB_NAME = "wedgeweb-v6-memory";
const STORE = "workspace";
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE))
        request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveBrowserValue<T>(key: string, value: T) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).put(value, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function readBrowserValue<T>(key: string): Promise<T | null> {
  const database = await openDatabase();
  const value = await new Promise<T | null>((resolve, reject) => {
    const request = database
      .transaction(STORE, "readonly")
      .objectStore(STORE)
      .get(key);
    request.onsuccess = () => resolve((request.result as T) ?? null);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return value;
}

export async function clearWedgeWebBrowserMemory() {
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
  Object.keys(localStorage)
    .filter((key) => key.startsWith("wedgeweb_"))
    .forEach((key) => localStorage.removeItem(key));
  sessionStorage.removeItem("wedgeweb_v6_conversation");
}

export const V6_DRAFT_KEY = "current-draft";
export const V6_HISTORY_KEY = "design-history";
export const V6_CONVERSATION_KEY = "design-conversation";
export const V6_TERMS_KEY = "wedgeweb_v6_confirmed_terms";
