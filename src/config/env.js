/**
 * Centralized Environment Config — ProFish
 *
 * Single source of truth for all tokens, keys, and environment variables.
 * Uses react-native-config when available, falls back to process.env / defaults.
 */

import Config from 'react-native-config';

const RNConfig = Config || {};

const get = (key, fallback = '') =>
  RNConfig[key] || process.env[key] || fallback;

export { get as envGet };

// ── Mapbox ───────────────────────────────────────────
export const MAPBOX_ACCESS_TOKEN = get('MAPBOX_ACCESS_TOKEN', '');

// ── Firebase ─────────────────────────────────────────
export const FIREBASE_API_KEY = get('FIREBASE_API_KEY', '');
export const FIREBASE_AUTH_DOMAIN = get(
  'FIREBASE_AUTH_DOMAIN',
  'profish-app.firebaseapp.com',
);
export const FIREBASE_PROJECT_ID = get('FIREBASE_PROJECT_ID', 'profish-app');
export const FIREBASE_STORAGE_BUCKET = get(
  'FIREBASE_STORAGE_BUCKET',
  'profish-app.firebasestorage.app',
);
export const FIREBASE_MESSAGING_SENDER_ID = get(
  'FIREBASE_MESSAGING_SENDER_ID',
  '',
);
export const FIREBASE_APP_ID = get('FIREBASE_APP_ID', '');

// ── Google Sign-In ───────────────────────────────────
export const GOOGLE_WEB_CLIENT_ID = get('GOOGLE_WEB_CLIENT_ID', '');

// ── Sentry ───────────────────────────────────────────
export const SENTRY_DSN = get('SENTRY_DSN', '');

// ── API ──────────────────────────────────────────────
export const API_BASE_URL = get('API_BASE_URL', 'https://api.profish.app');

// ── Google Maps (Android) ────────────────────────────
export const GOOGLE_MAPS_API_KEY = get('GOOGLE_MAPS_API_KEY', '');

// ── WorldTides ───────────────────────────────────────
export const WORLDTIDES_API_KEY = get('WORLDTIDES_API_KEY', '');

// ── RevenueCat ───────────────────────────────────────
export const REVENUECAT_API_KEY_APPLE = get('REVENUECAT_API_KEY_APPLE', '');
export const REVENUECAT_API_KEY_GOOGLE = get('REVENUECAT_API_KEY_GOOGLE', '');

// ── Environment ──────────────────────────────────────
export const IS_DEV =
  typeof __DEV__ !== 'undefined'
    ? __DEV__
    : process.env.NODE_ENV !== 'production';

const envConfig = {
  MAPBOX_ACCESS_TOKEN,
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_MAPS_API_KEY,
  WORLDTIDES_API_KEY,
  REVENUECAT_API_KEY_APPLE,
  REVENUECAT_API_KEY_GOOGLE,
  SENTRY_DSN,
  API_BASE_URL,
  IS_DEV,
};

export default envConfig;
