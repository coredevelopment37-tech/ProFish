/**
 * SpeciesDetailScreen — Fish species information
 * Shows taxonomy, habitat, techniques, records, seasonality
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import speciesDatabase from '../../services/speciesDatabase';
import { useApp } from '../../store/AppContext';
import { formatWeight, formatLength } from '../../utils/units';

export default function SpeciesDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { state } = useApp();
  const units = state.units || 'metric';
  const { speciesId } = route.params || {};
  const species = speciesDatabase.getById(speciesId);

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
          <FactChip
            icon="🌊"
            label={species.habitat}
          />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  backBtn: { width: 40 },
  backText: { fontSize: 24, color: '#0080FF' },
  headerCenter: { flex: 1, alignItems: 'center' },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'capitalize',
  },
  scientific: { fontSize: 14, color: '#888', fontStyle: 'italic', marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  illustrationBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  illustrationEmoji: { fontSize: 64, marginBottom: 8 },
  familyBadge: {
    color: '#0080FF',
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
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  factIcon: { fontSize: 14 },
  factLabel: { color: '#ccc', fontSize: 13, textTransform: 'capitalize' },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  rowLabel: { fontSize: 15, color: '#888' },
  rowValue: { fontSize: 15, color: '#fff', textTransform: 'capitalize' },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  techChip: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  techChipText: { color: '#ccc', fontSize: 14 },
  baitChip: {
    backgroundColor: 'rgba(255,152,0,0.1)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.3)',
  },
  baitChipText: { color: '#FF9800', fontSize: 14 },
  seasonText: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  error: { color: '#F44336', fontSize: 18, fontWeight: '600', marginBottom: 16 },
  backButton: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: { color: '#0080FF', fontSize: 16, fontWeight: '600' },
});
    color: '#F44336',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});
