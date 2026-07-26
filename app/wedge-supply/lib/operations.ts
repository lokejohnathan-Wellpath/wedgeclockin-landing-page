import type {
  DeliveryOrder,
  DeliveryOrderLine,
  FulfilmentRoute,
  ProductionBatch,
  StockLedgerEntry,
  SupplyItem,
  SupplyRecipe,
} from "./types";

export function malaysiaDateKey(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
}

export function weightedAverageCost(
  existingQuantity: number,
  existingUnitCost: number,
  incomingQuantity: number,
  incomingValue: number,
) {
  const nextQuantity = existingQuantity + incomingQuantity;
  if (nextQuantity <= 0) return 0;
  return (
    (existingQuantity * existingUnitCost + incomingValue) / nextQuantity
  );
}

export function resolveFulfilmentRoute(
  item: Pick<SupplyItem, "inventoryType">,
  hasProductionRule: boolean,
): FulfilmentRoute {
  if (item.inventoryType === "direct-supply") return "direct-supplier";
  if (hasProductionRule) return "central-production";
  return "central-stock";
}

export function nextDocumentNumber(
  documents: Array<{ number: string }>,
  locationCode: string,
  kind: "DO" | "DD",
  date = malaysiaDateKey(),
) {
  const prefix = `${locationCode}-${kind}-${date.replaceAll("-", "")}-`;
  const used = documents
    .map((document) => document.number)
    .filter((number) => number.startsWith(prefix))
    .map((number) => Number(number.slice(prefix.length)))
    .filter(Number.isFinite);
  return `${prefix}${String(Math.max(0, ...used) + 1).padStart(4, "0")}`;
}

export function productionPosting({
  items,
  recipe,
  batch,
  actualOutput,
  wastage,
}: {
  items: SupplyItem[];
  recipe: SupplyRecipe;
  batch: ProductionBatch;
  actualOutput: number;
  wastage: number;
}) {
  const ingredientCost = recipe.ingredients.reduce((total, ingredient) => {
    const item = items.find((candidate) => candidate.id === ingredient.itemId);
    return (
      total +
      ingredient.quantity * batch.multiplier * Number(item?.unitCost || 0)
    );
  }, 0);
  const totalCost =
    ingredientCost +
    Number(recipe.processingCostPerBatch || 0) * batch.multiplier;
  const goodOutput = Math.max(0, actualOutput - Math.max(0, wastage));
  const outputUnitCost = goodOutput > 0 ? totalCost / goodOutput : 0;
  const nextItems = items.map((item) => {
    const ingredient = recipe.ingredients.find(
      (candidate) => candidate.itemId === item.id,
    );
    if (ingredient) {
      return {
        ...item,
        centralStock:
          item.centralStock - ingredient.quantity * batch.multiplier,
      };
    }
    if (item.id === recipe.outputItemId) {
      const nextQuantity = item.centralStock + goodOutput;
      return {
        ...item,
        inventoryType: "semi-processed" as const,
        centralStock: nextQuantity,
        unitCost: weightedAverageCost(
          item.centralStock,
          Number(item.unitCost || 0),
          goodOutput,
          totalCost,
        ),
      };
    }
    return item;
  });
  return { items: nextItems, totalCost, outputUnitCost, goodOutput };
}

export function buildDeliveryLines(
  requests: Array<{
    id: string;
    itemId: string;
    itemName: string;
    quantity: number;
    allocatedQuantity?: number;
    unit: string;
  }>,
  items: SupplyItem[],
): DeliveryOrderLine[] {
  return requests.map((request) => ({
    id: `line-${request.id}`,
    requestId: request.id,
    itemId: request.itemId,
    itemName: request.itemName,
    dispatchedQuantity: request.allocatedQuantity || request.quantity,
    receivedQuantity: 0,
    damagedQuantity: 0,
    unit: request.unit,
    unitCost: Number(
      items.find((item) => item.id === request.itemId)?.unitCost || 0,
    ),
  }));
}

export function reconcileDelivery(
  order: DeliveryOrder,
  actual: Record<string, { received: number; damaged: number }>,
) {
  const lines = (order.lines || []).map((line) => ({
    ...line,
    receivedQuantity: Math.max(0, Number(actual[line.id]?.received || 0)),
    damagedQuantity: Math.max(0, Number(actual[line.id]?.damaged || 0)),
  }));
  const allReceived = lines.every(
    (line) =>
      line.receivedQuantity + line.damagedQuantity >= line.dispatchedQuantity,
  );
  const anyDifference = lines.some(
    (line) =>
      line.receivedQuantity + line.damagedQuantity !== line.dispatchedQuantity,
  );
  const anyReceived = lines.some((line) => line.receivedQuantity > 0);
  return {
    lines,
    status: anyDifference
      ? ("discrepancy" as const)
      : allReceived
        ? ("received" as const)
        : anyReceived
          ? ("partially-received" as const)
          : ("dispatched" as const),
  };
}

export function ledgerEntry({
  id,
  movement,
  item,
  locationId,
  locationCode,
  quantityDelta,
  sourceType,
  sourceId,
  reference,
  route,
  valueOverride,
  reason,
}: {
  id: string;
  movement: StockLedgerEntry["movement"];
  item: SupplyItem;
  locationId: string;
  locationCode: string;
  quantityDelta: number;
  sourceType: StockLedgerEntry["sourceType"];
  sourceId: string;
  reference: string;
  route?: FulfilmentRoute;
  valueOverride?: number;
  reason?: string;
}): StockLedgerEntry {
  const unitCost = Number(item.unitCost || 0);
  return {
    id,
    postedAt: new Date().toISOString(),
    effectiveDate: malaysiaDateKey(),
    movement,
    itemId: item.id,
    itemName: item.name,
    locationId,
    locationCode,
    quantityDelta,
    unit: item.unit,
    unitCost,
    valueDelta: valueOverride ?? quantityDelta * unitCost,
    sourceType,
    sourceId,
    reference,
    status: "posted",
    route,
    reason,
  };
}

function csvCell(value: string | number | boolean) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(rows: Array<Record<string, string | number | boolean>>) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.map(csvCell).join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\r\n");
}

export function groupInventoryValue(
  items: SupplyItem[],
  includeDirectSupplierCost: boolean,
) {
  return items.reduce((total, item) => {
    const direct = item.inventoryType === "direct-supply";
    return total +
      (direct && !includeDirectSupplierCost
        ? 0
        : (item.centralStock +
            Object.values(item.outletStocks || {}).reduce(
              (sum, quantity) => sum + Number(quantity || 0),
              0,
            )) *
          Number(item.unitCost || 0));
  }, 0);
}
