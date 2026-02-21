/**
 * ScoreCircle — Animated circular score display for FishCast
 * Shows score 0-100 with color gradient and label
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

const COLORS = {
  excellent: '#4CAF50',
  veryGood: '#8BC34A',
  good: '#FFC107',
  fair: '#FF9800',
  poor: '#F44336',
};

function getScoreColor(score) {
  if (score >= 85) return COLORS.excellent;
  if (score >= 70) return COLORS.veryGood;
  if (score >= 55) return COLORS.good;
  if (score >= 40) return COLORS.fair;
  return COLORS.poor;
}

function getScoreEmoji(score) {
  if (score >= 85) return '🔥';
  if (score >= 70) return '🎣';
  if (score >= 55) return '👍';
  if (score >= 40) return '🤷';
  return '😴';
}

export default function ScoreCircle({ score = 0, label = '', size = 180 }) {
  const animValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const color = getScoreColor(score);
  const emoji = getScoreEmoji(score);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animValue, {
        toValue: score,
        duration: 1200,
        useNativeDriver: false,
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [score]);

  const displayScore = animValue.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 100],
    extrapolate: 'clamp',
  });

  const half = size / 2;
  const borderWidth = size * 0.035;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: half,
          borderWidth,
          borderColor: color,
          transform: [{ scale: scaleValue }],
        },
      ]}
    >
      <View style={styles.inner}>
        <Text style={styles.emoji}>{emoji}</Text>
        <AnimatedNumber value={displayScore} color={color} size={size * 0.28} />
        <Text style={[styles.label, { color, fontSize: size * 0.09 }]}>
          {label}
        </Text>
      </View>
      {/* Glow effect */}
      <View
        style={[
          styles.glow,
          {
            width: size + 20,
            height: size + 20,
            borderRadius: (size + 20) / 2,
            backgroundColor: color,
          },
        ]}
      />
    </Animated.View>
  );
}

function AnimatedNumber({ value, color, size }) {
  const [display, setDisplay] = React.useState(0);

  useEffect(() => {
    const id = value.addListener(({ value: v }) => {
      setDisplay(Math.round(v));
    });
    return () => value.removeListener(id);
  }, [value]);

  return (
    <Text style={[styles.score, { color, fontSize: size }]}>{display}</Text>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    overflow: 'visible',
  },
  inner: {
    alignItems: 'center',
    zIndex: 2,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  score: {
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  glow: {
    position: 'absolute',
    opacity: 0.08,
    zIndex: 0,
  },
});
