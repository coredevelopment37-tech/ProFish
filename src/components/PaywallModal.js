/**
 * PaywallModal — Subscription upgrade prompt
 * Shows when user hits a free tier limit
 * Wired to RevenueCat for real purchases
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import useTheme from '../hooks/useTheme';
import subscriptionService, {
  TIERS,
  TIER_META,
} from '../services/subscriptionService';
import PurchaseSuccessModal from './PurchaseSuccessModal';
import { AppIcon } from '../constants/icons';

// Feature comparison: [icon, key, free value, pro value]
const FEATURE_COMPARISON = [
  { icon: 'fish', key: 'catches', free: '10/mo', pro: '∞' },
  { icon: 'map', key: 'mapLayers', free: '6', pro: '18' },
  { icon: 'barChart', key: 'fishCast', free: '3 days', pro: '16 days' },
  { icon: 'bot', key: 'aiId', free: '5/day', pro: '∞' },
  { icon: 'camera', key: 'catchPhotos', free: '—', pro: 'check' },
  { icon: 'wifiOff', key: 'offlineMaps', free: '—', pro: 'check' },
  { icon: 'trendingUp', key: 'catchStats', free: '—', pro: 'check' },
  { icon: 'waves', key: 'bathymetry', free: '—', pro: 'check' },
  { icon: 'thermometer', key: 'seaSurfaceTemp', free: '—', pro: 'check' },
  { icon: 'trophy', key: 'leaderboards', free: '—', pro: 'check' },
];

export default function PaywallModal({ visible, onClose, feature }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const proMeta = TIER_META[TIERS.PRO];
  const [offerings, setOfferings] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (visible) {
      subscriptionService.getOfferings().then(o => setOfferings(o));
    }
  }, [visible]);

  const yearlyPkg = offerings?.availablePackages?.find(
    p => p.identifier === '$rc_annual' || p.packageType === 'ANNUAL',
  );
  const monthlyPkg = offerings?.availablePackages?.find(
    p => p.identifier === '$rc_monthly' || p.packageType === 'MONTHLY',
  );

  async function handlePurchase(pkg) {
    if (!pkg) {
      Alert.alert(
        'Not Available',
        'In-app purchases are not configured yet. Set up products in RevenueCat & App Store Connect / Google Play Console.',
      );
      return;
    }
    setPurchasing(true);
    try {
      const success = await subscriptionService.purchase(pkg);
      if (success) {
        setShowSuccess(true);
      }
    } catch (e) {
      // Handle specific purchase errors
      const code = e?.userCancelled ? 'USER_CANCELLED' : e?.code || '';
      if (e?.userCancelled || code === 'USER_CANCELLED') {
        // User cancelled — do nothing
      } else if (
        code === 'PRODUCT_ALREADY_PURCHASED' ||
        code === 'RECEIPT_ALREADY_IN_USE'
      ) {
        Alert.alert(
          t('paywall.alreadySubscribed', 'Already Subscribed'),
          t(
            'paywall.alreadySubscribedMsg',
            'You already have an active subscription. Try restoring purchases.',
          ),
          [
            { text: t('common.ok', 'OK') },
            {
              text: t('subscription.restore', 'Restore'),
              onPress: handleRestore,
            },
          ],
        );
      } else if (code === 'NETWORK_ERROR' || code === 'STORE_PROBLEM') {
        Alert.alert(
          t('paywall.networkError', 'Connection Error'),
          t(
            'paywall.networkErrorMsg',
            'Please check your internet connection and try again.',
          ),
        );
      } else {
        Alert.alert(
          t('common.error', 'Error'),
          e.message ||
            t(
              'paywall.purchaseFailed',
              'Purchase could not be completed. Please try again.',
            ),
        );
      }
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    try {
      const tier = await subscriptionService.restorePurchases();
      if (tier !== TIERS.FREE) {
        onClose();
      } else {
        Alert.alert('', 'No previous purchases found.');
      }
    } catch (e) {
      Alert.alert(t('common.error', 'Error'), e.message);
    } finally {
      setRestoring(false);
    }
  }

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
            <AppIcon name="star" size={40} color="#FFD700" />
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

          {/* Feature Comparison Table */}
          <ScrollView
            style={styles.features}
            showsVerticalScrollIndicator={false}
          >
            {/* Table header */}
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderFeature}>
                {t('paywall.feature', 'Feature')}
              </Text>
              <Text style={styles.tableHeaderTier}>
                {t('paywall.free', 'Free')}
              </Text>
              <Text style={[styles.tableHeaderTier, styles.tableHeaderPro]}>
                Pro
              </Text>
            </View>
            {FEATURE_COMPARISON.map(f => (
              <View key={f.key} style={styles.tableRow}>
                <View style={styles.tableFeatureCell}>
                  <AppIcon name={f.icon} size={18} color={colors.textSecondary} style={{ width: 30 }} />
                  <Text style={styles.featureText}>
                    {t(
                      `paywall.feature.${f.key}`,
                      f.key.replace(/([A-Z])/g, ' $1'),
                    )}
                  </Text>
                </View>
                <Text style={styles.tableFreeValue}>{f.free}</Text>
                {f.pro === 'check' ? (
                  <View style={{ width: 56, alignItems: 'center' }}>
                    <AppIcon name="check" size={16} color={colors.success} />
                  </View>
                ) : (
                  <Text style={styles.tableProValue}>{f.pro}</Text>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Pricing */}
          <View style={styles.pricing}>
            <TouchableOpacity
              style={styles.yearlyButton}
              disabled={purchasing}
              onPress={() => handlePurchase(yearlyPkg)}
            >
              <View>
                <Text style={styles.yearlyLabel}>
                  {t('paywall.yearlyPlan', 'Yearly Plan')}
                </Text>
                <Text style={styles.yearlyPrice}>
                  {yearlyPkg?.product?.priceString || proMeta.price}
                </Text>
              </View>
              <View style={styles.saveBadge}>
                <Text style={styles.saveText}>
                  {t('paywall.bestValue', 'Best Value')}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.monthlyButton}
              disabled={purchasing}
              onPress={() => handlePurchase(monthlyPkg)}
            >
              <Text style={styles.monthlyLabel}>
                {t('paywall.monthlyPlan', 'Monthly Plan')}
              </Text>
              <Text style={styles.monthlyPrice}>
                {monthlyPkg?.product?.priceString || proMeta.priceMonthly}
              </Text>
            </TouchableOpacity>
          </View>

          {purchasing && (
            <ActivityIndicator
              color={colors.accent}
              size="small"
              style={{ marginBottom: 10 }}
            />
          )}

          {/* Restore */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={restoring}
          >
            <Text style={styles.restoreText}>
              {restoring
                ? t('common.loading', 'Loading...')
                : t('subscription.restore', 'Restore Purchase')}
            </Text>
          </TouchableOpacity>

          {/* Close */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>
              {t('paywall.notNow', 'Not Now')}
            </Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            {t(
              'paywall.terms',
              'By subscribing you agree to our Terms of Service and Privacy Policy. Payment will be charged to your account. Subscription auto-renews unless cancelled at least 24 hours before the end of the current period.',
            )}
          </Text>

          {/* Free trial notice */}
          <Text style={styles.trialText}>
            {t('paywall.trial', '7-day free trial included with yearly plan')}
          </Text>
        </View>
      </View>

      <PurchaseSuccessModal
        visible={showSuccess}
        tier="pro"
        onClose={() => {
          setShowSuccess(false);
          onClose();
        }}
      />
    </Modal>
  );
}

const createStyles = (colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.background,
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
  title: { fontSize: 26, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.textTertiary, textAlign: 'center' },
  features: { maxHeight: 300, marginBottom: 24 },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.surfaceLight,
    marginBottom: 4,
  },
  tableHeaderFeature: {
    flex: 1,
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tableHeaderTier: {
    width: 56,
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '600',
    textAlign: 'center',
  },
  tableHeaderPro: { color: colors.accent },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  tableFeatureCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableFreeValue: {
    width: 56,
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  tableProValue: {
    width: 56,
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
    textAlign: 'center',
  },
  featureIcon: { fontSize: 18, width: 30 },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  pricing: { marginBottom: 16 },
  yearlyButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
  },
  yearlyLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  yearlyPrice: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  saveBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  saveText: { fontSize: 12, color: colors.text, fontWeight: '600' },
  monthlyButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  monthlyLabel: { fontSize: 14, color: colors.textSecondary },
  monthlyPrice: { fontSize: 18, fontWeight: '600', color: colors.text },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeText: { fontSize: 15, color: colors.textTertiary },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  restoreText: { fontSize: 13, color: colors.primary },
  terms: {
    fontSize: 11,
    color: '#444',
    textAlign: 'center',
    marginTop: 4,
  },
  trialText: {
    fontSize: 13,
    color: colors.success,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
  },
});
