/**
 * Solunar Service — ProFish
 *
 * Calculates solunar (sun/moon) tables for fishing activity prediction.
 * Major/minor feeding periods based on moon transit and position.
 *
 * Free — calculated locally on device, no API needed.
 */

/**
 * Calculate sun times (sunrise, sunset, golden hours)
 * Uses simplified solar position algorithm
 */
export function getSunTimes(latitude, longitude, date = new Date()) {
  const dayOfYear = getDayOfYear(date);
  const B = ((2 * Math.PI) / 365) * (dayOfYear - 81);

  // Equation of time (minutes)
  const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

  // Solar declination
  const declination =
    23.45 * Math.sin(((2 * Math.PI) / 365) * (dayOfYear - 81));
  const decRad = (declination * Math.PI) / 180;
  const latRad = (latitude * Math.PI) / 180;

  // Hour angle
  const cosH =
    (Math.cos((90.833 * Math.PI) / 180) - Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(latRad) * Math.cos(decRad));

  if (cosH > 1) return { polarNight: true }; // Sun never rises
  if (cosH < -1) return { midnightSun: true }; // Sun never sets

  const H = (Math.acos(cosH) * 180) / Math.PI;
  const timezone = -longitude / 15; // Approximate

  const solarNoon = 720 - 4 * longitude - EoT;
  const sunrise = solarNoon - H * 4;
  const sunset = solarNoon + H * 4;

  return {
    sunrise: minutesToTime(sunrise, date),
    sunset: minutesToTime(sunset, date),
    solarNoon: minutesToTime(solarNoon, date),
    goldenHourMorning: minutesToTime(sunrise + 60, date),
    goldenHourEvening: minutesToTime(sunset - 60, date),
    dayLength: ((sunset - sunrise) / 60).toFixed(1) + 'h',
  };
}

/**
 * Calculate moon phase (0-1, where 0/1 = new moon, 0.5 = full moon)
 */
export function getMoonPhase(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Conway's moon phase algorithm
  let r = year % 100;
  r %= 19;
  if (r > 9) r -= 19;
  r = ((r * 11) % 30) + month + day;
  if (month < 3) r += 2;
  r -= year < 2000 ? 4 : 8.3;
  r = Math.floor(r + 0.5) % 30;
  if (r < 0) r += 30;

  const phase = r / 29.53; // Normalize to 0-1

  return {
    phase,
    illumination: Math.round((1 - Math.cos(phase * 2 * Math.PI)) * 50),
    name: getMoonPhaseName(phase),
    fishingRating: getMoonFishingRating(phase),
  };
}

/**
 * Calculate solunar periods (major and minor feeding times)
 * Major: Moon overhead/underfoot (~2hr windows)
 * Minor: Moonrise/moonset (~1hr windows)
 */
export function getSolunarPeriods(latitude, longitude, date = new Date()) {
  const moon = getMoonPhase(date);
  const sun = getSunTimes(latitude, longitude, date);

  // Simplified solunar — full algorithm needs precise moon transit times
  // For now, use estimated major/minor periods
  const dayMinutes = getDayMinutes(date);

  // Major periods: ~every 12.4 hours (moon transit cycle)
  const majorOffset = (date.getDate() * 48.76) % (24 * 60);
  const major1 = majorOffset;
  const major2 = (majorOffset + 12 * 60 + 25) % (24 * 60);

  // Minor periods: ~6.2 hours offset from majors
  const minor1 = (major1 + 6 * 60 + 12) % (24 * 60);
  const minor2 = (major2 + 6 * 60 + 12) % (24 * 60);

  return {
    major: [
      {
        start: minutesToTime(major1 - 60, date),
        end: minutesToTime(major1 + 60, date),
        quality: 'major',
      },
      {
        start: minutesToTime(major2 - 60, date),
        end: minutesToTime(major2 + 60, date),
        quality: 'major',
      },
    ],
    minor: [
      {
        start: minutesToTime(minor1 - 30, date),
        end: minutesToTime(minor1 + 30, date),
        quality: 'minor',
      },
      {
        start: minutesToTime(minor2 - 30, date),
        end: minutesToTime(minor2 + 30, date),
        quality: 'minor',
      },
    ],
    moonPhase: moon,
    sunTimes: sun,
    overallRating: calculateOverallRating(moon, sun, date),
  };
}

// ── Internal helpers ─────────────────────────────────────

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getDayMinutes(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function minutesToTime(minutes, date) {
  const m = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(m / 60);
  const min = Math.floor(m % 60);
  const d = new Date(date);
  d.setHours(h, min, 0, 0);
  return d.toISOString();
}

function getMoonPhaseName(phase) {
  if (phase < 0.03 || phase > 0.97) return 'New Moon';
  if (phase < 0.22) return 'Waxing Crescent';
  if (phase < 0.28) return 'First Quarter';
  if (phase < 0.47) return 'Waxing Gibbous';
  if (phase < 0.53) return 'Full Moon';
  if (phase < 0.72) return 'Waning Gibbous';
  if (phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

function getMoonFishingRating(phase) {
  // New Moon & Full Moon are best for fishing
  const distFromExtreme = Math.min(phase, Math.abs(phase - 0.5), 1 - phase);
  if (distFromExtreme < 0.05) return 5; // Excellent
  if (distFromExtreme < 0.1) return 4; // Very Good
  if (distFromExtreme < 0.2) return 3; // Good
  if (distFromExtreme < 0.3) return 2; // Fair
  return 1; // Poor
}

function calculateOverallRating(moon, sun, date) {
  // Combine moon phase + time of day for overall fishing rating
  let rating = moon.fishingRating;

  const hours = date.getHours();
  // Dawn/dusk bonus
  if ((hours >= 5 && hours <= 8) || (hours >= 17 && hours <= 20)) {
    rating = Math.min(5, rating + 1);
  }
  // Midday penalty
  if (hours >= 11 && hours <= 14) {
    rating = Math.max(1, rating - 1);
  }

  return rating;
}

export default {
  getSunTimes,
  getMoonPhase,
  getSolunarPeriods,
};
