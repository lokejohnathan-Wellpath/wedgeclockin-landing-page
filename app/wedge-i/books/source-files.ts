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

export async function saveSourceFile(documentId: string, file: File) {
  const database = await openSourceDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, "readwrite");
      transaction.objectStore(storeName).put({
        documentId,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        blob: file,
        savedAt: new Date().toISOString(),
      } satisfies StoredSourceFile);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Source document could not be saved."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Source document storage was interrupted."));
    });
  } finally {
    database.close();
  }
}

export async function getSourceFile(documentId: string) {
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
