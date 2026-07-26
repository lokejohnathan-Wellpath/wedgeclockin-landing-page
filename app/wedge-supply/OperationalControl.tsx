"use client";

import { useMemo, useState } from "react";
import { malaysiaDateKey, toCsv } from "./lib/operations";
import type { SupplyState } from "./lib/types";

const panel =
  "rounded-[24px] border border-white/9 bg-[#151d21] p-5 shadow-[0_18px_60px_rgba(0,0,0,.18)]";

function currentMonth() {
  return malaysiaDateKey().slice(0, 7);
}

function download(name: string, content: string) {
  const blob = new Blob([`\ufeff${content}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function OperationalControl({
  state,
  onChangeConfig,
  onToggleMonthLock,
  onPostStockCount,
  onReverseLedger,
}: {
  state: SupplyState;
  onChangeConfig: (
    mode: "quantity-only" | "actual-cost",
    includeInCsv: boolean,
  ) => void;
  onToggleMonthLock: (month: string) => void;
  onPostStockCount: (
    itemId: string,
    locationId: string,
    countedQuantity: number,
    reason: string,
  ) => void;
  onReverseLedger: (ledgerId: string, reason: string) => void;
}) {
  const [month, setMonth] = useState(currentMonth());
  const locked = state.config.lockedMonths?.includes(month) ?? false;
  const ledger = useMemo(
    () =>
      state.ledger.filter(
        (entry) =>
          entry.effectiveDate.startsWith(month) && entry.status === "posted",
      ),
    [month, state.ledger],
  );
  const includeDirect = Boolean(state.config.includeDirectSupplierCostInCsv);
  const mode = state.config.directSupplierCostMode ?? "quantity-only";
  const [countItemId, setCountItemId] = useState("");
  const [countLocationId, setCountLocationId] = useState("central");
  const [countedQuantity, setCountedQuantity] = useState("");
  const [countReason, setCountReason] = useState("");

  function exportClosing(scope: "central" | "outlets" | "consolidated") {
    const rows = state.items.map((item) => {
      const movements = ledger.filter((entry) => entry.itemId === item.id);
      const movement = (kind: string) =>
        movements
          .filter((entry) => entry.movement === kind)
          .reduce((sum, entry) => sum + entry.quantityDelta, 0);
      const directCostAllowed =
        item.inventoryType !== "direct-supply" || includeDirect;
      const outletQty = Object.values(item.outletStocks || {}).reduce(
        (sum, value) => sum + Number(value || 0),
        0,
      );
      const closingQty =
        scope === "central"
          ? item.centralStock
          : scope === "outlets"
            ? outletQty
            : item.centralStock + outletQty;
      return {
        Month: month,
        Scope: scope,
        SKU: item.sku,
        Item: item.name,
        Category: item.category,
        Unit: item.unit,
        "Opening Qty": Math.max(
          0,
          closingQty -
            movements.reduce((sum, entry) => sum + entry.quantityDelta, 0),
        ),
        "Purchase Receipts": movement("purchase-receipt"),
        "Production In": movement("production-output"),
        "Production Out": Math.abs(movement("production-input")),
        Dispatch: Math.abs(movement("dispatch-out")),
        "Direct Receipts": movement("direct-receipt"),
        Wastage: Math.abs(movement("wastage")),
        Adjustments: movement("adjustment"),
        "Closing Qty": closingQty,
        "Unit Cost": directCostAllowed ? Number(item.unitCost || 0).toFixed(4) : "",
        "Closing Value": directCostAllowed
          ? (closingQty * Number(item.unitCost || 0)).toFixed(2)
          : "",
      };
    });
    download(`wedge-supply-${scope}-${month}.csv`, toCsv(rows));
  }

  function exportProduction() {
    const rows = state.productionBatches
      .filter(
        (batch) =>
          batch.scheduledDate.startsWith(month) && batch.status === "completed",
      )
      .map((batch) => ({
        Month: month,
        Batch: batch.batchNumber || batch.id,
        Product: batch.recipeName,
        "Planned Output": batch.plannedOutputQuantity || 0,
        "Actual Output": batch.actualOutputQuantity || batch.producedQuantity || 0,
        Wastage: batch.wastageQuantity || 0,
        "Production Cost": Number(batch.productionCost || 0).toFixed(2),
        "Unit Cost": Number(batch.outputUnitCost || 0).toFixed(4),
        Expiry: batch.expiryDate || "",
      }));
    download(`wedge-supply-production-${month}.csv`, toCsv(rows));
  }

  function exportDocuments() {
    const rows = state.deliveryOrders
      .filter((order) => order.dispatchedAt.slice(0, 7) === month)
      .flatMap((order) =>
        (order.lines || []).map((line) => ({
          Month: month,
          "Internal Reference": order.number,
          Route: order.route,
          Outlet: order.outletName,
          "Outlet Code": order.outletCode,
          "Supplier DO": order.supplierDeliveryOrderNumber || "",
          "Supplier Invoice": order.supplierInvoiceNumber || "",
          Item: line.itemName,
          Dispatched: line.dispatchedQuantity,
          Received: line.receivedQuantity,
          Damaged: line.damagedQuantity,
          Unit: line.unit,
          Status: order.status,
        })),
      );
    download(`wedge-supply-documents-${month}.csv`, toCsv(rows));
  }

  return (
    <div className="space-y-5">
      <section className={panel}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black tracking-[.18em] text-[#d6ad62]">
              MONTH-END CONTROL
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Operational closing &amp; CSV
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">
              Quantities and actual inventory cost only. This module does not
              calculate selling price, markup, tax, margin or accounting
              entries.
            </p>
          </div>
          <label className="text-sm text-white/55">
            Month
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="ml-3 rounded-xl border border-white/10 bg-[#0a1013] px-4 py-3 text-white"
            />
          </label>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className={panel}>
          <h3 className="text-lg font-black">Direct supplier cost policy</h3>
          <p className="mt-2 text-sm leading-6 text-white/45">
            Keep quantity-only when supplier cost should not form part of this
            operational export.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onChangeConfig("quantity-only", includeDirect)}
              className={`rounded-xl border px-4 py-3 font-bold ${
                mode === "quantity-only"
                  ? "border-[#d6ad62] bg-[#d6ad62] text-[#0a1013]"
                  : "border-white/12"
              }`}
            >
              Quantity only
            </button>
            <button
              type="button"
              onClick={() => onChangeConfig("actual-cost", includeDirect)}
              className={`rounded-xl border px-4 py-3 font-bold ${
                mode === "actual-cost"
                  ? "border-[#d6ad62] bg-[#d6ad62] text-[#0a1013]"
                  : "border-white/12"
              }`}
            >
              Actual supplier cost
            </button>
          </div>
          <label className="mt-5 flex items-start gap-3 rounded-xl bg-black/20 p-4">
            <input
              type="checkbox"
              checked={includeDirect}
              onChange={(event) =>
                onChangeConfig(mode, event.target.checked)
              }
              className="mt-1 h-5 w-5 accent-[#d6ad62]"
            />
            <span>
              <strong>Include direct supplier cost in month-end CSV</strong>
              <span className="mt-1 block text-xs leading-5 text-white/40">
                Switch this off for non-value operational transfers.
              </span>
            </span>
          </label>
        </section>

        <section className={panel}>
          <h3 className="text-lg font-black">Period lock</h3>
          <p className="mt-2 text-sm leading-6 text-white/45">
            Lock after reconciliation and export. Posted movements remain
            visible and must be reversed—not silently edited.
          </p>
          <button
            type="button"
            onClick={() => onToggleMonthLock(month)}
            className={`mt-5 w-full rounded-xl px-5 py-3 font-black ${
              locked
                ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                : "bg-[#d6ad62] text-[#0a1013]"
            }`}
          >
            {locked ? `Unlock ${month}` : `Lock ${month}`}
          </button>
          <p className="mt-3 text-xs text-white/35">
            {ledger.length} posted ledger movement(s) in this month.
          </p>
        </section>
      </div>

      <section className={panel}>
        <h3 className="text-lg font-black">Download operating records</h3>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <button onClick={() => exportClosing("central")} className="rounded-xl bg-[#d6ad62] px-4 py-3 font-black text-[#0a1013]">
            Central closing
          </button>
          <button onClick={() => exportClosing("outlets")} className="rounded-xl border border-white/12 px-4 py-3 font-bold">
            Outlet closing
          </button>
          <button onClick={() => exportClosing("consolidated")} className="rounded-xl border border-white/12 px-4 py-3 font-bold">
            Consolidated
          </button>
          <button onClick={exportProduction} className="rounded-xl border border-white/12 px-4 py-3 font-bold">
            Production &amp; yield
          </button>
          <button onClick={exportDocuments} className="rounded-xl border border-white/12 px-4 py-3 font-bold">
            DO &amp; receiving
          </button>
        </div>
      </section>

      <section className={panel}>
        <h3 className="text-lg font-black">Controlled stock count</h3>
        <p className="mt-2 text-sm leading-6 text-white/45">
          Post the physical count with a reason. The difference becomes an
          auditable adjustment; previous ledger rows are never overwritten.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <select
            value={countItemId}
            onChange={(event) => setCountItemId(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#0a1013] px-4 py-3"
          >
            <option value="">Choose item</option>
            {state.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            value={countLocationId}
            onChange={(event) => setCountLocationId(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#0a1013] px-4 py-3"
          >
            <option value="central">Central</option>
            {(state.config.outlets || []).map((outlet) => (
              <option key={outlet.id} value={outlet.id}>
                {outlet.code} · {outlet.name}
              </option>
            ))}
          </select>
          <input
            value={countedQuantity}
            onChange={(event) => setCountedQuantity(event.target.value)}
            inputMode="decimal"
            placeholder="Physical quantity"
            className="rounded-xl border border-white/10 bg-[#0a1013] px-4 py-3"
          />
          <input
            value={countReason}
            onChange={(event) => setCountReason(event.target.value)}
            placeholder="Reason / count reference"
            className="rounded-xl border border-white/10 bg-[#0a1013] px-4 py-3"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            const quantity = Number(countedQuantity);
            if (
              !countItemId ||
              !Number.isFinite(quantity) ||
              quantity < 0 ||
              !countReason.trim()
            )
              return;
            onPostStockCount(
              countItemId,
              countLocationId,
              quantity,
              countReason.trim(),
            );
            setCountedQuantity("");
            setCountReason("");
          }}
          className="mt-4 rounded-xl bg-[#d6ad62] px-5 py-3 font-black text-[#0a1013]"
        >
          Post stock count difference
        </button>
      </section>

      <section className={panel}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black">Immutable movement register</h3>
            <p className="mt-1 text-sm text-white/40">
              Mistakes are corrected by reversal with a reason.
            </p>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/45">
            {ledger.length} row(s)
          </span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-white/40">
              <tr>
                <th className="pb-3">Date</th>
                <th className="pb-3">Reference</th>
                <th className="pb-3">Movement</th>
                <th className="pb-3">Item</th>
                <th className="pb-3">Location</th>
                <th className="pb-3">Qty</th>
                <th className="pb-3">Value</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/7">
              {ledger.slice(0, 30).map((entry) => (
                <tr key={entry.id}>
                  <td className="py-3">{entry.effectiveDate}</td>
                  <td className="py-3 font-bold">{entry.reference}</td>
                  <td className="py-3">{entry.movement}</td>
                  <td className="py-3">{entry.itemName}</td>
                  <td className="py-3">{entry.locationCode}</td>
                  <td className="py-3">
                    {entry.quantityDelta} {entry.unit}
                  </td>
                  <td className="py-3">RM {entry.valueDelta.toFixed(2)}</td>
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => {
                        const reason = window.prompt(
                          "Reason for reversing this posted movement",
                          "",
                        );
                        if (reason?.trim()) onReverseLedger(entry.id, reason.trim());
                      }}
                      className="rounded-lg border border-red-400/25 px-3 py-2 text-xs font-bold text-red-200"
                    >
                      Reverse
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
