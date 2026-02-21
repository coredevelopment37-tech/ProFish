/**
 * CatchStatsScreen — Catch statistics and analytics (Pro feature)
 * Shows charts, species breakdown, personal records, seasonal trends
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/AppContext';
import catchService from '../../services/catchService';
import { formatWeight, formatLength } from '../../utils/units';
import { formatNumber } from '../../utils/formatting';
import UpgradePrompt from '../../components/UpgradePrompt';

const { width } = Dimensions.get('window');
const BAR_MAX_W = width - 120;

export default function CatchStatsScreen({ navigation }) {
  const { t } = useTranslation();
  const { state } = useApp();
  const units = state.units || 'metric';
  const isPro = state.subscriptionTier !== 'free';

  const [catches, setCatches] = useState([]);
  const [period, setPeriod] = useState('all'); // 'month' | 'year' | 'all'

  useEffect(() => {
    loadCatches();
  }, []);

  async function loadCatches() {
    const all = await catchService.getCatches();
    setCatches(all);
  }

  // Filter by period
  const filtered = useMemo(() => {
    if (period === 'all') return catches;
    const now = new Date();
    return catches.filter(c => {
      const d = new Date(c.createdAt);
      if (period === 'month') {
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }
      if (period === 'year') {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [catches, period]);

  // Computed stats
  const stats = useMemo(() => {
    if (!filtered.length) return null;

    const speciesCount = {};
    let totalWeight = 0;
    let heaviest = null;
    let longest = null;
    const monthlyCount = {};

    filtered.forEach(c => {
      // Species breakdown
      const sp = c.species || 'Unknown';
      speciesCount[sp] = (speciesCount[sp] || 0) + 1;

      // Weight/length records
      if (c.weight) {
        totalWeight += c.weight;
        if (!heaviest || c.weight > heaviest.weight) heaviest = c;
      }
      if (c.length) {
        if (!longest || c.length > longest.length) longest = c;
      }

      // Monthly distribution
      const d = new Date(c.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0',
      )}`;
      monthlyCount[key] = (monthlyCount[key] || 0) + 1;
    });

    // Top species sorted
    const topSpecies = Object.entries(speciesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const maxSpeciesCount = topSpecies.length ? topSpecies[0][1] : 1;

    return {
      totalCatches: filtered.length,
      totalWeight,
      heaviest,
      longest,
      topSpecies,
      maxSpeciesCount,
      uniqueSpecies: Object.keys(speciesCount).length,
      monthlyCount,
      avgWeightPerCatch: filtered.filter(c => c.weight).length
        ? totalWeight / filtered.filter(c => c.weight).length
        : 0,
    };
  }, [filtered]);

  if (!isPro) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {t('stats.title', 'Catch Statistics')}
          </Text>
        </View>
        <UpgradePrompt
          featureName={t('stats.title', 'Catch Statistics')}
          requiredTier="pro"
          onUpgrade={() => navigation.navigate('Profile')}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('stats.title', 'Catch Statistics')}</Text>
      </View>

      {/* Period filter */}
      <View style={styles.periodRow}>
        {['month', 'year', 'all'].map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodChip, period === p && styles.periodChipActive]}
            onPress={() => setPeriod(p)}
          >
            <Text
              style={[
                styles.periodText,
                period === p && styles.periodTextActive,
              ]}
            >
              {t(`stats.${p}`, p.charAt(0).toUpperCase() + p.slice(1))}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!stats ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>
            {t('stats.noCatches', 'No catches to analyze yet')}
          </Text>
        </View>
      ) : (
        <>
          {/* Overview Cards */}
          <View style={styles.overviewRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {formatNumber(stats.totalCatches)}
              </Text>
              <Text style={styles.statLabel}>
                {t('stats.totalCatches', 'Total')}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {formatNumber(stats.uniqueSpecies)}
              </Text>
              <Text style={styles.statLabel}>
                {t('stats.species', 'Species')}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {formatWeight(stats.totalWeight, units)}
              </Text>
              <Text style={styles.statLabel}>
                {t('stats.totalWeight', 'Weight')}
              </Text>
            </View>
          </View>

          {/* Personal Records */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              🏆 {t('stats.personalRecords', 'Personal Records')}
            </Text>
            {stats.heaviest && (
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>
                  {t('stats.heaviest', 'Heaviest Catch')}
                </Text>
                <Text style={styles.recordValue}>
                  {stats.heaviest.species} —{' '}
                  {formatWeight(stats.heaviest.weight, units)}
                </Text>
              </View>
            )}
            {stats.longest && (
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>
                  {t('stats.longest', 'Longest Catch')}
                </Text>
                <Text style={styles.recordValue}>
                  {stats.longest.species} —{' '}
                  {formatLength(stats.longest.length, units)}
                </Text>
              </View>
            )}
            <View style={styles.recordRow}>
              <Text style={styles.recordLabel}>
                {t('stats.avgWeight', 'Average Weight')}
              </Text>
              <Text style={styles.recordValue}>
                {formatWeight(stats.avgWeightPerCatch, units)}
              </Text>
            </View>
          </View>

          {/* Species Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              🐟 {t('stats.topSpecies', 'Top Species')}
            </Text>
            {stats.topSpecies.map(([species, count], idx) => (
              <View key={species} style={styles.barRow}>
                <Text style={styles.barLabel} numberOfLines={1}>
                  {idx + 1}. {species}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: Math.max(
                          4,
                          (count / stats.maxSpeciesCount) * BAR_MAX_W * 0.6,
                        ),
                        backgroundColor:
                          idx === 0 ? '#FF9800' : idx < 3 ? '#0080FF' : '#444',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barCount}>{count}</Text>
              </View>
            ))}
          </View>

          {/* Catch Trends — monthly bar chart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              📈 {t('stats.catchTrends', 'Catch Trends')}
            </Text>
            {(() => {
              const entries = Object.entries(stats.monthlyCount)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .slice(-12);
              if (!entries.length) return null;
              const maxMonth = Math.max(...entries.map(e => e[1]));
              const TREND_BAR_H = 120;
              return (
                <View style={styles.trendChart}>
                  <View style={styles.trendBars}>
                    {entries.map(([key, count]) => {
                      const label = key.split('-')[1]; // month num
                      const MONTHS = [
                        'J',
                        'F',
                        'M',
                        'A',
                        'M',
                        'J',
                        'J',
                        'A',
                        'S',
                        'O',
                        'N',
                        'D',
                      ];
                      const h = maxMonth ? (count / maxMonth) * TREND_BAR_H : 4;
                      return (
                        <View key={key} style={styles.trendBarCol}>
                          <Text style={styles.trendBarValue}>{count}</Text>
                          <View
                            style={[
                              styles.trendBar,
                              {
                                height: Math.max(4, h),
                                backgroundColor: '#0080FF',
                              },
                            ]}
                          />
                          <Text style={styles.trendBarLabel}>
                            {MONTHS[parseInt(label, 10) - 1] || label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })()}
          </View>

          {/* Species Collection Progress */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              🏅 {t('stats.speciesCollection', 'Species Collection')}
            </Text>
            <View style={styles.collectionCard}>
              <View style={styles.collectionHeader}>
                <Text style={styles.collectionCount}>
                  {stats.uniqueSpecies}
                </Text>
                <Text style={styles.collectionOf}>
                  {t('stats.speciesCaught', 'species caught')}
                </Text>
              </View>
              <View style={styles.collectionProgress}>
                <View
                  style={[
                    styles.collectionFill,
                    {
                      width: `${Math.min(
                        100,
                        (stats.uniqueSpecies / 56) * 100,
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.collectionGoal}>
                {t('stats.collectionGoal', '{{count}} of 56 common species', {
                  count: stats.uniqueSpecies,
                })}
              </Text>
              {/* Species badges */}
              <View style={styles.speciesBadges}>
                {Object.keys(
                  filtered.reduce((acc, c) => {
                    if (c.species) acc[c.species] = true;
                    return acc;
                  }, {}),
                )
                  .slice(0, 20)
                  .map(sp => (
                    <View key={sp} style={styles.speciesBadge}>
                      <Text style={styles.speciesBadgeText}>{sp}</Text>
                    </View>
                  ))}
                {stats.uniqueSpecies > 20 && (
                  <View
                    style={[styles.speciesBadge, { backgroundColor: '#333' }]}
                  >
                    <Text style={styles.speciesBadgeText}>
                      +{stats.uniqueSpecies - 20}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  backText: { fontSize: 28, color: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginLeft: 8 },
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
  },
  periodChipActive: {
    backgroundColor: '#0080FF',
  },
  periodText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  periodTextActive: {
    color: '#fff',
  },
  overviewRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 14,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  recordLabel: {
    color: '#888',
    fontSize: 14,
  },
  recordValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  barLabel: {
    width: 80,
    color: '#ccc',
    fontSize: 13,
  },
  barTrack: {
    flex: 1,
    height: 18,
    backgroundColor: '#1a1a2e',
    borderRadius: 9,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  barFill: {
    height: 18,
    borderRadius: 9,
  },
  barCount: {
    width: 30,
    color: '#888',
    fontSize: 13,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#888',
    fontSize: 15,
  },
  // Trend chart
  trendChart: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
  },
  trendBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 160,
  },
  trendBarCol: {
    alignItems: 'center',
    flex: 1,
  },
  trendBarValue: {
    color: '#888',
    fontSize: 10,
    marginBottom: 4,
  },
  trendBar: {
    width: 14,
    borderRadius: 7,
    minHeight: 4,
  },
  trendBarLabel: {
    color: '#666',
    fontSize: 11,
    marginTop: 6,
  },
  // Species collection
  collectionCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
  },
  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  collectionCount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FF9800',
    marginRight: 8,
  },
  collectionOf: {
    fontSize: 16,
    color: '#888',
  },
  collectionProgress: {
    height: 8,
    backgroundColor: '#0a0a1a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  collectionFill: {
    height: 8,
    backgroundColor: '#FF9800',
    borderRadius: 4,
  },
  collectionGoal: {
    color: '#666',
    fontSize: 12,
    marginBottom: 14,
  },
  speciesBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  speciesBadge: {
    backgroundColor: '#0080FF20',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  speciesBadgeText: {
    color: '#0080FF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
