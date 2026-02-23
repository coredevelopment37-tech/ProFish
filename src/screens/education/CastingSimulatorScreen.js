/**
 * CastingSimulatorScreen — Technique hub
 * Grid of 10 casting techniques with unlock/progress/stars.
 * Entry point for the casting mini-game.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  TECHNIQUES,
  DIFFICULTY_COLORS,
  loadProgress,
  getUnlockedTechniques,
} from '../../services/castingService';
import useTheme from '../../hooks/useTheme';
import { AppIcon } from '../../constants/icons';

const { width: W } = Dimensions.get('window');
const CARD_W = (W - 48) / 2;

export default function CastingSimulatorScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [progress, setProgress] = useState({
    techniques: {},
    totalStars: 0,
    masterCaster: false,
  });
  const [unlocked, setUnlocked] = useState(new Set(['overhead', 'sidearm']));
  const [showTutorial, setShowTutorial] = useState(false);

  // Reload progress every time screen is focused
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const p = await loadProgress();
        setProgress(p);
        setUnlocked(getUnlockedTechniques(p));
      })();
    }, []),
  );

  const totalStars = progress.totalStars || 0;
  const maxStars = TECHNIQUES.length * 3; // 30
  const masteredCount = Object.values(progress.techniques || {}).filter(
    t => t.stars === 3,
  ).length;

  const handleTechPress = tech => {
    if (!unlocked.has(tech.id)) {
      Alert.alert(
        'Locked',
        'Earn 2+ stars on any unlocked technique to unlock the next one!',
        [{ text: 'Got it' }],
      );
      return;
    }
    navigation.navigate('CastingGame', { techniqueId: tech.id });
  };

  const renderStars = techId => {
    const data = progress.techniques?.[techId];
    const earned = data?.stars || 0;
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3].map(i => (
          <View key={i}>
            <AppIcon
              name="star"
              size={18}
              color={earned >= i ? '#FFD700' : '#2a3550'}
            />
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <AppIcon name="fish" size={24} color="#fff" />
          <Text style={styles.title}>Casting Simulator</Text>
        </View>
        <Text style={styles.subtitle}>Master 10 real casting techniques</Text>
      </View>

      {/* Progress Summary */}
      <View style={styles.progressCard}>
        <View style={styles.progressRow}>
          <View style={styles.progressItem}>
            <Text style={styles.progressValue}>
              {totalStars}/{maxStars}
            </Text>
            <Text style={styles.progressLabel}>Stars</Text>
          </View>
          <View style={styles.progressItem}>
            <Text style={styles.progressValue}>
              {masteredCount}/{TECHNIQUES.length}
            </Text>
            <Text style={styles.progressLabel}>Mastered</Text>
          </View>
          <View style={styles.progressItem}>
            <Text
              style={[
                styles.progressValue,
                progress.masterCaster && styles.masterText,
              ]}
            >
              {progress.masterCaster ? '' : ''}
            </Text>
            {progress.masterCaster ? (
              <AppIcon name="trophy" size={28} color="#FFD700" />
            ) : (
              <AppIcon name="target" size={28} color="#00D4AA" />
            )}
            <Text style={styles.progressLabel}>
              {progress.masterCaster ? 'Master!' : 'In Training'}
            </Text>
          </View>
        </View>
        {/* Stars progress bar */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${(totalStars / maxStars) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* How to play hint */}
      <TouchableOpacity
        style={styles.hintBar}
        onPress={() => setShowTutorial(!showTutorial)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <AppIcon name="smartphone" size={14} color="#88aacc" />
          <Text style={styles.hintText}>
            {showTutorial ? 'Hide instructions' : 'How to play \u2014 tap here'}
          </Text>
        </View>
      </TouchableOpacity>

      {showTutorial && (
        <View style={styles.tutorialCard}>
          <Text style={styles.tutorialText}>
            1️⃣ Hold your phone like a fishing rod{'\n'}
            2️⃣ Press & hold the CAST button to load power{'\n'}
            3️⃣ Flick/swipe UP to cast!{'\n'}
            4️⃣ Release timing affects accuracy{'\n'}
            5️⃣ Watch the wind — it drifts your lure{'\n\n'}★ 50+ = 1 star ★★ 75+ = 2 stars ★★★ 90+ = 3 stars
          </Text>
        </View>
      )}

      {/* Techniques Grid */}
      <ScrollView
        style={styles.grid}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        {TECHNIQUES.map(tech => {
          const isUnlocked = unlocked.has(tech.id);
          const data = progress.techniques?.[tech.id];
          const bestScore = data?.bestScore || 0;
          const attempts = data?.attempts || 0;

          return (
            <TouchableOpacity
              key={tech.id}
              style={[styles.techCard, !isUnlocked && styles.techCardLocked]}
              activeOpacity={isUnlocked ? 0.7 : 0.5}
              onPress={() => handleTechPress(tech)}
            >
              {/* Lock overlay */}
              {!isUnlocked && (
                <View style={styles.lockOverlay}>
                  <AppIcon name="lock" size={36} color="#8899aa" />
                </View>
              )}

              {/* Difficulty badge */}
              <View
                style={[
                  styles.diffBadge,
                  {
                    backgroundColor: DIFFICULTY_COLORS[tech.difficulty] + '30',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.diffText,
                    { color: DIFFICULTY_COLORS[tech.difficulty] },
                  ]}
                >
                  {tech.difficulty.toUpperCase()}
                </Text>
              </View>

              {/* Icon + Name */}
              <View style={styles.techEmoji}>
                <AppIcon name={tech.icon || 'fish'} size={28} color="#00D4AA" />
              </View>
              <Text style={styles.techName} numberOfLines={1}>
                {tech.name}
              </Text>
              <Text style={styles.techDesc} numberOfLines={2}>
                {tech.description}
              </Text>

              {/* Stars */}
              {isUnlocked && renderStars(tech.id)}

              {/* Stats */}
              {isUnlocked && attempts > 0 && (
                <Text style={styles.techStats}>
                  Best: {bestScore} · {attempts}{' '}
                  {attempts === 1 ? 'cast' : 'casts'}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    paddingVertical: 4,
    marginBottom: 4,
  },
  backText: {
    color: '#00D4AA',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#8899aa',
    fontSize: 14,
    marginTop: 4,
  },

  // Progress
  progressCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#111830',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a2540',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  progressLabel: {
    color: '#6688aa',
    fontSize: 12,
    marginTop: 2,
  },
  masterText: {
    fontSize: 28,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#1a2540',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },

  // Tutorial
  hintBar: {
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#0d1530',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a2540',
  },
  hintText: {
    color: '#88aacc',
    fontSize: 13,
    textAlign: 'center',
  },
  tutorialCard: {
    marginHorizontal: 16,
    marginTop: 6,
    padding: 14,
    backgroundColor: '#111830',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00D4AA30',
  },
  tutorialText: {
    color: '#bbccdd',
    fontSize: 13,
    lineHeight: 22,
  },

  // Grid
  grid: {
    flex: 1,
    marginTop: 12,
  },
  gridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 40,
    gap: 12,
  },

  // Card
  techCard: {
    width: CARD_W,
    backgroundColor: '#111830',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1a2540',
    minHeight: 180,
  },
  techCardLocked: {
    opacity: 0.45,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 16,
  },
  lockIcon: {
    fontSize: 36,
  },
  diffBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  diffText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  techEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  techName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  techDesc: {
    color: '#7788aa',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  star: {
    fontSize: 18,
    color: '#2a3550',
  },
  starEarned: {
    color: '#FFD700',
  },
  techStats: {
    color: '#5566aa',
    fontSize: 11,
  },
});
