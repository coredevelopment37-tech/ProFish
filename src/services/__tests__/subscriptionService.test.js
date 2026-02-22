/**
 * Unit Tests — Subscription Service (#424)
 *
 * Tests tier definitions, limits, SKUs, and subscription logic.
 */

import {
  TIERS,
  TIER_META,
  PRODUCT_SKUS,
  TIER_LIMITS,
} from '../subscriptionService';
import subscriptionService from '../subscriptionService';

describe('Subscription Service', () => {
  describe('TIERS', () => {
    it('should define FREE and PRO tiers', () => {
      expect(TIERS.FREE).toBe('free');
      expect(TIERS.PRO).toBe('pro');
    });

    it('should define all tier keys', () => {
      expect(Object.keys(TIERS).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('TIER_META', () => {
    it('should have metadata for free tier', () => {
      const free = TIER_META[TIERS.FREE];
      expect(free).toBeDefined();
      expect(free.label).toBe('Free');
      expect(free.price).toBe('$0');
    });

    it('should have metadata for pro tier', () => {
      const pro = TIER_META[TIERS.PRO];
      expect(pro).toBeDefined();
      expect(pro.label).toBe('Pro');
      expect(pro.price).toBe('$59.99/yr');
      expect(pro.priceMonthly).toBe('$7.99/mo');
    });

    it('should have icons and descriptions for each tier', () => {
      Object.values(TIER_META).forEach(meta => {
        expect(meta.icon).toBeDefined();
        expect(meta.description).toBeDefined();
        expect(meta.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('PRODUCT_SKUS', () => {
    it('should have pro yearly SKU', () => {
      expect(PRODUCT_SKUS.PRO_YEARLY).toBe('profish_pro_yearly');
    });

    it('should have pro monthly SKU', () => {
      expect(PRODUCT_SKUS.PRO_MONTHLY).toBe('profish_pro_monthly');
    });
  });

  describe('TIER_LIMITS', () => {
    it('should limit free tier to 5 catches per month', () => {
      expect(TIER_LIMITS[TIERS.FREE].maxCatchesPerMonth).toBe(5);
    });

    it('should give free tier 1 day FishCast', () => {
      expect(TIER_LIMITS[TIERS.FREE].fishCastDays).toBe(1);
    });

    it('should limit free tier to 5 AI IDs per day', () => {
      expect(TIER_LIMITS[TIERS.FREE].aiSpeciesIdPerDay).toBe(5);
    });

    it('should give pro tier unlimited catches', () => {
      expect(TIER_LIMITS[TIERS.PRO].maxCatchesPerMonth).toBe(Infinity);
    });

    it('should give pro tier offline maps', () => {
      expect(TIER_LIMITS[TIERS.PRO].offlineMaps).toBe(true);
    });

    it('should disable offline maps for free tier', () => {
      expect(TIER_LIMITS[TIERS.FREE].offlineMaps).toBe(false);
    });

    it('should give pro tier all map layers', () => {
      const proLimits = TIER_LIMITS[TIERS.PRO];
      expect(proLimits.bathymetry).toBe(true);
      expect(proLimits.sst).toBe(true);
      expect(proLimits.chlorophyll).toBe(true);
      expect(proLimits.nauticalCharts).toBe(true);
    });

    it('should disable pro layers for free tier', () => {
      const freeLimits = TIER_LIMITS[TIERS.FREE];
      expect(freeLimits.bathymetry).toBe(false);
      expect(freeLimits.sst).toBe(false);
      expect(freeLimits.chlorophyll).toBe(false);
    });
  });

  describe('subscriptionService', () => {
    it('should be an object with methods', () => {
      expect(subscriptionService).toBeDefined();
      expect(typeof subscriptionService).toBe('object');
    });
  });
});
