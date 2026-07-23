export type SupplyRole = "central" | "outlet";

export type RequestStatus =
  | "submitted"
  | "approved"
  | "rejected"
  | "dispatched"
  | "received";

export type PurchaseOrderStatus = "ordered" | "received" | "cancelled";

export type SupplyConfig = {
  businessName: string;
  centralLocation: string;
  outletName: string;
  currency: string;
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
  reorderLevel: number;
  expiryDate: string;
};

export type SupplyRequest = {
  id: string;
  itemId: string;
  itemName: string;
  outletName: string;
  quantity: number;
  unit: string;
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
};

export type RecipeIngredient = {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
};

export type SupplyRecipe = {
  id: string;
  name: string;
  outputItemId: string;
  outputItemName: string;
  outputQuantity: number;
  outputUnit: string;
  ingredients: RecipeIngredient[];
};

export type ProductionBatch = {
  id: string;
  recipeId: string;
  recipeName: string;
  multiplier: number;
  scheduledDate: string;
  status: "planned" | "completed" | "cancelled";
  createdAt: string;
};

export type SupplyActivity = {
  id: string;
  message: string;
  createdAt: string;
};

export type SupplyState = {
  version: 1;
  config: SupplyConfig;
  items: SupplyItem[];
  requests: SupplyRequest[];
  purchaseOrders: PurchaseOrder[];
  recipes: SupplyRecipe[];
  productionBatches: ProductionBatch[];
  activities: SupplyActivity[];
};
