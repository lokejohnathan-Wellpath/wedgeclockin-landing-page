# Wedge Works Frontend Subscription Release

Included routes:

- Clock-In: `/manager-signup`, `/manager-forgot-password`, `/manager-dashboard/subscription`.
- WedgeBooks: `/wedge-i/books/signup`, `/login`, `/forgot-password`, `/payment`.
- SmartPOS: verified signup, password reset, trial reminder and card/FPX payment pages.
- ERP/Supply: `/wedge-supply/signup`, `/login`, `/forgot-password`, `/payment`.
- Private Founder access: `/founder-john-control` and `/founder-john-control/dashboard`.
- Payment return: `/subscription/success`.

The Founder routes are not linked from the public site and send `noindex` and `no-store` headers. They still require the dedicated API password plus email OTP; obscurity is not used as authentication.

Android Beta links and APK references are absent. Wedge-I and WedgeWeb remain outside the paid-product gate. Existing operational components and their local browser data stores are unchanged.

Before frontend deployment, set `NEXT_PUBLIC_API_BASE_URL` to the deployed Wedge Clock-In API origin and deploy the API subscription release first.

Validation performed:

- Next.js production build completed for all 44 routes.
- TypeScript completed successfully.
- Existing 13 Books and Supply operational tests passed.
- All subscription-related frontend files passed ESLint.

