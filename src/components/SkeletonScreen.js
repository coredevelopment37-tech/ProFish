/**
 * SkeletonScreen — Shimmer placeholder while lazy screens load
 * #502 — Skeleton loading screens with animated shimmer
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const THEME = {
  bg: '#1A1A2E',
  bone: '#2A2A40',
  shimmer: '#3A3A55',
};

function ShimmerBar({ width: w, height: h, style, delay = 0 }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim, delay]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: w,
          height: h,
          backgroundColor: THEME.bone,
          borderRadius: h > 20 ? 12 : 6,
          opacity,
        },
        style,
      ]}
    />
  );
}

function ListSkeleton() {
  return (
    <View style={styles.content}>
      {/* Header bar */}
      <ShimmerBar width={width * 0.5} height={28} style={styles.mb16} />
      <ShimmerBar
        width={width * 0.3}
        height={16}
        style={styles.mb24}
        delay={100}
      />

      {/* List items */}
      {[0, 1, 2, 3, 4].map(i => (
        <View key={i} style={styles.listItem}>
          <ShimmerBar
            width={56}
            height={56}
            style={{ borderRadius: 28 }}
            delay={i * 80}
          />
          <View style={styles.listText}>
            <ShimmerBar width={width * 0.5} height={16} delay={i * 80 + 40} />
            <ShimmerBar
              width={width * 0.35}
              height={12}
              style={styles.mt8}
              delay={i * 80 + 80}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function MapSkeleton() {
  return (
    <View style={styles.content}>
      <ShimmerBar width={width - 32} height={width * 0.7} style={styles.mb16} />
      <View style={styles.row}>
        {[0, 1, 2, 3].map(i => (
          <ShimmerBar
            key={i}
            width={72}
            height={32}
            style={styles.mr8}
            delay={i * 100}
          />
        ))}
      </View>
    </View>
  );
}

function DetailSkeleton() {
  return (
    <View style={styles.content}>
      <ShimmerBar width={width - 32} height={200} style={styles.mb16} />
      <ShimmerBar
        width={width * 0.6}
        height={24}
        style={styles.mb16}
        delay={100}
      />
      <ShimmerBar
        width={width * 0.9}
        height={14}
        style={styles.mb8}
        delay={200}
      />
      <ShimmerBar
        width={width * 0.8}
        height={14}
        style={styles.mb8}
        delay={250}
      />
      <ShimmerBar
        width={width * 0.7}
        height={14}
        style={styles.mb16}
        delay={300}
      />
      <ShimmerBar
        width={width * 0.4}
        height={20}
        style={styles.mb8}
        delay={350}
      />
      <ShimmerBar
        width={width * 0.9}
        height={14}
        style={styles.mb8}
        delay={400}
      />
      <ShimmerBar width={width * 0.85} height={14} delay={450} />
    </View>
  );
}

function FormSkeleton() {
  return (
    <View style={styles.content}>
      <ShimmerBar width={width * 0.4} height={24} style={styles.mb24} />
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={styles.mb16}>
          <ShimmerBar
            width={width * 0.3}
            height={14}
            style={styles.mb8}
            delay={i * 100}
          />
          <ShimmerBar width={width - 32} height={44} delay={i * 100 + 50} />
        </View>
      ))}
      <ShimmerBar
        width={width - 32}
        height={48}
        style={[styles.mt8, { borderRadius: 24 }]}
        delay={500}
      />
    </View>
  );
}

function ProfileSkeleton() {
  return (
    <View style={styles.content}>
      <View style={styles.profileHeader}>
        <ShimmerBar width={80} height={80} style={{ borderRadius: 40 }} />
        <ShimmerBar
          width={width * 0.4}
          height={20}
          style={styles.mt8}
          delay={100}
        />
        <ShimmerBar
          width={width * 0.25}
          height={14}
          style={styles.mt8}
          delay={200}
        />
      </View>
      <View style={styles.row}>
        {[0, 1, 2].map(i => (
          <View key={i} style={styles.statBox}>
            <ShimmerBar width={40} height={24} delay={i * 100 + 300} />
            <ShimmerBar
              width={56}
              height={12}
              style={styles.mt8}
              delay={i * 100 + 350}
            />
          </View>
        ))}
      </View>
      {[0, 1, 2].map(i => (
        <ShimmerBar
          key={i}
          width={width - 32}
          height={56}
          style={styles.mb12}
          delay={i * 100 + 500}
        />
      ))}
    </View>
  );
}

const VARIANTS = {
  list: ListSkeleton,
  map: MapSkeleton,
  detail: DetailSkeleton,
  form: FormSkeleton,
  profile: ProfileSkeleton,
};

export default function SkeletonScreen({ variant = 'list' }) {
  const Component = VARIANTS[variant] || ListSkeleton;
  return (
    <View style={styles.container}>
      <Component />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
  },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mb16: { marginBottom: 16 },
  mb24: { marginBottom: 24 },
  mt8: { marginTop: 8 },
  mr8: { marginRight: 8 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  listText: {
    marginLeft: 12,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
});
