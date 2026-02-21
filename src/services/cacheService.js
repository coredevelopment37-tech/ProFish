/**
 * Cache Service — ProFish
 * Persistent + in-memory caching with configurable TTLs
 * Used to cache weather, tides, FishCast data for offline use
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@profish_cache_';
const memoryCache = {};

const cacheService = {
  /**
   * Get cached data (memory first, then AsyncStorage)
   * Returns null if expired or not found
   */
  async get(key) {
    const fullKey = PREFIX + key;

    // Check memory cache first
    const mem = memoryCache[fullKey];
    if (mem && Date.now() < mem.expiresAt) {
      return mem.data;
    }

    // Check persistent storage
    try {
      const raw = await AsyncStorage.getItem(fullKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() >= parsed.expiresAt) {
        // Expired — clean up async
        AsyncStorage.removeItem(fullKey).catch(() => {});
        delete memoryCache[fullKey];
        return null;
      }
      // Populate memory cache
      memoryCache[fullKey] = parsed;
      return parsed.data;
    } catch {
      return null;
    }
  },

  /**
   * Store data with a TTL (ms)
   * Saves to both memory and AsyncStorage
   */
  async set(key, data, ttlMs) {
    const fullKey = PREFIX + key;
    const entry = {
      data,
      expiresAt: Date.now() + ttlMs,
      cachedAt: Date.now(),
    };

    // Memory
    memoryCache[fullKey] = entry;

    // Persistent
    try {
      await AsyncStorage.setItem(fullKey, JSON.stringify(entry));
    } catch {
      // Storage full — memory cache still works
    }
  },

  /**
   * Invalidate a cached entry
   */
  async invalidate(key) {
    const fullKey = PREFIX + key;
    delete memoryCache[fullKey];
    try {
      await AsyncStorage.removeItem(fullKey);
    } catch {}
  },

  /**
   * Clear all cache entries
   */
  async clearAll() {
    Object.keys(memoryCache).forEach(k => {
      if (k.startsWith(PREFIX)) delete memoryCache[k];
    });
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(PREFIX));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch {}
  },

  /**
   * Get cache stats (for debug / profile screen)
   */
  async getStats() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(PREFIX));
      let totalSize = 0;
      let validCount = 0;
      let expiredCount = 0;

      for (const key of cacheKeys) {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          totalSize += raw.length;
          try {
            const parsed = JSON.parse(raw);
            if (Date.now() < parsed.expiresAt) validCount++;
            else expiredCount++;
          } catch {
            expiredCount++;
          }
        }
      }

      return {
        totalEntries: cacheKeys.length,
        validEntries: validCount,
        expiredEntries: expiredCount,
        estimatedSizeKB: Math.round(totalSize / 1024),
        memoryEntries: Object.keys(memoryCache).filter(k =>
          k.startsWith(PREFIX),
        ).length,
      };
    } catch {
      return {
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0,
        estimatedSizeKB: 0,
        memoryEntries: 0,
      };
    }
  },

  /**
   * Helper: create a cache key from coordinates + prefix
   */
  coordKey(prefix, lat, lng) {
    return `${prefix}_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  },
};

export default cacheService;
