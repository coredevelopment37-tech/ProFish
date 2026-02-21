/**
 * Feature Flags — ProFish
 *
 * Remote feature toggling via Firebase Remote Config.
 * Allows toggling features on/off without app updates.
 *
 * Usage:
 *   await featureFlags.init();
 *   if (featureFlags.isEnabled('community_feed')) { ... }
 *   const maxLayers = featureFlags.getNumber('max_free_layers', 6);
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const FLAGS_STORAGE_KEY = '@profish_feature_flags';
const FETCH_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours

// Firebase Remote Config — graceful import
let remoteConfig = null;
try {
  remoteConfig = require('@react-native-firebase/remote-config').default;
} catch (e) {
  // Remote Config not linked yet — fall back to defaults
}

// Default flag values (used before first fetch and as fallbacks)
const DEFAULTS = {
  // Core features
  community_feed: true,
  fishcast_7day: true,
  species_ai_id: false,
  live_tournaments: false,

  // Limits
  max_free_catches: 5,
  max_free_layers: 6,
  free_fishcast_days: 1,

  // Experiments
  new_paywall_design: false,
  onboarding_v2: false,
  dark_mode_only: true,

  // Kill switches
  maintenance_mode: false,
  force_update: false,
  min_app_version: '0.1.0',

  // Tier pricing overrides (empty = use defaults)
  pro_monthly_override: '',
  pro_yearly_override: '',
};

let _flags = { ...DEFAULTS };
let _initialized = false;
let _lastFetch = 0;

const featureFlags = {
  /**
   * Initialize feature flags — fetch from Remote Config or load cached
   */
  async init() {
    if (_initialized) return;

    try {
      // Load cached flags first for instant access
      const cached = await AsyncStorage.getItem(FLAGS_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        _flags = { ...DEFAULTS, ...parsed.flags };
        _lastFetch = parsed.lastFetch || 0;
      }

      // Attempt remote fetch if stale
      if (Date.now() - _lastFetch > FETCH_INTERVAL) {
        await this._fetchRemote();
      }

      _initialized = true;
    } catch (e) {
      console.warn('[FeatureFlags] Init error:', e);
      _initialized = true; // Continue with defaults
    }
  },

  /**
   * Check if a boolean feature flag is enabled
   */
  isEnabled(flag) {
    return _flags[flag] === true || _flags[flag] === 'true';
  },

  /**
   * Get a string flag value
   */
  getString(flag, defaultValue = '') {
    return _flags[flag] != null ? String(_flags[flag]) : defaultValue;
  },

  /**
   * Get a numeric flag value
   */
  getNumber(flag, defaultValue = 0) {
    const val = Number(_flags[flag]);
    return isNaN(val) ? defaultValue : val;
  },

  /**
   * Get all flags (for debugging/display)
   */
  getAllFlags() {
    return { ..._flags };
  },

  /**
   * Force refresh from remote
   */
  async refresh() {
    await this._fetchRemote();
  },

  /**
   * Override a flag locally (for testing/development)
   */
  async setOverride(flag, value) {
    _flags[flag] = value;
    await this._persist();
  },

  /**
   * Clear all local overrides, revert to remote/defaults
   */
  async clearOverrides() {
    _flags = { ...DEFAULTS };
    _lastFetch = 0;
    await AsyncStorage.removeItem(FLAGS_STORAGE_KEY);
    await this._fetchRemote();
  },

  // ── Internal ──────────────────────────────────────────

  async _fetchRemote() {
    if (!remoteConfig) return;

    try {
      const config = remoteConfig();

      // Set defaults
      await config.setDefaults(
        Object.fromEntries(
          Object.entries(DEFAULTS).map(([k, v]) => [k, String(v)]),
        ),
      );

      // Set minimum fetch interval (0 for dev, 12hr for prod)
      await config.setConfigSettings({
        minimumFetchIntervalMillis: __DEV__ ? 0 : FETCH_INTERVAL,
      });

      // Fetch and activate
      await config.fetchAndActivate();

      // Read all values
      const allValues = config.getAll();
      for (const [key, entry] of Object.entries(allValues)) {
        const defaultVal = DEFAULTS[key];
        if (typeof defaultVal === 'boolean') {
          _flags[key] = entry.asBoolean();
        } else if (typeof defaultVal === 'number') {
          _flags[key] = entry.asNumber();
        } else {
          _flags[key] = entry.asString();
        }
      }

      _lastFetch = Date.now();
      await this._persist();
    } catch (e) {
      console.warn('[FeatureFlags] Remote fetch failed:', e);
      // Continue with cached/default values
    }
  },

  async _persist() {
    try {
      await AsyncStorage.setItem(
        FLAGS_STORAGE_KEY,
        JSON.stringify({ flags: _flags, lastFetch: _lastFetch }),
      );
    } catch {}
  },
};

export default featureFlags;
