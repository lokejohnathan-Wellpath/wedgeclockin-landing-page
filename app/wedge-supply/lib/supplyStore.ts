"use client";

import type {
  SupplyActivity,
  SupplyConfig,
  SupplyState,
} from "./types";

export const SUPPLY_STORAGE_KEY = "wedge_supply_erp_v1";

export const emptyConfig: SupplyConfig = {
  businessName: "",
  centralLocation: "",
  outletName: "",
  currency: "RM",
};

export const emptySupplyState: SupplyState = {
  version: 2,
  config: emptyConfig,
  items: [],
  requests: [],
  purchaseOrders: [],
  recipes: [],
  productionBatches: [],
  activities: [],
  intelligence: {
    dismissedSuggestionIds: [],
    approvedSuggestionCount: 0,
    lastReviewedAt: "",
  },
  planningEvents: [],
  productionAllocations: [],
};

export function makeId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}

export function activity(message: string): SupplyActivity {
  return {
    id: makeId("activity"),
    message,
    createdAt: new Date().toISOString(),
  };
}

function isSupplyState(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const candidate = value as {
    version?: number;
    config?: unknown;
    items?: unknown;
    requests?: unknown;
    purchaseOrders?: unknown;
    recipes?: unknown;
    productionBatches?: unknown;
    activities?: unknown;
  };
  return (
    (candidate.version === 1 || candidate.version === 2) &&
    Boolean(candidate.config) &&
    Array.isArray(candidate.items) &&
    Array.isArray(candidate.requests) &&
    Array.isArray(candidate.purchaseOrders) &&
    Array.isArray(candidate.recipes) &&
    Array.isArray(candidate.productionBatches) &&
    Array.isArray(candidate.activities)
  );
}

function migrateSupplyState(value: unknown): SupplyState {
  const candidate = value as Omit<
    SupplyState,
    "version" | "intelligence" | "planningEvents" | "productionAllocations"
  > & {
    version?: number;
    intelligence?: SupplyState["intelligence"];
    planningEvents?: SupplyState["planningEvents"];
    productionAllocations?: SupplyState["productionAllocations"];
  };
  return {
    ...candidate,
    version: 2,
    items: candidate.items.map((item) => ({
      ...item,
      safetyStock: Math.max(0, Number(item.safetyStock ?? item.reorderLevel ?? 0)),
      supplierLeadTimeDays: Math.max(0, Number(item.supplierLeadTimeDays ?? 2)),
      minimumOrderQuantity: Math.max(0, Number(item.minimumOrderQuantity ?? 0)),
      inventoryType: item.inventoryType ?? "raw",
      purchaseUnit: item.purchaseUnit ?? item.unit,
      purchasePackSize: Math.max(0.000001, Number(item.purchasePackSize ?? 1)),
    })),
    intelligence: {
      dismissedSuggestionIds:
        candidate.intelligence?.dismissedSuggestionIds ?? [],
      approvedSuggestionCount:
        candidate.intelligence?.approvedSuggestionCount ?? 0,
      lastReviewedAt: candidate.intelligence?.lastReviewedAt ?? "",
    },
    planningEvents: candidate.planningEvents ?? [],
    productionAllocations: candidate.productionAllocations ?? [],
  };
}

export function loadSupplyState(): SupplyState {
  if (typeof window === "undefined") return emptySupplyState;

  try {
    const stored = window.localStorage.getItem(SUPPLY_STORAGE_KEY);
    if (!stored) return emptySupplyState;
    const parsed = JSON.parse(stored) as unknown;
    return isSupplyState(parsed) ? migrateSupplyState(parsed) : emptySupplyState;
  } catch {
    return emptySupplyState;
  }
}

export function saveSupplyState(state: SupplyState) {
  window.localStorage.setItem(SUPPLY_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("wedge-supply-updated"));
}

export function hasCompletedSetup(state: SupplyState) {
  return Boolean(
    state.config.businessName.trim() &&
      state.config.centralLocation.trim() &&
      state.config.outletName.trim(),
  );
}
