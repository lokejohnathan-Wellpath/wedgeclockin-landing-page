# Wedge-SmartPOS backend contract

The frontend reads `NEXT_PUBLIC_API_BASE_URL` and expects the API below. All private routes require a bearer token. The API must derive `tenantId` from the authenticated identity; it must never trust a tenant identifier supplied by the browser.

## Merchant authentication

- `POST /api/smartpos/auth/signup`
  - Accepts `ownerName`, `businessName`, `vertical`, `email`, `telephone`, `businessAddress`, `password`, `acceptedTerms`.
  - Normalises email/telephone, hashes the password, creates one merchant tenant and owner, records policy acceptance, and begins the founder-configured trial once only.
  - Returns `{ token, vertical }` after the configured email-verification policy succeeds.
- `POST /api/smartpos/auth/login` → `{ token, vertical }`
- `POST /api/smartpos/auth/forgot-password`

Apply rate limits, generic password-reset responses, rotating sessions, email verification, password hashing and an audit event for authentication-sensitive changes.

## POS dashboard

- `GET /api/smartpos/dashboard?vertical=beauty|pet`
  - Returns `{ businessName, branchName, appointments, expectedSales, completedCount, insightCount, subscription }`.
- `POST /api/smartpos/appointments/:id/complete`

Appointment output uses `id`, `startAt`, `subjectName`, optional `secondaryName`, `serviceName`, `staffName`, `amount`, `status`, optional `aiSignal`, and optional `aiReason`.

## Trial and subscription

- `GET /api/smartpos/public/plan` → `{ monthlyPrice, annualPrice, currency: "MYR", defaultTrialDays }`
- `GET /api/smartpos/subscription`
- `POST /api/smartpos/subscription/checkout` with `{ billingCycle }` → `{ checkoutUrl }`
- Payment webhook endpoint chosen by the gateway.

Prices and trial days come from database settings. Store an agreed-price snapshot on each paid subscription. Verify gateway webhook signatures and make webhook processing idempotent before activating access.

## Founder controls

- `GET /api/founder/smartpos/settings`
- `PUT /api/founder/smartpos/settings`

Only the founder role may use these routes. Settings contain `defaultTrialDays`, `monthlyPrice`, `annualPrice`, `gracePeriodDays`, `registrationEnabled`, `beautyEnabled`, and `petEnabled`. Every update requires an immutable audit record containing actor, previous values, new values, reason, timestamp and request correlation ID.

## Access rules

Trial expiration must not delete or hide merchant records. Expired merchants retain login, read and export access. Middleware blocks new appointments, new sales and new operational records until subscription activation. Founder-granted complimentary access and merchant-specific trial extensions are stored separately from global defaults.
