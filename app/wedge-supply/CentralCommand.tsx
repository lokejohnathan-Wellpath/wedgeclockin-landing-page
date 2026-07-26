"use client";

import { useMemo, useState } from "react";
import {
  buildDemandLines,
  buildPlanningEvents,
  buildStockInsights,
  buildSuggestions,
  type PlanningEvent,
  type StockSignal,
  type SupplySuggestion,
} from "./lib/centralIntelligence";
import type { ManualPlanningEvent, SupplyState } from "./lib/types";

const panel =
  "rounded-[24px] border border-white/9 bg-[#151d21] shadow-[0_18px_60px_rgba(0,0,0,.18)]";

const signalTheme: Record<
  StockSignal,
  { label: string; dot: string; card: string; text: string }
> = {
  critical: {
    label: "Critical",
    dot: "bg-red-500",
    card: "border-red-400/25 bg-red-500/[.07]",
    text: "text-red-200",
  },
  par: {
    label: "At par",
    dot: "bg-amber-400",
    card: "border-amber-300/25 bg-amber-400/[.07]",
    text: "text-amber-100",
  },
  sufficient: {
    label: "Sufficient",
    dot: "bg-emerald-500",
    card: "border-emerald-400/20 bg-emerald-500/[.06]",
    text: "text-emerald-200",
  },
  expiry: {
    label: "Expiry risk",
    dot: "bg-violet-400",
    card: "border-violet-400/25 bg-violet-500/[.07]",
    text: "text-violet-200",
  },
};

const eventTone: Record<PlanningEvent["tone"], string> = {
  red: "border-red-400/25 bg-red-500/10 text-red-100",
  yellow: "border-amber-300/25 bg-amber-400/10 text-amber-100",
  green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
  blue: "border-sky-400/25 bg-sky-500/10 text-sky-100",
  purple: "border-violet-400/25 bg-violet-500/10 text-violet-100",
  grey: "border-white/10 bg-white/[.045] text-white/65",
};

function malaysiaToday() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
  });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(`${value}T12:00:00+08:00`));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(`${value}T12:00:00+08:00`));
}

function Kpi({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: number;
  note: string;
  tone: string;
}) {
  return (
    <div className={`${panel} p-5`}>
      <div className={`h-1.5 w-10 rounded-full ${tone}`} />
      <p className="mt-4 text-sm text-white/45">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      <p className="mt-2 text-xs leading-5 text-white/32">{note}</p>
    </div>
  );
}

