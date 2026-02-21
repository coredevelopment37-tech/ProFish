/**
 * Offline Manager — ProFish
 * Manages offline map tiles and data caching for Pro subscribers.
 *
 * Ported from ProHunt's offlineManager concept.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_PACKS_KEY = '@profish_offline_packs';

const offlineManager = {
  _packs: [],

  async init() {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_PACKS_KEY);
      this._packs = stored ? JSON.parse(stored) : [];
    } catch (e) {
      this._packs = [];
    }
  },

  async downloadPack({ name, bounds, minZoom = 6, maxZoom = 14 }) {
    // TODO: Implement Mapbox offline pack download
    const pack = {
      id: `pack_${Date.now()}`,
      name,
      bounds,
      minZoom,
      maxZoom,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    this._packs.push(pack);
    await this._persist();
    return pack;
  },

  async getPacks() {
    return this._packs;
  },

  async deletePack(id) {
    this._packs = this._packs.filter(p => p.id !== id);
    await this._persist();
  },

  async _persist() {
    await AsyncStorage.setItem(OFFLINE_PACKS_KEY, JSON.stringify(this._packs));
  },
};

export default offlineManager;
