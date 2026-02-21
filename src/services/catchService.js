/**
 * Catch Service — ProFish
 *
 * Core service for logging, retrieving, and managing fishing catches.
 * Uses Firebase Firestore for cloud storage with offline support.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_CATCHES_KEY = '@profish_catches';

// Catch data structure
export const createCatch = ({
  species = '',
  weight = null,
  length = null,
  latitude,
  longitude,
  locationName = '',
  photo = null,
  bait = '',
  method = '',
  waterType = 'saltwater', // saltwater | freshwater | brackish
  conditions = {},
  notes = '',
  released = false,
}) => ({
  id: generateId(),
  species,
  weight,
  length,
  latitude,
  longitude,
  locationName,
  photo,
  bait,
  method,
  waterType,
  conditions: {
    weather: conditions.weather || '',
    temperature: conditions.temperature || null,
    windSpeed: conditions.windSpeed || null,
    windDirection: conditions.windDirection || null,
    pressure: conditions.pressure || null,
    moonPhase: conditions.moonPhase || '',
    tideState: conditions.tideState || '', // rising | falling | high | low
    waterTemp: conditions.waterTemp || null,
    waterClarity: conditions.waterClarity || '', // clear | murky | stained
  },
  released,
  notes,
  createdAt: new Date().toISOString(),
  synced: false,
});

const catchService = {
  _catches: [],
  _loaded: false,

  async init() {
    if (this._loaded) return;
    try {
      const stored = await AsyncStorage.getItem(LOCAL_CATCHES_KEY);
      this._catches = stored ? JSON.parse(stored) : [];
      this._loaded = true;
    } catch (e) {
      console.warn('[CatchService] Failed to load catches:', e);
      this._catches = [];
      this._loaded = true;
    }
  },

  async logCatch(catchData) {
    const newCatch = createCatch(catchData);
    this._catches.unshift(newCatch);
    await this._persist();
    // TODO: Sync to Firestore when online
    return newCatch;
  },

  async getCatches({ limit = 50, offset = 0, species = null } = {}) {
    await this.init();
    let filtered = this._catches;
    if (species) {
      filtered = filtered.filter(
        c => c.species.toLowerCase() === species.toLowerCase(),
      );
    }
    return filtered.slice(offset, offset + limit);
  },

  async getCatchById(id) {
    await this.init();
    return this._catches.find(c => c.id === id) || null;
  },

  async deleteCatch(id) {
    await this.init();
    this._catches = this._catches.filter(c => c.id !== id);
    await this._persist();
  },

  async getCatchCount() {
    await this.init();
    return this._catches.length;
  },

  async getMonthCatchCount() {
    await this.init();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return this._catches.filter(c => new Date(c.createdAt) >= monthStart)
      .length;
  },

  async getPersonalRecords() {
    await this.init();
    const records = {};
    for (const c of this._catches) {
      if (!c.species || !c.weight) continue;
      const key = c.species.toLowerCase();
      if (!records[key] || c.weight > records[key].weight) {
        records[key] = c;
      }
    }
    return records;
  },

  async getSpeciesList() {
    await this.init();
    const species = new Set(
      this._catches.filter(c => c.species).map(c => c.species),
    );
    return Array.from(species).sort();
  },

  async _persist() {
    try {
      await AsyncStorage.setItem(
        LOCAL_CATCHES_KEY,
        JSON.stringify(this._catches),
      );
    } catch (e) {
      console.warn('[CatchService] Failed to persist:', e);
    }
  },
};

function generateId() {
  return `catch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default catchService;