export function CentralCommand({
  state,
  onOpenRequests,
  onOpenInventory,
  onOpenCalendar,
  onUseSuggestion,
  onDismissSuggestion,
}: {
  state: SupplyState;
  onOpenRequests: () => void;
  onOpenInventory: () => void;
  onOpenCalendar: () => void;
  onUseSuggestion: (suggestion: SupplySuggestion) => void;
  onDismissSuggestion: (suggestion: SupplySuggestion) => void;
}) {
  const insights = useMemo(() => buildStockInsights(state), [state]);
  const demand = useMemo(() => buildDemandLines(state), [state]);
  const suggestions = useMemo(() => buildSuggestions(state), [state]);
  const events = useMemo(() => buildPlanningEvents(state), [state]);
  const today = malaysiaToday();
  const upcoming = events.filter((event) => event.date >= today).slice(0, 5);
  const critical = insights.filter((item) => item.signal === "critical").length;
  const par = insights.filter((item) => item.signal === "par").length;
  const expiry = insights.filter((item) => item.signal === "expiry").length;
  const pending = state.requests.filter(
    (request) => request.status === "submitted",
  ).length;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Decisions waiting"
          value={pending}
          note="Outlet requests requiring approval"
          tone="bg-[#d6ad62]"
        />
        <Kpi
          label="Critical stock"
          value={critical}
          note="Zero to two units, or committed beyond stock"
          tone="bg-red-500"
        />
        <Kpi
          label="At par level"
          value={par}
          note="Enough now, but replenishment is approaching"
          tone="bg-amber-400"
        />
        <Kpi
          label="Expiry attention"
          value={expiry}
          note="Usable stock reaching expiry within seven days"
          tone="bg-violet-400"
        />
      </section>

      <section className="grid gap-5 2xl:grid-cols-[1.2fr_.8fr]">
        <div className={`${panel} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-5">
            <div>
              <p className="text-xs font-bold tracking-[.18em] text-[#d6ad62]">
                RECOMMENDED ACTIONS TODAY
              </p>
              <p className="mt-1 text-sm text-white/38">
                Wedge prepares drafts. A manager makes every commitment.
              </p>
            </div>
            <span className="rounded-full border border-[#4b7e74]/30 bg-[#4b7e74]/10 px-3 py-1.5 text-xs font-bold text-[#a9d2ca]">
              {state.requests.length < 3
                ? "Learning your operation"
                : `${Math.min(92, 38 + state.requests.length * 7)}% pattern confidence`}
            </span>
          </div>
          {suggestions.length ? (
            <div className="divide-y divide-white/7">
              {suggestions.slice(0, 6).map((suggestion) => (
                <article key={suggestion.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${
                            suggestion.priority === "critical"
                              ? "border-red-400/25 bg-red-500/10 text-red-200"
                              : "border-amber-300/25 bg-amber-400/10 text-amber-100"
                          }`}
                        >
                          {suggestion.priority}
                        </span>
                        <span className="text-xs text-white/30">
                          {suggestion.confidence}% confidence
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-black">
                        {suggestion.title}
                      </h3>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">
                        {suggestion.reason}
                      </p>
                      <p className="mt-2 text-xs text-white/30">
                        Suggested by {formatShortDate(suggestion.dueDate)} ·{" "}
                        {suggestion.evidenceCount
                          ? `${suggestion.evidenceCount} historical request(s)`
                          : "current operating rules"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {suggestion.kind !== "expiry" && (
                        <button
                          type="button"
                          onClick={() => onUseSuggestion(suggestion)}
                          className="rounded-xl bg-[#d6ad62] px-4 py-3 text-sm font-black text-[#0a1013]"
                        >
                          Prepare draft
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDismissSuggestion(suggestion)}
                        className="rounded-xl border border-white/12 px-4 py-3 text-sm font-bold text-white/55"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="font-bold text-emerald-200">
                No urgent recommendation
              </p>
              <p className="mt-2 text-sm text-white/38">
                Continue recording requests, receipts and production. The
                learning layer becomes more useful with real operating history.
              </p>
            </div>
          )}
        </div>

        <div className={`${panel} p-5`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[.18em] text-[#8fc2b8]">
                OPERATING CALENDAR
              </p>
              <h2 className="mt-2 text-xl font-black">Coming up</h2>
            </div>
            <button
              type="button"
              onClick={onOpenCalendar}
              className="rounded-xl border border-white/12 px-3 py-2 text-xs font-bold"
            >
              Full calendar
            </button>
          </div>
          <div className="mt-5 space-y-3">
            {upcoming.length ? (
              upcoming.map((event) => (
                <div
                  key={event.id}
                  className={`rounded-xl border p-3 ${eventTone[event.tone]}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold">{event.title}</p>
                    <span className="shrink-0 text-[11px] opacity-65">
                      {formatShortDate(event.date)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 opacity-60">
                    {event.detail}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-white/10 px-4 py-9 text-center text-sm text-white/35">
                No dated operation is waiting.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className={`${panel} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-5">
          <div>
            <h2 className="font-black">Inventory control board</h2>
            <p className="mt-1 text-sm text-white/38">
              Physical stock minus committed dispatches, compared with par and learned demand.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenInventory}
            className="rounded-xl border border-white/12 px-4 py-2.5 text-sm font-bold"
          >
            Manage inventory
          </button>
        </div>
        {insights.length ? (
          <div className="grid gap-3 p-4 md:grid-cols-2 2xl:grid-cols-3">
            {insights.map((insight) => {
              const theme = signalTheme[insight.signal];
              return (
                <article
                  key={insight.item.id}
                  className={`rounded-2xl border p-4 ${theme.card}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black">{insight.item.name}</p>
                      <p className="mt-1 text-xs text-white/32">
                        {insight.item.sku || "No SKU"} · {insight.item.unit}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border border-current/15 px-2.5 py-1 text-[11px] font-bold ${theme.text}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${theme.dot}`} />
                      {theme.label}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-black/15 p-2.5">
                      <p className="text-[10px] uppercase text-white/30">Held</p>
                      <p className="mt-1 font-black">{insight.item.centralStock}</p>
                    </div>
                    <div className="rounded-xl bg-black/15 p-2.5">
                      <p className="text-[10px] uppercase text-white/30">
                        Committed
                      </p>
                      <p className="mt-1 font-black">{insight.committed}</p>
                    </div>
                    <div className="rounded-xl bg-black/15 p-2.5">
                      <p className="text-[10px] uppercase text-white/30">
                        Available
                      </p>
                      <p className="mt-1 font-black">{insight.available}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-white/38">
                    Par {insight.item.reorderLevel} · Learned weekly demand{" "}
                    {insight.learnedWeeklyDemand || "not ready"}
                    {insight.projectedDaysRemaining !== null
                      ? ` · approximately ${insight.projectedDaysRemaining} day(s) remaining`
                      : ""}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="px-6 py-12 text-center text-sm text-white/35">
            Add inventory items to activate the control board.
          </p>
        )}
      </section>

      <section className={`${panel} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-5">
          <div>
            <h2 className="font-black">Consolidated outlet demand</h2>
            <p className="mt-1 text-sm text-white/38">
              One total view while preserving every individual request.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenRequests}
            className="rounded-xl border border-white/12 px-4 py-2.5 text-sm font-bold"
          >
            Review requests
          </button>
        </div>
        {demand.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-black/15 text-white/38">
                <tr>
                  <th className="px-5 py-4">Item</th>
                  <th className="px-5 py-4">New requests</th>
                  <th className="px-5 py-4">Approved</th>
                  <th className="px-5 py-4">Dispatched</th>
                  <th className="px-5 py-4">Available</th>
                  <th className="px-5 py-4">Shortage</th>
                </tr>
              </thead>
              <tbody>
                {demand.map((line) => (
                  <tr key={line.itemId} className="border-t border-white/6">
                    <td className="px-5 py-4 font-bold text-[#f3e6cc]">
                      {line.itemName}
                      <span className="ml-2 text-xs font-normal text-white/30">
                        {line.unit}
                      </span>
                    </td>
                    <td className="px-5 py-4">{line.requested}</td>
                    <td className="px-5 py-4">{line.approved}</td>
                    <td className="px-5 py-4">{line.dispatched}</td>
                    <td className="px-5 py-4">{line.available}</td>
                    <td
                      className={`px-5 py-4 font-black ${
                        line.shortage > 0 ? "text-red-300" : "text-emerald-300"
                      }`}
                    >
                      {line.shortage > 0 ? line.shortage : "None"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-6 py-12 text-center text-sm text-white/35">
            Consolidated demand appears after outlets submit requests.
          </p>
        )}
      </section>
    </div>
  );
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function calendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export function SupplyCalendar({
  state,
  onAddPlanningEvent,
}: {
  state: SupplyState;
  onAddPlanningEvent: (
    event: Omit<ManualPlanningEvent, "id" | "createdAt">,
  ) => void;
}) {
  const today = malaysiaToday();
  const [month, setMonth] = useState(() => {
    const date = new Date(`${today}T12:00:00+08:00`);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [selected, setSelected] = useState(today);
  const [eventForm, setEventForm] = useState<{
    title: string;
    note: string;
    category: ManualPlanningEvent["category"];
  }>({
    title: "",
    note: "",
    category: "event",
  });
  const [formError, setFormError] = useState("");
  const events = useMemo(() => buildPlanningEvents(state), [state]);
  const days = calendarDays(month);
  const selectedEvents = events.filter((event) => event.date === selected);

  function moveMonth(offset: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    setSelected(localDateKey(next));
  }

  function addEvent(event: React.FormEvent) {
    event.preventDefault();
    if (!eventForm.title.trim()) {
      setFormError("Enter a short calendar title.");
      return;
    }
    onAddPlanningEvent({
      date: selected,
      title: eventForm.title.trim(),
      note: eventForm.note.trim(),
      category: eventForm.category,
    });
    setEventForm({ title: "", note: "", category: "event" });
    setFormError("");
  }

  return (
    <div className="grid gap-5 2xl:grid-cols-[1.2fr_.8fr]">
      <section className={`${panel} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/8 p-5">
          <div>
            <p className="text-xs font-bold tracking-[.18em] text-[#d6ad62]">
              MASTER OPERATING CALENDAR
            </p>
            <h2 className="mt-2 text-2xl font-black">
              {new Intl.DateTimeFormat("en-MY", {
                month: "long",
                year: "numeric",
              }).format(month)}
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="rounded-xl border border-white/12 px-4 py-2.5 font-bold"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => {
                const current = new Date(`${today}T12:00:00+08:00`);
                setMonth(new Date(current.getFullYear(), current.getMonth(), 1));
                setSelected(today);
              }}
              className="rounded-xl border border-white/12 px-4 py-2.5 text-sm font-bold"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="rounded-xl border border-white/12 px-4 py-2.5 font-bold"
            >
              →
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-white/7 bg-black/10 text-center text-[10px] font-bold uppercase tracking-[.12em] text-white/30">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="px-1 py-3">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((date) => {
            const key = localDateKey(date);
            const dayEvents = events.filter((event) => event.date === key);
            const inMonth = monthKey(date) === monthKey(month);
            return (
              <button
                type="button"
                key={key}
                onClick={() => setSelected(key)}
                className={`min-h-24 border-b border-r border-white/6 p-2 text-left transition hover:bg-white/[.04] ${
                  selected === key ? "bg-[#d6ad62]/10 ring-1 ring-inset ring-[#d6ad62]/45" : ""
                } ${inMonth ? "" : "opacity-30"}`}
              >
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                    key === today ? "bg-[#d6ad62] text-[#0a1013]" : ""
                  }`}
                >
                  {date.getDate()}
                </span>
                <div className="mt-2 flex flex-wrap gap-1">
                  {dayEvents.slice(0, 4).map((event) => (
                    <span
                      key={event.id}
                      className={`h-2 w-2 rounded-full ${
                        event.tone === "red"
                          ? "bg-red-400"
                          : event.tone === "yellow"
                            ? "bg-amber-300"
                            : event.tone === "green"
                              ? "bg-emerald-400"
                              : event.tone === "blue"
                                ? "bg-sky-400"
                                : event.tone === "purple"
                                  ? "bg-violet-400"
                                  : "bg-white/35"
                      }`}
                    />
                  ))}
                </div>
                {dayEvents.length > 0 && (
                  <p className="mt-1 text-[10px] text-white/35">
                    {dayEvents.length} item{dayEvents.length === 1 ? "" : "s"}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className={`${panel} p-5`}>
        <p className="text-xs font-bold tracking-[.18em] text-[#8fc2b8]">
          {formatDate(selected)}
        </p>
        <h2 className="mt-2 text-xl font-black">Day plan</h2>
        <div className="mt-5 space-y-3">
          {selectedEvents.length ? (
            selectedEvents.map((event) => (
              <article
                key={event.id}
                className={`rounded-xl border p-4 ${eventTone[event.tone]}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold">{event.title}</p>
                  <span className="rounded-full border border-current/15 px-2 py-1 text-[10px] font-bold uppercase opacity-65">
                    {event.type}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 opacity-60">
                  {event.detail}
                </p>
              </article>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center">
              <p className="font-bold">Nothing scheduled</p>
              <p className="mt-2 text-sm leading-6 text-white/35">
                Requests, deliveries, production, expiry dates and draft
                recommendations will appear here automatically.
              </p>
            </div>
          )}
        </div>
        <div className="mt-6 border-t border-white/8 pt-5">
          <p className="text-xs font-bold text-white/45">CALENDAR LEGEND</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/45">
            {[
              ["bg-red-400", "Critical"],
              ["bg-amber-300", "Request"],
              ["bg-emerald-400", "Delivery"],
              ["bg-sky-400", "Production"],
              ["bg-violet-400", "Expiry"],
              ["bg-white/35", "AI draft"],
            ].map(([colour, label]) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-white/8 px-2.5 py-1.5"
              >
                <span className={`h-2 w-2 rounded-full ${colour}`} />
                {label}
              </span>
            ))}
          </div>
        </div>
        <form onSubmit={addEvent} className="mt-6 border-t border-white/8 pt-5">
          <p className="text-xs font-bold text-[#d6ad62]">
            ADD TO {formatShortDate(selected).toUpperCase()}
          </p>
          <div className="mt-3 grid gap-3">
            <select
              value={eventForm.category}
              onChange={(event) =>
                setEventForm((current) => ({
                  ...current,
                  category: event.target
                    .value as ManualPlanningEvent["category"],
                }))
              }
              className="rounded-xl border border-white/10 bg-[#0a1013] px-4 py-3 text-sm text-white outline-none focus:border-[#d6ad62]"
            >
              <option value="event">Business event</option>
              <option value="promotion">Promotion</option>
              <option value="supplier-closure">Supplier closure</option>
              <option value="stock-count">Stock count</option>
            </select>
            <input
              value={eventForm.title}
              onChange={(event) => {
                setEventForm((current) => ({
                  ...current,
                  title: event.target.value,
                }));
                setFormError("");
              }}
              placeholder="Example: Weekend promotion"
              className="rounded-xl border border-white/10 bg-[#0a1013] px-4 py-3 text-sm text-white outline-none focus:border-[#d6ad62]"
            />
            <textarea
              value={eventForm.note}
              onChange={(event) =>
                setEventForm((current) => ({
                  ...current,
                  note: event.target.value,
                }))
              }
              placeholder="Optional planning note"
              rows={2}
              className="rounded-xl border border-white/10 bg-[#0a1013] px-4 py-3 text-sm text-white outline-none focus:border-[#d6ad62]"
            />
          </div>
          {formError && (
            <p className="mt-2 text-xs font-bold text-red-300">{formError}</p>
          )}
          <button
            type="submit"
            className="mt-3 w-full rounded-xl bg-[#d6ad62] px-4 py-3 text-sm font-black text-[#0a1013]"
          >
            Add calendar item
          </button>
        </form>
      </section>
    </div>
  );
}
