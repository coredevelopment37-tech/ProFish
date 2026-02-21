/**
 * Formatting utilities — ProFish
 * Locale-aware number, date, distance formatting
 */

import i18n from '../config/i18n';

// Map our language codes to BCP 47 locales for Intl APIs
const LOCALE_MAP = {
  en: 'en-US',
  sv: 'sv-SE',
  no: 'nb-NO',
  da: 'da-DK',
  fi: 'fi-FI',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
  'pt-BR': 'pt-BR',
  nl: 'nl-NL',
  pl: 'pl-PL',
  cs: 'cs-CZ',
  ru: 'ru-RU',
  tr: 'tr-TR',
  ar: 'ar-SA',
  hi: 'hi-IN',
  ja: 'ja-JP',
  ko: 'ko-KR',
  th: 'th-TH',
  vi: 'vi-VN',
  id: 'id-ID',
  ms: 'ms-MY',
  fil: 'fil-PH',
};

/**
 * Get the BCP 47 locale for the current language
 */
function getLocale() {
  return LOCALE_MAP[i18n.language] || 'en-US';
}

/**
 * Format a number with locale-appropriate separators
 * formatNumber(1234.5) → "1,234.5" (en) / "1.234,5" (de)
 */
export function formatNumber(value, decimals = 0) {
  if (value == null || isNaN(value)) return '—';
  try {
    return new Intl.NumberFormat(getLocale(), {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    return Number(value).toFixed(decimals);
  }
}

/**
 * Format a date in the user's locale
 * formatDate(date, 'short') → "1/15/24" (en) / "15.1.2024" (de)
 */
export function formatDate(date, style = 'medium') {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  const options = {
    short: { year: '2-digit', month: 'numeric', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  };

  try {
    return new Intl.DateTimeFormat(
      getLocale(),
      options[style] || options.medium,
    ).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

/**
 * Format a time string (e.g., "14:30" or Date object)
 */
export function formatTime(date) {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return typeof date === 'string' ? date : '—';

  try {
    return new Intl.DateTimeFormat(getLocale(), {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return d.toLocaleTimeString();
  }
}

/**
 * Format relative time ("2 hours ago", "in 5 minutes")
 */
export function formatRelativeTime(date) {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  try {
    const rtf = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' });
    if (Math.abs(diffMins) < 60) return rtf.format(-diffMins, 'minute');
    if (Math.abs(diffHours) < 24) return rtf.format(-diffHours, 'hour');
    if (Math.abs(diffDays) < 30) return rtf.format(-diffDays, 'day');
    return formatDate(d, 'medium');
  } catch {
    if (Math.abs(diffMins) < 60) return `${diffMins}m ago`;
    if (Math.abs(diffHours) < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }
}

/**
 * Format coordinates for display
 * formatCoords(59.3293, 18.0686) → "59.3293° N, 18.0686° E"
 */
export function formatCoords(lat, lng, decimals = 4) {
  if (lat == null || lng == null) return '—';
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(decimals)}° ${ns}, ${Math.abs(lng).toFixed(
    decimals,
  )}° ${ew}`;
}

/**
 * Format percentage
 */
export function formatPercent(value, decimals = 0) {
  if (value == null || isNaN(value)) return '—';
  return formatNumber(value, decimals) + '%';
}
