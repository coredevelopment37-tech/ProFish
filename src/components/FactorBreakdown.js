/**
 * FactorBreakdown — Shows individual FishCast scoring factors
 * Visual bar chart for each factor (pressure, wind, moon, etc.)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import useTheme from '../hooks/useTheme';
import { AppIcon } from '../constants/icons';

const FACTOR_CONFIG = {
  pressure: { icon: 'thermometer', weight: 20 },
  moonPhase: { icon: 'moon', weight: 15 },
  solunarPeriod: { icon: 'target', weight: 15 },
  wind: { icon: 'wind', weight: 12 },
  timeOfDay: { icon: 'clock', weight: 12 },
  tideState: { icon: 'waves', weight: 10 },
  cloudCover: { icon: 'cloud', weight: 8 },
  precipitation: { icon: 'cloudRain', weight: 8 },
};

function getBarColor(score, colors) {
  if (score >= 80) return colors.success;
  if (score >= 60) return '#8BC34A';
  if (score >= 40) return '#FFC107';
  if (score >= 20) return colors.accent;
  return colors.error;
}

export default function FactorBreakdown({ factors }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  if (!factors) return null;

  const entries = Object.entries(FACTOR_CONFIG).map(([key, config]) => ({
    key,
    ...config,
    score: factors[key] ?? 50,
    label: t(`fishcast.factor.${key}`, key.replace(/([A-Z])/g, ' $1').trim()),
  }));

  // Sort by weight descending
  entries.sort((a, b) => b.weight - a.weight);

  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <AppIcon name="barChart" size={16} color={colors.text} />
        <Text style={[styles.title, { marginBottom: 0, marginLeft: 6 }]}>
          {t('fishcast.factorBreakdown', 'Score Breakdown')}
        </Text>
      </View>

      {entries.map(factor => (
        <View key={factor.key} style={styles.factorRow}>
          <View style={styles.factorHeader}>
            <AppIcon name={factor.icon} size={14} color={colors.textSecondary} style={{ width: 24 }} />
            <Text style={styles.factorLabel}>{factor.label}</Text>
            <Text style={styles.factorWeight}>{factor.weight}%</Text>
            <Text
              style={[styles.factorScore, { color: getBarColor(factor.score, colors) }]}
            >
              {Math.round(factor.score)}
            </Text>
          </View>
          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${factor.score}%`,
                  backgroundColor: getBarColor(factor.score, colors),
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 14,
  },
  factorRow: {
    marginBottom: 10,
  },
  factorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  factorIcon: { fontSize: 14, width: 24 },
  factorLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  factorWeight: { fontSize: 11, color: colors.textDisabled, marginRight: 8 },
  factorScore: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 28,
    textAlign: 'right',
  },
  barBg: {
    height: 6,
    backgroundColor: '#0d0d1a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});
