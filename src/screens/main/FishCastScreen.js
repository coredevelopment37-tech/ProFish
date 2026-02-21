/**
 * FishCastScreen — Fishing activity prediction
 * Shows score (0-100), solunar periods, weather, tide
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { calculateFishCast } from '../../services/fishCastService';

export default function FishCastScreen() {
  const { t } = useTranslation();
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForecast();
  }, []);

  async function loadForecast() {
    try {
      // Default to a sample location until we get user's GPS
      const result = await calculateFishCast(25.276987, 55.296249); // Dubai as example
      setForecast(result);
    } catch (e) {
      console.warn('[FishCast] Error:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0080FF" />
        <Text style={styles.loadingText}>
          {t('fishcast.loading', 'Calculating FishCast...')}
        </Text>
      </View>
    );
  }

  if (!forecast) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          {t('fishcast.error', 'Could not load forecast')}
        </Text>
      </View>
    );
  }

  const scoreColor = getScoreColor(forecast.score);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('fishcast.title', 'FishCast')}</Text>

      {/* Score circle */}
      <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
        <Text style={[styles.score, { color: scoreColor }]}>
          {forecast.score}
        </Text>
        <Text style={[styles.label, { color: scoreColor }]}>
          {forecast.label}
        </Text>
      </View>

      {/* Weather summary */}
      {forecast.weather && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('fishcast.weather', 'Weather')}
          </Text>
          <Text style={styles.detail}>
            {forecast.weather.temp}° • {forecast.weather.description}
          </Text>
          <Text style={styles.detail}>
            {t('fishcast.wind', 'Wind')}: {forecast.weather.wind} km/h
          </Text>
          <Text style={styles.detail}>
            {t('fishcast.pressure', 'Pressure')}: {forecast.weather.pressure}{' '}
            hPa
          </Text>
        </View>
      )}

      {/* Solunar */}
      {forecast.solunar && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('fishcast.solunar', 'Solunar')}
          </Text>
          <Text style={styles.detail}>
            🌙 {forecast.solunar.moonPhase} ({forecast.solunar.illumination}%)
          </Text>
        </View>
      )}
    </View>
  );
}

function getScoreColor(score) {
  if (score >= 85) return '#4CAF50';
  if (score >= 70) return '#8BC34A';
  if (score >= 55) return '#FFC107';
  if (score >= 40) return '#FF9800';
  return '#F44336';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    alignItems: 'center',
    paddingTop: 60,
  },
  header: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 30 },
  scoreCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  score: { fontSize: 56, fontWeight: 'bold' },
  label: { fontSize: 18, fontWeight: '600' },
  section: {
    width: '90%',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  detail: { fontSize: 14, color: '#ccc', marginBottom: 4 },
  loadingText: { color: '#888', marginTop: 16, fontSize: 16 },
  errorText: { color: '#F44336', fontSize: 16 },
});
