-- Run once against a dedicated Wedge Hire PostgreSQL database, before enabling intake.
CREATE TABLE IF NOT EXISTS hire_candidates (
  id uuid PRIMARY KEY,
  token_hash text UNIQUE NOT NULL,
  profile jsonb NOT NULL,
  consent_version text NOT NULL,
  consented_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '180 days',
  interview_started_at timestamptz,
  interview_status text NOT NULL DEFAULT 'not_started'
    CHECK (interview_status IN ('not_started','active','completed','timed_out')),
  transcript jsonb NOT NULL DEFAULT '[]',
  turn_count integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS hire_candidates_expiry ON hire_candidates(expires_at);
CREATE TABLE IF NOT EXISTS hire_intake_limits (
  bucket text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL
);
-- No public candidate directory. Employer access requires a separate authenticated API.
