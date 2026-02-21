/**
 * Unit conversion utilities for ProFish
 *
 * All data is stored in metric (kg, cm).
 * Display values are converted based on user preference.
 */

// ── Weight ──────────────────────────────
export function formatWeight(kg, units = 'metric') {
  if (kg == null) return '—';
  if (units === 'imperial') {
    const lb = kg * 2.20462;
    return `${lb.toFixed(2)} lb`;
  }
  return `${kg.toFixed(2)} kg`;
}

export function weightLabel(units = 'metric') {
  return units === 'imperial' ? 'lb' : 'kg';
}

export function toKg(value, units) {
  if (!value) return null;
  const n = parseFloat(value);
  if (isNaN(n)) return null;
  return units === 'imperial' ? n * 0.453592 : n;
}

export function fromKg(kg, units) {
  if (kg == null) return null;
  return units === 'imperial' ? kg * 2.20462 : kg;
}

// ── Length ──────────────────────────────
export function formatLength(cm, units = 'metric') {
  if (cm == null) return '—';
  if (units === 'imperial') {
    const inches = cm * 0.393701;
    return `${inches.toFixed(1)} in`;
  }
  return `${cm.toFixed(1)} cm`;
}

export function lengthLabel(units = 'metric') {
  return units === 'imperial' ? 'in' : 'cm';
}

export function toCm(value, units) {
  if (!value) return null;
  const n = parseFloat(value);
  if (isNaN(n)) return null;
  return units === 'imperial' ? n * 2.54 : n;
}

export function fromCm(cm, units) {
  if (cm == null) return null;
  return units === 'imperial' ? cm * 0.393701 : cm;
}

// ── Temperature ────────────────────────
export function formatTemp(celsius, units = 'metric') {
  if (celsius == null) return '—';
  if (units === 'imperial') {
    return `${Math.round((celsius * 9) / 5 + 32)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

// ── Distance ───────────────────────────
export function formatDistance(meters, units = 'metric') {
  if (meters == null) return '—';
  if (units === 'imperial') {
    const miles = meters / 1609.344;
    return miles < 0.1
      ? `${Math.round(meters * 3.28084)} ft`
      : `${miles.toFixed(1)} mi`;
  }
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(1)} km`;
}

// ── Wind Speed ─────────────────────────
export function formatWind(kmh, units = 'metric') {
  if (kmh == null) return '—';
  if (units === 'imperial') {
    return `${Math.round(kmh * 0.621371)} mph`;
  }
  return `${Math.round(kmh)} km/h`;
}
