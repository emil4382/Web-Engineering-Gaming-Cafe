// formatting helpers

// currency
const EURO_FORMATTER = new Intl.NumberFormat( 'de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} );

// date
const DATE_FORMATTER = new Intl.DateTimeFormat( 'de-DE', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
} );

export function formatEuro(value ) {
  const num = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  if (num == null || Number.isNaN(num)) return '–';
  return EURO_FORMATTER.format(num);
}

export function formatDateDE( isoDate) {
  if (!isoDate) return '';
  const date = isoDate instanceof Date ? isoDate : new Date(isoDate);
  if (Number.isNaN(date.getTime( ))) return String(isoDate );
  return DATE_FORMATTER.format( date);
}
