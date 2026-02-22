/**
 * Unit Tests — Solunar Service (#422)
 *
 * Tests sun time calculations, moon phase algorithm,
 * and solunar feeding period logic.
 */

import {
  getSunTimes,
  getMoonPhase,
  getSolunarPeriods,
} from '../solunarService';

describe('Solunar Service', () => {
  const NYC_LAT = 40.7128;
  const NYC_LNG = -74.006;
  const SUMMER_DATE = new Date('2025-06-21T12:00:00Z'); // Summer solstice
  const WINTER_DATE = new Date('2025-12-21T12:00:00Z'); // Winter solstice

  describe('getSunTimes', () => {
    it('should return sunrise and sunset times', () => {
      const result = getSunTimes(NYC_LAT, NYC_LNG, SUMMER_DATE);
      expect(result).toBeDefined();
      expect(result.sunrise).toBeDefined();
      expect(result.sunset).toBeDefined();
    });

    it('should return solar noon', () => {
      const result = getSunTimes(NYC_LAT, NYC_LNG, SUMMER_DATE);
      expect(result.solarNoon).toBeDefined();
    });

    it('should return golden hour times', () => {
      const result = getSunTimes(NYC_LAT, NYC_LNG, SUMMER_DATE);
      expect(result.goldenHourMorning).toBeDefined();
      expect(result.goldenHourEvening).toBeDefined();
    });

    it('should have longer days in summer than winter', () => {
      const summer = getSunTimes(NYC_LAT, NYC_LNG, SUMMER_DATE);
      const winter = getSunTimes(NYC_LAT, NYC_LNG, WINTER_DATE);
      const summerHours = parseFloat(summer.dayLength);
      const winterHours = parseFloat(winter.dayLength);
      expect(summerHours).toBeGreaterThan(winterHours);
    });

    it('should handle extreme latitudes (polar)', () => {
      const arctic = getSunTimes(80, 0, SUMMER_DATE);
      // In summer, arctic may have midnight sun
      expect(arctic.midnightSun === true || arctic.sunrise !== undefined).toBe(
        true,
      );
    });
  });

  describe('getMoonPhase', () => {
    it('should return phase between 0 and 1', () => {
      const result = getMoonPhase(SUMMER_DATE);
      expect(result.phase).toBeGreaterThanOrEqual(0);
      expect(result.phase).toBeLessThanOrEqual(1);
    });

    it('should return illumination percentage', () => {
      const result = getMoonPhase(SUMMER_DATE);
      expect(result.illumination).toBeGreaterThanOrEqual(0);
      expect(result.illumination).toBeLessThanOrEqual(100);
    });

    it('should return a phase name string', () => {
      const result = getMoonPhase(SUMMER_DATE);
      expect(typeof result.name).toBe('string');
      expect(result.name.length).toBeGreaterThan(0);
    });

    it('should return a fishing rating 1-5', () => {
      const result = getMoonPhase(SUMMER_DATE);
      expect(result.fishingRating).toBeGreaterThanOrEqual(1);
      expect(result.fishingRating).toBeLessThanOrEqual(5);
    });

    it('should produce different phases for different dates', () => {
      const phase1 = getMoonPhase(new Date('2025-01-01'));
      const phase2 = getMoonPhase(new Date('2025-01-15'));
      expect(phase1.phase).not.toBe(phase2.phase);
    });
  });

  describe('getSolunarPeriods', () => {
    it('should return major and minor feeding periods', () => {
      const result = getSolunarPeriods(NYC_LAT, NYC_LNG, SUMMER_DATE);
      expect(result).toBeDefined();
      expect(result.majorPeriods).toBeDefined();
      expect(result.minorPeriods).toBeDefined();
    });

    it('should include moon phase data', () => {
      const result = getSolunarPeriods(NYC_LAT, NYC_LNG, SUMMER_DATE);
      expect(result.moonPhase).toBeDefined();
      expect(result.moonPhase.phase).toBeDefined();
    });

    it('should have at least one major and one minor period', () => {
      const result = getSolunarPeriods(NYC_LAT, NYC_LNG, SUMMER_DATE);
      expect(result.majorPeriods.length).toBeGreaterThanOrEqual(1);
      expect(result.minorPeriods.length).toBeGreaterThanOrEqual(1);
    });

    it('should include sun data', () => {
      const result = getSolunarPeriods(NYC_LAT, NYC_LNG, SUMMER_DATE);
      expect(result.sun).toBeDefined();
    });
  });
});
