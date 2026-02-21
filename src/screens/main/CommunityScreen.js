/**
 * CommunityScreen — Social feed (Phase 1: basic)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function CommunityScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('community.title', 'Community')}</Text>
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🌊</Text>
        <Text style={styles.emptyText}>
          {t(
            'community.comingSoon',
            'Community feed coming soon! Share your catches with anglers worldwide.',
          )}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    padding: 20,
    paddingTop: 60,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 20 },
  emptyText: { fontSize: 16, color: '#888', textAlign: 'center' },
});
