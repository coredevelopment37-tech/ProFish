/**
 * Analytics Service — ProFish
 * Firebase Analytics with region/language segmentation
 */

let analytics = null;

try {
  analytics = require('@react-native-firebase/analytics').default;
} catch (e) {
  // Firebase not linked yet
}

const analyticsService = {
  init() {
    if (!analytics) {
      console.log('[Analytics] Firebase Analytics not available');
      return;
    }
    console.log('[Analytics] Initialized');
  },

  async logEvent(name, params = {}) {
    try {
      if (analytics) {
        await analytics().logEvent(name, params);
      }
    } catch (e) {
      // Silently fail
    }
  },

  // ── Fishing-specific events ─────────────────────────
  async logCatch(species, weight, location) {
    await this.logEvent('log_catch', { species, weight, location });
  },

  async logSpeciesId(species, confidence) {
    await this.logEvent('species_id', { species, confidence });
  },

  async logFishCastView(score, location) {
    await this.logEvent('fishcast_view', { score, location });
  },

  async logMapLayerToggle(layerId, enabled) {
    await this.logEvent('layer_toggle', { layer: layerId, enabled });
  },

  async logSubscriptionView(tier) {
    await this.logEvent('subscription_view', { tier });
  },

  async logSubscriptionPurchase(tier, price, currency) {
    await this.logEvent('subscription_purchase', { tier, price, currency });
  },

  async logTranslationSuggestion(language, key) {
    await this.logEvent('translation_suggest', { language, key });
  },

  // ── User properties ─────────────────────────────────
  async setUserRegion(region) {
    try {
      if (analytics) {
        await analytics().setUserProperty('fishing_region', region);
      }
    } catch (e) {}
  },

  async setUserLanguage(language) {
    try {
      if (analytics) {
        await analytics().setUserProperty('app_language', language);
      }
    } catch (e) {}
  },

  async setUserTier(tier) {
    try {
      if (analytics) {
        await analytics().setUserProperty('subscription_tier', tier);
      }
    } catch (e) {}
  },
};

export default analyticsService;
