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
import useTheme from '../../hooks/useTheme';
import { Button } from '../../components/Common';
import { AppIcon } from '../../constants/icons';

const { width, height } = Dimensions.get('window');

// ——— Step 1: Welcome + fishing style ———
const FISHING_STYLES = [
  {
    id: 'freshwater',
    label: 'Freshwater',
    icon: 'treePine',
    desc: 'Lakes, rivers, ponds',
  },
  {
    id: 'saltwater',
    label: 'Saltwater',
    icon: 'waves',
    desc: 'Ocean, surf, deep sea',
  },
  {
    id: 'fly',
    label: 'Fly Fishing',
    icon: 'fish',
    desc: 'Streams, rivers, flats',
  },
  {
    id: 'ice',
    label: 'Ice Fishing',
    icon: 'snowflake',
    desc: 'Frozen lakes & ponds',
  },
  {
    id: 'kayak',
    label: 'Kayak/Shore',
    icon: 'ship',
    desc: 'Bank, pier, kayak',
  },
  {
    id: 'boat',
    label: 'Boat/Offshore',
    icon: 'ship',
    desc: 'Charter, trolling, bottom',
  },
];

// ——— Step 2: Target species ———
const POPULAR_SPECIES = [
  { id: 'largemouth_bass', name: 'Largemouth Bass', icon: 'fish' },
  { id: 'rainbow_trout', name: 'Rainbow Trout', icon: 'fish' },
  { id: 'walleye', name: 'Walleye', icon: 'fish' },
  { id: 'redfish', name: 'Redfish', icon: 'fish' },
  { id: 'mahi_mahi', name: 'Mahi-Mahi', icon: 'fish' },
  { id: 'bluegill', name: 'Bluegill', icon: 'fish' },
  { id: 'pike', name: 'Northern Pike', icon: 'fish' },
  { id: 'catfish', name: 'Channel Catfish', icon: 'fish' },
  { id: 'atlantic_salmon', name: 'Atlantic Salmon', icon: 'fish' },
  { id: 'snook', name: 'Snook', icon: 'fish' },
  { id: 'crappie', name: 'Crappie', icon: 'fish' },
  { id: 'striped_bass', name: 'Striped Bass', icon: 'fish' },
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

function Step1({ selections, setSelections, styles, colors }) {
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
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <AppIcon name="fish" size={48} color={colors.text} />
      </View>
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
              <View style={{ marginBottom: 8 }}>
                <AppIcon name={s.icon} size={28} color={colors.text} />
              </View>
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

function Step2({ selections, setSelections, styles, colors }) {
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
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <AppIcon name="fish" size={48} color={colors.text} />
      </View>
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
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AppIcon name={s.icon} size={14} color={colors.text} />
                <Text style={[styles.chipText, { marginLeft: 4 }]}>
                  {s.name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Step3({ selections, setSelections, styles, colors }) {
  return (
    <View style={styles.step}>
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <AppIcon name="globe" size={48} color={colors.text} />
      </View>
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
              {selected && (
                <AppIcon name="check" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Step4({ selections, setSelections, styles, colors }) {
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
      icon: 'bell',
    },
    {
      key: 'tideAlerts',
      label: 'Tide Alerts',
      desc: 'Incoming high/low tide at saved spots',
      icon: 'waves',
    },
    {
      key: 'weatherAlerts',
      label: 'Weather Warnings',
      desc: 'Storm approaching your location',
      icon: 'cloudLightning',
    },
    {
      key: 'communityUpdates',
      label: 'Community',
      desc: 'Likes, comments, new followers',
      icon: 'users',
    },
    {
      key: 'weeklyReport',
      label: 'Weekly Report',
      desc: 'Your fishing stats summary',
      icon: 'barChart',
    },
  ];

  return (
    <View style={styles.step}>
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <AppIcon name="bell" size={48} color={colors.text} />
      </View>
      <Text style={styles.stepTitle}>Stay in the loop</Text>
      <Text style={styles.stepSubtitle}>
        Choose what notifications matter to you
      </Text>
      {items.map(item => (
        <View key={item.key} style={styles.notifRow}>
          <View style={{ marginRight: 12 }}>
            <AppIcon name={item.icon} size={24} color={colors.text} />
          </View>
          <View style={styles.notifText}>
            <Text style={styles.notifLabel}>{item.label}</Text>
            <Text style={styles.notifDesc}>{item.desc}</Text>
          </View>
          <Switch
            value={notifs[item.key] !== false}
            onValueChange={() => toggle(item.key)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.text}
          />
        </View>
      ))}
    </View>
  );
}

function Step5({ styles, colors }) {
  return (
    <View style={styles.step}>
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <AppIcon name="rocket" size={48} color={colors.text} />
      </View>
      <Text style={styles.stepTitle}>You're all set!</Text>
      <Text style={styles.stepSubtitle}>Here's what ProFish gives you</Text>
      <View style={styles.featureList}>
        {[
          { icon: 'target', text: 'FishCast — AI-powered bite prediction' },
          { icon: 'map', text: '18 map layers — bathymetry, SST, tides' },
          { icon: 'camera', text: 'Smart catch logging with AI species ID' },
          { icon: 'trophy', text: 'Tournaments, leaderboards, community' },
          {
            icon: 'bookOpen',
            text: 'Fishing school — knots, techniques, tips',
          },
          { icon: 'moon', text: 'Solunar calendar & tide alerts' },
        ].map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={{ marginRight: 14 }}>
              <AppIcon name={f.icon} size={24} color={colors.text} />
            </View>
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
  const { colors } = useTheme();
  const styles = createStyles(colors);
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
            styles={styles}
            colors={colors}
          />
        </View>
      );
    },
    [selections, styles, colors],
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
          <Button
            title="Back"
            onPress={goBack}
            variant="ghost"
            size="md"
            fullWidth={false}
          />
        ) : (
          <Button
            title="Skip"
            onPress={skip}
            variant="ghost"
            size="md"
            fullWidth={false}
          />
        )}

        <Text style={styles.stepIndicator}>
          {currentStep + 1} / {STEPS.length}
        </Text>

        <Button
          title={currentStep === STEPS.length - 1 ? 'Finish' : 'Next'}
          onPress={goNext}
          variant="primary"
          size="md"
          fullWidth={false}
          style={{ borderRadius: 24, paddingHorizontal: 24 }}
        />
      </View>
    </View>
  );
}

const createStyles = colors =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    progressContainer: {
      height: 4,
      backgroundColor: colors.border,
      marginTop: 50,
    },
    progressBar: {
      height: 4,
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    step: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
    stepEmoji: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
    stepTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    stepSubtitle: {
      fontSize: 14,
      color: colors.textTertiary,
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
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    gridItemSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '15',
    },
    gridEmoji: { fontSize: 28, marginBottom: 8 },
    gridLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    gridLabelSelected: { color: colors.primary },
    gridDesc: { fontSize: 12, color: colors.textTertiary },

    // Chip items (species)
    chipItem: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.surface,
      borderRadius: 20,
      marginRight: 8,
      marginBottom: 8,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    chipSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accent + '15',
    },
    chipText: { fontSize: 14, color: colors.text },

    // Region list
    regionList: { gap: 8 },
    regionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    regionSelected: { borderColor: colors.primary },
    regionEmoji: { fontSize: 24, marginRight: 12 },
    regionLabel: { fontSize: 16, color: colors.text, flex: 1 },
    regionLabelSelected: { color: colors.primary, fontWeight: '700' },
    checkmark: { fontSize: 18, color: colors.primary, fontWeight: '700' },

    // Notification toggles
    notifRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    notifEmoji: { fontSize: 24, marginRight: 12 },
    notifText: { flex: 1 },
    notifLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
    notifDesc: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },

    // Feature list (step 5)
    featureList: { marginTop: 8 },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
    },
    featureEmoji: { fontSize: 24, marginRight: 14 },
    featureText: { fontSize: 15, color: colors.text, flex: 1 },
    letsGo: {
      fontSize: 14,
      color: colors.accent,
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
    stepIndicator: { fontSize: 14, color: colors.textTertiary },
  });
