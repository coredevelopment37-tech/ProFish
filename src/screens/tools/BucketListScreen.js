/**
 * BucketListScreen — Species bucket list / life list tracker
 * #554 — Dream catches with progress tracking
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useTheme from '../../hooks/useTheme';
import { AppIcon } from '../../constants/icons';

const SUGGESTED_BUCKET_LIST = [
  {
    species: 'Largemouth Bass',
    region: 'North America',
    icon: 'fish',
    difficulty: 'Easy',
  },
  {
    species: 'Rainbow Trout',
    region: 'Global',
    icon: 'sparkles',
    difficulty: 'Easy',
  },
  {
    species: 'Tarpon',
    region: 'Florida / Caribbean',
    icon: 'zap',
    difficulty: 'Medium',
  },
  {
    species: 'Peacock Bass',
    region: 'Amazon / Florida',
    icon: 'treePine',
    difficulty: 'Medium',
  },
  {
    species: 'Blue Marlin',
    region: 'Atlantic / Pacific',
    icon: 'trophy',
    difficulty: 'Hard',
  },
  {
    species: 'Giant Trevally',
    region: 'Indo-Pacific',
    icon: 'zap',
    difficulty: 'Hard',
  },
  {
    species: 'Atlantic Salmon',
    region: 'Scandinavia / Canada',
    icon: 'mountain',
    difficulty: 'Medium',
  },
  {
    species: 'Permit',
    region: 'Florida Keys / Belize',
    icon: 'target',
    difficulty: 'Very Hard',
  },
  {
    species: 'Golden Dorado',
    region: 'South America',
    icon: 'sparkles',
    difficulty: 'Medium',
  },
  {
    species: 'Arapaima',
    region: 'Amazon Basin',
    icon: 'fish',
    difficulty: 'Hard',
  },
  {
    species: 'Bonefish',
    region: 'Tropical Flats',
    icon: 'moon',
    difficulty: 'Medium',
  },
  {
    species: 'Muskie',
    region: 'Great Lakes / Canada',
    icon: 'fish',
    difficulty: 'Hard',
  },
  {
    species: 'Yellowfin Tuna',
    region: 'Offshore Global',
    icon: 'flame',
    difficulty: 'Medium',
  },
  {
    species: 'Barramundi',
    region: 'Australia / SE Asia',
    icon: 'zap',
    difficulty: 'Medium',
  },
  {
    species: 'Sailfish',
    region: 'Tropical Oceans',
    icon: 'sailboat',
    difficulty: 'Medium',
  },
  {
    species: 'Alligator Gar',
    region: 'Southern USA',
    icon: 'fish',
    difficulty: 'Medium',
  },
  {
    species: 'Wels Catfish',
    region: 'Europe',
    icon: 'fish',
    difficulty: 'Medium',
  },
  {
    species: 'Mahseer',
    region: 'India / SE Asia',
    icon: 'mountain',
    difficulty: 'Hard',
  },
  {
    species: 'Roosterfish',
    region: 'Central America',
    icon: 'sunrise',
    difficulty: 'Medium',
  },
  {
    species: 'Swordfish',
    region: 'Deep Ocean',
    icon: 'swords',
    difficulty: 'Very Hard',
  },
];

export default function BucketListScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [bucketList, setBucketList] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customSpecies, setCustomSpecies] = useState('');

  useEffect(() => {
    loadBucketList();
  }, []);

  const loadBucketList = async () => {
    try {
      const data = await AsyncStorage.getItem('@profish_bucket_list');
      if (data) setBucketList(JSON.parse(data));
    } catch (e) {
      /* ignore */
    }
  };

  const saveBucketList = async list => {
    setBucketList(list);
    try {
      await AsyncStorage.setItem('@profish_bucket_list', JSON.stringify(list));
    } catch (e) {
      /* ignore */
    }
  };

  const addFromSuggestion = item => {
    if (bucketList.find(b => b.species === item.species)) return;
    saveBucketList([
      ...bucketList,
      { ...item, caught: false, caughtDate: null, id: Date.now().toString() },
    ]);
  };

  const addCustom = () => {
    if (!customSpecies.trim()) return;
    saveBucketList([
      ...bucketList,
      {
        species: customSpecies.trim(),
        region: 'Custom',
        icon: 'fish',
        difficulty: 'Unknown',
        caught: false,
        caughtDate: null,
        id: Date.now().toString(),
      },
    ]);
    setCustomSpecies('');
  };

  const toggleCaught = id => {
    const updated = bucketList.map(b =>
      b.id === id
        ? {
            ...b,
            caught: !b.caught,
            caughtDate: !b.caught ? new Date().toISOString() : null,
          }
        : b,
    );
    saveBucketList(updated);
  };

  const removeItem = id => {
    saveBucketList(bucketList.filter(b => b.id !== id));
  };

  const stats = useMemo(() => {
    const total = bucketList.length;
    const caught = bucketList.filter(b => b.caught).length;
    return {
      total,
      caught,
      pct: total > 0 ? Math.round((caught / total) * 100) : 0,
    };
  }, [bucketList]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><AppIcon name="trophy" size={20} color={colors.text} /><Text style={styles.headerTitle}>Bucket List</Text></View>
        <Text style={styles.headerDesc}>Your dream catches</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Target</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: colors.accent }]}>
            {stats.caught}
          </Text>
          <Text style={styles.statLabel}>Caught</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {stats.pct}%
          </Text>
          <Text style={styles.statLabel}>Complete</Text>
        </View>
      </View>

      {/* Progress bar */}
      {stats.total > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${stats.pct}%` }]} />
          </View>
        </View>
      )}

      {/* Add custom */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          value={customSpecies}
          onChangeText={setCustomSpecies}
          placeholder="Add custom species..."
          placeholderTextColor={colors.textTertiary}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addCustom}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.suggestBtn}
          onPress={() => setShowSuggestions(!showSuggestions)}
        >
          <AppIcon name="lightbulb" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Suggestions */}
      {showSuggestions && (
        <View style={styles.suggestionsCard}>
          <Text style={styles.suggestionsTitle}>Suggested Dream Catches</Text>
          <FlatList
            data={SUGGESTED_BUCKET_LIST}
            keyExtractor={item => item.species}
            renderItem={({ item }) => {
              const alreadyAdded = bucketList.find(
                b => b.species === item.species,
              );
              return (
                <TouchableOpacity
                  style={[
                    styles.suggestItem,
                    alreadyAdded && styles.suggestItemAdded,
                  ]}
                  onPress={() => !alreadyAdded && addFromSuggestion(item)}
                  disabled={!!alreadyAdded}
                >
                  <Text style={styles.suggestEmoji}><AppIcon name={item.icon} size={18} color={colors.text} /></Text>
                  <Text style={styles.suggestSpecies}>{item.species}</Text>
                  <Text style={styles.suggestRegion}>{item.region}</Text>
                  <Text style={styles.suggestDiff}>
                    {alreadyAdded ? <AppIcon name="checkCircle" size={16} color={colors.accent} /> : '+'}
                  </Text>
                </TouchableOpacity>
              );
            }}
            style={styles.suggestList}
            nestedScrollEnabled
          />
        </View>
      )}

      {/* Bucket list */}
      <FlatList
        data={bucketList}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.bucketItem, item.caught && styles.bucketItemCaught]}
            onPress={() => toggleCaught(item.id)}
            onLongPress={() => removeItem(item.id)}
          >
            <Text style={styles.bucketCheck}>{item.caught ? <AppIcon name="checkCircle" size={20} color={colors.accent} /> : <AppIcon name="circle" size={20} color={colors.textTertiary} />}</Text>
            <Text style={styles.bucketEmoji}><AppIcon name={item.icon || 'fish'} size={24} color={colors.text} /></Text>
            <View style={styles.bucketContent}>
              <Text
                style={[
                  styles.bucketSpecies,
                  item.caught && styles.bucketSpeciesCaught,
                ]}
              >
                {item.species}
              </Text>
              <Text style={styles.bucketRegion}>
                {item.region} • {item.difficulty}
              </Text>
              {item.caught && item.caughtDate && (
                <Text style={styles.bucketDate}>
                  Caught: {new Date(item.caughtDate).toLocaleDateString()}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Add species to your bucket list to start tracking your dream
            catches!
          </Text>
        }
      />
    </View>
  );
}

export { SUGGESTED_BUCKET_LIST };

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { fontSize: 16, color: colors.primary, marginBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: colors.text },
  headerDesc: { fontSize: 14, color: colors.textTertiary, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  progressContainer: { paddingHorizontal: 16, marginTop: 12 },
  progressBar: { height: 6, backgroundColor: colors.border, borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: colors.accent, borderRadius: 3 },
  addRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },
  addInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtn: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { fontSize: 24, color: colors.text, fontWeight: '700' },
  suggestBtn: {
    backgroundColor: colors.surface,
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestBtnText: { fontSize: 20 },
  suggestionsCard: {
    margin: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    maxHeight: 250,
    borderWidth: 1,
    borderColor: colors.accent + '40',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 8,
  },
  suggestList: { maxHeight: 200 },
  suggestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestItemAdded: { opacity: 0.5 },
  suggestEmoji: { fontSize: 18, marginRight: 8 },
  suggestSpecies: { flex: 1, fontSize: 14, color: colors.text },
  suggestRegion: { fontSize: 12, color: colors.textTertiary, marginRight: 8 },
  suggestDiff: { fontSize: 16, color: colors.primary },
  listContent: { padding: 16, paddingBottom: 100 },
  bucketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bucketItemCaught: {
    borderColor: colors.accent + '60',
    backgroundColor: colors.accent + '08',
  },
  bucketCheck: { fontSize: 20, marginRight: 10 },
  bucketEmoji: { fontSize: 24, marginRight: 10 },
  bucketContent: { flex: 1 },
  bucketSpecies: { fontSize: 16, fontWeight: '600', color: colors.text },
  bucketSpeciesCaught: {
    textDecorationLine: 'line-through',
    color: colors.accent,
  },
  bucketRegion: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  bucketDate: { fontSize: 11, color: colors.accent, marginTop: 4 },
  emptyText: {
    fontSize: 15,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 22,
  },
});
