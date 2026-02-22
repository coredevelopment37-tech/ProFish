/**
 * Post-Launch Operations Playbook (#484-492)
 *
 * Monitoring targets, scaling triggers, and release cadence.
 */

const POST_LAUNCH_OPS = {
  // ── Monitoring Targets (#484, #485, #486) ────────
  monitoring: {
    crashFreeRate: {
      target: 99.5,
      alert: 99.0,
      critical: 98.0,
      source: 'Sentry Release Health',
      checkInterval: '5 minutes',
    },
    apiLatency: {
      'open-meteo': { p50: 200, p95: 500, p99: 1000, unit: 'ms' },
      worldtides: { p50: 300, p95: 800, p99: 1500, unit: 'ms' },
      noaa: { p50: 250, p95: 600, p99: 1200, unit: 'ms' },
      firestore: { p50: 100, p95: 300, p99: 500, unit: 'ms' },
    },
    apiErrorRates: {
      target: 0.5, // < 0.5% error rate
      alert: 2.0,
      critical: 5.0,
    },
    firestoreUsage: {
      reads: { dailyBudget: 50000, alertAt: 40000, unit: 'reads/day' },
      writes: { dailyBudget: 20000, alertAt: 16000, unit: 'writes/day' },
      storage: { budgetGB: 10, alertAtGB: 8 },
      monthlyBudget: '$25 Spark → Blaze if needed',
    },
  },

  // ── Feedback Triage (#487) ───────────────────────
  feedbackProcess: {
    cadence: 'Weekly (every Monday)',
    sources: [
      'App Store reviews',
      'Google Play reviews',
      'In-app feedback form',
      'Support email (support@profish.app)',
      'Social media mentions',
      'Reddit r/ProFishApp',
    ],
    categories: [
      'Bug',
      'Feature Request',
      'UX Improvement',
      'Performance',
      'Content',
    ],
    prioritization: {
      P0: 'Crash / data loss / security — fix immediately',
      P1: 'Major feature broken / blocks usage — fix within 48h',
      P2: 'Minor bug / degraded experience — fix in next release',
      P3: 'Enhancement / nice-to-have — add to backlog',
    },
  },

  // ── Release Cadence (#488, #489) ─────────────────
  releases: {
    v1_1: {
      target: 'Launch + 1 week',
      scope: 'Critical bug fixes only',
      criteria: 'P0/P1 bugs found during soft launch',
      process: [
        'Identify critical bugs from Sentry + support tickets',
        'Fix + test in dev',
        'Submit to app review as expedited review',
        'Monitor crash-free rate after rollout',
      ],
    },
    v1_2: {
      target: 'Launch + 4 weeks',
      scope: 'Top-requested features + P2 bugs',
      criteria: 'Based on feedback triage and analytics',
      potentialFeatures: [
        'Most requested feature from user feedback',
        'Performance optimizations (startup time, map loading)',
        'UI/UX improvements from analytics (drop-off points)',
        'Additional species data or language support',
      ],
    },
    cadence: {
      hotfixes: 'As needed (P0/P1 only)',
      minor: 'Every 2 weeks',
      major: 'Every 6-8 weeks',
    },
  },

  // ── Scaling Triggers (#490, #491, #492) ──────────
  scalingTriggers: [
    {
      id: 'eu_region',
      item: '#490',
      condition: 'EU MAU > 5,000',
      action: 'Add eu-west-1 AWS region for Copernicus tile proxy',
      estimatedCost: '$50-100/mo',
      implementation: [
        'Deploy Lambda@Edge + CloudFront in eu-west-1',
        'Update tileProxyService CDN config with EU origin',
        'Route EU users to closest CDN edge',
      ],
    },
    {
      id: 'apac_region',
      item: '#491',
      condition: 'APAC MAU > 3,000',
      action: 'Add ap-southeast-1 AWS region',
      estimatedCost: '$50-100/mo',
      implementation: [
        'Deploy Lambda@Edge + CloudFront in ap-southeast-1',
        'Update tileProxyService CDN config with APAC origin',
      ],
    },
    {
      id: 'mapbox_upgrade',
      item: '#492',
      condition: 'Approaching 25,000 MAU',
      action: 'Upgrade Mapbox from free to paid plan',
      estimatedCost: '$250-500/mo',
      implementation: [
        'Contact Mapbox sales for volume pricing',
        'Evaluate switching to MapLibre (open source) as cost alternative',
        'Monitor monthly map load count in Mapbox dashboard',
      ],
    },
  ],
};

export default POST_LAUNCH_OPS;
