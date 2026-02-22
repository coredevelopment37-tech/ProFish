/**
 * AnimatedSplash — Custom branded splash screen with animation
 * #506 — Animated logo splash screen
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function AnimatedSplash({ onFinish }) {
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Phase 1: Logo fades in and scales up
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: Ring pulse + text appears
      Animated.parallel([
        Animated.timing(ringOpacity, {
          toValue: 0.4,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(ringScale, {
          toValue: 1.5,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Phase 3: Ring fades out
      Animated.timing(ringOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      // Hold for a moment
      Animated.delay(400),
    ]).start(() => {
      if (onFinish) onFinish();
    });
  }, [logoScale, logoOpacity, textOpacity, ringScale, ringOpacity, onFinish]);

  return (
    <View style={styles.container}>
      {/* Animated ring pulse */}
      <Animated.View
        style={[
          styles.ring,
          {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Text style={styles.logoEmoji}>🐟</Text>
      </Animated.View>

      {/* App name */}
      <Animated.Text style={[styles.appName, { opacity: textOpacity }]}>
        ProFish
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: textOpacity }]}>
        Fish Smarter. Catch More.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#0080FF',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0080FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoEmoji: {
    fontSize: 64,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 24,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: '#0080FF',
    marginTop: 8,
    letterSpacing: 1,
  },
});
