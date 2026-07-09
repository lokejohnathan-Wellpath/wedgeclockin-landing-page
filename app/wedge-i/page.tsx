"use client";

import { FormEvent, useMemo, useState } from "react";

type BusinessType =
  | "Retail"
  | "F&B"
  | "Beauty / Aesthetic / Medical"
  | "Service"
  | "Manufacturing"
  | "General SME";

type Benchmark = {
  idealLabourMin: number;
  idealLabourMax: number;
  healthyMargin: number;
  inventoryLimit: number;
  baseGrowth: number;
};

type Scenario = {
  label: string;
  revenue: number;
  profit: number;
  cash: number;
  status: string;
  commentary: string;
};

type MalaysiaRhythm = {
  periodName: string;
  quarterName: string;
  rhythmNote: string;
  commercialAngle: string;
  longWeekendReminder: string;
  managementFocus: string;
};

type Result = {
  preparedDate: string;
  healthScore: number;
  rating: string;
  industryBenchmark: string;
  confidenceScore: number;
  cashflowStatus: string;
  labourPercent: number;
  profitMargin: number;
  monthlyProfit: number;
  operatingCost: number;
  revenuePerStaff: number;
  cashRunwayWeeks: number;
  rhythm: MalaysiaRhythm;
  scenarios: Scenario[];
  executiveSummary: string;
  performanceIndicators: string[];
  malaysianAdvisor: string[];
  nextMeetingAgenda: string[];
};

const benchmarks: Record<BusinessType, Benchmark> = {
  Retail: {
    idealLabourMin: 10,
    idealLabourMax: 22,
    healthyMargin: 12,
    inventoryLimit: 0.65,
    baseGrowth: 0.06,
  },
  "F&B": {
    idealLabourMin: 18,
    idealLabourMax: 32,
    healthyMargin: 10,
    inventoryLimit: 0.35,
    baseGrowth: 0.05,
  },
  "Beauty / Aesthetic / Medical": {
    idealLabourMin: 18,
    idealLabourMax: 38,
    healthyMargin: 20,
    inventoryLimit: 0.3,
    baseGrowth: 0.07,
  },
  Service: {
    idealLabourMin: 20,
    idealLabourMax: 40,
    healthyMargin: 18,
    inventoryLimit: 0.2,
    baseGrowth: 0.06,
  },
  Manufacturing: {
    idealLabourMin: 15,
    idealLabourMax: 30,
    healthyMargin: 15,
    inventoryLimit: 0.75,
    baseGrowth: 0.04,
  },
  "General SME": {
    idealLabourMin: 15,
    idealLabourMax: 30,
    healthyMargin: 12,
    inventoryLimit: 0.5,
    baseGrowth: 0.05,
  },
};

