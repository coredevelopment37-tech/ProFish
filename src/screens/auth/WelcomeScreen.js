/**
 * WelcomeScreen — ProFish onboarding screen
 * Clean, gorgeous entry point. Sign in or explore as guest.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import useTheme from '../../hooks/useTheme';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.logo}>🐟</Text>
        <Text style={styles.title}>ProFish</Text>
        <Text style={styles.subtitle}>
          {t('auth.tagline', "The world's best fishing app")}
        </Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <FeatureRow
          emoji="🎯"
          text={t('auth.feature1', 'FishCast — AI-powered fishing predictions')}
        />
        <FeatureRow
          emoji="🗺️"
          text={t('auth.feature2', 'Interactive maps with 18 fishing layers')}
        />
        <FeatureRow
          emoji="📊"
          text={t('auth.feature3', 'Log catches & track your records')}
        />
        <FeatureRow
          emoji="🌍"
          text={t('auth.feature4', '24 languages, 100+ countries')}
        />
      </View>

      {/* CTA Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Auth')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>
            {t('auth.getStarted', 'Get Started')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Auth', { mode: 'anonymous' })}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>
            {t('auth.exploreAsGuest', 'Explore as Guest')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Legal */}
      <Text style={styles.legal}>
        {t(
          'auth.legal',
          'By continuing, you agree to our Terms & Privacy Policy',
        )}
      </Text>
    </View>
  );
}

function FeatureRow({ emoji, text }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    justifyContent: 'space-between',
    paddingBottom: 30,
  },
  hero: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    fontSize: 72,
    marginBottom: 12,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  features: {
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureEmoji: {
    fontSize: 24,
    width: 36,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 16,
    color: colors.textSecondary,
    flex: 1,
  },
  actions: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: colors.textTertiary,
    fontSize: 16,
    fontWeight: '600',
  },
  legal: {
    fontSize: 12,
    color: colors.textDisabled,
    textAlign: 'center',
  },
});
