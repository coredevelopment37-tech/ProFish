/**
 * Phase 2 Roadmap & Growth Plan (#496-500)
 *
 * Post-launch planning based on user analytics.
 * Expansion targets and cost optimization triggers.
 */

const PHASE2_ROADMAP = {
  // ── Phase 2 Development (#496) ───────────────────
  kickoff: {
    trigger: '4 weeks post-launch',
    dataDriven: true,
    decisionCriteria: [
      'Top 5 feature requests from user feedback',
      'Highest drop-off points in analytics funnel',
      'Revenue metrics: MRR, churn, conversion rate',
      'Regional demand: which regions have highest engagement',
    ],
    candidateFeatures: [
      {
        name: 'Team GPS + Live Sharing',
        tier: 'Team',
        effort: 'Large (4-6 weeks)',
        dependency: 'Team subscription tier activation',
      },
      {
        name: 'Guide Booking System',
        tier: 'Guide',
        effort: 'Large (6-8 weeks)',
        dependency: 'Marketplace adoption metrics',
      },
      {
        name: 'Advanced Fish Finder Integration',
        tier: 'Pro',
        effort: 'Medium (2-4 weeks)',
        dependency: 'Bluetooth Low Energy API',
      },
      {
        name: 'Social Feed Algorithm',
        tier: 'Free',
        effort: 'Medium (2-3 weeks)',
        dependency: 'Community growth > 1K posts',
      },
      {
        name: 'Fishing Log Insights (AI Summary)',
        tier: 'Pro',
        effort: 'Small (1-2 weeks)',
        dependency: 'Users with 20+ catches',
      },
    ],
  },

  // ── Weekly Analytics Report (#497) ───────────────
  weeklyReport: {
    schedule: 'Every Monday 9:00 AM',
    recipients: ['team@profish.app'],
    sections: [
      {
        title: 'User Metrics',
        metrics: [
          'DAU',
          'WAU',
          'MAU',
          'D1 Retention',
          'D7 Retention',
          'D30 Retention',
        ],
      },
      {
        title: 'Revenue',
        metrics: ['MRR', 'New Subscriptions', 'Churn', 'ARPU', 'LTV'],
      },
      {
        title: 'Engagement',
        metrics: [
          'Catches Logged',
          'FishCast Views',
          'AI Species IDs',
          'Map Sessions',
          'Avg Session Duration',
        ],
      },
      {
        title: 'Quality',
        metrics: ['Crash-Free Rate', 'Avg App Start Time', 'API Error Rate'],
      },
      {
        title: 'Growth',
        metrics: ['New Installs', 'Referral Conversions', 'Store Rating'],
      },
    ],
    automation: {
      dataSource: 'Firebase Analytics API + RevenueCat API + Sentry API',
      format: 'HTML email with charts',
      tool: 'Cloud Function (scheduled) or n8n/Zapier workflow',
    },
  },

  // ── Platform Expansion (#498) ────────────────────
  platformExpansion: {
    appleWatch: {
      features: [
        'FishCast score glance',
        'Tide countdown complication',
        'Quick catch log (species + released)',
        'Solunar period alerts',
      ],
      effort: 'Medium (3-4 weeks)',
      trigger: 'iOS user base > 10K',
      framework: 'WatchKit + SwiftUI',
    },
    androidWear: {
      features: [
        'FishCast score tile',
        'Quick catch logging',
        'Weather at a glance',
      ],
      effort: 'Medium (2-3 weeks)',
      trigger: 'Android user base > 10K',
      framework: 'Wear OS Compose',
    },
    widgets: {
      ios: {
        features: [
          'FishCast score widget (small)',
          'Next tide widget (medium)',
          "Today's solunar periods (large)",
        ],
        framework: 'WidgetKit + SwiftUI',
      },
      android: {
        features: [
          'FishCast score widget',
          'Tide countdown widget',
          "Today's weather widget",
        ],
        framework: 'App Widgets (Glance)',
      },
      effort: 'Medium (2-3 weeks per platform)',
      trigger: 'User request frequency in top 5',
    },
  },

  // ── Cost Optimization (#499, #500) ───────────────
  costOptimization: {
    revenueCatReplacement: {
      item: '#499',
      trigger: 'MTR (Monthly Transaction Revenue) > $500K',
      savings: '$3,000–5,000/month',
      implementation: [
        'Build custom receipt validation server (Node.js + Apple/Google APIs)',
        'Migrate subscription state management to own backend',
        'Implement webhook handlers for subscription events',
        'Gradual migration: run parallel for 1 month',
      ],
      timeline: '6-8 weeks',
      risk: 'Medium — receipt validation is complex, RevenueCat handles edge cases well',
      recommendation: 'Keep RevenueCat until very confident in custom solution',
    },
    mapboxCaching: {
      item: '#500',
      trigger: 'Mapbox geocoding costs > $200/month',
      savings: 'Up to 70% reduction in geocoding API calls',
      implementation: [
        'Add Redis/DynamoDB cache layer in front of Mapbox geocoding',
        'Cache geocoding results by query string (TTL: 30 days)',
        'Cache reverse geocoding by coordinate hash (TTL: 7 days)',
        'Pre-populate cache with top 1000 fishing locations',
        'Implement client-side LRU cache (100 recent searches)',
      ],
      architecture: {
        client: 'LRU cache (100 entries) → API',
        server: 'Lambda → DynamoDB cache → Mapbox API',
        ttl: { geocode: '30 days', reverseGeocode: '7 days' },
      },
    },
  },
};

export default PHASE2_ROADMAP;
