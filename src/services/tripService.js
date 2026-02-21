/**
 * Trip Service — ProFish
 *
 * Groups catches into fishing sessions (trips).
 * Each trip has: start/end time, location, duration, catches,
 * conditions summary, total weight, species list.
 *
 * Supports:
 * - Auto-trip detection (group catches within 4hr window + proximity)
 * - Manual trip creation (start/stop timer)
 * - Trip summary card generation (shareable)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const TRIPS_KEY = '@profish_trips';
const ACTIVE_TRIP_KEY = '@profish_active_trip';

// ── Trip Data Model ──────────────────────────────────────

export function createTrip({
  name = '',
  latitude = null,
  longitude = null,
  locationName = '',
} = {}) {
  return {
    id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: name || `Trip ${new Date().toLocaleDateString()}`,
    latitude,
    longitude,
    locationName,
    startedAt: new Date().toISOString(),
    endedAt: null,
    catches: [], // Array of catch IDs
    conditions: {
      weather: '',
      temperature: null,
      windSpeed: null,
      pressure: null,
      moonPhase: '',
      tideState: '',
    },
    notes: '',
    createdAt: new Date().toISOString(),
  };
}

// ── Service ──────────────────────────────────────────────

const tripService = {
  _trips: [],
  _activeTrip: null,
  _loaded: false,

  async init() {
    if (this._loaded) return;
    try {
      const [tripsRaw, activeRaw] = await Promise.all([
        AsyncStorage.getItem(TRIPS_KEY),
        AsyncStorage.getItem(ACTIVE_TRIP_KEY),
      ]);
      this._trips = tripsRaw ? JSON.parse(tripsRaw) : [];
      this._activeTrip = activeRaw ? JSON.parse(activeRaw) : null;
      this._loaded = true;
    } catch (e) {
      console.warn('[TripService] Init failed:', e);
      this._trips = [];
      this._activeTrip = null;
      this._loaded = true;
    }
  },

  // ─── Active Trip Management ─────────────────────────

  async startTrip(opts = {}) {
    await this.init();
    if (this._activeTrip) {
      // End previous before starting new
      await this.endTrip();
    }
    this._activeTrip = createTrip(opts);
    await AsyncStorage.setItem(
      ACTIVE_TRIP_KEY,
      JSON.stringify(this._activeTrip),
    );
    return this._activeTrip;
  },

  async endTrip() {
    await this.init();
    if (!this._activeTrip) return null;

    this._activeTrip.endedAt = new Date().toISOString();
    this._trips.unshift(this._activeTrip);
    const ended = { ...this._activeTrip };
    this._activeTrip = null;

    await Promise.all([
      this._persistTrips(),
      AsyncStorage.removeItem(ACTIVE_TRIP_KEY),
    ]);

    return ended;
  },

  getActiveTrip() {
    return this._activeTrip ? { ...this._activeTrip } : null;
  },

  isActive() {
    return this._activeTrip !== null;
  },

  async addCatchToActiveTrip(catchId) {
    if (!this._activeTrip) return;
    if (!this._activeTrip.catches.includes(catchId)) {
      this._activeTrip.catches.push(catchId);
      await AsyncStorage.setItem(
        ACTIVE_TRIP_KEY,
        JSON.stringify(this._activeTrip),
      );
    }
  },

  async updateActiveTrip(updates) {
    if (!this._activeTrip) return;
    Object.assign(this._activeTrip, updates);
    await AsyncStorage.setItem(
      ACTIVE_TRIP_KEY,
      JSON.stringify(this._activeTrip),
    );
  },

  // ─── Trip Queries ───────────────────────────────────

  async getTrips({ limit = 50, offset = 0 } = {}) {
    await this.init();
    return this._trips.slice(offset, offset + limit);
  },

  async getTripById(tripId) {
    await this.init();
    return this._trips.find(t => t.id === tripId) || null;
  },

  async deleteTrip(tripId) {
    await this.init();
    this._trips = this._trips.filter(t => t.id !== tripId);
    await this._persistTrips();
  },

  // ─── Auto-detect trips from catch history ───────────

  async autoDetectTrips(catches) {
    await this.init();

    // Sort by time
    const sorted = [...catches].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    );

    const MAX_GAP_MS = 4 * 60 * 60 * 1000; // 4 hours
    const MAX_DISTANCE_KM = 10; // 10km radius
    const autoTrips = [];
    let currentGroup = [];

    for (let i = 0; i < sorted.length; i++) {
      const c = sorted[i];

      if (currentGroup.length === 0) {
        currentGroup.push(c);
        continue;
      }

      const lastCatch = currentGroup[currentGroup.length - 1];
      const timeDiff = new Date(c.createdAt) - new Date(lastCatch.createdAt);
      const dist = haversine(
        lastCatch.latitude,
        lastCatch.longitude,
        c.latitude,
        c.longitude,
      );

      if (timeDiff <= MAX_GAP_MS && dist <= MAX_DISTANCE_KM) {
        currentGroup.push(c);
      } else {
        // Close current group as a trip
        if (currentGroup.length >= 1) {
          autoTrips.push(groupToTrip(currentGroup));
        }
        currentGroup = [c];
      }
    }

    // Final group
    if (currentGroup.length >= 1) {
      autoTrips.push(groupToTrip(currentGroup));
    }

    return autoTrips;
  },

  // ─── Trip Summary (for sharing) ─────────────────────

  async buildTripSummary(tripId, catches) {
    const trip = await this.getTripById(tripId);
    if (!trip) return null;

    // Resolve catches
    const tripCatches = catches.filter(c => trip.catches.includes(c.id));

    const species = [
      ...new Set(tripCatches.map(c => c.species).filter(Boolean)),
    ];
    const totalWeight = tripCatches.reduce(
      (sum, c) => sum + (c.weight || 0),
      0,
    );
    const biggest = tripCatches.reduce(
      (max, c) => ((c.weight || 0) > (max?.weight || 0) ? c : max),
      null,
    );

    const startTime = new Date(trip.startedAt);
    const endTime = trip.endedAt ? new Date(trip.endedAt) : new Date();
    const durationMs = endTime - startTime;
    const durationHrs = (durationMs / (1000 * 60 * 60)).toFixed(1);

    return {
      tripId: trip.id,
      name: trip.name,
      location: trip.locationName || 'Unknown Location',
      date: startTime.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      duration: `${durationHrs} hours`,
      catchCount: tripCatches.length,
      species,
      uniqueSpeciesCount: species.length,
      totalWeight: Math.round(totalWeight * 100) / 100,
      biggestCatch: biggest
        ? {
            species: biggest.species,
            weight: biggest.weight,
            length: biggest.length,
          }
        : null,
      conditions: trip.conditions,
      catches: tripCatches.map(c => ({
        species: c.species,
        weight: c.weight,
        length: c.length,
        photo: c.photo,
      })),
    };
  },

  // ─── Persistence ────────────────────────────────────

  async _persistTrips() {
    try {
      await AsyncStorage.setItem(TRIPS_KEY, JSON.stringify(this._trips));
    } catch (e) {
      console.warn('[TripService] Persist failed:', e);
    }
  },
};

// ── Helpers ──────────────────────────────────────────────

function haversine(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function groupToTrip(catches) {
  const first = catches[0];
  const last = catches[catches.length - 1];

  return {
    id: `auto_trip_${new Date(first.createdAt).getTime()}`,
    name: `Trip ${new Date(first.createdAt).toLocaleDateString()}`,
    latitude: first.latitude,
    longitude: first.longitude,
    locationName: first.locationName || '',
    startedAt: first.createdAt,
    endedAt: last.createdAt,
    catches: catches.map(c => c.id),
    conditions: first.conditions || {},
    notes: '',
    createdAt: first.createdAt,
    autoDetected: true,
  };
}

export default tripService;
