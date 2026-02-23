/**
 * Consent Modal Screen (#467)
 *
 * EU cookie/tracking consent modal shown on first launch for EU users.
 * Allows granular consent for analytics, marketing, and third-party data.
 *
 * GDPR Article 7: Consent must be freely given, specific, informed, unambiguous.
 * Must be as easy to withdraw as to give.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  ScrollView,
  Linking,
} from 'react-native';
import gdprService from '../../services/gdprService';
import regionGatingService from '../../services/regionGatingService';
import useTheme from '../../hooks/useTheme';
import { AppIcon } from '../../constants/icons';
import { Button } from '../../components/Common';

const EU_REGIONS = ['EU', 'NORDICS'];

export default function ConsentModal({ visible, onComplete }) {
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [thirdParty, setThirdParty] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { colors } = useTheme();
  const styles = createStyles(colors);

  useEffect(() => {
    loadExisting();
  }, []);

  async function loadExisting() {
    const consent = await gdprService.getConsent();
    if (consent.timestamp) {
      setAnalytics(consent.analytics);
      setMarketing(consent.marketing);
      setThirdParty(consent.thirdParty);
    }
  }

  async function handleAcceptAll() {
    await gdprService.setConsent({
      analytics: true,
      marketing: true,
      thirdParty: true,
    });
    onComplete?.();
  }

  async function handleAcceptSelected() {
    await gdprService.setConsent({ analytics, marketing, thirdParty });
    onComplete?.();
  }

  async function handleRejectAll() {
    await gdprService.setConsent({
      analytics: false,
      marketing: false,
      thirdParty: false,
    });
    onComplete?.();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <AppIcon name="lock" size={20} color={colors.text} />
              <Text style={[styles.title, { marginBottom: 0, marginLeft: 8 }]}>Your Privacy Matters</Text>
            </View>
            <Text style={styles.description}>
              ProFish uses cookies and similar technologies to improve your
              experience. You can choose which types of data collection to
              allow.
            </Text>

            {/* Essential — always on */}
            <View style={styles.consentRow}>
              <View style={styles.consentInfo}>
                <Text style={styles.consentLabel}>Essential</Text>
                <Text style={styles.consentDesc}>
                  Required for the app to function (authentication, offline
                  storage)
                </Text>
              </View>
              <Switch
                value={true}
                disabled
                trackColor={{ true: colors.primary }}
              />
            </View>

            {/* Analytics */}
            <View style={styles.consentRow}>
              <View style={styles.consentInfo}>
                <Text style={styles.consentLabel}>Analytics</Text>
                <Text style={styles.consentDesc}>
                  Helps us understand how you use ProFish to improve features
                </Text>
              </View>
              <Switch
                value={analytics}
                onValueChange={setAnalytics}
                trackColor={{ true: colors.primary, false: colors.border }}
              />
            </View>

            {/* Marketing */}
            <View style={styles.consentRow}>
              <View style={styles.consentInfo}>
                <Text style={styles.consentLabel}>Marketing</Text>
                <Text style={styles.consentDesc}>
                  Personalized fishing tips and Pro subscription offers
                </Text>
              </View>
              <Switch
                value={marketing}
                onValueChange={setMarketing}
                trackColor={{ true: colors.primary, false: colors.border }}
              />
            </View>

            {/* Third Party */}
            <View style={styles.consentRow}>
              <View style={styles.consentInfo}>
                <Text style={styles.consentLabel}>Third-Party Services</Text>
                <Text style={styles.consentDesc}>
                  Weather data, crash reporting, and map tile providers
                </Text>
              </View>
              <Switch
                value={thirdParty}
                onValueChange={setThirdParty}
                trackColor={{ true: colors.primary, false: colors.border }}
              />
            </View>

            {/* Detail toggle */}
            <TouchableOpacity onPress={() => setShowDetails(!showDetails)}>
              <Text style={styles.detailsToggle}>
                {showDetails ? 'Hide details ▲' : 'Show details ▼'}
              </Text>
            </TouchableOpacity>

            {showDetails && (
              <View style={styles.detailsBox}>
                <Text style={styles.detailsText}>
                  <Text style={styles.bold}>Firebase Analytics:</Text>{' '}
                  Anonymized usage data{'\n'}
                  <Text style={styles.bold}>Sentry:</Text> Crash reports and
                  error tracking{'\n'}
                  <Text style={styles.bold}>RevenueCat:</Text> Subscription
                  status{'\n'}
                  <Text style={styles.bold}>Mapbox:</Text> Map tile requests
                  include device info{'\n'}
                  <Text style={styles.bold}>Open-Meteo:</Text> Weather requests
                  include coordinates
                </Text>
              </View>
            )}

            {/* Links */}
            <View style={styles.links}>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://profish.app/privacy')}
              >
                <Text style={styles.linkText}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={styles.linkSep}>|</Text>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://profish.app/terms')}
              >
                <Text style={styles.linkText}>Terms of Service</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttons}>
            <Button
              title="Reject All"
              onPress={handleRejectAll}
              variant="outline"
              size="sm"
              fullWidth={false}
            />
            <Button
              title="Accept Selected"
              onPress={handleAcceptSelected}
              variant="secondary"
              size="sm"
              fullWidth={false}
              style={{ backgroundColor: colors.accent }}
            />
            <Button
              title="Accept All"
              onPress={handleAcceptAll}
              variant="primary"
              size="sm"
              fullWidth={false}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  consentInfo: { flex: 1, marginRight: 12 },
  consentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  consentDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  detailsToggle: {
    color: colors.primary,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 13,
  },
  detailsBox: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  detailsText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bold: { fontWeight: '700', color: colors.text },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  linkText: { color: colors.primary, fontSize: 13 },
  linkSep: { color: colors.textSecondary, marginHorizontal: 8, fontSize: 13 },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

});

/**
 * Check if consent modal should be shown.
 * Always show for EU/EEA users on first launch.
 */
export async function shouldShowConsentModal() {
  const consent = await gdprService.getConsent();
  if (consent.timestamp) return false;

  const region = regionGatingService.getRegion();
  return EU_REGIONS.includes(region) || true;
}
