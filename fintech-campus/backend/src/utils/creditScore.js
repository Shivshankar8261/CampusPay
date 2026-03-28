export function bumpCreditScore(current, delta) {
  const n = Math.round(current + delta);
  return Math.min(900, Math.max(300, n));
}
