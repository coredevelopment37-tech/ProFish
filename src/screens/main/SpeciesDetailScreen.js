/**
 * SpeciesDetailScreen — Fish species information
 * Shows taxonomy, habitat, techniques, records, seasonality
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Geolocation from '@react-native-community/geolocation';
import useTheme from '../../hooks/useTheme';
import speciesDatabase from '../../services/speciesDatabase';
import catchService from '../../services/catchService';
import {
  calculateFishCast,
  adjustScoreForSpecies,
} from '../../services/fishCastService';
import { useApp } from '../../store/AppContext';
import { formatWeight, formatLength } from '../../utils/units';

export default function SpeciesDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const { state } = useApp();
  const units = state.units || 'metric';
  const { speciesId } = route.params || {};
  const species = speciesDatabase.getById(speciesId);
  const [myCatches, setMyCatches] = useState([]);
  const [fishCast, setFishCast] = useState(null);
  const [fishCastLoading, setFishCastLoading] = useState(false);

  useEffect(() => {
    if (speciesId) {
      catchService
        .getCatches({ species: speciesId.replace(/_/g, ' '), limit: 10 })
        .then(setMyCatches)
        .catch(() => {});
    }
  }, [speciesId]);

  // Calculate species-adjusted FishCast using GPS
  useEffect(() => {
    if (!species) return;
    setFishCastLoading(true);
    Geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords;
          const base = await calculateFishCast(latitude, longitude);
          const speciesName =
            species.displayName || speciesId.replace(/_/g, ' ');
          const adjusted = adjustScoreForSpecies(base, speciesName);
          setFishCast(adjusted);
        } catch {
          setFishCast(null);
        } finally {
          setFishCastLoading(false);
        }
      },
      () => setFishCastLoading(false),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, [speciesId]);

  if (!species) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🐟</Text>
          <Text style={styles.error}>
            {t('species.notFound', 'Species not found')}
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>
              {t('common.goBack', 'Go Back')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const displayName = species.id.replace(/_/g, ' ');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.scientific}>{species.scientific}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Illustration area */}
        <View style={styles.illustrationBox}>
          <Text style={styles.illustrationEmoji}>🐟</Text>
          <Text style={styles.familyBadge}>{species.family}</Text>
        </View>

        {/* Quick facts */}
        <View style={styles.factsRow}>
          <FactChip icon="🌊" label={species.habitat} />
          <FactChip
            icon="📍"
            label={`${species.regions?.length || 0} regions`}
          />
          {species.iucnStatus && (
            <FactChip icon="🟢" label={species.iucnStatus} />
          )}
        </View>

        {/* Taxonomy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('species.taxonomy', 'Taxonomy')}
          </Text>
          <DetailRow
            label={t('species.family', 'Family')}
            value={species.family}
          />
          <DetailRow
            label={t('species.habitat', 'Habitat')}
            value={species.habitat}
          />
          <DetailRow
            label={t('species.regions', 'Regions')}
            value={species.regions?.join(', ') || '—'}
          />
          {species.maxWeight && (
            <DetailRow
              label={t('species.maxWeight', 'Max Weight')}
              value={formatWeight(species.maxWeight, units)}
            />
          )}
          {species.maxLength && (
            <DetailRow
              label={t('species.maxLength', 'Max Length')}
              value={formatLength(species.maxLength, units)}
            />
          )}
        </View>

        {/* Techniques */}
        {species.techniques && species.techniques.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('species.techniques', 'Recommended Techniques')}
            </Text>
            <View style={styles.chipRow}>
              {species.techniques.map((tech, i) => (
                <View key={i} style={styles.techChip}>
                  <Text style={styles.techChipText}>🎣 {tech}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Best Bait */}
        {species.bestBait && species.bestBait.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('species.bestBait', 'Best Bait')}
            </Text>
            <View style={styles.chipRow}>
              {species.bestBait.map((b, i) => (
                <View key={i} style={styles.baitChip}>
                  <Text style={styles.baitChipText}>🪝 {b}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Season */}
        {species.bestSeason && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('species.bestSeason', 'Best Season')}
            </Text>
            <Text style={styles.seasonText}>{species.bestSeason}</Text>
          </View>
        )}

        {/* My Catches of this Species */}
        {myCatches.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('species.myCatches', 'My Catches')} ({myCatches.length})
            </Text>
            {myCatches.map(c => (
              <TouchableOpacity
                key={c.id}
                style={styles.catchRow}
                onPress={() =>
                  navigation.navigate('CatchDetail', { catchId: c.id })
                }
              >
                <Text style={styles.catchSpecies}>🐟</Text>
                <View style={styles.catchInfo}>
                  <Text style={styles.catchWeight}>
                    {c.weight
                      ? formatWeight(c.weight, units)
                      : c.length
                      ? formatLength(c.length, units)
                      : '—'}
                  </Text>
                  <Text style={styles.catchDate}>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.catchArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* FishCast for This Species */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🎯 {t('species.fishCast', 'FishCast for This Species')}
          </Text>
          {fishCastLoading ? (
            <View style={styles.fishCastLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.fishCastLoadText}>
                {t('common.calculating', 'Calculating...')}
              </Text>
            </View>
          ) : fishCast ? (
            <TouchableOpacity
              style={styles.fishCastCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('FishCast')}
            >
              <View style={styles.fishCastScoreRow}>
                <View
                  style={[
                    styles.fishCastCircle,
                    {
                      borderColor:
                        fishCast.score >= 70
                          ? colors.success
                          : fishCast.score >= 40
                          ? colors.accent
                          : colors.error,
                    },
                  ]}
                >
                  <Text style={styles.fishCastScore}>{fishCast.score}</Text>
                  <Text style={styles.fishCastLabel}>{fishCast.label}</Text>
                </View>
                <View style={styles.fishCastMeta}>
                  {fishCast.speciesAdjusted &&
                    fishCast.originalScore !== fishCast.score && (
                      <Text style={styles.fishCastAdjusted}>
                        {fishCast.score > fishCast.originalScore ? '↑' : '↓'}{' '}
                        {t('species.adjustedFrom', 'Adjusted from')}{' '}
                        {fishCast.originalScore}
                      </Text>
                    )}
                  {fishCast.speciesInsights?.map((insight, i) => (
                    <Text key={i} style={styles.fishCastInsight}>
                      ✦ {insight}
                    </Text>
                  ))}
                  {fishCast.weather && (
                    <Text style={styles.fishCastCondition}>
                      🌡️ {Math.round(fishCast.weather.temp)}°C {'  '}
                      💨 {Math.round(fishCast.weather.wind)} km/h
                    </Text>
                  )}
                  {fishCast.solunar && (
                    <Text style={styles.fishCastCondition}>
                      🌙 {fishCast.solunar.moonPhase}
                    </Text>
                  )}
                </View>
              </View>
              <Text style={styles.fishCastHint}>
                {t('species.viewFullFishCast', 'Tap for full FishCast →')}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.fishCastUnavailable}>
              {t(
                'species.fishCastUnavailable',
                'Enable location for species-specific FishCast',
              )}
            </Text>
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function FactChip({ icon, label }) {
  return (
    <View style={styles.factChip}>
      <Text style={styles.factIcon}>{icon}</Text>
      <Text style={styles.factLabel}>{label}</Text>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  backBtn: { width: 40 },
  backText: { fontSize: 24, color: colors.primary },
  headerCenter: { flex: 1, alignItems: 'center' },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    textTransform: 'capitalize',
  },
  scientific: {
    fontSize: 14,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  illustrationBox: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  illustrationEmoji: { fontSize: 64, marginBottom: 8 },
  familyBadge: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(0,128,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  factsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  factChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  factIcon: { fontSize: 14 },
  factLabel: { color: colors.textSecondary, fontSize: 13, textTransform: 'capitalize' },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  rowLabel: { fontSize: 15, color: colors.textTertiary },
  rowValue: { fontSize: 15, color: colors.text, textTransform: 'capitalize' },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  techChip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  techChipText: { color: colors.textSecondary, fontSize: 14 },
  baitChip: {
    backgroundColor: 'rgba(255,152,0,0.1)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.3)',
  },
  baitChipText: { color: colors.accent, fontSize: 14 },
  seasonText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  catchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  catchSpecies: {
    fontSize: 20,
    marginRight: 12,
  },
  catchInfo: {
    flex: 1,
  },
  catchWeight: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  catchDate: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  catchArrow: {
    fontSize: 16,
    color: colors.textDisabled,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  error: {
    color: colors.error,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: { color: colors.primary, fontSize: 16, fontWeight: '600' },

  // FishCast for species
  fishCastLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
  },
  fishCastLoadText: { color: colors.textTertiary, fontSize: 14 },
  fishCastCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fishCastScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  fishCastCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  fishCastScore: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  fishCastLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  fishCastMeta: { flex: 1, gap: 4 },
  fishCastAdjusted: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  fishCastInsight: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  fishCastCondition: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  fishCastHint: {
    fontSize: 12,
    color: colors.primary,
    textAlign: 'right',
    marginTop: 10,
  },
  fishCastUnavailable: {
    color: colors.textTertiary,
    fontSize: 14,
    paddingVertical: 12,
  },
});
