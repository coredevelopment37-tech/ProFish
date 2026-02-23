/**
 * ScreenHeader — Shared header component for all screens
 *
 * Variants:
 *   back     — ← arrow + title (row)           CatchStatsScreen, LeaderboardScreen
 *   large    — ← arrow + large title (stacked)  IsItLegalScreen, TripPlannerScreen
 *   actions  — title + right actions (no back)  FishCastScreen, CommunityScreen
 *   modal    — Cancel / Title / Save            LogCatchScreen
 *
 * Usage:
 *   <ScreenHeader title="Stats" onBack={() => nav.goBack()} />
 *   <ScreenHeader variant="large" title="Trip Planner" onBack={goBack} />
 *   <ScreenHeader variant="actions" title="FishCast"
 *     rightActions={[{ icon: 'settings', onPress: openSettings }]} />
 *   <ScreenHeader variant="modal" title="Log Catch"
 *     onCancel={close} onSave={save} saveLabel="Done" />
 */

import React from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import useTheme from '../../hooks/useTheme';
import { SPACING } from '../../config/theme';
import { AppIcon } from '../../constants/icons';

const TOP_PADDING = Platform.OS === 'ios' ? 56 : 16;

export default function ScreenHeader({
  title,
  subtitle,
  variant = 'back',
  onBack,
  onCancel,
  onSave,
  saveLabel = 'Save',
  saveDisabled = false,
  rightActions = [],
  style,
}) {
  const { colors } = useTheme();

  // ── Modal header: Cancel / Title / Save ──
  if (variant === 'modal') {
    return (
      <View style={[styles.modalRow, { paddingTop: TOP_PADDING }, style]}>
        <TouchableOpacity onPress={onCancel} hitSlop={12}>
          <Text style={[styles.modalAction, { color: colors.textSecondary }]}>
            Cancel
          </Text>
        </TouchableOpacity>

        <Text
          style={[styles.modalTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {title}
        </Text>

        <TouchableOpacity
          onPress={onSave}
          disabled={saveDisabled}
          hitSlop={12}
        >
          <Text
            style={[
              styles.modalAction,
              {
                color: saveDisabled ? colors.textMuted : colors.primary,
                fontWeight: '700',
              },
            ]}
          >
            {saveLabel}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Large variant: ← arrow then large title below ──
  if (variant === 'large') {
    return (
      <View style={[styles.largeContainer, { paddingTop: TOP_PADDING }, style]}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
            <AppIcon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={[styles.largeTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
    );
  }

  // ── Actions variant: title left + icon buttons right ──
  if (variant === 'actions') {
    return (
      <View style={[styles.row, { paddingTop: TOP_PADDING }, style]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
        <View style={styles.actionsRow}>
          {rightActions.map((action, i) => (
            <TouchableOpacity
              key={i}
              onPress={action.onPress}
              style={styles.actionBtn}
              hitSlop={8}
            >
              <AppIcon
                name={action.icon}
                size={22}
                color={action.color || colors.text}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  // ── Default "back" variant: ← arrow + title row ──
  return (
    <View style={[styles.row, { paddingTop: TOP_PADDING }, style]}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
          <AppIcon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
      )}
      <Text
        style={[styles.title, { color: colors.text, flex: 1 }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={styles.actionsRow}>
        {rightActions.map((action, i) => (
          <TouchableOpacity
            key={i}
            onPress={action.onPress}
            style={styles.actionBtn}
            hitSlop={8}
          >
            <AppIcon
              name={action.icon}
              size={22}
              color={action.color || colors.text}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Row (back + actions) ──
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    marginRight: 12,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    marginLeft: 16,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Large ──
  largeContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  largeTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },

  // ── Modal ──
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalAction: {
    fontSize: 16,
    fontWeight: '600',
  },
});
