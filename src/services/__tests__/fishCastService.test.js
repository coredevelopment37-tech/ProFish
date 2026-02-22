/**
 * Unit Tests — FishCast Service (#420, #421)
 *
 * Tests the FishCast scoring engine, factor calculations,
 * and species adjustment logic.
 */

import { calculateFishCast, adjustScoreForSpecies } from '../fishCastService';
import weatherService from '../weatherService';
import solunarService from '../solunarService';
import tideService from '../tideService';
import cacheService from '../cacheService';

// Mock dependencies
jest.mock('../weatherService');
jest.mock('../solunarService');
jest.mock('../tideService');
jest.mock('../cacheService');

const MOCK_WEATHER = {
  temperature: 22,
  windSpeed: 10,
  cloudCover: 50,
  precipitation: 0,
  pressureMsl: 1013,
  sunrise: new Date('2025-06-15T06:00:00'),
  sunset: new Date('2025-06-15T20:00:00'),
};

const MOCK_SOLUNAR = {
  moonPhase: { phase: 0.5, fishingRating: 4 },
  majorPeriods: [
    {
      start: new Date('2025-06-15T08:00:00'),
      end: new Date('2025-06-15T10:00:00'),
    },
  ],
  minorPeriods: [
    {
      start: new Date('2025-06-15T14:00:00'),
      end: new Date('2025-06-15T15:00:00'),
    },
  ],
};

const MOCK_TIDE = {
  state: 'rising',
  progress: 30,
  height: 1.2,
};

beforeEach(() => {
  jest.clearAllMocks();
  cacheService.get.mockResolvedValue(null);
  cacheService.set.mockResolvedValue(undefined);
  cacheService.coordKey.mockReturnValue('fishcast_key');
  weatherService.getWeather.mockResolvedValue(MOCK_WEATHER);
  solunarService.getSolunarPeriods.mockReturnValue(MOCK_SOLUNAR);
  tideService.getCurrentTideState.mockResolvedValue(MOCK_TIDE);
});

describe('FishCast Service', () => {
  describe('calculateFishCast', () => {
    it('should return a score between 0 and 100', async () => {
      const result = await calculateFishCast(40.7128, -74.006);
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should include all scoring factors', async () => {
      const result = await calculateFishCast(40.7128, -74.006);
      expect(result.factors).toBeDefined();
      expect(result.factors).toHaveProperty('pressure');
      expect(result.factors).toHaveProperty('moonPhase');
      expect(result.factors).toHaveProperty('wind');
      expect(result.factors).toHaveProperty('timeOfDay');
      expect(result.factors).toHaveProperty('cloudCover');
      expect(result.factors).toHaveProperty('precipitation');
      expect(result.factors).toHaveProperty('tideState');
    });

    it('should include a label for the score', async () => {
      const result = await calculateFishCast(40.7128, -74.006);
      expect(typeof result.label).toBe('string');
      expect(result.label.length).toBeGreaterThan(0);
    });

    it('should return cached result if available', async () => {
      const cachedResult = { score: 75, label: 'Good', factors: {} };
      cacheService.get.mockResolvedValue(cachedResult);

      const result = await calculateFishCast(40.7128, -74.006);
      expect(result).toEqual(cachedResult);
      expect(weatherService.getWeather).not.toHaveBeenCalled();
    });

    it('should handle missing tide data gracefully', async () => {
      tideService.getCurrentTideState.mockRejectedValue(new Error('No tide'));

      const result = await calculateFishCast(40.7128, -74.006);
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should cache the computed result', async () => {
      await calculateFishCast(40.7128, -74.006);
      expect(cacheService.set).toHaveBeenCalled();
    });
  });

  describe('adjustScoreForSpecies', () => {
    const baseResult = {
      score: 65,
      label: 'Good',
      factors: {
        pressure: 70,
        moonPhase: 80,
        wind: 60,
        timeOfDay: 70,
        cloudCover: 55,
        precipitation: 80,
        tideState: 50,
      },
    };

    it('should adjust score for a specific species', () => {
      const adjusted = adjustScoreForSpecies(baseResult, 'largemouth_bass', 20);
      expect(adjusted).toBeDefined();
      expect(typeof adjusted.score).toBe('number');
    });

    it('should return base result for unknown species', () => {
      const adjusted = adjustScoreForSpecies(baseResult, 'unknown_fish_xyz');
      expect(adjusted.score).toBe(baseResult.score);
    });

    it('should clamp adjusted score to 0-100 range', () => {
      const highResult = { ...baseResult, score: 99 };
      const adjusted = adjustScoreForSpecies(highResult, 'largemouth_bass', 25);
      expect(adjusted.score).toBeLessThanOrEqual(100);
      expect(adjusted.score).toBeGreaterThanOrEqual(0);
    });
  });
});
