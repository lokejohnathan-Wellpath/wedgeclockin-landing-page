export type BusinessType =
  | "Retail"
  | "F&B"
  | "Beauty / Aesthetic / Medical"
  | "Service"
  | "Manufacturing"
  | "General SME";

export type IndustryBenchmark = {
  label: BusinessType;
  labourRatio: {
    min: number;
    max: number;
  };
  healthyMargin: number;
  inventoryToRevenueLimit: number;
  revenuePerStaffTarget: number;
  cashRunwayWeeks: {
    watch: number;
    healthy: number;
    strong: number;
  };
  baseQuarterGrowth: number;
};

export const ceoConfidenceWeights = {
  financialHealth: 30,
  cashPosition: 20,
  growthMomentum: 15,
  labourEfficiency: 15,
  inventoryDiscipline: 10,
  malaysiaBusinessReadiness: 10,
};

export const industryBenchmarks: Record<BusinessType, IndustryBenchmark> = {
  Retail: {
    label: "Retail",
    labourRatio: { min: 10, max: 22 },
    healthyMargin: 12,
    inventoryToRevenueLimit: 0.65,
    revenuePerStaffTarget: 6000,
    cashRunwayWeeks: { watch: 2, healthy: 4, strong: 8 },
    baseQuarterGrowth: 0.06,
  },

  "F&B": {
    label: "F&B",
    labourRatio: { min: 18, max: 32 },
    healthyMargin: 10,
    inventoryToRevenueLimit: 0.35,
    revenuePerStaffTarget: 5500,
    cashRunwayWeeks: { watch: 2, healthy: 4, strong: 8 },
    baseQuarterGrowth: 0.05,
  },

  "Beauty / Aesthetic / Medical": {
    label: "Beauty / Aesthetic / Medical",
    labourRatio: { min: 18, max: 38 },
    healthyMargin: 20,
    inventoryToRevenueLimit: 0.3,
    revenuePerStaffTarget: 6500,
    cashRunwayWeeks: { watch: 2, healthy: 4, strong: 8 },
    baseQuarterGrowth: 0.07,
  },

  Service: {
    label: "Service",
    labourRatio: { min: 20, max: 40 },
    healthyMargin: 18,
    inventoryToRevenueLimit: 0.2,
    revenuePerStaffTarget: 6500,
    cashRunwayWeeks: { watch: 2, healthy: 4, strong: 8 },
    baseQuarterGrowth: 0.06,
  },

  Manufacturing: {
    label: "Manufacturing",
    labourRatio: { min: 15, max: 30 },
    healthyMargin: 15,
    inventoryToRevenueLimit: 0.75,
    revenuePerStaffTarget: 7000,
    cashRunwayWeeks: { watch: 3, healthy: 6, strong: 10 },
    baseQuarterGrowth: 0.04,
  },

  "General SME": {
    label: "General SME",
    labourRatio: { min: 15, max: 30 },
    healthyMargin: 12,
    inventoryToRevenueLimit: 0.5,
    revenuePerStaffTarget: 6000,
    cashRunwayWeeks: { watch: 2, healthy: 4, strong: 8 },
    baseQuarterGrowth: 0.05,
  },
};

export function getIndustryBenchmark(type: BusinessType) {
  return industryBenchmarks[type];
}