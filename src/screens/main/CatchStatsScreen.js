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

/**
 * Conditions Correlation — correlates catch weight/count with recorded conditions.
 * Uses weather data stored on catch records (pressure, temp, windSpeed, tideState).
 */
function buildConditionsCorrelation(catches) {
  const pressureBuckets = {
    '<1005': [],
    '1005-1013': [],
    '1013-1023': [],
    '>1023': [],
  };
  const tempBuckets = {
    '<10°C': [],
    '10-18°C': [],
    '18-25°C': [],
    '>25°C': [],
  };
  const windBuckets = {
    'Calm (<5)': [],
    'Light (5-12)': [],
    'Mod (12-20)': [],
    'Strong (>20)': [],
  };
  const tideBuckets = { Rising: [], Falling: [], Slack: [], Unknown: [] };

  catches.forEach(c => {
    const w = c.weight || 0;
    // Pressure
    const p = c.pressure || c.conditions?.pressure;
    if (p) {
      if (p < 1005) pressureBuckets['<1005'].push(w);
      else if (p < 1013) pressureBuckets['1005-1013'].push(w);
      else if (p <= 1023) pressureBuckets['1013-1023'].push(w);
      else pressureBuckets['>1023'].push(w);
    }
    // Temperature
    const temp = c.temperature || c.conditions?.temperature;
    if (temp != null) {
      if (temp < 10) tempBuckets['<10°C'].push(w);
      else if (temp < 18) tempBuckets['10-18°C'].push(w);
      else if (temp <= 25) tempBuckets['18-25°C'].push(w);
      else tempBuckets['>25°C'].push(w);
    }
    // Wind
    const wind = c.windSpeed || c.conditions?.windSpeed;
    if (wind != null) {
      if (wind < 5) windBuckets['Calm (<5)'].push(w);
      else if (wind < 12) windBuckets['Light (5-12)'].push(w);
      else if (wind <= 20) windBuckets['Mod (12-20)'].push(w);
      else windBuckets['Strong (>20)'].push(w);
    }
    // Tide
    const tide = c.tideState || c.conditions?.tideState || 'Unknown';
    if (tide === 'rising') tideBuckets.Rising.push(w);
    else if (tide === 'falling') tideBuckets.Falling.push(w);
    else if (tide === 'slack') tideBuckets.Slack.push(w);
    else tideBuckets.Unknown.push(w);
  });

  const summarize = buckets =>
    Object.entries(buckets)
      .map(([label, weights]) => ({
        label,
        count: weights.length,
        avgWeight: weights.length
          ? weights.reduce((s, v) => s + v, 0) / weights.length
          : 0,
      }))
      .filter(b => b.count > 0);

  return {
    pressure: summarize(pressureBuckets),
    temperature: summarize(tempBuckets),
    wind: summarize(windBuckets),
    tide: summarize(tideBuckets),
  };
}

/**
 * Catch Rate Trend — catches per trip over time.
 * Groups catches by date (one "trip" per day) and tracks rolling average.
 */
