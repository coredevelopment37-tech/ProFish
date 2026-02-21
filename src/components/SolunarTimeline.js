/**
 * SolunarTimeline — Visual timeline of major/minor feeding periods
 * Shows 24-hour bar with marked periods and current time indicator
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function SolunarTimeline({ solunar, sunTimes }) {
  const { t } = useTranslation();

  if (!solunar) return null;

  const now = new Date();
  const currentMinute = now.getHours() * 60 + now.getMinutes();
  const currentPercent = (currentMinute / 1440) * 100;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>🌙 {t('fishcast.solunar', 'Solunar')}</Text>
        <View style={styles.moonInfo}>
          <Text style={styles.moonPhase}>
            {getMoonEmoji(solunar.moonPhase)}
          </Text>
          <Text style={styles.moonName}>{solunar.moonPhase}</Text>
          <Text style={styles.illumination}>{solunar.illumination}%</Text>
        </View>
      </View>

      {/* 24h timeline bar */}
      <View style={styles.timeline}>
        {/* Night overlay (before sunrise, after sunset) */}
        {sunTimes && (
          <>
            <View
              style={[
                styles.nightOverlay,
                { left: 0, width: `${timeToPercent(sunTimes.sunrise)}%` },
              ]}
            />
            <View
              style={[
                styles.nightOverlay,
                { left: `${timeToPercent(sunTimes.sunset)}%`, right: 0 },
              ]}
            />
          </>
        )}

        {/* Major periods */}
        {solunar.majorPeriods?.map((period, i) => (
          <View
            key={`major-${i}`}
            style={[
              styles.period,
              styles.majorPeriod,
              {
                left: `${timeToPercent(period.start)}%`,
                width: `${periodWidthPercent(period.start, period.end)}%`,
              },
            ]}
          />
        ))}

        {/* Minor periods */}
        {solunar.minorPeriods?.map((period, i) => (
          <View
            key={`minor-${i}`}
            style={[
              styles.period,
              styles.minorPeriod,
              {
                left: `${timeToPercent(period.start)}%`,
                width: `${periodWidthPercent(period.start, period.end)}%`,
              },
            ]}
          />
        ))}

        {/* Current time indicator */}
        <View style={[styles.nowIndicator, { left: `${currentPercent}%` }]}>
          <View style={styles.nowDot} />
          <View style={styles.nowLine} />
        </View>
      </View>

      {/* Time labels */}
      <View style={styles.timeLabels}>
        <Text style={styles.timeLabel}>00</Text>
        <Text style={styles.timeLabel}>06</Text>
        <Text style={styles.timeLabel}>12</Text>
        <Text style={styles.timeLabel}>18</Text>
        <Text style={styles.timeLabel}>24</Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF6B00' }]} />
          <Text style={styles.legendText}>
            {t('fishcast.majorPeriod', 'Major Period')}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#0080FF' }]} />
          <Text style={styles.legendText}>
            {t('fishcast.minorPeriod', 'Minor Period')}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#1a1a3a' }]} />
          <Text style={styles.legendText}>{t('fishcast.night', 'Night')}</Text>
        </View>
      </View>
    </View>
  );
}

function timeToPercent(isoString) {
  if (!isoString) return 0;
  const d = new Date(isoString);
  return ((d.getHours() * 60 + d.getMinutes()) / 1440) * 100;
}

function periodWidthPercent(startIso, endIso) {
  if (!startIso || !endIso) return 0;
  const s = new Date(startIso);
  const e = new Date(endIso);
  const startMin = s.getHours() * 60 + s.getMinutes();
  const endMin = e.getHours() * 60 + e.getMinutes();
  const diff = endMin > startMin ? endMin - startMin : 1440 - startMin + endMin;
  return (diff / 1440) * 100;
}

function getMoonEmoji(phaseName) {
  const map = {
    'New Moon': '🌑',
    'Waxing Crescent': '🌒',
    'First Quarter': '🌓',
    'Waxing Gibbous': '🌔',
    'Full Moon': '🌕',
    'Waning Gibbous': '🌖',
    'Last Quarter': '🌗',
    'Waning Crescent': '🌘',
  };
  return map[phaseName] || '🌙';
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
  moonInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  moonPhase: { fontSize: 20 },
  moonName: { fontSize: 13, color: '#aaa' },
  illumination: { fontSize: 12, color: '#666' },
  timeline: {
    height: 24,
    backgroundColor: '#2a2a4a',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  nightOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  period: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    borderRadius: 8,
  },
  majorPeriod: {
    backgroundColor: 'rgba(255, 107, 0, 0.7)',
  },
  minorPeriod: {
    backgroundColor: 'rgba(0, 128, 255, 0.5)',
  },
  nowIndicator: {
    position: 'absolute',
    top: -2,
    alignItems: 'center',
    zIndex: 10,
  },
  nowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4081',
    marginBottom: 1,
  },
  nowLine: {
    width: 2,
    height: 20,
    backgroundColor: '#FF4081',
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  timeLabel: { fontSize: 10, color: '#555' },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: { fontSize: 11, color: '#888' },
});
