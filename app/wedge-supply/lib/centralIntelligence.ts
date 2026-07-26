import type {
  ProductionBatch,
  PurchaseOrder,
  SupplyItem,
  SupplyRequest,
  SupplyState,
} from "./types";

export type StockSignal = "critical" | "par" | "sufficient" | "expiry";

export type StockInsight = {
  item: SupplyItem;
  signal: StockSignal;
  committed: number;
  available: number;
  learnedWeeklyDemand: number;
  projectedDaysRemaining: number | null;
  daysToExpiry: number | null;
};

export type DemandLine = {
  itemId: string;
  itemName: string;
  unit: string;
  requested: number;
  approved: number;
  dispatched: number;
  available: number;
  shortage: number;
};

export type SupplySuggestion = {
  id: string;
  kind: "purchase" | "production" | "expiry" | "review";
  priority: "critical" | "attention" | "planning";
  itemId: string;
  title: string;
  reason: string;
  quantity: number;
  unit: string;
  dueDate: string;
  confidence: number;
  evidenceCount: number;
  recipeId?: string;
};

export type PlanningEvent = {
  id: string;
  date: string;
  type:
    | "request"
    | "delivery"
    | "production"
    | "expiry"
    | "suggestion"
    | "manual";
  title: string;
  detail: string;
  tone: "red" | "yellow" | "green" | "blue" | "purple" | "grey";
};

function malaysiaDate(value = new Date()) {
  return value.toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
}

function dateFromKey(value: string) {
  return new Date(`${value}T12:00:00+08:00`);
}

function addDays(value: string, days: number) {
  const date = dateFromKey(value);
  date.setDate(date.getDate() + days);
  return malaysiaDate(date);
}

function daysBetween(from: string, to: string) {
  return Math.ceil(
    (dateFromKey(to).getTime() - dateFromKey(from).getTime()) / 86_400_000,
  );
}

function roundUseful(value: number) {
  if (value < 10) return Math.ceil(value * 10) / 10;
  return Math.ceil(value);
}

function activeRequest(request: SupplyRequest) {
  return !["rejected", "received"].includes(request.status);
}

function historicalRequest(request: SupplyRequest) {
  return !["submitted", "rejected"].includes(request.status);
}

function centralCommitment(request: SupplyRequest) {
  if (request.fulfilmentRoute === "direct-supplier") return 0;
  if (request.status === "approved") return request.quantity;
  if (request.status === "ready-for-dispatch") {
    return request.allocatedQuantity || request.quantity;
  }
  return 0;
}

export function buildDemandLines(state: SupplyState): DemandLine[] {
  return state.items
    .map((item) => {
      const requests = state.requests.filter(
        (request) => request.itemId === item.id && activeRequest(request),
      );
      const requested = requests
        .filter((request) => request.status === "submitted")
        .reduce((sum, request) => sum + request.quantity, 0);
      const approved = requests.reduce(
        (sum, request) => sum + centralCommitment(request),
        0,
      );
      const dispatched = requests
        .filter((request) =>
          ["dispatched", "supplier-dispatched"].includes(request.status),
        )
        .reduce((sum, request) => sum + request.quantity, 0);
      const committed = approved + dispatched;
      return {
        itemId: item.id,
        itemName: item.name,
        unit: item.unit,
        requested,
        approved,
        dispatched,
        available: Math.max(0, item.centralStock - committed),
        shortage: Math.max(0, requested + approved - item.centralStock),
      };
    })
    .filter(
      (line) => line.requested > 0 || line.approved > 0 || line.dispatched > 0,
    );
}

function learnedWeeklyDemand(itemId: string, requests: SupplyRequest[]) {
  const history = requests.filter(
    (request) => request.itemId === itemId && historicalRequest(request),
  );
  if (!history.length) return { demand: 0, count: 0 };

  const dates = history.map((request) => request.createdAt.slice(0, 10)).sort();
  const spanDays = Math.max(
    7,
    daysBetween(dates[0], dates[dates.length - 1]) + 1,
  );
  const total = history.reduce((sum, request) => sum + request.quantity, 0);
  return {
    demand: roundUseful((total / spanDays) * 7),
    count: history.length,
  };
}

