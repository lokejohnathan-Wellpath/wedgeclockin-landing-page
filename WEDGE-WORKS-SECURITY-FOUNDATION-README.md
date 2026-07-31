# Wedge Works Security Foundation

This release applies the frontend portion of the approved Wedge Works security
architecture. It does not claim to replace or secure the separate API.

## Included

- SmartPOS receipt printing now creates text-only DOM nodes instead of writing
  untrusted merchant, customer, and item values into executable HTML.
- Manager and employee passwords are submitted exactly as entered.
- Manager dashboard routes have a shared client access boundary.
- Manager and SmartPOS expired sessions are cleared on verified HTTP 401
  responses in the updated request paths.
- SmartPOS authentication and public API requests no longer attach an existing
  merchant token.
- SmartPOS checkout accepts HTTPS destinations only.
- Company selection no longer silently falls back to the first company returned
  by an API response.
- Security headers cover all application routes.
- Next.js is updated to 16.2.12.
- Patched PostCSS and Sharp releases are pinned through package overrides.
- `npm test` runs the WedgeBooks and Wedge-Supply regression suites.

## Validation

- Next.js production build: passed
- TypeScript: passed
- Static generation: 30/30 routes
- Regression tests: 13/13 passed
- Production dependency audit: 0 known vulnerabilities
- Receipt source scan: no `document.write`, `innerHTML`,
  `dangerouslySetInnerHTML`, `eval`, or `new Function`

## Backend work still required

The following items cannot be implemented securely without the separate
Wedge Clock-In API source:

- HttpOnly rotating sessions
- Token issuer, audience, expiry and revocation
- Server-enforced company and product permissions
- Founder MFA and Founder-only APIs
- Authenticated Wedge-Supply, WedgeBooks, Wedge-I and WedgeWeb access
- Database migration from browser-only storage
- Login throttling, security events and complete audit logs

Do not add a Founder dashboard that relies only on a hidden route or browser
LocalStorage.
