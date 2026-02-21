/**
 * Catch Service — ProFish
 *
 * Offline-first catch logging with Firestore cloud sync.
 * Catches saved to AsyncStorage immediately, then synced to Firestore
 * when user is authenticated.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_CATCHES_KEY = '@profish_catches';
const SYNC_QUEUE_KEY = '@profish_sync_queue';

// Firestore — graceful import
let firestore = null;
let auth = null;
try {
  firestore = require('@react-native-firebase/firestore').default;
  auth = require('@react-native-firebase/auth').default;
} catch (e) {
  // Not linked yet
}

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

    // Queue for Firestore sync
    await this._queueSync('add', newCatch);
    this._syncToFirestore(); // Fire-and-forget

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

    // Queue delete for Firestore sync
    await this._queueSync('delete', { id });
    this._syncToFirestore();
  },

  async updateCatch(id, updates) {
    await this.init();
    const idx = this._catches.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Catch not found');

    const updated = {
      ...this._catches[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
      synced: false,
    };
    this._catches[idx] = updated;
    await this._persist();

    // Queue update for Firestore sync
    await this._queueSync('update', updated);
    this._syncToFirestore();

    return updated;
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

  // ── Firestore Sync ────────────────────────────────

  _syncing: false,

  /**
   * Queue a sync operation (add/delete) for when we have connectivity + auth
   */
  async _queueSync(action, data) {
    try {
      const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue = stored ? JSON.parse(stored) : [];
      queue.push({ action, data, ts: Date.now() });
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch {}
  },

  /**
   * Process the sync queue — upload pending catches to Firestore using batched writes
   */
  async _syncToFirestore() {
    if (this._syncing || !firestore || !auth) return;
    const user = auth().currentUser;
    if (!user) return;

    this._syncing = true;
    try {
      const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue = stored ? JSON.parse(stored) : [];
      if (queue.length === 0) return;

      const catchesRef = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('catches');

      const failed = [];
      const BATCH_SIZE = 50;

      // Process in batches of 50 (Firestore batch limit is 500, but 50 is safer)
      for (let i = 0; i < queue.length; i += BATCH_SIZE) {
        const chunk = queue.slice(i, i + BATCH_SIZE);
        const batch = firestore().batch();
        const chunkFailed = [];

        for (const item of chunk) {
          try {
            const docRef = catchesRef.doc(item.data.id);
            if (item.action === 'add' || item.action === 'update') {
              batch.set(docRef, {
                ...item.data,
                synced: true,
                userId: user.uid,
              });
            } else if (item.action === 'delete') {
              batch.delete(docRef);
            }
          } catch (e) {
            console.warn('[CatchService] Batch prep failed for item:', e);
            chunkFailed.push(item);
          }
        }

        try {
          await batch.commit();
          // Mark local catches as synced for successful items
          for (const item of chunk) {
            if (chunkFailed.includes(item)) continue;
            if (item.action === 'add' || item.action === 'update') {
              const localCatch = this._catches.find(c => c.id === item.data.id);
              if (localCatch) {
                localCatch.synced = true;
                delete localCatch._syncError;
              }
            }
          }
        } catch (e) {
          console.warn('[CatchService] Batch commit failed:', e);
          // Mark catches with sync error
          for (const item of chunk) {
            if (item.action !== 'delete') {
              const localCatch = this._catches.find(c => c.id === item.data.id);
              if (localCatch) localCatch._syncError = true;
            }
          }
          failed.push(...chunk);
        }

        if (chunkFailed.length > 0) {
          failed.push(...chunkFailed);
        }
      }

      // Keep only failed items in queue
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(failed));
      await this._persist(); // Update synced flags
    } catch (e) {
      console.warn('[CatchService] Sync error:', e);
    } finally {
      this._syncing = false;
    }
  },

  /**
   * Pull catches from Firestore (for fresh installs or new devices)
   */
  async pullFromFirestore() {
    if (!firestore || !auth) return;
    const user = auth().currentUser;
    if (!user) return;

    try {
      const snapshot = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('catches')
        .orderBy('createdAt', 'desc')
        .limit(500)
        .get();

      const remoteCatches = snapshot.docs.map(doc => ({
        ...doc.data(),
        synced: true,
      }));

      // Merge: keep local unsynced catches, add remote ones we don't have
      const localIds = new Set(this._catches.map(c => c.id));
      const newFromRemote = remoteCatches.filter(c => !localIds.has(c.id));

      if (newFromRemote.length > 0) {
        this._catches = [...this._catches, ...newFromRemote].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
        await this._persist();
      }

      return newFromRemote.length;
    } catch (e) {
      console.warn('[CatchService] Pull error:', e);
      return 0;
    }
  },

  /**
   * Retry syncing any queued items (call after login or connectivity restore)
   */
  async retrySync() {
    await this._syncToFirestore();
  },
};

function generateId() {
  return `catch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default catchService;
