/**
 * Quality Hardening — Network resilience, error boundaries, memory guards
 * #557-562 — Production-ready defensive utilities
 */

import { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config/theme';
import { AppIcon } from '../constants/icons';

// ============================================
// #558 — React Error Boundary
// ============================================
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to analytics
    try {
      const analytics = require('@react-native-firebase/analytics').default;
      analytics().logEvent('app_crash', {
        error_message: error?.message?.slice(0, 100),
        component_stack: errorInfo?.componentStack?.slice(0, 200),
      });
    } catch (e) {
      /* ignore */
    }

    // Save crash log locally
    try {
      const log = {
        message: error?.message,
        stack: error?.stack?.slice(0, 500),
        time: new Date().toISOString(),
      };
      AsyncStorage.setItem('@profish_last_crash', JSON.stringify(log));
    } catch (e) {
      /* ignore */
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <AppIcon name="fish" size={48} color="#0080FF" />
          <Text style={errorStyles.title}>Oops! Something went wrong</Text>
          <Text style={errorStyles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity
            style={errorStyles.button}
            onPress={this.handleReset}
          >
            <Text style={errorStyles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  buttonText: { fontSize: 16, fontWeight: '700', color: COLORS.text },
});

// ============================================
// #560 — Network Resilience Utility
// ============================================
const networkQueue = [];
let isOnline = true;

/**
 * Initialize network listener
 */
function initNetworkListener() {
  NetInfo.addEventListener(state => {
    const wasOffline = !isOnline;
    isOnline = state.isConnected && state.isInternetReachable !== false;

    if (wasOffline && isOnline) {
      // Process queued requests
      processQueue();
    }
  });
}

/**
 * Fetch with retry, timeout, and offline queue
 */
async function resilientFetch(url, options = {}, config = {}) {
  const {
    maxRetries = 3,
    timeoutMs = 10000,
    queueOffline = false,
    cacheKey = null,
  } = config;

  // Check cache first
  if (cacheKey) {
    try {
      const cached = await AsyncStorage.getItem(`@cache_${cacheKey}`);
      if (cached) {
        const { data, timestamp, ttl } = JSON.parse(cached);
        if (Date.now() - timestamp < (ttl || 300000)) {
          return { data, source: 'cache', status: 200 };
        }
      }
    } catch (e) {
      /* ignore */
    }
  }

  // If offline, queue or return cache
  if (!isOnline) {
    if (queueOffline) {
      networkQueue.push({ url, options, config, timestamp: Date.now() });
      return { data: null, source: 'queued', status: 0 };
    }
    // Try returning stale cache
    if (cacheKey) {
      try {
        const cached = await AsyncStorage.getItem(`@cache_${cacheKey}`);
        if (cached)
          return {
            data: JSON.parse(cached).data,
            source: 'stale_cache',
            status: 200,
          };
      } catch (e) {
        /* ignore */
      }
    }
    throw new Error('No internet connection');
  }

  // Retry loop
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok && attempt < maxRetries - 1) {
        lastError = new Error(`HTTP ${response.status}`);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // Exponential backoff
        continue;
      }

      const data = await response.json();

      // Cache result
      if (cacheKey) {
        try {
          await AsyncStorage.setItem(
            `@cache_${cacheKey}`,
            JSON.stringify({
              data,
              timestamp: Date.now(),
              ttl: config.cacheTtl || 300000,
            }),
          );
        } catch (e) {
          /* ignore */
        }
      }

      return { data, source: 'network', status: response.status };
    } catch (err) {
      lastError = err;
      if (err.name === 'AbortError') lastError = new Error('Request timed out');
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

/**
 * Process offline queue when back online
 */
async function processQueue() {
  while (networkQueue.length > 0) {
    const item = networkQueue.shift();
    try {
      await resilientFetch(item.url, item.options, {
        ...item.config,
        queueOffline: false,
      });
    } catch (e) {
      // Re-queue if still failing
      if (Date.now() - item.timestamp < 3600000) {
        // Max 1 hour
        networkQueue.push(item);
      }
    }
  }
}

// ============================================
// #559 — Performance Monitor
// ============================================
const performanceMarks = {};

function markStart(label) {
  performanceMarks[label] = Date.now();
}

function markEnd(label) {
  const start = performanceMarks[label];
  if (!start) return null;
  const duration = Date.now() - start;
  delete performanceMarks[label];

  // Log slow operations
  if (duration > 3000) {
    console.warn(`[ProFish Perf] Slow operation: ${label} took ${duration}ms`);
    try {
      const analytics = require('@react-native-firebase/analytics').default;
      analytics().logEvent('slow_operation', { label, duration_ms: duration });
    } catch (e) {
      /* ignore */
    }
  }

  return duration;
}

// ============================================
// #561 — Deep link handler config
// ============================================
const DEEP_LINK_ROUTES = {
  'profish://catch/:id': 'CatchDetail',
  'profish://spot/:id': 'SpotDetail',
  'profish://species/:id': 'SpeciesDetail',
  'profish://community/:postId': 'CommunityDetail',
  'profish://legal': 'IsItLegal',
  'profish://school': 'FishingSchool',
  'profish://moon': 'MoonCalendar',
  'profish://trip': 'TripPlanner',
  'profish://quiz': 'FishIdQuiz',
  'profish://profile/:userId': 'ProfileDetail',
  // Universal links
  'https://profish.app/catch/:id': 'CatchDetail',
  'https://profish.app/share/:id': 'SharedContent',
};

function parseDeepLink(url) {
  for (const [pattern, screen] of Object.entries(DEEP_LINK_ROUTES)) {
    const regex = new RegExp(
      '^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$',
    );
    const match = url.match(regex);
    if (match) {
      return { screen, params: match.groups || {} };
    }
  }
  return null;
}

// ============================================
// #562 — Accessibility helpers
// ============================================
const A11Y = {
  announce: message => {
    try {
      const { AccessibilityInfo } = require('react-native');
      AccessibilityInfo.announceForAccessibility(message);
    } catch (e) {
      /* ignore */
    }
  },

  labels: {
    catchLogButton: 'Log a new catch',
    mapScreen: 'Fishing map with layers and markers',
    fishCastScore: 'FishCast activity score',
    tideChart: 'Tide prediction chart',
    moonCalendar: 'Moon phase fishing calendar',
    speciesDetail: 'Species identification details',
    settingsButton: 'Open settings',
    searchButton: 'Search',
    backButton: 'Go back',
    closeButton: 'Close',
  },

  // Minimum touch target 44x44 per Apple/Google guidelines
  minTouchSize: { minWidth: 44, minHeight: 44 },
};

// ============================================
// #557 — API Cost Guard — Prevent duplicate calls
// ============================================
const apiCallTracker = {};

/**
 * Prevent duplicate API calls within a time window
 */
function guardApiCall(apiName, minIntervalMs = 5000) {
  const now = Date.now();
  const lastCall = apiCallTracker[apiName];

  if (lastCall && now - lastCall < minIntervalMs) {
    return {
      allowed: false,
      reason: 'throttled',
      nextAllowedIn: minIntervalMs - (now - lastCall),
    };
  }

  apiCallTracker[apiName] = now;
  return { allowed: true };
}

/**
 * Audit all API usage — list services and their costs
 */
function getApiCostAudit() {
  return {
    FREE_APIS: [
      {
        name: 'Open-Meteo Weather',
        cost: '$0',
        limit: '10,000 req/day',
        usage: 'Weather data, hourly forecast',
      },
      {
        name: 'Overpass API (OSM)',
        cost: '$0',
        limit: '2 req/sec',
        usage: 'Fishing spots, boat ramps, piers',
      },
      {
        name: 'Firebase Auth',
        cost: '$0',
        limit: '10K verifications/day free tier',
        usage: 'User auth',
      },
      {
        name: 'Firebase Firestore',
        cost: '$0 under free tier',
        limit: '50K reads/day, 20K writes/day',
        usage: 'Catches, spots, community',
      },
      {
        name: 'Firebase Analytics',
        cost: '$0',
        limit: 'Unlimited',
        usage: 'Event tracking',
      },
      {
        name: 'Firebase Cloud Messaging',
        cost: '$0',
        limit: 'Unlimited',
        usage: 'Push notifications',
      },
    ],
    PAID_APIS: [
      {
        name: 'NOAA CO-OPS Tides',
        cost: '$0',
        limit: 'Public API, no key',
        usage: 'US tide data',
        duplicateRisk: 'LOW',
      },
      {
        name: 'WorldTides.info',
        cost: '~$5/month hobby',
        limit: 'Per request',
        usage: 'Global tide data',
        duplicateRisk: 'MEDIUM — ensure cache is used',
      },
      {
        name: 'RevenueCat',
        cost: '$0 until $2.5K MRR',
        limit: 'Unlimited',
        usage: 'Subscription management',
      },
      {
        name: 'Google AdMob',
        cost: '$0 (revenue source)',
        limit: 'N/A',
        usage: 'Ad monetization',
      },
      {
        name: 'Mapbox',
        cost: '$0 under 25K loads/month',
        limit: '25K map loads',
        usage: 'Map tiles',
        duplicateRisk: 'LOW — tiles cached locally',
      },
    ],
    COST_SAVING_MEASURES: [
      'All weather uses Open-Meteo (completely free)',
      'Fishing spots use Overpass API (free, rate limited with 600ms delays)',
      'Tide data cached for 6+ hours per location',
      'Map tiles cached on device automatically',
      'Firebase free tier covers up to 50K MAU',
      'WorldTides calls deduped with 6h cache per location',
      'API call guard prevents duplicate rapid-fire requests',
    ],
  };
}

export {
  ErrorBoundary,
  initNetworkListener,
  resilientFetch,
  processQueue,
  markStart,
  markEnd,
  DEEP_LINK_ROUTES,
  parseDeepLink,
  A11Y,
  guardApiCall,
  getApiCostAudit,
};

export default {
  ErrorBoundary,
  initNetworkListener,
  resilientFetch,
  markStart,
  markEnd,
  parseDeepLink,
  A11Y,
  guardApiCall,
  getApiCostAudit,
};
