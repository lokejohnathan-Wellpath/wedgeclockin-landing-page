import { productRequest } from "../../lib/productAccess";
import type { BookDocument, BusinessType, LearningMap } from "./brain";

export type CloudSetup = { name: string; type: BusinessType };
export type CloudState = {
  workspace: null | {
    setup: CloudSetup | null;
    learning: LearningMap;
    customColumns: string[];
    migratedFromBrowserAt?: string | null;
  };
  documents: BookDocument[];
};

export function loadBooksCloudState() {
  return productRequest<CloudState>("books", "/api/saas/books/state");
}

export function saveBooksCloudWorkspace(setup: CloudSetup | null, learning: LearningMap, customColumns: string[]) {
  return productRequest("books", "/api/saas/books/workspace", {
    method: "PUT",
    body: JSON.stringify({ setup, learning, customColumns }),
  });
}

export function migrateBooksBrowserState(setup: CloudSetup | null, learning: LearningMap, customColumns: string[], documents: BookDocument[]) {
  return productRequest<{ success: true; migratedDocuments: number }>("books", "/api/saas/books/browser-migration", {
    method: "POST",
    body: JSON.stringify({ setup, learning, customColumns, documents }),
  });
}

export function saveBooksCloudDocument(document: BookDocument) {
  return productRequest("books", `/api/saas/books/documents/${encodeURIComponent(document.id)}`, {
    method: "PUT",
    body: JSON.stringify({ document }),
  });
}

export function deleteBooksCloudDocument(documentId: string) {
  return productRequest("books", `/api/saas/books/documents/${encodeURIComponent(documentId)}`, { method: "DELETE" });
}

async function blobToBase64(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

function base64ToBlob(base64: string, mimeType: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mimeType });
}

export async function saveBooksCloudSource(documentId: string, file: File | Blob, fileName?: string, mimeType?: string) {
  return productRequest("books", `/api/saas/books/documents/${encodeURIComponent(documentId)}/source`, {
    method: "PUT",
    body: JSON.stringify({
      fileName: fileName || (file instanceof File ? file.name : "source-document"),
      mimeType: mimeType || file.type || "application/octet-stream",
      base64: await blobToBase64(file),
    }),
  });
}

export async function getBooksCloudSource(documentId: string) {
  const result = await productRequest<{ fileName: string; mimeType: string; base64: string }>(
    "books",
    `/api/saas/books/documents/${encodeURIComponent(documentId)}/source`,
  );
  return { fileName: result.fileName, mimeType: result.mimeType, blob: base64ToBlob(result.base64, result.mimeType) };
}
