import assert from "node:assert/strict";
import test from "node:test";
import {
  groupInventoryValue,
  nextDocumentNumber,
  productionPosting,
  reconcileDelivery,
  resolveFulfilmentRoute,
  weightedAverageCost,
} from "./operations";
import type { DeliveryOrder, SupplyItem, SupplyRecipe } from "./types";

const raw: SupplyItem = {
  id: "raw",
  name: "Chicken thigh",
  sku: "RAW-1",
  category: "Raw",
  unit: "kg",
  supplier: "",
  centralStock: 10,
  outletStock: 0,
  outletStocks: {},
  reorderLevel: 0,
  expiryDate: "",
  inventoryType: "raw",
  unitCost: 5,
};
const output: SupplyItem = {
  ...raw,
  id: "soy",
  name: "Soy chicken",
  sku: "WIP-1",
  centralStock: 0,
  inventoryType: "semi-processed",
  unitCost: 0,
};
const recipe: SupplyRecipe = {
  id: "recipe",
  name: "Soy chicken",
  outputItemId: "soy",
  outputItemName: "Soy chicken",
  outputQuantity: 2,
  outputUnit: "kg",
  ingredients: [
    { itemId: "raw", itemName: "Chicken thigh", quantity: 1, unit: "kg" },
  ],
  processingCostPerBatch: 1,
};

test("production deducts raw and adds a distinct output item with value", () => {
  const result = productionPosting({
    items: [raw, output],
    recipe,
    batch: {
      id: "b1",
      recipeId: "recipe",
      recipeName: "Soy chicken",
      multiplier: 2,
      scheduledDate: "2026-07-26",
      status: "planned",
      createdAt: "",
    },
    actualOutput: 4,
    wastage: 0,
  });
  assert.equal(result.items.find((item) => item.id === "raw")?.centralStock, 8);
  assert.equal(result.items.find((item) => item.id === "soy")?.centralStock, 4);
  assert.equal(result.totalCost, 12);
  assert.equal(result.outputUnitCost, 3);
});

test("weighted average preserves inventory value", () => {
  assert.equal(weightedAverageCost(10, 2, 5, 20), 40 / 15);
});

test("DO and direct delivery references use outlet code", () => {
  assert.equal(
    nextDocumentNumber([], "IPOH", "DO", "2026-07-26"),
    "IPOH-DO-20260726-0001",
  );
  assert.equal(
    nextDocumentNumber([], "IPOH", "DD", "2026-07-26"),
    "IPOH-DD-20260726-0001",
  );
});

test("partial receiving creates a discrepancy and uses actual received quantity", () => {
  const order = {
    id: "do",
    number: "IPOH-DO-1",
    outletId: "outlet",
    outletCode: "IPOH",
    outletName: "Ipoh",
    requestId: "r1",
    itemId: "raw",
    itemName: "Chicken",
    quantity: 10,
    unit: "kg",
    route: "central-stock",
    status: "dispatched",
    dispatchedAt: "",
    lines: [
      {
        id: "l1",
        requestId: "r1",
        itemId: "raw",
        itemName: "Chicken",
        dispatchedQuantity: 10,
        receivedQuantity: 0,
        damagedQuantity: 0,
        unit: "kg",
        unitCost: 5,
      },
    ],
  } satisfies DeliveryOrder;
  const result = reconcileDelivery(order, {
    l1: { received: 8, damaged: 1 },
  });
  assert.equal(result.status, "discrepancy");
  assert.equal(result.lines[0].receivedQuantity, 8);
});

test("direct supply value is omitted when its cost toggle is off", () => {
  const direct = {
    ...raw,
    inventoryType: "direct-supply" as const,
    centralStock: 0,
    outletStocks: { outlet: 4 },
    unitCost: 10,
  };
  assert.equal(groupInventoryValue([direct], false), 0);
  assert.equal(groupInventoryValue([direct], true), 40);
});

test("request route is derived from saved item and recipe setup", () => {
  assert.equal(
    resolveFulfilmentRoute(
      { inventoryType: "direct-supply" },
      true,
    ),
    "direct-supplier",
  );
  assert.equal(
    resolveFulfilmentRoute({ inventoryType: "semi-processed" }, true),
    "central-production",
  );
  assert.equal(
    resolveFulfilmentRoute({ inventoryType: "raw" }, false),
    "central-stock",
  );
});
