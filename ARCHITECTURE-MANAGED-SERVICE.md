# Wedge Works Managed-Service Architecture

Wedge Works is the internal operating platform behind Wedge managed bookkeeping and business-management services.

## Roles

- Founder / accounts team: Founder Control, Wedge-I, full WedgeBooks, reconciliation, payables/accruals, payroll review, P&L and month close.
- Business owner / delegated manager: WedgeCLOCKin operations plus document capture only.
- Employees: employee CLOCKin only.

## Core data flow

Business owner maintains roster, employees, attendance, leave and OT in WedgeCLOCKin and captures receipts/invoices from the mobile document-capture experience. At month end the owner supplies sales and bank statements. Wedge-I combines WedgeBooks, WedgeCLOCKin payroll, sales and bank data, identifies exceptions, tracks payables/accruals, supports reconciliation and generates the monthly management P&L.

## Month close

Unpaid supplier bills and valid timing differences do not block close when correctly recorded. Material unknown transactions, unresolved duplicates or missing material accounting entries require review. Payroll is generated from WedgeCLOCKin and feeds staff cost into the P&L without manual re-entry.

## UX rule

One business = one Founder workspace. The user should never need to re-enter the canonical Business ID after selecting a business.
