/**
 * Unit Tests — Layer Registry (#426)
 *
 * Tests layer definitions, CPU budget system, tier gating,
 * and layer activation logic.
 */

import {
  LAYERS,
  MAX_LAYER_BUDGET,
  calculateBudget,
  canActivateLayer,
  getAvailableLayers,
  getDefaultLayers,
  getLayerById,
  getActiveTileLayers,
} from '../layerRegistry';

describe('Layer Registry', () => {
  describe('LAYERS', () => {
    it('should define MAX_LAYER_BUDGET at 10', () => {
      expect(MAX_LAYER_BUDGET).toBe(10);
    });

    it('should have satellite as default base layer', () => {
      expect(LAYERS.SATELLITE).toBeDefined();
      expect(LAYERS.SATELLITE.cost).toBe(0);
      expect(LAYERS.SATELLITE.default).toBe(true);
    });

    it('should have all required layer properties', () => {
      Object.values(LAYERS).forEach(layer => {
        expect(layer.id).toBeDefined();
        expect(layer.label).toBeDefined();
        expect(typeof layer.cost).toBe('number');
        expect(layer.tier).toBeDefined();
      });
    });

    it('should have pro layers with cost > 0', () => {
      expect(LAYERS.BATHYMETRY.cost).toBeGreaterThan(0);
      expect(LAYERS.BATHYMETRY.tier).toBe('pro');
      expect(LAYERS.SST.tier).toBe('pro');
      expect(LAYERS.CHLOROPHYLL.tier).toBe('pro');
    });
  });

  describe('getLayerById', () => {
    it('should find layer by id', () => {
      const layer = getLayerById('satellite');
      expect(layer).toBeDefined();
      expect(layer.id).toBe('satellite');
    });

    it('should return null for unknown id', () => {
      expect(getLayerById('nonexistent')).toBeNull();
    });
  });

  describe('calculateBudget', () => {
    it('should return 0 for empty layers', () => {
      expect(calculateBudget([])).toBe(0);
    });

    it('should sum layer costs', () => {
      const budget = calculateBudget(['weather', 'solunar']);
      expect(budget).toBe(2); // 1 + 1
    });

    it('should handle zero-cost base layers', () => {
      const budget = calculateBudget(['satellite', 'terrain']);
      expect(budget).toBe(0);
    });

    it('should correctly sum pro layer costs', () => {
      const budget = calculateBudget(['bathymetry', 'sea_surface_temp']);
      expect(budget).toBe(4); // 2 + 2
    });
  });

  describe('canActivateLayer', () => {
    it('should allow activating layer within budget', () => {
      expect(canActivateLayer('weather', [])).toBe(true);
    });

    it('should reject layer that would exceed budget', () => {
      // Create an active set near budget limit
      const heavy = [
        'bathymetry',
        'sea_surface_temp',
        'chlorophyll',
        'nautical_charts',
        'fish_hotspots',
      ]; // 2*5 = 10
      expect(canActivateLayer('weather', heavy)).toBe(false);
    });

    it('should return false for unknown layer', () => {
      expect(canActivateLayer('nonexistent', [])).toBe(false);
    });
  });

  describe('getAvailableLayers', () => {
    it('should return only free layers for free tier', () => {
      const free = getAvailableLayers('free');
      free.forEach(layer => {
        expect(layer.tier).toBe('free');
      });
    });

    it('should return free + pro layers for pro tier', () => {
      const pro = getAvailableLayers('pro');
      const tiers = [...new Set(pro.map(l => l.tier))];
      expect(tiers).toContain('free');
      expect(tiers).toContain('pro');
    });

    it('should exclude Phase 2 layers by default', () => {
      const layers = getAvailableLayers('pro', 1);
      const p2 = layers.filter(l => l.phase === 2);
      expect(p2.length).toBe(0);
    });
  });

  describe('getDefaultLayers', () => {
    it('should return default layers for free tier', () => {
      const defaults = getDefaultLayers('free');
      expect(defaults.length).toBeGreaterThan(0);
      expect(defaults).toContain('satellite');
    });

    it('should return only layer IDs', () => {
      const defaults = getDefaultLayers('free');
      defaults.forEach(id => {
        expect(typeof id).toBe('string');
      });
    });
  });

  describe('getActiveTileLayers', () => {
    it('should return only raster layers with tile URLs', () => {
      const active = ['weather', 'bathymetry', 'satellite'];
      const tiles = getActiveTileLayers(active);
      tiles.forEach(layer => {
        expect(layer.tileUrl).toBeDefined();
        expect(layer.type).toBe('raster');
      });
    });

    it('should return empty array for no active layers', () => {
      expect(getActiveTileLayers([])).toEqual([]);
    });
  });
});
