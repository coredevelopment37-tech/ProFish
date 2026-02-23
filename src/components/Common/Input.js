/**
 * Input — Shared text input component
 *
 * Features:
 *   - Optional label
 *   - Left/right icons
 *   - Focus & error states
 *   - Multiline / textarea mode
 *
 * Usage:
 *   <Input label="Email" value={email} onChangeText={setEmail} />
 *   <Input label="Notes" multiline placeholder="Add notes..." />
 *   <Input label="Password" secureTextEntry icon="lock" />
 *   <Input error="Required" value="" onChangeText={set} />
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import useTheme from '../../hooks/useTheme';
import { RADIUS, SPACING, FONTS } from '../../config/theme';
import { AppIcon } from '../../constants/icons';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  iconRight,
  onIconRightPress,
  error,
  multiline = false,
  numberOfLines = 4,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize,
  editable = true,
  style,
  inputStyle,
  ...rest
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : focused
    ? colors.primary
    : colors.border;

  const containerStyles = [
    styles.container,
    {
      backgroundColor: colors.surface,
      borderColor,
    },
    multiline && { height: undefined, minHeight: 48 * numberOfLines * 0.5, alignItems: 'flex-start' },
    !editable && { opacity: 0.5 },
    style,
  ];

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}

      <View style={containerStyles}>
        {icon && (
          <AppIcon
            name={icon}
            size={20}
            color={focused ? colors.primary : colors.textSecondary}
            style={{ marginRight: 8 }}
          />
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            { color: colors.text },
            multiline && { paddingTop: 12 },
            inputStyle,
          ]}
          {...rest}
        />

        {iconRight && (
          <TouchableOpacity
            onPress={onIconRightPress}
            disabled={!onIconRightPress}
            style={{ marginLeft: 8 }}
          >
            <AppIcon
              name={iconRight}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONTS.label?.fontSize || 13,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});
