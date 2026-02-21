/**
 * PaywallModal — Subscription upgrade prompt
 * Shows when user hits a free tier limit
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { TIERS, TIER_META, TIER_LIMITS } from '../services/subscriptionService';

const PRO_FEATURES = [
  { icon: '🎣', key: 'unlimitedCatches' },
  { icon: '🗺️', key: 'allMapLayers' },
  { icon: '📊', key: 'fullFishCast' },
  { icon: '📷', key: 'catchPhotos' },
  { icon: '📴', key: 'offlineMaps' },
  { icon: '📈', key: 'catchStats' },
  { icon: '🌊', key: 'bathymetry' },
  { icon: '🌡️', key: 'seaSurfaceTemp' },
];

export default function PaywallModal({ visible, onClose, feature }) {
  const { t } = useTranslation();
  const proMeta = TIER_META[TIERS.PRO];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.icon}>⭐</Text>
            <Text style={styles.title}>
              {t('paywall.title', 'Upgrade to Pro')}
            </Text>
            <Text style={styles.subtitle}>
              {feature
                ? t(
                    'paywall.featureRequired',
                    'This feature requires ProFish Pro',
                  )
                : t('paywall.subtitle', 'Unlock the full fishing experience')}
            </Text>
          </View>

          {/* Features */}
          <ScrollView
            style={styles.features}
            showsVerticalScrollIndicator={false}
          >
            {PRO_FEATURES.map(f => (
              <View key={f.key} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureText}>
                  {t(
                    `paywall.feature.${f.key}`,
                    f.key.replace(/([A-Z])/g, ' $1'),
                  )}
                </Text>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            ))}
          </ScrollView>

          {/* Pricing */}
          <View style={styles.pricing}>
            <TouchableOpacity style={styles.yearlyButton}>
              <View>
                <Text style={styles.yearlyLabel}>
                  {t('paywall.yearlyPlan', 'Yearly Plan')}
                </Text>
                <Text style={styles.yearlyPrice}>{proMeta.price}</Text>
              </View>
              <View style={styles.saveBadge}>
                <Text style={styles.saveText}>
                  {t('paywall.bestValue', 'Best Value')}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.monthlyButton}>
              <Text style={styles.monthlyLabel}>
                {t('paywall.monthlyPlan', 'Monthly Plan')}
              </Text>
              <Text style={styles.monthlyPrice}>{proMeta.priceMonthly}</Text>
            </TouchableOpacity>
          </View>

          {/* Close */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>
              {t('paywall.notNow', 'Not Now')}
            </Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            {t(
              'paywall.terms',
              'Cancel anytime. Prices may vary by region (PPP).',
            )}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#0a0a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 34,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  header: { alignItems: 'center', marginBottom: 24 },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#888', textAlign: 'center' },
  features: { maxHeight: 260, marginBottom: 24 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  featureIcon: { fontSize: 20, width: 36 },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#ccc',
    textTransform: 'capitalize',
  },
  checkmark: { fontSize: 16, color: '#4CAF50', fontWeight: 'bold' },
  pricing: { marginBottom: 16 },
  yearlyButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
  },
  yearlyLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  yearlyPrice: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  saveBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  saveText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  monthlyButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333',
    padding: 18,
  },
  monthlyLabel: { fontSize: 14, color: '#ccc' },
  monthlyPrice: { fontSize: 18, fontWeight: '600', color: '#fff' },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeText: { fontSize: 15, color: '#666' },
  terms: {
    fontSize: 11,
    color: '#444',
    textAlign: 'center',
    marginTop: 4,
  },
});
