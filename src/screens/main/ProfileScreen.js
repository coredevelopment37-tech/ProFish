/**
 * ProfileScreen — User profile, settings, subscription
 * Fully interactive: language picker, units toggle, sign out, paywall
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  Image,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/AppContext';
import { TIER_META } from '../../services/subscriptionService';
import firebaseAuthService from '../../services/firebaseAuthService';
import PaywallModal from '../../components/PaywallModal';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'sv', label: 'Svenska' },
  { code: 'no', label: 'Norsk' },
  { code: 'da', label: 'Dansk' },
  { code: 'fi', label: 'Suomi' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt-BR', label: 'Português (BR)' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'pl', label: 'Polski' },
  { code: 'cs', label: 'Čeština' },
  { code: 'ru', label: 'Русский' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'th', label: 'ไทย' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'ms', label: 'Bahasa Melayu' },
  { code: 'fil', label: 'Filipino' },
];

export default function ProfileScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const { state, dispatch } = useApp();
  const tierMeta = TIER_META[state.subscriptionTier];
  const [showPaywall, setShowPaywall] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const units = state.units || 'metric';
  const isAnonymous = state.user?.isAnonymous;
  const photoURL = state.user?.photoURL;

  const currentLang =
    LANGUAGES.find(l => l.code === i18n.language)?.label ||
    i18n.language.toUpperCase();

  const handleLanguagePress = useCallback(() => {
    const options = LANGUAGES.map(l => l.label);
    // Use Alert with simple list for now — works cross-platform
    Alert.alert(
      t('profile.language', 'Language'),
      '',
      [
        ...LANGUAGES.map(lang => ({
          text: `${lang.label}${lang.code === i18n.language ? ' ✓' : ''}`,
          onPress: () => {
            i18n.changeLanguage(lang.code);
            dispatch({ type: 'SET_LANGUAGE', payload: lang.code });
          },
        })),
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
      ],
      { cancelable: true },
    );
  }, [i18n, dispatch, t]);

  const handleUnitsToggle = useCallback(() => {
    const next = units === 'metric' ? 'imperial' : 'metric';
    dispatch({ type: 'SET_UNITS', payload: next });
  }, [units, dispatch]);

  const handleLinkGoogle = useCallback(async () => {
    setLinkLoading(true);
    try {
      const result = await firebaseAuthService.linkWithGoogle();
      const u = result.user;
      dispatch({
        type: 'SET_USER',
        payload: {
          uid: u.uid,
          displayName: u.displayName,
          email: u.email,
          photoURL: u.photoURL,
          isAnonymous: false,
          provider: 'google',
        },
      });
      Alert.alert(
        t('profile.linked', 'Account Linked'),
        t(
          'profile.linkedMsg',
          'Your data is now synced with your Google account.',
        ),
      );
    } catch (e) {
      Alert.alert(t('common.error', 'Error'), e.message);
    } finally {
      setLinkLoading(false);
    }
  }, [dispatch, t]);

  const handleLinkApple = useCallback(async () => {
    setLinkLoading(true);
    try {
      const result = await firebaseAuthService.linkWithApple();
      const u = result.user;
      dispatch({
        type: 'SET_USER',
        payload: {
          uid: u.uid,
          displayName: u.displayName,
          email: u.email,
          photoURL: u.photoURL,
          isAnonymous: false,
          provider: 'apple',
        },
      });
      Alert.alert(
        t('profile.linked', 'Account Linked'),
        t(
          'profile.linkedMsg',
          'Your data is now synced with your Apple account.',
        ),
      );
    } catch (e) {
      Alert.alert(t('common.error', 'Error'), e.message);
    } finally {
      setLinkLoading(false);
    }
  }, [dispatch, t]);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      t('profile.signOut', 'Sign Out'),
      t('profile.signOutConfirm', 'Are you sure you want to sign out?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('profile.signOut', 'Sign Out'),
          style: 'destructive',
          onPress: async () => {
            try {
              await firebaseAuthService.signOut();
              dispatch({ type: 'SET_USER', payload: null });
            } catch (e) {
              Alert.alert(t('common.error', 'Error'), e.message);
            }
          },
        },
      ],
    );
  }, [dispatch, t]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      t('profile.deleteAccount', 'Delete Account'),
      t(
        'profile.deleteAccountConfirm',
        'This will permanently delete your account and all data. This cannot be undone.',
      ),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await firebaseAuthService.deleteAccount();
              dispatch({ type: 'SET_USER', payload: null });
            } catch (e) {
              Alert.alert(t('common.error', 'Error'), e.message);
            }
          },
        },
      ],
    );
  }, [dispatch, t]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>🎣</Text>
          )}
        </View>
        <Text style={styles.name}>
          {state.user?.displayName || t('profile.angler', 'Angler')}
        </Text>
        {state.user?.email && (
          <Text style={styles.email}>{state.user.email}</Text>
        )}
        <View
          style={[styles.badge, { backgroundColor: tierMeta?.color || '#888' }]}
        >
          <Text style={styles.badgeText}>
            {tierMeta?.icon} {tierMeta?.label || 'Free'}
          </Text>
        </View>
      </View>

      {/* Account linking banner for anonymous users */}
      {isAnonymous && (
        <View style={styles.linkBanner}>
          <Text style={styles.linkBannerTitle}>
            ⚠️ {t('profile.guestMode', 'Guest Mode')}
          </Text>
          <Text style={styles.linkBannerText}>
            {t(
              'profile.guestWarning',
              'Your data is stored locally. Sign in to sync across devices and prevent data loss.',
            )}
          </Text>
          <View style={styles.linkButtons}>
            <TouchableOpacity
              style={styles.linkBtn}
              onPress={handleLinkGoogle}
              disabled={linkLoading}
            >
              <Text style={styles.linkBtnText}>
                G {t('auth.continueGoogle', 'Google')}
              </Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.linkBtn, styles.linkBtnApple]}
                onPress={handleLinkApple}
                disabled={linkLoading}
              >
                <Text style={styles.linkBtnText}>
                  🍎 {t('auth.continueApple', 'Apple')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('profile.settings', 'Settings')}
        </Text>

        <TouchableOpacity style={styles.row} onPress={handleLanguagePress}>
          <Text style={styles.rowLabel}>
            {t('profile.language', 'Language')}
          </Text>
          <Text style={styles.rowValue}>{currentLang}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={handleUnitsToggle}>
          <Text style={styles.rowLabel}>{t('profile.units', 'Units')}</Text>
          <Text style={styles.rowValue}>
            {units === 'metric'
              ? t('profile.metric', 'Metric')
              : t('profile.imperial', 'Imperial')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowPaywall(true)}
        >
          <Text style={styles.rowLabel}>
            {t('profile.subscription', 'Subscription')}
          </Text>
          <Text style={[styles.rowValue, { color: tierMeta?.color }]}>
            {tierMeta?.label}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('CatchStats')}
        >
          <Text style={styles.rowLabel}>
            📊 {t('profile.catchStats', 'Catch Statistics')}
          </Text>
          <Text style={styles.rowArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.rowLabel}>
            ⚙️ {t('profile.advancedSettings', 'Advanced Settings')}
          </Text>
          <Text style={styles.rowArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Help */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.help', 'Help')}</Text>

        <TouchableOpacity
          style={styles.row}
          onPress={() =>
            Linking.openURL(
              'mailto:translate@profish.app?subject=ProFish Translation Suggestion',
            )
          }
        >
          <Text style={styles.rowLabel}>
            {t('profile.suggestTranslation', 'Suggest Better Translation')}
          </Text>
          <Text style={styles.rowArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() =>
            Linking.openURL(
              'mailto:bugs@profish.app?subject=ProFish Bug Report',
            )
          }
        >
          <Text style={styles.rowLabel}>
            {t('profile.reportBug', 'Report a Bug')}
          </Text>
          <Text style={styles.rowArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>
            {t('profile.about', 'About ProFish')}
          </Text>
          <Text style={styles.rowValue}>v0.1.0</Text>
        </TouchableOpacity>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        {state.isAuthenticated && (
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutText}>
              {t('profile.signOut', 'Sign Out')}
            </Text>
          </TouchableOpacity>
        )}

        {state.isAuthenticated && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.deleteText}>
              {t('profile.deleteAccount', 'Delete Account')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 40 }} />

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
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
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  email: { fontSize: 14, color: '#888', marginBottom: 8 },
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
  rowArrow: { fontSize: 16, color: '#555' },
  signOutButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
    marginBottom: 12,
  },
  signOutText: { fontSize: 16, color: '#FF9800', fontWeight: '600' },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  deleteText: { fontSize: 14, color: '#FF4444' },
  linkBanner: {
    margin: 16,
    padding: 16,
    backgroundColor: 'rgba(255,152,0,0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.3)',
  },
  linkBannerTitle: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  linkBannerText: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  linkButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  linkBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  linkBtnApple: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#333',
  },
  linkBtnText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
  },
});
