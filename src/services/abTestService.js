/**
 * A/B Testing Framework (#493, #494)
 *
 * Uses Firebase Remote Config for feature flags and A/B tests.
 * Integrates with Firebase Analytics for conversion tracking.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const AB_CACHE_KEY = '@profish_ab_assignments';

// ── Active Experiments ─────────────────────────────
const EXPERIMENTS = {
  PAYWALL_DESIGN: {
    id: 'paywall_design',
    description: 'Test different paywall layouts (#494)',
    variants: {
      control: {
        id: 'control',
        weight: 50,
        config: {
          layout: 'feature_comparison', // Current: side-by-side Free vs Pro
          showTrial: false,
          highlightYearly: true,
          showSavingsBadge: true,
        },
      },
      variant_a: {
        id: 'variant_a',
        weight: 25,
        config: {
          layout: 'single_plan', // Show only yearly with monthly toggle
          showTrial: false,
          highlightYearly: true,
          showSavingsBadge: true,
        },
      },
      variant_b: {
        id: 'variant_b',
        weight: 25,
        config: {
          layout: 'feature_list', // Vertical feature checklist
          showTrial: false,
          highlightYearly: true,
          showSavingsBadge: false,
        },
      },
    },
    metric: 'purchase_completed',
    minSampleSize: 500,
    status: 'ready', // ready | running | completed
  },

  FISHCAST_DISPLAY: {
    id: 'fishcast_display',
    description: 'Test FishCast score display format',
    variants: {
      control: {
        id: 'control',
        weight: 50,
        config: { format: 'number', showLabel: true }, // "75 — Good"
      },
      variant_a: {
        id: 'variant_a',
        weight: 50,
        config: { format: 'gauge', showLabel: true }, // Circular gauge
      },
    },
    metric: 'fishcast_7day_viewed',
    minSampleSize: 1000,
    status: 'ready',
  },

  ONBOARDING_LENGTH: {
    id: 'onboarding_length',
    description: 'Test short vs long onboarding',
    variants: {
      control: {
        id: 'control',
        weight: 50,
        config: { screens: 5, skipEnabled: true },
      },
      variant_a: {
        id: 'variant_a',
        weight: 50,
        config: { screens: 3, skipEnabled: false },
      },
    },
    metric: 'onboarding_completed',
    minSampleSize: 300,
    status: 'ready',
  },
};

// ── A/B Service ────────────────────────────────────
const abTestService = {
  _assignments: null,

  /**
   * Initialize — load or create variant assignments
   */
  async init() {
    try {
      const stored = await AsyncStorage.getItem(AB_CACHE_KEY);
      if (stored) {
        this._assignments = JSON.parse(stored);
        return;
      }
    } catch {}

    // Assign user to variants (sticky assignment)
    this._assignments = {};
    for (const [key, experiment] of Object.entries(EXPERIMENTS)) {
      if (experiment.status !== 'ready' && experiment.status !== 'running')
        continue;
      this._assignments[experiment.id] = this._assignVariant(experiment);
    }

    await AsyncStorage.setItem(AB_CACHE_KEY, JSON.stringify(this._assignments));
  },

  /**
   * Get assigned variant for an experiment
   */
  getVariant(experimentId) {
    if (!this._assignments) return null;
    const variantId = this._assignments[experimentId];
    const experiment = Object.values(EXPERIMENTS).find(
      e => e.id === experimentId,
    );
    if (!experiment || !variantId) return null;
    return experiment.variants[variantId]?.config || null;
  },

  /**
   * Assign a variant based on weights (weighted random)
   */
  _assignVariant(experiment) {
    const variants = Object.entries(experiment.variants);
    const totalWeight = variants.reduce((sum, [_, v]) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;

    for (const [key, variant] of variants) {
      random -= variant.weight;
      if (random <= 0) return key;
    }

    return variants[0][0]; // Fallback to control
  },

  /**
   * Get all active experiment assignments for analytics
   */
  getAssignments() {
    return { ...this._assignments };
  },

  /**
   * Override a variant (for testing/debugging)
   */
  async overrideVariant(experimentId, variantId) {
    if (!this._assignments) this._assignments = {};
    this._assignments[experimentId] = variantId;
    await AsyncStorage.setItem(AB_CACHE_KEY, JSON.stringify(this._assignments));
  },

  /**
   * Reset all assignments (forces re-randomization)
   */
  async reset() {
    this._assignments = null;
    await AsyncStorage.removeItem(AB_CACHE_KEY);
  },
};

export { EXPERIMENTS };
export default abTestService;