export function buildStockInsights(state: SupplyState): StockInsight[] {
  const today = malaysiaDate();
  return state.items.map((item) => {
    const committed = state.requests
      .filter((request) => request.itemId === item.id)
      .reduce((sum, request) => sum + centralCommitment(request), 0);
    const learned = learnedWeeklyDemand(item.id, state.requests);
    const available = item.centralStock - committed;
    const daysToExpiry = item.expiryDate
      ? daysBetween(today, item.expiryDate)
      : null;
    const dailyDemand = learned.demand / 7;
    const projectedDaysRemaining =
      dailyDemand > 0 ? Math.max(0, Math.floor(available / dailyDemand)) : null;
    const par = Math.max(0, item.reorderLevel);

    let signal: StockSignal = "sufficient";
    if (
      daysToExpiry !== null &&
      daysToExpiry >= 0 &&
      daysToExpiry <= 7 &&
      item.centralStock > 0
    ) {
      signal = "expiry";
    }
    if (item.centralStock <= 2 || available < 0) signal = "critical";
    else if (
      item.centralStock <= par ||
      (learned.demand > 0 && available < learned.demand)
    ) {
      signal = "par";
    }

    return {
      item,
      signal,
      committed,
      available,
      learnedWeeklyDemand: learned.demand,
      projectedDaysRemaining,
      daysToExpiry,
    };
  });
}

export function buildSuggestions(state: SupplyState): SupplySuggestion[] {
  const today = malaysiaDate();
  const dismissed = new Set(state.intelligence.dismissedSuggestionIds);
  const insights = buildStockInsights(state);
  const suggestions: SupplySuggestion[] = [];

  for (const insight of insights) {
    const item = insight.item;
    const learning = learnedWeeklyDemand(item.id, state.requests);
    const promotionAhead = state.planningEvents.some(
      (event) =>
        event.category === "promotion" &&
        event.date >= today &&
        event.date <= addDays(today, 7),
    );
    const supplierClosureAhead = state.planningEvents.some(
      (event) =>
        event.category === "supplier-closure" &&
        event.date >= today &&
        event.date <=
          addDays(today, Math.max(1, Number(item.supplierLeadTimeDays || 0))),
    );
    const baseTarget = Math.max(
      item.reorderLevel + Number(item.safetyStock || 0),
      learning.demand,
      2,
    );
    const target = promotionAhead ? roundUseful(baseTarget * 1.2) : baseTarget;
    const shortage = Math.max(0, target - insight.available);
    const recipe = state.recipes.find(
      (candidate) => candidate.outputItemId === item.id,
    );

    if (shortage > 0 && insight.signal !== "expiry") {
      const id = `${recipe ? "production" : "purchase"}:${item.id}:${today}`;
      suggestions.push({
        id,
        kind: recipe ? "production" : "purchase",
        priority: insight.signal === "critical" ? "critical" : "attention",
        itemId: item.id,
        title: recipe
          ? `Prepare ${roundUseful(shortage)} ${item.unit} of ${item.name}`
          : `Replenish ${item.name}`,
        reason:
          learning.count >= 3
            ? `Based on ${learning.count} previous requests, current commitments and the configured safety stock${promotionAhead ? ", with a visible allowance for an upcoming promotion" : ""}.`
            : `Based on current stock, committed outlet demand and the configured par level${promotionAhead ? ", with a visible allowance for an upcoming promotion" : ""}.`,
        quantity: Math.max(
          roundUseful(shortage),
          Number(item.minimumOrderQuantity || 0),
        ),
        unit: item.unit,
        dueDate: supplierClosureAhead
          ? today
          : addDays(today, Math.max(0, Number(item.supplierLeadTimeDays || 0))),
        confidence: Math.min(92, 38 + learning.count * 9),
        evidenceCount: learning.count,
        recipeId: recipe?.id,
      });
    }

    if (insight.signal === "expiry") {
      suggestions.push({
        id: `expiry:${item.id}:${item.expiryDate}`,
        kind: "expiry",
        priority: "attention",
        itemId: item.id,
        title: `Use or transfer ${item.name} first`,
        reason: `${item.centralStock} ${item.unit} may expire in ${Math.max(
          0,
          insight.daysToExpiry || 0,
        )} day(s). Review production, outlet demand or the next purchase.`,
        quantity: item.centralStock,
        unit: item.unit,
        dueDate: item.expiryDate,
        confidence: 100,
        evidenceCount: 1,
      });
    }
  }

  return suggestions
    .filter((suggestion) => !dismissed.has(suggestion.id))
    .sort((a, b) => {
      const rank = { critical: 0, attention: 1, planning: 2 };
      return rank[a.priority] - rank[b.priority];
    });
}

