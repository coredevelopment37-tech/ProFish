/**
 * LeaderboardScreen — ProFish Community Leaderboards & Badges
 *
 * Features:
 * - Global leaderboard (catches, weight, species diversity)
 * - Regional leaderboard per 12 regions (#359)
 * - Species-specific leaderboard (#360)
 * - Friend leaderboard (followed users) (#361)
 * - Weekly/monthly/all-time filters (#362)
 * - Personal milestone badges
 * - Badge progress tracking
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../store/AppContext';
import catchService from '../../services/catchService';
import communityService from '../../services/communityService';
import badgeService, { BADGE_DEFINITIONS } from '../../services/badgeService';
import leaderboardService, {
  LEADERBOARD_TYPE,
  LEADERBOARD_METRIC,
  TIME_FILTER,
  LEADERBOARD_REGIONS,
} from '../../services/leaderboardService';
import regionGatingService from '../../services/regionGatingService';
import useTheme from '../../hooks/useTheme';
import { AppIcon } from '../../constants/icons';
import { ScreenHeader } from '../../components/Common';

const LEADERBOARD_TABS = [
  { key: 'global', label: 'Global', icon: 'globe' },
  { key: 'regional', label: 'Regional', icon: 'mapPin' },
  { key: 'species', label: 'Species', icon: 'fish' },
  { key: 'friends', label: 'Friends', icon: 'users' },
  { key: 'badges', label: 'Badges', icon: 'medal' },
];

const LEADERBOARD_CATEGORIES = [
  {
    key: 'catches',
    label: 'Total Catches',
    icon: 'fish',
    metric: LEADERBOARD_METRIC.TOTAL_CATCHES,
  },
  {
    key: 'weight',
    label: 'Biggest Catch',
    icon: 'scale',
    metric: LEADERBOARD_METRIC.BIGGEST_WEIGHT,
  },
  {
    key: 'species',
    label: 'Species Count',
    icon: 'fish',
    metric: LEADERBOARD_METRIC.SPECIES_COUNT,
  },
];

const TIME_FILTERS = [
  { key: TIME_FILTER.WEEKLY, label: 'This Week', icon: 'calendar' },
  { key: TIME_FILTER.MONTHLY, label: 'This Month', icon: 'calendarDays' },
  { key: TIME_FILTER.ALL_TIME, label: 'All Time', icon: 'infinity' },
];

export default function LeaderboardScreen({ navigation }) {
  const { t } = useTranslation();
  const { state } = useApp();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [tab, setTab] = useState('global');
  const [category, setCategory] = useState('catches');
  const [timeFilter, setTimeFilter] = useState(TIME_FILTER.ALL_TIME);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [badges, setBadges] = useState(null);
  const [catches, setCatches] = useState([]);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [allSpecies, setAllSpecies] = useState([]);

  // Detect user's region on mount
  useEffect(() => {
    const detected = regionGatingService.detect();
    if (detected.region && !selectedRegion) {
      setSelectedRegion(detected.region);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [tab, category, timeFilter, selectedRegion, selectedSpecies]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const catchData = await catchService.getCatches();
      setCatches(catchData);

      // Extract species list from catches
      const speciesSet = new Set(catchData.map(c => c.species).filter(Boolean));
      setAllSpecies([...speciesSet].sort());

      if (tab === 'badges') {
        const badgeResult = await badgeService.evaluateBadges(catchData);
        setBadges(badgeResult);
        setLoading(false);
        return;
      }

      const currentMetric =
        LEADERBOARD_CATEGORIES.find(c => c.key === category)?.metric ||
        LEADERBOARD_METRIC.TOTAL_CATCHES;

      let entries = [];

      if (tab === 'global') {
        entries = await leaderboardService.getLeaderboard({
          type: LEADERBOARD_TYPE.GLOBAL,
          metric: currentMetric,
          timeFilter,
        });
      } else if (tab === 'regional') {
        if (selectedRegion) {
          entries = await leaderboardService.getRegionalLeaderboard({
            region: selectedRegion,
            metric: currentMetric,
            timeFilter,
          });
        }
      } else if (tab === 'species') {
        if (selectedSpecies) {
          entries = await leaderboardService.getSpeciesLeaderboard({
            species: selectedSpecies,
            metric: LEADERBOARD_METRIC.BIGGEST_WEIGHT,
            timeFilter,
          });
        }
      } else if (tab === 'friends') {
        entries = await leaderboardService.getFriendsLeaderboard({
          metric: currentMetric,
          timeFilter,
        });
      }

      // Transform entries for display
      const mapped = entries.map(entry => ({
        id: entry.userId,
        name: entry.displayName || 'Angler',
        catches: entry.score || 0,
        weight: entry.score || 0,
        species: entry.score || 0,
        isMe: entry.isMe || entry.userId === state.userId,
        isFriend: entry.isFriend || false,
        region: entry.region,
        rank: entry.rank,
      }));

      setLeaderboard(mapped);
    } catch (e) {
      console.warn('[Leaderboard] Load error:', e);
    } finally {
      setLoading(false);
    }
  }, [
    tab,
    category,
    timeFilter,
    selectedRegion,
    selectedSpecies,
    state.userId,
  ]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

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
      <ScreenHeader
        title={t('leaderboard.title', 'Leaderboard')}
        onBack={() => navigation.goBack()}
      />

      {/* Tab selector — scrollable for 5 tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabRow}
      >
        {LEADERBOARD_TABS.map(item => (
          <TouchableOpacity
            key={item.key}
            style={[styles.tabBtn, tab === item.key && styles.tabBtnActive]}
            onPress={() => setTab(item.key)}
            accessibilityRole="tab"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <AppIcon name={item.icon} size={14} color={tab === item.key ? '#fff' : colors.textTertiary} />
              <Text
                style={[styles.tabText, tab === item.key && styles.tabTextActive]}
              >
                {t(`leaderboard.tab_${item.key}`, item.label)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Time filter chips (#362) */}
      {tab !== 'badges' && (
        <View style={styles.timeFilterRow}>
          {TIME_FILTERS.map(tf => (
            <TouchableOpacity
              key={tf.key}
              style={[
                styles.timeChip,
                timeFilter === tf.key && styles.timeChipActive,
              ]}
              onPress={() => setTimeFilter(tf.key)}
            >
              <Text
                style={[
                  styles.timeChipText,
                  timeFilter === tf.key && styles.timeChipTextActive,
                ]}
              >
                {t(`leaderboard.time_${tf.key}`, tf.label)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Region picker for regional tab (#359) */}
      {tab === 'regional' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.regionScroll}
          contentContainerStyle={styles.regionRow}
        >
          {LEADERBOARD_REGIONS.map(r => (
            <TouchableOpacity
              key={r.id}
              style={[
                styles.regionChip,
                selectedRegion === r.id && styles.regionChipActive,
              ]}
              onPress={() => setSelectedRegion(r.id)}
            >
              <Text
                style={[
                  styles.regionChipText,
                  selectedRegion === r.id && styles.regionChipTextActive,
                ]}
                numberOfLines={1}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Species picker for species tab (#360) */}
      {tab === 'species' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.regionScroll}
          contentContainerStyle={styles.regionRow}
        >
          {allSpecies.length > 0 ? (
            allSpecies.map(sp => (
              <TouchableOpacity
                key={sp}
                style={[
                  styles.regionChip,
                  selectedSpecies === sp && styles.regionChipActive,
                ]}
                onPress={() => setSelectedSpecies(sp)}
              >
                <Text
                  style={[
                    styles.regionChipText,
                    selectedSpecies === sp && styles.regionChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {sp}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyHint}>
              {t(
                'leaderboard.noSpecies',
                'Log catches to see species rankings',
              )}
            </Text>
          )}
        </ScrollView>
      )}

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : tab !== 'badges' ? (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <AppIcon name={cat.icon} size={14} color={category === cat.key ? colors.primary : colors.textTertiary} />
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat.key && styles.categoryTextActive,
                    ]}
                  >
                    {t(`leaderboard.${cat.key}`, cat.label)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Leaderboard list */}
          {sortedLeaderboard.length === 0 ? (
            <View style={styles.emptyState}>
              <AppIcon name="trophy" size={48} color={colors.textTertiary} />
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

              return (
                <View
                  key={user.id}
                  style={[styles.rankRow, user.isMe && styles.rankRowMe]}
                >
                  <View style={styles.rankBadge}>
                    {rank === 1 ? (
                      <AppIcon name="medal" size={24} color="#FFD700" />
                    ) : rank === 2 ? (
                      <AppIcon name="medal" size={24} color="#C0C0C0" />
                    ) : rank === 3 ? (
                      <AppIcon name="medal" size={24} color="#CD7F32" />
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
                          {isEarned ? (
                            <AppIcon name={badge.icon} size={32} color={colors.primary} />
                          ) : (
                            <AppIcon name="lock" size={32} color={colors.textTertiary} />
                          )}
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
                {t('leaderboard.newBadges', 'New Badges Earned!')}
              </Text>
              {badges.new.map(b => (
                <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <AppIcon name={b.icon} size={16} color={colors.text} />
                  <Text style={styles.newBadgeItem}>{b.name} — {b.description}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Tabs (scrollable)
  tabScroll: { maxHeight: 44, marginBottom: 8 },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textTertiary, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },

  // Time filters (#362)
  timeFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  timeChipActive: {
    backgroundColor: 'rgba(255,152,0,0.15)',
    borderColor: colors.accent,
  },
  timeChipText: { color: colors.textTertiary, fontSize: 12, fontWeight: '600' },
  timeChipTextActive: { color: colors.accent },

  // Region chips (#359)
  regionScroll: { maxHeight: 40, marginBottom: 8 },
  regionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  regionChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  regionChipActive: {
    backgroundColor: 'rgba(0,128,255,0.15)',
    borderColor: colors.primary,
  },
  regionChipText: { color: colors.textTertiary, fontSize: 12, fontWeight: '600' },
  regionChipTextActive: { color: colors.primary },
  emptyHint: { color: colors.textTertiary, fontSize: 13, paddingHorizontal: 4 },

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
    backgroundColor: colors.surface,
  },
  categoryChipActive: {
    backgroundColor: 'rgba(0,128,255,0.2)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  categoryText: { color: colors.textTertiary, fontSize: 13, fontWeight: '600' },
  categoryTextActive: { color: colors.primary },

  // Loading
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Empty
  emptyState: { alignItems: 'center', padding: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textTertiary, fontSize: 15, textAlign: 'center' },

  // Rank row
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  rankRowMe: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'rgba(0,128,255,0.08)',
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankMedal: { fontSize: 20 },
  rankNumber: { color: colors.textTertiary, fontSize: 15, fontWeight: '700' },
  rankInfo: { flex: 1 },
  rankName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  rankNameMe: { color: colors.primary },
  rankValue: { color: colors.accent, fontSize: 16, fontWeight: '800' },

  // Badge progress
  badgeProgress: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  badgeProgressCount: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.accent,
  },
  badgeProgressLabel: {
    color: colors.textTertiary,
    fontSize: 14,
    marginBottom: 12,
  },
  badgeProgressBar: {
    height: 8,
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  badgeProgressFill: {
    height: 8,
    backgroundColor: colors.accent,
    borderRadius: 4,
  },

  // Badge sections
  badgeSection: { marginBottom: 20 },
  badgeSectionTitle: {
    color: colors.text,
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
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeCardLocked: {
    opacity: 0.5,
    backgroundColor: '#111',
  },
  badgeIcon: { fontSize: 32, marginBottom: 8 },
  badgeIconLocked: { opacity: 0.4 },
  badgeName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  badgeNameLocked: { color: colors.textTertiary },
  badgeDesc: {
    color: colors.textTertiary,
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
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  newBadgeItem: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
});
