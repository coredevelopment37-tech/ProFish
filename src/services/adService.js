/**
 * Ad Service — Google AdMob integration with frequency capping & mediation
 * #536-543 — Banner, interstitial, rewarded video, native, frequency caps, Pro removal
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const AD_CACHE_KEY = '@profish_ad_state';

// ============================================
// Ad Unit IDs — Replace with real IDs in production
// ============================================
const AD_UNITS = {
  // Test IDs (Google AdMob test IDs for development)
  BANNER_HOME: __DEV__
    ? 'ca-app-pub-3940256099942544/6300978111'
    : 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX',
  BANNER_CATCHES: __DEV__
    ? 'ca-app-pub-3940256099942544/6300978111'
    : 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX',
  BANNER_COMMUNITY: __DEV__
    ? 'ca-app-pub-3940256099942544/6300978111'
    : 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX',

  INTERSTITIAL_CATCH_SAVE: __DEV__
    ? 'ca-app-pub-3940256099942544/1033173712'
    : 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX',
  INTERSTITIAL_MAP_VIEW: __DEV__
    ? 'ca-app-pub-3940256099942544/1033173712'
    : 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX',

  REWARDED_WEATHER: __DEV__
    ? 'ca-app-pub-3940256099942544/5224354917'
    : 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX',
  REWARDED_FISHCAST: __DEV__
    ? 'ca-app-pub-3940256099942544/5224354917'
    : 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX',
  REWARDED_SPECIES_DETAIL: __DEV__
    ? 'ca-app-pub-3940256099942544/5224354917'
    : 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX',

  NATIVE_FEED: __DEV__
    ? 'ca-app-pub-3940256099942544/2247696110'
    : 'ca-app-pub-XXXXXXXXXX/XXXXXXXXXX',
};

// ============================================
// #540 — Frequency Capping Rules
// ============================================
const FREQUENCY_RULES = {
  INTERSTITIAL: {
    maxPerSession: 3, // Max 3 interstitials per session
    maxPerDay: 8, // Max 8 per day
    minIntervalMs: 120000, // At least 2 minutes between interstitials
    cooldownAfterPurchase: 0, // No ads after purchase intent
  },
  REWARDED: {
    maxPerSession: 10, // Users can opt-in more
    maxPerDay: 20,
    minIntervalMs: 30000, // 30 seconds between rewarded
  },
  BANNER: {
    refreshIntervalMs: 60000, // Refresh banner every 60 seconds
  },
};

// ============================================
// Ad placement strategy
// ============================================
const AD_PLACEMENTS = {
  // #537 — Banner ads (bottom of non-critical screens)
  banners: [
    { screen: 'Home', position: 'bottom', unitId: 'BANNER_HOME' },
    { screen: 'CatchesList', position: 'bottom', unitId: 'BANNER_CATCHES' },
    { screen: 'CommunityFeed', position: 'bottom', unitId: 'BANNER_COMMUNITY' },
  ],

  // #538 — Interstitial (between natural transitions)
  interstitials: [
    {
      trigger: 'after_catch_save',
      unitId: 'INTERSTITIAL_CATCH_SAVE',
      frequency: 3,
    }, // Every 3rd catch save
    {
      trigger: 'map_session_end',
      unitId: 'INTERSTITIAL_MAP_VIEW',
      frequency: 2,
    }, // Every 2nd map close
  ],

  // #539 — Rewarded video (opt-in for premium features)
  rewarded: [
    {
      trigger: 'unlock_extended_forecast',
      unitId: 'REWARDED_WEATHER',
      reward: '24h extended forecast',
    },
    {
      trigger: 'unlock_fishcast_detail',
      unitId: 'REWARDED_FISHCAST',
      reward: 'Detailed FishCast breakdown',
    },
    {
      trigger: 'unlock_species_detail',
      unitId: 'REWARDED_SPECIES_DETAIL',
      reward: 'Full species guide access',
    },
  ],

  // #541 — Native ads in feed
  native: [
    {
      screen: 'CommunityFeed',
      position: 'every_5th_post',
      unitId: 'NATIVE_FEED',
    },
  ],
};

// ============================================
// State management
// ============================================
let adState = {
  sessionInterstitials: 0,
  sessionRewarded: 0,
  lastInterstitialTime: 0,
  lastRewardedTime: 0,
  dailyInterstitials: 0,
  dailyRewarded: 0,
  lastResetDate: null,
  isProUser: false,
  triggerCounts: {}, // { 'after_catch_save': 5, ... }
};

/**
 * Initialize ad service — check Pro status, load state
 */
