/**
 * Unit Tests — Catch Service (#423)
 *
 * Tests catch creation, local storage, and data structure integrity.
 */

import { createCatch } from '../catchService';
import catchService from '../catchService';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Catch Service', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    catchService._catches = [];
    catchService._loaded = false;
  });

  describe('createCatch', () => {
    it('should create a catch with required fields', () => {
      const c = createCatch({
        species: 'Largemouth Bass',
        latitude: 28.5,
        longitude: -81.4,
      });

      expect(c).toBeDefined();
      expect(c.id).toBeDefined();
      expect(c.species).toBe('Largemouth Bass');
      expect(c.latitude).toBe(28.5);
      expect(c.longitude).toBe(-81.4);
    });

    it('should generate a unique ID', () => {
      const c1 = createCatch({ species: 'Bass', latitude: 0, longitude: 0 });
      const c2 = createCatch({ species: 'Trout', latitude: 0, longitude: 0 });
      expect(c1.id).not.toBe(c2.id);
    });

    it('should default to saltwater waterType', () => {
      const c = createCatch({ species: 'Test', latitude: 0, longitude: 0 });
      expect(c.waterType).toBe('saltwater');
    });

    it('should set synced to false initially', () => {
      const c = createCatch({ species: 'Test', latitude: 0, longitude: 0 });
      expect(c.synced).toBe(false);
    });

    it('should include createdAt timestamp', () => {
      const c = createCatch({ species: 'Test', latitude: 0, longitude: 0 });
      expect(c.createdAt).toBeDefined();
      expect(new Date(c.createdAt).getTime()).not.toBeNaN();
    });

    it('should include full conditions structure', () => {
      const c = createCatch({
        species: 'Test',
        latitude: 0,
        longitude: 0,
        conditions: { weather: 'sunny', temperature: 25 },
      });
      expect(c.conditions.weather).toBe('sunny');
      expect(c.conditions.temperature).toBe(25);
      expect(c.conditions.tideState).toBe('');
    });

    it('should handle all optional fields', () => {
      const c = createCatch({
        species: 'Red Snapper',
        weight: 5.5,
        length: 24,
        latitude: 29.5,
        longitude: -87.2,
        locationName: 'Gulf Pier',
        bait: 'live shrimp',
        method: 'bottom fishing',
        notes: 'Nice catch!',
        released: true,
      });

      expect(c.weight).toBe(5.5);
      expect(c.length).toBe(24);
      expect(c.locationName).toBe('Gulf Pier');
      expect(c.bait).toBe('live shrimp');
      expect(c.method).toBe('bottom fishing');
      expect(c.notes).toBe('Nice catch!');
      expect(c.released).toBe(true);
    });
  });

  describe('catchService.init', () => {
    it('should load catches from AsyncStorage', async () => {
      const mockCatches = [
        createCatch({ species: 'Bass', latitude: 0, longitude: 0 }),
      ];
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockCatches));

      await catchService.init();
      expect(catchService._loaded).toBe(true);
      expect(catchService._catches.length).toBe(1);
    });

    it('should handle empty storage', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      await catchService.init();
      expect(catchService._loaded).toBe(true);
      expect(catchService._catches).toEqual([]);
    });

    it('should handle parse errors gracefully', async () => {
      AsyncStorage.getItem.mockResolvedValue('invalid json{{{');

      await catchService.init();
      expect(catchService._catches).toEqual([]);
    });
  });
});
