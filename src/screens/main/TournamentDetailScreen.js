/**
 * TournamentDetailScreen — ProFish (#368)
 *
 * Shows tournament info, live leaderboard (#369), join/leave,
 * catch submission (#371), and share card (#377).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import tournamentService, {
  TOURNAMENT_STATUS,
  TOURNAMENT_SCORING,
} from '../../services/tournamentService';
import { canAccess, requireFeature } from '../../services/featureGate';
import useTheme from '../../hooks/useTheme';

export default function TournamentDetailScreen({ route, navigation }) {
  const { tournamentId } = route.params;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [tournament, setTournament] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [tab, setTab] = useState('info'); // 'info' | 'leaderboard' | 'rules'

  useEffect(() => {
    loadTournament();
    const unsub = tournamentService.subscribeLeaderboard(tournamentId, {
      onUpdate: entries => setLeaderboard(entries),
    });
    return () => unsub?.();
  }, [tournamentId]);

  const loadTournament = useCallback(async () => {
    setLoading(true);
    try {
      const [data, joined, entries] = await Promise.all([
        tournamentService.getTournament(tournamentId),
        tournamentService.isJoined(tournamentId),
        tournamentService.getLeaderboard(tournamentId),
      ]);
      setTournament(data);
      setIsJoined(joined);
      setLeaderboard(entries);
    } catch (e) {
      console.warn('[TournamentDetail] Load error:', e);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  async function handleJoin() {
    // Tier gate check (#370)
    if (!canAccess('tournaments')) {
      const upgrade = await requireFeature('tournaments');
      if (upgrade) navigation.navigate('Paywall');
      return;
    }

    setJoining(true);
    const result = await tournamentService.joinTournament(tournamentId);
    if (result.success) {
      setIsJoined(true);
      Alert.alert('🎉 Joined!', `You're in! Good luck in ${tournament.name}`);
    } else {
      Alert.alert('Cannot Join', result.error);
    }
    setJoining(false);
  }

  async function handleLeave() {
    Alert.alert(
      'Leave Tournament?',
      'Your submitted catches will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            await tournamentService.leaveTournament(tournamentId);
            setIsJoined(false);
          },
        },
      ],
    );
  }

  async function handleSubmitCatch() {
    navigation.navigate('LogCatch', {
      tournamentId,
      tournamentName: tournament?.name,
    });
  }

  async function handleShare() {
    if (!tournament) return;
    const userEntry = leaderboard.find(e => e.isMe);
    const card = tournamentService.generateShareCard(
      tournament,
      userEntry || {
        rank: '-',
        totalScore: 0,
        catchCount: 0,
      },
    );

    try {
      await Share.share({
        message: card.shareText,
        title: card.title,
      });
    } catch {}
  }

  function getTimeRemaining() {
    if (!tournament) return '';
    const ms = new Date(tournament.endDate).getTime() - Date.now();
    if (ms <= 0) return 'Ended';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h remaining`;
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m remaining`;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!tournament) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Tournament not found</Text>
      </View>
    );
  }

  const isActive = tournament.status === TOURNAMENT_STATUS.ACTIVE;
  const isUpcoming = tournament.status === TOURNAMENT_STATUS.UPCOMING;
  const myEntry = leaderboard.find(e => e.isMe);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {tournament.name}
        </Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Text style={styles.shareBtnText}>↗</Text>
        </TouchableOpacity>
      </View>

      {/* Status banner */}
      <View
        style={[
          styles.statusBanner,
          {
            backgroundColor: isActive
              ? 'rgba(76,175,80,0.12)'
              : isUpcoming
              ? 'rgba(255,152,0,0.12)'
              : 'rgba(136,136,136,0.12)',
          },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            {
              color: isActive ? colors.success : isUpcoming ? colors.accent : colors.textTertiary,
            },
          ]}
        >
          {isActive
            ? `● LIVE — ${getTimeRemaining()}`
            : isUpcoming
            ? `Starts ${new Date(tournament.startDate).toLocaleDateString()}`
            : 'Tournament Ended'}
        </Text>
      </View>

      {/* My rank card (if joined) */}
      {myEntry && (
        <View style={styles.myRankCard}>
          <View style={styles.myRankLeft}>
            <Text style={styles.myRankLabel}>Your Rank</Text>
            <Text style={styles.myRankNumber}>#{myEntry.rank}</Text>
          </View>
          <View style={styles.myRankRight}>
            <Text style={styles.myRankStat}>
              Score: {myEntry.totalScore?.toFixed(1) || 0}
            </Text>
            <Text style={styles.myRankStat}>
              Catches: {myEntry.catchCount || 0}
            </Text>
          </View>
        </View>
      )}

      {/* Tab bar */}
      <View style={styles.tabRow}>
        {['info', 'leaderboard', 'rules'].map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'info'
                ? '📋 Info'
                : t === 'leaderboard'
                ? '🏆 Rankings'
                : '📜 Rules'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {tab === 'info' && (
          <>
            <Text style={styles.description}>{tournament.description}</Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoValue}>
                  {tournament.participantCount || 0}
                </Text>
                <Text style={styles.infoLabel}>Anglers</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoValue}>
                  {tournament.scoring?.replace(/_/g, ' ')}
                </Text>
                <Text style={styles.infoLabel}>Scoring</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoValue}>
                  {tournament.requirePhoto ? 'Yes' : 'No'}
                </Text>
                <Text style={styles.infoLabel}>Photo Required</Text>
              </View>
            </View>

            {tournament.targetSpecies?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Target Species</Text>
                <View style={styles.speciesRow}>
                  {tournament.targetSpecies.map(sp => (
                    <View key={sp} style={styles.speciesTag}>
                      <Text style={styles.speciesTagText}>{sp}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {tournament.prizes?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎁 Prizes</Text>
                {tournament.prizes.map((prize, i) => (
                  <View key={i} style={styles.prizeRow}>
                    <Text style={styles.prizeMedal}>
                      {i === 0
                        ? '🥇'
                        : i === 1
                        ? '🥈'
                        : i === 2
                        ? '🥉'
                        : `#${i + 1}`}
                    </Text>
                    <Text style={styles.prizeText}>{prize}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Sponsor (#378) */}
            {tournament.sponsor && (
              <View style={styles.sponsorCard}>
                <Text style={styles.sponsorLabel}>Sponsored by</Text>
                <Text style={styles.sponsorName}>
                  {tournament.sponsor.name}
                </Text>
              </View>
            )}
          </>
        )}

        {tab === 'leaderboard' && (
          <>
            {leaderboard.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏆</Text>
                <Text style={styles.emptyText}>
                  No entries yet — be the first!
                </Text>
              </View>
            ) : (
              leaderboard.map(entry => (
                <View
                  key={entry.userId}
                  style={[styles.rankRow, entry.isMe && styles.rankRowMe]}
                >
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankNumber}>
                      {entry.rank <= 3
                        ? ['🥇', '🥈', '🥉'][entry.rank - 1]
                        : `#${entry.rank}`}
                    </Text>
                  </View>
                  <View style={styles.rankInfo}>
                    <Text
                      style={[styles.rankName, entry.isMe && styles.rankNameMe]}
                    >
                      {entry.displayName}
                      {entry.isMe ? ' (You)' : ''}
                    </Text>
                    <Text style={styles.rankCatches}>
                      {entry.catchCount} catches
                    </Text>
                  </View>
                  <Text style={styles.rankScore}>
                    {entry.totalScore?.toFixed(1)}
                  </Text>
                </View>
              ))
            )}
          </>
        )}

        {tab === 'rules' && (
          <View style={styles.rulesSection}>
            {tournament.rules?.length > 0 ? (
              tournament.rules.map((rule, i) => (
                <View key={i} style={styles.ruleRow}>
                  <Text style={styles.ruleBullet}>{i + 1}.</Text>
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))
            ) : (
              <View style={styles.ruleRow}>
                <Text style={styles.ruleText}>
                  Standard ProFish tournament rules apply. All catches must
                  include a photo. Species restrictions are listed on the Info
                  tab.
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom action bar */}
      <View style={styles.actionBar}>
        {isJoined ? (
          <>
            {isActive && (
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmitCatch}
              >
                <Text style={styles.submitBtnText}>🎣 Submit Catch</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
              <Text style={styles.leaveBtnText}>Leave</Text>
            </TouchableOpacity>
          </>
        ) : isActive || isUpcoming ? (
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={handleJoin}
            disabled={joining}
          >
            {joining ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.joinBtnText}>🏆 Join Tournament</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: { color: colors.textTertiary, fontSize: 16 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  backText: { fontSize: 28, color: colors.text },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  shareBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareBtnText: { fontSize: 22, color: colors.primary },

  statusBanner: {
    marginHorizontal: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: { fontSize: 13, fontWeight: '700' },

  myRankCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,128,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,128,255,0.3)',
    borderRadius: 14,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 12,
  },
  myRankLeft: { flex: 1 },
  myRankRight: { alignItems: 'flex-end', justifyContent: 'center' },
  myRankLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  myRankNumber: { color: colors.text, fontSize: 32, fontWeight: '900' },
  myRankStat: { color: '#aaa', fontSize: 13 },

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textTertiary, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#fff' },

  scroll: { flex: 1, paddingHorizontal: 16 },

  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },

  infoGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  infoItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  infoValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  infoLabel: { color: colors.textTertiary, fontSize: 11 },

  section: { marginBottom: 16 },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  speciesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  speciesTag: {
    backgroundColor: 'rgba(0,128,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  speciesTagText: { color: colors.primary, fontSize: 12, fontWeight: '600' },

  prizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  prizeMedal: { fontSize: 18, width: 30 },
  prizeText: { color: colors.textSecondary, fontSize: 14 },

  sponsorCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  sponsorLabel: { color: colors.textTertiary, fontSize: 11, marginBottom: 4 },
  sponsorName: { color: colors.accent, fontSize: 16, fontWeight: '700' },

  // Leaderboard
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
  rankBadge: { width: 40, alignItems: 'center', marginRight: 12 },
  rankNumber: { color: colors.text, fontSize: 16, fontWeight: '700' },
  rankInfo: { flex: 1 },
  rankName: { color: colors.text, fontSize: 14, fontWeight: '600' },
  rankNameMe: { color: colors.primary },
  rankCatches: { color: colors.textTertiary, fontSize: 12, marginTop: 2 },
  rankScore: { color: colors.accent, fontSize: 18, fontWeight: '800' },

  // Rules
  rulesSection: { paddingTop: 4 },
  ruleRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  ruleBullet: { color: colors.primary, fontSize: 14, fontWeight: '700', width: 20 },
  ruleText: { color: colors.textSecondary, fontSize: 14, flex: 1, lineHeight: 20 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textTertiary, fontSize: 15, textAlign: 'center' },

  // Action bar
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    gap: 10,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  joinBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  submitBtn: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  leaveBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  leaveBtnText: { color: colors.error, fontSize: 14, fontWeight: '600' },
});
