/**
 * ProfileScreen — User profile, settings, subscription
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/AppContext';
import { TIER_META } from '../../services/subscriptionService';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { state } = useApp();
  const tierMeta = TIER_META[state.subscriptionTier];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🎣</Text>
        </View>
        <Text style={styles.name}>
          {state.user?.displayName || t('profile.angler', 'Angler')}
        </Text>
        <View
          style={[styles.badge, { backgroundColor: tierMeta?.color || '#888' }]}
        >
          <Text style={styles.badgeText}>
            {tierMeta?.icon} {tierMeta?.label || 'Free'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('profile.settings', 'Settings')}
        </Text>

        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>
            {t('profile.language', 'Language')}
          </Text>
          <Text style={styles.rowValue}>{i18n.language.toUpperCase()}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>{t('profile.region', 'Region')}</Text>
          <Text style={styles.rowValue}>{state.country || '—'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>{t('profile.units', 'Units')}</Text>
          <Text style={styles.rowValue}>{t('profile.metric', 'Metric')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>
            {t('profile.subscription', 'Subscription')}
          </Text>
          <Text style={[styles.rowValue, { color: tierMeta?.color }]}>
            {tierMeta?.label}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.help', 'Help')}</Text>

        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>
            {t('profile.suggestTranslation', 'Suggest Better Translation')}
          </Text>
          <Text style={styles.rowValue}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>
            {t('profile.reportBug', 'Report a Bug')}
          </Text>
          <Text style={styles.rowValue}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>
            {t('profile.about', 'About ProFish')}
          </Text>
          <Text style={styles.rowValue}>v0.1.0</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 36 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: { color: '#fff', fontWeight: '600' },
  section: { padding: 20 },
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
  rowLabel: { fontSize: 16, color: '#fff' },
  rowValue: { fontSize: 16, color: '#888' },
});