function getMalaysiaBusinessRhythm(date: Date, businessType: BusinessType): MalaysiaRhythm {
  const month = date.getMonth();
  const day = date.getDate();
  const quarter = Math.floor(month / 3) + 1;
  const isMonthEnd = day >= 24;
  const isPaydayWindow = day >= 25 || day <= 7;
  const isQuarterEnd = [2, 5, 8, 11].includes(month) && day >= 18;

  let periodName = "Normal trading period";
  let commercialAngle = "Focus on weekly sales quality, margin discipline and customer retention.";
  let managementFocus = "Review revenue, operating cost, payroll, cash position and next-week action items.";

  if (month === 0 || month === 1) {
    periodName = "Chinese New Year trading rhythm";
    commercialAngle =
      businessType === "Manufacturing"
        ? "Plan supplier lead time, production cut-off and customer delivery schedules before holiday slowdown."
        : "Prepare festive bundles, gift sets, family packages and pre-holiday purchase campaigns.";
    managementFocus = "Monitor stock readiness, staff scheduling, supplier availability and cash collection before the break.";
  } else if (month === 2 || month === 3) {
    periodName = "Ramadan / Raya trading rhythm";
    commercialAngle =
      businessType === "F&B"
        ? "Review buka puasa demand, family set offers, delivery platform margin and staff scheduling."
        : "Prepare Raya-related campaigns, gifting, appointment follow-ups and stock planning.";
    managementFocus = "Review campaign timing, stock position, manpower, supplier lead time and working capital.";
  } else if (month === 4 || month === 5) {
    periodName = "Mid-year demand rhythm";
    commercialAngle =
      businessType === "F&B"
        ? "Use family dining, school-holiday traffic and weekend bundles to improve average receipt."
        : "Review mid-year package campaigns, customer retention and controlled promotional activity.";
    managementFocus = "Compare first-half performance against target and correct margin leakage before Q3.";
  } else if (month === 6 || month === 7) {
    periodName = "Campaign preparation rhythm";
    commercialAngle =
      businessType === "Retail"
        ? "Prepare national-day themed bundles and clear slow-moving stock before new inventory commitments."
        : "Prepare campaign material, pricing, stock readiness and manpower before the next demand window.";
    managementFocus = "Review stock ageing, campaign ROI, payroll ratio and cash runway before committing to expansion.";
  } else if (month === 8) {
    periodName = "National campaign rhythm";
    commercialAngle =
      businessType === "Manufacturing"
        ? "Plan production around public holiday disruption, supplier delivery cut-off and customer order deadlines."
        : "Use national-day traffic, long-weekend demand and local promotional themes to lift basket size.";
    managementFocus = "Confirm stock, supplies, roster and campaign budget before peak trading days.";
  } else if (month === 9 || month === 10) {
    periodName = "Year-end preparation rhythm";
    commercialAngle =
      businessType === "Beauty / Aesthetic / Medical"
        ? "Prepare treatment packages, skincare bundles and appointment follow-up before year-end demand."
        : "Prepare year-end sales, stock clean-up and margin protection before December commitments.";
    managementFocus = "Review inventory exposure, campaign profitability and customer pipeline before year-end.";
  } else if (month === 11) {
    periodName = "Year-end trading rhythm";
    commercialAngle =
      businessType === "Manufacturing"
        ? "Confirm production schedule, supplier availability, customer delivery deadlines and cash collection before year-end closure."
        : "Focus on gift bundles, year-end packages, prepaid vouchers and high-margin seasonal offers.";
    managementFocus = "Close the year with strong cash control, clean stock position and disciplined spending.";
  }

  if (isMonthEnd) {
    managementFocus += " Month-end review should include payroll, supplier payments and cash runway.";
  }

  if (isPaydayWindow && businessType !== "Manufacturing") {
    commercialAngle += " Payday window may support higher spending if offers are simple and easy to buy.";
  }

  if (isQuarterEnd) {
    managementFocus += " Quarter-end review should confirm revenue, margin, inventory and cash position.";
  }

  const longWeekendReminder =
    businessType === "Manufacturing"
      ? "If a public holiday falls on Friday or Monday, plan production, raw material delivery and customer dispatch earlier to avoid long-weekend disruption."
      : businessType === "F&B" || businessType === "Retail"
      ? "If a public holiday falls on Friday or Monday, prepare for long-weekend sales by confirming stock, supplies, roster and peak-hour coverage."
      : "If a public holiday falls on Friday or Monday, confirm appointment slots, staffing and customer follow-ups before the long weekend.";

  return {
    periodName,
    quarterName: `Q${quarter} Management Period`,
    rhythmNote: `${periodName}. ${isQuarterEnd ? "Quarter-end discipline is required." : "Weekly execution remains the priority."}`,
    commercialAngle,
    longWeekendReminder,
    managementFocus,
  };
}

