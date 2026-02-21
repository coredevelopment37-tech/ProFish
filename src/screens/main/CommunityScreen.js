/**
 * CommunityScreen — Social feed (Phase 1: polished preview)
 * Shows feature preview cards and "coming soon" state
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const PREVIEW_FEATURES = [
  {
    icon: '📸',
    titleKey: 'shareYourCatch',
    descKey: 'shareDesc',
    defaultTitle: 'Share Your Catches',
    defaultDesc:
      'Post photos and stats from your fishing trips for the world to see.',
  },
  {
    icon: '🏆',
    titleKey: 'topAnglers',
    descKey: 'topAnglersDesc',
    defaultTitle: 'Top Anglers',
    defaultDesc:
      'Compete on leaderboards and earn badges for your fishing achievements.',
  },
  {
    icon: '📍',
    titleKey: 'nearby',
    descKey: 'nearbyDesc',
    defaultTitle: 'Nearby Anglers',
    defaultDesc:
      'Discover what people are catching near your location right now.',
  },
  {
    icon: '💬',
    titleKey: 'feed',
    descKey: 'feedDesc',
    defaultTitle: 'Community Feed',
    defaultDesc:
      'Tips, techniques, and stories from anglers in 100+ countries.',
  },
];

export default function CommunityScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.header}>{t('community.title', 'Community')}</Text>
        <Text style={styles.subtitle}>
          {t(
            'community.comingSoon',
            'Community feed coming soon! Share your catches with anglers worldwide.',
          )}
        </Text>
      </View>

      {/* Feature preview cards */}
      <View style={styles.cards}>
        {PREVIEW_FEATURES.map((feature, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardIcon}>{feature.icon}</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>
                {t(`community.${feature.titleKey}`, feature.defaultTitle)}
              </Text>
              <Text style={styles.cardDesc}>{feature.defaultDesc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={styles.ctaSection}>
        <View style={styles.ctaBadge}>
          <Text style={styles.ctaBadgeText}>Coming in v1.1</Text>
        </View>
        <Text style={styles.ctaText}>
          We're building the world's largest fishing community.
          {'\n'}Be among the first to join.
        </Text>
        <TouchableOpacity style={styles.notifyButton} activeOpacity={0.7}>
          <Text style={styles.notifyButtonText}>🔔 Notify Me</Text>
        </TouchableOpacity>
      </View>

      {/* Stats preview */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>260M+</Text>
          <Text style={styles.statLabel}>Anglers Worldwide</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>100+</Text>
          <Text style={styles.statLabel}>Countries</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>24</Text>
          <Text style={styles.statLabel}>Languages</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  headerSection: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    lineHeight: 22,
  },
  cards: {
    padding: 20,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 18,
    alignItems: 'flex-start',
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 14,
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  ctaSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  ctaBadge: {
    backgroundColor: '#0080FF20',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 16,
  },
  ctaBadgeText: {
    color: '#0080FF',
    fontSize: 13,
    fontWeight: '600',
  },
  ctaText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  notifyButton: {
    backgroundColor: '#0080FF',
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  notifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#1a1a2e',
    marginHorizontal: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0080FF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
});
