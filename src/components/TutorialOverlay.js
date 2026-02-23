/**
 * TutorialOverlay — Full-screen tutorial overlays for FishCast + Map
 * #509-511 — First Catch tutorial, FishCast tutorial, Map tutorial
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useTheme from '../hooks/useTheme';
import { AppIcon } from '../constants/icons';

const { width } = Dimensions.get('window');

// ——— Tutorial Definitions ———

const TUTORIALS = {
  // #509 — First Catch guided tutorial
  FIRST_CATCH: {
    key: '@profish_tut_first_catch',
    steps: [
      {
        icon: 'camera',
        title: 'Snap a Photo',
        message:
          'Take a photo of your catch — our AI will auto-identify the species and suggest the weight.',
      },
      {
        icon: 'fish',
        title: 'Fill in the Details',
        message:
          'Confirm species, enter weight/length, and choose your bait or lure.',
      },
      {
        icon: 'mapPin',
        title: 'Tag the Location',
        message:
          'Your GPS location is auto-captured. You can also pick a spot from the map.',
      },
      {
        icon: 'cloudSun',
        title: 'Conditions Auto-Logged',
        message:
          'We automatically record weather, tide, moon phase, and barometric pressure.',
      },
      {
        icon: 'checkCircle',
        title: 'Save & Share',
        message:
          'Hit save! Your catch is logged and synced. Share it with the community to earn points.',
      },
    ],
  },

  // #510 — FishCast tutorial
  FISHCAST: {
    key: '@profish_tut_fishcast',
    steps: [
      {
        icon: 'target',
        title: 'Your FishCast Score',
        message:
          'A number from 0-100 that predicts how active fish will be. 80+ is prime time!',
      },
      {
        icon: 'barChart',
        title: '8 Weighted Factors',
        message:
          'We analyze barometric pressure, moon phase, solunar periods, wind, tide, temperature, cloud cover, and precipitation.',
      },
      {
        icon: 'fish',
        title: 'Species Adjustment',
        message:
          'Each species responds differently. Select a target species to get a personalized score.',
      },
      {
        icon: 'calendar',
        title: '7-Day Outlook',
        message:
          'Swipe to see the next 7 days — plan your trip for the highest score day.',
      },
      {
        icon: 'bell',
        title: 'Bite Alerts',
        message:
          "Enable alerts and we'll notify you when FishCast hits 90+ at your saved spots.",
      },
    ],
  },

  // #511 — Map tutorial
  MAP: {
    key: '@profish_tut_map',
    steps: [
      {
        icon: 'map',
        title: '18 Map Layers',
        message:
          'Tap the layers button to toggle bathymetry, SST, weather, tide stations, and more.',
      },
      {
        icon: 'mapPin',
        title: 'Save Spots',
        message:
          "Long-press anywhere to save a fishing spot. Name it and it's bookmarked forever.",
      },
      {
        icon: 'thermometer',
        title: 'Live Conditions',
        message:
          'Weather and wind layers update in real-time. Tap any tide station for the full chart.',
      },
      {
        icon: 'flame',
        title: 'Fish Hotspots',
        message:
          'The heatmap layer shows where catches are happening. Red = hot zone!',
      },
      {
        icon: 'target',
        title: 'FishCast on Map',
        message:
          'Your current location marker shows the live FishCast score. Blue badge = go fish!',
      },
    ],
  },
};

export function checkTutorialSeen(tutorialId) {
  const tutorial = TUTORIALS[tutorialId];
  if (!tutorial) return Promise.resolve(true);
  return AsyncStorage.getItem(tutorial.key).then(val => val === 'true');
}

export function markTutorialSeen(tutorialId) {
  const tutorial = TUTORIALS[tutorialId];
  if (!tutorial) return Promise.resolve();
  return AsyncStorage.setItem(tutorial.key, 'true');
}

export function resetTutorial(tutorialId) {
  const tutorial = TUTORIALS[tutorialId];
  if (!tutorial) return Promise.resolve();
  return AsyncStorage.removeItem(tutorial.key);
}

/**
 * TutorialOverlay component — show a multi-step tutorial as a modal
 *
 * Usage:
 *   <TutorialOverlay tutorialId="FISHCAST" visible={showTut} onClose={() => setShowTut(false)} />
 */
export default function TutorialOverlay({ tutorialId, visible, onClose }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [step, setStep] = useState(0);
  const tutorial = TUTORIALS[tutorialId];

  const handleNext = useCallback(() => {
    if (step < tutorial.steps.length - 1) {
      setStep(step + 1);
    } else {
      markTutorialSeen(tutorialId);
      setStep(0);
      onClose();
    }
  }, [step, tutorial, tutorialId, onClose]);

  const handleSkip = useCallback(() => {
    markTutorialSeen(tutorialId);
    setStep(0);
    onClose();
  }, [tutorialId, onClose]);

  if (!tutorial || !visible) return null;

  const current = tutorial.steps[step];
  const isLast = step === tutorial.steps.length - 1;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Step dots */}
          <View style={styles.dots}>
            {tutorial.steps.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === step && styles.dotActive]}
              />
            ))}
          </View>

          <AppIcon name={current.icon} size={56} color={colors.primary} />
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.message}>{current.message}</Text>

          <View style={styles.buttons}>
            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.nextText}>
                  {isLast ? 'Done ' : 'Next '}
                </Text>
                <AppIcon name={isLast ? 'check' : 'arrowRight'} size={16} color={colors.text} />
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.counter}>
            {step + 1} / {tutorial.steps.length}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: width - 48,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceLight,
  },
  dots: { flexDirection: 'row', marginBottom: 24, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 24 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: colors.textTertiary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  buttons: { flexDirection: 'row', gap: 16 },
  skipBtn: { paddingVertical: 12, paddingHorizontal: 24 },
  skipText: { fontSize: 16, color: colors.textTertiary },
  nextBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  nextText: { fontSize: 16, fontWeight: '700', color: colors.text },
  counter: { fontSize: 12, color: colors.textDisabled, marginTop: 16 },
});
