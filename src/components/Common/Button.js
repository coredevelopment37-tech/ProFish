/**
 * Button — Shared button component with consistent styling
 *
 * Variants:
 *   primary   — filled blue CTA (default)
 *   secondary — transparent with border
 *   outline   — same as secondary (alias)
 *   danger    — filled red/error
 *   ghost     — no border, no fill (text only)
 *
 * Sizes: sm | md (default) | lg
 *
 * Usage:
 *   <Button title="Save" onPress={handleSave} />
 *   <Button title="Delete" variant="danger" icon="trash" onPress={handleDelete} />
 *   <Button title="Cancel" variant="secondary" size="sm" onPress={onCancel} />
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import useTheme from '../../hooks/useTheme';
import { AppIcon } from '../../constants/icons';

const SIZES = {
  sm: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 14, iconSize: 16, minHeight: 40 },
  md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 16, iconSize: 18, minHeight: 48 },
  lg: { paddingVertical: 16, paddingHorizontal: 32, fontSize: 18, iconSize: 20, minHeight: 56 },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
  textStyle,
  ...rest
}) {
  const { colors } = useTheme();
  const sizeConfig = SIZES[size] || SIZES.md;
  const v = variant === 'outline' ? 'secondary' : variant;

  const containerStyle = [
    styles.base,
    {
      paddingVertical: sizeConfig.paddingVertical,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      minHeight: sizeConfig.minHeight,
    },
    // Variant styles
    v === 'primary' && { backgroundColor: colors.primary, borderRadius: 14 },
    v === 'secondary' && {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 14,
    },
    v === 'danger' && { backgroundColor: colors.error, borderRadius: 14 },
    v === 'ghost' && { backgroundColor: 'transparent', borderRadius: 14 },
    // Width
    fullWidth && styles.fullWidth,
    // Disabled
    (disabled || loading) && { opacity: 0.5 },
    style,
  ];

  const textColor =
    v === 'primary' ? '#FFFFFF' :
    v === 'danger' ? '#FFFFFF' :
    v === 'secondary' ? colors.textSecondary :
    v === 'ghost' ? colors.primary :
    colors.text;

  const labelStyle = [
    {
      fontSize: sizeConfig.fontSize,
      fontWeight: '700',
      color: textColor,
    },
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={title}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon && !iconRight && (
            <AppIcon
              name={icon}
              size={sizeConfig.iconSize}
              color={textColor}
              style={{ marginRight: 8 }}
            />
          )}
          <Text style={labelStyle}>{title}</Text>
          {icon && iconRight && (
            <AppIcon
              name={icon}
              size={sizeConfig.iconSize}
              color={textColor}
              style={{ marginLeft: 8 }}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
