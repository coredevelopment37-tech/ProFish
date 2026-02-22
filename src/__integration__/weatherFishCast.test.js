/**
 * Integration Tests — Weather → FishCast Pipeline (#431)
 *
 * Tests the full data pipeline from weather API fetch through
 * FishCast score calculation.
 *
 * NOTE: Uses mocked weather data to test pipeline without API calls.
 * Run with: jest --config jest.integration.config.js
 */

import { calculateFishCast } from '../../services/fishCastService';
import weatherService from '../../services/weatherService';
import cacheService from '../../services/cacheService';

jest.mock('../../services/weatherService');
jest.mock('../../services/cacheService');

beforeEach(() => {
  jest.clearAllMocks();
  cacheService.get.mockResolvedValue(null);
  cacheService.set.mockResolvedValue(undefined);
  cacheService.coordKey.mockReturnValue('test_key');
});

describe('Weather → FishCast Pipeline', () => {
  it('should produce a valid FishCast from sunny conditions', async () => {
    weatherService.getWeather.mockResolvedValue({
      temperature: 25,
      windSpeed: 8,
      cloudCover: 20,
      precipitation: 0,
      pressureMsl: 1015,
      sunrise: new Date('2025-06-15T06:00:00'),
      sunset: new Date('2025-06-15T20:00:00'),
    });

    const result = await calculateFishCast(40.7, -74.0);
    expect(result).toBeDefined();
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.label).toBeDefined();
  });

  it('should produce a valid FishCast from stormy conditions', async () => {
    weatherService.getWeather.mockResolvedValue({
      temperature: 15,
      windSpeed: 35,
      cloudCover: 95,
      precipitation: 10,
      pressureMsl: 998,
      sunrise: new Date('2025-06-15T06:00:00'),
      sunset: new Date('2025-06-15T20:00:00'),
    });

    const result = await calculateFishCast(40.7, -74.0);
    expect(result).toBeDefined();
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('should weight barometric pressure as a factor', async () => {
    weatherService.getWeather.mockResolvedValue({
      temperature: 22,
      windSpeed: 10,
      cloudCover: 50,
      precipitation: 0,
      pressureMsl: 1013,
      sunrise: new Date('2025-06-15T06:00:00'),
      sunset: new Date('2025-06-15T20:00:00'),
    });

    const result = await calculateFishCast(40.7, -74.0);
    expect(result.factors).toBeDefined();
    expect(result.factors.pressure).toBeDefined();
    expect(typeof result.factors.pressure).toBe('number');
  });

  it('should include weather summary in result', async () => {
    weatherService.getWeather.mockResolvedValue({
      temperature: 22,
      windSpeed: 10,
      cloudCover: 50,
      precipitation: 0,
      pressureMsl: 1013,
      sunrise: new Date('2025-06-15T06:00:00'),
      sunset: new Date('2025-06-15T20:00:00'),
    });

    const result = await calculateFishCast(40.7, -74.0);
    expect(result.weather).toBeDefined();
    expect(result.weather.temp).toBe(22);
    expect(result.weather.wind).toBe(10);
  });
});
