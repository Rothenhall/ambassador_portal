export function currentWeek(startsAt: Date, endsAt: Date, now = new Date()) {
  const totalWeeks = Math.round((endsAt.getTime() - startsAt.getTime()) / (7 * 86400000));
  const elapsed = Math.floor((now.getTime() - startsAt.getTime()) / (7 * 86400000)) + 1;
  return { week: Math.min(Math.max(elapsed, 1), totalWeeks), totalWeeks };
}
