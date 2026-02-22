/**
 * Unit Tests — Tide Service (#425)
 *
 * Tests tide data fetching, NOAA vs WorldTides routing,
 * tide state interpolation, and caching.
 */

import tideService from '../tideService';
import cacheService from '../cacheService';

jest.mock('../cacheService');

beforeEach(() => {
  jest.clearAllMocks();
  cacheService.get.mockResolvedValue(null);
  cacheService.set.mockResolvedValue(undefined);
  cacheService.coordKey.mockImplementation(
    (prefix, lat, lng) => `${prefix}_${lat}_${lng}`,
  );
  global.fetch.mockClear();
});

describe('Tide Service', () => {
  describe('_isUSLocation', () => {
    it('should identify US coordinates (Atlantic coast)', () => {
      expect(tideService._isUSLocation(40.7, -74.0)).toBe(true);
    });

    it('should identify US coordinates (Gulf coast)', () => {
      expect(tideService._isUSLocation(29.9, -90.1)).toBe(true);
    });

    it('should identify non-US coordinates', () => {
      expect(tideService._isUSLocation(51.5, -0.1)).toBe(false); // London
    });
  });

  describe('_interpolateHeight', () => {
    it('should return h1 at fraction 0', () => {
      expect(tideService._interpolateHeight(1.0, 3.0, 0)).toBe(1.0);
    });

    it('should return h2 at fraction 1', () => {
      const result = tideService._interpolateHeight(1.0, 3.0, 1);
      expect(Math.abs(result - 3.0)).toBeLessThan(0.01);
    });

    it('should return midpoint approximately at fraction 0.5', () => {
      const mid = tideService._interpolateHeight(0, 4.0, 0.5);
      expect(Math.abs(mid - 2.0)).toBeLessThan(0.1);
    });

    it('should use cosine interpolation (not linear)', () => {
      // At 0.25, cosine interp should differ from linear (0.25 * range)
      const cosine = tideService._interpolateHeight(0, 4.0, 0.25);
      const linear = 1.0; // 0 + 0.25 * 4
      expect(cosine).not.toBeCloseTo(linear, 1);
    });
  });

  describe('getCurrentTideState', () => {
    it('should return unknown when no tide data', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });

      const result = await tideService.getCurrentTideState(51.5, -0.1);
      expect(result.state).toBe('unknown');
    });
  });

  describe('getTides', () => {
    it('should return cached result if available', async () => {
      const cached = {
        extremes: [{ type: 'High', height: 2.0, date: '2025-06-15T12:00:00Z' }],
      };
      cacheService.get.mockResolvedValue(cached);

      const result = await tideService.getTides(40.7, -74.0);
      expect(result).toEqual(cached);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should cache fetched results', async () => {
      const noaaResponse = {
        predictions: [
          { t: '2025-06-15 06:00', v: '1.5', type: 'H' },
          { t: '2025-06-15 12:00', v: '0.2', type: 'L' },
        ],
      };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(noaaResponse),
      });

      await tideService.getTides(40.7, -74.0);
      expect(cacheService.set).toHaveBeenCalled();
    });
  });
});
