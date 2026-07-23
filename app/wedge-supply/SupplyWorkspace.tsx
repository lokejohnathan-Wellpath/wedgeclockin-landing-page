"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  activity,
  emptySupplyState,
  hasCompletedSetup,
  loadSupplyState,
  makeId,
  saveSupplyState,
  SUPPLY_STORAGE_KEY,
} from "./lib/supplyStore";
import type {
  PurchaseOrder,
  SupplyItem,
  SupplyRecipe,
  SupplyRequest,
  SupplyRole,
  SupplyState,
} from "./lib/types";

type CentralView =
  | "overview"
  | "requests"
  | "inventory"
  | "purchasing"
  | "production";
type OutletView = "overview" | "request" | "receiving" | "stock";
type View = CentralView | OutletView;
type ItemFormState = {
  name: string;
  sku: string;
  category: string;
  unit: string;
  supplier: string;
  openingStock: string;
  reorderLevel: string;
  expiryDate: string;
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#0a1013] px-4 py-3 text-base text-white outline-none focus:border-[#d6ad62]";
const labelClass = "text-sm font-medium text-white/58";
const panelClass =
  "rounded-[24px] border border-white/9 bg-[#151d21] shadow-[0_18px_60px_rgba(0,0,0,.18)]";

function todayKey() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
  });
}

function futureDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
  });
}

