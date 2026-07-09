import type { BusinessType, IndustryBenchmark } from "./benchmarks";

export type FinancialInputs = {
  businessType: BusinessType;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyPayroll: number;
  staffCount: number;
  cashInBank: number;
  inventoryValue: number;
};

export type FinancialAnalysis = {
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyPayroll: number;
  operatingCost: number;
  operatingProfit: number;
  profitMargin: number;
  labourRatio: number;
  revenuePerStaff: number;
  cashRunwayWeeks: number;
  inventoryToRevenueRatio: number;
  financialHealthScore: number;
  cashPositionScore: number;
  labourEfficiencyScore: number;
  inventoryDisciplineScore: number;
  growthMomentumScore: number;
  overallSignals: string[];
};

export function analyseFinancials(
  inputs: FinancialInputs,
  benchmark: IndustryBenchmark,
): FinancialAnalysis {
  const monthlyRevenue = safeNumber(inputs.monthlyRevenue);
  const monthlyExpenses = safeNumber(inputs.monthlyExpenses);
  const monthlyPayroll = safeNumber(inputs.monthlyPayroll);
  const staffCount = safeNumber(inputs.staffCount);
  const cashInBank = safeNumber(inputs.cashInBank);
  const inventoryValue = safeNumber(inputs.inventoryValue);

  const operatingCost = monthlyExpenses + monthlyPayroll;
  const operatingProfit = monthlyRevenue - operatingCost;

  const profitMargin =
    monthlyRevenue > 0 ? (operatingProfit / monthlyRevenue) * 100 : 0;

  const labourRatio =
    monthlyRevenue > 0 ? (monthlyPayroll / monthlyRevenue) * 100 : 0;

  const revenuePerStaff = staffCount > 0 ? monthlyRevenue / staffCount : 0;

  const cashRunwayWeeks =
    operatingCost > 0 ? (cashInBank / operatingCost) * 4 : 0;

  const inventoryToRevenueRatio =
    monthlyRevenue > 0 ? inventoryValue / monthlyRevenue : 0;

  const financialHealthScore = scoreProfitMargin(
    profitMargin,
    benchmark.healthyMargin,
  );

  const cashPositionScore = scoreCashRunway(
    cashRunwayWeeks,
    benchmark.cashRunwayWeeks.watch,
    benchmark.cashRunwayWeeks.healthy,
    benchmark.cashRunwayWeeks.strong,
  );

  const labourEfficiencyScore = scoreLabourRatio(
    labourRatio,
    benchmark.labourRatio.min,
    benchmark.labourRatio.max,
  );

  const inventoryDisciplineScore = scoreInventoryDiscipline(
    inventoryToRevenueRatio,
    benchmark.inventoryToRevenueLimit,
  );

  const growthMomentumScore = scoreRevenuePerStaff(
    revenuePerStaff,
    benchmark.revenuePerStaffTarget,
  );

  const overallSignals = buildOverallSignals({
    profitMargin,
    labourRatio,
    revenuePerStaff,
    cashRunwayWeeks,
    inventoryToRevenueRatio,
    benchmark,
  });

  return {
    monthlyRevenue,
    monthlyExpenses,
    monthlyPayroll,
    operatingCost,
    operatingProfit,
    profitMargin: Math.round(profitMargin),
    labourRatio: Math.round(labourRatio),
    revenuePerStaff,
    cashRunwayWeeks,
    inventoryToRevenueRatio,
    financialHealthScore,
    cashPositionScore,
    labourEfficiencyScore,
    inventoryDisciplineScore,
    growthMomentumScore,
    overallSignals,
  };
}

function safeNumber(value: number) {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return value;
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreProfitMargin(profitMargin: number, healthyMargin: number) {
  if (profitMargin >= healthyMargin * 1.5) return 95;
  if (profitMargin >= healthyMargin) return 85;
  if (profitMargin > 0) return 65;
  if (profitMargin > -10) return 40;
  return 20;
}

function scoreCashRunway(
  cashRunwayWeeks: number,
  watchWeeks: number,
  healthyWeeks: number,
  strongWeeks: number,
) {
  if (cashRunwayWeeks >= strongWeeks) return 95;
  if (cashRunwayWeeks >= healthyWeeks) return 82;
  if (cashRunwayWeeks >= watchWeeks) return 60;
  if (cashRunwayWeeks > 0) return 35;
  return 15;
}

function scoreLabourRatio(
  labourRatio: number,
  idealMin: number,
  idealMax: number,
) {
  if (labourRatio === 0) return 40;

  if (labourRatio >= idealMin && labourRatio <= idealMax) {
    return 90;
  }

  if (labourRatio < idealMin) {
    return 75;
  }

  if (labourRatio <= idealMax + 8) {
    return 55;
  }

  return 30;
}

function scoreInventoryDiscipline(
  inventoryToRevenueRatio: number,
  inventoryLimit: number,
) {
  if (inventoryToRevenueRatio === 0) return 75;
  if (inventoryToRevenueRatio <= inventoryLimit * 0.75) return 90;
  if (inventoryToRevenueRatio <= inventoryLimit) return 75;
  if (inventoryToRevenueRatio <= inventoryLimit * 1.25) return 55;
  return 30;
}

function scoreRevenuePerStaff(
  revenuePerStaff: number,
  targetRevenuePerStaff: number,
) {
  if (revenuePerStaff >= targetRevenuePerStaff * 1.25) return 95;
  if (revenuePerStaff >= targetRevenuePerStaff) return 85;
  if (revenuePerStaff >= targetRevenuePerStaff * 0.7) return 65;
  if (revenuePerStaff > 0) return 45;
  return 25;
}

function buildOverallSignals({
  profitMargin,
  labourRatio,
  revenuePerStaff,
  cashRunwayWeeks,
  inventoryToRevenueRatio,
  benchmark,
}: {
  profitMargin: number;
  labourRatio: number;
  revenuePerStaff: number;
  cashRunwayWeeks: number;
  inventoryToRevenueRatio: number;
  benchmark: IndustryBenchmark;
}) {
  const signals: string[] = [];

  if (profitMargin >= benchmark.healthyMargin) {
    signals.push("Operating margin is within healthy benchmark.");
  } else if (profitMargin > 0) {
    signals.push("Operating profit remains positive but margin can improve.");
  } else {
    signals.push("Operating margin requires immediate recovery.");
  }

  if (
    labourRatio >= benchmark.labourRatio.min &&
    labourRatio <= benchmark.labourRatio.max
  ) {
    signals.push("Labour ratio is within the recommended range.");
  } else if (labourRatio > benchmark.labourRatio.max) {
    signals.push("Labour pressure is above industry benchmark.");
  } else {
    signals.push("Labour ratio is below benchmark; check if staffing is sufficient for service quality.");
  }

  if (cashRunwayWeeks >= benchmark.cashRunwayWeeks.strong) {
    signals.push("Cash runway is strong.");
  } else if (cashRunwayWeeks >= benchmark.cashRunwayWeeks.healthy) {
    signals.push("Cash runway is healthy.");
  } else {
    signals.push("Cash runway should be monitored closely.");
  }

  if (inventoryToRevenueRatio > benchmark.inventoryToRevenueLimit) {
    signals.push("Inventory is tying up more cash than recommended.");
  } else {
    signals.push("Inventory position is within acceptable range.");
  }

  if (revenuePerStaff >= benchmark.revenuePerStaffTarget) {
    signals.push("Revenue per staff is above target.");
  } else {
    signals.push("Revenue per staff can be improved.");
  }

  return signals;
}