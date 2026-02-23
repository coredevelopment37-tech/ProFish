/**
 * UpgradePrompt — Inline upgrade nudge for tier-gated features
 * Displays a card prompting user to upgrade their subscription
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import useTheme from '../hooks/useTheme';
import { AppIcon } from '../constants/icons';

const TIER_CONFIG = {
  pro: { name: 'Pro', icon: 'star' },
  elite: { name: 'Elite', color: '#E040FB', icon: 'crown' },
};

export default function UpgradePrompt({
  requiredTier = 'pro',
  featureName = 'this feature',
  onUpgrade,
  compact = false,
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const config = TIER_CONFIG[requiredTier] || TIER_CONFIG.pro;
  const tier = { ...config, color: config.color || colors.accent };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactRow} onPress={onUpgrade}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <AppIcon name={tier.icon} size={16} color={tier.color} />
          <Text style={[styles.compactText, { marginLeft: 6 }]}>
            Upgrade to {tier.name} to unlock {featureName}
          </Text>
        </View>
        <Text style={[styles.compactArrow, { color: tier.color }]}>→</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, { borderColor: tier.color }]}>
      <AppIcon name={tier.icon} size={40} color={tier.color} style={{ marginBottom: 12 }} />
      <Text style={styles.title}>Unlock {featureName}</Text>
      <Text style={styles.subtitle}>
        Upgrade to {tier.name} to access this feature and much more.
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: tier.color }]}
        onPress={onUpgrade}
      >
        <Text style={styles.buttonText}>Upgrade to {tier.name}</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    marginVertical: 12,
    marginHorizontal: 16,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '1A',
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 16,
  },
  compactText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  compactArrow: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
});
