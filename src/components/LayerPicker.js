/**
 * LayerPicker — Slide-up layer selector with budget display
 * Shows available map layers filtered by subscription tier
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import useTheme from '../hooks/useTheme';
import { useApp } from '../store/AppContext';
import {
  LAYERS,
  MAX_LAYER_BUDGET,
  calculateBudget,
  canActivateLayer,
  getAvailableLayers,
} from '../config/layerRegistry';

export default function LayerPicker({
  visible,
  onClose,
  activeLayers,
  onToggleLayer,
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { state } = useApp();
  const tier = state.subscriptionTier || 'free';
  const tierColors = {
    free: colors.tierFree,
    pro: colors.tierPro,
    team: colors.tierTeam,
    guide: colors.tierGuide,
  };
  const currentBudget = calculateBudget(activeLayers);
  const budgetPercent = (currentBudget / MAX_LAYER_BUDGET) * 100;
  const available = getAvailableLayers(tier);
  const allLayers = Object.values(LAYERS).filter(l => !l.phase || l.phase <= 1);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>
                🗺️ {t('map.layers', 'Map Layers')}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.close}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Budget bar */}
            <View style={styles.budgetContainer}>
              <View style={styles.budgetLabels}>
                <Text style={styles.budgetLabel}>
                  {t('map.layerBudget', 'Layer Budget')}
                </Text>
                <Text style={styles.budgetValue}>
                  {currentBudget}/{MAX_LAYER_BUDGET}
                </Text>
              </View>
              <View style={styles.budgetBar}>
                <View
                  style={[
                    styles.budgetFill,
                    {
                      width: `${Math.min(budgetPercent, 100)}%`,
                      backgroundColor:
                        budgetPercent > 80
                          ? colors.error
                          : budgetPercent > 50
                          ? '#FFC107'
                          : colors.success,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Layer list */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {allLayers.map(layer => {
              const isActive = activeLayers.includes(layer.id);
              const isAvailable = available.some(a => a.id === layer.id);
              const canAdd =
                isActive || canActivateLayer(layer.id, activeLayers);
              const locked = !isAvailable;

              return (
                <TouchableOpacity
                  key={layer.id}
                  style={[
                    styles.layerRow,
                    isActive && styles.layerActive,
                    locked && styles.layerLocked,
                  ]}
                  onPress={() => {
                    if (locked) return; // Show upgrade prompt
                    if (isActive || canAdd) {
                      onToggleLayer(layer.id);
                    }
                  }}
                  disabled={locked || (!isActive && !canAdd)}
                  activeOpacity={0.7}
                >
                  <View style={styles.layerInfo}>
                    <View style={styles.layerNameRow}>
                      <Text
                        style={[styles.layerName, locked && styles.lockedText]}
                      >
                        {t(layer.label, layer.id.replace(/_/g, ' '))}
                      </Text>
                      {locked && <Text style={styles.lockIcon}>🔒</Text>}
                    </View>
                    <View style={styles.layerMeta}>
                      <Text style={styles.layerSource}>{layer.source}</Text>
                      <View
                        style={[
                          styles.tierBadge,
                          { backgroundColor: tierColors[layer.tier] + '30' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tierText,
                            { color: tierColors[layer.tier] },
                          ]}
                        >
                          {layer.tier}
                        </Text>
                      </View>
                      {layer.cost > 0 && (
                        <Text style={styles.layerCost}>CPU: {layer.cost}</Text>
                      )}
                    </View>
                  </View>
                  <View
                    style={[
                      styles.toggle,
                      isActive && styles.toggleOn,
                      !canAdd && !isActive && styles.toggleDisabled,
                    ]}
                  >
                    <View
                      style={[styles.toggleDot, isActive && styles.toggleDotOn]}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  header: { paddingHorizontal: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  close: { fontSize: 22, color: colors.textTertiary, padding: 4 },
  budgetContainer: { marginBottom: 16 },
  budgetLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  budgetLabel: { fontSize: 12, color: colors.textTertiary },
  budgetValue: { fontSize: 12, color: colors.text, fontWeight: '600' },
  budgetBar: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetFill: { height: '100%', borderRadius: 3 },
  list: { paddingHorizontal: 20 },
  layerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  layerActive: {
    backgroundColor: '#1a2a3e',
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  layerLocked: { opacity: 0.5 },
  layerInfo: { flex: 1 },
  layerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  layerName: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  lockedText: { color: colors.textTertiary },
  lockIcon: { fontSize: 12 },
  layerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  layerSource: { fontSize: 11, color: colors.textDisabled },
  tierBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tierText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  layerCost: { fontSize: 11, color: colors.textDisabled },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: colors.primary },
  toggleDisabled: { opacity: 0.3 },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.textTertiary,
  },
  toggleDotOn: {
    backgroundColor: colors.text,
    alignSelf: 'flex-end',
  },
});
