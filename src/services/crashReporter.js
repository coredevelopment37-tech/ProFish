/**
 * Crash Reporter — ProFish
 * Wraps Sentry for crash reporting
 */

let Sentry = null;

try {
  Sentry = require('@sentry/react-native');
} catch (e) {
  // Sentry not linked yet
}

const crashReporter = {
  init() {
    if (!Sentry) {
      console.log('[CrashReporter] Sentry not available');
      return;
    }

    const { SENTRY_DSN } = require('../config/env');
    if (!SENTRY_DSN) {
      console.log('[CrashReporter] No DSN configured');
      return;
    }

    Sentry.init({
      dsn: SENTRY_DSN,
      enableAutoSessionTracking: true,
      tracesSampleRate: 0.2,
    });

    console.log('[CrashReporter] Initialized');
  },

  captureException(error, context = {}) {
    if (Sentry) {
      Sentry.captureException(error, { extra: context });
    } else {
      console.error('[CrashReporter]', error, context);
    }
  },

  setUser(userId, email) {
    if (Sentry) {
      Sentry.setUser({ id: userId, email });
    }
  },

  addBreadcrumb(message, category = 'app') {
    if (Sentry) {
      Sentry.addBreadcrumb({ message, category });
    }
  },
};

export default crashReporter;
