/**
 * Unit Tests — Region Gating Service (#427)
 *
 * Tests region detection, country mapping, and region lookups.
 */

import regionGatingService, { REGIONS } from '../regionGatingService';

// Mock react-native-localize
jest.mock('react-native-localize', () => ({
  getLocales: jest.fn(() => [
    {
      countryCode: 'US',
      languageTag: 'en-US',
      languageCode: 'en',
      isRTL: false,
    },
  ]),
}));

const RNLocalize = require('react-native-localize');

beforeEach(() => {
  regionGatingService._detectedRegion = null;
  regionGatingService._detectedCountry = null;
});

describe('Region Gating Service', () => {
  describe('REGIONS', () => {
    it('should define 12 regions', () => {
      expect(Object.keys(REGIONS).length).toBe(12);
    });

    it('should include North America', () => {
      expect(REGIONS.NA).toBeDefined();
      expect(REGIONS.NA.countries).toContain('US');
      expect(REGIONS.NA.countries).toContain('CA');
    });

    it('should include Europe', () => {
      expect(REGIONS.EU).toBeDefined();
      expect(REGIONS.EU.countries).toContain('GB');
      expect(REGIONS.EU.countries).toContain('DE');
    });

    it('should include Gulf States', () => {
      expect(REGIONS.GCC).toBeDefined();
      expect(REGIONS.GCC.countries).toContain('AE');
      expect(REGIONS.GCC.countries).toContain('SA');
    });

    it('should include Oceania', () => {
      expect(REGIONS.OC).toBeDefined();
      expect(REGIONS.OC.countries).toContain('AU');
    });

    it('each region should have id, label, and countries', () => {
      Object.values(REGIONS).forEach(region => {
        expect(region.id).toBeDefined();
        expect(region.label).toBeDefined();
        expect(Array.isArray(region.countries)).toBe(true);
        expect(region.countries.length).toBeGreaterThan(0);
      });
    });
  });

  describe('detect', () => {
    it('should detect US as North America', () => {
      const result = regionGatingService.detect();
      expect(result.country).toBe('US');
      expect(result.region).toBe('NA');
    });

    it('should detect AU as Oceania', () => {
      RNLocalize.getLocales.mockReturnValue([
        { countryCode: 'AU', languageTag: 'en-AU' },
      ]);
      const result = regionGatingService.detect();
      expect(result.country).toBe('AU');
      expect(result.region).toBe('OC');
    });

    it('should detect JP as East Asia', () => {
      RNLocalize.getLocales.mockReturnValue([
        { countryCode: 'JP', languageTag: 'ja-JP' },
      ]);
      const result = regionGatingService.detect();
      expect(result.country).toBe('JP');
      expect(result.region).toBe('EA');
    });

    it('should return GLOBAL for unknown country', () => {
      RNLocalize.getLocales.mockReturnValue([
        { countryCode: 'XX', languageTag: 'xx-XX' },
      ]);
      const result = regionGatingService.detect();
      expect(result.region).toBe('GLOBAL');
    });
  });

  describe('getCountry / getRegion', () => {
    it('should auto-detect if not already detected', () => {
      const country = regionGatingService.getCountry();
      expect(country).toBe('US');
    });

    it('should return region label', () => {
      regionGatingService.detect();
      expect(regionGatingService.getRegionLabel()).toBe('North America');
    });
  });

  describe('_findRegion', () => {
    it('should find NA for US', () => {
      expect(regionGatingService._findRegion('US')).toBe('NA');
    });

    it('should find EU for GB', () => {
      expect(regionGatingService._findRegion('GB')).toBe('EU');
    });

    it('should find SEA for TH', () => {
      expect(regionGatingService._findRegion('TH')).toBe('SEA');
    });

    it('should return GLOBAL for unmapped country', () => {
      expect(regionGatingService._findRegion('ZZ')).toBe('GLOBAL');
    });
  });
});
