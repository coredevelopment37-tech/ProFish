/**
 * SettingsScreen — Advanced settings
 * Notification preferences, data management, cache, debug info
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/AppContext';
import cacheService from '../../services/cacheService';
import offlineQueue from '../../services/offlineQueue';

export default function SettingsScreen({ navigation }) {
  const { t } = useTranslation();
  const { state } = useApp();

  const [notifications, setNotifications] = useState({
    fishCast: true,
    tideAlerts: true,
    community: false,
    weeklyReport: true,
  });
  const [cacheStats, setCacheStats] = useState(null);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const stats = await cacheService.getStats();
    setCacheStats(stats);
    const pending = await offlineQueue.getPendingCount();
    setPendingSync(pending);
  }

  const handleClearCache = useCallback(() => {
    Alert.alert(
      t('settings.clearCache', 'Clear Cache'),
      t(
        'settings.clearCacheConfirm',
        'This will clear all cached weather, tide, and prediction data. Fresh data will be downloaded on next use.',
      ),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.clear', 'Clear'),
          style: 'destructive',
          onPress: async () => {
            await cacheService.clearAll();
            await loadStats();
            Alert.alert(
              '',
              t('settings.cacheCleared', 'Cache cleared successfully'),
            );
          },
        },
      ],
    );
  }, [t]);

  const handleExportData = useCallback(() => {
    Alert.alert(
      t('settings.exportData', 'Export Data'),
      t(
        'settings.exportDataMsg',
        'Your catch data will be exported as a CSV file. This feature will be available soon.',
      ),
      [{ text: t('common.ok', 'OK') }],
    );
  }, [t]);

  const toggleNotification = key => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    // TODO: Save to AsyncStorage and update push notification subscriptions
  };

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
        <Text style={styles.title}>{t('settings.title', 'Settings')}</Text>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('settings.notifications', 'Notifications')}
        </Text>

        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Text style={styles.rowText}>
              🎯 {t('settings.fishCastAlerts', 'FishCast Alerts')}
            </Text>
            <Text style={styles.rowDesc}>
              {t(
                'settings.fishCastAlertsDesc',
                'Get notified when fishing conditions are excellent',
              )}
            </Text>
          </View>
          <Switch
            value={notifications.fishCast}
            onValueChange={() => toggleNotification('fishCast')}
            trackColor={{ false: '#333', true: '#0080FF' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Text style={styles.rowText}>
              🌊 {t('settings.tideAlerts', 'Tide Alerts')}
            </Text>
            <Text style={styles.rowDesc}>
              {t('settings.tideAlertsDesc', 'Alerts before high and low tides')}
            </Text>
          </View>
          <Switch
            value={notifications.tideAlerts}
            onValueChange={() => toggleNotification('tideAlerts')}
            trackColor={{ false: '#333', true: '#0080FF' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Text style={styles.rowText}>
              👥 {t('settings.communityNotifs', 'Community')}
            </Text>
            <Text style={styles.rowDesc}>
              {t(
                'settings.communityNotifsDesc',
                'Likes, comments, new followers',
              )}
            </Text>
          </View>
          <Switch
            value={notifications.community}
            onValueChange={() => toggleNotification('community')}
            trackColor={{ false: '#333', true: '#0080FF' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Text style={styles.rowText}>
              📊 {t('settings.weeklyReport', 'Weekly Report')}
            </Text>
            <Text style={styles.rowDesc}>
              {t(
                'settings.weeklyReportDesc',
                'Weekly summary of your fishing activity',
              )}
            </Text>
          </View>
          <Switch
            value={notifications.weeklyReport}
            onValueChange={() => toggleNotification('weeklyReport')}
            trackColor={{ false: '#333', true: '#0080FF' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('settings.dataManagement', 'Data Management')}
        </Text>

        <TouchableOpacity style={styles.row} onPress={handleExportData}>
          <Text style={styles.rowText}>
            📤 {t('settings.exportCatches', 'Export Catches (CSV)')}
          </Text>
          <Text style={styles.rowArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={handleClearCache}>
          <Text style={styles.rowText}>
            🗑️ {t('settings.clearCache', 'Clear Cache')}
          </Text>
          <Text style={styles.rowValue}>
            {cacheStats ? `${cacheStats.estimatedSizeKB} KB` : '...'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sync Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('settings.syncStatus', 'Sync Status')}
        </Text>
        <View style={styles.row}>
          <Text style={styles.rowText}>
            {pendingSync > 0
              ? `⏳ ${pendingSync} ${t(
                  'settings.pendingSync',
                  'operations pending',
                )}`
              : `✅ ${t('settings.allSynced', 'All data synced')}`}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowText}>
            {t('settings.cacheEntries', 'Cache entries')}
          </Text>
          <Text style={styles.rowValue}>
            {cacheStats
              ? `${cacheStats.validEntries} valid / ${cacheStats.expiredEntries} expired`
              : '...'}
          </Text>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.about', 'About')}</Text>
        <View style={styles.row}>
          <Text style={styles.rowText}>{t('settings.version', 'Version')}</Text>
          <Text style={styles.rowValue}>0.1.0 (1)</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowText}>{t('settings.tier', 'Tier')}</Text>
          <Text style={styles.rowValue}>
            {state.subscriptionTier?.toUpperCase()}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowText}>{t('settings.region', 'Region')}</Text>
          <Text style={styles.rowValue}>{state.region || 'Auto'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowText}>{t('settings.userId', 'User ID')}</Text>
          <Text style={styles.rowValue} numberOfLines={1}>
            {state.user?.uid?.slice(0, 12) || '—'}...
          </Text>
        </View>
      </View>

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
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  rowText: { fontSize: 15, color: '#fff' },
  rowValue: { fontSize: 14, color: '#888', maxWidth: 160 },
  rowArrow: { fontSize: 16, color: '#555' },
  rowDesc: { fontSize: 12, color: '#666', marginTop: 2 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  switchLabel: { flex: 1, marginRight: 12 },
});
