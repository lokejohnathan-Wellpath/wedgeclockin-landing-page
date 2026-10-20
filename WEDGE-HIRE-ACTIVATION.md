# Wedge Hire candidate-first intake

Candidates can join without an employer or a vacancy. New route: `/wedge-hire/join`.

## Before activation

Intake deliberately fails closed unless ALL server-side variables are set:

- `HIRE_DATABASE_URL`: dedicated PostgreSQL connection string with provider-required TLS and certificate validation. Do not use a public browser variable or disable TLS validation.
- `OPENAI_API_KEY`: server-side project key with an explicit budget.
- `HIRE_CHAT_MODEL`: a model available to that project supporting Chat Completions and `max_completion_tokens`.
- `HIRE_TRANSCRIBE_MODEL`: an available Audio Transcriptions model.
- `HIRE_INTAKE_ENABLED=true`: set last, after testing.

Run `migrations/wedge-hire.sql` against that database first. Never commit credentials.
The public availability endpoint checks database access and table presence. It does not verify OpenAI billing or model access; a real pilot interview must do that before enabling public intake.

## Delivered behavior

- Seven supported role templates, no vacancy requirement.
- Profile and transcript in PostgreSQL; contact and licence details are self-declared.
- Required processing consent; separate unchecked employer-discovery opt-in.
- Opaque 256-bit HttpOnly candidate cookie, hashed in storage; same-origin writes and no public candidate listing API.
- Candidate can view/delete their own record from the same browser. Cross-device recovery is not implemented. Losing the cookie requires operator support; do not advertise a full candidate account system.
- Turn-by-turn spoken interview: browser MediaRecorder → server transcription → conversational follow-up → browser speech synthesis. This is not continuous full-duplex Realtime audio. Browser voice availability varies.
- Optional local camera preview only: no upload, recording, identity recognition or facial assessment.
- Server checks 9:30 deadline before and after provider work. The model starts closing after 7:30; maximum 12 submitted answers. Early finish and short answers can make sessions shorter than six minutes.
- Each answer is limited to 60 seconds client-side and 2.8 MB server-side. Database row locks serialize turns. Failed turns roll back and show an error; candidates may need to repeat that answer.
- Provider fetch timeout 25 seconds per call; maximum route duration 60 seconds.
- Daily intake ceilings: 5 per hashed Vercel IP bucket; 100 globally. These are temporary cost controls, not verified candidate identity or complete bot protection.
- Records expire after 180 days and are excluded from access queries. Physical purge occurs on next registration; provision a daily maintenance job for prompt physical deletion, including expired rate-limit buckets. Document backup retention with the selected database provider before launch.

## Required pilot verification

Use sample data with intake initially restricted to the pilot deployment. Check:
1. Consent, driver licence declaration, language and sharing preference validation.
2. Successful profile persistence across a refresh, cookie ownership isolation, deletion and expired-record handling.
3. Actual provider credentials/models/billing, microphone permission, transcription and spoken follow-up in English and Bahasa Malaysia.
4. Silent audio, provider outage, concurrent turns, refresh/resume, deadline and early finish.
5. Optional camera preview and browser navigation release media tracks.
6. No profile data in page HTML, logs or public responses. Confirm deployed privacy/consent text with the operator.
7. Configure retention maintenance and test database backups/access controls.

## Still outside this release

Authenticated employer browsing, automated job matching, employer reports, verified identities/licences, video recordings, continuous live avatars, offers and onboarding. Employer discovery permission is stored for future use; no employer data-sharing endpoint is enabled.

No existing attendance routes are modified. Microphone permissions are enabled only for Wedge Hire pages.
