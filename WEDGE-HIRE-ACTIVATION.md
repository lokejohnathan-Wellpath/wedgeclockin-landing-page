# Wedge Hire — scripted voice pilot

## Available without API billing

`/wedge-hire/try` provides a browser-only practice interview. Five role-specific questions, English or Bahasa Malaysia, five-minute maximum, spoken questions using browser speech synthesis, optional browser speech recognition and editable typed answers. No OpenAI or other paid model APIs are called. Optional camera is a local preview only.

Practice answers remain in page memory. They are NOT collected by Wedge, are not recoverable after refresh, and do not enter a candidate pool. Users may download a plain-text transcript. This is visibly labelled practice, not an application. Browser speech recognition may use the browser vendor's remote service; it is not guaranteed offline or available in every browser. The UI requires a separate speech opt-in and always offers typed answers. No audio/video recording or facial analysis.

## Candidate pool activation — still closed

To persist real candidates, configure a dedicated PostgreSQL connection in `HIRE_DATABASE_URL`, run `migrations/wedge-hire.sql`, verify database access and privacy/retention handling, then set `HIRE_INTAKE_ENABLED=true`. Do not configure or enable paid AI. Infrastructure costs remain subject to the hosting/database plan.

`/wedge-hire/join` checks availability. Without storage, the form is not displayed and a practice link is shown. Candidate intake requires data processing consent and separate unchecked future employer-discovery permission. Same-browser opaque HttpOnly cookie grants access only to that candidate's own record. Contact/licence details are unverified. Cross-device recovery and employer access remain unimplemented.

Persisted interview API accepts text answers only and selects the next question on the server. Five-minute limit and valid answers are enforced on the server, with database row locking for concurrent submissions. No public listing exposes candidate data. Daily intake ceilings: 5 per hashed Vercel IP bucket and 100 globally. These are pilot cost controls, not identity verification.

Records expire after 180 days and are excluded from reads. Physical purge occurs on subsequent registration; configure a daily maintenance job and backup retention before opening real intake.

## Verification

- Production build including TypeScript.
- Tests: input/consent validation, supported role/language questions, progression, blank/oversized answers, five-minute boundary.
- Pilot browser: choose role → start → hear question → enter sample answer → advance → finish → download transcript. Check optional camera release on end/unmount.
- A real microphone test requires a supported browser, permission and a human speaker. If unsupported or denied, typed answers remain functional.
- Secure database persistence, ownership isolation, deletion and recovery errors need live database testing before activation.

## Future upgrade

Paid generative follow-ups, streamed full-duplex voice, video recording, employer browsing, matching, reports and hiring/onboarding are outside this pilot. No automatic suitability or IQ score is claimed.
