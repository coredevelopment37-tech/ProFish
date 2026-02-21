/**
 * TideChart — Visual tide level display
 * Shows current tide state, progress, and next extreme
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function TideChart({ tide }) {
  const { t } = useTranslation();

  if (!tide || tide.state === 'unknown') {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>🌊 {t('fishcast.tide', 'Tide')}</Text>
        <Text style={styles.noData}>
          {t('fishcast.noTideData', 'No tide data for this location')}
        </Text>
      </View>
    );
  }

  const isRising = tide.state === 'rising';
  const stateColor = isRising ? '#4CAF50' : '#FF9800';
  const stateIcon = isRising ? '↗️' : '↘️';
  const stateLabel = isRising
    ? t('fishcast.tideRising', 'Rising')
    : t('fishcast.tideFalling', 'Falling');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>🌊 {t('fishcast.tide', 'Tide')}</Text>
        <View style={[styles.badge, { backgroundColor: stateColor + '20' }]}>
          <Text style={[styles.badgeText, { color: stateColor }]}>
            {stateIcon} {stateLabel}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>
            {tide.lastExtreme?.type === 'Low' ? '🔽 Low' : '🔼 High'}
          </Text>
          <Text style={styles.progressLabel}>
            {tide.nextExtreme?.type === 'Low' ? '🔽 Low' : '🔼 High'}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${tide.progress || 0}%`,
                backgroundColor: stateColor,
              },
            ]}
          />
          <View
            style={[
              styles.progressDot,
              {
                left: `${tide.progress || 0}%`,
                backgroundColor: stateColor,
              },
            ]}
          />
        </View>
        <Text style={styles.progressPercent}>{tide.progress || 0}%</Text>
      </View>

      {/* Next extreme */}
      {tide.nextExtreme && (
        <View style={styles.nextExtreme}>
          <Text style={styles.nextLabel}>
            {t('fishcast.nextTide', 'Next')}: {tide.nextExtreme.type}
          </Text>
          <Text style={styles.nextTime}>
            {formatTime(tide.nextExtreme.date)}
          </Text>
          {tide.nextExtreme.height != null && (
            <Text style={styles.nextHeight}>
              {tide.nextExtreme.height.toFixed(1)}m
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function formatTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 16, fontWeight: '600', color: '#fff' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 13, fontWeight: '600' },
  noData: { fontSize: 14, color: '#666', marginTop: 8 },
  progressContainer: { marginBottom: 12 },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: { fontSize: 11, color: '#888' },
  progressBar: {
    height: 8,
    backgroundColor: '#0d0d1a',
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressDot: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    borderWidth: 2,
    borderColor: '#1a1a2e',
  },
  progressPercent: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  nextExtreme: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  nextLabel: { fontSize: 13, color: '#888' },
  nextTime: { fontSize: 15, color: '#0080FF', fontWeight: '600' },
  nextHeight: { fontSize: 13, color: '#aaa' },
});
