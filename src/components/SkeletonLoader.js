/**
 * SkeletonLoader — Animated pulsating loading placeholders
 * Usage:
 *   <SkeletonLoader.Card />       — catch card placeholder
 *   <SkeletonLoader.FishCast />   — fishcast screen placeholder
 *   <SkeletonLoader.List count={5} /> — list of card placeholders
 *   <SkeletonLoader.Row />        — single row placeholder
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

function usePulse() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return opacity;
}

function Bone({ style }) {
  const opacity = usePulse();
  return <Animated.View style={[styles.bone, style, { opacity }]} />;
}

/** Catch card skeleton */
function Card() {
  return (
    <View style={styles.card}>
      <Bone style={styles.cardPhoto} />
      <View style={styles.cardBody}>
        <Bone style={styles.cardTitle} />
        <Bone style={styles.cardSubtitle} />
        <View style={styles.cardRow}>
          <Bone style={styles.cardChip} />
          <Bone style={styles.cardChip} />
        </View>
      </View>
    </View>
  );
}

/** FishCast screen skeleton */
function FishCast() {
  return (
    <View style={styles.fishcastContainer}>
      <Bone style={styles.fcHeader} />
      <View style={styles.fcCircle}>
        <Bone style={styles.fcCircleBone} />
      </View>
      <Bone style={styles.fcSummary} />
      <Bone style={styles.fcCard} />
      <Bone style={styles.fcCard} />
    </View>
  );
}

/** Species list skeleton */
function Row() {
  return (
    <View style={styles.row}>
      <Bone style={styles.rowIcon} />
      <View style={styles.rowBody}>
        <Bone style={styles.rowTitle} />
        <Bone style={styles.rowSub} />
      </View>
      <Bone style={styles.rowArrow} />
    </View>
  );
}

/** Multiple card skeletons */
function List({ count = 4 }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bone: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
  },
  // Card
  card: {
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#111128',
    borderRadius: 14,
  },
  cardPhoto: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  cardBody: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  cardTitle: {
    width: '60%',
    height: 14,
    marginBottom: 8,
    borderRadius: 4,
  },
  cardSubtitle: {
    width: '40%',
    height: 10,
    marginBottom: 8,
    borderRadius: 4,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cardChip: {
    width: 50,
    height: 10,
    borderRadius: 4,
  },
  // FishCast
  fishcastContainer: {
    padding: 20,
    paddingTop: 50,
  },
  fcHeader: {
    width: 120,
    height: 20,
    alignSelf: 'center',
    marginBottom: 24,
    borderRadius: 6,
  },
  fcCircle: {
    alignItems: 'center',
    marginBottom: 20,
  },
  fcCircleBone: {
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  fcSummary: {
    width: '80%',
    height: 14,
    alignSelf: 'center',
    marginBottom: 24,
    borderRadius: 4,
  },
  fcCard: {
    width: '100%',
    height: 100,
    marginBottom: 16,
    borderRadius: 16,
  },
  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#111128',
    borderRadius: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  rowBody: {
    flex: 1,
    marginLeft: 12,
  },
  rowTitle: {
    width: '50%',
    height: 12,
    marginBottom: 6,
    borderRadius: 4,
  },
  rowSub: {
    width: '30%',
    height: 10,
    borderRadius: 4,
  },
  rowArrow: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
});

const SkeletonLoader = { Card, FishCast, List, Row, Bone };
export default SkeletonLoader;
