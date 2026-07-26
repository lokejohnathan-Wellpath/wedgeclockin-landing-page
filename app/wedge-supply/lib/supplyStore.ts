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
  let migratedItems = candidate.items.map((item) => ({
    ...item,
    safetyStock: Math.max(
      0,
      Number(item.safetyStock ?? item.reorderLevel ?? 0),
    ),
    supplierLeadTimeDays: Math.max(0, Number(item.supplierLeadTimeDays ?? 2)),
    minimumOrderQuantity: Math.max(0, Number(item.minimumOrderQuantity ?? 0)),
    inventoryType: item.inventoryType ?? ("raw" as const),
    purchaseUnit: item.purchaseUnit ?? item.unit,
    purchasePackSize: Math.max(0.000001, Number(item.purchasePackSize ?? 1)),
    unitCost: Math.max(0, Number(item.unitCost ?? 0)),
    lastPurchasePrice: Math.max(0, Number(item.lastPurchasePrice ?? 0)),
    outletStocks:
      item.outletStocks ??
      (outlets[0]
        ? { [outlets[0].id]: Math.max(0, Number(item.outletStock ?? 0)) }
        : {}),
  }));
  const migratedRecipes = candidate.recipes.map((recipe) => {
    const currentOutput = migratedItems.find(
      (item) => item.id === recipe.outputItemId,
    );
    const outputName = recipe.name.trim();
    if (
      !currentOutput ||
      !outputName ||
      currentOutput.name.trim().toLowerCase() === outputName.toLowerCase()
    ) {
      return recipe;
    }

    let correctedOutput = migratedItems.find(
      (item) => item.name.trim().toLowerCase() === outputName.toLowerCase(),
    );
    if (!correctedOutput) {
      correctedOutput = {
        id: `produced-${recipe.id}`,
        name: outputName,
        sku: `PROD-${String(migratedItems.length + 1).padStart(4, "0")}`,
        category: "Own production / WIP",
        unit: recipe.outputUnit || currentOutput.unit,
        supplier: "",
        centralStock: 0,
        outletStock: 0,
        outletStocks: {},
        reorderLevel: 0,
        expiryDate: "",
        inventoryType: "semi-processed",
        purchaseUnit: recipe.outputUnit || currentOutput.unit,
        purchasePackSize: 1,
        safetyStock: 0,
        supplierLeadTimeDays: 0,
        minimumOrderQuantity: 0,
        unitCost: 0,
        lastPurchasePrice: 0,
      };
      migratedItems.push(correctedOutput);
    }

    const completedBatches = candidate.productionBatches.filter(
      (batch) =>
        batch.recipeId === recipe.id &&
        batch.status === "completed" &&
        Number(batch.producedQuantity || 0) > 0,
    );
    const totalProduced = completedBatches.reduce(
      (sum, batch) => sum + Number(batch.producedQuantity || 0),
      0,
    );
    const totalProductionCost = completedBatches.reduce(
      (sum, batch) => sum + Number(batch.productionCost || 0),
      0,
    );
    const completedBatchIds = new Set(
      completedBatches.map((batch) => batch.id),
    );
    const alreadyDispatched = (candidate.productionAllocations ?? [])
      .filter(
        (allocation) =>
          completedBatchIds.has(allocation.batchId) &&
          ["dispatched", "received"].includes(allocation.status),
      )
      .reduce((sum, allocation) => sum + Number(allocation.quantity || 0), 0);
    const heldProduced = Math.max(0, totalProduced - alreadyDispatched);
    const movedQuantity = Math.min(
      heldProduced,
      Math.max(0, Number(currentOutput.centralStock || 0)),
    );
    const movedValue =
      totalProduced > 0
        ? totalProductionCost * (movedQuantity / totalProduced)
        : 0;

    if (movedQuantity > 0) {
      const oldStock = Number(currentOutput.centralStock || 0);
      const oldValue = oldStock * Number(currentOutput.unitCost || 0);
      const remainingStock = Math.max(0, oldStock - movedQuantity);
      const remainingValue = Math.max(0, oldValue - movedValue);
      const outputStock = Number(correctedOutput.centralStock || 0);
      const outputValue =
        outputStock * Number(correctedOutput.unitCost || 0) + movedValue;

      migratedItems = migratedItems.map((item) => {
        if (item.id === currentOutput.id) {
          const looksRaw =
            (item.category || "").toLowerCase().includes("raw") ||
            (item.sku || "").toLowerCase().includes("raw");
          return {
            ...item,
            centralStock: remainingStock,
            unitCost: remainingStock > 0 ? remainingValue / remainingStock : 0,
            inventoryType: looksRaw ? ("raw" as const) : item.inventoryType,
          };
        }
        if (item.id === correctedOutput.id) {
          const nextStock = outputStock + movedQuantity;
          return {
            ...item,
            centralStock: nextStock,
            unitCost: nextStock > 0 ? outputValue / nextStock : 0,
            inventoryType: "semi-processed" as const,
          };
        }
        return item;
      });
    }

    return {
      ...recipe,
      outputItemId: correctedOutput.id,
      outputItemName: correctedOutput.name,
      outputUnit: correctedOutput.unit,
    };
  });
  const productionOutputIds = new Set(
    migratedRecipes.map((recipe) => recipe.outputItemId),
  );
  migratedItems = migratedItems.map((item) => ({
    ...item,
    inventoryType: productionOutputIds.has(item.id)
      ? ("semi-processed" as const)
      : item.inventoryType,
  }));
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
    items: migratedItems,
    recipes: migratedRecipes,
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