function buildCatchRateTrend(catches) {
  const tripDays = {};
  catches.forEach(c => {
    const d = new Date(c.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(d.getDate()).padStart(2, '0')}`;
    if (!tripDays[key]) tripDays[key] = { date: key, count: 0, totalWeight: 0 };
    tripDays[key].count++;
    if (c.weight) tripDays[key].totalWeight += c.weight;
  });

  const trips = Object.values(tripDays).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  // Calculate 5-trip rolling average
  const withAvg = trips.map((trip, i) => {
    const window = trips.slice(Math.max(0, i - 4), i + 1);
    const avg = window.reduce((s, t) => s + t.count, 0) / window.length;
    return { ...trip, rollingAvg: Math.round(avg * 10) / 10 };
  });

  return withAvg.slice(-20); // Last 20 trips
}

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

    // Time analysis
    const hourlyCount = new Array(24).fill(0);
    const dayOfWeekCount = new Array(7).fill(0);

    // Bait effectiveness
    const baitStats = {};

    // Location heatmap clusters (~1.1km grid)
    const locationClusters = {};

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

      // Hourly + day-of-week distribution
      hourlyCount[d.getHours()]++;
      dayOfWeekCount[d.getDay()]++;

      // Bait tracking
      if (c.bait) {
        if (!baitStats[c.bait]) {
          baitStats[c.bait] = { count: 0, totalWeight: 0, species: {} };
        }
        baitStats[c.bait].count++;
        if (c.weight) baitStats[c.bait].totalWeight += c.weight;
        if (c.species) {
          baitStats[c.bait].species[c.species] =
            (baitStats[c.bait].species[c.species] || 0) + 1;
        }
      }

      // Location clusters (round to ~1.1km precision)
      const lat = c.latitude || (c.location && c.location.latitude);
      const lng = c.longitude || (c.location && c.location.longitude);
      if (lat && lng) {
        const latKey = Math.round(lat * 100) / 100;
        const lngKey = Math.round(lng * 100) / 100;
        const locKey = `${latKey},${lngKey}`;
        if (!locationClusters[locKey]) {
          locationClusters[locKey] = {
            lat,
            lng,
            count: 0,
            species: {},
            name: c.locationName || c.spot || null,
          };
        }
        locationClusters[locKey].count++;
        if (c.species) {
          locationClusters[locKey].species[c.species] =
            (locationClusters[locKey].species[c.species] || 0) + 1;
        }
      }
    });

    // Top species sorted
    const topSpecies = Object.entries(speciesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const maxSpeciesCount = topSpecies.length ? topSpecies[0][1] : 1;

    // Top locations
    const topLocations = Object.values(locationClusters)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Top baits
    const topBaits = Object.entries(baitStats)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8);

    // Best hour / day
    const bestHour = hourlyCount.indexOf(Math.max(...hourlyCount));
    const bestDay = dayOfWeekCount.indexOf(Math.max(...dayOfWeekCount));

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
      hourlyCount,
      dayOfWeekCount,
      bestHour,
      bestDay,
      topBaits,
      topLocations,
      conditionsCorrelation: buildConditionsCorrelation(filtered),
      catchRateTrend: buildCatchRateTrend(filtered),
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

          {/* Catch Hot Spots — location heatmap */}
          {stats.topLocations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                📍 {t('stats.hotSpots', 'Catch Hot Spots')}
              </Text>
              <View style={styles.heatmapCard}>
                {stats.topLocations.map((loc, idx) => {
                  const topSp = Object.entries(loc.species)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 2)
                    .map(([s]) => s)
                    .join(', ');
                  const maxLoc = stats.topLocations[0].count;
                  const intensity = loc.count / maxLoc;
                  return (
                    <View
                      key={`${loc.lat}-${loc.lng}`}
                      style={styles.hotSpotRow}
                    >
                      <View
                        style={[
                          styles.hotSpotDot,
                          {
                            backgroundColor:
                              intensity > 0.7
                                ? '#FF4444'
                                : intensity > 0.4
                                ? '#FF9800'
                                : '#0080FF',
                            width: 12 + intensity * 16,
                            height: 12 + intensity * 16,
                            borderRadius: (12 + intensity * 16) / 2,
                          },
                        ]}
                      />
                      <View style={styles.hotSpotInfo}>
                        <Text style={styles.hotSpotName} numberOfLines={1}>
                          {loc.name ||
                            `${loc.lat.toFixed(3)}°, ${loc.lng.toFixed(3)}°`}
                        </Text>
                        {topSp ? (
                          <Text style={styles.hotSpotSpecies} numberOfLines={1}>
                            {topSp}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.hotSpotCount}>
                        <Text style={styles.hotSpotCountText}>{loc.count}</Text>
                        <Text style={styles.hotSpotCountLabel}>
                          {t('stats.catches', 'catches')}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Time Analysis */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              ⏰ {t('stats.timeAnalysis', 'Time Analysis')}
            </Text>
            <View style={styles.timeCard}>
              {/* Best hour + day summary */}
              <View style={styles.timeSummaryRow}>
                <View style={styles.timeSummaryItem}>
                  <Text style={styles.timeSummaryValue}>
                    {stats.bestHour > 12
                      ? `${stats.bestHour - 12}PM`
                      : stats.bestHour === 0
                      ? '12AM'
                      : `${stats.bestHour}AM`}
                  </Text>
                  <Text style={styles.timeSummaryLabel}>
                    {t('stats.bestHour', 'Best Hour')}
                  </Text>
                </View>
                <View style={styles.timeSummaryDivider} />
                <View style={styles.timeSummaryItem}>
                  <Text style={styles.timeSummaryValue}>
                    {
                      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
                        stats.bestDay
                      ]
                    }
                  </Text>
                  <Text style={styles.timeSummaryLabel}>
                    {t('stats.bestDay', 'Best Day')}
                  </Text>
                </View>
              </View>

              {/* Hourly heatmap strip */}
              <Text style={styles.timeSubTitle}>
                {t('stats.hourlyActivity', 'Hourly Activity')}
              </Text>
              <View style={styles.hourlyStrip}>
                {stats.hourlyCount.map((count, hour) => {
                  const maxH = Math.max(...stats.hourlyCount, 1);
                  const opacity = count / maxH;
                  return (
                    <View key={hour} style={styles.hourCell}>
                      <View
                        style={[
                          styles.hourBar,
                          {
                            backgroundColor: `rgba(0, 128, 255, ${Math.max(
                              0.1,
                              opacity,
                            )})`,
                          },
                        ]}
                      />
                      {hour % 6 === 0 && (
                        <Text style={styles.hourLabel}>
                          {hour === 0
                            ? '12A'
                            : hour === 6
                            ? '6A'
                            : hour === 12
                            ? '12P'
                            : '6P'}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Day of week bars */}
              <Text style={[styles.timeSubTitle, { marginTop: 16 }]}>
                {t('stats.weeklyPattern', 'Weekly Pattern')}
              </Text>
              <View style={styles.weekBars}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                  (day, idx) => {
                    const maxD = Math.max(...stats.dayOfWeekCount, 1);
                    const pct = stats.dayOfWeekCount[idx] / maxD;
                    return (
                      <View key={day} style={styles.weekBarCol}>
                        <Text style={styles.weekBarValue}>
                          {stats.dayOfWeekCount[idx]}
                        </Text>
                        <View
                          style={[
                            styles.weekBar,
                            {
                              height: Math.max(4, pct * 60),
                              backgroundColor:
                                idx === stats.bestDay ? '#FF9800' : '#0080FF',
                            },
                          ]}
                        />
                        <Text style={styles.weekBarLabel}>{day}</Text>
                      </View>
                    );
                  },
                )}
              </View>
            </View>
          </View>

          {/* Bait Effectiveness */}
          {stats.topBaits.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                🎣 {t('stats.baitEffectiveness', 'Bait Effectiveness')}
              </Text>
              <View style={styles.baitCard}>
                {stats.topBaits.map(([bait, data], idx) => {
                  const maxBait = stats.topBaits[0][1].count;
                  const pct = data.count / maxBait;
                  const topSp = Object.entries(data.species)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 2)
                    .map(([s]) => s)
                    .join(', ');
                  const avgW =
                    data.totalWeight && data.count
                      ? data.totalWeight / data.count
                      : 0;
                  return (
                    <View key={bait} style={styles.baitRow}>
                      <View style={styles.baitRank}>
                        <Text style={styles.baitRankText}>{idx + 1}</Text>
                      </View>
                      <View style={styles.baitInfo}>
                        <Text style={styles.baitName}>{bait}</Text>
                        <View style={styles.baitBarTrack}>
                          <View
                            style={[
                              styles.baitBarFill,
                              {
                                width: `${Math.max(8, pct * 100)}%`,
                                backgroundColor:
                                  idx === 0 ? '#FF9800' : '#0080FF',
                              },
                            ]}
                          />
                        </View>
                        <View style={styles.baitMeta}>
                          <Text style={styles.baitMetaText}>
                            {data.count} {t('stats.catches', 'catches')}
                          </Text>
                          {avgW > 0 && (
                            <Text style={styles.baitMetaText}>
                              {' · '}
                              {t('stats.avgWeight', 'Avg')}{' '}
                              {formatWeight(avgW, units)}
                            </Text>
                          )}
                        </View>
                        {topSp ? (
                          <Text style={styles.baitSpecies} numberOfLines={1}>
                            {t('stats.bestFor', 'Best for')}: {topSp}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Conditions Correlation */}
          {stats.conditionsCorrelation && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                🌡️ {t('stats.conditionsCorrelation', 'Conditions Correlation')}
              </Text>
              <View style={styles.correlationCard}>
                {[
                  {
                    key: 'pressure',
                    icon: '📊',
                    label: t('stats.pressure', 'Pressure (hPa)'),
                  },
                  {
                    key: 'temperature',
                    icon: '🌡️',
                    label: t('stats.temperature', 'Temperature'),
                  },
                  {
                    key: 'wind',
                    icon: '💨',
                    label: t('stats.wind', 'Wind Speed'),
                  },
                  {
                    key: 'tide',
                    icon: '🌊',
                    label: t('stats.tide', 'Tide State'),
                  },
                ].map(({ key, icon, label }) => {
                  const data = stats.conditionsCorrelation[key];
                  if (!data || data.length === 0) return null;
                  const maxCount = Math.max(...data.map(d => d.count), 1);
                  return (
                    <View key={key} style={styles.correlationGroup}>
                      <Text style={styles.correlationGroupLabel}>
                        {icon} {label}
                      </Text>
                      {data.map(bucket => (
                        <View key={bucket.label} style={styles.correlationRow}>
                          <Text
                            style={styles.correlationLabel}
                            numberOfLines={1}
                          >
                            {bucket.label}
                          </Text>
                          <View style={styles.correlationBarTrack}>
                            <View
                              style={[
                                styles.correlationBarFill,
                                {
                                  width: `${Math.max(
                                    5,
                                    (bucket.count / maxCount) * 100,
                                  )}%`,
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.correlationValue}>
                            {bucket.count}
                            {bucket.avgWeight > 0
                              ? ` · ${formatWeight(bucket.avgWeight, units)}`
                              : ''}
                          </Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
                {stats.conditionsCorrelation.pressure.length === 0 &&
                  stats.conditionsCorrelation.temperature.length === 0 && (
                    <Text style={styles.correlationEmpty}>
                      {t(
                        'stats.conditionsHint',
                        'Weather conditions are recorded automatically with each catch. Keep logging to see correlations.',
                      )}
                    </Text>
                  )}
              </View>
            </View>
          )}

          {/* Catch Rate Trend */}
          {stats.catchRateTrend && stats.catchRateTrend.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                📉 {t('stats.catchRateTrend', 'Catch Rate Trend')}
              </Text>
              <View style={styles.trendCard}>
                <Text style={styles.trendSubtitle}>
                  {t('stats.catchesPerTrip', 'Catches per trip (day)')}
                </Text>
                <View style={styles.rateTrendChart}>
                  {(() => {
                    const data = stats.catchRateTrend;
                    const maxC = Math.max(...data.map(d => d.count), 1);
                    const CHART_H = 100;
                    return (
                      <View style={styles.rateTrendBars}>
                        {data.map((trip, i) => {
                          const h = Math.max(4, (trip.count / maxC) * CHART_H);
                          const avgH = Math.max(
                            2,
                            (trip.rollingAvg / maxC) * CHART_H,
                          );
                          return (
                            <View key={trip.date} style={styles.rateTrendCol}>
                              {/* Rolling average indicator */}
                              <View
                                style={[
                                  styles.rateTrendAvgDot,
                                  { bottom: avgH + 4 },
                                ]}
                              />
                              <View
                                style={{ flex: 1, justifyContent: 'flex-end' }}
                              >
                                <View
                                  style={[styles.rateTrendBar, { height: h }]}
                                />
                              </View>
                              {i % Math.max(1, Math.floor(data.length / 5)) ===
                                0 && (
                                <Text style={styles.rateTrendLabel}>
                                  {trip.date.slice(5)}
                                </Text>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    );
                  })()}
                </View>
                <View style={styles.rateTrendLegend}>
                  <View style={styles.rateTrendLegendItem}>
                    <View
                      style={[
                        styles.rateTrendLegendBox,
                        { backgroundColor: '#0080FF' },
                      ]}
                    />
                    <Text style={styles.rateTrendLegendText}>
                      {t('stats.catchesPerDay', 'Catches/day')}
                    </Text>
                  </View>
                  <View style={styles.rateTrendLegendItem}>
                    <View
                      style={[
                        styles.rateTrendLegendBox,
                        { backgroundColor: '#FF9800', borderRadius: 4 },
                      ]}
                    />
                    <Text style={styles.rateTrendLegendText}>
                      {t('stats.rollingAvg', '5-trip avg')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
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
  // Hot spots heatmap
  heatmapCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 12,
  },
  hotSpotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0a0a1a',
  },
  hotSpotDot: {
    marginRight: 12,
  },
  hotSpotInfo: {
    flex: 1,
  },
  hotSpotName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  hotSpotSpecies: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  hotSpotCount: {
    alignItems: 'center',
    marginLeft: 8,
  },
  hotSpotCountText: {
    color: '#FF9800',
    fontSize: 18,
    fontWeight: '800',
  },
  hotSpotCountLabel: {
    color: '#666',
    fontSize: 10,
  },
  // Time analysis
  timeCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
  },
  timeSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  timeSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeSummaryValue: {
    color: '#FF9800',
    fontSize: 24,
    fontWeight: '800',
  },
  timeSummaryLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  timeSummaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#333',
  },
  timeSubTitle: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  hourlyStrip: {
    flexDirection: 'row',
    height: 32,
    gap: 1,
  },
  hourCell: {
    flex: 1,
    alignItems: 'center',
  },
  hourBar: {
    flex: 1,
    width: '100%',
    borderRadius: 3,
  },
  hourLabel: {
    color: '#666',
    fontSize: 9,
    marginTop: 2,
  },
  weekBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 100,
  },
  weekBarCol: {
    alignItems: 'center',
    flex: 1,
  },
  weekBarValue: {
    color: '#888',
    fontSize: 10,
    marginBottom: 4,
  },
  weekBar: {
    width: 20,
    borderRadius: 10,
    minHeight: 4,
  },
  weekBarLabel: {
    color: '#666',
    fontSize: 10,
    marginTop: 6,
  },
  // Bait effectiveness
  baitCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 12,
  },
  baitRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0a0a1a',
  },
  baitRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0a0a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  baitRankText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '700',
  },
  baitInfo: {
    flex: 1,
  },
  baitName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  baitBarTrack: {
    height: 6,
    backgroundColor: '#0a0a1a',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  baitBarFill: {
    height: 6,
    borderRadius: 3,
  },
  baitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  baitMetaText: {
    color: '#888',
    fontSize: 12,
  },
  baitSpecies: {
    color: '#0080FF',
    fontSize: 11,
    marginTop: 2,
  },

  // Conditions Correlation
  correlationCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 14,
  },
  correlationGroup: {
    marginBottom: 16,
  },
  correlationGroupLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  correlationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  correlationLabel: {
    width: 80,
    color: '#888',
    fontSize: 12,
  },
  correlationBarTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#0a0a1a',
    borderRadius: 6,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  correlationBarFill: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  correlationValue: {
    width: 90,
    color: '#888',
    fontSize: 11,
    textAlign: 'right',
  },
  correlationEmpty: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
    padding: 20,
    lineHeight: 20,
  },

  // Catch Rate Trend
  trendCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
  },
  trendSubtitle: {
    color: '#888',
    fontSize: 12,
    marginBottom: 12,
  },
  rateTrendChart: {
    height: 130,
  },
  rateTrendBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 2,
  },
  rateTrendCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  rateTrendBar: {
    width: '80%',
    borderRadius: 4,
    backgroundColor: '#0080FF',
    minHeight: 4,
  },
  rateTrendAvgDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF9800',
    zIndex: 1,
  },
  rateTrendLabel: {
    color: '#666',
    fontSize: 8,
    marginTop: 4,
  },
  rateTrendLegend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    justifyContent: 'center',
  },
  rateTrendLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rateTrendLegendBox: {
    width: 12,
    height: 8,
    borderRadius: 2,
  },
  rateTrendLegendText: {
    color: '#888',
    fontSize: 11,
  },
});
