/**
 * LeaderboardScreen — ProFish Community Leaderboards & Badges
 *
 * Features:
 * - Global leaderboard (catches, weight, species diversity)
 * - Personal milestone badges
 * - Badge progress tracking
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/AppContext';
import catchService from '../../services/catchService';
import communityService from '../../services/communityService';
import badgeService, { BADGE_DEFINITIONS } from '../../services/badgeService';

const LEADERBOARD_CATEGORIES = [
  { key: 'catches', label: 'Total Catches', icon: '🎣' },
  { key: 'weight', label: 'Biggest Catch', icon: '⚖️' },
  { key: 'species', label: 'Species Count', icon: '🐟' },
];

export default function LeaderboardScreen({ navigation }) {
  const { t } = useTranslation();
  const { state } = useApp();
  const [tab, setTab] = useState('leaderboard'); // 'leaderboard' | 'badges'
  const [category, setCategory] = useState('catches');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState(null);
  const [catches, setCatches] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [catchData, feedData] = await Promise.all([
        catchService.getCatches(),
        communityService.getFeed({ limit: 100 }).catch(() => ({ items: [] })),
      ]);
      setCatches(catchData);

      // Build leaderboard from community feed + own data
      const users = {};
      const myId = state.userId || 'me';

      // Add self
      users[myId] = {
        id: myId,
        name: state.displayName || t('community.you', 'You'),
        catches: catchData.length,
        weight: Math.max(...catchData.map(c => c.weight || 0), 0),
        species: new Set(catchData.map(c => c.species).filter(Boolean)).size,
        isMe: true,
      };

      // Add community members from feed
      const feedItems = feedData.items || feedData || [];
      feedItems.forEach(item => {
        if (!item.userId || item.userId === myId) return;
        if (!users[item.userId]) {
          users[item.userId] = {
            id: item.userId,
            name: item.userName || item.displayName || 'Angler',
            catches: 0,
            weight: 0,
            species: new Set(),
            isMe: false,
          };
        }
        users[item.userId].catches++;
        if (item.weight) {
          users[item.userId].weight = Math.max(
            users[item.userId].weight,
            item.weight,
          );
        }
        if (item.species) {
          if (users[item.userId].species instanceof Set) {
            users[item.userId].species.add(item.species);
          }
        }
      });

      // Convert species sets to counts
      const processed = Object.values(users).map(u => ({
        ...u,
        species: u.species instanceof Set ? u.species.size : u.species || 0,
      }));

      setLeaderboard(processed);

      // Evaluate badges
      const badgeResult = await badgeService.evaluateBadges(catchData);
      setBadges(badgeResult);
    } catch (e) {
      console.warn('[Leaderboard] Load error:', e);
    } finally {
      setLoading(false);
    }
  }

  // Sort leaderboard by current category
  const sortedLeaderboard = useMemo(() => {
    return [...leaderboard].sort((a, b) => {
      if (category === 'catches') return b.catches - a.catches;
      if (category === 'weight') return b.weight - a.weight;
      return b.species - a.species;
    });
  }, [leaderboard, category]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel={t('common.back', 'Go back')}
          accessibilityRole="button"
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {t('leaderboard.title', 'Leaderboard')}
        </Text>
      </View>

      {/* Tab selector */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'leaderboard' && styles.tabBtnActive]}
          onPress={() => setTab('leaderboard')}
          accessibilityRole="tab"
        >
          <Text
            style={[
              styles.tabText,
              tab === 'leaderboard' && styles.tabTextActive,
            ]}
          >
            🏆 {t('leaderboard.rankings', 'Rankings')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'badges' && styles.tabBtnActive]}
          onPress={() => setTab('badges')}
          accessibilityRole="tab"
        >
          <Text
            style={[styles.tabText, tab === 'badges' && styles.tabTextActive]}
          >
            🏅 {t('leaderboard.badges', 'Badges')}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#0080FF" />
        </View>
      ) : tab === 'leaderboard' ? (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Category chips */}
          <View style={styles.categoryRow}>
            {LEADERBOARD_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryChip,
                  category === cat.key && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(cat.key)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === cat.key && styles.categoryTextActive,
                  ]}
                >
                  {cat.icon} {t(`leaderboard.${cat.key}`, cat.label)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Leaderboard list */}
          {sortedLeaderboard.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyText}>
                {t(
                  'leaderboard.empty',
                  'No rankings yet. Start logging catches!',
                )}
              </Text>
            </View>
          ) : (
            sortedLeaderboard.map((user, idx) => {
              const rank = idx + 1;
              const value =
                category === 'catches'
                  ? user.catches
                  : category === 'weight'
                  ? `${user.weight.toFixed(1)} kg`
                  : user.species;
              const medal =
                rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';

              return (
                <View
                  key={user.id}
                  style={[styles.rankRow, user.isMe && styles.rankRowMe]}
                >
                  <View style={styles.rankBadge}>
                    {medal ? (
                      <Text style={styles.rankMedal}>{medal}</Text>
                    ) : (
                      <Text style={styles.rankNumber}>{rank}</Text>
                    )}
                  </View>
                  <View style={styles.rankInfo}>
                    <Text
                      style={[styles.rankName, user.isMe && styles.rankNameMe]}
                    >
                      {user.name}
                      {user.isMe ? ` (${t('community.you', 'You')})` : ''}
                    </Text>
                  </View>
                  <Text style={styles.rankValue}>{value}</Text>
                </View>
              );
            })
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      ) : (
        /* Badges tab */
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Badge progress */}
          {badges && (
            <View style={styles.badgeProgress}>
              <Text style={styles.badgeProgressCount}>
                {badges.earned.length}
              </Text>
              <Text style={styles.badgeProgressLabel}>
                / {badges.total}{' '}
                {t('leaderboard.badgesEarned', 'badges earned')}
              </Text>
              <View style={styles.badgeProgressBar}>
                <View
                  style={[
                    styles.badgeProgressFill,
                    {
                      width: `${Math.round(badges.progress * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* All badges by category */}
          {Object.entries(badgeService.getBadgesByCategory()).map(
            ([category, categoryBadges]) => {
              const earnedIds = new Set((badges?.earned || []).map(b => b.id));
              return (
                <View key={category} style={styles.badgeSection}>
                  <Text style={styles.badgeSectionTitle}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                  <View style={styles.badgeGrid}>
                    {categoryBadges.map(badge => {
                      const isEarned = earnedIds.has(badge.id);
                      return (
                        <View
                          key={badge.id}
                          style={[
                            styles.badgeCard,
                            !isEarned && styles.badgeCardLocked,
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeIcon,
                              !isEarned && styles.badgeIconLocked,
                            ]}
                          >
                            {isEarned ? badge.icon : '🔒'}
                          </Text>
                          <Text
                            style={[
                              styles.badgeName,
                              !isEarned && styles.badgeNameLocked,
                            ]}
                            numberOfLines={1}
                          >
                            {badge.name}
                          </Text>
                          <Text style={styles.badgeDesc} numberOfLines={2}>
                            {badge.description}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            },
          )}

          {/* New badges toast */}
          {badges?.new?.length > 0 && (
            <View style={styles.newBadgeBanner}>
              <Text style={styles.newBadgeTitle}>
                🎉 {t('leaderboard.newBadges', 'New Badges Earned!')}
              </Text>
              {badges.new.map(b => (
                <Text key={b.id} style={styles.newBadgeItem}>
                  {b.icon} {b.name} — {b.description}
                </Text>
              ))}
            </View>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  backText: { fontSize: 28, color: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginLeft: 8 },

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: '#0080FF' },
  tabText: { color: '#888', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#fff' },

  scroll: { flex: 1, paddingHorizontal: 16 },

  // Category chips
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
  },
  categoryChipActive: {
    backgroundColor: 'rgba(0,128,255,0.2)',
    borderWidth: 1,
    borderColor: '#0080FF',
  },
  categoryText: { color: '#888', fontSize: 13, fontWeight: '600' },
  categoryTextActive: { color: '#0080FF' },

  // Loading
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Empty
  emptyState: { alignItems: 'center', padding: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#888', fontSize: 15, textAlign: 'center' },

  // Rank row
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  rankRowMe: {
    borderWidth: 1,
    borderColor: '#0080FF',
    backgroundColor: 'rgba(0,128,255,0.08)',
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0a0a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankMedal: { fontSize: 20 },
  rankNumber: { color: '#888', fontSize: 15, fontWeight: '700' },
  rankInfo: { flex: 1 },
  rankName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  rankNameMe: { color: '#0080FF' },
  rankValue: { color: '#FF9800', fontSize: 16, fontWeight: '800' },

  // Badge progress
  badgeProgress: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  badgeProgressCount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FF9800',
  },
  badgeProgressLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
  },
  badgeProgressBar: {
    height: 8,
    width: '100%',
    backgroundColor: '#0a0a1a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  badgeProgressFill: {
    height: 8,
    backgroundColor: '#FF9800',
    borderRadius: 4,
  },

  // Badge sections
  badgeSection: { marginBottom: 20 },
  badgeSectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCard: {
    width: '47%',
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  badgeCardLocked: {
    opacity: 0.5,
    backgroundColor: '#111',
  },
  badgeIcon: { fontSize: 32, marginBottom: 8 },
  badgeIconLocked: { opacity: 0.4 },
  badgeName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  badgeNameLocked: { color: '#666' },
  badgeDesc: {
    color: '#888',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },

  // New badges
  newBadgeBanner: {
    backgroundColor: 'rgba(255,152,0,0.12)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.3)',
    marginTop: 12,
  },
  newBadgeTitle: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  newBadgeItem: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
});
