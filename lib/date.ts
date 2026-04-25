/**
 * Date helpers using LOCAL timezone, never UTC.
 *
 * Why: `new Date().toISOString().slice(0, 10)` returns the UTC date, which is
 * off-by-one for users east of UTC during their early morning hours. For an
 * app where "today" means the user's local today (training entry dates, etc.),
 * we must use local date components.
 */

/** YYYY-MM-DD in the user's (or server's) local timezone. */
export function ymdLocal(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Monday (YYYY-MM-DD) of the local week containing `d` (default today). */
export function mondayOfWeek(d: Date = new Date()): string {
  const day = d.getDay();          // 0 = Sun, 1 = Mon, …, 6 = Sat
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return ymdLocal(mon);
}

/** Sunday (YYYY-MM-DD) of the local week containing `d` (default today). */
export function sundayOfWeek(d: Date = new Date()): string {
  const day = d.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  const sun = new Date(d);
  sun.setDate(d.getDate() + diff);
  return ymdLocal(sun);
}

/** Array of YYYY-MM-DD strings for Mon–Sun of the local week containing `d`. */
export function weekDays(d: Date = new Date()): string[] {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    return ymdLocal(x);
  });
}
