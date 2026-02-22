/**
 * GDPR Compliance Service (#466)
 *
 * Implements:
 * - Data export (right to portability) — JSON/CSV
 * - Account deletion (right to erasure)
 * - Consent management
 * - Data access audit trail
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_KEY = '@profish_gdpr_consent';
const DELETION_REQUEST_KEY = '@profish_deletion_request';

// Data categories the app collects
const DATA_CATEGORIES = {
  ACCOUNT: {
    id: 'account',
    label: 'Account Information',
    description: 'Email, display name, profile photo, authentication method',
    required: true,
    storage: 'firebase_auth',
  },
  CATCHES: {
    id: 'catches',
    label: 'Catch Log Data',
    description:
      'Species, weight, length, photos, GPS coordinates, conditions, notes',
    required: false,
    storage: 'firestore + async_storage',
  },
  LOCATIONS: {
    id: 'locations',
    label: 'Saved Fishing Spots',
    description: 'Location names, GPS coordinates, notes',
    required: false,
    storage: 'firestore + async_storage',
  },
  COMMUNITY: {
    id: 'community',
    label: 'Community Content',
    description: 'Posts, comments, photos shared in social feed',
    required: false,
    storage: 'firestore',
  },
  ANALYTICS: {
    id: 'analytics',
    label: 'Usage Analytics',
    description: 'App usage patterns, feature interactions (anonymized)',
    required: false,
    storage: 'firebase_analytics',
  },
  PREFERENCES: {
    id: 'preferences',
    label: 'App Preferences',
    description:
      'Language, units, notification settings, map layer preferences',
    required: false,
    storage: 'async_storage',
  },
};

let firestore = null;
let auth = null;
try {
  firestore = require('@react-native-firebase/firestore').default;
  auth = require('@react-native-firebase/auth').default;
} catch (e) {
  // Not linked
}

const gdprService = {
  /**
   * Get current consent state
   */
  async getConsent() {
    try {
      const stored = await AsyncStorage.getItem(CONSENT_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}

    return {
      essential: true, // Always required
      analytics: false,
      marketing: false,
      thirdParty: false,
      timestamp: null,
    };
  },

  /**
   * Save consent preferences
   */
  async setConsent(consent) {
    const record = {
      ...consent,
      essential: true, // Cannot opt out of essential
      timestamp: new Date().toISOString(),
      version: '1.0',
    };

    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(record));

    // Log consent change in Firestore for audit trail
    if (firestore && auth().currentUser) {
      try {
        await firestore()
          .collection('consent_records')
          .add({
            userId: auth().currentUser.uid,
            ...record,
          });
      } catch {}
    }

    return record;
  },

  /**
   * Export all user data (right to portability)
   * Returns a JSON object with all user data
   */
  async exportUserData() {
    const userId = auth()?.currentUser?.uid;
    if (!userId) throw new Error('Must be signed in to export data');

    const exportData = {
      exportDate: new Date().toISOString(),
      userId,
      dataCategories: {},
    };

    // 1. Account data
    const user = auth().currentUser;
    exportData.dataCategories.account = {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: user.metadata?.creationTime,
      lastSignIn: user.metadata?.lastSignInTime,
      provider: user.providerData?.[0]?.providerId,
    };

    // 2. Catches
    try {
      const catchesSnap = await firestore()
        .collection('catches')
        .where('userId', '==', userId)
        .get();
      exportData.dataCategories.catches = catchesSnap.docs.map(d => d.data());
    } catch {
      // Fallback to local catches
      const local = await AsyncStorage.getItem('@profish_catches');
      exportData.dataCategories.catches = local ? JSON.parse(local) : [];
    }

    // 3. Saved spots
    try {
      const spotsSnap = await firestore()
        .collection('fishing_spots')
        .where('userId', '==', userId)
        .get();
      exportData.dataCategories.locations = spotsSnap.docs.map(d => d.data());
    } catch {
      exportData.dataCategories.locations = [];
    }

    // 4. Community posts
    try {
      const postsSnap = await firestore()
        .collection('posts')
        .where('userId', '==', userId)
        .get();
      exportData.dataCategories.community = postsSnap.docs.map(d => d.data());
    } catch {
      exportData.dataCategories.community = [];
    }

    // 5. Preferences
    const prefKeys = [
      '@profish_settings',
      '@profish_notifications',
      '@profish_units',
      '@profish_language',
      '@profish_layers',
    ];
    const prefs = {};
    for (const key of prefKeys) {
      const val = await AsyncStorage.getItem(key);
      if (val) prefs[key.replace('@profish_', '')] = JSON.parse(val);
    }
    exportData.dataCategories.preferences = prefs;

    // 6. Consent records
    exportData.dataCategories.consent = await this.getConsent();

    return exportData;
  },

  /**
   * Request account deletion (right to erasure)
   * Schedules deletion in 30 days (with option to cancel)
   */
  async requestDeletion() {
    const userId = auth()?.currentUser?.uid;
    if (!userId) throw new Error('Must be signed in to request deletion');

    const request = {
      userId,
      requestedAt: new Date().toISOString(),
      scheduledDeletion: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      status: 'pending',
    };

    // Store locally
    await AsyncStorage.setItem(DELETION_REQUEST_KEY, JSON.stringify(request));

    // Log in Firestore for server-side processing
    if (firestore) {
      try {
        await firestore().collection('deletion_requests').add(request);
      } catch {}
    }

    return request;
  },

  /**
   * Cancel a pending deletion request
   */
  async cancelDeletion() {
    await AsyncStorage.removeItem(DELETION_REQUEST_KEY);

    if (firestore && auth()?.currentUser) {
      try {
        const userId = auth().currentUser.uid;
        const snapshot = await firestore()
          .collection('deletion_requests')
          .where('userId', '==', userId)
          .where('status', '==', 'pending')
          .get();
        for (const doc of snapshot.docs) {
          await doc.ref.update({ status: 'cancelled' });
        }
      } catch {}
    }

    return { status: 'cancelled' };
  },

  /**
   * Execute immediate deletion (admin/server-triggered)
   */
  async executeImmediateDeletion() {
    const userId = auth()?.currentUser?.uid;
    if (!userId) return;

    // Delete from Firestore collections
    const collections = [
      'catches',
      'fishing_spots',
      'posts',
      'reviews',
      'bookings',
    ];
    for (const coll of collections) {
      try {
        const snap = await firestore()
          .collection(coll)
          .where('userId', '==', userId)
          .get();
        for (const doc of snap.docs) {
          await doc.ref.delete();
        }
      } catch {}
    }

    // Clear local storage
    await AsyncStorage.clear();

    // Delete Firebase auth account
    try {
      await auth().currentUser.delete();
    } catch {}
  },

  /**
   * Get data categories for consent UI
   */
  getDataCategories() {
    return Object.values(DATA_CATEGORIES);
  },
};

export { DATA_CATEGORIES };
export default gdprService;
