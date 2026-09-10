import type { BookDocument, LearningMap } from "./brain";
import {
  deleteBooksCloudDocument,
  loadBooksCloudState,
  migrateBooksBrowserState,
  saveBooksCloudDocument,
  saveBooksCloudWorkspace,
  type CloudSetup,
  type CloudState,
} from "./books-cloud";

const keys = {
  setup: "wedgebooks.setup",
  documents: "wedgebooks.documents",
  legacyDocuments: "wedgebooks.receipts",
  learning: "wedgebooks.learning",
  customColumns: "wedgebooks.customColumns",
} as const;

type BrowserState = {
  setup: CloudSetup | null;
  documents: BookDocument[];
  learning: LearningMap;
  customColumns: string[];
};

type SyncBaseline = {
  workspace: string;
  documents: Map<string, string>;
};

let baseline: SyncBaseline | null = null;
let syncing = false;

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function readBrowserState(): BrowserState {
  if (typeof window === "undefined") {
    return { setup: null, documents: [], learning: {}, customColumns: [] };
  }

  const documents = parseJson<BookDocument[]>(
    localStorage.getItem(keys.documents) || localStorage.getItem(keys.legacyDocuments),
    [],
  );

  return {
    setup: parseJson<CloudSetup | null>(localStorage.getItem(keys.setup), null),
    documents,
    learning: parseJson<LearningMap>(localStorage.getItem(keys.learning), {}),
    customColumns: parseJson<string[]>(localStorage.getItem(keys.customColumns), []),
  };
}

function workspaceFingerprint(state: Pick<BrowserState, "setup" | "learning" | "customColumns">) {
  return JSON.stringify({ setup: state.setup, learning: state.learning, customColumns: state.customColumns });
}

function documentFingerprint(document: BookDocument) {
  return JSON.stringify(document);
}

function setBaseline(state: BrowserState) {
  baseline = {
    workspace: workspaceFingerprint(state),
    documents: new Map(state.documents.map((document) => [document.id, documentFingerprint(document)])),
  };
}

function writeCloudToBrowser(cloud: CloudState) {
  if (typeof window === "undefined") return;

  if (cloud.workspace?.setup) {
    localStorage.setItem(keys.setup, JSON.stringify(cloud.workspace.setup));
  } else {
    localStorage.removeItem(keys.setup);
  }

  localStorage.setItem(keys.documents, JSON.stringify(cloud.documents || []));
  localStorage.removeItem(keys.legacyDocuments);
  localStorage.setItem(keys.learning, JSON.stringify(cloud.workspace?.learning || {}));
  localStorage.setItem(keys.customColumns, JSON.stringify(cloud.workspace?.customColumns || []));
}

function cloudAsBrowserState(cloud: CloudState): BrowserState {
  return {
    setup: cloud.workspace?.setup || null,
    documents: cloud.documents || [],
    learning: cloud.workspace?.learning || {},
    customColumns: cloud.workspace?.customColumns || [],
  };
}

function hasBrowserData(state: BrowserState) {
  return Boolean(
    state.setup ||
      state.documents.length ||
      Object.keys(state.learning).length ||
      state.customColumns.some((column) => column.trim()),
  );
}

function hasCloudData(cloud: CloudState) {
  return Boolean(
    cloud.workspace?.setup ||
      cloud.documents?.length ||
      Object.keys(cloud.workspace?.learning || {}).length ||
      cloud.workspace?.customColumns?.some((column) => column.trim()),
  );
}

/**
 * Cloud is authoritative for a signed-in WedgeBooks customer. Existing browser
 * data is migrated exactly once when the cloud account is empty, then the
 * browser becomes a fast local cache of the cloud account.
 */
export async function bootstrapBooksCloudState() {
  const cloud = await loadBooksCloudState();
  const browser = readBrowserState();

  if (!hasCloudData(cloud) && hasBrowserData(browser) && !cloud.workspace?.migratedFromBrowserAt) {
    await migrateBooksBrowserState(browser.setup, browser.learning, browser.customColumns, browser.documents);
    const migratedCloud = await loadBooksCloudState();
    writeCloudToBrowser(migratedCloud);
    setBaseline(cloudAsBrowserState(migratedCloud));
    return migratedCloud;
  }

  writeCloudToBrowser(cloud);
  setBaseline(cloudAsBrowserState(cloud));
  return cloud;
}

export async function syncBooksBrowserStateToCloud() {
  if (syncing || !baseline) return;
  syncing = true;

  try {
    const browser = readBrowserState();
    const nextWorkspace = workspaceFingerprint(browser);

    if (nextWorkspace !== baseline.workspace) {
      await saveBooksCloudWorkspace(browser.setup, browser.learning, browser.customColumns);
      baseline.workspace = nextWorkspace;
    }

    const currentIds = new Set(browser.documents.map((document) => document.id));

    for (const document of browser.documents) {
      const nextFingerprint = documentFingerprint(document);
      if (baseline.documents.get(document.id) !== nextFingerprint) {
        await saveBooksCloudDocument(document);
        baseline.documents.set(document.id, nextFingerprint);
      }
    }

    for (const documentId of [...baseline.documents.keys()]) {
      if (!currentIds.has(documentId)) {
        await deleteBooksCloudDocument(documentId);
        baseline.documents.delete(documentId);
      }
    }
  } finally {
    syncing = false;
  }
}

export function startBooksCloudMirror() {
  if (typeof window === "undefined") return () => undefined;

  const interval = window.setInterval(() => {
    void syncBooksBrowserStateToCloud().catch(() => {
      // The next interval retries. The local cache remains intact while offline.
    });
  }, 1500);

  const flush = () => {
    void syncBooksBrowserStateToCloud().catch(() => undefined);
  };
  window.addEventListener("focus", flush);
  window.addEventListener("online", flush);

  return () => {
    window.clearInterval(interval);
    window.removeEventListener("focus", flush);
    window.removeEventListener("online", flush);
    flush();
  };
}
