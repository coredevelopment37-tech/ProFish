/**
 * Launch Strategy Configuration (#474, #483)
 *
 * Soft launch plan: 2 regions first (NA + EU) → monitor 1 week → global.
 * Launch pricing promotion: 50% off Pro annual for first month.
 */

const LAUNCH_STRATEGY = {
  // ── Soft Launch Plan (#474) ──────────────────────
  softLaunch: {
    phase1: {
      name: 'Soft Launch',
      duration: '1 week',
      regions: ['NA', 'EU'],
      criteria: {
        crashFreeRate: 99.5, // Must exceed 99.5%
        anrRate: 0.5, // ANR < 0.5%
        avgRating: 4.0, // App Store rating > 4.0
        dayOneRetention: 40, // > 40% D1 retention
        weekOneRetention: 20, // > 20% D7 retention
        criticalBugs: 0, // Zero P0 bugs
      },
      monitoring: [
        'Sentry crash-free rate dashboard',
        'Firebase Analytics DAU/MAU',
        'RevenueCat MRR tracking',
        'Google Play Console vitals',
        'App Store Connect metrics',
      ],
      rollback:
        'If crash-free rate < 99% or P0 bugs found, halt rollout immediately.',
    },
    phase2: {
      name: 'Expanded Launch',
      duration: '1 week',
      regions: ['NA', 'EU', 'OC', 'NORDICS', 'GCC', 'EA'],
      criteria: {
        crashFreeRate: 99.5,
        weeklyActiveUsers: 1000,
      },
    },
    phase3: {
      name: 'Global Launch',
      duration: 'Ongoing',
      regions: 'ALL',
      criteria: {
        crashFreeRate: 99.5,
        mauGrowthRate: 10, // 10% month-over-month
      },
    },
  },

  // ── Launch Pricing Promotion (#483) ──────────────
  launchPromotion: {
    name: 'Launch Special',
    description: 'First month: 50% off Pro Annual',
    normalPrice: '$59.99/yr',
    promoPrice: '$29.99/yr (first year)',
    duration: '30 days from launch',
    sku: 'profish_pro_yearly_launch',
    // RevenueCat promotional offering
    revenueCatOffering: 'launch_special',
    conditions: [
      'Available to new subscribers only',
      'Auto-renews at $59.99/yr after first year',
      'Can cancel anytime',
    ],
    marketingCopy: {
      badge: '50% OFF',
      headline: 'Launch Special — Limited Time',
      body: 'Get ProFish Pro for just $29.99 for your first year. Unlock all 18 map layers, unlimited catches, offline maps, and more.',
      cta: 'Claim 50% Off',
      urgency: 'Offer ends in {days} days',
    },
  },

  // ── Beta Seeding (#480) ──────────────────────────
  communitySeeding: {
    targetPosts: 20,
    sources: [
      'Internal team catch posts (5)',
      'Beta tester catches (10)',
      'Pro angler partnerships (5)',
    ],
    postRequirements: {
      photo: true,
      species: true,
      location: 'general area only (no exact GPS)',
      conditions: true,
    },
  },
};

export default LAUNCH_STRATEGY;
