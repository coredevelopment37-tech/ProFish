/**
 * LoadingScreen — Branded full-screen loading state
 * Used as splash / transition between auth states
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';

export default function LoadingScreen({ message = 'Loading…' }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoWrap,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.logo}>🐟</Text>
        <Text style={styles.brandName}>ProFish</Text>
      </Animated.View>
      <ActivityIndicator size="large" color="#0080FF" style={styles.spinner} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 12,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0080FF',
    letterSpacing: 1,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    color: '#667',
    fontSize: 14,
  },
});
