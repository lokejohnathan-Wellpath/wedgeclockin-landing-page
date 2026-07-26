Wedge-Supply ERP V5 — Operational Inventory Release
26 July 2026

V5.1 workflow refinement:
- Removed all confidence percentages and the confidence field.
- Approved requests derive their route from saved item setup.
- Direct Supply items prefill supplier, purchase unit, pack size and last cost.
- Recipe outputs use Central production automatically when stock is short.
- Ordinary items use Central stock or a Central purchase draft.
- Managers no longer choose between competing fulfilment buttons.

V5.2 central-kitchen inbox refinement:
- One route-specific approval button plus Reject—no fulfilment choice panel.
- Direct Supply approval creates its supplier-direct record immediately.
- Own Production approval automatically plans the required batch when short.
- Central Stock approval waits for stock when insufficient.
- Direct-supply receiving requires supplier name and supplier DO number.
- Outlet Requests displays a WhatsApp-style new-request count badge.

Install target:
  C:\Users\USER\Documents\Codex\wedgeclockin-landing-page

Included:
- Existing V4.2 browser data migrates automatically to V5 state.
- Configurable items, SKUs, categories and kg/g/L/ml/pcs units.
- BOM production with separate output SKU, actual yield, wastage, lot and expiry.
- Weighted-average inventory cost and separate Own Production / WIP value.
- Outlet-coded multi-line DO for Central dispatch.
- Outlet-coded DD reference for supplier-direct deliveries.
- Actual receiving quantity, damage/shortage discrepancy, supplier DO and invoice.
- Immutable movement ledger, reason-based reversals and physical stock counts.
- Quantity-only or actual supplier-cost policy.
- Optional direct-supplier cost inclusion in month-end CSV.
- Central, outlet, consolidated, production/yield and DO/receiving CSV exports.
- Month locking.

Explicitly excluded:
- Selling price and markup calculations.
- Tax, margin, general ledger and accounting entries.

Validation completed:
- Next.js 16.2.9 production build passed.
- 6 operational transaction tests passed.
