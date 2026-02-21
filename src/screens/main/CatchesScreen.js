/**
 * CatchesScreen — Catch log list with stats summary
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import catchService from '../../services/catchService';
import CatchCard from '../../components/CatchCard';

export default function CatchesScreen({ navigation }) {
  const { t } = useTranslation();
  const [catches, setCatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadCatches();
    const unsubscribe = navigation.addListener('focus', loadCatches);
    return unsubscribe;
  }, [navigation]);

  async function loadCatches() {
    try {
      await catchService.init();
      const [data, records, monthCount] = await Promise.all([
        catchService.getCatches(),
        catchService.getPersonalRecords(),
        catchService.getMonthCatchCount(),
      ]);
      setCatches(data);
      setStats({ records, monthCount, total: data.length });
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCatches();
  }, []);

  const handleDelete = useCallback(async id => {
    try {
      await catchService.deleteCatch(id);
      setCatches(prev => prev.filter(c => c.id !== id));
    } catch {}
  }, []);

  function renderHeader() {
    if (!stats || stats.total === 0) return null;
    return (
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>{t('catches.total', 'Total')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.monthCount}</Text>
          <Text style={styles.statLabel}>
            {t('catches.thisMonth', 'This Month')}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {Object.keys(stats.records).length}
          </Text>
          <Text style={styles.statLabel}>
            {t('catches.species', 'Species')}
          </Text>
        </View>
      </View>
    );
  }

  if (catches.length === 0 && !loading) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🎣</Text>
        <Text style={styles.emptyTitle}>
          {t('catches.empty', 'No catches yet')}
        </Text>
        <Text style={styles.emptySubtitle}>
          {t(
            'catches.emptyHint',
            'Tap the fish button on the map to log your first catch!',
          )}
        </Text>
        <TouchableOpacity
          style={styles.logButton}
          onPress={() => navigation.navigate('LogCatch')}
        >
          <Text style={styles.logButtonText}>
            {t('catches.logFirst', 'Log First Catch')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('catches.title', 'My Catches')}</Text>
      <FlatList
        data={catches}
        renderItem={({ item }) => (
          <CatchCard
            catchData={item}
            onPress={() => {
              // Could navigate to catch detail in the future
            }}
            onLongPress={() => handleDelete(item.id)}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0080FF"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 4,
  },
  list: { padding: 16, paddingBottom: 100 },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#0080FF' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#333',
  },
  empty: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 20 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  logButton: {
    backgroundColor: '#0080FF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  logButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