export default function WedgeIPage() {
  const [businessType, setBusinessType] = useState<BusinessType>("Retail");
  const [companyName, setCompanyName] = useState("");
  const [revenue, setRevenue] = useState("");
  const [expenses, setExpenses] = useState("");
  const [payroll, setPayroll] = useState("");
  const [staffCount, setStaffCount] = useState("");
  const [cash, setCash] = useState("");
  const [inventory, setInventory] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const benchmark = useMemo(() => benchmarks[businessType], [businessType]);

  function toNumber(value: string) {
    return Number(value || 0);
  }

  function formatRM(value: number) {
    return `RM ${Math.round(value).toLocaleString()}`;
  }

  function getRating(score: number) {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Healthy";
    if (score >= 50) return "Watch Closely";
    return "Critical";
  }

  function getIndustryBenchmark(score: number) {
    if (score >= 85) return "Above average Malaysian SME benchmark";
    if (score >= 70) return "Within healthy Malaysian SME benchmark";
    if (score >= 50) return "Below target but recoverable";
    return "Immediate management attention required";
  }

  function getIndustryAdvisor(
    type: BusinessType,
    rhythm: MalaysiaRhythm,
    labourPercent: number,
    profitMargin: number,
    cashRunwayMonths: number,
    inventoryPressure: number,
  ) {
    const advisor: string[] = [];
    const agenda: string[] = [];
    const indicators: string[] = [];

    advisor.push(rhythm.commercialAngle);
    advisor.push(rhythm.longWeekendReminder);

    if (type === "F&B") {
      advisor.push("Improve average receipt through family sets, add-ons, drink bundles or limited-time menu combinations.");
      advisor.push("Review food wastage, delivery platform commission and best-selling menu margin before increasing discounts.");
      advisor.push("Adjust manpower by lunch, dinner and weekend sales pattern instead of using a flat roster.");

      agenda.push("Daily sales versus target.");
      agenda.push("Average receipt per customer.");
      agenda.push("Best-selling and lowest-margin menu items.");
      agenda.push("Food wastage and kitchen cost.");
      agenda.push("Stock and supply readiness for peak trading days.");
      agenda.push("Labour percentage by shift.");

      indicators.push("Daily sales trend");
      indicators.push("Average receipt");
      indicators.push("Labour % versus sales");
      indicators.push("Food cost / wastage");
    }

    if (type === "Beauty / Aesthetic / Medical") {
      advisor.push("Increase gross profit by bundling treatments with home-care products or prepaid packages.");
      advisor.push("Use WhatsApp follow-up for clients due for repeat treatment, review or product refill.");
      advisor.push("Review therapist, consultant or room utilisation before hiring additional staff.");

      agenda.push("Average spend per client.");
      agenda.push("Treatment package conversion.");
      agenda.push("Product attachment rate.");
      agenda.push("Client revisit and WhatsApp follow-up list.");
      agenda.push("Premium service upsell performance.");
      agenda.push("Therapist / consultant utilisation.");

      indicators.push("Revenue per therapist");
      indicators.push("Product attachment rate");
      indicators.push("Package sales");
      indicators.push("Client return rate");
    }

    if (type === "Manufacturing") {
      advisor.push("Improve debtor collection before increasing production volume or raw material purchases.");
      advisor.push("Review raw material holding, production output, machine downtime and supplier price movement.");
      advisor.push("Prioritise orders with clearer delivery dates and faster payment terms when cash runway is tight.");

      agenda.push("Outstanding invoices above 30 days.");
      agenda.push("Inventory holding days.");
      agenda.push("Supplier price movement.");
      agenda.push("Production efficiency and downtime.");
      agenda.push("Cash collection schedule.");
      agenda.push("Production planning before long weekends.");

      indicators.push("Debtor days");
      indicators.push("Inventory turnover");
      indicators.push("Production output");
      indicators.push("Cash collection trend");
    }

    if (type === "Retail") {
      advisor.push("Review slow-moving inventory and create bundles without discounting high-margin products too aggressively.");
      advisor.push("Improve basket size through add-ons, sets and counter recommendations.");
      advisor.push("Confirm stock readiness before campaign or long-weekend demand.");

      agenda.push("Slow-moving stock above 60 days.");
      agenda.push("Top margin product categories.");
      agenda.push("Basket size and promotion performance.");
      agenda.push("Campaign stock readiness.");
      agenda.push("Inventory purchase plan.");
      agenda.push("High-margin bundle opportunities.");

      indicators.push("Inventory ageing");
      indicators.push("Revenue by category");
      indicators.push("Gross profit trend");
      indicators.push("Cash position");
    }

    if (type === "Service" || type === "General SME") {
      advisor.push("Increase revenue per staff through premium packages, better pricing or higher-value service bundles.");
      advisor.push("Reduce low-margin work before adding headcount.");
      advisor.push("Track repeat customer frequency and upsell conversion weekly.");

      agenda.push("Revenue per staff member.");
      agenda.push("Premium package conversion.");
      agenda.push("Low-margin jobs or services.");
      agenda.push("Repeat customer pipeline.");
      agenda.push("Weekly sales target by staff.");
      agenda.push("Service bundle opportunities.");

      indicators.push("Revenue per staff");
      indicators.push("Margin efficiency");
      indicators.push("Weekly sales trend");
      indicators.push("Repeat customer rate");
    }

    if (profitMargin < benchmark.healthyMargin) {
      advisor.unshift("Protect gross profit by reviewing pricing, discounts, supplier cost and low-margin items.");
    }

    if (labourPercent > benchmark.idealLabourMax) {
      advisor.unshift("Reduce labour pressure by adjusting roster, overtime and low-sales periods.");
    }

    if (cashRunwayMonths < 1 && type === "F&B") {
      advisor.unshift("Protect cash by controlling food purchases, wastage and low-margin delivery promotions.");
    }

    if (cashRunwayMonths < 1 && type !== "F&B") {
      advisor.unshift("Protect cashflow by delaying non-critical purchases and improving customer collection.");
    }

    if (inventoryPressure > benchmark.inventoryLimit) {
      advisor.unshift("Reduce inventory pressure before buying more stock.");
    }

    return { advisor, agenda, indicators };
  }

  function analyseBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const monthlyRevenue = toNumber(revenue);
    const monthlyExpenses = toNumber(expenses);
    const monthlyPayroll = toNumber(payroll);
    const totalStaff = toNumber(staffCount);
    const cashInBank = toNumber(cash);
    const inventoryValue = toNumber(inventory);

    const operatingCost = monthlyExpenses + monthlyPayroll;
    const monthlyProfit = monthlyRevenue - operatingCost;
    const profitMargin =
      monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;
    const labourPercent =
      monthlyRevenue > 0 ? (monthlyPayroll / monthlyRevenue) * 100 : 0;
    const cashRunwayMonths = operatingCost > 0 ? cashInBank / operatingCost : 0;
    const cashRunwayWeeks = cashRunwayMonths * 4;
    const revenuePerStaff = totalStaff > 0 ? monthlyRevenue / totalStaff : 0;
    const inventoryPressure =
      monthlyRevenue > 0 ? inventoryValue / monthlyRevenue : 0;

    let healthScore = 60;

    if (profitMargin >= benchmark.healthyMargin) healthScore += 18;
    else if (profitMargin > 0) healthScore += 8;
    else healthScore -= 22;

    if (
      labourPercent >= benchmark.idealLabourMin &&
      labourPercent <= benchmark.idealLabourMax
    ) {
      healthScore += 15;
    } else if (labourPercent > benchmark.idealLabourMax) {
      healthScore -= 15;
    }

    if (cashRunwayMonths >= 2) healthScore += 15;
    else if (cashRunwayMonths >= 1) healthScore += 8;
    else if (cashRunwayMonths < 0.5) healthScore -= 18;

    if (inventoryPressure > benchmark.inventoryLimit) healthScore -= 10;
    else healthScore += 5;

    if (revenuePerStaff >= 6000) healthScore += 7;
    else if (totalStaff > 0 && revenuePerStaff < 3500) healthScore -= 8;

    healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

    const rhythm = getMalaysiaBusinessRhythm(new Date(), businessType);

    const q1Revenue = monthlyRevenue * 3;
    const q1Profit = monthlyProfit * 3;
    const q2Revenue = q1Revenue * (1 + benchmark.baseGrowth);
    const q2Profit = q1Profit * (1 + benchmark.baseGrowth + 0.03);
    const q3Revenue = q2Revenue * (1 + benchmark.baseGrowth + 0.04);
    const q3Profit = q2Profit * (1 + benchmark.baseGrowth + 0.07);

    const industry = getIndustryAdvisor(
      businessType,
      rhythm,
      labourPercent,
      profitMargin,
      cashRunwayMonths,
      inventoryPressure,
    );

    const rating = getRating(healthScore);
    const industryBenchmark = getIndustryBenchmark(healthScore);

    const cashflowStatus =
      cashRunwayMonths >= 2
        ? "Strong"
        : cashRunwayMonths >= 1
        ? "Healthy"
        : cashRunwayMonths >= 0.5
        ? "Watch Closely"
        : "Critical";

    const businessLabel = companyName || "This business";

    const executiveSummary =
      healthScore >= 85
        ? `${businessLabel} is performing strongly for a Malaysian ${businessType} business. Revenue quality, labour discipline and cash position are within a healthy operating range. Management should focus on controlled growth, stronger campaigns and higher gross profit per customer.`
        : healthScore >= 70
        ? `${businessLabel} remains in a healthy operating position. The next quarter should focus on protecting margin, improving cash discipline and executing industry-specific sales actions before expanding fixed cost.`
        : healthScore >= 50
        ? `${businessLabel} is stable but exposed. Management should review labour cost, inventory pressure, cash movement and weekly sales quality before adding new commitments.`
        : `${businessLabel} requires immediate management attention. The priority is cash protection, margin recovery and weekly sales action before hiring, expanding or buying more stock.`;

    setResult({
      preparedDate: new Date().toLocaleDateString("en-MY", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      healthScore,
      rating,
      industryBenchmark,
      confidenceScore: Math.min(96, Math.max(72, healthScore + 6)),
      cashflowStatus,
      labourPercent: Math.round(labourPercent),
      profitMargin: Math.round(profitMargin),
      monthlyProfit,
      operatingCost,
      revenuePerStaff,
      cashRunwayWeeks,
      rhythm,
      scenarios: [
        {
          label: "Q1 Performance",
          revenue: q1Revenue,
          profit: q1Profit,
          cash: cashInBank,
          status: monthlyProfit >= 0 ? "On Track" : "Margin Recovery Required",
          commentary:
            monthlyProfit >= 0
              ? "Current quarter performance remains supported by positive operating profit."
              : "Current quarter requires cost control and revenue recovery.",
        },
        {
          label: "Q2 Management Outlook",
          revenue: q2Revenue,
          profit: q2Profit,
          cash: cashInBank + q2Profit,
          status: "Base Forecast",
          commentary: rhythm.managementFocus,
        },
        {
          label: "Q3 Growth Projection",
          revenue: q3Revenue,
          profit: q3Profit,
          cash: cashInBank + q2Profit + q3Profit,
          status: "Growth Case",
          commentary:
            "Projection assumes improved customer value, stable labour cost and stronger campaign conversion.",
        },
      ],
      executiveSummary,
      performanceIndicators: industry.indicators.slice(0, 4),
      malaysianAdvisor: industry.advisor.slice(0, 6),
      nextMeetingAgenda: industry.agenda.slice(0, 6),
    });
  }

  return (
    <main className="min-h-screen bg-[#101416] text-[#f4efe6]">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <a href="/" className="text-sm text-[#d4ad63] hover:underline">
          ← Back to WedgeCLOCKin
        </a>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-[#d4ad63]/30 bg-[#1e2428] p-8">
            <p className="text-sm tracking-[0.3em] text-[#d4ad63]">WEDGE-CEO</p>

            <h1 className="mt-4 text-4xl font-bold text-[#f0dfbd]">
              Executive Business Intelligence
            </h1>

            <p className="mt-4 text-white/60">
              Key in your numbers once. Wedge-CEO will generate a simplified
              executive report with key numbers, Malaysian business rhythm,
              management outlook and next meeting agenda.
            </p>

            <form onSubmit={analyseBusiness} className="mt-8 space-y-4">
              <input
                type="text"
                placeholder="Company Name"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none focus:border-[#d4ad63]"
              />

              <select
                value={businessType}
                onChange={(event) =>
                  setBusinessType(event.target.value as BusinessType)
                }
                className="w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white"
              >
                <option>Retail</option>
                <option>F&B</option>
                <option>Beauty / Aesthetic / Medical</option>
                <option>Service</option>
                <option>Manufacturing</option>
                <option>General SME</option>
              </select>

              {[
                ["Monthly Revenue", revenue, setRevenue],
                ["Monthly Expenses", expenses, setExpenses],
                ["Payroll Cost", payroll, setPayroll],
                ["Staff Count", staffCount, setStaffCount],
                ["Cash In Bank", cash, setCash],
                ["Inventory Value", inventory, setInventory],
              ].map(([label, value, setter]) => (
                <input
                  key={label as string}
                  type="number"
                  placeholder={label as string}
                  value={value as string}
                  onChange={(event) =>
                    (setter as (value: string) => void)(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none focus:border-[#d4ad63]"
                />
              ))}

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  "CEO Confidence Index",
                  "Cash Position",
                  "Management Outlook",
                  "Labour Intelligence",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/55"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-[#d4ad63] px-8 py-4 font-bold text-black hover:bg-[#e4bf75]"
              >
                Analyse My Business
              </button>
            </form>
          </div>

          <div className="rounded-[2rem] border border-[#d4ad63]/20 bg-[#1e2428] p-8">
            <p className="text-sm tracking-[0.3em] text-[#d4ad63]">
              WEDGE-CEO EXECUTIVE REPORT
            </p>

            {!result ? (
              <p className="mt-6 text-white/55">
                Your executive report will appear here after analysis.
              </p>
            ) : (
              <div className="mt-6 space-y-5">
                <div className="rounded-2xl border border-[#d4ad63]/25 bg-[#101416] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm text-white/45">CEO Confidence Index</p>
                      <p className="mt-2 text-5xl font-bold text-[#d4ad63]">
                        {result.healthScore} / 100
                      </p>
                      <p className="mt-1 text-white/55">{result.rating}</p>
                    </div>

                    <div className="text-sm text-white/50 sm:text-right">
                      <p>Prepared: {result.preparedDate}</p>
                      <p>{result.industryBenchmark}</p>
                      <p>Forecast confidence: {result.confidenceScore}%</p>
                      <p>{result.rhythm.quarterName}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/5 p-5">
                    <p className="text-white/45">Revenue</p>
                    <p className="mt-2 text-2xl font-bold">
                      {formatRM(toNumber(revenue))}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-5">
                    <p className="text-white/45">Operating Cost</p>
                    <p className="mt-2 text-2xl font-bold">
                      {formatRM(result.operatingCost)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-5">
                    <p className="text-white/45">Operating Profit</p>
                    <p className="mt-2 text-2xl font-bold">
                      {formatRM(result.monthlyProfit)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-5">
                    <p className="text-white/45">Cash Runway</p>
                    <p className="mt-2 text-2xl font-bold">
                      {result.cashRunwayWeeks.toFixed(1)} weeks
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 p-5">
                  <p className="font-bold text-[#f0dfbd]">Executive Summary</p>
                  <p className="mt-3 text-white/60">{result.executiveSummary}</p>
                </div>

                <div className="rounded-2xl bg-white/5 p-5">
                  <p className="font-bold text-[#f0dfbd]">
                    Malaysia Business Rhythm
                  </p>
                  <p className="mt-3 text-white/60">{result.rhythm.rhythmNote}</p>
                  <p className="mt-3 text-white/60">
                    {result.rhythm.managementFocus}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 p-5">
                  <p className="font-bold text-[#f0dfbd]">Management Outlook</p>

                  <div className="mt-4 space-y-3">
                    {result.scenarios.map((scenario) => (
                      <div
                        key={scenario.label}
                        className="rounded-xl border border-white/10 bg-[#101416] p-4"
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-semibold text-[#d4ad63]">
                            {scenario.label}
                          </p>
                          <p className="text-sm text-white/45">{scenario.status}</p>
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <p className="text-sm text-white/55">
                            Revenue
                            <br />
                            <span className="font-bold text-[#f0dfbd]">
                              {formatRM(scenario.revenue)}
                            </span>
                          </p>

                          <p className="text-sm text-white/55">
                            Profit
                            <br />
                            <span className="font-bold text-[#f0dfbd]">
                              {formatRM(scenario.profit)}
                            </span>
                          </p>

                          <p className="text-sm text-white/55">
                            Cash
                            <br />
                            <span className="font-bold text-[#f0dfbd]">
                              {formatRM(scenario.cash)}
                            </span>
                          </p>
                        </div>

                        <p className="mt-3 text-sm text-white/50">
                          {scenario.commentary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 p-5">
                  <p className="font-bold text-[#f0dfbd]">
                    Executive Performance Indicators
                  </p>

                  <ul className="mt-3 list-disc space-y-2 pl-5 text-white/60">
                    {result.performanceIndicators.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl bg-white/5 p-5">
                  <p className="font-bold text-[#f0dfbd]">
                    Malaysian Business Advisor
                  </p>

                  <ul className="mt-3 list-disc space-y-2 pl-5 text-white/60">
                    {result.malaysianAdvisor.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl bg-white/5 p-5">
                  <p className="font-bold text-[#f0dfbd]">
                    Next Meeting Agenda
                  </p>

                  <ul className="mt-3 list-disc space-y-2 pl-5 text-white/60">
                    {result.nextMeetingAgenda.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-[#d4ad63]/30 bg-[#101416] p-5">
                  <p className="font-bold text-[#f0dfbd]">
                    Generated by Wedge-CEO
                  </p>
                  <p className="mt-3 text-sm text-white/55">
                    Weekly executive brief, WhatsApp reminders, PDF board report,
                    historical trend and action tracking will be available after
                    subscription.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}