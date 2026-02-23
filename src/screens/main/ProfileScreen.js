/**
 * ProfileScreen — User profile, settings, subscription
 * Fully interactive: language picker, units toggle, sign out, paywall
 */

import React, { useState, useCallback, useEffect } from 'react';
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
  Share,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/AppContext';
import subscriptionService, {
  TIER_META,
} from '../../services/subscriptionService';
import firebaseAuthService from '../../services/firebaseAuthService';
import catchService from '../../services/catchService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PaywallModal from '../../components/PaywallModal';
import useTheme from '../../hooks/useTheme';
import { AppIcon } from '../../constants/icons';
import { Button, Card, ScreenHeader } from '../../components/Common';

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
  const { colors, fonts, spacing, shadows } = useTheme();
  const styles = createStyles(colors);
  const { t, i18n } = useTranslation();
  const { state, dispatch } = useApp();
  const tierMeta = TIER_META[state.subscriptionTier];
  const [showPaywall, setShowPaywall] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [subInfo, setSubInfo] = useState({
    tier: 'free',
    days: null,
    expiring: false,
  });
  const [favoriteSpecies, setFavoriteSpecies] = useState([]);
  const [exporting, setExporting] = useState(false);
  const units = state.units || 'metric';
  const isAnonymous = state.user?.isAnonymous;
  const photoURL = state.user?.photoURL;

  useEffect(() => {
    async function loadSubInfo() {
      try {
        const tier = subscriptionService.getCurrentTier();
        const days = subscriptionService.getDaysRemaining();
        const expiring = subscriptionService.isExpiringSoon();
        setSubInfo({ tier, days, expiring });
      } catch {}
    }
    loadSubInfo();
  }, [state.subscriptionTier]);

  // Load favorite species from storage
  useEffect(() => {
    async function loadFavSpecies() {
      try {
        const stored = await AsyncStorage.getItem('@profish_favorite_species');
        if (stored) setFavoriteSpecies(JSON.parse(stored));
      } catch {}
    }
    loadFavSpecies();
  }, []);

  const handleToggleFavoriteSpecies = useCallback(async () => {
    const COMMON_SPECIES = [
      'Bass',
      'Trout',
      'Salmon',
      'Pike',
      'Catfish',
      'Walleye',
      'Perch',
      'Crappie',
      'Carp',
      'Bluegill',
      'Snapper',
      'Grouper',
      'Tuna',
      'Marlin',
      'Cod',
      'Halibut',
      'Redfish',
      'Mahi-Mahi',
      'Tarpon',
      'Bonefish',
    ];
    Alert.alert(
      t('profile.favoriteSpecies', 'Favorite Species'),
      t(
        'profile.favoriteSpeciesDesc',
        'Select species to show first when logging catches.',
      ),
      [
        ...COMMON_SPECIES.map(sp => ({
          text: `${favoriteSpecies.includes(sp) ? '✓ ' : ''}${sp}`,
          onPress: async () => {
            const updated = favoriteSpecies.includes(sp)
              ? favoriteSpecies.filter(s => s !== sp)
              : [...favoriteSpecies, sp];
            setFavoriteSpecies(updated);
            await AsyncStorage.setItem(
              '@profish_favorite_species',
              JSON.stringify(updated),
            );
          },
        })),
        { text: t('common.done', 'Done'), style: 'cancel' },
      ],
      { cancelable: true },
    );
  }, [favoriteSpecies, t]);

  // GDPR Export
  const handleExportData = useCallback(async () => {
    setExporting(true);
    try {
      const allCatches = await catchService.getCatches();
      const keys = await AsyncStorage.getAllKeys();
      const profishKeys = keys.filter(k => k.startsWith('@profish'));
      const pairs = await AsyncStorage.multiGet(profishKeys);
      const preferences = {};
      pairs.forEach(([k, v]) => {
        try {
          preferences[k] = JSON.parse(v);
        } catch {
          preferences[k] = v;
        }
      });

      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        user: {
          uid: state.user?.uid || null,
          displayName: state.user?.displayName || null,
          email: state.user?.email || null,
        },
        catches: allCatches,
        preferences,
        subscriptionTier: state.subscriptionTier || 'free',
        language: i18n.language,
        units,
      };

      const json = JSON.stringify(exportData, null, 2);
      await Share.share({
        title: 'ProFish Data Export',
        message: json,
      });
    } catch (e) {
      Alert.alert(
        t('common.error', 'Error'),
        t('profile.exportError', 'Failed to export data. Please try again.'),
      );
    } finally {
      setExporting(false);
    }
  }, [state, i18n.language, units, t]);

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

  const handleThemeToggle = useCallback(() => {
    const next = (state.theme || 'dark') === 'dark' ? 'light' : 'dark';
    dispatch({ type: 'SET_THEME', payload: next });
  }, [state.theme, dispatch]);

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
      <ScreenHeader
        variant="actions"
        title={t('profile.title', 'Profile')}
        rightActions={[{ icon: 'settings', onPress: () => navigation.navigate('Settings') }]}
      />
      <View style={styles.header}>
        <View style={styles.avatar}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.avatarImage} />
          ) : (
            <AppIcon name="fish" size={32} color={colors.primary} />
          )}
        </View>
        <Text style={styles.name}>
          {state.user?.displayName || t('profile.angler', 'Angler')}
        </Text>
        {state.user?.email && (
          <Text style={styles.email}>{state.user.email}</Text>
        )}
        <View
          style={[styles.badge, { backgroundColor: tierMeta?.color || colors.textTertiary }]}
        >
          <Text style={styles.badgeText}>
            {tierMeta?.icon} {tierMeta?.label || 'Free'}
          </Text>
        </View>
      </View>

      {/* Account linking banner for anonymous users */}
      {isAnonymous && (
        <View style={styles.linkBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppIcon name="alertTriangle" size={14} color={colors.warning} />
            <Text style={styles.linkBannerTitle}>
              {t('profile.guestMode', 'Guest Mode')}
            </Text>
          </View>
          <Text style={styles.linkBannerText}>
            {t(
              'profile.guestWarning',
              'Your data is stored locally. Sign in to sync across devices and prevent data loss.',
            )}
          </Text>
          <View style={styles.linkButtons}>
            <Button
              title="Google"
              onPress={handleLinkGoogle}
              variant="secondary"
              size="sm"
              icon="chrome"
              disabled={linkLoading}
              fullWidth={false}
              style={{ backgroundColor: '#fff' }}
              textStyle={{ color: '#000' }}
            />
            {Platform.OS === 'ios' && (
              <Button
                title="Apple"
                onPress={handleLinkApple}
                variant="secondary"
                size="sm"
                icon="apple"
                disabled={linkLoading}
                fullWidth={false}
                style={{ backgroundColor: '#000' }}
              />
            )}
          </View>
        </View>
      )}

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('profile.settings', 'Settings')}
        </Text>

        <TouchableOpacity
          style={styles.row}
          onPress={handleLanguagePress}
          accessibilityLabel={
            t('profile.language', 'Language') + ': ' + currentLang
          }
          accessibilityRole="button"
        >
          <Text style={styles.rowLabel}>
            {t('profile.language', 'Language')}
          </Text>
          <Text style={styles.rowValue}>{currentLang}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={handleUnitsToggle}
          accessibilityLabel={t('profile.units', 'Units')}
          accessibilityRole="button"
        >
          <Text style={styles.rowLabel}>{t('profile.units', 'Units')}</Text>
          <Text style={styles.rowValue}>
            {units === 'metric'
              ? t('profile.metric', 'Metric')
              : t('profile.imperial', 'Imperial')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={handleThemeToggle}
          accessibilityLabel={t('profile.theme', 'Theme')}
          accessibilityRole="button"
        >
          <Text style={styles.rowLabel}>{t('profile.theme', 'Theme')}</Text>
          <Text style={styles.rowValue}>
            {(state.theme || 'dark') === 'dark'
              ? t('profile.darkMode', 'Dark')
              : t('profile.lightMode', 'Light')}
          </Text>
          <AppIcon
            name={(state.theme || 'dark') === 'dark' ? 'moon' : 'sun'}
            size={18}
            color={colors.textTertiary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowPaywall(true)}
          accessibilityLabel={t('profile.subscription', 'Subscription')}
          accessibilityRole="button"
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
          accessibilityLabel={t('profile.catchStats', 'Catch Statistics')}
          accessibilityRole="button"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppIcon name="barChart" size={20} color={colors.text} />
            <Text style={styles.rowLabel}>
              {t('profile.catchStats', 'Catch Statistics')}
            </Text>
          </View>
          <Text style={styles.rowArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('Settings')}
          accessibilityLabel={t(
            'profile.advancedSettings',
            'Advanced Settings',
          )}
          accessibilityRole="button"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppIcon name="settings" size={20} color={colors.text} />
            <Text style={styles.rowLabel}>
              {t('profile.advancedSettings', 'Advanced Settings')}
            </Text>
          </View>
          <Text style={styles.rowArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={handleToggleFavoriteSpecies}
          accessibilityLabel={t('profile.favoriteSpecies', 'Favorite Species')}
          accessibilityRole="button"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <AppIcon name="star" size={18} color="#FFD700" />
            <Text style={styles.rowLabel}>
              {t('profile.favoriteSpecies', 'Favorite Species')}
            </Text>
          </View>
          <Text style={styles.rowValue}>
            {favoriteSpecies.length
              ? `${favoriteSpecies.length} ${t('profile.selected', 'selected')}`
              : t('profile.none', 'None')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={handleExportData}
          disabled={exporting}
          accessibilityLabel={t('profile.exportData', 'Export My Data')}
          accessibilityRole="button"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppIcon name="download" size={20} color={colors.text} />
            <Text style={styles.rowLabel}>
              {t('profile.exportData', 'Export My Data')}
            </Text>
          </View>
          <Text style={styles.rowValue}>{exporting ? '...' : 'JSON'}</Text>
        </TouchableOpacity>
      </View>

      {/* Subscription Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('profile.subscriptionStatus', 'Subscription')}
        </Text>
        <Card radius={14}>
          <View style={styles.subCardHeader}>
            <View
              style={[
                styles.subTierBadge,
                { backgroundColor: tierMeta?.color || colors.textTertiary },
              ]}
            >
              <Text style={styles.subTierText}>
                {tierMeta?.icon} {tierMeta?.label || 'Free'}
              </Text>
            </View>
            {subInfo.tier !== 'free' && subInfo.days != null && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {subInfo.expiring && (
                  <AppIcon name="alertTriangle" size={16} color={colors.warning} />
                )}
                <Text
                  style={[
                    styles.subDays,
                    subInfo.expiring && { color: colors.warning },
                  ]}
                >
                  {subInfo.expiring
                    ? t('profile.expiringSoon', 'Expires in {{days}} days', {
                        days: subInfo.days,
                      })
                    : t('profile.daysRemaining', '{{days}} days remaining', {
                        days: subInfo.days,
                      })}
                </Text>
              </View>
            )}
          </View>
          {subInfo.tier === 'free' ? (
            <Button
              title={t('profile.upgradePro', 'Upgrade to Pro')}
              onPress={() => setShowPaywall(true)}
              variant="primary"
              size="md"
            />
          ) : (
            <Button
              title={t('profile.manageSubscription', 'Manage Subscription')}
              onPress={() => {
                const url =
                  Platform.OS === 'ios'
                    ? 'https://apps.apple.com/account/subscriptions'
                    : 'https://play.google.com/store/account/subscriptions';
                Linking.openURL(url).catch(() => {});
              }}
              variant="ghost"
              size="md"
            />
          )}
        </Card>
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
          <Button
            title={t('profile.signOut', 'Sign Out')}
            onPress={handleSignOut}
            variant="secondary"
            size="md"
            textStyle={{ color: colors.warning }}
          />
        )}

        {state.isAuthenticated && (
          <Button
            title={t('profile.deleteAccount', 'Delete Account')}
            onPress={handleDeleteAccount}
            variant="ghost"
            size="sm"
            textStyle={{ color: colors.error }}
          />
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

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    alignItems: 'center',
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
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
  name: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  email: { fontSize: 14, color: colors.textTertiary, marginBottom: 8 },
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
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  rowLabel: { fontSize: 16, color: colors.text },
  rowValue: { fontSize: 16, color: colors.textTertiary },
  rowArrow: { fontSize: 16, color: colors.textDisabled },

  linkBanner: {
    margin: 16,
    padding: 16,
    backgroundColor: 'rgba(255,152,0,0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.3)',
  },
  linkBannerTitle: {
    color: colors.warning,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  linkBannerText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  linkButtons: {
    flexDirection: 'row',
    gap: 10,
  },


  subCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subTierBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  subTierText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  subDays: {
    fontSize: 13,
    color: colors.textTertiary,
  },

});
