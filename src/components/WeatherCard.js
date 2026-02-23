/**
 * WeatherCard — Compact weather summary widget
 * Shows current conditions with icon, temp, wind, pressure
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import useTheme from '../hooks/useTheme';

const WMO_ICONS = {
  0: '☀️',
  1: '🌤️',
  2: '⛅',
  3: '☁️',
  45: '🌫️',
  48: '🌫️',
  51: '🌦️',
  53: '🌧️',
  55: '🌧️',
  61: '🌧️',
  63: '🌧️',
  65: '🌧️',
  71: '❄️',
  73: '❄️',
  75: '❄️',
  80: '🌦️',
  81: '🌧️',
  82: '⛈️',
  95: '⛈️',
  96: '⛈️',
  99: '⛈️',
};

function windDirectionArrow(deg) {
  const arrows = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];
  return arrows[Math.round(deg / 45) % 8];
}

export default function WeatherCard({
  weather,
  marine = null,
  compact = false,
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  function DetailItem({ label, value }) {
    return (
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    );
  }

  if (!weather) return null;

  const icon = WMO_ICONS[weather.weatherCode] || '🌡️';

  if (compact) {
    return (
      <View style={styles.compact}>
        <Text style={styles.compactIcon}>{icon}</Text>
        <Text style={styles.compactTemp}>
          {weather.temp ?? weather.temperature}°
        </Text>
        <Text style={styles.compactWind}>
          {windDirectionArrow(weather.windDirection ?? 0)}{' '}
          {weather.wind ?? weather.windSpeed} km/h
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.mainInfo}>
          <Text style={styles.temp}>
            {weather.temp ?? weather.temperature}°C
          </Text>
          <Text style={styles.desc}>{weather.description}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <DetailItem
          label={t('fishcast.wind', 'Wind')}
          value={`${windDirectionArrow(weather.windDirection ?? 0)} ${
            weather.wind ?? weather.windSpeed
          } km/h`}
        />
        <DetailItem
          label={t('fishcast.pressure', 'Pressure')}
          value={`${weather.pressure ?? weather.pressureMsl} hPa`}
        />
        <DetailItem
          label={t('fishcast.humidity', 'Humidity')}
          value={`${weather.humidity ?? '—'}%`}
        />
        <DetailItem
          label={t('fishcast.clouds', 'Clouds')}
          value={`${weather.cloudCover ?? '—'}%`}
        />
      </View>

      {marine && (
        <View style={styles.marineRow}>
          <Text style={styles.marineLabel}>
            🌊 {t('fishcast.waves', 'Waves')}
          </Text>
          <Text style={styles.marineValue}>
            {marine.waveHeight ? `${marine.waveHeight}m` : '—'}
            {marine.swellHeight ? ` (swell ${marine.swellHeight}m)` : ''}
          </Text>
        </View>
      )}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: { fontSize: 48, marginRight: 16 },
  mainInfo: { flex: 1 },
  temp: { fontSize: 32, fontWeight: 'bold', color: colors.text },
  desc: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  detailItem: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: { fontSize: 15, color: colors.text, fontWeight: '600', marginTop: 4 },
  marineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
  },
  marineLabel: { fontSize: 14, color: colors.textTertiary },
  marineValue: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  // Compact
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.overlay,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  compactIcon: { fontSize: 18 },
  compactTemp: { fontSize: 14, color: colors.text, fontWeight: '600' },
  compactWind: { fontSize: 12, color: colors.textSecondary },
});
