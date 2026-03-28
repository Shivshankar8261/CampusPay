export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function periodForCycle(anchor, cycleType) {
  const start = startOfDay(anchor);
  const days = cycleType === "biweekly" ? 14 : 7;
  const end = addDays(start, days);
  return { periodStart: start, periodEnd: end };
}