function purchaseEvents(orders: PurchaseOrder[]): PlanningEvent[] {
  return orders
    .filter((order) => order.status === "ordered")
    .map((order) => ({
      id: `po:${order.id}`,
      date: order.expectedDate,
      type: "delivery" as const,
      title: `${order.itemName} delivery`,
      detail: `${order.quantity} ${order.unit} from ${order.supplier}`,
      tone: "green" as const,
    }));
}

function productionEvents(batches: ProductionBatch[]): PlanningEvent[] {
  return batches
    .filter((batch) => batch.status === "planned")
    .map((batch) => ({
      id: `batch:${batch.id}`,
      date: batch.scheduledDate,
      type: "production" as const,
      title: `${batch.recipeName} production`,
      detail: `${batch.multiplier} planned batch(es)`,
      tone: "blue" as const,
    }));
}

export function buildPlanningEvents(state: SupplyState): PlanningEvent[] {
  const requests: PlanningEvent[] = state.requests
    .filter((request) => activeRequest(request))
    .map((request) => ({
      id: `request:${request.id}`,
      date: request.neededBy,
      type: "request",
      title: `${request.outletName}: ${request.itemName}`,
      detail: `${request.quantity} ${request.unit} · ${request.status}`,
      tone: request.status === "submitted" ? "yellow" : "blue",
    }));
  const expiry: PlanningEvent[] = state.items
    .filter((item) => item.expiryDate && item.centralStock > 0)
    .map((item) => ({
      id: `expiry:${item.id}`,
      date: item.expiryDate,
      type: "expiry",
      title: `${item.name} expiry review`,
      detail: `${item.centralStock} ${item.unit} currently held`,
      tone: "purple",
    }));
  const suggestions: PlanningEvent[] = buildSuggestions(state).map(
    (suggestion) => ({
      id: `suggestion:${suggestion.id}`,
      date: suggestion.dueDate,
      type: "suggestion",
      title: suggestion.title,
      detail: `Draft recommendation · ${suggestion.confidence}% confidence`,
      tone: suggestion.priority === "critical" ? "red" : "grey",
    }),
  );
  const manual: PlanningEvent[] = state.planningEvents.map((event) => ({
    id: `manual:${event.id}`,
    date: event.date,
    type: "manual",
    title: event.title,
    detail: `${event.category.replace("-", " ")}${event.note ? ` · ${event.note}` : ""}`,
    tone: event.category === "supplier-closure" ? "red" : "yellow",
  }));

  return [
    ...requests,
    ...purchaseEvents(state.purchaseOrders),
    ...productionEvents(state.productionBatches),
    ...expiry,
    ...suggestions,
    ...manual,
  ].sort((a, b) => a.date.localeCompare(b.date));
}
