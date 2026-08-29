/**
 * Display normalisers for the date/time strings the API hands back.
 *
 * `Appointment.date` is `Y-m-d` when it comes through a service that formats it,
 * but a raw serialised model (create/status-update responses, and anything the
 * query cache merges from them) yields a full ISO timestamp like
 * `2026-08-29T00:00:00.000000Z`. Times arrive as either `H:i` or `H:i:s`.
 *
 * Both are *calendar* values in the business timezone — never re-parse them
 * through a Date/DateTime with a zone, or the day slips by one.
 */

/** `2026-08-29T00:00:00.000000Z` | `2026-08-29` → `2026-08-29`. */
export function toIsoDate(value: string | null | undefined): string {
  if (!value) return '';
  const match = String(value).match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : String(value);
}

/** `14:00:00` | `9:00` → `14:00` / `09:00`. */
export function toHm(value: string | null | undefined): string {
  if (!value) return '';
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : String(value);
}

/** `14:00–14:45` (en dash, matching the web). */
export function toTimeRange(start: string | null | undefined, end: string | null | undefined): string {
  return [toHm(start), toHm(end)].filter(Boolean).join('–');
}
