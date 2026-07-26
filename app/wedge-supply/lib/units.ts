import type { CoreUnit } from "./types";

const unitMeta: Record<
  CoreUnit,
  { dimension: "mass" | "volume" | "count"; baseFactor: number }
> = {
  kg: { dimension: "mass", baseFactor: 1000 },
  g: { dimension: "mass", baseFactor: 1 },
  L: { dimension: "volume", baseFactor: 1000 },
  ml: { dimension: "volume", baseFactor: 1 },
  pcs: { dimension: "count", baseFactor: 1 },
};

export const coreUnits: CoreUnit[] = ["kg", "g", "L", "ml", "pcs"];

export function isCoreUnit(value: string): value is CoreUnit {
  return coreUnits.includes(value as CoreUnit);
}

export function compatibleUnits(unit: string): CoreUnit[] {
  if (!isCoreUnit(unit)) return [];
  const dimension = unitMeta[unit].dimension;
  return coreUnits.filter(
    (candidate) => unitMeta[candidate].dimension === dimension,
  );
}

export function convertQuantity(
  quantity: number,
  fromUnit: string,
  toUnit: string,
) {
  if (!Number.isFinite(quantity)) {
    throw new Error("Quantity must be a valid number.");
  }
  if (!isCoreUnit(fromUnit) || !isCoreUnit(toUnit)) {
    throw new Error("Choose kg, g, L, ml or pcs.");
  }
  if (unitMeta[fromUnit].dimension !== unitMeta[toUnit].dimension) {
    throw new Error(`Cannot convert ${fromUnit} to ${toUnit}.`);
  }
  return (quantity * unitMeta[fromUnit].baseFactor) / unitMeta[toUnit].baseFactor;
}

export function readableQuantity(quantity: number, unit: string) {
  if (!Number.isFinite(quantity)) return `0 ${unit}`;
  if (unit === "g" && Math.abs(quantity) >= 1000) {
    return `${formatNumber(quantity / 1000)} kg`;
  }
  if (unit === "ml" && Math.abs(quantity) >= 1000) {
    return `${formatNumber(quantity / 1000)} L`;
  }
  return `${formatNumber(quantity)} ${unit}`;
}

export function formatNumber(quantity: number) {
  return new Intl.NumberFormat("en-MY", {
    maximumFractionDigits: 3,
  }).format(quantity);
}
