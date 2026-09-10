# Wedge Managed Accounts Backend Contract

This contract defines the backend endpoints required by the Wedge-I managed full-set accounts operator layer. It preserves existing WedgeBooks, WedgeCLOCKin and Founder Control tenancy/security boundaries.

## Authentication boundary

- Founder/operator endpoints below require the existing `wedge_founder_control_token` bearer token.
- Client WedgeBooks continues using `wedge_books_token` and remains scoped to one client account.
- Client WedgeCLOCKin continues using `wc_manager_token` and remains scoped to one company.
- Employee clock-in identities remain separate and must never grant accounting access.
- Founder cross-company endpoints must resolve `businessId` server-side and must never trust a client-supplied company ID without permission checks.

## Managed client master

### POST `/api/managed-accounts/clients`
Create one managed-account client and provision entitlements.

Required behaviour:
- Generate immutable `businessId`, format e.g. `WDG-000051`.
- Validate unique easy `companyCode`.
- Persist legal/trading name, SSM registration, industry template, FYE, SST/service-charge flags, owner/contact, assigned accountant and bank references.
- Set managed accounts subscription state.
- Provision/entitle WedgeBooks and WedgeCLOCKin while subscription is active.
- Return client owner invitation/provisioning status.
- Do not create employee accounts automatically; owner/manager creates employees under the company.

### GET `/api/managed-accounts/clients`
Founder/operator list of managed clients including monthly summary/status and assigned accounts executive.

## Monthly accounting file

### GET `/api/managed-accounts/clients/:businessId/months/:yyyy-mm`
Return/create the monthly account file with:
- sales
- documents
- payroll
- books
- bank reconciliation
- review
- P&L
- missing-document count
- bank-exception count
- reconciliation difference
- lock metadata

### PUT `/api/managed-accounts/clients/:businessId/months/:yyyy-mm/restaurant-sales`
Persist restaurant sales/tender inputs:
- food sales
- beverage sales
- other sales
- service charge
- SST
- cash
- card
- QR
- GrabFood
- Foodpanda
- other tender

Service charge and SST must remain separate from ordinary operating revenue until reviewed/mapped.

## WedgeBooks cross-company accounting feed

### GET `/api/managed-accounts/clients/:businessId/months/:yyyy-mm/books`
Founder/operator read-only accounting feed derived from the client's WedgeBooks workspace.

Return:
- Book documents for the month
- classification/status/confidence
- source document metadata
- category allocations
- unresolved/needs-review count

The endpoint should internally resolve the client's Books account from `businessId`; no client product token should be required by the founder operator.

## WedgeCLOCKin cross-company payroll/workforce feed

### GET `/api/managed-accounts/clients/:businessId/months/:yyyy-mm/payroll`
Founder/operator read-only monthly payroll feed derived from the client's WedgeCLOCKin company.

Return issued payroll records including:
- basic salary
- allowances
- incentives/commissions
- approved OT hours/pay
- employer EPF/SOCSO/EIS contributions
- attendance/leave context
- status and adjustment metadata

Draft payroll must not be posted to final P&L. Adjustments must be surfaced for review.

### GET `/api/managed-accounts/clients/:businessId/months/:yyyy-mm/workforce-summary`
Return active employees, attendance rate, absence rate, approved OT hours and leave days for Wedge-I analysis.

## P&L

### GET `/api/managed-accounts/clients/:businessId/months/:yyyy-mm/pnl`
Return saved P&L draft/final version, template/industry, mapped values, warnings, reviewer and audit metadata.

### PUT `/api/managed-accounts/clients/:businessId/months/:yyyy-mm/pnl`
Save accountant-reviewed P&L draft values/warnings.

Every industry-specific P&L line must map to the Wedge Master Financial Schema.

## Bank statements and reconciliation

### POST `/api/managed-accounts/clients/:businessId/months/:yyyy-mm/bank-statements`
Upload/store statement metadata and source file securely. Prefer CSV/XLSX export; accept PDF where supported.

Never request or store internet-banking username, password, PIN or TAC.

### GET `/api/managed-accounts/clients/:businessId/months/:yyyy-mm/reconciliation`
Return:
- statement closing balance
- adjusted book balance
- difference
- auto-matched count
- suggested matches
- bank-only items
- books-only items
- clearing-account balances
- unresolved exceptions

### PATCH `/api/managed-accounts/clients/:businessId/months/:yyyy-mm/reconciliation/items/:itemId`
Resolve/approve/edit one reconciliation item with audit trail.

## Month close

### POST `/api/managed-accounts/clients/:businessId/months/:yyyy-mm/close`
Allow close only when:
- sales complete
- required WedgeBooks documents/categories reviewed
- issued payroll imported/reviewed
- bank reconciliation difference = RM0
- missing supporting documents = 0
- P&L prepared
- reviewer approval complete

Persist `lockedAt`, `lockedBy` and audit record. Closed periods cannot be silently mutated.

### POST `/api/managed-accounts/clients/:businessId/months/:yyyy-mm/reopen`
Founder/reviewer only. Require reason and append audit event.

## Employee/client login model

- Owner/client admin: easy company code + owner identity/password/OTP.
- Manager: company code + manager identity/password/OTP.
- Employee: company code + staff ID + PIN; no accounting access.
- Founder/accounts staff: separate Wedge internal identity; assigned multi-client access.

A client with 10–20 employees therefore still has one company/business identity but separate employee identities under it.

## Entitlement rule

Managed-account subscribers receive WedgeBooks and WedgeCLOCKin at no additional charge while the managed full-set-account subscription is active. Ending the service must not destroy records; export/retention rules apply and separate paid continuation can be offered later.
