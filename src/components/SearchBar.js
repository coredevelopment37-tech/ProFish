/**
 * SearchBar — Reusable search input with debounced query
 * Used for species search, location search, catch filtering, etc.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import useTheme from '../hooks/useTheme';
import { AppIcon } from '../constants/icons';

export default function SearchBar({
  placeholder,
  value,
  onChangeText,
  onSubmit,
  onClear,
  debounceMs = 300,
  autoFocus = false,
  showClear = true,
  style,
  inputStyle,
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [localValue, setLocalValue] = useState(value || '');
  const debounceRef = useRef(null);

  // Sync external value changes
  useEffect(() => {
    if (value !== undefined) {
      setLocalValue(value);
    }
  }, [value]);

  const handleChange = useCallback(
    text => {
      setLocalValue(text);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        onChangeText?.(text);
      }, debounceMs);
    },
    [onChangeText, debounceMs],
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChangeText?.('');
    onClear?.();
  }, [onChangeText, onClear]);

  const handleSubmit = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    onChangeText?.(localValue);
    onSubmit?.(localValue);
    Keyboard.dismiss();
  }, [localValue, onChangeText, onSubmit]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <View style={[styles.container, style]}>
      <AppIcon name="search" size={18} color={colors.textTertiary} />
      <TextInput
        style={[styles.input, inputStyle]}
        value={localValue}
        onChangeText={handleChange}
        onSubmitEditing={handleSubmit}
        placeholder={placeholder || t('common.search', 'Search...')}
        placeholderTextColor={colors.textTertiary}
        autoFocus={autoFocus}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityRole="search"
        accessibilityLabel={placeholder || 'Search'}
      />
      {showClear && localValue.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Clear search"
        >
          <AppIcon name="x" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 0,
    height: 44,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  clearText: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
