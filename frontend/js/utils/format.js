/**
 * @file Locale-aware formatting helpers (German / EUR).
 * @module utils/format
 */

/** Cached EUR currency formatter (de-DE). */
const EURO_FORMATTER = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Cached long date formatter (de-DE), e.g. "26. Juni 2026". */
const DATE_FORMATTER = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

/**
 * Format a number as a German Euro string, e.g. `5` → `"5,00 €"`.
 * Non-numeric / NaN input falls back to `"–"` so the UI never prints "NaN €".
 * @param {number|string} value - Amount in euros.
 * @returns {string} Formatted currency string.
 */
export function formatEuro(value) {
  const num = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  if (num == null || Number.isNaN(num)) return '–';
  return EURO_FORMATTER.format(num);
}

/**
 * Format an ISO date (`YYYY-MM-DD` or full ISO string) as a German long date,
 * e.g. `"2026-06-26"` → `"26. Juni 2026"`.
 * Invalid input is returned unchanged so callers can show raw values safely.
 * @param {string|Date} isoDate - ISO date string or Date instance.
 * @returns {string} Formatted date, or the original input if it cannot be parsed.
 */
export function formatDateDE(isoDate) {
  if (!isoDate) return '';
  const date = isoDate instanceof Date ? isoDate : new Date(isoDate);
  if (Number.isNaN(date.getTime())) return String(isoDate);
  return DATE_FORMATTER.format(date);
}
