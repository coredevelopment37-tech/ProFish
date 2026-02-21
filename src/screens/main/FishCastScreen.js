/**
 * FishCastScreen — Fishing activity prediction
 * Shows score (0-100), solunar timeline, weather, tide, factor breakdown
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Geolocation from '@react-native-community/geolocation';
import {
  calculateFishCast,
  calculate7DayOutlook,
} from '../../services/fishCastService';
import weatherService from '../../services/weatherService';
import tideService from '../../services/tideService';
import subscriptionService from '../../services/subscriptionService';
import ScoreCircle from '../../components/ScoreCircle';
import WeatherCard from '../../components/WeatherCard';
import SolunarTimeline from '../../components/SolunarTimeline';
import TideChart from '../../components/TideChart';
import FactorBreakdown from '../../components/FactorBreakdown';

export default function FishCastScreen() {
  const { t } = useTranslation();
  const [forecast, setForecast] = useState(null);
  const [marine, setMarine] = useState(null);
  const [tide, setTide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coords, setCoords] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [outlook, setOutlook] = useState([]);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    getLocation();
    try {
      const tier = subscriptionService.getCurrentTier();
      setIsPro(tier !== 'free');
    } catch {}
  }, []);

  async function getLocation() {
    try {
      if (Platform.OS === 'android') {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
      }
      Geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords;
          setCoords({ latitude, longitude });
          loadForecast(latitude, longitude);
        },
        () => {
          // Fallback: use a default location
          loadForecast(59.3293, 18.0686); // Stockholm as default
          setLocationName('Stockholm');
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
      );
    } catch {
      loadForecast(59.3293, 18.0686);
      setLocationName('Stockholm');
    }
  }

  async function loadForecast(lat, lng) {
    try {
      const [result, marineData, tideData] = await Promise.all([
        calculateFishCast(lat, lng),
        weatherService.getMarineWeather(lat, lng).catch(() => null),
        tideService.getCurrentTideState(lat, lng).catch(() => null),
      ]);
      setForecast(result);
      setMarine(marineData);
      setTide(tideData);

      // Fetch 7-day outlook (Pro only, but pre-fetch for paywall tease)
      calculate7DayOutlook(lat, lng)
        .then(days => setOutlook(days))
        .catch(() => {});
    } catch (e) {
      console.warn('[FishCast] Error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (coords) {
      loadForecast(coords.latitude, coords.longitude);
    } else {
      loadForecast(59.3293, 18.0686);
    }
  }, [coords]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0080FF" />
        <Text style={styles.loadingText}>
          {t('fishcast.loading', 'Calculating FishCast...')}
        </Text>
      </View>
    );
  }

  if (!forecast) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>🌧️</Text>
        <Text style={styles.errorText}>
          {t('fishcast.error', 'Could not load forecast')}
        </Text>
        <Text style={styles.errorHint}>
          {t(
            'fishcast.errorHint',
            'Check your internet connection and try again',
          )}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#0080FF"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t('fishcast.title', 'FishCast')}
        </Text>
        {locationName ? (
          <Text style={styles.location}>📍 {locationName}</Text>
        ) : null}
        <Text style={styles.timestamp}>
          {new Date(forecast.calculatedAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {/* Score */}
      <View style={styles.scoreContainer}>
        <ScoreCircle score={forecast.score} label={forecast.label} size={200} />
      </View>

      {/* Quick summary */}
      <Text style={styles.summary}>{getSummaryText(forecast.score, t)}</Text>

      {/* Best Times Today */}
      {forecast.solunar && (
        <View style={styles.bestTimesCard}>
          <Text style={styles.bestTimesTitle}>
            {t('fishcast.bestTimes', '🕐 Best Times Today')}
          </Text>
          <View style={styles.bestTimesRow}>
            {(forecast.solunar.majorPeriods || []).map((period, i) => (
              <View key={`major-${i}`} style={styles.timeSlot}>
                <Text style={styles.timeSlotIcon}>🔥</Text>
                <Text style={styles.timeSlotText}>
                  {period.start} – {period.end}
                </Text>
                <Text style={styles.timeSlotLabel}>
                  {t('fishcast.major', 'Major')}
                </Text>
              </View>
            ))}
            {(forecast.solunar.minorPeriods || []).map((period, i) => (
              <View key={`minor-${i}`} style={styles.timeSlot}>
                <Text style={styles.timeSlotIcon}>⭐</Text>
                <Text style={styles.timeSlotText}>
                  {period.start} – {period.end}
                </Text>
                <Text style={styles.timeSlotLabel}>
                  {t('fishcast.minor', 'Minor')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Hourly Forecast Timeline */}
      {forecast.hourly && forecast.hourly.length > 0 && (
        <View style={styles.hourlyCard}>
          <Text style={styles.hourlyTitle}>
            {t('fishcast.hourlyForecast', '📊 Hourly Forecast')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {forecast.hourly.map((h, i) => (
              <View key={i} style={styles.hourlySlot}>
                <Text style={styles.hourlyTime}>{h.hour}</Text>
                <View
                  style={[
                    styles.hourlyBar,
                    {
                      height: Math.max(8, (h.score / 100) * 60),
                      backgroundColor:
                        h.score >= 70
                          ? '#4CAF50'
                          : h.score >= 40
                          ? '#FF9800'
                          : '#555',
                    },
                  ]}
                />
                <Text style={styles.hourlyScore}>{h.score}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 7-Day Outlook (Pro) */}
      {outlook.length > 0 && (
        <View style={styles.outlookCard}>
          <Text style={styles.outlookTitle}>
            {t('fishcast.weekOutlook', '📅 7-Day Outlook')}
          </Text>
          {!isPro && (
            <View style={styles.outlookProBadge}>
              <Text style={styles.outlookProText}>PRO</Text>
            </View>
          )}
          <View style={isPro ? null : styles.outlookBlurred}>
            {outlook.map((day, i) => (
              <View
                key={day.date}
                style={[styles.outlookRow, i === 0 && styles.outlookRowToday]}
              >
                <Text style={styles.outlookDay}>
                  {i === 0 ? t('fishcast.today', 'Today') : day.dayName}
                </Text>
                <Text style={styles.outlookIcon}>{day.icon}</Text>
                <View style={styles.outlookScoreBar}>
                  <View
                    style={[
                      styles.outlookScoreFill,
                      {
                        width: `${day.score}%`,
                        backgroundColor:
                          day.score >= 70
                            ? '#4CAF50'
                            : day.score >= 50
                            ? '#FF9800'
                            : '#F44336',
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.outlookScore,
                    {
                      color:
                        day.score >= 70
                          ? '#4CAF50'
                          : day.score >= 50
                          ? '#FF9800'
                          : '#F44336',
                    },
                  ]}
                >
                  {isPro ? day.score : '??'}
                </Text>
                <Text style={styles.outlookTemp}>
                  {isPro ? `${day.highTemp}°/${day.lowTemp}°` : '--/--'}
                </Text>
              </View>
            ))}
          </View>
          {!isPro && (
            <Text style={styles.outlookUpgrade}>
              {t(
                'fishcast.upgradeOutlook',
                'Upgrade to Pro to unlock the 7-day fishing forecast',
              )}
            </Text>
          )}
        </View>
      )}

      {/* Solunar Timeline */}
      {forecast.solunar && (
        <SolunarTimeline
          solunar={{
            moonPhase: forecast.solunar.moonPhase,
            illumination: forecast.solunar.illumination,
            majorPeriods: forecast.solunar.majorPeriods,
            minorPeriods: forecast.solunar.minorPeriods,
          }}
          sunTimes={null}
        />
      )}

      {/* Weather */}
      {forecast.weather && (
        <WeatherCard weather={forecast.weather} marine={marine} />
      )}

      {/* Tide */}
      <TideChart tide={tide || forecast.tide} />

      {/* Factor Breakdown */}
      <FactorBreakdown factors={forecast.factors} />

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function getSummaryText(score, t) {
  if (score >= 85)
    return t(
      'fishcast.summaryExcellent',
      '🔥 Outstanding conditions! Get out there now!',
    );
  if (score >= 70)
    return t(
      'fishcast.summaryVeryGood',
      '🎣 Very good fishing conditions today.',
    );
  if (score >= 55)
    return t('fishcast.summaryGood', '👍 Decent conditions — worth a trip.');
  if (score >= 40)
    return t(
      'fishcast.summaryFair',
      '🤷 Fair conditions — patience will be key.',
    );
  return t('fishcast.summaryPoor', '😴 Tough conditions — maybe try tomorrow.');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  content: { padding: 20, paddingTop: 50 },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  location: { fontSize: 14, color: '#888', marginBottom: 2 },
  timestamp: { fontSize: 12, color: '#555' },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  summary: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  loadingText: { color: '#888', marginTop: 16, fontSize: 16 },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorText: {
    color: '#F44336',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorHint: { color: '#666', fontSize: 14, textAlign: 'center' },
  bestTimesCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  bestTimesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  bestTimesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    backgroundColor: '#0a0a1a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 90,
    flex: 1,
  },
  timeSlotIcon: { fontSize: 20, marginBottom: 4 },
  timeSlotText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  timeSlotLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  hourlyCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  hourlyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  hourlySlot: {
    alignItems: 'center',
    marginRight: 12,
    width: 36,
  },
  hourlyTime: { fontSize: 10, color: '#888', marginBottom: 4 },
  hourlyBar: {
    width: 20,
    borderRadius: 4,
    minHeight: 8,
  },
  hourlyScore: { fontSize: 10, color: '#ccc', marginTop: 4 },
  outlookCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  outlookTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  outlookProBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FF9800',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  outlookProText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  outlookBlurred: {
    opacity: 0.35,
  },
  outlookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  outlookRowToday: {
    backgroundColor: 'rgba(0,128,255,0.08)',
    borderRadius: 8,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  outlookDay: {
    width: 46,
    fontSize: 13,
    color: '#ccc',
    fontWeight: '600',
  },
  outlookIcon: {
    width: 28,
    fontSize: 16,
    textAlign: 'center',
  },
  outlookScoreBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  outlookScoreFill: {
    height: '100%',
    borderRadius: 3,
  },
  outlookScore: {
    width: 28,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  outlookTemp: {
    width: 58,
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  outlookUpgrade: {
    color: '#FF9800',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});
