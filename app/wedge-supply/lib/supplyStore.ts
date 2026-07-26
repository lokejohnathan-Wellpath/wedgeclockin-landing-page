"use client";

import type { SupplyActivity, SupplyConfig, SupplyState } from "./types";

export const SUPPLY_STORAGE_KEY = "wedge_supply_erp_v1";

export const emptyConfig: SupplyConfig = {
  businessName: "",
  centralLocation: "",
  outletName: "",
  outletCode: "",
  outlets: [],
  activeOutletId: "",
  currency: "RM",
};

export const emptySupplyState: SupplyState = {
  version: 3,
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
  deliveryOrders: [],
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

export function normaliseOutletCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 12);
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
    [1, 2, 3].includes(candidate.version || 0) &&
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
    | "version"
    | "intelligence"
    | "planningEvents"
    | "productionAllocations"
    | "deliveryOrders"
  > & {
    version?: number;
    intelligence?: SupplyState["intelligence"];
    planningEvents?: SupplyState["planningEvents"];
    productionAllocations?: SupplyState["productionAllocations"];
    deliveryOrders?: SupplyState["deliveryOrders"];
  };
  const legacyOutletId = "outlet-legacy";
  const legacyOutletCode =
    normaliseOutletCode(
      candidate.config.outletCode || candidate.config.outletName || "OUTLET-1",
    ) || "OUTLET-1";
  const outlets = candidate.config.outlets?.length
    ? candidate.config.outlets.map((outlet) => ({
        ...outlet,
        code: normaliseOutletCode(outlet.code),
        active: outlet.active !== false,
      }))
    : candidate.config.outletName
      ? [
          {
            id: legacyOutletId,
            name: candidate.config.outletName,
            code: legacyOutletCode,
            active: true,
            createdAt: new Date().toISOString(),
          },
        ]
      : [];
  const activeOutletId =
    outlets.find((outlet) => outlet.id === candidate.config.activeOutletId)
      ?.id ||
    outlets[0]?.id ||
    "";
  const productionOutputIds = new Set(
    candidate.recipes.map((recipe) => recipe.outputItemId),
  );
  return {
    ...candidate,
    version: 3,
    config: {
      ...candidate.config,
      outletName: outlets[0]?.name || candidate.config.outletName || "",
      outletCode: outlets[0]?.code || legacyOutletCode,
      outlets,
      activeOutletId,
    },
    items: candidate.items.map((item) => ({
      ...item,
      safetyStock: Math.max(
        0,
        Number(item.safetyStock ?? item.reorderLevel ?? 0),
      ),
      supplierLeadTimeDays: Math.max(0, Number(item.supplierLeadTimeDays ?? 2)),
      minimumOrderQuantity: Math.max(0, Number(item.minimumOrderQuantity ?? 0)),
      inventoryType: productionOutputIds.has(item.id)
        ? "semi-processed"
        : (item.inventoryType ?? "raw"),
      purchaseUnit: item.purchaseUnit ?? item.unit,
      purchasePackSize: Math.max(0.000001, Number(item.purchasePackSize ?? 1)),
      unitCost: Math.max(0, Number(item.unitCost ?? 0)),
      lastPurchasePrice: Math.max(0, Number(item.lastPurchasePrice ?? 0)),
      outletStocks:
        item.outletStocks ??
        (outlets[0]
          ? { [outlets[0].id]: Math.max(0, Number(item.outletStock ?? 0)) }
          : {}),
    })),
    requests: candidate.requests.map((request) => {
      const outlet =
        outlets.find((entry) => entry.id === request.outletId) ||
        outlets.find((entry) => entry.name === request.outletName) ||
        outlets[0];
      return {
        ...request,
        outletId: outlet?.id,
        outletCode: outlet?.code,
        outletName: outlet?.name || request.outletName,
      };
    }),
    intelligence: {
      dismissedSuggestionIds:
        candidate.intelligence?.dismissedSuggestionIds ?? [],
      approvedSuggestionCount:
        candidate.intelligence?.approvedSuggestionCount ?? 0,
      lastReviewedAt: candidate.intelligence?.lastReviewedAt ?? "",
    },
    planningEvents: candidate.planningEvents ?? [],
    productionAllocations: candidate.productionAllocations ?? [],
    deliveryOrders: candidate.deliveryOrders ?? [],
  };
}

export function loadSupplyState(): SupplyState {
  if (typeof window === "undefined") return emptySupplyState;

  try {
    const stored = window.localStorage.getItem(SUPPLY_STORAGE_KEY);
    if (!stored) return emptySupplyState;
    const parsed = JSON.parse(stored) as unknown;
    return isSupplyState(parsed)
      ? migrateSupplyState(parsed)
      : emptySupplyState;
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
      (state.config.outlets?.length || state.config.outletName.trim()),
  );
}
