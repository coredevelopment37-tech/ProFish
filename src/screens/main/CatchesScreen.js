/**
 * CatchesScreen — Catch log list with stats summary
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Swipeable } from 'react-native-gesture-handler';
import catchService from '../../services/catchService';
import { useApp } from '../../store/AppContext';
import CatchCard from '../../components/CatchCard';
import useTheme from '../../hooks/useTheme';
import { AppIcon } from '../../constants/icons';

const SORT_OPTIONS = ['date', 'weight', 'species'];
const FILTER_OPTIONS = ['all', 'freshwater', 'saltwater', 'brackish'];

export default function CatchesScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const { state } = useApp();
  const units = state.units || 'metric';
  const [catches, setCatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [filterBy, setFilterBy] = useState('all');

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

  const handleDelete = useCallback(
    async id => {
      Alert.alert(
        t('common.delete', 'Delete'),
        t('catches.deleteConfirm', 'Delete this catch permanently?'),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          {
            text: t('common.delete', 'Delete'),
            style: 'destructive',
            onPress: async () => {
              try {
                await catchService.deleteCatch(id);
                setCatches(prev => prev.filter(c => c.id !== id));
              } catch {}
            },
          },
        ],
      );
    },
    [t],
  );

  // Filter + Sort
  const displayed = React.useMemo(() => {
    let data = [...catches];
    // Filter
    if (filterBy !== 'all') {
      data = data.filter(c => c.waterType === filterBy);
    }
    // Sort
    if (sortBy === 'weight') {
      data.sort((a, b) => (b.weight || 0) - (a.weight || 0));
    } else if (sortBy === 'species') {
      data.sort((a, b) => (a.species || '').localeCompare(b.species || ''));
    }
    // else date — already sorted
    return data;
  }, [catches, sortBy, filterBy]);

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

  const swipeableRefs = useRef({});

  const renderRightActions = useCallback(
    (progress, dragX, id) => {
      const scale = dragX.interpolate({
        inputRange: [-100, 0],
        outputRange: [1, 0.5],
        extrapolate: 'clamp',
      });
      return (
        <View style={styles.swipeActions}>
          <TouchableOpacity
            style={styles.editAction}
            onPress={() => {
              swipeableRefs.current[id]?.close();
              const item = catches.find(c => c.id === id);
              if (item) navigation.navigate('LogCatch', { editCatch: item });
            }}
          >
            <Animated.View style={{ transform: [{ scale }], marginBottom: 2 }}>
              <AppIcon name="edit" size={18} color="#fff" />
            </Animated.View>
            <Animated.Text
              style={[styles.actionLabel, { transform: [{ scale }] }]}
            >
              {t('common.edit', 'Edit')}
            </Animated.Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteAction}
            onPress={() => {
              swipeableRefs.current[id]?.close();
              handleDelete(id);
            }}
          >
            <Animated.View style={{ transform: [{ scale }], marginBottom: 2 }}>
              <AppIcon name="trash" size={18} color="#fff" />
            </Animated.View>
            <Animated.Text
              style={[styles.actionLabel, { transform: [{ scale }] }]}
            >
              {t('common.delete', 'Delete')}
            </Animated.Text>
          </TouchableOpacity>
        </View>
      );
    },
    [catches, t, handleDelete, navigation],
  );

  if (catches.length === 0 && !loading) {
    return (
      <View style={styles.empty}>
        <View style={{ marginBottom: 20 }}>
          <AppIcon name="fish" size={48} color={colors.textTertiary} />
        </View>
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
      <View style={styles.headerRow}>
        <Text style={styles.header}>{t('catches.title', 'My Catches')}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CatchStats')}
          style={styles.statsBtn}
        >
          <AppIcon name="barChart" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Filter + Sort bar */}
      <View style={styles.filterBar}>
        <ScrollableChips
          options={FILTER_OPTIONS}
          selected={filterBy}
          onSelect={setFilterBy}
          labelMap={{
            all: t('common.all', 'All'),
            freshwater: { icon: 'treePine' },
            saltwater: { icon: 'waves' },
            brackish: { icon: 'leaf' },
          }}
          styles={styles}
          colors={colors}
        />
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => {
            const idx = SORT_OPTIONS.indexOf(sortBy);
            setSortBy(SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length]);
          }}
        >
          <AppIcon
            name={sortBy === 'date' ? 'calendar' : sortBy === 'weight' ? 'scale' : 'fish'}
            size={18}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayed}
        renderItem={({ item }) => (
          <Swipeable
            ref={ref => {
              swipeableRefs.current[item.id] = ref;
            }}
            renderRightActions={(progress, dragX) =>
              renderRightActions(progress, dragX, item.id)
            }
            friction={2}
            rightThreshold={40}
            overshootRight={false}
          >
            <CatchCard
              item={item}
              units={units}
              onPress={() =>
                navigation.navigate('CatchDetail', { catchData: item })
              }
            />
          </Swipeable>
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function ScrollableChips({ options, selected, onSelect, labelMap, styles, colors }) {
  return (
    <View style={styles.chips}>
      {options.map(opt => {
        const entry = labelMap[opt] || opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, selected === opt && styles.chipActive]}
            onPress={() => onSelect(opt)}
          >
            {typeof entry === 'object' && entry.icon ? (
              <AppIcon
                name={entry.icon}
                size={16}
                color={selected === opt ? colors.primary : colors.textTertiary}
              />
            ) : (
              <Text
                style={[styles.chipText, selected === opt && styles.chipTextActive]}
              >
                {entry}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 4,
  },
  statsBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginTop: Platform.OS === 'ios' ? 40 : 0,
  },
  statsBtnText: { fontSize: 20 },
  list: { padding: 16, paddingBottom: 100 },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textTertiary, marginTop: 4 },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  empty: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 20 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: 24,
  },
  logButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  logButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flex: 1,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: 'rgba(0,128,255,0.2)',
    borderColor: colors.primary,
  },
  chipText: { color: colors.textTertiary, fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: colors.primary },
  sortBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sortText: { fontSize: 18 },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  editAction: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    borderRadius: 12,
    marginRight: 4,
  },
  deleteAction: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    borderRadius: 12,
  },
  actionText: { fontSize: 20, marginBottom: 2 },
  actionLabel: { fontSize: 11, color: '#fff', fontWeight: '600' },
});
