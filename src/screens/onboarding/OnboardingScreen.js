/**
 * OnboardingScreen — 5-screen interactive walkthrough
 * #507 — Species picker, home region, fishing style, notifications, permissions
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Animated,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../config/constants';

const { width, height } = Dimensions.get('window');

const THEME = {
  bg: '#0A0A1A',
  card: '#1A1A2E',
  primary: '#0080FF',
  accent: '#00D4AA',
  text: '#FFFFFF',
  muted: '#8A8A9A',
  border: '#2A2A40',
};

// ——— Step 1: Welcome + fishing style ———
const FISHING_STYLES = [
  {
    id: 'freshwater',
    label: 'Freshwater',
    emoji: '🏞️',
    desc: 'Lakes, rivers, ponds',
  },
  {
    id: 'saltwater',
    label: 'Saltwater',
    emoji: '🌊',
    desc: 'Ocean, surf, deep sea',
  },
  {
    id: 'fly',
    label: 'Fly Fishing',
    emoji: '🪰',
    desc: 'Streams, rivers, flats',
  },
  {
    id: 'ice',
    label: 'Ice Fishing',
    emoji: '🧊',
    desc: 'Frozen lakes & ponds',
  },
  { id: 'kayak', label: 'Kayak/Shore', emoji: '🛶', desc: 'Bank, pier, kayak' },
  {
    id: 'boat',
    label: 'Boat/Offshore',
    emoji: '🚤',
    desc: 'Charter, trolling, bottom',
  },
];

// ——— Step 2: Target species ———
const POPULAR_SPECIES = [
  { id: 'largemouth_bass', name: 'Largemouth Bass', emoji: '🐟' },
  { id: 'rainbow_trout', name: 'Rainbow Trout', emoji: '🐟' },
  { id: 'walleye', name: 'Walleye', emoji: '🐟' },
  { id: 'redfish', name: 'Redfish', emoji: '🐟' },
  { id: 'mahi_mahi', name: 'Mahi-Mahi', emoji: '🐠' },
  { id: 'bluegill', name: 'Bluegill', emoji: '🐟' },
  { id: 'pike', name: 'Northern Pike', emoji: '🐟' },
  { id: 'catfish', name: 'Channel Catfish', emoji: '🐟' },
  { id: 'atlantic_salmon', name: 'Atlantic Salmon', emoji: '🐟' },
  { id: 'snook', name: 'Snook', emoji: '🐟' },
  { id: 'crappie', name: 'Crappie', emoji: '🐟' },
  { id: 'striped_bass', name: 'Striped Bass', emoji: '🐟' },
];

// ——— Step 3: Home region ———
const REGIONS = [
  { id: 'NA', label: 'North America', emoji: '🇺🇸' },
  { id: 'EU', label: 'Europe', emoji: '🇪🇺' },
  { id: 'NORDICS', label: 'Scandinavia', emoji: '🇸🇪' },
  { id: 'OC', label: 'Australia / NZ', emoji: '🇦🇺' },
  { id: 'EA', label: 'East Asia', emoji: '🇯🇵' },
  { id: 'SEA', label: 'Southeast Asia', emoji: '🇹🇭' },
  { id: 'SA', label: 'South America', emoji: '🇧🇷' },
  { id: 'AF', label: 'Africa', emoji: '🇿🇦' },
  { id: 'GCC', label: 'Middle East', emoji: '🇦🇪' },
  { id: 'SA_ASIA', label: 'South Asia', emoji: '🇮🇳' },
];

function Step1({ selections, setSelections }) {
  const toggleStyle = id => {
    setSelections(prev => ({
      ...prev,
      styles: prev.styles?.includes(id)
        ? prev.styles.filter(s => s !== id)
        : [...(prev.styles || []), id],
    }));
  };

  return (
    <View style={styles.step}>
      <Text style={styles.stepEmoji}>🎣</Text>
      <Text style={styles.stepTitle}>How do you fish?</Text>
      <Text style={styles.stepSubtitle}>
        Select all that apply — we'll customize your experience
      </Text>
      <View style={styles.grid}>
        {FISHING_STYLES.map(s => {
          const selected = selections.styles?.includes(s.id);
          return (
            <TouchableOpacity
              key={s.id}
              style={[styles.gridItem, selected && styles.gridItemSelected]}
              onPress={() => toggleStyle(s.id)}
            >
              <Text style={styles.gridEmoji}>{s.emoji}</Text>
              <Text
                style={[styles.gridLabel, selected && styles.gridLabelSelected]}
              >
                {s.label}
              </Text>
              <Text style={styles.gridDesc}>{s.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Step2({ selections, setSelections }) {
  const toggleSpecies = id => {
    setSelections(prev => ({
      ...prev,
      species: prev.species?.includes(id)
        ? prev.species.filter(s => s !== id)
        : [...(prev.species || []), id],
    }));
  };

  return (
    <View style={styles.step}>
      <Text style={styles.stepEmoji}>🐟</Text>
      <Text style={styles.stepTitle}>What do you target?</Text>
      <Text style={styles.stepSubtitle}>
        Pick your favorite species — you can always change later
      </Text>
      <View style={styles.grid}>
        {POPULAR_SPECIES.map(s => {
          const selected = selections.species?.includes(s.id);
          return (
            <TouchableOpacity
              key={s.id}
              style={[styles.chipItem, selected && styles.chipSelected]}
              onPress={() => toggleSpecies(s.id)}
            >
              <Text style={styles.chipText}>
                {s.emoji} {s.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Step3({ selections, setSelections }) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepEmoji}>🌍</Text>
      <Text style={styles.stepTitle}>Where's home base?</Text>
      <Text style={styles.stepSubtitle}>
        We'll show local species, regulations, and tide data
      </Text>
      <View style={styles.regionList}>
        {REGIONS.map(r => {
          const selected = selections.region === r.id;
          return (
            <TouchableOpacity
              key={r.id}
              style={[styles.regionItem, selected && styles.regionSelected]}
              onPress={() => setSelections(prev => ({ ...prev, region: r.id }))}
            >
              <Text style={styles.regionEmoji}>{r.emoji}</Text>
              <Text
                style={[
                  styles.regionLabel,
                  selected && styles.regionLabelSelected,
                ]}
              >
                {r.label}
              </Text>
              {selected && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Step4({ selections, setSelections }) {
  const toggle = key => {
    setSelections(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications?.[key],
      },
    }));
  };

  const notifs = selections.notifications || {
    biteAlerts: true,
    tideAlerts: true,
    weatherAlerts: true,
    communityUpdates: false,
    weeklyReport: true,
  };

  const items = [
    {
      key: 'biteAlerts',
      label: 'Bite Alerts',
      desc: 'When FishCast hits 90+ at your spots',
      emoji: '🔔',
    },
    {
      key: 'tideAlerts',
      label: 'Tide Alerts',
      desc: 'Incoming high/low tide at saved spots',
      emoji: '🌊',
    },
    {
      key: 'weatherAlerts',
      label: 'Weather Warnings',
      desc: 'Storm approaching your location',
      emoji: '⛈️',
    },
    {
      key: 'communityUpdates',
      label: 'Community',
      desc: 'Likes, comments, new followers',
      emoji: '👥',
    },
    {
      key: 'weeklyReport',
      label: 'Weekly Report',
      desc: 'Your fishing stats summary',
      emoji: '📊',
    },
  ];

  return (
    <View style={styles.step}>
      <Text style={styles.stepEmoji}>🔔</Text>
      <Text style={styles.stepTitle}>Stay in the loop</Text>
      <Text style={styles.stepSubtitle}>
        Choose what notifications matter to you
      </Text>
      {items.map(item => (
        <View key={item.key} style={styles.notifRow}>
          <Text style={styles.notifEmoji}>{item.emoji}</Text>
          <View style={styles.notifText}>
            <Text style={styles.notifLabel}>{item.label}</Text>
            <Text style={styles.notifDesc}>{item.desc}</Text>
          </View>
          <Switch
            value={notifs[item.key] !== false}
            onValueChange={() => toggle(item.key)}
            trackColor={{ false: '#333', true: THEME.primary }}
            thumbColor="#fff"
          />
        </View>
      ))}
    </View>
  );
}

function Step5() {
  return (
    <View style={styles.step}>
      <Text style={styles.stepEmoji}>🚀</Text>
      <Text style={styles.stepTitle}>You're all set!</Text>
      <Text style={styles.stepSubtitle}>Here's what ProFish gives you</Text>
      <View style={styles.featureList}>
        {[
          { emoji: '🎯', text: 'FishCast — AI-powered bite prediction' },
          { emoji: '🗺️', text: '18 map layers — bathymetry, SST, tides' },
          { emoji: '📸', text: 'Smart catch logging with AI species ID' },
          { emoji: '🏆', text: 'Tournaments, leaderboards, community' },
          { emoji: '📚', text: 'Fishing school — knots, techniques, tips' },
          { emoji: '🌙', text: 'Solunar calendar & tide alerts' },
        ].map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={styles.featureEmoji}>{f.emoji}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.letsGo}>Tap "Finish" to start fishing smarter →</Text>
    </View>
  );
}

const STEPS = [Step1, Step2, Step3, Step4, Step5];

export default function OnboardingScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({
    styles: [],
    species: [],
    region: null,
    notifications: {
      biteAlerts: true,
      tideAlerts: true,
      weatherAlerts: true,
      communityUpdates: false,
      weeklyReport: true,
    },
  });
  const flatListRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const goNext = useCallback(async () => {
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      flatListRef.current?.scrollToIndex({ index: nextStep, animated: true });
      Animated.timing(progressAnim, {
        toValue: nextStep / (STEPS.length - 1),
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      // Finish onboarding
      await AsyncStorage.setItem(
        STORAGE_KEYS?.ONBOARDING || '@profish_onboarding_complete',
        'true',
      );
      await AsyncStorage.setItem(
        '@profish_onboarding_selections',
        JSON.stringify(selections),
      );
      navigation.replace('MainTabs');
    }
  }, [currentStep, selections, navigation, progressAnim]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      flatListRef.current?.scrollToIndex({ index: prevStep, animated: true });
      Animated.timing(progressAnim, {
        toValue: prevStep / (STEPS.length - 1),
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [currentStep, progressAnim]);

  const skip = useCallback(async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS?.ONBOARDING || '@profish_onboarding_complete',
      'true',
    );
    navigation.replace('MainTabs');
  }, [navigation]);

  const renderStep = useCallback(
    ({ index }) => {
      const StepComponent = STEPS[index];
      return (
        <View style={{ width }}>
          <StepComponent
            selections={selections}
            setSelections={setSelections}
          />
        </View>
      );
    },
    [selections],
  );

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['20%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
      </View>

      {/* Steps */}
      <FlatList
        ref={flatListRef}
        data={STEPS}
        renderItem={renderStep}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
      />

      {/* Navigation buttons */}
      <View style={styles.nav}>
        {currentStep > 0 ? (
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={skip} style={styles.backBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.stepIndicator}>
          {currentStep + 1} / {STEPS.length}
        </Text>

        <TouchableOpacity onPress={goNext} style={styles.nextBtn}>
          <Text style={styles.nextText}>
            {currentStep === STEPS.length - 1 ? 'Finish ✓' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  progressContainer: {
    height: 4,
    backgroundColor: THEME.border,
    marginTop: 50,
  },
  progressBar: { height: 4, backgroundColor: THEME.primary, borderRadius: 2 },
  step: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  stepEmoji: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: THEME.muted,
    textAlign: 'center',
    marginBottom: 24,
  },

  // Grid items (fishing style)
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: (width - 64) / 2,
    padding: 16,
    backgroundColor: THEME.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gridItemSelected: {
    borderColor: THEME.primary,
    backgroundColor: '#0080FF15',
  },
  gridEmoji: { fontSize: 28, marginBottom: 8 },
  gridLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 4,
  },
  gridLabelSelected: { color: THEME.primary },
  gridDesc: { fontSize: 12, color: THEME.muted },

  // Chip items (species)
  chipItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: THEME.card,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipSelected: { borderColor: THEME.accent, backgroundColor: '#00D4AA15' },
  chipText: { fontSize: 14, color: THEME.text },

  // Region list
  regionList: { gap: 8 },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: THEME.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  regionSelected: { borderColor: THEME.primary },
  regionEmoji: { fontSize: 24, marginRight: 12 },
  regionLabel: { fontSize: 16, color: THEME.text, flex: 1 },
  regionLabelSelected: { color: THEME.primary, fontWeight: '700' },
  checkmark: { fontSize: 18, color: THEME.primary, fontWeight: '700' },

  // Notification toggles
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  notifEmoji: { fontSize: 24, marginRight: 12 },
  notifText: { flex: 1 },
  notifLabel: { fontSize: 16, fontWeight: '600', color: THEME.text },
  notifDesc: { fontSize: 12, color: THEME.muted, marginTop: 2 },

  // Feature list (step 5)
  featureList: { marginTop: 8 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  featureEmoji: { fontSize: 24, marginRight: 14 },
  featureText: { fontSize: 15, color: THEME.text, flex: 1 },
  letsGo: {
    fontSize: 14,
    color: THEME.accent,
    textAlign: 'center',
    marginTop: 24,
    fontWeight: '600',
  },

  // Navigation
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
  backBtn: { paddingVertical: 12, paddingHorizontal: 16 },
  backText: { fontSize: 16, color: THEME.muted },
  skipText: { fontSize: 16, color: THEME.muted },
  stepIndicator: { fontSize: 14, color: THEME.muted },
  nextBtn: {
    backgroundColor: THEME.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  nextText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
