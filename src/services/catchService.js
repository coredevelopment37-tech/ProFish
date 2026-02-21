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

  async getCatches({
    limit = 500,
    offset = 0,
    species = null,
    cursor = null,
    paginated = false,
  } = {}) {
    await this.init();
    let filtered = this._catches;
    if (species) {
      filtered = filtered.filter(
        c => c.species.toLowerCase() === species.toLowerCase(),
      );
    }
    // Cursor-based pagination: if cursor is a createdAt ISO string, skip items before it
    if (cursor) {
      const cursorIdx = filtered.findIndex(c => c.createdAt === cursor);
      if (cursorIdx >= 0) {
        filtered = filtered.slice(cursorIdx + 1);
      }
    } else if (offset) {
      filtered = filtered.slice(offset);
    }
    const page = filtered.slice(0, limit);

    // Return paginated result or plain array for backward compatibility
    if (paginated) {
      return {
        data: page,
        nextCursor:
          page.length === limit ? page[page.length - 1].createdAt : null,
        hasMore: page.length === limit,
      };
    }
    return page;
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

  // ── Background Sync ────────────────────────────────
  _bgTimer: null,
  _BG_INTERVAL: 5 * 60 * 1000, // 5 minutes

  /**
   * Start periodic background sync on a timer
   */
  startBackgroundSync() {
    if (this._bgTimer) return;
    this._bgTimer = setInterval(async () => {
      try {
        await this._syncToFirestore();
        await this.pullFromFirestore();
      } catch (e) {
        console.warn('[CatchService] Background sync cycle error:', e);
      }
    }, this._BG_INTERVAL);
    console.log('[CatchService] Background sync started (5m interval)');
  },

  stopBackgroundSync() {
    if (this._bgTimer) {
      clearInterval(this._bgTimer);
      this._bgTimer = null;
      console.log('[CatchService] Background sync stopped');
    }
  },

  // ── Conflict Resolution (last-write-wins by updatedAt) ──

  /**
   * Merge remote doc with local doc using last-write-wins strategy.
   * Returns the winning version.
   */
  _resolveConflict(local, remote) {
    const localTime = new Date(local.updatedAt || local.createdAt).getTime();
    const remoteTime = new Date(remote.updatedAt || remote.createdAt).getTime();
    // Last-write-wins: the newer timestamp takes precedence
    if (remoteTime > localTime) {
      return { ...remote, synced: true };
    }
    return { ...local, synced: false }; // local wins, needs re-sync
  },

  /**
   * Full bidirectional sync with conflict resolution
   */
  async fullSync() {
    if (!firestore || !auth) return { pulled: 0, pushed: 0, conflicts: 0 };
    const user = auth().currentUser;
    if (!user) return { pulled: 0, pushed: 0, conflicts: 0 };

    await this.init();
    let conflicts = 0;

    try {
      // 1. Pull remote
      const snapshot = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('catches')
        .orderBy('createdAt', 'desc')
        .limit(1000)
        .get();

      const remoteMap = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        remoteMap[data.id] = { ...data, synced: true };
      });

      // 2. Merge with conflict resolution
      const localMap = {};
      this._catches.forEach(c => {
        localMap[c.id] = c;
      });

      // Resolve conflicts for items that exist both locally and remotely
      for (const id of Object.keys(localMap)) {
        if (remoteMap[id]) {
          const resolved = this._resolveConflict(localMap[id], remoteMap[id]);
          localMap[id] = resolved;
          if (resolved !== localMap[id]) conflicts++;
          delete remoteMap[id]; // handled
        }
      }

      // Add remote-only items
      const pulled = Object.keys(remoteMap).length;
      for (const id of Object.keys(remoteMap)) {
        localMap[id] = remoteMap[id];
      }

      // Rebuild sorted list
      this._catches = Object.values(localMap).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      await this._persist();

      // 3. Push unsynced local catches
      await this._syncToFirestore();
      const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const remaining = stored ? JSON.parse(stored) : [];
      const pushed = this._catches.filter(c => c.synced).length;

      return { pulled, pushed, conflicts };
    } catch (e) {
      console.warn('[CatchService] Full sync error:', e);
      return { pulled: 0, pushed: 0, conflicts: 0 };
    }
  },
};

function generateId() {
  return `catch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default catchService;
