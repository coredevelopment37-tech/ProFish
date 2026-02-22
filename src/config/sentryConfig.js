/**
 * Sentry Configuration — ProFish (#441)
 *
 * Zero-error production monitoring.
 * Tracks crashes, JS errors, performance, and user sessions.
 *
 * Config applied in App.js via Sentry.init().
 */

const SENTRY_DSN = '__SENTRY_DSN__'; // Replace with actual DSN from Sentry dashboard

const sentryConfig = {
  dsn: SENTRY_DSN,

  // Environment detection
  environment: __DEV__ ? 'development' : 'production',

  // Performance monitoring
  tracesSampleRate: __DEV__ ? 1.0 : 0.2, // 20% in prod
  profilesSampleRate: __DEV__ ? 1.0 : 0.1, // 10% in prod

  // Session replay (crashes only in prod)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  // Release tracking
  release: `profish@${require('../package.json').version}`,
  dist: require('../package.json').version,

  // Breadcrumbs
  maxBreadcrumbs: 50,
  attachStacktrace: true,

  // Before send: filter out known noise
  beforeSend(event) {
    // Skip development errors
    if (__DEV__) return null;

    // Filter out network timeout errors (expected on fishing trips)
    if (
      event.exception?.values?.[0]?.value?.includes('Network request failed')
    ) {
      return null;
    }

    // Filter out RevenueCat API errors (handled by retry logic)
    if (event.exception?.values?.[0]?.value?.includes('RevenueCat')) {
      return null;
    }

    return event;
  },

  // Integrations
  integrations: [],

  // Tags applied to all events
  initialScope: {
    tags: {
      app: 'profish',
    },
  },
};

/**
 * Alert rules for Sentry (configured in Sentry dashboard):
 *
 * 1. CRITICAL: Any unhandled crash → Slack #profish-crashes → immediate
 * 2. HIGH: Error rate > 1% of sessions → Email → within 15min
 * 3. MEDIUM: New issue type detected → Slack #profish-errors → daily digest
 * 4. LOW: Performance regression (LCP > 3s) → Weekly report
 *
 * Zero-error gate: Block release if unresolved P0/P1 issues exist.
 */

export default sentryConfig;
