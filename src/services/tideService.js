/**
 * Tide Service — ProFish
 *
 * Fetches tide predictions globally using WorldTides API
 * Falls back to NOAA CO-OPS for US stations (free)
 *
 * WorldTides token budget: 20,000 dev tokens
 * - Each extremes call ≈ 1 token per day requested
 * - We cache aggressively (6hr TTL) and prefer NOAA for US
 */

import { WORLDTIDES_API_KEY } from '../config/env';
import cacheService from './cacheService';

const NOAA_BASE = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
const WORLDTIDES_BASE = 'https://www.worldtides.info/api/v3';

const TIDE_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
const TIDE_STALE_TTL = 24 * 60 * 60 * 1000; // 24 hours (offline fallback)

const tideService = {
  /**
   * Get tide predictions for a location
   * Automatically uses NOAA for US, WorldTides for everywhere else
   */
  async getTides(latitude, longitude, { days = 1 } = {}) {
    const cacheKey = cacheService.coordKey('tide', latitude, longitude);
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    // Try NOAA first for US locations (free — no token cost)
    if (this._isUSLocation(latitude, longitude)) {
      try {
        const result = await this._getNoaaTides(latitude, longitude, days);
        await cacheService.set(cacheKey, result, TIDE_CACHE_TTL);
        await cacheService.set(cacheKey + '_stale', result, TIDE_STALE_TTL);
        return result;
      } catch {
        // Fall through to WorldTides
      }
    }

    // WorldTides for global coverage
    if (WORLDTIDES_API_KEY) {
      try {
        const result = await this._getWorldTides(latitude, longitude, days);
        await cacheService.set(cacheKey, result, TIDE_CACHE_TTL);
        await cacheService.set(cacheKey + '_stale', result, TIDE_STALE_TTL);
        return result;
      } catch {
        // Try offline fallback
        const stale = await cacheService.get(cacheKey + '_stale');
        if (stale) return { ...stale, _stale: true };
      }
    }

    return null;
  },

  /**
   * Get current tide state (rising/falling/high/low)
   */
  async getCurrentTideState(latitude, longitude) {
    const tides = await this.getTides(latitude, longitude, { days: 1 });
    if (!tides || !tides.extremes || tides.extremes.length < 2) {
      return { state: 'unknown' };
    }

    const now = new Date();
    const extremes = tides.extremes.sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );

    // Find surrounding extremes
    for (let i = 0; i < extremes.length - 1; i++) {
      const current = new Date(extremes[i].date);
      const next = new Date(extremes[i + 1].date);

      if (now >= current && now <= next) {
        const isRising = extremes[i].type === 'Low';
        const progress = (now - current) / (next - current);
        const height = this._interpolateHeight(
          extremes[i].height,
          extremes[i + 1].height,
          progress,
        );
        return {
          state: isRising ? 'rising' : 'falling',
          progress: Math.round(progress * 100),
          height: Math.round(height * 100) / 100,
          lastExtreme: extremes[i],
          nextExtreme: extremes[i + 1],
        };
      }
    }

    return { state: 'unknown' };
  },

  /**
   * Interpolate tide height at a specific time between known extremes.
   * Uses cosine interpolation (Rule of Twelfths approximation).
   *
   * @param {number} h1 - Height at start extreme
   * @param {number} h2 - Height at end extreme
   * @param {number} fraction - 0..1 position between the two extremes
   * @returns {number} Interpolated height
   */
  _interpolateHeight(h1, h2, fraction) {
    // Cosine interpolation: smoother than linear, matches tidal curves well
    const cosine = (1 - Math.cos(fraction * Math.PI)) / 2;
    return h1 + (h2 - h1) * cosine;
  },

  /**
   * Get tide height at any arbitrary time for a location.
   * Returns the cosine-interpolated height between surrounding extremes.
   *
   * @param {number} latitude
   * @param {number} longitude
   * @param {Date} [time=now] - Target time (default: now)
   * @returns {{ height: number, state: string, progress: number, extremes: object[] } | null}
   */
  async getHeightAtTime(latitude, longitude, time = new Date()) {
    const tides = await this.getTides(latitude, longitude, { days: 2 });
    if (!tides || !tides.extremes || tides.extremes.length < 2) {
      return null;
    }

    const target = new Date(time).getTime();
    const extremes = tides.extremes.sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );

    for (let i = 0; i < extremes.length - 1; i++) {
      const t1 = new Date(extremes[i].date).getTime();
      const t2 = new Date(extremes[i + 1].date).getTime();

      if (target >= t1 && target <= t2) {
        const fraction = (target - t1) / (t2 - t1);
        const height = this._interpolateHeight(
          extremes[i].height,
          extremes[i + 1].height,
          fraction,
        );
        const isRising = extremes[i].type === 'Low';

        return {
          height: Math.round(height * 100) / 100,
          state: isRising ? 'rising' : 'falling',
          progress: Math.round(fraction * 100),
          prevExtreme: extremes[i],
          nextExtreme: extremes[i + 1],
        };
      }
    }

    return null;
  },

  /**
   * Generate tide curve data points for charting.
   * Returns an array of { time, height } for every `intervalMinutes` minutes.
   *
   * @param {number} latitude
   * @param {number} longitude
   * @param {number} [hours=24] - Total hours to generate
   * @param {number} [intervalMinutes=15] - Interval between data points
   */
  async getTideCurve(latitude, longitude, hours = 24, intervalMinutes = 15) {
    const tides = await this.getTides(latitude, longitude, { days: 2 });
    if (!tides || !tides.extremes || tides.extremes.length < 2) {
      return [];
    }

    const extremes = tides.extremes.sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
    const now = new Date();
    const points = [];
    const totalMinutes = hours * 60;

    for (let m = 0; m <= totalMinutes; m += intervalMinutes) {
      const t = new Date(now.getTime() + m * 60 * 1000);
      const tMs = t.getTime();

      for (let i = 0; i < extremes.length - 1; i++) {
        const t1 = new Date(extremes[i].date).getTime();
        const t2 = new Date(extremes[i + 1].date).getTime();

        if (tMs >= t1 && tMs <= t2) {
          const fraction = (tMs - t1) / (t2 - t1);
          const height = this._interpolateHeight(
            extremes[i].height,
            extremes[i + 1].height,
            fraction,
          );
          points.push({
            time: t.toISOString(),
            height: Math.round(height * 100) / 100,
          });
          break;
        }
      }
    }

    return points;
  },

  // ── NOAA (US free) ─────────────────────────────────

  // Cache the station list so we only fetch it once
  _noaaStations: null,
  _noaaStationsPromise: null,

  /**
   * Fetch all NOAA tide prediction stations (once, then cached)
   * https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json
   */
  async _getNoaaStations() {
    if (this._noaaStations) return this._noaaStations;
    if (this._noaaStationsPromise) return this._noaaStationsPromise;

    this._noaaStationsPromise = (async () => {
      try {
        const res = await fetch(
          'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions&units=metric',
        );
        if (!res.ok) throw new Error('NOAA stations API error');
        const data = await res.json();
        this._noaaStations = (data.stations || []).map(s => ({
          id: s.id,
          name: s.name,
          lat: s.lat,
          lng: s.lng,
        }));
        return this._noaaStations;
      } catch (e) {
        this._noaaStationsPromise = null;
        throw e;
      }
    })();
    return this._noaaStationsPromise;
  },

  /**
   * Find the nearest NOAA station within 100km
   */
  async _findNearestStation(latitude, longitude) {
    const stations = await this._getNoaaStations();
    let nearest = null;
    let minDist = Infinity;

    for (const s of stations) {
      const d = this._haversine(latitude, longitude, s.lat, s.lng);
      if (d < minDist) {
        minDist = d;
        nearest = s;
      }
    }

    // Only use if within 100km
    if (nearest && minDist <= 100) {
      return nearest;
    }
    return null;
  },

  /**
   * Haversine distance in km between two points
   */
  _haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = deg => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  async _getNoaaTides(latitude, longitude, days) {
    // Find nearest tide prediction station
    const station = await this._findNearestStation(latitude, longitude);
    if (!station) throw new Error('No NOAA station nearby');

    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + days);

    const params = new URLSearchParams({
      begin_date: this._formatNoaaDate(now),
      end_date: this._formatNoaaDate(end),
      station: station.id,
      product: 'predictions',
      datum: 'MLLW',
      units: 'metric',
      time_zone: 'gmt',
      application: 'ProFish',
      format: 'json',
      interval: 'hilo',
    });

    const response = await fetch(`${NOAA_BASE}?${params}`);
    if (!response.ok) throw new Error('NOAA API error');

    const data = await response.json();
    const result = this._normalizeNoaaData(data);
    result.stationName = station.name;
    result.stationId = station.id;
    return result;
  },

  // ── WorldTides (global) — costs ~1 token/day requested ──
  async _getWorldTides(latitude, longitude, days) {
    const params = new URLSearchParams({
      key: WORLDTIDES_API_KEY,
      lat: latitude.toString(),
      lon: longitude.toString(),
      days: Math.min(days, 2).toString(), // Cap at 2 days to save tokens
      datum: 'LAT',
    });

    const response = await fetch(`${WORLDTIDES_BASE}?extremes&${params}`);
    if (!response.ok) throw new Error('WorldTides API error');

    const data = await response.json();
    return {
      extremes: (data.extremes || []).map(e => ({
        date: new Date(e.dt * 1000).toISOString(),
        height: e.height,
        type: e.type === 'High' ? 'High' : 'Low',
      })),
      source: 'worldtides',
    };
  },

  // ── Helpers ────────────────────────────────────────
  _isUSLocation(lat, lng) {
    // Rough US bounding box (continental + Alaska + Hawaii)
    return (
      (lat >= 24.5 && lat <= 49.5 && lng >= -125 && lng <= -66.5) ||
      (lat >= 51 && lat <= 72 && lng >= -180 && lng <= -130) || // Alaska
      (lat >= 18.5 && lat <= 22.5 && lng >= -161 && lng <= -154) // Hawaii
    );
  },

  _formatNoaaDate(date) {
    return (
      date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0')
    );
  },

  _normalizeNoaaData(data) {
    if (!data.predictions) return { extremes: [], source: 'noaa' };
    return {
      extremes: data.predictions.map(p => ({
        date: p.t,
        height: parseFloat(p.v),
        type: p.type === 'H' ? 'High' : 'Low',
      })),
      source: 'noaa',
    };
  },
};

export default tideService;
