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

const NOAA_BASE = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
const WORLDTIDES_BASE = 'https://www.worldtides.info/api/v3';

// In-memory cache to conserve WorldTides tokens
const _cache = {};
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

function _cacheKey(lat, lng) {
  // Round to ~1km grid to group nearby requests
  return `${(lat * 10).toFixed(0)}_${(lng * 10).toFixed(0)}`;
}

const tideService = {
  /**
   * Get tide predictions for a location
   * Automatically uses NOAA for US, WorldTides for everywhere else
   */
  async getTides(latitude, longitude, { days = 1 } = {}) {
    // Try NOAA first for US locations (free — no token cost)
    if (this._isUSLocation(latitude, longitude)) {
      try {
        return await this._getNoaaTides(latitude, longitude, days);
      } catch {
        // Fall through to WorldTides
      }
    }

    // WorldTides for global coverage (costs tokens — check cache first)
    if (WORLDTIDES_API_KEY) {
      const key = _cacheKey(latitude, longitude);
      const cached = _cache[key];
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return cached.data;
      }

      const result = await this._getWorldTides(latitude, longitude, days);
      _cache[key] = { data: result, ts: Date.now() };
      return result;
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
        return {
          state: isRising ? 'rising' : 'falling',
          progress: Math.round(progress * 100),
          lastExtreme: extremes[i],
          nextExtreme: extremes[i + 1],
        };
      }
    }

    return { state: 'unknown' };
  },

  // ── NOAA (US free) ─────────────────────────────────
  async _getNoaaTides(latitude, longitude, days) {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + days);

    const params = new URLSearchParams({
      begin_date: this._formatNoaaDate(now),
      end_date: this._formatNoaaDate(end),
      station: '', // TODO: Find nearest station
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
    return this._normalizeNoaaData(data);
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
