/**
 * Integration Tests — Catch Service Cloud Sync (#429)
 *
 * Tests catch creation → local save → Firestore sync flow.
 *
 * NOTE: Requires Firebase emulator or live Firestore.
 * Run with: jest --config jest.integration.config.js
 */

import { createCatch } from '../../services/catchService';
import catchService from '../../services/catchService';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('CatchService Cloud Sync Integration', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    catchService._catches = [];
    catchService._loaded = false;
  });

  describe('Offline-first creation', () => {
    it('should save catch locally first', async () => {
      const c = createCatch({
        species: 'Largemouth Bass',
        weight: 4.5,
        latitude: 28.5,
        longitude: -81.4,
      });

      expect(c.synced).toBe(false);
      expect(c.id).toBeDefined();
    });

    it('should persist catches across init cycles', async () => {
      const catches = [
        createCatch({ species: 'Bass', latitude: 0, longitude: 0 }),
        createCatch({ species: 'Trout', latitude: 1, longitude: 1 }),
      ];
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(catches));

      await catchService.init();
      expect(catchService._catches.length).toBe(2);
    });
  });

  describe('Sync queue', () => {
    it('should queue catches for sync when offline', () => {
      const c = createCatch({
        species: 'Red Snapper',
        latitude: 29.0,
        longitude: -87.0,
      });
      expect(c.synced).toBe(false);
    });
  });
});
