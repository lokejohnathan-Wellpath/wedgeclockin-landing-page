import { getBooksCloudSource, saveBooksCloudSource } from "./books-cloud";

const databaseName = "wedgebooks-source-documents";
const storeName = "source-files";

export type StoredSourceFile = {
  documentId: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
  savedAt: string;
};

function openSourceDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) {
        request.result.createObjectStore(storeName, { keyPath: "documentId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Source document storage could not open."));
  });
}

async function saveLocalSource(source: StoredSourceFile) {
  const database = await openSourceDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, "readwrite");
      transaction.objectStore(storeName).put(source);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Source document could not be saved."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Source document storage was interrupted."));
    });
  } finally {
    database.close();
  }
}

async function getLocalSource(documentId: string) {
  const database = await openSourceDatabase();
  try {
    return await new Promise<StoredSourceFile | null>((resolve, reject) => {
      const transaction = database.transaction(storeName, "readonly");
      const request = transaction.objectStore(storeName).get(documentId);
      request.onsuccess = () => resolve((request.result as StoredSourceFile | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error("Source document could not be opened."));
    });
  } finally {
    database.close();
  }
}

export async function saveSourceFile(documentId: string, file: File) {
  const source: StoredSourceFile = {
    documentId,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    blob: file,
    savedAt: new Date().toISOString(),
  };

  // Keep a fast browser cache, but also persist the original source in the
  // signed-in WedgeBooks cloud account so another device can open it later.
  await saveLocalSource(source);
  await saveBooksCloudSource(documentId, file, source.fileName, source.mimeType);
}

export async function getSourceFile(documentId: string) {
  try {
    const local = await getLocalSource(documentId);
    if (local) return local;
  } catch {
    // Fall through to cloud recovery when IndexedDB is unavailable/corrupt.
  }

  try {
    const cloud = await getBooksCloudSource(documentId);
    const source: StoredSourceFile = {
      documentId,
      fileName: cloud.fileName,
      mimeType: cloud.mimeType,
      blob: cloud.blob,
      savedAt: new Date().toISOString(),
    };
    try {
      await saveLocalSource(source);
    } catch {
      // Cloud source remains usable even if the local cache cannot be written.
    }
    return source;
  } catch {
    return null;
  }
}

export async function deleteSourceFile(documentId: string) {
  const database = await openSourceDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, "readwrite");
      transaction.objectStore(storeName).delete(documentId);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Source document could not be removed."));
    });
  } finally {
    database.close();
  }
}
