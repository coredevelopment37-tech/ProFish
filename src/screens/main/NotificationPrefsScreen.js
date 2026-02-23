/**
 * NotificationPrefsScreen — ProFish
 *
 * Toggle notification preferences per category:
 *   - Social (followers, comments, likes)
 *   - FishCast alerts (threshold slider)
 *   - Community (trending, leaderboard)
 *   - System (updates, weekly digest)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import notificationService from '../../services/notificationService';
import useTheme from '../../hooks/useTheme';

function Section({ title, children }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ToggleRow({ label, description, value, onToggle }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description ? <Text style={styles.rowDesc}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primaryDark }}
        thumbColor={value ? colors.primary : colors.textTertiary}
        ios_backgroundColor={colors.border}
        accessibilityLabel={`${label} toggle`}
        accessibilityRole="switch"
      />
    </View>
  );
}

export default function NotificationPrefsScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState(null);

  useEffect(() => {
    notificationService.getPrefs().then(setPrefs);
  }, []);

  const updatePref = useCallback(
    (key, value) => {
      const updated = { ...prefs, [key]: value };
      setPrefs(updated);
      notificationService.updatePrefs({ [key]: value });
    },
    [prefs],
  );

  if (!prefs) return null;

  const THRESHOLD_OPTIONS = [60, 70, 80, 90];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Master toggle */}
        <Section title="General">
          <ToggleRow
            label="Push Notifications"
            description="Enable or disable all push notifications"
            value={prefs.enabled}
            onToggle={v => updatePref('enabled', v)}
          />
        </Section>

        {/* Social */}
        <Section title="Social">
          <ToggleRow
            label="New Followers"
            description="When someone follows you"
            value={prefs.newFollower}
            onToggle={v => updatePref('newFollower', v)}
          />
          <ToggleRow
            label="Comments"
            description="When someone comments on your post"
            value={prefs.commentOnPost}
            onToggle={v => updatePref('commentOnPost', v)}
          />
          <ToggleRow
            label="Like Milestones"
            description="When a post hits 10, 50, or 100 likes"
            value={prefs.likeMilestone}
            onToggle={v => updatePref('likeMilestone', v)}
          />
        </Section>

        {/* FishCast */}
        <Section title="FishCast Alerts">
          <ToggleRow
            label="FishCast Alerts"
            description="Get notified when fishing conditions are great"
            value={prefs.fishcastAlerts}
            onToggle={v => updatePref('fishcastAlerts', v)}
          />

          {prefs.fishcastAlerts && (
            <View style={styles.thresholdRow}>
              <Text style={styles.thresholdLabel}>Minimum Score</Text>
              <View style={styles.thresholdOptions}>
                {THRESHOLD_OPTIONS.map(val => (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.thresholdBtn,
                      prefs.fishcastThreshold === val &&
                        styles.thresholdBtnActive,
                    ]}
                    onPress={() => updatePref('fishcastThreshold', val)}
                    accessibilityLabel={`Minimum score ${val}`}
                    accessibilityRole="radio"
                  >
                    <Text
                      style={[
                        styles.thresholdText,
                        prefs.fishcastThreshold === val &&
                          styles.thresholdTextActive,
                      ]}
                    >
                      {val}+
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </Section>

        {/* Community */}
        <Section title="Community">
          <ToggleRow
            label="Trending Posts"
            description="Posts trending in your region"
            value={prefs.trendingPosts}
            onToggle={v => updatePref('trendingPosts', v)}
          />
          <ToggleRow
            label="Leaderboard Changes"
            description="When your ranking changes"
            value={prefs.leaderboardChanges}
            onToggle={v => updatePref('leaderboardChanges', v)}
          />
        </Section>

        {/* System */}
        <Section title="System">
          <ToggleRow
            label="App Updates"
            description="New features and improvements"
            value={prefs.appUpdates}
            onToggle={v => updatePref('appUpdates', v)}
          />
          <ToggleRow
            label="Weekly Digest"
            description="Weekly summary of your fishing activity"
            value={prefs.weeklyDigest}
            onToggle={v => updatePref('weeklyDigest', v)}
          />
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Push notifications require permission from your device.
            {Platform.OS === 'ios'
              ? ' Go to Settings → ProFish to manage system-level permissions.'
              : ' Go to Settings → Apps → ProFish → Notifications.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: colors.surface,
  },
  backBtn: { padding: 8 },
  backText: { color: colors.text, fontSize: 22 },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },

  scrollContent: { paddingBottom: 40 },

  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowText: { flex: 1, marginRight: 12 },
  rowLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  rowDesc: { color: colors.textTertiary, fontSize: 12, marginTop: 2 },

  thresholdRow: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  thresholdLabel: { color: colors.textSecondary, fontSize: 14, marginBottom: 10 },
  thresholdOptions: { flexDirection: 'row', gap: 10 },
  thresholdBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thresholdBtnActive: {
    backgroundColor: colors.primary + '22',
    borderColor: colors.primary,
  },
  thresholdText: { color: colors.textTertiary, fontSize: 14, fontWeight: '600' },
  thresholdTextActive: { color: colors.primary },

  footer: { padding: 24 },
  footerText: {
    color: colors.textDisabled,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
