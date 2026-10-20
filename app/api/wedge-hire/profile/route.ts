import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, randomUUID } from 'node:crypto';
import { configured, cookieName, db, hash, privateHeaders, sameOrigin, tokenHash } from '@/app/wedge-hire/server';
import { validateProfile } from '@/app/wedge-hire/talent';
export const runtime = 'nodejs';
export async function GET(req: NextRequest) {
  if (!configured()) return NextResponse.json({ ready: false }, { headers: privateHeaders });
  try {
    const key = tokenHash(req);
    await db().query('SELECT 1 FROM hire_candidates LIMIT 1');
    if (!key) return NextResponse.json({ ready: true }, { headers: privateHeaders });
    const { rows } = await db().query('SELECT profile, transcript, interview_status, interview_started_at FROM hire_candidates WHERE token_hash=$1 AND expires_at>now()', [key]);
    return NextResponse.json({ ready: true, candidate: rows[0] || null }, { headers: privateHeaders });
  } catch { return NextResponse.json({ ready: false }, { headers: privateHeaders }); }
}
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Request not allowed.' }, { status: 403 });
  if (!configured()) return NextResponse.json({ error: 'Registration is not open yet. No profile has been saved.' }, { status: 503 });
  let profile;
  try { if (Number(req.headers.get('content-length') || 0) > 12000) throw new Error('Profile too large.'); profile = validateProfile(await req.json()); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid profile.' }, { status: 400 }); }
  const client = await db().connect().catch(() => null);
  if (!client) return NextResponse.json({ error: 'Storage is unavailable. No profile has been saved.' }, { status: 503 });
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM hire_candidates WHERE expires_at<=now()');
    await client.query('DELETE FROM hire_intake_limits WHERE expires_at<=now()');
    const existing = tokenHash(req);
    if (existing) {
      const found = await client.query('SELECT id FROM hire_candidates WHERE token_hash=$1', [existing]);
      if (found.rowCount) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'You already have a profile in this browser. Delete it before registering again.' }, { status: 409 }); }
    }
    // Vercel provides this client IP header; store only a one-way daily bucket hash.
    const ip = req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const day = new Date().toISOString().slice(0, 10);
    for (const [bucket, maximum] of [[hash(`${ip}:${day}`), 5], [`global:${day}`, 100]] as const) {
      const r = await client.query('INSERT INTO hire_intake_limits(bucket,count,expires_at) VALUES($1,1,now()+interval \'1 day\') ON CONFLICT(bucket) DO UPDATE SET count=hire_intake_limits.count+1 RETURNING count', [bucket]);
      if (r.rows[0].count > maximum) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Registration limit reached. Please try another day.' }, { status: 429 }); }
    }
    const token = randomBytes(32).toString('hex');
    await client.query('INSERT INTO hire_candidates(id,token_hash,profile,consent_version) VALUES($1,$2,$3,$4)', [randomUUID(), hash(token), JSON.stringify(profile), 'talent-scripted-v1']);
    await client.query('COMMIT');
    const res = NextResponse.json({ saved: true }, { status: 201, headers: privateHeaders });
    res.cookies.set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/wedge-hire', maxAge: 60 * 60 * 24 * 180 });
    return res;
  } catch { await client.query('ROLLBACK'); return NextResponse.json({ error: 'We could not save your profile. Please retry.' }, { status: 503 }); }
  finally { client.release(); }
}
export async function DELETE(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Request not allowed.' }, { status: 403 });
  const key = tokenHash(req);
  if (!key) return NextResponse.json({ error: 'No candidate session.' }, { status: 401 });
  try {
    await db().query('DELETE FROM hire_candidates WHERE token_hash=$1', [key]);
    const res = NextResponse.json({ deleted: true }, { headers: privateHeaders }); res.cookies.set(cookieName, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/api/wedge-hire", maxAge: 0 }); return res;
  } catch { return NextResponse.json({ error: 'Deletion failed. Please retry.' }, { status: 503 }); }
}