async function initAdService(isProUser = false) {
  adState.isProUser = isProUser;

  // #542 — Pro users: NO ads
  if (isProUser) {
    return { adsEnabled: false, reason: 'Pro subscriber — ad-free experience' };
  }

  // Load saved state
  try {
    const saved = await AsyncStorage.getItem(AD_CACHE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const today = new Date().toISOString().split('T')[0];
      if (parsed.lastResetDate === today) {
        adState = { ...adState, ...parsed };
      } else {
        // New day — reset daily counters
        adState.dailyInterstitials = 0;
        adState.dailyRewarded = 0;
        adState.lastResetDate = today;
      }
    }
  } catch (e) {
    /* ignore */
  }

  // Initialize AdMob SDK
  try {
    const mobileAds = require('react-native-google-mobile-ads').default;
    await mobileAds().initialize();

    // Request tracking transparency (iOS 14+)
    const {
      AdsConsent,
      AdsConsentStatus,
    } = require('react-native-google-mobile-ads');
    const consentInfo = await AdsConsent.requestInfoUpdate();
    if (
      consentInfo.isConsentFormAvailable &&
      consentInfo.status === AdsConsentStatus.REQUIRED
    ) {
      await AdsConsent.showForm();
    }

    return { adsEnabled: true, reason: 'AdMob initialized' };
  } catch (e) {
    return { adsEnabled: false, reason: 'AdMob not available: ' + e.message };
  }
}

/**
 * Save ad state to storage
 */
async function saveAdState() {
  try {
    await AsyncStorage.setItem(
      AD_CACHE_KEY,
      JSON.stringify({
        dailyInterstitials: adState.dailyInterstitials,
        dailyRewarded: adState.dailyRewarded,
        lastResetDate:
          adState.lastResetDate || new Date().toISOString().split('T')[0],
        triggerCounts: adState.triggerCounts,
      }),
    );
  } catch (e) {
    /* ignore */
  }
}

/**
 * #540 — Check if interstitial can be shown (frequency cap)
 */
function canShowInterstitial() {
  if (adState.isProUser) return false;

  const now = Date.now();
  const rules = FREQUENCY_RULES.INTERSTITIAL;

  if (adState.sessionInterstitials >= rules.maxPerSession) return false;
  if (adState.dailyInterstitials >= rules.maxPerDay) return false;
  if (now - adState.lastInterstitialTime < rules.minIntervalMs) return false;

  return true;
}

/**
 * #538 — Show interstitial ad with trigger tracking
 */
async function showInterstitial(trigger) {
  if (!canShowInterstitial()) return { shown: false, reason: 'frequency_cap' };

  // Find placement
  const placement = AD_PLACEMENTS.interstitials.find(
    p => p.trigger === trigger,
  );
  if (!placement) return { shown: false, reason: 'unknown_trigger' };

  // Check trigger frequency (e.g. show every 3rd catch save)
  adState.triggerCounts[trigger] = (adState.triggerCounts[trigger] || 0) + 1;
  if (adState.triggerCounts[trigger] % placement.frequency !== 0) {
    return { shown: false, reason: 'trigger_frequency' };
  }

  try {
    const {
      InterstitialAd,
      AdEventType,
    } = require('react-native-google-mobile-ads');
    const unitId = AD_UNITS[placement.unitId];
    const interstitial = InterstitialAd.createForAdRequest(unitId);

    return new Promise(resolve => {
      interstitial.addAdEventListener(AdEventType.LOADED, () => {
        interstitial.show();
      });
      interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        adState.sessionInterstitials += 1;
        adState.dailyInterstitials += 1;
        adState.lastInterstitialTime = Date.now();
        saveAdState();
        resolve({ shown: true });
      });
      interstitial.addAdEventListener(AdEventType.ERROR, error => {
        resolve({ shown: false, reason: 'ad_error', error: error.message });
      });
      interstitial.load();

      // Timeout after 5s
      setTimeout(() => resolve({ shown: false, reason: 'timeout' }), 5000);
    });
  } catch (e) {
    return { shown: false, reason: 'sdk_error', error: e.message };
  }
}

