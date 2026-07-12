"use client";
import { ExecutiveCharts } from "./components/ExecutiveCharts";
import { FormEvent, useState } from "react";

import type { BusinessType } from "./engine/benchmarks";
import {
  generateWedgeCeoReport,
  type WedgeCeoReport,
} from "./engine/wedgeCeoEngine";

type FormState = {
  companyName: string;
  businessType: BusinessType;
  monthlyRevenue: string;
  monthlyExpenses: string;
  monthlyPayroll: string;
  staffCount: string;
  cashInBank: string;
  inventoryValue: string;
};

const initialFormState: FormState = {
  companyName: "",
  businessType: "Retail",
  monthlyRevenue: "",
  monthlyExpenses: "",
  monthlyPayroll: "",
  staffCount: "",
  cashInBank: "",
  inventoryValue: "",
};

const businessTypes: BusinessType[] = [
  "Retail",
  "F&B",
  "Beauty / Aesthetic / Medical",
  "Service",
  "Manufacturing",
  "General SME",
];

export default function WedgeIPage() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [report, setReport] = useState<WedgeCeoReport | null>(null);
  const [error, setError] = useState("");

  function updateField<Key extends keyof FormState>(
    key: Key,
    value: FormState[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function analyseBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const monthlyRevenue = parseNumber(form.monthlyRevenue);
    const monthlyExpenses = parseNumber(form.monthlyExpenses);
    const monthlyPayroll = parseNumber(form.monthlyPayroll);
    const staffCount = parseNumber(form.staffCount);
    const cashInBank = parseNumber(form.cashInBank);
    const inventoryValue = parseNumber(form.inventoryValue);

    if (!form.companyName.trim()) {
      setError("Please enter the company name.");
      return;
    }

    if (monthlyRevenue <= 0) {
      setError("Monthly revenue must be greater than zero.");
      return;
    }

    if (staffCount <= 0) {
      setError("Staff count must be greater than zero.");
      return;
    }

    const generatedReport = generateWedgeCeoReport({
      companyName: form.companyName,
      businessType: form.businessType,
      monthlyRevenue,
      monthlyExpenses,
      monthlyPayroll,
      staffCount,
      cashInBank,
      inventoryValue,
    });

    setReport(generatedReport);

    window.requestAnimationFrame(() => {
      document
        .getElementById("executive-report")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <main className="min-h-screen bg-[#090d10] text-[#f4efe6]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(183,145,80,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(72,89,91,0.13),transparent_30%)]" />

      <section className="relative mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <a
              href="/"
              className="text-sm font-medium text-[#c8a467] transition hover:text-[#ead3a8]"
            >
              ← Back to WedgeCLOCKin
            </a>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#c8a467]/40 bg-[#c8a467]/10 font-bold text-[#d9b979]">
                W
              </div>

              <div>
                <p className="text-xs font-semibold tracking-[0.32em] text-[#c8a467]">
                  WEDGE-CEO
                </p>
                <p className="mt-1 text-sm text-white/45">
                  Executive Intelligence for Malaysian SMEs
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-2 text-xs tracking-[0.16em] text-white/45">
            PRIVATE EXECUTIVE DESK
          </div>
        </header>

        <div className="mt-8 grid gap-8 xl:grid-cols-[410px_minmax(0,1fr)]">
          <aside className="self-start xl:sticky xl:top-8">
            <div className="overflow-hidden rounded-[28px] border border-[#c8a467]/20 bg-[#12181c]/95 shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
              <div className="border-b border-white/10 px-7 py-7">
                <p className="text-xs font-semibold tracking-[0.3em] text-[#c8a467]">
                  BUSINESS INPUT
                </p>

                <h1 className="mt-4 text-3xl font-semibold leading-tight text-[#f1dfbc]">
                  Prepare your executive review
                </h1>

                <p className="mt-4 text-sm leading-6 text-white/50">
                  Enter the latest monthly management numbers. Wedge-CEO will
                  produce a live financial analysis, quarterly outlook,
                  executive commentary, advisor priorities and meeting agenda.
                </p>
              </div>

              <form onSubmit={analyseBusiness} className="space-y-5 p-7">
                <FieldLabel label="Company name">
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(event) =>
                      updateField("companyName", event.target.value)
                    }
                    placeholder="Example: ABC Retail Sdn Bhd"
                    className={inputClassName}
                  />
                </FieldLabel>

                <FieldLabel label="Business type">
                  <select
                    value={form.businessType}
                    onChange={(event) =>
                      updateField(
                        "businessType",
                        event.target.value as BusinessType,
                      )
                    }
                    className={inputClassName}
                  >
                    {businessTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </FieldLabel>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <NumberField
                    label="Monthly revenue"
                    value={form.monthlyRevenue}
                    onChange={(value) =>
                      updateField("monthlyRevenue", value)
                    }
                  />

                  <NumberField
                    label="Monthly expenses"
                    value={form.monthlyExpenses}
                    onChange={(value) =>
                      updateField("monthlyExpenses", value)
                    }
                  />

                  <NumberField
                    label="Payroll cost"
                    value={form.monthlyPayroll}
                    onChange={(value) =>
                      updateField("monthlyPayroll", value)
                    }
                  />

                  <NumberField
                    label="Staff count"
                    value={form.staffCount}
                    onChange={(value) => updateField("staffCount", value)}
                    step="1"
                  />

                  <NumberField
                    label="Cash in bank"
                    value={form.cashInBank}
                    onChange={(value) =>
                      updateField("cashInBank", value)
                    }
                  />

                  <NumberField
                    label="Inventory value"
                    value={form.inventoryValue}
                    onChange={(value) =>
                      updateField("inventoryValue", value)
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    "Financial Health",
                    "Cash Strength",
                    "Quarter Outlook",
                    "Meeting Agenda",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-white/8 bg-white/[0.025] px-3 py-3 text-xs text-white/40"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                {error ? (
                  <div className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#c8a467] px-6 py-4 text-sm font-bold tracking-[0.08em] text-[#111416] transition hover:bg-[#dfbd7c] focus:outline-none focus:ring-2 focus:ring-[#c8a467]/50"
                >
                  GENERATE EXECUTIVE REPORT
                </button>

                <p className="text-center text-xs leading-5 text-white/30">
                  Current preview runs securely in this browser session. No
                  company information is saved.
                </p>
              </form>
            </div>
          </aside>

          <section
            id="executive-report"
            className="min-w-0 scroll-mt-8"
          >
            {!report ? (
              <ExecutiveEmptyState />
            ) : (
              <ExecutiveReport report={report} />
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function ExecutiveEmptyState() {
  return (
    <div className="flex min-h-[720px] items-center justify-center rounded-[32px] border border-white/10 bg-[#10161a]/75 p-8 shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
      <div className="max-w-xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#c8a467]/30 bg-[#c8a467]/10 text-2xl font-semibold text-[#d9b979]">
          CEO
        </div>

        <p className="mt-8 text-xs font-semibold tracking-[0.32em] text-[#c8a467]">
          WEDGE-CEO EXECUTIVE REPORT
        </p>

        <h2 className="mt-5 text-4xl font-semibold leading-tight text-[#f1dfbc]">
          Your boardroom view will appear here
        </h2>

        <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-white/45">
          Complete the business input once. Wedge-CEO will turn the numbers
          into a structured management review designed for fast executive
          reading.
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            ["01", "Analyse"],
            ["02", "Forecast"],
            ["03", "Decide"],
          ].map(([number, label]) => (
            <div
              key={number}
              className="rounded-2xl border border-white/8 bg-white/[0.025] p-5"
            >
              <p className="text-xs text-[#c8a467]">{number}</p>
              <p className="mt-2 text-sm font-medium text-white/60">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExecutiveReport({ report }: { report: WedgeCeoReport }) {
  const quarterly = report.quarterlyReport;
  const health = quarterly.businessHealth;
  const financialMetrics = quarterly.financialHighlights.metrics;
  const keyMetrics = financialMetrics.filter((metric) =>
    [
      "revenue",
      "operating-profit",
      "profit-margin",
      "cash-runway",
      "labour-ratio",
      "revenue-per-staff",
    ].includes(metric.key),
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-[#c8a467]/20 bg-[#11171b] shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
        <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(200,164,103,0.12),transparent_58%)] p-7 sm:p-9">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.32em] text-[#c8a467]">
                QUARTERLY EXECUTIVE REVIEW
              </p>

              <h2 className="mt-4 text-3xl font-semibold text-[#f2dfb9] sm:text-4xl">
                {quarterly.companyName}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
                {quarterly.businessType} · {quarterly.reportingPeriod}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-7 gap-y-3 text-sm lg:text-right">
              <MetaValue label="Prepared" value={quarterly.preparedDate} />
              <MetaValue
                label="Forecast confidence"
                value={`${quarterly.quarterlyOutlook.forecastConfidence}%`}
              />
              <MetaValue label="Trend" value={health.trend} />
              <MetaValue
                label="Report ID"
                value={quarterly.reportId}
                compact
              />
            </div>
          </div>

          <div className="mt-9 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="rounded-2xl border border-[#c8a467]/25 bg-[#0b1013]/80 p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                Business Health
              </p>

              <p className="mt-4 text-6xl font-semibold tracking-tight text-[#d8b778]">
                {health.score}
              </p>

              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#c8a467]"
                  style={{ width: `${health.score}%` }}
                />
              </div>

              <p className="mt-4 text-sm font-semibold text-[#f1dfbc]">
                {health.status}
              </p>

              <p className="mt-1 text-xs leading-5 text-white/40">
                {health.benchmarkPosition}
              </p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-6">
              <SectionEyebrow>Executive Summary</SectionEyebrow>

              <p className="mt-4 text-lg leading-8 text-white/72">
                {quarterly.executiveSummary}
              </p>

              <div className="mt-6 border-t border-white/8 pt-5">
                <p className="text-sm leading-6 text-white/45">
                  {health.commentary}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-7 sm:p-9">
          <SectionHeading
            eyebrow="KEY NUMBERS"
            title="Financial snapshot"
            description={quarterly.financialHighlights.headline}
          />

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {keyMetrics.map((metric) => (
              <MetricCard
                key={metric.key}
                label={metric.label}
                value={metric.formattedValue}
                status={metric.status}
                commentary={metric.commentary}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-[#11171b] p-7 shadow-[0_25px_70px_rgba(0,0,0,0.25)] sm:p-9">
        <SectionHeading
          eyebrow="MANAGEMENT OUTLOOK"
          title="Quarterly performance and forecast"
          description={quarterly.quarterlyOutlook.summary}
        />

        <div className="mt-7 grid gap-4 xl:grid-cols-3">
          {quarterly.quarterlyOutlook.periods.map((period) => (
            <article
              key={period.key}
              className="rounded-2xl border border-white/8 bg-[#0c1215] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-[#c8a467]">
                    {period.label}
                  </p>
                  <p className="mt-2 text-sm text-white/35">
                    {period.period}
                  </p>
                </div>

                <StatusPill status={period.status} />
              </div>

              <div className="mt-6 space-y-4">
                <ValueRow
                  label="Revenue"
                  value={formatRM(period.revenue)}
                />
                <ValueRow
                  label="Operating profit"
                  value={formatRM(period.operatingProfit)}
                />
                <ValueRow
                  label="Cash position"
                  value={formatRM(period.cashPosition)}
                />
                <ValueRow
                  label="Growth"
                  value={`${period.growthRate}%`}
                />
              </div>

              <p className="mt-6 border-t border-white/8 pt-5 text-sm leading-6 text-white/42">
                {period.commentary}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-7">
  <ExecutiveCharts chartData={quarterly.chartData} />
</div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ReportPanel
          eyebrow="MANAGEMENT COMMENTARY"
          title="Executive observation"
        >
          <p className="text-base leading-7 text-white/65">
            {quarterly.managementCommentary.ceoObservation}
          </p>

          <div className="mt-6 rounded-2xl border border-white/8 bg-black/10 p-5">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#c8a467]">
              MANAGEMENT CONCLUSION
            </p>
            <p className="mt-3 text-sm leading-6 text-white/50">
              {quarterly.managementCommentary.managementConclusion}
            </p>
          </div>
        </ReportPanel>

        <ReportPanel
          eyebrow="MALAYSIA BUSINESS RHYTHM"
          title={quarterly.malaysiaBusinessRhythm.rhythmName}
        >
          <p className="text-base leading-7 text-white/65">
            {quarterly.malaysiaBusinessRhythm.commercialSignal}
          </p>

          <div className="mt-5 space-y-4 border-t border-white/8 pt-5">
            <InsightRow
              label="Operations"
              text={quarterly.malaysiaBusinessRhythm.operationalSignal}
            />
            <InsightRow
              label="Long weekend"
              text={quarterly.malaysiaBusinessRhythm.longWeekendSignal}
            />
            <InsightRow
              label="Management"
              text={quarterly.malaysiaBusinessRhythm.managementFocus}
            />
          </div>
        </ReportPanel>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-[#11171b] p-7 shadow-[0_25px_70px_rgba(0,0,0,0.25)] sm:p-9">
        <SectionHeading
          eyebrow="EXECUTIVE ADVISOR"
          title="Ranked management recommendations"
          description={quarterly.executiveAdvisor.primaryFocus}
        />

        <div className="mt-7 space-y-4">
          {quarterly.executiveAdvisor.recommendations
            .slice(0, 6)
            .map((recommendation, index) => (
              <article
                key={`${recommendation.title}-${index}`}
                className="grid gap-5 rounded-2xl border border-white/8 bg-[#0c1215] p-5 lg:grid-cols-[48px_150px_minmax(0,1fr)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c8a467]/25 bg-[#c8a467]/10 text-sm font-bold text-[#d7b576]">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/30">
                    {recommendation.category}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#f0ddb8]">
                    {recommendation.priority}
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-white/85">
                    {recommendation.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/55">
                    {recommendation.action}
                  </p>
                  <p className="mt-3 text-xs leading-5 text-white/30">
                    Why: {recommendation.reason}
                  </p>
                </div>
              </article>
            ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <ReportPanel eyebrow="BUSINESS RISKS" title="Management watchlist">
          <div className="space-y-4">
            {quarterly.businessRisks.map((risk) => (
              <div
                key={risk.id}
                className="rounded-2xl border border-white/8 bg-black/10 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white/75">
                    {risk.area}
                  </p>
                  <StatusPill status={risk.severity} />
                </div>

                <p className="mt-3 text-sm leading-6 text-white/50">
                  {risk.description}
                </p>

                <p className="mt-3 text-xs leading-5 text-[#c8a467]/75">
                  Management response: {risk.managementResponse}
                </p>
              </div>
            ))}
          </div>
        </ReportPanel>

        <ReportPanel
          eyebrow="NEXT MEETING AGENDA"
          title={quarterly.meetingAgenda.meetingTitle}
        >
          <p className="text-sm leading-6 text-white/50">
            {quarterly.meetingAgenda.openingBrief}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <AgendaMeta
              label="Duration"
              value={`${quarterly.meetingAgenda.estimatedDurationMinutes} minutes`}
            />
            <AgendaMeta
              label="Period"
              value={quarterly.meetingAgenda.reportingPeriod}
            />
          </div>

          <div className="mt-6 space-y-3">
            {quarterly.meetingAgenda.agendaItems
              .slice(0, 8)
              .map((item) => (
                <article
                  key={`${item.order}-${item.title}`}
                  className="rounded-2xl border border-white/8 bg-black/10 p-5"
                >
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c8a467]/10 text-xs font-bold text-[#d5b274]">
                      {item.order}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.15em] text-white/28">
                            {item.section}
                          </p>
                          <h3 className="mt-2 font-semibold text-white/80">
                            {item.title}
                          </h3>
                        </div>

                        <p className="text-xs text-[#c8a467]/70">
                          {item.owner}
                        </p>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-white/48">
                        {item.requiredAction}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
          </div>

          <div className="mt-6 rounded-2xl border border-[#c8a467]/20 bg-[#c8a467]/5 p-5">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#c8a467]">
              PRIMARY DECISION
            </p>
            <p className="mt-3 text-sm leading-6 text-white/60">
              {quarterly.meetingAgenda.primaryDecision}
            </p>
          </div>
        </ReportPanel>
      </section>

      <footer className="rounded-[28px] border border-[#c8a467]/16 bg-[#0d1316] px-7 py-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-[#c8a467]">
              GENERATED BY WEDGE-CEO
            </p>
            <p className="mt-2 text-sm text-white/38">
              Executive Business Intelligence for Malaysian SMEs
            </p>
          </div>

          <div className="text-sm text-white/35 sm:text-right">
            <p>Engine version {quarterly.preparedInformation.reportVersion}</p>
            <p className="mt-1">
              Forecast confidence{" "}
              {quarterly.preparedInformation.forecastConfidence}%
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-white/35">
        {label}
      </span>
      {children}
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = "0.01",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: string;
}) {
  return (
    <FieldLabel label={label}>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-white/25">
          {label === "Staff count" ? "#" : "RM"}
        </span>
        <input
          type="number"
          min="0"
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="0"
          className={`${inputClassName} pl-12`}
        />
      </div>
    </FieldLabel>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.26em] text-[#c8a467]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-[#f1dfbc]">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-4xl text-sm leading-6 text-white/42">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-[0.22em] text-[#c8a467]">
      {children}
    </p>
  );
}

function MetricCard({
  label,
  value,
  status,
  commentary,
}: {
  label: string;
  value: string;
  status: string;
  commentary: string;
}) {
  return (
    <article className="rounded-2xl border border-white/8 bg-[#0c1215] p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.15em] text-white/30">
          {label}
        </p>
        <StatusPill status={status} />
      </div>

      <p className="mt-4 text-2xl font-semibold text-[#f0ddb8]">
        {value}
      </p>

      <p className="mt-3 text-xs leading-5 text-white/30">
        {commentary}
      </p>
    </article>
  );
}

function ReportPanel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[#11171b] p-7 shadow-[0_25px_70px_rgba(0,0,0,0.22)]">
      <SectionHeading eyebrow={eyebrow} title={title} />
      <div className="mt-6">{children}</div>
    </section>
  );
}

function MetaValue({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.13em] text-white/25">
        {label}
      </p>
      <p
        className={`mt-1 font-medium text-white/58 ${
          compact ? "max-w-[180px] break-all text-xs" : "text-sm"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ValueRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/6 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-white/35">{label}</span>
      <span className="text-sm font-semibold text-[#f0ddb8]">{value}</span>
    </div>
  );
}

function InsightRow({
  label,
  text,
}: {
  label: string;
  text: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)]">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c8a467]/75">
        {label}
      </p>
      <p className="text-sm leading-6 text-white/48">{text}</p>
    </div>
  );
}

function AgendaMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-full border border-white/8 bg-black/10 px-4 py-2 text-xs">
      <span className="text-white/28">{label}: </span>
      <span className="text-white/58">{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className="rounded-full border border-[#c8a467]/20 bg-[#c8a467]/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#d3b071]">
      {status}
    </span>
  );
}


function parseNumber(value: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return 0;
  }

  return Math.max(0, parsed);
}

function formatRM(value: number) {
  const rounded = Math.round(value);

  if (rounded < 0) {
    return `-RM ${Math.abs(rounded).toLocaleString("en-MY")}`;
  }

  return `RM ${rounded.toLocaleString("en-MY")}`;
}
const inputClassName =
  "w-full rounded-xl border border-white/10 bg-[#090e11] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#c8a467]/65 focus:ring-2 focus:ring-[#c8a467]/10";