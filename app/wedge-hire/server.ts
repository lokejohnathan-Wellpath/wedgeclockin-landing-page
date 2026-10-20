import 'server-only';
import { Pool } from 'pg';
import { createHash } from 'node:crypto';
import { NextRequest } from 'next/server';
export const cookieName = 'wedge_hire_candidate';
const globalPool = globalThis as typeof globalThis & { hirePool?: Pool };
export function configured() { return Boolean(process.env.HIRE_DATABASE_URL && process.env.OPENAI_API_KEY && process.env.HIRE_CHAT_MODEL && process.env.HIRE_TRANSCRIBE_MODEL && process.env.HIRE_INTAKE_ENABLED === 'true'); }
export function db() {
  if (!process.env.HIRE_DATABASE_URL) throw new Error('Storage unavailable');
  return globalPool.hirePool ??= new Pool({ connectionString: process.env.HIRE_DATABASE_URL, max: 3, connectionTimeoutMillis: 8000, idleTimeoutMillis: 10000 });
}
export const hash = (s: string) => createHash('sha256').update(s).digest('hex');
export function tokenHash(req: NextRequest) { const token = req.cookies.get(cookieName)?.value; return token && /^[a-f0-9]{64}$/.test(token) ? hash(token) : ''; }
export function sameOrigin(req: NextRequest) { return req.headers.get('origin') === req.nextUrl.origin; }
export const privateHeaders = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };
export async function provider(path: string, body: BodyInit, json = false) {
  const res = await fetch(`https://api.openai.com/v1/${path}`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, ...(json ? { 'Content-Type': 'application/json' } : {}) }, body, signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new Error('Voice service temporarily unavailable. Please retry.');
  return res.json();
}
