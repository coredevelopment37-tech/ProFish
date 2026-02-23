/**
 * Constants — ProFish centralized configuration
 *
 * All magic numbers, limits, defaults, and config values in one place.
 */

// ── Typography ──────────────────────────────────────────
export const FONTS = {
  h1: { fontSize: 28, fontWeight: 'bold' },
  h2: { fontSize: 22, fontWeight: '600' },
  h3: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  bodySmall: { fontSize: 14, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
};

// ── Spacing (4px grid) ──────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ── Border Radius ───────────────────────────────────────
export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  round: 24,
  full: 9999,
};

// ── API Config ──────────────────────────────────────────
export const API = {
  OPEN_METEO_BASE: 'https://api.open-meteo.com/v1',
  OPEN_METEO_MARINE: 'https://marine-api.open-meteo.com/v1',
  NOAA_COOPS_BASE: 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter',
  WORLDTIDES_BASE: 'https://www.worldtides.info/api/v3',
  MAPBOX_GEOCODING: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
  GEBCO_TILES:
    'https://tiles.arcgis.com/tiles/C8EMgrsFcRFL6LrL/arcgis/rest/services/GEBCO_basemap_NCEI/MapServer/tile/{z}/{y}/{x}',
  NOAA_NAUTICAL_TILES:
    'https://tileservice.charts.noaa.gov/tiles/50000_1/{z}/{x}/{y}.png',
  RETRY_MAX_ATTEMPTS: 3,
  RETRY_BASE_DELAY_MS: 1000,
  REQUEST_TIMEOUT_MS: 15000,
};

// ── Cache TTLs (milliseconds) ───────────────────────────
export const CACHE_TTL = {
  WEATHER: 60 * 60 * 1000, // 1 hour
  MARINE: 4 * 60 * 60 * 1000, // 4 hours
  TIDES: 6 * 60 * 60 * 1000, // 6 hours
  FISHCAST: 60 * 60 * 1000, // 1 hour
  SPECIES: 24 * 60 * 60 * 1000, // 24 hours (rarely changes)
  STALE_FALLBACK: 24 * 60 * 60 * 1000, // 24-hour stale fallback
};

// ── Free Tier Limits ────────────────────────────────────
export const FREE_LIMITS = {
  MAX_CATCHES_PER_MONTH: 5,
  MAX_FISHING_SPOTS: 5,
  FISHCAST_DAYS: 1,
  AI_SPECIES_ID_PER_DAY: 5,
  MAX_OFFLINE_PACKS: 0,
};

// ── Photo Config ────────────────────────────────────────
export const PHOTO = {
  MAX_DIMENSION: 1024,
  QUALITY: 0.8,
  FORMAT: 'jpeg',
  MAX_FILE_SIZE_MB: 5,
};

// ── Map Defaults ────────────────────────────────────────
export const MAP = {
  DEFAULT_CENTER: [18.0686, 59.3293], // Stockholm
  DEFAULT_ZOOM: 2,
  USER_ZOOM: 12,
  DETAIL_ZOOM: 14,
  ANIMATION_DURATION: 800,
  GPS_DISTANCE_FILTER: 20,
  GPS_INTERVAL: 10000,
  GPS_TIMEOUT: 10000,
  MAX_OFFLINE_PACK_SIZE_MB: 500,
  CLUSTER_RADIUS: 50,
  CLUSTER_MAX_ZOOM: 14,
};

// ── Sync Config ─────────────────────────────────────────
export const SYNC = {
  BATCH_SIZE: 50,
  MAX_RETRIES: 5,
  RETRY_DELAY_MS: 2000,
  BACKGROUND_INTERVAL_MS: 15 * 60 * 1000, // 15 min
  STALE_QUEUE_AGE_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ── Auth Config ─────────────────────────────────────────
export const AUTH = {
  MAX_ATTEMPTS_PER_MINUTE: 5,
  PASSWORD_MIN_LENGTH: 6,
  SESSION_CHECK_INTERVAL_MS: 5 * 60 * 1000,
};

// ── FishCast Config ─────────────────────────────────────
export const FISHCAST = {
  WEIGHTS: {
    pressure: 0.2,
    moon: 0.15,
    solunar: 0.15,
    wind: 0.12,
    timeOfDay: 0.12,
    tide: 0.1,
    cloud: 0.08,
    precipitation: 0.08,
  },
  LABELS: [
    { min: 0, max: 25, label: 'Poor', color: '#F44336' },
    { min: 26, max: 50, label: 'Fair', color: '#FF9800' },
    { min: 51, max: 70, label: 'Good', color: '#FFC107' },
    { min: 71, max: 85, label: 'Very Good', color: '#8BC34A' },
    { min: 86, max: 100, label: 'Excellent', color: '#4CAF50' },
  ],
  OPTIMAL_PRESSURE_MIN: 1010,
  OPTIMAL_PRESSURE_MAX: 1020,
  OPTIMAL_WIND_MIN: 5,
  OPTIMAL_WIND_MAX: 15,
  WIND_POOR_THRESHOLD: 30,
};

// ── Notification Channels ───────────────────────────────
export const NOTIFICATIONS = {
  CHANNELS: {
    FISHCAST: 'fishcast_alerts',
    COMMUNITY: 'community',
    SYNC: 'sync_status',
  },
};

// ── Storage Keys ────────────────────────────────────────
export const STORAGE_KEYS = {
  CATCHES: '@profish_catches',
  SYNC_QUEUE: '@profish_sync_queue',
  SUBSCRIPTION: '@profish_subscription',
  LANGUAGE: '@profish_language',
  UNITS: '@profish_units',
  ONBOARDING: '@profish_onboarding_complete',
  CACHE_PREFIX: '@profish_cache_',
  SPOTS: '@profish_spots',
  PREFERENCES: '@profish_preferences',
  NOTIFICATION_PREFS: '@profish_notification_prefs',
};

// ── App Meta ────────────────────────────────────────────
export const APP = {
  NAME: 'ProFish',
  BUNDLE_ID: 'com.profish.app',
  SUPPORT_EMAIL: 'support@profish.app',
  PRIVACY_URL: 'https://profish.app/privacy',
  TERMS_URL: 'https://profish.app/terms',
  WEBSITE: 'https://profish.app',
  MIN_SUPPORTED_VERSION: '1.0.0',
};
