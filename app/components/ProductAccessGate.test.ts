import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

test("Founder Books access requests the selected business even with another valid token", async () => {
  const effects: Array<() => void> = [];
  const calls: string[] = [];
  const states: unknown[] = [];
  let token = "token-A";
  let index = 0;
  const code = ts.transpileModule(readFileSync("app/components/ProductAccessGate.tsx", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const react = { useEffect: (fn: () => void) => effects.push(fn), useState: (value: unknown) => { const i = index++; states[i] = value; return [value, (next: unknown) => { states[i] = next; }]; } };
  const context = {
    exports: {} as { default: (props: unknown) => unknown },
    window: { location: { search: "?businessId=B" } }, localStorage: { getItem: () => "founder" }, URLSearchParams,
    require: (name: string) => {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return { jsxs: () => null, jsx: (type: unknown, props: unknown) => typeof type === "function" ? type(props) : null };
      if (name === "next/navigation") return { useRouter: () => ({ replace: () => {} }), useSearchParams: () => new URLSearchParams("businessId=B") };
      if (name.includes("productAccess")) return { productConfig: { books: { name: "Books", basePath: "/books" } }, productToken: () => token, saveProductToken: (_: unknown, next: string) => { token = next; }, clearProductToken: () => {}, productRequest: async () => ({ account: { id: token === "token-B" ? "B" : "A", product: "books" }, subscription: { canWrite: true } }) };
      if (name.includes("founderApi")) return { FOUNDER_TOKEN_KEY: "founder", founderRequest: async (path: string) => { calls.push(path); return { token: "token-B" }; } };
      if (name.includes("books-sync")) return { bootstrapBooksCloudState: async (id: string) => calls.push(`loaded:${id}`), startBooksCloudMirror: () => () => {} };
      throw new Error(name);
    },
  };
  vm.runInNewContext(code, context);
  context.exports.default({ product: "books", children: null });
  effects[0]();
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.deepEqual(calls, ["/api/founder/control/businesses/B/books/access", "loaded:B"]);
});
