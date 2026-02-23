/**
 * featureGate — central utility to check subscription-based feature access
 *
 * Usage:
 *   import { canAccess, requireFeature, getLimit } from '../services/featureGate';
 *
 *   if (!canAccess('offlineMaps')) {
 *     requireFeature('offlineMaps');  // shows upgrade prompt
 *     return;
 *   }
 */

import subscriptionService, { TIERS, TIER_LIMITS } from './subscriptionService';

// ── Feature descriptions for upgrade prompts ─────────
const FEATURE_LABELS = {
  offlineMaps: 'Offline Maps',
  catchPhotos: 'Unlimited Catch Photos',
  bathymetry: 'Bathymetry Layer',
  sst: 'Sea Surface Temperature',
  chlorophyll: 'Chlorophyll Overlay',
  fishHotspots: 'Fish Hotspot Heatmap',
  nauticalCharts: 'Nautical Charts',
  depthContours: 'Depth Contours',
  catchStats: 'Catch Statistics & Records',
  aiSpeciesId: 'Unlimited AI Species ID',
  fishCast: 'Extended FishCast',
  teamGps: 'Team GPS Sharing',
  tournaments: 'Tournament Mode',
  guideBookings: 'Guide Booking System',
  maxCatchesPerMonth: 'Catch Logging',
  maxFishingSpots: 'Saved Fishing Spots',
};

// ── Which tier unlocks which feature ─────────────────
const FEATURE_REQUIRED_TIER = {
  offlineMaps: TIERS.PRO,
  catchPhotos: TIERS.PRO,
  bathymetry: TIERS.PRO,
  sst: TIERS.PRO,
  chlorophyll: TIERS.PRO,
  fishHotspots: TIERS.PRO,
  nauticalCharts: TIERS.PRO,
  depthContours: TIERS.PRO,
  catchStats: TIERS.PRO,
  aiSpeciesId: TIERS.PRO,
  fishCast: TIERS.PRO,
  teamGps: TIERS.TEAM,
  tournaments: TIERS.TEAM,
  guideBookings: TIERS.GUIDE,
};

// ── Tier ordering for comparisons ────────────────────
const TIER_ORDER = {
  [TIERS.FREE]: 0,
  [TIERS.PRO]: 1,
  [TIERS.TEAM]: 2,
  [TIERS.GUIDE]: 3,
};

/**
 * Check if the current subscription allows a boolean feature.
 */
export function canAccess(featureKey) {
  return subscriptionService.hasFeature(featureKey);
}

/**
 * Get the numeric limit for a quantified feature.
 */
export function getLimit(featureKey) {
  const tier = subscriptionService.getCurrentTier();
  const limits = TIER_LIMITS[tier] || TIER_LIMITS[TIERS.FREE];
  return limits[featureKey] ?? 0;
}

/**
 * Get the tier required to unlock a feature
 */
export function getRequiredTier(featureKey) {
  return FEATURE_REQUIRED_TIER[featureKey] || TIERS.PRO;
}

/**
 * Get human-readable label for a feature
 */
export function getFeatureLabel(featureKey) {
  return FEATURE_LABELS[featureKey] || featureKey;
}

/**
 * Show upgrade prompt for a locked feature.
 * Returns a Promise<boolean> — true if user chose to upgrade.
 */
import { Alert } from 'react-native';

export function requireFeature(featureKey) {
  const label = getFeatureLabel(featureKey);
  const requiredTier = getRequiredTier(featureKey);
  const tierLabel =
    requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);

  return new Promise(resolve => {
    Alert.alert(
      `${label}`,
      `This feature requires a ${tierLabel} subscription. Upgrade to unlock unlimited access.`,
      [
        { text: 'Not Now', style: 'cancel', onPress: () => resolve(false) },
        { text: `Upgrade to ${tierLabel}`, onPress: () => resolve(true) },
      ],
    );
  });
}

/**
 * Check if a numeric limit has been reached.
 * Returns { allowed: boolean, current: number, max: number }
 */
export function checkLimit(featureKey, currentCount) {
  const max = getLimit(featureKey);
  return {
    allowed: currentCount < max,
    current: currentCount,
    max,
    isUnlimited: max === Infinity,
  };
}

export { FEATURE_LABELS, FEATURE_REQUIRED_TIER, TIER_ORDER };