/**
 * #539 — Show rewarded video ad
 */
async function showRewardedAd(trigger) {
  if (adState.isProUser)
    return { shown: false, rewarded: false, reason: 'pro_user' };

  const placement = AD_PLACEMENTS.rewarded.find(p => p.trigger === trigger);
  if (!placement)
    return { shown: false, rewarded: false, reason: 'unknown_trigger' };

  // Check rewarded frequency
  const now = Date.now();
  if (now - adState.lastRewardedTime < FREQUENCY_RULES.REWARDED.minIntervalMs) {
    return { shown: false, rewarded: false, reason: 'too_soon' };
  }

  try {
    const {
      RewardedAd,
      RewardedAdEventType,
      AdEventType,
    } = require('react-native-google-mobile-ads');
    const unitId = AD_UNITS[placement.unitId];
    const rewarded = RewardedAd.createForAdRequest(unitId);

    return new Promise(resolve => {
      let userRewarded = false;

      rewarded.addAdEventListener(AdEventType.LOADED, () => {
        rewarded.show();
      });
      rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        userRewarded = true;
      });
      rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        adState.sessionRewarded += 1;
        adState.dailyRewarded += 1;
        adState.lastRewardedTime = Date.now();
        saveAdState();
        resolve({
          shown: true,
          rewarded: userRewarded,
          reward: userRewarded ? placement.reward : null,
        });
      });
      rewarded.addAdEventListener(AdEventType.ERROR, error => {
        resolve({
          shown: false,
          rewarded: false,
          reason: 'ad_error',
          error: error.message,
        });
      });
      rewarded.load();

      setTimeout(
        () => resolve({ shown: false, rewarded: false, reason: 'timeout' }),
        10000,
      );
    });
  } catch (e) {
    return {
      shown: false,
      rewarded: false,
      reason: 'sdk_error',
      error: e.message,
    };
  }
}

/**
 * #537 — Get banner ad config for a screen
 */
function getBannerConfig(screenName) {
  if (adState.isProUser) return null;

  const placement = AD_PLACEMENTS.banners.find(p => p.screen === screenName);
  if (!placement) return null;

  return {
    unitId: AD_UNITS[placement.unitId],
    position: placement.position,
    refreshInterval: FREQUENCY_RULES.BANNER.refreshIntervalMs,
  };
}

/**
 * #541 — Get native ad placement for feed
 */
function getNativeAdConfig(screenName) {
  if (adState.isProUser) return null;

  const placement = AD_PLACEMENTS.native.find(p => p.screen === screenName);
  if (!placement) return null;

  return {
    unitId: AD_UNITS[placement.unitId],
    position: placement.position,
  };
}

/**
 * #543 — Revenue tracking / analytics
 */
async function trackAdRevenue(adType, revenue, currency = 'USD') {
  try {
    const analytics = require('@react-native-firebase/analytics').default;
    await analytics().logEvent('ad_impression', {
      ad_type: adType,
      estimated_revenue: revenue,
      currency,
    });
  } catch (e) {
    /* analytics not critical */
  }
}

/**
 * Get ad stats for debugging
 */
function getAdStats() {
  return {
    isProUser: adState.isProUser,
    sessionInterstitials: adState.sessionInterstitials,
    sessionRewarded: adState.sessionRewarded,
    dailyInterstitials: adState.dailyInterstitials,
    dailyRewarded: adState.dailyRewarded,
    canShowInterstitial: canShowInterstitial(),
    triggerCounts: { ...adState.triggerCounts },
  };
}

export {
  AD_UNITS,
  AD_PLACEMENTS,
  FREQUENCY_RULES,
  initAdService,
  showInterstitial,
  showRewardedAd,
  getBannerConfig,
  getNativeAdConfig,
  canShowInterstitial,
  trackAdRevenue,
  getAdStats,
};

export default {
  initAdService,
  showInterstitial,
  showRewardedAd,
  getBannerConfig,
  getNativeAdConfig,
  canShowInterstitial,
  trackAdRevenue,
  getAdStats,
};
