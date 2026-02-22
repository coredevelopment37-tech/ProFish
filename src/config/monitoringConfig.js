/**
 * Monitoring Dashboard Configuration (#476, #477, #478)
 *
 * Defines RevenueCat analytics, Sentry alerts, and
 * launch day monitoring metrics.
 */

const MONITORING_CONFIG = {
  // ── RevenueCat Analytics (#476) ──────────────────
  revenueCat: {
    dashboardUrl: 'https://app.revenuecat.com/apps/profish',
    keyMetrics: [
      {
        name: 'MRR',
        description: 'Monthly Recurring Revenue',
        target: '$500 month 1',
      },
      {
        name: 'Active Trials',
        description: 'Users on free trial',
        target: 'N/A (no trial)',
      },
      {
        name: 'Trial → Paid Conversion',
        description: 'Trial to paid conversion rate',
        target: 'N/A',
      },
      {
        name: 'Churn Rate',
        description: 'Monthly subscription churn',
        target: '< 8%',
      },
      {
        name: 'ARPU',
        description: 'Average Revenue Per User',
        target: '$0.50+',
      },
      { name: 'LTV', description: 'Customer Lifetime Value', target: '$120+' },
      {
        name: 'Refund Rate',
        description: 'Purchases refunded',
        target: '< 2%',
      },
    ],
    webhooks: {
      newPurchase: 'https://api.profish.app/webhooks/revenuecat/purchase',
      renewal: 'https://api.profish.app/webhooks/revenuecat/renewal',
      cancellation: 'https://api.profish.app/webhooks/revenuecat/cancel',
      billingIssue: 'https://api.profish.app/webhooks/revenuecat/billing-issue',
    },
  },

  // ── Sentry Alerts (#477) ─────────────────────────
  sentry: {
    projectUrl:
      'https://sentry.io/organizations/profish/projects/profish-mobile/',
    alertRules: [
      {
        name: 'Crash Rate Alert',
        condition: 'Crash-free sessions < 99%',
        action: 'Slack #profish-crashes + email team',
        frequency: 'Every 5 minutes',
        severity: 'critical',
      },
      {
        name: 'Error Spike Alert',
        condition: 'Error count > 100 in 10 minutes',
        action: 'Slack #profish-errors + PagerDuty',
        frequency: 'Every 10 minutes',
        severity: 'high',
      },
      {
        name: 'New Issue Alert',
        condition: 'New error type first seen',
        action: 'Slack #profish-errors (daily digest)',
        frequency: 'Daily',
        severity: 'medium',
      },
      {
        name: 'Performance Alert',
        condition: 'App start time > 3 seconds (p95)',
        action: 'Email engineering',
        frequency: 'Weekly',
        severity: 'low',
      },
    ],
    releaseHealth: {
      crashFreeTarget: 99.5,
      adoptionThreshold: 50, // % users on latest version before marking stable
    },
  },

  // ── Launch Day Dashboard (#478) ──────────────────
  launchDashboard: {
    name: 'ProFish Launch Day Monitor',
    refreshInterval: '1 minute',
    panels: [
      {
        title: 'Real-Time Users',
        source: 'Firebase Analytics',
        metric: 'active_users_now',
        type: 'number',
      },
      {
        title: 'Downloads Today',
        source: 'App Store Connect + Google Play Console',
        metric: 'installs_today',
        type: 'number',
      },
      {
        title: 'Crash-Free Rate',
        source: 'Sentry',
        metric: 'crash_free_sessions_24h',
        type: 'gauge',
        threshold: { green: 99.5, yellow: 99.0, red: 98.0 },
      },
      {
        title: 'Revenue (MRR)',
        source: 'RevenueCat',
        metric: 'mrr_current',
        type: 'number',
        format: 'currency',
      },
      {
        title: 'Catches Logged',
        source: 'Firebase Analytics',
        metric: 'catch_logged_count_24h',
        type: 'number',
      },
      {
        title: 'FishCast Views',
        source: 'Firebase Analytics',
        metric: 'fishcast_viewed_count_24h',
        type: 'number',
      },
      {
        title: 'Paywall Conversion',
        source: 'Firebase + RevenueCat',
        metric: 'paywall_viewed_to_purchase_rate',
        type: 'percentage',
        threshold: { green: 5, yellow: 2, red: 0.5 },
      },
      {
        title: 'API Error Rate',
        source: 'Sentry',
        metric: 'api_error_rate_1h',
        type: 'percentage',
        threshold: { green: 0.5, yellow: 2, red: 5 },
      },
      {
        title: 'Avg App Start Time',
        source: 'Sentry Performance',
        metric: 'app_start_p50_ms',
        type: 'number',
        format: 'ms',
        threshold: { green: 1500, yellow: 2500, red: 4000 },
      },
      {
        title: 'Store Rating',
        source: 'App Store + Play Store',
        metric: 'avg_rating',
        type: 'number',
        threshold: { green: 4.5, yellow: 4.0, red: 3.5 },
      },
    ],
  },

  // ── Support Flow (#479) ──────────────────────────
  support: {
    inAppFeedback: {
      trigger: 'Settings → Help & Feedback',
      fields: ['category', 'description', 'screenshot', 'device_info'],
      categories: [
        'Bug Report',
        'Feature Request',
        'Subscription Issue',
        'Account Problem',
        'Map/Data Issue',
        'Other',
      ],
    },
    emailFlow: 'support@profish.app',
    helpdesk: {
      provider: 'Freshdesk', // or Zendesk
      projectUrl: 'https://profish.freshdesk.com',
      autoResponder: true,
      slaTargets: {
        firstResponse: '4 hours',
        resolution: '24 hours',
        criticalBug: '2 hours',
      },
    },
    faq: [
      {
        q: 'How does FishCast work?',
        a: 'FishCast analyzes 8 factors including barometric pressure, moon phase, tide state, and wind to rate fishing conditions 0-100.',
      },
      {
        q: 'Does it work offline?',
        a: 'Pro subscribers can download offline map packs. Catch logging always works offline and syncs when you reconnect.',
      },
      {
        q: 'How do I cancel Pro?',
        a: 'Manage your subscription through Settings → Subscription, or directly in your App Store/Play Store account settings.',
      },
      {
        q: 'Is my location data shared?',
        a: 'Your exact GPS coordinates are never shared publicly. Community posts show general area only.',
      },
    ],
  },
};

export default MONITORING_CONFIG;
