/**
 * Preferences & Spots Firestore Service — ProFish
 *
 * Syncs user preferences and fishing spots to Firestore:
 *   users/{uid}/preferences (single doc)
 *   users/{uid}/spots (subcollection)
 *
 * Offline-first: writes to AsyncStorage first, then syncs to Firestore.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_PREFS_KEY = '@profish_preferences';
const LOCAL_SPOTS_KEY = '@profish_spots';

let firestore = null;
let auth = null;
try {
  firestore = require('@react-native-firebase/firestore').default;
  auth = require('@react-native-firebase/auth').default;
} catch {}

// ── Default preferences ──────────────────────────────
const DEFAULT_PREFERENCES = {
  units: 'metric', // metric | imperial
  language: 'en',
  darkMode: true,
  notifications: {
    dailyForecast: true,
    weeklyReport: true,
    communityActivity: true,
    tideAlerts: false,
  },
  defaultWaterType: 'saltwater',
  favoriteSpecies: [],
  mapStyle: 'satellite',
  autoWeather: true,
  autoGPS: true,
};

// ── Spots data model ─────────────────────────────────
export function createSpot({
  name = '',
  latitude,
  longitude,
  waterType = 'saltwater',
  notes = '',
  icon = 'mapPin',
  isPrivate = true,
} = {}) {
  return {
    id: `spot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    latitude,
    longitude,
    waterType,
    notes,
    icon,
    isPrivate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const preferencesService = {
  _prefs: null,
  _spots: null,

  // ── Preferences ─────────────────────────────────────

  async getPreferences() {
    if (this._prefs) return this._prefs;
    try {
      const stored = await AsyncStorage.getItem(LOCAL_PREFS_KEY);
      this._prefs = stored
        ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) }
        : { ...DEFAULT_PREFERENCES };
    } catch {
      this._prefs = { ...DEFAULT_PREFERENCES };
    }
    return this._prefs;
  },

  async setPreference(key, value) {
    const prefs = await this.getPreferences();
    prefs[key] = value;
    prefs.updatedAt = new Date().toISOString();
    this._prefs = prefs;
    await AsyncStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(prefs));
    this._syncPrefsToFirestore();
    return prefs;
  },

  async setPreferences(updates) {
    const prefs = await this.getPreferences();
    Object.assign(prefs, updates);
    prefs.updatedAt = new Date().toISOString();
    this._prefs = prefs;
    await AsyncStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(prefs));
    this._syncPrefsToFirestore();
    return prefs;
  },

  async _syncPrefsToFirestore() {
    if (!firestore || !auth) return;
    const user = auth().currentUser;
    if (!user) return;

    try {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('preferences')
        .doc('settings')
        .set(this._prefs, { merge: true });
    } catch (e) {
      console.warn('[PrefsService] Sync prefs error:', e);
    }
  },

  async pullPrefsFromFirestore() {
    if (!firestore || !auth) return;
    const user = auth().currentUser;
    if (!user) return;

    try {
      const doc = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('preferences')
        .doc('settings')
        .get();

      if (doc.exists) {
        const remote = doc.data();
        const local = await this.getPreferences();

        // Last-write-wins
        const remoteTime = new Date(remote.updatedAt || 0).getTime();
        const localTime = new Date(local.updatedAt || 0).getTime();

        if (remoteTime > localTime) {
          this._prefs = { ...DEFAULT_PREFERENCES, ...remote };
          await AsyncStorage.setItem(
            LOCAL_PREFS_KEY,
            JSON.stringify(this._prefs),
          );
          return this._prefs;
        }
      }
    } catch (e) {
      console.warn('[PrefsService] Pull prefs error:', e);
    }
    return this._prefs;
  },

  // ── Spots ───────────────────────────────────────────

  async getSpots() {
    if (this._spots) return this._spots;
    try {
      const stored = await AsyncStorage.getItem(LOCAL_SPOTS_KEY);
      this._spots = stored ? JSON.parse(stored) : [];
    } catch {
      this._spots = [];
    }
    return this._spots;
  },

  async addSpot(spotData) {
    const spot = createSpot(spotData);
    const spots = await this.getSpots();
    spots.unshift(spot);
    this._spots = spots;
    await AsyncStorage.setItem(LOCAL_SPOTS_KEY, JSON.stringify(spots));
    this._syncSpotToFirestore(spot);
    return spot;
  },

  async updateSpot(id, updates) {
    const spots = await this.getSpots();
    const idx = spots.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Spot not found');

    spots[idx] = {
      ...spots[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this._spots = spots;
    await AsyncStorage.setItem(LOCAL_SPOTS_KEY, JSON.stringify(spots));
    this._syncSpotToFirestore(spots[idx]);
    return spots[idx];
  },

  async deleteSpot(id) {
    const spots = await this.getSpots();
    this._spots = spots.filter(s => s.id !== id);
    await AsyncStorage.setItem(LOCAL_SPOTS_KEY, JSON.stringify(this._spots));

    if (!firestore || !auth) return;
    const user = auth().currentUser;
    if (!user) return;

    try {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('spots')
        .doc(id)
        .delete();
    } catch (e) {
      console.warn('[PrefsService] Delete spot error:', e);
    }
  },

  async _syncSpotToFirestore(spot) {
    if (!firestore || !auth) return;
    const user = auth().currentUser;
    if (!user) return;

    try {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('spots')
        .doc(spot.id)
        .set(spot, { merge: true });
    } catch (e) {
      console.warn('[PrefsService] Sync spot error:', e);
    }
  },

  async pullSpotsFromFirestore() {
    if (!firestore || !auth) return 0;
    const user = auth().currentUser;
    if (!user) return 0;

    try {
      const snapshot = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('spots')
        .orderBy('createdAt', 'desc')
        .limit(200)
        .get();

      const remoteSpots = snapshot.docs.map(doc => doc.data());
      const localSpots = await this.getSpots();
      const localIds = new Set(localSpots.map(s => s.id));

      let added = 0;
      for (const remote of remoteSpots) {
        if (!localIds.has(remote.id)) {
          localSpots.push(remote);
          added++;
        } else {
          // Conflict resolution: last-write-wins
          const idx = localSpots.findIndex(s => s.id === remote.id);
          if (idx >= 0) {
            const localTime = new Date(
              localSpots[idx].updatedAt || 0,
            ).getTime();
            const remoteTime = new Date(remote.updatedAt || 0).getTime();
            if (remoteTime > localTime) {
              localSpots[idx] = remote;
            }
          }
        }
      }

      this._spots = localSpots.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      await AsyncStorage.setItem(LOCAL_SPOTS_KEY, JSON.stringify(this._spots));

      return added;
    } catch (e) {
      console.warn('[PrefsService] Pull spots error:', e);
      return 0;
    }
  },

  /**
   * Pull all data from Firestore (preferences + spots)
   */
  async pullAll() {
    await Promise.all([
      this.pullPrefsFromFirestore(),
      this.pullSpotsFromFirestore(),
    ]);
  },
};

export default preferencesService;
