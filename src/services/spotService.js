/**
 * Fishing Spots Service — ProFish
 *
 * Save and manage favorite fishing locations.
 * Stored locally with optional Firestore sync.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const SPOTS_KEY = '@profish_fishing_spots';

let firestore = null;
let auth = null;
try {
  firestore = require('@react-native-firebase/firestore').default;
  auth = require('@react-native-firebase/auth').default;
} catch (e) {}

const spotService = {
  _spots: [],
  _loaded: false,

  async init() {
    if (this._loaded) return;
    try {
      const stored = await AsyncStorage.getItem(SPOTS_KEY);
      this._spots = stored ? JSON.parse(stored) : [];
      this._loaded = true;
    } catch (e) {
      console.warn('[SpotService] Failed to load spots:', e);
      this._spots = [];
      this._loaded = true;
    }
  },

  async getSpots() {
    await this.init();
    return this._spots;
  },

  async addSpot({
    name,
    latitude,
    longitude,
    waterType = 'freshwater',
    notes = '',
    icon = '📍',
  }) {
    await this.init();
    const spot = {
      id: `spot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name,
      latitude,
      longitude,
      waterType,
      notes,
      icon,
      catchCount: 0,
      createdAt: new Date().toISOString(),
    };
    this._spots.unshift(spot);
    await this._persist();
    return spot;
  },

  async updateSpot(id, updates) {
    await this.init();
    const index = this._spots.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Spot not found');
    this._spots[index] = { ...this._spots[index], ...updates };
    await this._persist();
    return this._spots[index];
  },

  async deleteSpot(id) {
    await this.init();
    this._spots = this._spots.filter(s => s.id !== id);
    await this._persist();
  },

  async getSpotById(id) {
    await this.init();
    return this._spots.find(s => s.id === id) || null;
  },

  async getNearbySpots(lat, lng, radiusKm = 50) {
    await this.init();
    return this._spots.filter(s => {
      const dist = haversine(lat, lng, s.latitude, s.longitude);
      return dist <= radiusKm;
    });
  },

  async incrementCatchCount(spotId) {
    await this.init();
    const spot = this._spots.find(s => s.id === spotId);
    if (spot) {
      spot.catchCount = (spot.catchCount || 0) + 1;
      await this._persist();
    }
  },

  async getSpotCount() {
    await this.init();
    return this._spots.length;
  },

  async _persist() {
    try {
      await AsyncStorage.setItem(SPOTS_KEY, JSON.stringify(this._spots));
    } catch (e) {
      console.warn('[SpotService] Failed to persist:', e);
    }
  },
};

/**
 * Haversine distance in km
 */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default spotService;
