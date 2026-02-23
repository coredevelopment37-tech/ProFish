/**
 * CatchComparisonScreen — ProFish
 *
 * Compare two catches side-by-side: species, weight, length,
 * conditions, bait, method, location, FishCast score at time of catch.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Modal,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import catchService from '../../services/catchService';
import useTheme from '../../hooks/useTheme';

function StatRow({ label, left, right, unit = '', highlight = false }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const leftVal = left ?? '—';
  const rightVal = right ?? '—';
  const leftNum = parseFloat(left);
  const rightNum = parseFloat(right);
  const leftWins = !isNaN(leftNum) && !isNaN(rightNum) && leftNum > rightNum;
  const rightWins = !isNaN(leftNum) && !isNaN(rightNum) && rightNum > leftNum;

  return (
    <View style={styles.statRow}>
      <Text
        style={[
          styles.statVal,
          styles.statLeft,
          leftWins && highlight && styles.statWinner,
        ]}
      >
        {leftVal}
        {left != null && unit ? ` ${unit}` : ''}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text
        style={[
          styles.statVal,
          styles.statRight,
          rightWins && highlight && styles.statWinner,
        ]}
      >
        {rightVal}
        {right != null && unit ? ` ${unit}` : ''}
      </Text>
    </View>
  );
}

function CatchPickerModal({ visible, catches, onSelect, onClose, excludeId }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const filtered = catches.filter(c => c.id !== excludeId);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select a Catch</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => onSelect(item)}
              >
                {item.photo ? (
                  <Image
                    source={{ uri: item.photo }}
                    style={styles.pickerThumb}
                  />
                ) : (
                  <View style={[styles.pickerThumb, styles.pickerPlaceholder]}>
                    <Text style={styles.pickerEmoji}>🐟</Text>
                  </View>
                )}
                <View style={styles.pickerInfo}>
                  <Text style={styles.pickerSpecies}>
                    {item.species || 'Unknown'}
                  </Text>
                  <Text style={styles.pickerMeta}>
                    {item.weight ? `${item.weight} kg` : ''}
                    {item.weight && item.length ? ' · ' : ''}
                    {item.length ? `${item.length} cm` : ''}
                    {' · '}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No catches to compare</Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

export default function CatchComparisonScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const initialCatchId = route.params?.catchId;

  const [catches, setCatches] = useState([]);
  const [catchA, setCatchA] = useState(null);
  const [catchB, setCatchB] = useState(null);
  const [pickerTarget, setPickerTarget] = useState(null); // 'A' | 'B' | null

  // Load catches on mount
  React.useEffect(() => {
    (async () => {
      await catchService.init();
      const all = await catchService.getCatches({ limit: 200 });
      setCatches(all);

      if (initialCatchId) {
        const found = all.find(c => c.id === initialCatchId);
        if (found) setCatchA(found);
      }
    })();
  }, [initialCatchId]);

  const openPicker = useCallback(target => {
    setPickerTarget(target);
  }, []);

  const handleSelect = useCallback(
    item => {
      if (pickerTarget === 'A') setCatchA(item);
      else setCatchB(item);
      setPickerTarget(null);
    },
    [pickerTarget],
  );

  const formatDate = useCallback(dateStr => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

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
        <Text style={styles.headerTitle}>Compare Catches</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Catch selector cards */}
        <View style={styles.selectorRow}>
          {/* Catch A */}
          <TouchableOpacity
            style={[styles.selectorCard, catchA && styles.selectorCardActive]}
            onPress={() => openPicker('A')}
          >
            {catchA ? (
              <>
                {catchA.photo ? (
                  <Image
                    source={{ uri: catchA.photo }}
                    style={styles.cardPhoto}
                  />
                ) : (
                  <View style={[styles.cardPhoto, styles.cardPhotoPlaceholder]}>
                    <Text style={{ fontSize: 28 }}>🐟</Text>
                  </View>
                )}
                <Text style={styles.cardSpecies} numberOfLines={1}>
                  {catchA.species}
                </Text>
                <Text style={styles.cardDate}>
                  {formatDate(catchA.createdAt)}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.cardPlus}>+</Text>
                <Text style={styles.cardAction}>Select Catch</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.vsText}>VS</Text>

          {/* Catch B */}
          <TouchableOpacity
            style={[styles.selectorCard, catchB && styles.selectorCardActive]}
            onPress={() => openPicker('B')}
          >
            {catchB ? (
              <>
                {catchB.photo ? (
                  <Image
                    source={{ uri: catchB.photo }}
                    style={styles.cardPhoto}
                  />
                ) : (
                  <View style={[styles.cardPhoto, styles.cardPhotoPlaceholder]}>
                    <Text style={{ fontSize: 28 }}>🐟</Text>
                  </View>
                )}
                <Text style={styles.cardSpecies} numberOfLines={1}>
                  {catchB.species}
                </Text>
                <Text style={styles.cardDate}>
                  {formatDate(catchB.createdAt)}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.cardPlus}>+</Text>
                <Text style={styles.cardAction}>Select Catch</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Comparison table */}
        {catchA && catchB && (
          <View style={styles.comparisonTable}>
            <Text style={styles.tableTitle}>Comparison</Text>

            <StatRow
              label="Species"
              left={catchA.species}
              right={catchB.species}
            />
            <StatRow
              label="Weight"
              left={catchA.weight}
              right={catchB.weight}
              unit="kg"
              highlight
            />
            <StatRow
              label="Length"
              left={catchA.length}
              right={catchB.length}
              unit="cm"
              highlight
            />
            <StatRow label="Bait" left={catchA.bait} right={catchB.bait} />
            <StatRow
              label="Method"
              left={catchA.method}
              right={catchB.method}
            />
            <StatRow
              label="Water"
              left={catchA.waterType}
              right={catchB.waterType}
            />
            <StatRow
              label="Released"
              left={catchA.released ? 'Yes' : 'No'}
              right={catchB.released ? 'Yes' : 'No'}
            />

            {/* Conditions sub-section */}
            <Text style={[styles.tableTitle, { marginTop: 20 }]}>
              Conditions
            </Text>
            <StatRow
              label="Weather"
              left={catchA.conditions?.weather}
              right={catchB.conditions?.weather}
            />
            <StatRow
              label="Temp"
              left={catchA.conditions?.temperature}
              right={catchB.conditions?.temperature}
              unit="°C"
            />
            <StatRow
              label="Wind"
              left={catchA.conditions?.windSpeed}
              right={catchB.conditions?.windSpeed}
              unit="km/h"
            />
            <StatRow
              label="Pressure"
              left={catchA.conditions?.pressure}
              right={catchB.conditions?.pressure}
              unit="hPa"
              highlight
            />
            <StatRow
              label="Moon"
              left={catchA.conditions?.moonPhase}
              right={catchB.conditions?.moonPhase}
            />
            <StatRow
              label="Tide"
              left={catchA.conditions?.tideState}
              right={catchB.conditions?.tideState}
            />
            <StatRow
              label="Water Temp"
              left={catchA.conditions?.waterTemp}
              right={catchB.conditions?.waterTemp}
              unit="°C"
              highlight
            />
            <StatRow
              label="Clarity"
              left={catchA.conditions?.waterClarity}
              right={catchB.conditions?.waterClarity}
            />

            {/* Location */}
            <Text style={[styles.tableTitle, { marginTop: 20 }]}>Location</Text>
            <StatRow
              label="Spot"
              left={catchA.locationName || 'Unknown'}
              right={catchB.locationName || 'Unknown'}
            />
            <StatRow
              label="Date"
              left={formatDate(catchA.createdAt)}
              right={formatDate(catchB.createdAt)}
            />
          </View>
        )}

        {(!catchA || !catchB) && (
          <View style={styles.prompt}>
            <Text style={styles.promptText}>
              Select two catches above to compare them side-by-side
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Picker modal */}
      <CatchPickerModal
        visible={pickerTarget !== null}
        catches={catches}
        onSelect={handleSelect}
        onClose={() => setPickerTarget(null)}
        excludeId={pickerTarget === 'A' ? catchB?.id : catchA?.id}
      />
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: colors.surface,
  },
  backBtn: { padding: 8 },
  backText: { color: colors.text, fontSize: 22 },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },

  scrollContent: { paddingBottom: 40 },

  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
  },
  selectorCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 140,
    justifyContent: 'center',
  },
  selectorCardActive: {
    borderColor: colors.primary + '44',
  },
  cardPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  cardPhotoPlaceholder: {
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSpecies: { color: colors.text, fontSize: 14, fontWeight: '700' },
  cardDate: { color: colors.textTertiary, fontSize: 11, marginTop: 2 },
  cardPlus: { color: colors.primary, fontSize: 32, fontWeight: '300' },
  cardAction: { color: colors.primary, fontSize: 12, marginTop: 4 },

  vsText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '800',
    marginHorizontal: 4,
  },

  comparisonTable: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  tableTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },

  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  statVal: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
  },
  statLeft: { textAlign: 'left' },
  statRight: { textAlign: 'right' },
  statLabel: {
    width: 80,
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
  },
  statWinner: {
    color: colors.success,
    fontWeight: '700',
  },

  prompt: { padding: 40, alignItems: 'center' },
  promptText: { color: colors.textTertiary, fontSize: 14, textAlign: 'center' },

  // Picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000c',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  modalClose: { color: colors.textTertiary, fontSize: 20, padding: 4 },

  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pickerThumb: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  pickerPlaceholder: {
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerEmoji: { fontSize: 20 },
  pickerInfo: { flex: 1 },
  pickerSpecies: { color: colors.text, fontSize: 14, fontWeight: '600' },
  pickerMeta: { color: colors.textTertiary, fontSize: 12, marginTop: 2 },

  emptyText: { color: colors.textTertiary, textAlign: 'center', padding: 24 },
});
