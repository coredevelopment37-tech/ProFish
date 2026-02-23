/**
 * NightFishingScreen — ProFish
 * World's first dedicated night fishing dashboard.
 * Features: Night Score, active species, moon phase, session tracker,
 *           quick links to gear, safety, and gigging modes.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  NIGHT_SPECIES,
  calculateNightScore,
  startNightSession,
  getNightSessions,
  LIGHT_GUIDE,
  NIGHT_LESSONS,
} from '../../services/nightFishingService';
import useTheme from '../../hooks/useTheme';
import { AppIcon } from '../../constants/icons';
import Button from '../../components/Common/Button';
import { ScreenHeader } from '../../components/Common';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Moon phase visual ──
const MOON_EMOJIS = {
  new: '🌑',
  waxing_crescent: '🌒',
  first_quarter: '🌓',
  waxing_gibbous: '🌔',
  full: '🌕',
  waning_gibbous: '🌖',
  last_quarter: '🌗',
  waning_crescent: '🌘',
};

// ── Rating colors ──
const RATING_COLORS = {
  LEGENDARY: '#FFD700',
  EXCELLENT: '#00FF88',
  GOOD: '#00BBFF',
  FAIR: '#FF9900',
  POOR: '#FF4444',
};

export default function NightFishingScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const [nightData, setNightData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Simulate current conditions (in production: pull from weatherService + solunarService)
    const now = new Date();
    const hour = now.getHours();
    const isNight = hour >= 19 || hour < 6;

    const mockConditions = {
      moonIllumination: 15,
      moonPhase: 'waxing_crescent',
      cloudCoverPercent: 40,
      windSpeedKmh: 8,
      waterTempF: 68,
      pressureTrendMb: -1.5,
      isSolunarMajor: hour >= 22 && hour <= 24,
      isSolunarMinor: hour >= 20 && hour < 22,
      hoursAfterSunset: isNight ? (hour >= 19 ? hour - 19 : hour + 5) : 0,
    };

    const result = calculateNightScore(mockConditions);
    setNightData({ ...result, conditions: mockConditions, isNight });

    loadSessions();
    startAnimations();
  }, []);

  const loadSessions = async () => {
    const data = await getNightSessions();
    setSessions(data.slice(-5).reverse());
  };

  const startAnimations = () => {
    // Pulsing moon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Green glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  };

  const handleStartSession = async () => {
    const session = await startNightSession('Current Location', 'Any');
    setActiveSession(session);
    await loadSessions();
  };

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 255, 0, 0.05)', 'rgba(0, 255, 0, 0.15)'],
  });

  const topSpecies = NIGHT_SPECIES.sort(
    (a, b) => b.nightRating - a.nightRating,
  ).slice(0, 8);

  return (
    <Animated.ScrollView
      style={[styles.container, { backgroundColor: glowColor }]}
    >
      {/* ── Header ── */}
      <ScreenHeader
        variant="large"
        title="Night Fishing"
        subtitle="World's First Night Mode"
        onBack={() => navigation.goBack()}
      />

      {/* ── Night Score Card ── */}
      {nightData && (
        <View style={styles.scoreCard}>
          <Animated.View
            style={[
              styles.moonContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Text style={styles.moonEmoji}>
              {MOON_EMOJIS[nightData.conditions.moonPhase] || '🌙'}
            </Text>
          </Animated.View>

          <View style={styles.scoreContainer}>
            <Text
              style={[
                styles.scoreNumber,
                { color: RATING_COLORS[nightData.rating] },
              ]}
            >
              {nightData.score}
            </Text>
            <Text style={styles.scoreLabel}>NIGHT SCORE</Text>
            <View
              style={[
                styles.ratingBadge,
                {
                  backgroundColor: RATING_COLORS[nightData.rating] + '22',
                  borderColor: RATING_COLORS[nightData.rating],
                },
              ]}
            >
              <Text
                style={[
                  styles.ratingText,
                  { color: RATING_COLORS[nightData.rating] },
                ]}
              >
                {nightData.rating}
              </Text>
            </View>
          </View>

          {/* Score Factors */}
          <View style={styles.factorsContainer}>
            {nightData.factors.map((f, i) => (
              <View key={i} style={styles.factorRow}>
                <Text
                  style={[
                    styles.factorImpact,
                    { color: f.impact >= 0 ? '#00FF88' : '#FF4444' },
                  ]}
                >
                  {f.impact >= 0 ? '+' : ''}
                  {f.impact}
                </Text>
                <View style={styles.factorInfo}>
                  <Text style={styles.factorName}>{f.name}</Text>
                  <Text style={styles.factorDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Best Species Tonight */}
          {nightData.bestSpecies.length > 0 && (
            <View style={styles.bestSpeciesBox}>
              <Text style={styles.bestSpeciesTitle}><AppIcon name="target" size={14} color="#00FF88" /> Best Tonight</Text>
              <Text style={styles.bestSpeciesList}>
                {nightData.bestSpecies.join(' • ')}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Quick Actions ── */}
      <View style={styles.quickActions}>
        <Button
          title="Start Night Session"
          onPress={handleStartSession}
          variant="primary"
          size="lg"
          icon="fish"
          style={{ backgroundColor: '#00FF88' }}
          textStyle={{ color: '#000' }}
        />

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionGear]}
          onPress={() => navigation.navigate('NightGear')}
        >
          <Text style={styles.actionEmoji}><AppIcon name="settings" size={28} color="#FFD700" /></Text>
          <Text style={styles.actionLabel}>Night Gear Guide</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionSafety]}
          onPress={() => navigation.navigate('NightSafety')}
        >
          <Text style={styles.actionEmoji}>🆘</Text>
          <Text style={styles.actionLabel}>Safety Center</Text>
        </TouchableOpacity>
      </View>

      {/* ── Top Night Species ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}><AppIcon name="fish" size={18} color={colors.text} /> Top Night Species</Text>
        <Text style={styles.sectionSubtitle}>
          18 species with night-specific data
        </Text>

        <FlatList
          data={topSpecies}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.speciesList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.speciesCard,
                selectedSpecies?.id === item.id && styles.speciesCardActive,
              ]}
              onPress={() =>
                setSelectedSpecies(
                  selectedSpecies?.id === item.id ? null : item,
                )
              }
            >
              <Text style={styles.speciesEmoji}>{item.emoji}</Text>
              <Text style={styles.speciesName}>{item.name}</Text>
              <View style={styles.ratingBar}>
                <View
                  style={[styles.ratingFill, { width: `${item.nightRating}%` }]}
                />
              </View>
              <Text style={styles.speciesRating}>{item.nightRating}/100</Text>
              <Text style={styles.speciesPeak}>{item.peakHours}</Text>
            </TouchableOpacity>
          )}
        />

        {/* Expanded Species Detail */}
        {selectedSpecies && (
          <View style={styles.speciesDetail}>
            <Text style={styles.detailTitle}>
              {selectedSpecies.emoji} {selectedSpecies.name}
            </Text>
            <Text style={styles.detailNotes}>{selectedSpecies.notes}</Text>

            <Text style={styles.detailLabel}>Peak Hours</Text>
            <Text style={styles.detailValue}>{selectedSpecies.peakHours}</Text>

            <Text style={styles.detailLabel}>Best Moon Phase</Text>
            <Text style={styles.detailValue}>
              {MOON_EMOJIS[selectedSpecies.bestMoonPhase] || '🌙'}{' '}
              {selectedSpecies.bestMoonPhase.replace('_', ' ')}
            </Text>

            <Text style={styles.detailLabel}>Light Preference</Text>
            <Text style={styles.detailValue}>
              {selectedSpecies.lightPreference.replace(/_/g, ' ')}
            </Text>

            <Text style={styles.detailLabel}>Techniques</Text>
            {selectedSpecies.techniques.map((tech, i) => (
              <Text key={i} style={styles.detailBullet}>
                • {tech}
              </Text>
            ))}

            <Text style={styles.detailLabel}>Best Bait</Text>
            <Text style={styles.detailValue}>
              {selectedSpecies.bestBait.join(', ')}
            </Text>

            <Text style={styles.detailLabel}>Water Temp Range</Text>
            <Text style={styles.detailValue}>
              {selectedSpecies.waterTemp.min}°F –{' '}
              {selectedSpecies.waterTemp.max}°F
            </Text>
          </View>
        )}
      </View>

      {/* ── Light Attraction Guide ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}><AppIcon name="lightbulb" size={18} color={colors.success || '#00FF88'} /> Light Attraction Science</Text>
        <Text style={styles.scienceText}>{LIGHT_GUIDE.scienceExplainer}</Text>

        <FlatList
          data={LIGHT_GUIDE.types}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.lightList}
          renderItem={({ item }) => (
            <View style={[styles.lightCard, { borderColor: item.color }]}>
              <View
                style={[styles.lightDot, { backgroundColor: item.color }]}
              />
              <Text style={styles.lightName}>{item.name}</Text>
              <Text style={styles.lightChain}>{item.chainReaction}</Text>
              <Text style={styles.lightSetup}><AppIcon name="timer" size={11} color={colors.textTertiary} /> {item.setupTime}</Text>
              <Text style={styles.lightPlacement}><AppIcon name="mapPin" size={11} color={colors.textTertiary} /> {item.placement}</Text>
            </View>
          )}
        />
      </View>

      {/* ── Night Lessons ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <AppIcon name="bookOpen" size={18} color={colors.text} /> Night School ({NIGHT_LESSONS.length} Lessons)
        </Text>
        {NIGHT_LESSONS.map(lesson => (
          <TouchableOpacity
            key={lesson.id}
            style={styles.lessonRow}
            onPress={() =>
              navigation.navigate('FishingSchool', { lessonId: lesson.id })
            }
          >
            <Text style={styles.lessonEmoji}>{lesson.emoji}</Text>
            <View style={styles.lessonInfo}>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.lessonMeta}>
                {lesson.difficulty} • {lesson.duration}
              </Text>
            </View>
            <Text style={styles.lessonArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Gigging Quick Link ── */}
      <TouchableOpacity
        style={styles.giggingBanner}
        onPress={() => navigation.navigate('NightGear', { tab: 'gigging' })}
      >
        <Text style={styles.giggingEmoji}><AppIcon name="crosshair" size={36} color="#FFD700" /></Text>
        <View style={styles.giggingInfo}>
          <Text style={styles.giggingTitle}>Flounder Gigging Mode</Text>
          <Text style={styles.giggingDesc}>
            Complete wading guide, tide timing, spotting technique & gear
          </Text>
        </View>
        <Text style={styles.giggingArrow}>→</Text>
      </TouchableOpacity>

      {/* ── Recent Night Sessions ── */}
      {sessions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}><AppIcon name="clock" size={18} color={colors.text} /> Recent Night Sessions</Text>
          {sessions.map(s => (
            <View key={s.id} style={styles.sessionRow}>
              <Text style={styles.sessionDate}>
                {new Date(s.startTime).toLocaleDateString()}
              </Text>
              <Text style={styles.sessionLocation}>{s.locationName}</Text>
              <Text style={styles.sessionCatches}>
                {s.catches?.length || 0} catches
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Connectivity Banner ── */}
      <View style={styles.connectBanner}>
        <Text style={styles.connectTitle}><AppIcon name="satellite" size={15} color={colors.text} /> Smart Gear Integration</Text>
        <View style={styles.connectRow}>
          <View style={styles.connectChip}>
            <Text style={styles.connectIcon}><AppIcon name="bluetooth" size={20} color="#0082FC" /></Text>
            <Text style={styles.connectLabel}>Bluetooth</Text>
            <Text style={styles.connectCount}>5 devices</Text>
          </View>
          <View style={styles.connectChip}>
            <Text style={styles.connectIcon}><AppIcon name="wifi" size={20} color="#00CC66" /></Text>
            <Text style={styles.connectLabel}>WiFi</Text>
            <Text style={styles.connectCount}>1 device</Text>
          </View>
          <View style={styles.connectChip}>
            <Text style={styles.connectIcon}><AppIcon name="satellite" size={20} color="#FF6600" /></Text>
            <Text style={styles.connectLabel}>Satellite</Text>
            <Text style={styles.connectCount}>1 device</Text>
          </View>
        </View>
        <Text style={styles.connectDesc}>
          Pair Bluetooth sonar, bite alarms, and cameras directly with ProFish
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </Animated.ScrollView>
  );
}

// ─────────────────────────────────────────────────
// STYLES — Night mode dark theme with green accents
// ─────────────────────────────────────────────────

const createStyles = colors =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050510' },

    // Score Card
    scoreCard: {
      margin: 16,
      backgroundColor: '#0a0f20',
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: '#1a2040',
    },
    moonContainer: { alignSelf: 'center', marginBottom: 12 },
    moonEmoji: { fontSize: 64 },
    scoreContainer: { alignItems: 'center', marginBottom: 16 },
    scoreNumber: { fontSize: 72, fontWeight: '900', lineHeight: 80 },
    scoreLabel: {
      fontSize: 12,
      color: colors.textTertiary,
      fontWeight: '700',
      letterSpacing: 2,
      marginTop: 4,
    },
    ratingBadge: {
      marginTop: 8,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
    },
    ratingText: { fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
    factorsContainer: { marginTop: 8 },
    factorRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    factorImpact: {
      width: 40,
      fontSize: 14,
      fontWeight: '700',
      textAlign: 'right',
      marginRight: 12,
    },
    factorInfo: { flex: 1 },
    factorName: { fontSize: 14, fontWeight: '600', color: '#ddd' },
    factorDesc: { fontSize: 12, color: '#777', marginTop: 1 },
    bestSpeciesBox: {
      marginTop: 16,
      backgroundColor: '#0d1a0d',
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: '#1a3a1a',
    },
    bestSpeciesTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#00FF88',
      marginBottom: 6,
    },
    bestSpeciesList: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
    },

    // Quick Actions
    quickActions: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 10,
      marginBottom: 20,
    },
    actionBtn: {
      flex: 1,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
    },

    actionGear: {
      backgroundColor: '#1a1a0a',
      borderWidth: 1,
      borderColor: '#FFD700',
    },
    actionSafety: {
      backgroundColor: '#2a0a0a',
      borderWidth: 1,
      borderColor: '#FF4444',
    },
    actionEmoji: { fontSize: 28, marginBottom: 6 },
    actionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      textAlign: 'center',
    },

    // Section
    section: { paddingHorizontal: 16, marginBottom: 24 },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    sectionSubtitle: {
      fontSize: 12,
      color: colors.textTertiary,
      marginBottom: 12,
    },

    // Species Cards
    speciesList: { paddingVertical: 8, gap: 12 },
    speciesCard: {
      width: 140,
      backgroundColor: '#0a0f20',
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: '#1a2040',
    },
    speciesCardActive: { borderColor: '#00FF88', backgroundColor: '#0a1a10' },
    speciesEmoji: { fontSize: 28, marginBottom: 6 },
    speciesName: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    ratingBar: {
      height: 4,
      backgroundColor: colors.surface,
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: 4,
    },
    ratingFill: { height: '100%', backgroundColor: '#00FF88', borderRadius: 2 },
    speciesRating: { fontSize: 11, color: '#00FF88', fontWeight: '600' },
    speciesPeak: { fontSize: 10, color: '#777', marginTop: 4 },

    // Species Detail
    speciesDetail: {
      backgroundColor: '#0a1a10',
      borderRadius: 14,
      padding: 18,
      marginTop: 12,
      borderWidth: 1,
      borderColor: '#1a3a1a',
    },
    detailTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    detailNotes: {
      fontSize: 13,
      color: '#aaa',
      lineHeight: 20,
      marginBottom: 14,
    },
    detailLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: '#00FF88',
      textTransform: 'uppercase',
      marginTop: 10,
      letterSpacing: 1,
    },
    detailValue: { fontSize: 14, color: '#ddd', marginTop: 2 },
    detailBullet: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 3,
      marginLeft: 8,
    },

    // Light Guide
    scienceText: {
      fontSize: 13,
      color: '#999',
      lineHeight: 20,
      marginBottom: 14,
      fontStyle: 'italic',
    },
    lightList: { gap: 12, paddingVertical: 4 },
    lightCard: {
      width: 220,
      backgroundColor: '#0a0f20',
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
    },
    lightDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 8 },
    lightName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
    },
    lightChain: {
      fontSize: 12,
      color: '#aaa',
      lineHeight: 18,
      marginBottom: 8,
    },
    lightSetup: { fontSize: 11, color: colors.textTertiary, marginBottom: 2 },
    lightPlacement: { fontSize: 11, color: colors.textTertiary },

    // Lessons
    lessonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.surface,
    },
    lessonEmoji: { fontSize: 24, marginRight: 14 },
    lessonInfo: { flex: 1 },
    lessonTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
    lessonMeta: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
    lessonArrow: { fontSize: 18, color: '#444' },

    // Gigging Banner
    giggingBanner: {
      marginHorizontal: 16,
      backgroundColor: '#1a0f05',
      borderRadius: 16,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#4a3010',
      marginBottom: 20,
    },
    giggingEmoji: { fontSize: 36, marginRight: 14 },
    giggingInfo: { flex: 1 },
    giggingTitle: { fontSize: 15, fontWeight: '700', color: '#FFD700' },
    giggingDesc: { fontSize: 12, color: '#999', marginTop: 3 },
    giggingArrow: { fontSize: 22, color: '#FFD700' },

    // Sessions
    sessionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.surface,
    },
    sessionDate: { fontSize: 13, color: colors.textTertiary },
    sessionLocation: {
      fontSize: 13,
      color: colors.textSecondary,
      flex: 1,
      marginLeft: 12,
    },
    sessionCatches: { fontSize: 13, color: '#00FF88', fontWeight: '600' },

    // Connectivity Banner
    connectBanner: {
      marginHorizontal: 16,
      backgroundColor: '#0a0a2a',
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      borderColor: '#1a1a4a',
      marginBottom: 20,
    },
    connectTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    connectRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    connectChip: {
      flex: 1,
      backgroundColor: '#0a1030',
      borderRadius: 12,
      padding: 10,
      alignItems: 'center',
    },
    connectIcon: { fontSize: 20, marginBottom: 4 },
    connectLabel: { fontSize: 11, fontWeight: '600', color: '#aaa' },
    connectCount: { fontSize: 10, color: colors.textTertiary, marginTop: 2 },
    connectDesc: { fontSize: 12, color: '#777', textAlign: 'center' },
  });
