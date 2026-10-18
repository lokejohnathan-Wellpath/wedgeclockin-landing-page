import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { bootstrapBooksCloudState, syncBooksBrowserStateToCloud } from "./books-sync";
import { bindBooksCloudSession, loadBooksCloudState } from "./books-cloud";

let storage: Map<string, string>;
let requests: Array<{ path: string; body?: string }>;
let cloud: { workspace: null; documents: unknown[] };
let respond: (url: string, init?: RequestInit) => Promise<Response>;

beforeEach(() => {
  storage = new Map([["wedge_books_token", "token-B"]]);
  requests = [];
  cloud = { workspace: null, documents: [] };
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://audit.invalid";
  const local = { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => { storage.set(key, value); }, removeItem: (key: string) => { storage.delete(key); } };
  Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: local });
  respond = async (url, init) => {
    const path = new URL(url).pathname;
    requests.push({ path, body: init?.body as string | undefined });
    return new Response(JSON.stringify(path.endsWith("/state") ? cloud : { success: true }));
  };
  globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => respond(String(url), init)) as typeof fetch;
});

test("switching to an empty client never migrates the previous client's cache", async () => {
  storage.set("wedgebooks.cacheAccountId", "A");
  storage.set("wedgebooks.setup", JSON.stringify({ name: "Client A", type: "retail" }));
  storage.set("wedgebooks.documents", JSON.stringify([{ id: "A-receipt" }]));
  await bootstrapBooksCloudState("B");
  assert.equal(storage.get("wedgebooks.cacheAccountId"), "B");
  assert.equal(storage.get("wedgebooks.documents"), "[]");
  assert.match(storage.get("wedgebooks.recovery.A") || "", /A-receipt/);
  assert.equal(requests.some((r) => r.path.includes("migration")), false);
});

test("unassigned legacy cache is preserved for recovery rather than assigned to a client", async () => {
  storage.set("wedgebooks.documents", JSON.stringify([{ id: "legacy" }]));
  await bootstrapBooksCloudState("B");
  assert.match(storage.get("wedgebooks.recovery.unassigned") || "", /legacy/);
  assert.equal(requests.some((r) => r.path.includes("migration")), false);
});

test("offline changes migrate only when their recorded account matches", async () => {
  storage.set("wedgebooks.cacheAccountId", "B");
  storage.set("wedgebooks.documents", JSON.stringify([{ id: "B-receipt" }]));
  await bootstrapBooksCloudState("B");
  assert.equal(requests.filter((r) => r.path.includes("migration")).length, 1);
});

test("an old tab refuses cloud requests after the Books token changes", async () => {
  bindBooksCloudSession("token-A");
  await assert.rejects(loadBooksCloudState(), /account changed/);
  assert.equal(requests.length, 0);
});

test("a cloud response arriving after an account change cannot replace the cache", async () => {
  respond = async () => {
    storage.set("wedge_books_token", "token-C");
    return new Response(JSON.stringify({ workspace: { setup: { name: "Client B" } }, documents: [] }));
  };
  await assert.rejects(bootstrapBooksCloudState("B"), /account changed/);
  assert.notEqual(storage.get("wedgebooks.cacheAccountId"), "B");
});

test("the previous client's mirror cannot write with a new client token", async () => {
  await bootstrapBooksCloudState("B");
  storage.set("wedgebooks.documents", JSON.stringify([{ id: "B-receipt" }]));
  storage.set("wedge_books_token", "token-C");
  await syncBooksBrowserStateToCloud();
  assert.equal(requests.some((r) => r.body), false);
});
