/**
 * TournamentListScreen — ProFish (#367)
 *
 * Browse active, upcoming, and past tournaments.
 * Tabs: Active | Upcoming | My Tournaments | History
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import tournamentService, {
  TOURNAMENT_STATUS,
  TOURNAMENT_TYPE,
  TOURNAMENT_SCORING,
} from '../../services/tournamentService';
import { canAccess, requireFeature } from '../../services/featureGate';
import useTheme from '../../hooks/useTheme';
import { AppIcon } from '../../constants/icons';

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'my', label: 'My Tournaments' },
  { key: 'history', label: 'History' },
];

export default function TournamentListScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [tab, setTab] = useState('active');
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, [tab]);

  const loadTournaments = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (tab === 'active') {
        data = await tournamentService.getTournaments({
          status: TOURNAMENT_STATUS.ACTIVE,
        });
      } else if (tab === 'upcoming') {
        data = await tournamentService.getTournaments({
          status: TOURNAMENT_STATUS.UPCOMING,
        });
      } else if (tab === 'history') {
        data = await tournamentService.getHistory();
      } else {
        // My tournaments — fetch all and filter by joined
        data = await tournamentService.getTournaments();
      }
      setTournaments(data || []);
    } catch (e) {
      console.warn('[TournamentList] Load error:', e);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTournaments();
    setRefreshing(false);
  }, [loadTournaments]);

  function getStatusBadge(status) {
    switch (status) {
      case TOURNAMENT_STATUS.ACTIVE:
        return { text: 'LIVE', icon: 'circleDot', color: colors.success };
      case TOURNAMENT_STATUS.UPCOMING:
        return { text: 'Upcoming', icon: 'clock', color: colors.accent };
      case TOURNAMENT_STATUS.ENDED:
        return { text: 'Ended', icon: 'check', color: colors.textTertiary };
      default:
        return { text: status, icon: null, color: colors.textTertiary };
    }
  }

  function getScoringLabel(scoring) {
    switch (scoring) {
      case TOURNAMENT_SCORING.TOTAL_WEIGHT:
        return { icon: 'scale', text: 'Total Weight' };
      case TOURNAMENT_SCORING.BIGGEST_CATCH:
        return { icon: 'trophy', text: 'Biggest Catch' };
      case TOURNAMENT_SCORING.TOTAL_CATCHES:
        return { icon: 'fish', text: 'Total Catches' };
      case TOURNAMENT_SCORING.SPECIES_COUNT:
        return { icon: 'fish', text: 'Species Count' };
      default:
        return { icon: null, text: scoring };
    }
  }

  function formatDateRange(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleDateString()} — ${e.toLocaleDateString()}`;
  }

  function getTimeRemaining(endDate) {
    const ms = new Date(endDate).getTime() - Date.now();
    if (ms <= 0) return 'Ended';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h left`;
    return `${hours}h left`;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {t('tournaments.title', 'Tournaments')}
        </Text>
        <TouchableOpacity
          style={styles.statsBtn}
          onPress={() => navigation.navigate('TournamentStats')}
        >
          <AppIcon name="barChart" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabRow}
      >
        {TABS.map(item => (
          <TouchableOpacity
            key={item.key}
            style={[styles.tabBtn, tab === item.key && styles.tabBtnActive]}
            onPress={() => setTab(item.key)}
          >
            <Text
              style={[styles.tabText, tab === item.key && styles.tabTextActive]}
            >
              {t(`tournaments.tab_${item.key}`, item.label)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tournament list */}
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
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
          {/* Weekly spotlight */}
          {tab === 'active' && tournaments.length > 0 && (
            <View style={styles.spotlightCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <AppIcon name="trophy" size={14} color={colors.accent} />
                <Text style={styles.spotlightLabel}>This Week</Text>
              </View>
              <Text style={styles.spotlightName}>{tournaments[0].name}</Text>
              <Text style={styles.spotlightTime}>
                {getTimeRemaining(tournaments[0].endDate)}
              </Text>
            </View>
          )}

          {tournaments.length === 0 ? (
            <View style={styles.emptyState}>
              <AppIcon name="trophy" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>
                {tab === 'active'
                  ? t('tournaments.noActive', 'No active tournaments right now')
                  : tab === 'upcoming'
                  ? t('tournaments.noUpcoming', 'No upcoming tournaments')
                  : t('tournaments.noHistory', 'No tournament history yet')}
              </Text>
            </View>
          ) : (
            tournaments.map(tournament => {
              const badge = getStatusBadge(tournament.status);
              const scoring = getScoringLabel(tournament.scoring);
              return (
                <TouchableOpacity
                  key={tournament.id}
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate('TournamentDetail', {
                      tournamentId: tournament.id,
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: badge.color + '22' },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        {badge.icon && <AppIcon name={badge.icon} size={12} color={badge.color} />}
                        <Text style={[styles.statusText, { color: badge.color }]}>
                          {badge.text}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      {scoring.icon && <AppIcon name={scoring.icon} size={12} color={colors.textTertiary} />}
                      <Text style={styles.scoring}>{scoring.text}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardName}>{tournament.name}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {tournament.description}
                  </Text>

                  <View style={styles.cardMeta}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <AppIcon name="users" size={12} color={colors.textTertiary} />
                      <Text style={styles.metaText}>
                        {tournament.participantCount || 0}/
                        {tournament.maxParticipants || '∞'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <AppIcon name="calendar" size={12} color={colors.textTertiary} />
                      <Text style={styles.metaText}>
                        {formatDateRange(
                          tournament.startDate,
                          tournament.endDate,
                        )}
                      </Text>
                    </View>
                  </View>

                  {tournament.targetSpecies?.length > 0 && (
                    <View style={styles.speciesRow}>
                      {tournament.targetSpecies.slice(0, 3).map(sp => (
                        <View key={sp} style={styles.speciesTag}>
                          <Text style={styles.speciesTagText}>{sp}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {tournament.prizes?.length > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <AppIcon name="gift" size={12} color={colors.accent} />
                      <Text style={styles.prizeText}>{tournament.prizes[0]}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  backText: { fontSize: 28, color: colors.text },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginLeft: 8,
  },
  statsBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsBtnText: { fontSize: 22 },

  tabScroll: { maxHeight: 44, marginBottom: 12 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  tabBtnActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textTertiary, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },

  scroll: { flex: 1, paddingHorizontal: 16 },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Spotlight
  spotlightCard: {
    backgroundColor: 'rgba(255,152,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  spotlightLabel: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  spotlightName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  spotlightTime: { color: colors.accent, fontSize: 14, fontWeight: '600' },

  // Tournament card
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  scoring: { color: colors.textTertiary, fontSize: 12 },
  cardName: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 6 },
  cardDesc: { color: '#aaa', fontSize: 13, marginBottom: 10, lineHeight: 18 },
  cardMeta: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  metaText: { color: colors.textTertiary, fontSize: 12 },
  speciesRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  speciesTag: {
    backgroundColor: 'rgba(0,128,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  speciesTagText: { color: colors.primary, fontSize: 11, fontWeight: '600' },
  prizeText: { color: colors.accent, fontSize: 12, fontWeight: '600' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textTertiary, fontSize: 15, textAlign: 'center' },
});
