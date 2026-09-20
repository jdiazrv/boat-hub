/**
 * Date helpers that work in the user's local time zone.
 *
 * `new Date("2026-09-20")` parses a date-only string as UTC midnight, which is
 * the previous day in time zones west of UTC, and `toISOString()` returns the
 * UTC date, which is off by one around midnight. Use these helpers instead.
 */

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses "YYYY-MM-DD" as local midnight; any other string falls back to Date parsing. */
export function parseLocalDate(value: string): Date {
  const m = DATE_ONLY.exec(value);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(value);
}

/** Local midnight of today. */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Today as "YYYY-MM-DD" in local time. */
export function todayLocalISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Formats a date-only or ISO string for display, e.g. "20 sept 2026". */
export function formatDisplayDate(
  value: string | null | undefined,
  locale: "es" | "en" = "es",
): string {
  if (!value) return "—";
  const d = parseLocalDate(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(locale === "es" ? "es-ES" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
