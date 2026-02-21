/**
 * Offline Manager — ProFish
 * Manages offline map tiles and data caching for Pro subscribers.
 * Uses Mapbox GL offline pack API for real tile downloads.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_PACKS_KEY = '@profish_offline_packs';

// Mapbox offline — graceful import
let MapboxGL = null;
try {
  MapboxGL = require('@rnmapbox/maps').default;
} catch (e) {
  // Not linked yet
}

const offlineManager = {
  _packs: [],
  _progressCallbacks: {},

  async init() {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_PACKS_KEY);
      this._packs = stored ? JSON.parse(stored) : [];

      // Sync status with Mapbox engine
      if (MapboxGL?.offlineManager) {
        const mbPacks = await MapboxGL.offlineManager.getPacks();
        for (const pack of this._packs) {
          const mbPack = mbPacks.find(p => p.name === pack.id);
          if (mbPack) {
            pack.status =
              mbPack.status?.percentage >= 100 ? 'complete' : pack.status;
            pack.progress = mbPack.status?.percentage || pack.progress;
          }
        }
        await this._persist();
      }
    } catch (e) {
      this._packs = [];
    }
  },

  async downloadPack({ name, bounds, minZoom = 6, maxZoom = 14 }) {
    const pack = {
      id: `pack_${Date.now()}`,
      name,
      bounds,
      minZoom,
      maxZoom,
      status: 'downloading',
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    this._packs.push(pack);
    await this._persist();

    // Start real Mapbox download if available
    if (MapboxGL?.offlineManager) {
      try {
        await MapboxGL.offlineManager.createPack(
          {
            name: pack.id,
            styleURL: MapboxGL.StyleURL.Outdoors,
            minZoom: pack.minZoom,
            maxZoom: pack.maxZoom,
            bounds: [
              [bounds.sw.lng, bounds.sw.lat],
              [bounds.ne.lng, bounds.ne.lat],
            ],
          },
          (region, status) => {
            // Progress callback
            const p =
              status.percentage != null ? Math.round(status.percentage) : 0;
            pack.progress = p;
            pack.status = p >= 100 ? 'complete' : 'downloading';
            this._persist();

            const cb = this._progressCallbacks[pack.id];
            if (cb) cb(p, pack.status);
          },
          (region, error) => {
            // Error callback
            console.warn('[OfflineManager] Download error:', error);
            pack.status = 'error';
            pack.error = error?.message || 'Download failed';
            this._persist();
          },
        );
      } catch (e) {
        console.warn('[OfflineManager] createPack failed:', e);
        pack.status = 'error';
        pack.error = e.message;
        await this._persist();
      }
    } else {
      // No Mapbox available — mark as pending for later
      pack.status = 'pending';
      await this._persist();
    }

    return pack;
  },

  onProgress(packId, callback) {
    this._progressCallbacks[packId] = callback;
    return () => {
      delete this._progressCallbacks[packId];
    };
  },

  async getPacks() {
    return this._packs;
  },

  async deletePack(id) {
    // Remove from Mapbox engine
    if (MapboxGL?.offlineManager) {
      try {
        await MapboxGL.offlineManager.deletePack(id);
      } catch (e) {
        // May not exist in engine
      }
    }

    this._packs = this._packs.filter(p => p.id !== id);
    delete this._progressCallbacks[id];
    await this._persist();
  },

  async _persist() {
    try {
      await AsyncStorage.setItem(
        OFFLINE_PACKS_KEY,
        JSON.stringify(this._packs),
      );
    } catch (e) {
      // Silent
    }
  },
};

export default offlineManager;
