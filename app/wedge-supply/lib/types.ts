export type SupplyRole = "central" | "outlet";

export type CoreUnit = "kg" | "g" | "L" | "ml" | "pcs";
export type InventoryType =
  | "raw"
  | "semi-processed"
  | "finished"
  | "packaging"
  | "direct-supply";
export type FulfilmentRoute =
  | "central-stock"
  | "direct-supplier"
  | "central-production";

export type RequestStatus =
  | "submitted"
  | "approved"
  | "rejected"
  | "awaiting-supplier"
  | "supplier-dispatched"
  | "in-production"
  | "ready-for-dispatch"
  | "dispatched"
  | "received";

export type PurchaseOrderStatus =
  | "ordered"
  | "supplier-dispatched"
  | "partially-received"
  | "received"
  | "cancelled";

export type DirectSupplierCostMode = "quantity-only" | "actual-cost";

export type LedgerMovement =
  | "opening"
  | "purchase-receipt"
  | "production-input"
  | "production-output"
  | "dispatch-out"
  | "outlet-receipt"
  | "direct-receipt"
  | "wastage"
  | "adjustment"
  | "return"
  | "reversal";

export type SupplyOutlet = {
  id: string;
  name: string;
  code: string;
  active: boolean;
  createdAt: string;
};

export type SupplyConfig = {
  businessName: string;
  centralLocation: string;
  outletName: string;
  outletCode?: string;
  outlets?: SupplyOutlet[];
  activeOutletId?: string;
  currency: string;
  directSupplierCostMode?: DirectSupplierCostMode;
  includeDirectSupplierCostInCsv?: boolean;
  inventoryCategories?: string[];
  lockedMonths?: string[];
};

export type SupplyItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  supplier: string;
  centralStock: number;
  outletStock: number;
  outletStocks?: Record<string, number>;
  reorderLevel: number;
  expiryDate: string;
  inventoryType?: InventoryType;
  purchaseUnit?: string;
  purchasePackSize?: number;
  safetyStock?: number;
  supplierLeadTimeDays?: number;
  minimumOrderQuantity?: number;
  unitCost?: number;
  lastPurchasePrice?: number;
};

export type SupplyRequest = {
  id: string;
  itemId: string;
  itemName: string;
  outletName: string;
  outletId?: string;
  outletCode?: string;
  quantity: number;
  unit: string;
  requestedQuantity?: number;
  requestedUnit?: CoreUnit;
  fulfilmentRoute?: FulfilmentRoute;
  allocatedQuantity?: number;
  linkedPurchaseOrderId?: string;
  linkedProductionBatchId?: string;
  deliveryOrderId?: string;
  deliveryOrderNumber?: string;
  neededBy: string;
  note: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseOrder = {
  id: string;
  itemId: string;
  itemName: string;
  supplier: string;
  quantity: number;
  unit: string;
  expectedDate: string;
  status: PurchaseOrderStatus;
  createdAt: string;
  destination?: "central" | "outlet";
  outletName?: string;
  linkedRequestId?: string;
  purchaseUnit?: string;
  stockQuantity?: number;
  destinationOutletId?: string;
  destinationOutletCode?: string;
  purchaseUnitPrice?: number;
  totalCost?: number;
  deliveryOrderId?: string;
  deliveryOrderNumber?: string;
  internalDirectReference?: string;
  supplierDeliveryOrderNumber?: string;
  supplierInvoiceNumber?: string;
  receivedStockQuantity?: number;
  returnedStockQuantity?: number;
};

export type RecipeIngredient = {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  enteredQuantity?: number;
  enteredUnit?: CoreUnit;
};

export type SupplyRecipe = {
  id: string;
  name: string;
  outputItemId: string;
  outputItemName: string;
  outputQuantity: number;
  outputUnit: string;
  ingredients: RecipeIngredient[];
  processingCostPerBatch?: number;
};

export type ProductionBatch = {
  id: string;
  recipeId: string;
  recipeName: string;
  multiplier: number;
  scheduledDate: string;
  status: "planned" | "completed" | "cancelled";
  createdAt: string;
  linkedRequestId?: string;
  producedQuantity?: number;
  productionCost?: number;
  outputUnitCost?: number;
  plannedOutputQuantity?: number;
  actualOutputQuantity?: number;
  wastageQuantity?: number;
  batchNumber?: string;
  expiryDate?: string;
  completedAt?: string;
};

export type ProductionAllocation = {
  id: string;
  batchId: string;
  requestId: string;
  itemId: string;
  itemName: string;
  outletName: string;
  outletId?: string;
  outletCode?: string;
  quantity: number;
  unit: string;
  status: "allocated" | "dispatched" | "received";
  createdAt: string;
};

export type DeliveryOrder = {
  id: string;
  number: string;
  outletId: string;
  outletCode: string;
  outletName: string;
  requestId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  route: FulfilmentRoute;
  status: "dispatched" | "partially-received" | "received" | "discrepancy" | "void";
  dispatchedAt: string;
  receivedAt?: string;
  lines?: DeliveryOrderLine[];
  supplierDeliveryOrderNumber?: string;
  supplierName?: string;
  supplierInvoiceNumber?: string;
  receivingNote?: string;
  voidReason?: string;
};

export type DeliveryOrderLine = {
  id: string;
  requestId: string;
  itemId: string;
  itemName: string;
  dispatchedQuantity: number;
  receivedQuantity: number;
  damagedQuantity: number;
  unit: string;
  unitCost: number;
};

export type StockLedgerEntry = {
  id: string;
  postedAt: string;
  effectiveDate: string;
  movement: LedgerMovement;
  itemId: string;
  itemName: string;
  locationId: string;
  locationCode: string;
  quantityDelta: number;
  unit: string;
  unitCost: number;
  valueDelta: number;
  sourceType: "item" | "po" | "batch" | "do" | "receipt" | "count" | "return";
  sourceId: string;
  reference: string;
  status: "posted" | "reversed";
  reversalOf?: string;
  reason?: string;
  route?: FulfilmentRoute;
};

export type StockCount = {
  id: string;
  number: string;
  locationId: string;
  itemId: string;
  systemQuantity: number;
  countedQuantity: number;
  unit: string;
  reason: string;
  status: "draft" | "posted" | "void";
  createdAt: string;
  postedAt?: string;
};

export type SupplierCreditNote = {
  id: string;
  number: string;
  purchaseOrderId: string;
  itemId: string;
  quantity: number;
  unit: string;
  amount: number;
  reason: string;
  createdAt: string;
};

export type SupplyActivity = {
  id: string;
  message: string;
  createdAt: string;
};

export type IntelligenceState = {
  dismissedSuggestionIds: string[];
  approvedSuggestionCount: number;
  lastReviewedAt: string;
};

export type ManualPlanningEvent = {
  id: string;
  date: string;
  title: string;
  note: string;
  category: "event" | "promotion" | "supplier-closure" | "stock-count";
  createdAt: string;
};

export type SupplyState = {
  version: 4;
  config: SupplyConfig;
  items: SupplyItem[];
  requests: SupplyRequest[];
  purchaseOrders: PurchaseOrder[];
  recipes: SupplyRecipe[];
  productionBatches: ProductionBatch[];
  activities: SupplyActivity[];
  intelligence: IntelligenceState;
  planningEvents: ManualPlanningEvent[];
  productionAllocations: ProductionAllocation[];
  deliveryOrders: DeliveryOrder[];
  ledger: StockLedgerEntry[];
  stockCounts: StockCount[];
  supplierCreditNotes: SupplierCreditNote[];
};
