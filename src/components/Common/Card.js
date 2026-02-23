/**
 * Card — Shared surface card component
 *
 * Variants:
 *   default  — standard surface card (colors.surface bg)
 *   elevated — with shadow
 *   outlined — border, no fill
 *
 * Usage:
 *   <Card><Text>Content</Text></Card>
 *   <Card variant="elevated" style={{ marginBottom: 24 }}>...</Card>
 *   <Card title="Section Title" icon="trophy">...</Card>
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useTheme from '../../hooks/useTheme';
import { RADIUS, SPACING, SHADOWS } from '../../config/theme';
import { AppIcon } from '../../constants/icons';

export default function Card({
  children,
  variant = 'default',
  title,
  icon,
  padding = SPACING.lg,
  radius = RADIUS.lg,
  style,
  titleStyle,
  ...rest
}) {
  const { colors } = useTheme();

  const containerStyle = [
    { borderRadius: radius, padding },
    variant === 'default' && { backgroundColor: colors.surface },
    variant === 'elevated' && {
      backgroundColor: colors.surface,
      ...SHADOWS.small,
    },
    variant === 'outlined' && {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    style,
  ];

  return (
    <View style={containerStyle} {...rest}>
      {title && (
        <View style={styles.titleRow}>
          {icon && (
            <AppIcon
              name={icon}
              size={20}
              color={colors.text}
              style={{ marginRight: 8 }}
            />
          )}
          <Text style={[styles.title, { color: colors.text }, titleStyle]}>
            {title}
          </Text>
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
});
