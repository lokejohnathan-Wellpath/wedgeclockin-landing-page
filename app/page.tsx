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
};

type Result = {
  healthScore: number;
  rating: string;
  cashflowStatus: string;
  labourPercent: number;
  profitMargin: number;
  monthlyProfit: number;
  revenuePerStaff: number;
  scenarios: Scenario[];
  executiveSummary: string;
  chartSuggestions: string[];
  nextWeekActions: string[];
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

  function getIndustryActions(
    type: BusinessType,
    labourPercent: number,
    profitMargin: number,
    cashRunway: number,
    inventoryPressure: number,
  ) {
    const actions: string[] = [];
    const agenda: string[] = [];
    const charts: string[] = [];

    if (type === "F&B") {
      actions.push("Prepare a Merdeka combo set or family meal promo to lift average receipt.");
      actions.push("Compare weekday vs weekend daily sales and adjust manpower by shift.");
      actions.push("Review food wastage, delivery platform commission, and best-selling menu margin.");

      agenda.push("Daily sales vs target.");
      agenda.push("Average receipt per customer.");
      agenda.push("Best-selling and lowest-margin menu items.");
      agenda.push("Food wastage and kitchen cost.");
      agenda.push("Merdeka promotion readiness.");

      charts.push("Daily Sales Trend");
      charts.push("Average Receipt");
      charts.push("Labour % vs Sales");
      charts.push("Food Cost / Wastage");
    }

    if (type === "Beauty / Aesthetic / Medical") {
      actions.push("Create treatment + product bundles to increase gross profit without increasing ad spend.");
      actions.push("Push prepaid packages, return visits, and home-care product attachment.");
      actions.push("Review therapist or consultant utilisation before hiring more staff.");

      agenda.push("Average spend per client.");
      agenda.push("Treatment package conversion.");
      agenda.push("Product attachment rate.");
      agenda.push("Client revisit and WhatsApp follow-up list.");
      agenda.push("Premium service upsell performance.");

      charts.push("Revenue per Therapist");
      charts.push("Product Attachment Rate");
      charts.push("Package Sales");
      charts.push("Client Return Rate");
    }

    if (type === "Manufacturing") {
      actions.push("Follow up overdue invoices and improve debtor collection before increasing production volume.");
      actions.push("Review raw material holding, production output, and supplier pricing.");
      actions.push("Identify machine downtime or production bottlenecks affecting margin.");

      agenda.push("Outstanding invoices above 30 days.");
      agenda.push("Inventory holding days.");
      agenda.push("Supplier price movement.");
      agenda.push("Production efficiency and downtime.");
      agenda.push("Cash collection schedule.");

      charts.push("Debtor Days");
      charts.push("Inventory Turnover");
      charts.push("Production Output");
      charts.push("Cash Collection Trend");
    }

    if (type === "Retail") {
      actions.push("Prepare a Merdeka clearance campaign for slow-moving stock.");
      actions.push("Protect high-margin products while using bundles to increase basket size.");
      actions.push("Review inventory ageing before placing the next purchase order.");

      agenda.push("Slow-moving stock above 60 days.");
      agenda.push("Top margin product categories.");
      agenda.push("Basket size and promotion performance.");
      agenda.push("Merdeka campaign stock readiness.");
      agenda.push("Inventory purchase plan.");

      charts.push("Inventory Ageing");
      charts.push("Revenue by Category");
      charts.push("Gross Profit Trend");
      charts.push("Cash Position");
    }

    if (type === "Service" || type === "General SME") {
      actions.push("Increase revenue per staff through premium packages or higher-value service bundles.");
      actions.push("Review pricing and reduce low-margin work before adding headcount.");
      actions.push("Track repeat customer frequency and upsell conversion weekly.");

      agenda.push("Revenue per staff member.");
      agenda.push("Premium package conversion.");
      agenda.push("Low-margin jobs or services.");
      agenda.push("Repeat customer pipeline.");
      agenda.push("Weekly sales target by staff.");

      charts.push("Revenue per Staff");
      charts.push("Margin Efficiency");
      charts.push("Weekly Sales Trend");
      charts.push("Repeat Customer Rate");
    }

    if (profitMargin < benchmark.healthyMargin) {
      actions.unshift("Protect gross profit by reviewing pricing, discounts, supplier cost, and low-margin items.");
    }

    if (labourPercent > benchmark.idealLabourMax) {
      actions.unshift("Reduce labour pressure by adjusting roster, overtime, and low-sales shifts.");
    }

    if (cashRunway < 1 && type !== "F&B") {
      actions.unshift("Protect cashflow by delaying non-critical purchases and speeding up customer collections.");
    }

    if (cashRunway < 1 && type === "F&B") {
      actions.unshift("Protect cashflow by controlling food purchases, wastage, and low-margin delivery promotions.");
    }

    if (inventoryPressure > benchmark.inventoryLimit) {
      actions.unshift("Reduce inventory pressure before buying more stock.");
    }

    return {
      actions,
      agenda,
      charts,
    };
  }

  function analyseBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const monthlyRevenue = toNumber(revenue);
    const monthlyExpenses = toNumber(expenses);
    const monthlyPayroll = toNumber(payroll);
    const totalStaff = toNumber(staffCount);
    const cashInBank = toNumber(cash);
    const inventoryValue = toNumber(inventory);

    const totalCost = monthlyExpenses + monthlyPayroll;
    const monthlyProfit = monthlyRevenue - totalCost;
    const profitMargin =
      monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;
    const labourPercent =
      monthlyRevenue > 0 ? (monthlyPayroll / monthlyRevenue) * 100 : 0;
    const cashRunway = totalCost > 0 ? cashInBank / totalCost : 0;
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

    if (cashRunway >= 2) healthScore += 15;
    else if (cashRunway >= 1) healthScore += 8;
    else if (cashRunway < 0.5) healthScore -= 18;

    if (inventoryPressure > benchmark.inventoryLimit) healthScore -= 10;
    else healthScore += 5;

    if (revenuePerStaff >= 6000) healthScore += 7;
    else if (totalStaff > 0 && revenuePerStaff < 3500) healthScore -= 8;

    healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

    const q1Revenue = monthlyRevenue * 3;
    const q1Profit = monthlyProfit * 3;
    const q2Revenue = q1Revenue * (1 + benchmark.baseGrowth);
    const q2Profit = q1Profit * (1 + benchmark.baseGrowth + 0.03);
    const q3Revenue = q2Revenue * (1 + benchmark.baseGrowth + 0.04);
    const q3Profit = q2Profit * (1 + benchmark.baseGrowth + 0.07);

    const industry = getIndustryActions(
      businessType,
      labourPercent,
      profitMargin,
      cashRunway,
      inventoryPressure,
    );

    const rating =
      healthScore >= 85
        ? "Excellent"
        : healthScore >= 70
        ? "Healthy"
        : healthScore >= 50
        ? "Watch Closely"
        : "Critical";

    const cashflowStatus =
      cashRunway >= 2
        ? "Strong"
        : cashRunway >= 1
        ? "Healthy"
        : cashRunway >= 0.5
        ? "Watch Closely"
        : "Critical";

    const businessLabel = companyName || "This business";

    const executiveSummary =
      healthScore >= 85
        ? `Wedge-CEO view: ${businessLabel} is performing strongly for a Malaysian ${businessType} business. Labour, cashflow and margin are within a healthy range. The next move is controlled growth, stronger campaigns and better gross profit per customer.`
        : healthScore >= 70
        ? `Wedge-CEO view: ${businessLabel} is healthy, but the next quarter should focus on margin discipline, cash runway and industry-specific sales improvement. This is not the time to over-expand yet.`
        : healthScore >= 50
        ? `Wedge-CEO view: ${businessLabel} is stable but exposed. The business should review labour cost, inventory pressure, cash movement and weekly sales quality before adding new commitments.`
        : `Wedge-CEO view: ${businessLabel} needs immediate attention. Focus on cash protection, margin recovery and weekly sales action before hiring, expanding or buying more stock.`;

    setResult({
      healthScore,
      rating,
      cashflowStatus,
      labourPercent: Math.round(labourPercent),
      profitMargin: Math.round(profitMargin),
      monthlyProfit,
      revenuePerStaff,
      scenarios: [
        {
          label: "Q1 Current",
          revenue: q1Revenue,
          profit: q1Profit,
          cash: cashInBank,
        },
        {
          label: "Q2 Base Forecast",
          revenue: q2Revenue,
          profit: q2Profit,
          cash: cashInBank + q2Profit,
        },
        {
          label: "Q3 Growth Projection",
          revenue: q3Revenue,
          profit: q3Profit,
          cash: cashInBank + q2Profit + q3Profit,
        },
      ],
      executiveSummary,
      chartSuggestions: industry.charts,
      nextWeekActions: industry.actions.slice(0, 5),
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
            <p className="text-sm tracking-[0.3em] text-[#d4ad63]">WEDGE-I</p>

            <h1 className="mt-4 text-4xl font-bold text-[#f0dfbd]">
              Analyse My Business
            </h1>

            <p className="mt-4 text-white/60">
              Key in your numbers once. Wedge-CEO will generate a Malaysian
              SME-style executive report with forecast, chart ideas, next-week
              actions and next meeting agenda.
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
                  "Business Health Score",
                  "Cashflow Analysis",
                  "Profit Forecast",
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
              WEDGE-CEO CHART
            </p>

            {!result ? (
              <p className="mt-6 text-white/55">
                Your Wedge-CEO executive report will appear here after analysis.
              </p>
            ) : (
              <div className="mt-6 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/5 p-5">
                    <p className="text-white/45">Business Health</p>
                    <p className="mt-2 text-4xl font-bold text-[#d4ad63]">
                      {result.healthScore} / 100
                    </p>
                    <p className="mt-1 text-white/45">
                      {result.rating} — Malaysian SME benchmark view
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-5">
                    <p className="text-white/45">Cashflow</p>
                    <p className="mt-2 text-2xl font-bold">
                      {result.cashflowStatus}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-5">
                    <p className="text-white/45">Monthly Profit</p>
                    <p className="mt-2 text-2xl font-bold">
                      {formatRM(result.monthlyProfit)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-5">
                    <p className="text-white/45">Labour Cost</p>
                    <p className="mt-2 text-2xl font-bold">
                      {result.labourPercent}%
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 p-5">
                  <p className="font-bold text-[#f0dfbd]">
                    Quarterly Financial Results
                  </p>

                  <div className="mt-4 space-y-3">
                    {result.scenarios.map((scenario) => (
                      <div
                        key={scenario.label}
                        className="rounded-xl border border-white/10 bg-[#101416] p-4"
                      >
                        <p className="font-semibold text-[#d4ad63]">
                          {scenario.label}
                        </p>

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
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 p-5">
                  <p className="font-bold text-[#f0dfbd]">Executive Summary</p>
                  <p className="mt-3 text-white/60">
                    {result.executiveSummary}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 p-5">
                  <p className="font-bold text-[#f0dfbd]">
                    Wedge-CEO Recommended Executive Charts
                  </p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-white/60">
                    {result.chartSuggestions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl bg-white/5 p-5">
                  <p className="font-bold text-[#f0dfbd]">
                    Next Week Improvement Areas
                  </p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-white/60">
                    {result.nextWeekActions.map((item) => (
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
                    Subscribe to Save Report
                  </p>
                  <p className="mt-3 text-sm text-white/55">
                    Coming next: save this report by email and receive weekly
                    WhatsApp reminders, CEO meeting agenda follow-ups and
                    improvement tracking.
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