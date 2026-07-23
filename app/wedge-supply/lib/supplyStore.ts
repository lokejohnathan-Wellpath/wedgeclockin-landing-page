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
  version: 1,
  config: emptyConfig,
  items: [],
  requests: [],
  purchaseOrders: [],
  recipes: [],
  productionBatches: [],
  activities: [],
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

function isSupplyState(value: unknown): value is SupplyState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SupplyState>;
  return (
    candidate.version === 1 &&
    Boolean(candidate.config) &&
    Array.isArray(candidate.items) &&
    Array.isArray(candidate.requests) &&
    Array.isArray(candidate.purchaseOrders) &&
    Array.isArray(candidate.recipes) &&
    Array.isArray(candidate.productionBatches) &&
    Array.isArray(candidate.activities)
  );
}

export function loadSupplyState(): SupplyState {
  if (typeof window === "undefined") return emptySupplyState;

  try {
    const stored = window.localStorage.getItem(SUPPLY_STORAGE_KEY);
    if (!stored) return emptySupplyState;
    const parsed = JSON.parse(stored) as unknown;
    return isSupplyState(parsed) ? parsed : emptySupplyState;
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
