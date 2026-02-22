/**
 * AdBanner — Reusable banner ad component for free users
 * #537 — Shows Google AdMob banner with Pro-user bypass
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { getBannerConfig } from '../services/adService';

const THEME = {
  bg: '#0A0A1A',
  card: '#1A1A2E',
  border: '#2A2A40',
  muted: '#8A8A9A',
};

/**
 * AdBanner wraps the Google AdMob BannerAd component
 * Automatically hidden for Pro users
 *
 * Usage:
 *   <AdBanner screen="Home" />
 *   <AdBanner screen="CatchesList" />
 *   <AdBanner screen="CommunityFeed" />
 */
export default function AdBanner({ screen, style }) {
  const [config, setConfig] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const cfg = getBannerConfig(screen);
    setConfig(cfg);
  }, [screen]);

  // Pro user or no config — render nothing
  if (!config) return null;

  // Try to load the real AdMob banner
  try {
    const {
      BannerAd,
      BannerAdSize,
    } = require('react-native-google-mobile-ads');

    return (
      <View style={[styles.container, style]}>
        {!error ? (
          <BannerAd
            unitId={config.unitId}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            onAdLoaded={() => setLoaded(true)}
            onAdFailedToLoad={() => setError(true)}
          />
        ) : (
          // Fallback — no ad available
          <View style={styles.fallback}>
            <Text style={styles.fallbackText}>
              🎣 Upgrade to Pro for ad-free fishing
            </Text>
          </View>
        )}
      </View>
    );
  } catch (e) {
    // AdMob SDK not installed — show subtle upgrade prompt
    return (
      <View style={[styles.container, styles.fallback, style]}>
        <Text style={styles.fallbackText}>
          🎣 Go Pro — No ads, all features
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: THEME.bg,
  },
  fallback: {
    padding: 10,
    backgroundColor: THEME.card,
    borderTopWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    width: '100%',
  },
  fallbackText: {
    fontSize: 13,
    color: THEME.muted,
  },
});
