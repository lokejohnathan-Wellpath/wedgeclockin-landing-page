export const WEDGEWEB_FEEDBACK_KEY = "wedgeweb_v5_feedback_candidates";

export type FeedbackCandidate = { instruction: string; suggestedStyle: string; industry: string; confirmedAt: string };

export function recordFeedback(candidate: FeedbackCandidate) {
  const existing = readFeedback();
  localStorage.setItem(WEDGEWEB_FEEDBACK_KEY, JSON.stringify([candidate, ...existing].slice(0, 100)));
}

export function readFeedback(): FeedbackCandidate[] {
  try { const value = JSON.parse(localStorage.getItem(WEDGEWEB_FEEDBACK_KEY) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; }
}
