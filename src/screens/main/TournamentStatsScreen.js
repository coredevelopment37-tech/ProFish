/**
 * TournamentStatsScreen — ProFish (#376)
 *
 * Tournament history and personal stats.
 */

import React, { useState, useEffect } from 'react';
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
import tournamentService from '../../services/tournamentService';
import useTheme from '../../hooks/useTheme';

export default function TournamentStatsScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [s, h] = await Promise.all([
        tournamentService.getStats(),
        tournamentService.getHistory(),
      ]);
      setStats(s);
      setHistory(h);
    } catch (e) {
      console.warn('[TournamentStats] Load error:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
        <Text style={styles.title}>
          {t('tournaments.stats', 'Tournament Stats')}
        </Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Stats overview */}
        {stats && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.tournamentsPlayed}</Text>
              <Text style={styles.statLabel}>Tournaments</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.accent }]}>
                {stats.wins}
              </Text>
              <Text style={styles.statLabel}>Wins 🥇</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.topThree}</Text>
              <Text style={styles.statLabel}>Top 3</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.bestRank || '—'}</Text>
              <Text style={styles.statLabel}>Best Rank</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.avgRank || '—'}</Text>
              <Text style={styles.statLabel}>Avg Rank</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {stats.totalCatchesSubmitted}
              </Text>
              <Text style={styles.statLabel}>Catches</Text>
            </View>
          </View>
        )}

        {/* History list */}
        <Text style={styles.sectionTitle}>
          {t('tournaments.history', 'History')}
        </Text>

        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyText}>
              No tournament history yet. Join your first tournament!
            </Text>
          </View>
        ) : (
          history.map(item => (
            <TouchableOpacity
              key={item.id || item.tournamentId}
              style={styles.historyCard}
              onPress={() =>
                navigation.navigate('TournamentDetail', {
                  tournamentId: item.tournamentId || item.id,
                })
              }
            >
              <View style={styles.historyLeft}>
                <Text style={styles.historyMedal}>
                  {item.rank === 1
                    ? '🥇'
                    : item.rank === 2
                    ? '🥈'
                    : item.rank === 3
                    ? '🥉'
                    : '🏆'}
                </Text>
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyName}>{item.name}</Text>
                <Text style={styles.historyMeta}>
                  #{item.rank} of {item.totalParticipants} • {item.catchCount}{' '}
                  catches
                </Text>
                <Text style={styles.historyDate}>
                  {new Date(item.endDate).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.historyScore}>{item.score?.toFixed(1)}</Text>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  backText: { fontSize: 28, color: colors.text },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginLeft: 8 },

  scroll: { flex: 1, paddingHorizontal: 16 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    width: '31%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: { color: colors.textTertiary, fontSize: 11 },

  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },

  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  historyLeft: { width: 40, alignItems: 'center' },
  historyMedal: { fontSize: 24 },
  historyInfo: { flex: 1, marginLeft: 10 },
  historyName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  historyMeta: { color: colors.textTertiary, fontSize: 12, marginTop: 2 },
  historyDate: { color: colors.textTertiary, fontSize: 11, marginTop: 2 },
  historyScore: { color: colors.accent, fontSize: 18, fontWeight: '800' },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textTertiary, fontSize: 15, textAlign: 'center' },
});