function formatDate(value: string) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(`${value}T12:00:00+08:00`));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (["approved", "received", "completed"].includes(status)) {
    return "border-emerald-400/25 bg-emerald-500/10 text-emerald-200";
  }
  if (["rejected", "cancelled"].includes(status)) {
    return "border-red-400/25 bg-red-500/10 text-red-200";
  }
  if (status === "dispatched") {
    return "border-sky-400/25 bg-sky-500/10 text-sky-200";
  }
  return "border-amber-400/25 bg-amber-500/10 text-amber-100";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusClass(
        status,
      )}`}
    >
      {status}
    </span>
  );
}

function EmptyState({
  title,
  text,
  action,
  onAction,
}: {
  title: string;
  text: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/12 px-6 py-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/5 text-xl text-[#d6ad62]">
        +
      </div>
      <h3 className="mt-4 font-bold text-[#f3e6cc]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/42">
        {text}
      </p>
      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-xl bg-[#d6ad62] px-5 py-3 font-bold text-[#0a1013]"
        >
          {action}
        </button>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  note,
  tone = "gold",
}: {
  label: string;
  value: string | number;
  note: string;
  tone?: "gold" | "green" | "blue" | "red";
}) {
  const tones = {
    gold: "text-[#e5bd72]",
    green: "text-emerald-300",
    blue: "text-sky-300",
    red: "text-red-300",
  };
  return (
    <div className={`${panelClass} p-5`}>
      <p className="text-sm text-white/45">{label}</p>
      <p className={`mt-3 text-3xl font-black ${tones[tone]}`}>{value}</p>
      <p className="mt-2 text-xs leading-5 text-white/32">{note}</p>
    </div>
  );
}

export default function SupplyWorkspace({ role }: { role: SupplyRole }) {
  const router = useRouter();
  const [state, setState] = useState<SupplyState>(emptySupplyState);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("overview");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [itemForm, setItemForm] = useState<ItemFormState>({
    name: "",
    sku: "",
    category: "",
    unit: "",
    supplier: "",
    openingStock: "",
    reorderLevel: "",
    expiryDate: "",
  });
  const [requestForm, setRequestForm] = useState({
    itemId: "",
    quantity: "",
    neededBy: futureDate(1),
    note: "",
  });
  const [poForm, setPoForm] = useState({
    itemId: "",
    supplier: "",
    quantity: "",
    expectedDate: futureDate(3),
  });
  const [stockForm, setStockForm] = useState({
    itemId: "",
    quantity: "",
    expiryDate: "",
  });
  const [wastageForm, setWastageForm] = useState({
    itemId: "",
    quantity: "",
    reason: "",
  });
  const [recipeForm, setRecipeForm] = useState({
    name: "",
    outputItemId: "",
    outputQuantity: "",
    ingredientItemId: "",
    ingredientQuantity: "",
  });
  const [batchForm, setBatchForm] = useState({
    recipeId: "",
    multiplier: "1",
    scheduledDate: todayKey(),
  });

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active) return;
      const stored = loadSupplyState();
      if (!hasCompletedSetup(stored)) {
        router.replace("/wedge-supply");
        return;
      }
      setState(stored);
      setReady(true);
    });

    function sync(event: StorageEvent) {
      if (event.key === SUPPLY_STORAGE_KEY) setState(loadSupplyState());
    }
    window.addEventListener("storage", sync);
    return () => {
      active = false;
      window.removeEventListener("storage", sync);
    };
  }, [router]);

  function commit(
    transform: (current: SupplyState) => SupplyState,
    successMessage: string,
  ) {
    setState((current) => {
      const next = transform(current);
      saveSupplyState(next);
      return next;
    });
    setError("");
    setMessage(successMessage);
    window.setTimeout(() => setMessage(""), 3500);
  }

  const pendingRequests = state.requests.filter(
    (request) => request.status === "submitted",
  );
  const approvedRequests = state.requests.filter(
    (request) => request.status === "approved",
  );
  const dispatchedRequests = state.requests.filter(
    (request) => request.status === "dispatched",
  );
  const lowStock = state.items.filter(
    (item) => item.centralStock <= item.reorderLevel,
  );
  const openPurchaseOrders = state.purchaseOrders.filter(
    (order) => order.status === "ordered",
  );
  const plannedBatches = state.productionBatches.filter(
    (batch) => batch.status === "planned",
  );

  const nextAction = useMemo(() => {
    if (!state.items.length) {
      return role === "central"
        ? {
            title: "Add your first inventory item",
            text: "Create the item once. Both central and outlet users will then use the same name and unit.",
            action: "Open Inventory",
            view: "inventory" as View,
          }
        : {
            title: "Waiting for central item setup",
            text: "The central user must add items before the outlet can request supplies.",
            action: "Return to role selection",
            view: null,
          };
    }
    if (role === "central" && pendingRequests.length) {
      return {
        title: `${pendingRequests.length} request${
          pendingRequests.length === 1 ? "" : "s"
        } need a decision`,
        text: "Review requested quantities before purchasing or dispatching stock.",
        action: "Review Requests",
        view: "requests" as View,
      };
    }
    if (role === "central" && approvedRequests.length) {
      return {
        title: `${approvedRequests.length} approved request${
          approvedRequests.length === 1 ? "" : "s"
        } ready for action`,
        text: "Dispatch available stock or purchase the shortage first.",
        action: "Prepare Dispatch",
        view: "requests" as View,
      };
    }
    if (role === "outlet" && dispatchedRequests.length) {
      return {
        title: `${dispatchedRequests.length} delivery${
          dispatchedRequests.length === 1 ? "" : "ies"
        } waiting for confirmation`,
        text: "Check the actual quantities before accepting them into outlet stock.",
        action: "Confirm Receiving",
        view: "receiving" as View,
      };
    }
    return {
      title: role === "central" ? "Operations are under control" : "Ready when you are",
      text:
        role === "central"
          ? "No urgent request is waiting. Review low stock or plan the next production batch."
          : "Create a supply request whenever this outlet needs replenishment.",
      action: role === "central" ? "View Inventory" : "New Supply Request",
      view: (role === "central" ? "inventory" : "request") as View,
    };
  }, [
    approvedRequests.length,
    dispatchedRequests.length,
    pendingRequests.length,
    role,
    state.items.length,
  ]);

  function addItem(event: React.FormEvent) {
    event.preventDefault();
    const openingStock = Number(itemForm.openingStock);
    const reorderLevel = Number(itemForm.reorderLevel);
    if (
      !itemForm.name.trim() ||
      !itemForm.unit.trim() ||
      !Number.isFinite(openingStock) ||
      openingStock < 0 ||
      !Number.isFinite(reorderLevel) ||
      reorderLevel < 0
    ) {
      setError("Enter an item name, unit and valid stock quantities.");
      return;
    }
    const duplicate = state.items.some(
      (item) =>
        item.name.trim().toLowerCase() === itemForm.name.trim().toLowerCase() ||
        (itemForm.sku.trim() &&
          item.sku.trim().toLowerCase() === itemForm.sku.trim().toLowerCase()),
    );
    if (duplicate) {
      setError("That item name or SKU already exists.");
      return;
    }
    const item: SupplyItem = {
      id: makeId("item"),
      name: itemForm.name.trim(),
      sku: itemForm.sku.trim(),
      category: itemForm.category.trim(),
      unit: itemForm.unit.trim(),
      supplier: itemForm.supplier.trim(),
      centralStock: openingStock,
      outletStock: 0,
      reorderLevel,
      expiryDate: itemForm.expiryDate,
    };
    commit(
      (current) => ({
        ...current,
        items: [...current.items, item],
        activities: [
          activity(`${item.name} added to the shared item list.`),
          ...current.activities,
        ],
      }),
      `${item.name} added successfully.`,
    );
    setItemForm({
      name: "",
      sku: "",
      category: "",
      unit: "",
      supplier: "",
      openingStock: "",
      reorderLevel: "",
      expiryDate: "",
    });
  }

  function createRequest(event: React.FormEvent) {
    event.preventDefault();
    const item = state.items.find((candidate) => candidate.id === requestForm.itemId);
    const quantity = Number(requestForm.quantity);
    if (!item || !Number.isFinite(quantity) || quantity <= 0 || !requestForm.neededBy) {
      setError("Choose an item, quantity and required date.");
      return;
    }
    const request: SupplyRequest = {
      id: makeId("request"),
      itemId: item.id,
      itemName: item.name,
      outletName: state.config.outletName,
      quantity,
      unit: item.unit,
      neededBy: requestForm.neededBy,
      note: requestForm.note.trim(),
      status: "submitted",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    commit(
      (current) => ({
        ...current,
        requests: [request, ...current.requests],
        activities: [
          activity(
            `${state.config.outletName} requested ${quantity} ${item.unit} of ${item.name}.`,
          ),
          ...current.activities,
        ],
      }),
      "Supply request submitted to central operations.",
    );
    setRequestForm({
      itemId: "",
      quantity: "",
      neededBy: futureDate(1),
      note: "",
    });
    setView("overview");
  }

  function decideRequest(id: string, status: "approved" | "rejected") {
    const request = state.requests.find((candidate) => candidate.id === id);
    if (!request) return;
    commit(
      (current) => ({
        ...current,
        requests: current.requests.map((candidate) =>
          candidate.id === id
            ? { ...candidate, status, updatedAt: new Date().toISOString() }
            : candidate,
        ),
        activities: [
          activity(`${request.itemName} request ${status}.`),
          ...current.activities,
        ],
      }),
      `Request ${status}.`,
    );
  }

  function dispatchRequest(request: SupplyRequest) {
    const item = state.items.find((candidate) => candidate.id === request.itemId);
    if (!item) {
      setError("The requested item no longer exists.");
      return;
    }
    if (item.centralStock < request.quantity) {
      setError(
        `Not enough central stock. Available: ${item.centralStock} ${item.unit}. Create a purchase order for the shortage.`,
      );
      return;
    }
    commit(
      (current) => ({
        ...current,
        items: current.items.map((candidate) =>
          candidate.id === item.id
            ? {
                ...candidate,
                centralStock: candidate.centralStock - request.quantity,
              }
            : candidate,
        ),
        requests: current.requests.map((candidate) =>
          candidate.id === request.id
            ? {
                ...candidate,
                status: "dispatched",
                updatedAt: new Date().toISOString(),
              }
            : candidate,
        ),
        activities: [
          activity(
            `${request.quantity} ${request.unit} of ${request.itemName} dispatched to ${request.outletName}.`,
          ),
          ...current.activities,
        ],
      }),
      "Dispatch recorded. The outlet must confirm the actual quantity received.",
    );
  }

  function confirmReceived(request: SupplyRequest) {
    if (!window.confirm("Confirm that the full dispatched quantity was received?")) {
      return;
    }
    commit(
      (current) => ({
        ...current,
        items: current.items.map((item) =>
          item.id === request.itemId
            ? { ...item, outletStock: item.outletStock + request.quantity }
            : item,
        ),
        requests: current.requests.map((candidate) =>
          candidate.id === request.id
            ? {
                ...candidate,
                status: "received",
                updatedAt: new Date().toISOString(),
              }
            : candidate,
        ),
        activities: [
          activity(
            `${request.outletName} received ${request.quantity} ${request.unit} of ${request.itemName}.`,
          ),
          ...current.activities,
        ],
      }),
      "Delivery received and outlet stock updated.",
    );
  }

  function createPurchaseOrder(event: React.FormEvent) {
    event.preventDefault();
    const item = state.items.find((candidate) => candidate.id === poForm.itemId);
    const quantity = Number(poForm.quantity);
    if (
      !item ||
      !poForm.supplier.trim() ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !poForm.expectedDate
    ) {
      setError("Choose an item and enter the supplier, quantity and expected date.");
      return;
    }
    const order: PurchaseOrder = {
      id: makeId("po"),
      itemId: item.id,
      itemName: item.name,
      supplier: poForm.supplier.trim(),
      quantity,
      unit: item.unit,
      expectedDate: poForm.expectedDate,
      status: "ordered",
      createdAt: new Date().toISOString(),
    };
    commit(
      (current) => ({
        ...current,
        purchaseOrders: [order, ...current.purchaseOrders],
        activities: [
          activity(
            `Purchase order created for ${quantity} ${item.unit} of ${item.name}.`,
          ),
          ...current.activities,
        ],
      }),
      "Purchase order recorded.",
    );
    setPoForm({
      itemId: "",
      supplier: "",
      quantity: "",
      expectedDate: futureDate(3),
    });
  }

  function receivePurchaseOrder(order: PurchaseOrder) {
    if (!window.confirm("Confirm that the full purchase order quantity was received?")) {
      return;
    }
    commit(
      (current) => ({
        ...current,
        items: current.items.map((item) =>
          item.id === order.itemId
            ? { ...item, centralStock: item.centralStock + order.quantity }
            : item,
        ),
        purchaseOrders: current.purchaseOrders.map((candidate) =>
          candidate.id === order.id
            ? { ...candidate, status: "received" }
            : candidate,
        ),
        activities: [
          activity(
            `${order.quantity} ${order.unit} of ${order.itemName} received from ${order.supplier}.`,
          ),
          ...current.activities,
        ],
      }),
      "Goods received and central stock updated.",
    );
  }

  function addStock(event: React.FormEvent) {
    event.preventDefault();
    const quantity = Number(stockForm.quantity);
    const item = state.items.find((candidate) => candidate.id === stockForm.itemId);
    if (!item || !Number.isFinite(quantity) || quantity <= 0) {
      setError("Choose an item and enter a quantity greater than zero.");
      return;
    }
    commit(
      (current) => ({
        ...current,
        items: current.items.map((candidate) =>
          candidate.id === item.id
            ? {
                ...candidate,
                centralStock: candidate.centralStock + quantity,
                expiryDate: stockForm.expiryDate || candidate.expiryDate,
              }
            : candidate,
        ),
        activities: [
          activity(
            `${quantity} ${item.unit} of ${item.name} added to central stock.`,
          ),
          ...current.activities,
        ],
      }),
      "Stock receipt recorded.",
    );
    setStockForm({ itemId: "", quantity: "", expiryDate: "" });
  }

  function recordWastage(event: React.FormEvent) {
    event.preventDefault();
    const quantity = Number(wastageForm.quantity);
    const item = state.items.find((candidate) => candidate.id === wastageForm.itemId);
    if (
      !item ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !wastageForm.reason.trim()
    ) {
      setError("Choose an item, enter a valid quantity and provide a reason.");
      return;
    }
    if (quantity > item.outletStock) {
      setError(`Only ${item.outletStock} ${item.unit} is available at the outlet.`);
      return;
    }
    commit(
      (current) => ({
        ...current,
        items: current.items.map((candidate) =>
          candidate.id === item.id
            ? { ...candidate, outletStock: candidate.outletStock - quantity }
            : candidate,
        ),
        activities: [
          activity(
            `${quantity} ${item.unit} of ${item.name} adjusted at outlet: ${wastageForm.reason.trim()}.`,
          ),
          ...current.activities,
        ],
      }),
      "Outlet stock adjustment recorded with an audit reason.",
    );
    setWastageForm({ itemId: "", quantity: "", reason: "" });
  }

  function createRecipe(event: React.FormEvent) {
    event.preventDefault();
    const outputItem = state.items.find(
      (candidate) => candidate.id === recipeForm.outputItemId,
    );
    const ingredient = state.items.find(
      (candidate) => candidate.id === recipeForm.ingredientItemId,
    );
    const outputQuantity = Number(recipeForm.outputQuantity);
    const ingredientQuantity = Number(recipeForm.ingredientQuantity);
    if (
      !recipeForm.name.trim() ||
      !outputItem ||
      !ingredient ||
      outputItem.id === ingredient.id ||
      !Number.isFinite(outputQuantity) ||
      outputQuantity <= 0 ||
      !Number.isFinite(ingredientQuantity) ||
      ingredientQuantity <= 0
    ) {
      setError(
        "Enter a recipe name, different input/output items and valid quantities.",
      );
      return;
    }
    const recipe: SupplyRecipe = {
      id: makeId("recipe"),
      name: recipeForm.name.trim(),
      outputItemId: outputItem.id,
      outputItemName: outputItem.name,
      outputQuantity,
      outputUnit: outputItem.unit,
      ingredients: [
        {
          itemId: ingredient.id,
          itemName: ingredient.name,
          quantity: ingredientQuantity,
          unit: ingredient.unit,
        },
      ],
    };
    commit(
      (current) => ({
        ...current,
        recipes: [...current.recipes, recipe],
        activities: [
          activity(`${recipe.name} production recipe created.`),
          ...current.activities,
        ],
      }),
      "Recipe created. More ingredients can be added in the next production release.",
    );
    setRecipeForm({
      name: "",
      outputItemId: "",
      outputQuantity: "",
      ingredientItemId: "",
      ingredientQuantity: "",
    });
  }

  function planBatch(event: React.FormEvent) {
    event.preventDefault();
    const recipe = state.recipes.find(
      (candidate) => candidate.id === batchForm.recipeId,
    );
    const multiplier = Number(batchForm.multiplier);
    if (!recipe || !Number.isFinite(multiplier) || multiplier <= 0) {
      setError("Choose a recipe and enter the number of production batches.");
      return;
    }
    const batch = {
      id: makeId("batch"),
      recipeId: recipe.id,
      recipeName: recipe.name,
      multiplier,
      scheduledDate: batchForm.scheduledDate || todayKey(),
      status: "planned" as const,
      createdAt: new Date().toISOString(),
    };
    commit(
      (current) => ({
        ...current,
        productionBatches: [batch, ...current.productionBatches],
        activities: [
          activity(`${multiplier} batch(es) of ${recipe.name} planned.`),
          ...current.activities,
        ],
      }),
      "Production batch planned.",
    );
    setBatchForm({ recipeId: "", multiplier: "1", scheduledDate: todayKey() });
  }

  function completeBatch(batchId: string) {
    const batch = state.productionBatches.find(
      (candidate) => candidate.id === batchId,
    );
    const recipe = state.recipes.find(
      (candidate) => candidate.id === batch?.recipeId,
    );
    if (!batch || !recipe) return;
    const shortages = recipe.ingredients
      .map((ingredient) => {
        const item = state.items.find(
          (candidate) => candidate.id === ingredient.itemId,
        );
        const required = ingredient.quantity * batch.multiplier;
        return !item || item.centralStock < required
          ? `${ingredient.itemName}: need ${required} ${ingredient.unit}`
          : "";
      })
      .filter(Boolean);
    if (shortages.length) {
      setError(`Cannot complete production. Insufficient stock — ${shortages.join(", ")}.`);
      return;
    }
    if (!window.confirm("Complete this batch and post all ingredient movements?")) {
      return;
    }
    commit(
      (current) => ({
        ...current,
        items: current.items.map((item) => {
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
            return {
              ...item,
              centralStock:
                item.centralStock + recipe.outputQuantity * batch.multiplier,
            };
          }
          return item;
        }),
        productionBatches: current.productionBatches.map((candidate) =>
          candidate.id === batch.id
            ? { ...candidate, status: "completed" }
            : candidate,
        ),
        activities: [
          activity(`${batch.multiplier} batch(es) of ${recipe.name} completed.`),
          ...current.activities,
        ],
      }),
      "Production completed and stock movements posted.",
    );
  }

  if (!ready) {
    return (
      <main className="min-h-screen bg-[#0a0f12] p-8 text-white">
        Preparing your operation…
      </main>
    );
  }

  const centralNav: { id: CentralView; label: string; symbol: string }[] = [
    { id: "overview", label: "Overview", symbol: "⌂" },
    { id: "requests", label: "Outlet Requests", symbol: "✓" },
    { id: "inventory", label: "Inventory", symbol: "□" },
    { id: "purchasing", label: "Purchasing", symbol: "↗" },
    { id: "production", label: "Production", symbol: "⚙" },
  ];
  const outletNav: { id: OutletView; label: string; symbol: string }[] = [
    { id: "overview", label: "Overview", symbol: "⌂" },
    { id: "request", label: "New Request", symbol: "+" },
    { id: "receiving", label: "Receiving", symbol: "↓" },
    { id: "stock", label: "Outlet Stock", symbol: "□" },
  ];
  const navItems = role === "central" ? centralNav : outletNav;
  const roleName =
    role === "central" ? state.config.centralLocation : state.config.outletName;

  return (
    <main className="min-h-screen bg-[#0a0f12] text-[#f5efe3]">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0a0f12]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <a href="/wedge-supply" className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#d6ad62] font-black text-[#0a0f12]">
              W
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold text-[#f2deb8]">
                Wedge-Supply ERP
              </p>
              <p className="truncate text-[10px] tracking-[.14em] text-white/35">
                {state.config.businessName}
              </p>
            </div>
          </a>
          <div className="flex items-center gap-2">
            <a
              href={role === "central" ? "/wedge-supply/outlet" : "/wedge-supply/central"}
              className="hidden rounded-full border border-white/12 px-4 py-2 text-sm text-white/65 sm:block"
            >
              Switch to {role === "central" ? "Outlet" : "Central"}
            </a>
            <a
              href="/wedge-supply"
              className="rounded-full bg-[#d6ad62] px-4 py-2 text-sm font-bold text-[#0a0f12]"
            >
              Change user
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[250px_1fr]">
        <aside className="border-b border-white/8 bg-[#0c1215] p-4 lg:min-h-[calc(100vh-65px)] lg:border-b-0 lg:border-r">
          <div className="mb-4 rounded-2xl border border-white/8 bg-white/[.035] p-4">
            <p className="text-[10px] font-bold tracking-[.18em] text-[#d6ad62]">
              {role === "central" ? "CENTRAL USER" : "OUTLET USER"}
            </p>
            <p className="mt-2 truncate font-bold">{roleName}</p>
            <p className="mt-1 text-xs text-white/38">
              Malaysia · {formatDate(todayKey())}
            </p>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setView(item.id);
                  setError("");
                  setMessage("");
                }}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition lg:w-full ${
                  view === item.id
                    ? "bg-[#d6ad62] text-[#0a0f12]"
                    : "text-white/55 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-lg">{item.symbol}</span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-6 hidden rounded-2xl border border-[#4b7e74]/25 bg-[#4b7e74]/8 p-4 lg:block">
            <p className="text-xs font-bold text-[#a8d4cb]">SAFE WORKFLOW</p>
            <p className="mt-2 text-xs leading-5 text-white/38">
              Every approval, stock receipt, dispatch and adjustment creates an
              activity record.
            </p>
          </div>
        </aside>

        <section className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[.22em] text-[#d6ad62]">
                {role === "central" ? "CENTRAL OPERATIONS" : "OUTLET OPERATIONS"}
              </p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                {view === "overview"
                  ? "Today at a glance"
                  : navItems.find((item) => item.id === view)?.label}
              </h1>
            </div>
            <p className="rounded-full border border-white/8 bg-white/[.03] px-4 py-2 text-xs text-white/38">
              Saved privately on this device
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-red-400/30 bg-red-950/25 px-5 py-4 text-sm text-red-100">
              <p>{error}</p>
              <button type="button" onClick={() => setError("")} aria-label="Dismiss">
                ×
              </button>
            </div>
          )}
          {message && (
            <div className="mb-5 rounded-2xl border border-emerald-400/25 bg-emerald-950/20 px-5 py-4 text-sm text-emerald-100">
              {message}
            </div>
          )}

          {view === "overview" && (
            <Overview
              role={role}
              state={state}
              pendingRequests={pendingRequests.length}
              dispatchedRequests={dispatchedRequests.length}
              lowStock={lowStock.length}
              openPurchaseOrders={openPurchaseOrders.length}
              plannedBatches={plannedBatches.length}
              nextAction={nextAction}
              setView={setView}
            />
          )}

          {role === "central" && view === "requests" && (
            <CentralRequests
              requests={state.requests}
              items={state.items}
              decideRequest={decideRequest}
              dispatchRequest={dispatchRequest}
              openPurchase={(request) => {
                const item = state.items.find(
                  (candidate) => candidate.id === request.itemId,
                );
                const shortage = Math.max(
                  0,
                  request.quantity - Number(item?.centralStock || 0),
                );
                setPoForm({
                  itemId: request.itemId,
                  supplier: item?.supplier || "",
                  quantity: String(shortage || request.quantity),
                  expectedDate: request.neededBy,
                });
                setView("purchasing");
              }}
            />
          )}

          {role === "central" && view === "inventory" && (
            <CentralInventory
              items={state.items}
              itemForm={itemForm}
              setItemForm={setItemForm}
              addItem={addItem}
              stockForm={stockForm}
              setStockForm={setStockForm}
              addStock={addStock}
            />
          )}

          {role === "central" && view === "purchasing" && (
            <Purchasing
              items={state.items}
              orders={state.purchaseOrders}
              poForm={poForm}
              setPoForm={setPoForm}
              createPurchaseOrder={createPurchaseOrder}
              receivePurchaseOrder={receivePurchaseOrder}
            />
          )}

          {role === "central" && view === "production" && (
            <Production
              items={state.items}
              recipes={state.recipes}
              batches={state.productionBatches}
              recipeForm={recipeForm}
              setRecipeForm={setRecipeForm}
              batchForm={batchForm}
              setBatchForm={setBatchForm}
              createRecipe={createRecipe}
              planBatch={planBatch}
              completeBatch={completeBatch}
            />
          )}

          {role === "outlet" && view === "request" && (
            <OutletRequest
              items={state.items}
              outletName={state.config.outletName}
              requestForm={requestForm}
              setRequestForm={setRequestForm}
              createRequest={createRequest}
            />
          )}

          {role === "outlet" && view === "receiving" && (
            <OutletReceiving
              requests={state.requests}
              confirmReceived={confirmReceived}
            />
          )}

          {role === "outlet" && view === "stock" && (
            <OutletStock
              items={state.items}
              wastageForm={wastageForm}
              setWastageForm={setWastageForm}
              recordWastage={recordWastage}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function Overview({
  role,
  state,
  pendingRequests,
  dispatchedRequests,
  lowStock,
  openPurchaseOrders,
  plannedBatches,
  nextAction,
  setView,
}: {
  role: SupplyRole;
  state: SupplyState;
  pendingRequests: number;
  dispatchedRequests: number;
  lowStock: number;
  openPurchaseOrders: number;
  plannedBatches: number;
  nextAction: { title: string; text: string; action: string; view: View | null };
  setView: (view: View) => void;
}) {
  const cards =
    role === "central"
      ? [
          ["Requests to review", pendingRequests, "Awaiting a central decision", "gold"],
          ["Low-stock items", lowStock, "At or below reorder level", "red"],
          ["Open purchase orders", openPurchaseOrders, "Ordered, not yet received", "blue"],
          ["Planned production", plannedBatches, "Batches waiting to complete", "green"],
        ]
      : [
          [
            "Outlet stock items",
            state.items.filter((item) => item.outletStock > 0).length,
            "Items currently held here",
            "green",
          ],
          [
            "Requests in progress",
            state.requests.filter((request) =>
              ["submitted", "approved"].includes(request.status),
            ).length,
            "Submitted or approved",
            "gold",
          ],
          ["Deliveries to receive", dispatchedRequests, "Check before confirming", "blue"],
          [
            "Outlet low stock",
            state.items.filter((item) => item.outletStock <= item.reorderLevel).length,
            "May require replenishment",
            "red",
          ],
        ];
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, note, tone]) => (
          <Kpi
            key={String(label)}
            label={String(label)}
            value={value as number}
            note={String(note)}
            tone={tone as "gold" | "green" | "blue" | "red"}
          />
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <div className={`${panelClass} p-6`}>
          <p className="text-xs font-bold tracking-[.2em] text-[#d6ad62]">
            RECOMMENDED NEXT STEP
          </p>
          <h2 className="mt-3 text-2xl font-black">{nextAction.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/48">
            {nextAction.text}
          </p>
          <button
            type="button"
            onClick={() =>
              nextAction.view ? setView(nextAction.view) : (window.location.href = "/wedge-supply")
            }
            className="mt-6 rounded-xl bg-[#d6ad62] px-5 py-3 font-black text-[#0a1013]"
          >
            {nextAction.action}
          </button>
        </div>

        <div className={`${panelClass} p-6`}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Recent activity</h2>
            <span className="text-xs text-white/30">Audit trail</span>
          </div>
          <div className="mt-4 space-y-4">
            {state.activities.length ? (
              state.activities.slice(0, 4).map((entry) => (
                <div key={entry.id} className="border-l-2 border-[#d6ad62]/50 pl-3">
                  <p className="text-sm leading-5 text-white/62">{entry.message}</p>
                  <p className="mt-1 text-[11px] text-white/28">
                    {formatTime(entry.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-white/35">
                Activities will appear as users work.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={`${panelClass} mt-5 overflow-hidden`}>
        <div className="border-b border-white/8 px-6 py-5">
          <p className="text-xs font-bold tracking-[.2em] text-[#d6ad62]">
            SHARED OPERATING FLOW
          </p>
        </div>
        <div className="grid sm:grid-cols-5">
          {[
            ["1", "Outlet request"],
            ["2", "Central approval"],
            ["3", "Purchase or prepare"],
            ["4", "Dispatch"],
            ["5", "Outlet receives"],
          ].map(([number, label], index) => (
            <div
              key={label}
              className={`relative p-5 text-center ${
                index ? "border-t border-white/7 sm:border-l sm:border-t-0" : ""
              }`}
            >
              <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-[#4b7e74]/18 text-sm font-black text-[#a7d2c8]">
                {number}
              </span>
              <p className="mt-3 text-sm font-bold">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function CentralRequests({
  requests,
  items,
  decideRequest,
  dispatchRequest,
  openPurchase,
}: {
  requests: SupplyRequest[];
  items: SupplyItem[];
  decideRequest: (id: string, status: "approved" | "rejected") => void;
  dispatchRequest: (request: SupplyRequest) => void;
  openPurchase: (request: SupplyRequest) => void;
}) {
  if (!requests.length) {
    return (
      <div className={`${panelClass} p-6`}>
        <EmptyState
          title="No outlet requests yet"
          text="When the outlet submits a supply request, it will appear here for review."
        />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const item = items.find((candidate) => candidate.id === request.itemId);
        const enough = Number(item?.centralStock || 0) >= request.quantity;
        return (
          <article key={request.id} className={`${panelClass} p-5 sm:p-6`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-black">{request.itemName}</h2>
                  <StatusBadge status={request.status} />
                </div>
                <p className="mt-2 text-sm text-white/42">
                  {request.outletName} · needed {formatDate(request.neededBy)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-[#e5bd72]">
                  {request.quantity} {request.unit}
                </p>
                <p className={`mt-1 text-xs ${enough ? "text-emerald-300" : "text-red-300"}`}>
                  Central stock: {item?.centralStock ?? 0} {request.unit}
                </p>
              </div>
            </div>
            {request.note && (
              <p className="mt-4 rounded-xl bg-black/20 px-4 py-3 text-sm text-white/55">
                Outlet note: {request.note}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              {request.status === "submitted" && (
                <>
                  <button
                    type="button"
                    onClick={() => decideRequest(request.id, "approved")}
                    className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white"
                  >
                    Approve request
                  </button>
                  <button
                    type="button"
                    onClick={() => decideRequest(request.id, "rejected")}
                    className="rounded-xl border border-red-400/30 px-5 py-3 font-bold text-red-200"
                  >
                    Reject
                  </button>
                </>
              )}
              {request.status === "approved" && (
                <>
                  <button
                    type="button"
                    onClick={() => dispatchRequest(request)}
                    disabled={!enough}
                    className="rounded-xl bg-[#d6ad62] px-5 py-3 font-black text-[#0a1013] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Dispatch available stock
                  </button>
                  <button
                    type="button"
                    onClick={() => openPurchase(request)}
                    className="rounded-xl border border-white/12 px-5 py-3 font-bold"
                  >
                    Create purchase order
                  </button>
                </>
              )}
              {request.status === "dispatched" && (
                <p className="text-sm text-sky-200">
                  Waiting for outlet receiving confirmation.
                </p>
              )}
              {request.status === "received" && (
                <p className="text-sm text-emerald-200">
                  Delivery completed and stock posted.
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function CentralInventory({
  items,
  itemForm,
  setItemForm,
  addItem,
  stockForm,
  setStockForm,
  addStock,
}: {
  items: SupplyItem[];
  itemForm: ItemFormState;
  setItemForm: React.Dispatch<React.SetStateAction<typeof itemForm>>;
  addItem: (event: React.FormEvent) => void;
  stockForm: { itemId: string; quantity: string; expiryDate: string };
  setStockForm: React.Dispatch<React.SetStateAction<typeof stockForm>>;
  addStock: (event: React.FormEvent) => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <div className={`${panelClass} overflow-hidden`}>
        <div className="border-b border-white/8 p-5">
          <h2 className="font-black">Shared item and stock list</h2>
          <p className="mt-1 text-sm text-white/40">
            Outlet users request only items created here.
          </p>
        </div>
        {items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-black/15 text-white/38">
                <tr>
                  <th className="px-5 py-4">Item</th>
                  <th className="px-5 py-4">Unit</th>
                  <th className="px-5 py-4">Central</th>
                  <th className="px-5 py-4">Outlet</th>
                  <th className="px-5 py-4">Reorder</th>
                  <th className="px-5 py-4">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-white/6">
                    <td className="px-5 py-4">
                      <p className="font-bold text-[#f3e6cc]">{item.name}</p>
                      <p className="mt-1 text-xs text-white/30">
                        {item.sku || "No SKU"} · {item.category || "Uncategorised"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-white/55">{item.unit}</td>
                    <td className="px-5 py-4 font-bold">{item.centralStock}</td>
                    <td className="px-5 py-4 text-white/55">{item.outletStock}</td>
                    <td className="px-5 py-4">
                      <span
                        className={
                          item.centralStock <= item.reorderLevel
                            ? "font-bold text-red-300"
                            : "text-white/50"
                        }
                      >
                        {item.reorderLevel}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-white/45">
                      {item.expiryDate ? formatDate(item.expiryDate) : "Not tracked"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              title="No items have been created"
              text="Use the form beside this list. Start with ingredients, packaging or finished products."
            />
          </div>
        )}
      </div>

      <div className="space-y-5">
        <form onSubmit={addItem} className={`${panelClass} p-5`}>
          <p className="text-xs font-bold tracking-[.18em] text-[#d6ad62]">
            ADD ITEM
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {([
              ["name", "Item name", "Chicken thigh"],
              ["sku", "SKU (optional)", "RAW-001"],
              ["category", "Category", "Raw ingredient"],
              ["unit", "Unit", "kg, carton, tray"],
              ["supplier", "Preferred supplier", "Supplier name"],
              ["openingStock", "Opening central stock", "0"],
              ["reorderLevel", "Reorder alert level", "10"],
            ] as [keyof ItemFormState, string, string][]).map(
              ([field, label, placeholder]) => (
              <label key={field} className={labelClass}>
                {label}
                <input
                  className={`${inputClass} mt-2`}
                  value={itemForm[field]}
                  onChange={(event) =>
                    setItemForm((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                  placeholder={placeholder}
                  inputMode={
                    ["openingStock", "reorderLevel"].includes(field)
                      ? "decimal"
                      : undefined
                  }
                />
              </label>
              ),
            )}
            <label className={`${labelClass} sm:col-span-2 xl:col-span-1 2xl:col-span-2`}>
              Nearest expiry (optional)
              <input
                type="date"
                className={`${inputClass} mt-2`}
                value={itemForm.expiryDate}
                onChange={(event) =>
                  setItemForm((current) => ({
                    ...current,
                    expiryDate: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <button
            type="submit"
            className="mt-5 w-full rounded-xl bg-[#d6ad62] px-5 py-3.5 font-black text-[#0a1013]"
          >
            Add item to shared list
          </button>
        </form>

        {items.length > 0 && (
          <form onSubmit={addStock} className={`${panelClass} p-5`}>
            <p className="text-xs font-bold tracking-[.18em] text-[#8fc2b8]">
              QUICK STOCK RECEIPT
            </p>
            <div className="mt-4 grid gap-3">
              <select
                className={inputClass}
                value={stockForm.itemId}
                onChange={(event) =>
                  setStockForm((current) => ({
                    ...current,
                    itemId: event.target.value,
                  }))
                }
              >
                <option value="">Choose item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.unit})
                  </option>
                ))}
              </select>
              <input
                className={inputClass}
                value={stockForm.quantity}
                onChange={(event) =>
                  setStockForm((current) => ({
                    ...current,
                    quantity: event.target.value,
                  }))
                }
                placeholder="Quantity received"
                inputMode="decimal"
              />
              <input
                type="date"
                className={inputClass}
                value={stockForm.expiryDate}
                onChange={(event) =>
                  setStockForm((current) => ({
                    ...current,
                    expiryDate: event.target.value,
                  }))
                }
              />
            </div>
            <button
              type="submit"
              className="mt-4 w-full rounded-xl border border-[#4b7e74]/60 px-5 py-3 font-bold text-[#b7ddd5]"
            >
              Record stock received
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Purchasing({
  items,
  orders,
  poForm,
  setPoForm,
  createPurchaseOrder,
  receivePurchaseOrder,
}: {
  items: SupplyItem[];
  orders: PurchaseOrder[];
  poForm: { itemId: string; supplier: string; quantity: string; expectedDate: string };
  setPoForm: React.Dispatch<React.SetStateAction<typeof poForm>>;
  createPurchaseOrder: (event: React.FormEvent) => void;
  receivePurchaseOrder: (order: PurchaseOrder) => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <form onSubmit={createPurchaseOrder} className={`${panelClass} p-5`}>
        <p className="text-xs font-bold tracking-[.18em] text-[#d6ad62]">
          NEW PURCHASE ORDER
        </p>
        {items.length ? (
          <div className="mt-5 space-y-4">
            <label className={labelClass}>
              Item
              <select
                className={`${inputClass} mt-2`}
                value={poForm.itemId}
                onChange={(event) => {
                  const item = items.find(
                    (candidate) => candidate.id === event.target.value,
                  );
                  setPoForm((current) => ({
                    ...current,
                    itemId: event.target.value,
                    supplier: item?.supplier || current.supplier,
                  }));
                }}
              >
                <option value="">Choose item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Supplier
              <input
                className={`${inputClass} mt-2`}
                value={poForm.supplier}
                onChange={(event) =>
                  setPoForm((current) => ({
                    ...current,
                    supplier: event.target.value,
                  }))
                }
                placeholder="Supplier business name"
              />
            </label>
            <label className={labelClass}>
              Quantity
              <input
                className={`${inputClass} mt-2`}
                value={poForm.quantity}
                onChange={(event) =>
                  setPoForm((current) => ({
                    ...current,
                    quantity: event.target.value,
                  }))
                }
                inputMode="decimal"
                placeholder="0"
              />
            </label>
            <label className={labelClass}>
              Expected delivery
              <input
                type="date"
                className={`${inputClass} mt-2`}
                value={poForm.expectedDate}
                onChange={(event) =>
                  setPoForm((current) => ({
                    ...current,
                    expectedDate: event.target.value,
                  }))
                }
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-xl bg-[#d6ad62] px-5 py-3.5 font-black text-[#0a1013]"
            >
              Create purchase order
            </button>
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-black/20 p-4 text-sm text-white/45">
            Add an inventory item before creating a purchase order.
          </p>
        )}
      </form>

      <div className={`${panelClass} overflow-hidden`}>
        <div className="border-b border-white/8 p-5">
          <h2 className="font-black">Purchase order register</h2>
        </div>
        {orders.length ? (
          <div className="divide-y divide-white/7">
            {orders.map((order) => (
              <div key={order.id} className="p-5">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-black">{order.itemName}</p>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-2 text-sm text-white/42">
                      {order.supplier} · expected {formatDate(order.expectedDate)}
                    </p>
                  </div>
                  <p className="text-xl font-black text-[#e5bd72]">
                    {order.quantity} {order.unit}
                  </p>
                </div>
                {order.status === "ordered" && (
                  <button
                    type="button"
                    onClick={() => receivePurchaseOrder(order)}
                    className="mt-4 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white"
                  >
                    Confirm goods received
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              title="No purchase orders"
              text="Create one manually or open an approved outlet request and purchase its shortage."
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Production({
  items,
  recipes,
  batches,
  recipeForm,
  setRecipeForm,
  batchForm,
  setBatchForm,
  createRecipe,
  planBatch,
  completeBatch,
}: {
  items: SupplyItem[];
  recipes: SupplyRecipe[];
  batches: SupplyState["productionBatches"];
  recipeForm: {
    name: string;
    outputItemId: string;
    outputQuantity: string;
    ingredientItemId: string;
    ingredientQuantity: string;
  };
  setRecipeForm: React.Dispatch<React.SetStateAction<typeof recipeForm>>;
  batchForm: { recipeId: string; multiplier: string; scheduledDate: string };
  setBatchForm: React.Dispatch<React.SetStateAction<typeof batchForm>>;
  createRecipe: (event: React.FormEvent) => void;
  planBatch: (event: React.FormEvent) => void;
  completeBatch: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <form onSubmit={createRecipe} className={`${panelClass} p-5`}>
          <p className="text-xs font-bold tracking-[.18em] text-[#d6ad62]">
            RECIPE / PRODUCTION RULE
          </p>
          <p className="mt-2 text-sm leading-6 text-white/40">
            Define what one production batch consumes and produces. Business
            items remain fully configurable.
          </p>
          {items.length >= 2 ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className={`${labelClass} sm:col-span-2`}>
                Recipe name
                <input
                  className={`${inputClass} mt-2`}
                  value={recipeForm.name}
                  onChange={(event) =>
                    setRecipeForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Example: Chicken rice preparation"
                />
              </label>
              <label className={labelClass}>
                Finished item
                <select
                  className={`${inputClass} mt-2`}
                  value={recipeForm.outputItemId}
                  onChange={(event) =>
                    setRecipeForm((current) => ({
                      ...current,
                      outputItemId: event.target.value,
                    }))
                  }
                >
                  <option value="">Choose output</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Output per batch
                <input
                  className={`${inputClass} mt-2`}
                  value={recipeForm.outputQuantity}
                  onChange={(event) =>
                    setRecipeForm((current) => ({
                      ...current,
                      outputQuantity: event.target.value,
                    }))
                  }
                  inputMode="decimal"
                  placeholder="0"
                />
              </label>
              <label className={labelClass}>
                Ingredient
                <select
                  className={`${inputClass} mt-2`}
                  value={recipeForm.ingredientItemId}
                  onChange={(event) =>
                    setRecipeForm((current) => ({
                      ...current,
                      ingredientItemId: event.target.value,
                    }))
                  }
                >
                  <option value="">Choose input</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Ingredient per batch
                <input
                  className={`${inputClass} mt-2`}
                  value={recipeForm.ingredientQuantity}
                  onChange={(event) =>
                    setRecipeForm((current) => ({
                      ...current,
                      ingredientQuantity: event.target.value,
                    }))
                  }
                  inputMode="decimal"
                  placeholder="0"
                />
              </label>
              <button
                type="submit"
                className="rounded-xl bg-[#d6ad62] px-5 py-3.5 font-black text-[#0a1013] sm:col-span-2"
              >
                Save production rule
              </button>
            </div>
          ) : (
            <p className="mt-5 rounded-xl bg-black/20 p-4 text-sm text-white/45">
              Add at least one ingredient and one finished item in Inventory first.
            </p>
          )}
        </form>

        <form onSubmit={planBatch} className={`${panelClass} p-5`}>
          <p className="text-xs font-bold tracking-[.18em] text-[#8fc2b8]">
            PLAN PRODUCTION
          </p>
          <p className="mt-2 text-sm leading-6 text-white/40">
            Stock moves only when a manager confirms that production is completed.
          </p>
          {recipes.length ? (
            <div className="mt-5 space-y-4">
              <label className={labelClass}>
                Recipe
                <select
                  className={`${inputClass} mt-2`}
                  value={batchForm.recipeId}
                  onChange={(event) =>
                    setBatchForm((current) => ({
                      ...current,
                      recipeId: event.target.value,
                    }))
                  }
                >
                  <option value="">Choose recipe</option>
                  {recipes.map((recipe) => (
                    <option key={recipe.id} value={recipe.id}>
                      {recipe.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Number of batches
                <input
                  className={`${inputClass} mt-2`}
                  value={batchForm.multiplier}
                  onChange={(event) =>
                    setBatchForm((current) => ({
                      ...current,
                      multiplier: event.target.value,
                    }))
                  }
                  inputMode="decimal"
                />
              </label>
              <label className={labelClass}>
                Scheduled date
                <input
                  type="date"
                  className={`${inputClass} mt-2`}
                  value={batchForm.scheduledDate}
                  onChange={(event) =>
                    setBatchForm((current) => ({
                      ...current,
                      scheduledDate: event.target.value,
                    }))
                  }
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-xl border border-[#4b7e74]/60 px-5 py-3.5 font-bold text-[#b7ddd5]"
              >
                Plan production batch
              </button>
            </div>
          ) : (
            <p className="mt-5 rounded-xl bg-black/20 p-4 text-sm text-white/45">
              Save a production rule before planning batches.
            </p>
          )}
        </form>
      </div>

      <div className={`${panelClass} overflow-hidden`}>
        <div className="border-b border-white/8 p-5">
          <h2 className="font-black">Production batches</h2>
        </div>
        {batches.length ? (
          <div className="divide-y divide-white/7">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-black">{batch.recipeName}</p>
                    <StatusBadge status={batch.status} />
                  </div>
                  <p className="mt-2 text-sm text-white/40">
                    {batch.multiplier} batch(es) · {formatDate(batch.scheduledDate)}
                  </p>
                </div>
                {batch.status === "planned" && (
                  <button
                    type="button"
                    onClick={() => completeBatch(batch.id)}
                    className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white"
                  >
                    Complete and post stock
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              title="No production batches planned"
              text="This module is optional. Warehouse-only users can leave it unused."
            />
          </div>
        )}
      </div>
    </div>
  );
}

function OutletRequest({
  items,
  outletName,
  requestForm,
  setRequestForm,
  createRequest,
}: {
  items: SupplyItem[];
  outletName: string;
  requestForm: { itemId: string; quantity: string; neededBy: string; note: string };
  setRequestForm: React.Dispatch<React.SetStateAction<typeof requestForm>>;
  createRequest: (event: React.FormEvent) => void;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <form onSubmit={createRequest} className={`${panelClass} p-5 sm:p-7`}>
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#4b7e74] text-xl">
            1
          </span>
          <div>
            <h2 className="text-xl font-black">What does {outletName} need?</h2>
            <p className="mt-1 text-sm text-white/42">
              Only shared items from central operations are available.
            </p>
          </div>
        </div>
        {items.length ? (
          <>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <label className={`${labelClass} sm:col-span-2`}>
                Item
                <select
                  className={`${inputClass} mt-2`}
                  value={requestForm.itemId}
                  onChange={(event) =>
                    setRequestForm((current) => ({
                      ...current,
                      itemId: event.target.value,
                    }))
                  }
                >
                  <option value="">Choose the item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · outlet has {item.outletStock} {item.unit}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Quantity needed
                <input
                  className={`${inputClass} mt-2`}
                  value={requestForm.quantity}
                  onChange={(event) =>
                    setRequestForm((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }))
                  }
                  inputMode="decimal"
                  placeholder="0"
                />
              </label>
              <label className={labelClass}>
                Needed by
                <input
                  type="date"
                  className={`${inputClass} mt-2`}
                  value={requestForm.neededBy}
                  onChange={(event) =>
                    setRequestForm((current) => ({
                      ...current,
                      neededBy: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                Note for central team (optional)
                <textarea
                  className={`${inputClass} mt-2 min-h-24 resize-y`}
                  value={requestForm.note}
                  onChange={(event) =>
                    setRequestForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  placeholder="Example: Weekend promotion begins Friday"
                />
              </label>
            </div>
            <div className="mt-6 rounded-2xl border border-[#4b7e74]/25 bg-[#4b7e74]/8 p-4 text-sm leading-6 text-white/52">
              After submission, central operations can approve, reject, purchase or
              dispatch. You can follow every status from this outlet view.
            </div>
            <button
              type="submit"
              className="mt-6 w-full rounded-xl bg-[#d6ad62] px-5 py-4 text-base font-black text-[#0a1013]"
            >
              Submit supply request
            </button>
          </>
        ) : (
          <div className="mt-7">
            <EmptyState
              title="Central item setup is required"
              text="Ask the central user to add ingredients, packaging or products first."
            />
          </div>
        )}
      </form>
    </div>
  );
}

function OutletReceiving({
  requests,
  confirmReceived,
}: {
  requests: SupplyRequest[];
  confirmReceived: (request: SupplyRequest) => void;
}) {
  const relevant = requests.filter((request) =>
    ["approved", "dispatched", "received"].includes(request.status),
  );
  return (
    <div className={`${panelClass} overflow-hidden`}>
      <div className="border-b border-white/8 p-5">
        <h2 className="font-black">Deliveries and receiving</h2>
        <p className="mt-1 text-sm text-white/40">
          Confirm only after checking the physical quantity.
        </p>
      </div>
      {relevant.length ? (
        <div className="divide-y divide-white/7">
          {relevant.map((request) => (
            <div
              key={request.id}
              className="flex flex-wrap items-center justify-between gap-4 p-5"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-black">{request.itemName}</p>
                  <StatusBadge status={request.status} />
                </div>
                <p className="mt-2 text-sm text-white/42">
                  {request.quantity} {request.unit} · needed{" "}
                  {formatDate(request.neededBy)}
                </p>
              </div>
              {request.status === "dispatched" ? (
                <button
                  type="button"
                  onClick={() => confirmReceived(request)}
                  className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white"
                >
                  Confirm quantity received
                </button>
              ) : (
                <p className="text-sm text-white/38">
                  {request.status === "approved"
                    ? "Central team is preparing this request."
                    : "Completed"}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6">
          <EmptyState
            title="No deliveries yet"
            text="Approved and dispatched requests will appear here."
          />
        </div>
      )}
    </div>
  );
}

function OutletStock({
  items,
  wastageForm,
  setWastageForm,
  recordWastage,
}: {
  items: SupplyItem[];
  wastageForm: { itemId: string; quantity: string; reason: string };
  setWastageForm: React.Dispatch<React.SetStateAction<typeof wastageForm>>;
  recordWastage: (event: React.FormEvent) => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <div className={`${panelClass} overflow-hidden`}>
        <div className="border-b border-white/8 p-5">
          <h2 className="font-black">Current outlet stock</h2>
        </div>
        {items.length ? (
          <div className="divide-y divide-white/7">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 p-5"
              >
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className="mt-1 text-xs text-white/35">
                    {item.category || "Uncategorised"} · {item.sku || "No SKU"}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xl font-black ${
                      item.outletStock <= item.reorderLevel
                        ? "text-red-300"
                        : "text-[#e5bd72]"
                    }`}
                  >
                    {item.outletStock} {item.unit}
                  </p>
                  <p className="mt-1 text-xs text-white/30">
                    Alert at {item.reorderLevel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              title="No shared items"
              text="Central operations must add items first."
            />
          </div>
        )}
      </div>

      <form onSubmit={recordWastage} className={`${panelClass} h-fit p-5`}>
        <p className="text-xs font-bold tracking-[.18em] text-[#d6ad62]">
          STOCK ADJUSTMENT / WASTAGE
        </p>
        <p className="mt-2 text-sm leading-6 text-white/40">
          A reason is compulsory so stock cannot disappear without an audit
          explanation.
        </p>
        <div className="mt-5 space-y-4">
          <select
            className={inputClass}
            value={wastageForm.itemId}
            onChange={(event) =>
              setWastageForm((current) => ({
                ...current,
                itemId: event.target.value,
              }))
            }
          >
            <option value="">Choose item</option>
            {items
              .filter((item) => item.outletStock > 0)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.outletStock} {item.unit}
                </option>
              ))}
          </select>
          <input
            className={inputClass}
            value={wastageForm.quantity}
            onChange={(event) =>
              setWastageForm((current) => ({
                ...current,
                quantity: event.target.value,
              }))
            }
            inputMode="decimal"
            placeholder="Quantity to remove"
          />
          <input
            className={inputClass}
            value={wastageForm.reason}
            onChange={(event) =>
              setWastageForm((current) => ({
                ...current,
                reason: event.target.value,
              }))
            }
            placeholder="Reason: damaged, expired, count correction"
          />
          <button
            type="submit"
            className="w-full rounded-xl border border-red-400/30 px-5 py-3.5 font-bold text-red-200"
          >
            Record stock adjustment
          </button>
        </div>
      </form>
    </div>
  );
}
