import { roles } from './roles';
export type Profile = { name: string; phone: string; area: string; role: string; experience: string; salary: string; availability: string; licence: string; language: string; consent: true; discoverable: boolean };
export type Turn = { speaker: 'interviewer' | 'candidate'; text: string };
export function validateProfile(v: unknown): Profile {
  if (!v || typeof v !== 'object') throw new Error('Please complete your profile.');
  const p = v as Record<string, unknown>;
  const field = (key: string, max: number, required = true) => {
    const value = typeof p[key] === 'string' ? p[key].trim() : '';
    if ((required && !value) || value.length > max) throw new Error(`Please check ${key}.`);
    return value;
  };
  const name = field('name', 100), phone = field('phone', 30);
  if (!/^[+\d ()-]{7,30}$/.test(phone)) throw new Error('Please check your phone number.');
  const role = field('role', 30);
  if (!roles.some(r => r.id === role)) throw new Error('Choose a supported role.');
  const language = field('language', 10);
  if (!['en', 'ms'].includes(language)) throw new Error('Choose an interview language.');
  if (p.consent !== true) throw new Error('Interview and data consent is required.');
  if (typeof p.discoverable !== 'boolean') throw new Error('Choose your sharing preference.');
  return { name, phone, role, language, area: field('area', 160), experience: field('experience', 2000), salary: field('salary', 80), availability: field('availability', 160), licence: field('licence', 160, role === 'driver'), consent: true, discoverable: p.discoverable };
}
export function expired(started: string | Date, now = Date.now()) {
  return now - new Date(started).getTime() >= 570000;
}
