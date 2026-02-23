/**
 * NightGearScreen — ProFish
 * Complete night fishing gear guide with connectivity info (BLE, WiFi, SIM).
 * 42 items across 9 categories, with brand recommendations and pro tips.
 * Includes dedicated Flounder Gigging section.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  NIGHT_GEAR,
  GIGGING_CONFIG,
  getConnectivitySummary,
} from '../../services/nightFishingService';
import useTheme from '../../hooks/useTheme';
import { AppIcon } from '../../constants/icons';
import { ScreenHeader } from '../../components/Common';

// ── Category config ──
const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'moon' },
  { id: 'lighting', label: 'Lighting', icon: 'lightbulb' },
  { id: 'electronics', label: 'Electronics', icon: 'satellite' },
  { id: 'safety', label: 'Safety', icon: 'shieldAlert' },
  { id: 'lures_bait', label: 'Lures & Bait', icon: 'fish' },
  { id: 'clothing', label: 'Clothing', icon: 'shield' },
  { id: 'comfort', label: 'Comfort', icon: 'package' },
  { id: 'legal', label: 'Legal', icon: 'fileText' },
  { id: 'gigging', label: 'Gigging', icon: 'crosshair' },
];

// ── Connectivity badge config ──
const CONN_BADGES = {
  BLE: { label: 'Bluetooth', color: '#0082FC', icon: 'bluetooth' },
  WiFi: { label: 'WiFi', color: '#00CC66', icon: 'wifi' },
  SIM: { label: 'Satellite/Cell', color: '#FF6600', icon: 'satellite' },
  USB: { label: 'USB', color: '#888', icon: 'plug' },
  APP: { label: 'App', color: '#AA66FF', icon: 'smartphone' },
  NONE: { label: 'Passive', color: '#444', icon: null },
};

// ── Priority badge config ──
const PRIORITY_BADGES = {
  essential: { label: 'ESSENTIAL', color: '#FF4444' },
  legal_required: { label: 'LEGALLY REQUIRED', color: '#FF8800' },
  recommended: { label: 'RECOMMENDED', color: '#00BBFF' },
  optional: { label: 'OPTIONAL', color: '#666' },
};

export default function NightGearScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const initialTab = route.params?.tab || 'all';
  const [category, setCategory] = useState(
    initialTab === 'gigging' ? 'gigging' : 'all',
  );
  const [expandedItem, setExpandedItem] = useState(null);
  const [showGigging, setShowGigging] = useState(initialTab === 'gigging');
  const [checkedItems, setCheckedItems] = useState({});

  const connectivity = useMemo(() => getConnectivitySummary(), []);

  const filteredGear = useMemo(() => {
    if (category === 'all') return NIGHT_GEAR;
    return NIGHT_GEAR.filter(g => g.category === category);
  }, [category]);

  const essentialCount = NIGHT_GEAR.filter(
    g => g.priority === 'essential' || g.priority === 'legal_required',
  ).length;
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  const toggleCheck = id => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderGearItem = ({ item }) => {
    const conn = CONN_BADGES[item.connectivity];
    const priority = PRIORITY_BADGES[item.priority];
    const isExpanded = expandedItem === item.id;
    const isChecked = checkedItems[item.id];

    return (
      <TouchableOpacity
        style={[styles.gearCard, isChecked && styles.gearCardChecked]}
        onPress={() => setExpandedItem(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        {/* Header row */}
        <View style={styles.gearHeader}>
          <TouchableOpacity
            style={[styles.checkbox, isChecked && styles.checkboxChecked]}
            onPress={() => toggleCheck(item.id)}
          >
            {isChecked && <Text style={styles.checkmark}><AppIcon name="check" size={14} color="#000" /></Text>}
          </TouchableOpacity>
          <Text style={styles.gearEmoji}>{item.emoji}</Text>
          <View style={styles.gearInfo}>
            <Text
              style={[styles.gearName, isChecked && styles.gearNameChecked]}
            >
              {item.name}
            </Text>
            <View style={styles.badgeRow}>
              {/* Connectivity badge */}
              {item.connectivity !== 'NONE' && (
                <View style={[styles.connBadge, { borderColor: conn.color }]}>
                  <Text style={styles.connEmoji}>{conn.icon ? <AppIcon name={conn.icon} size={10} color={conn.color} /> : '—'}</Text>
                  <Text style={[styles.connLabel, { color: conn.color }]}>
                    {conn.label}
                  </Text>
                </View>
              )}
              {/* Priority badge */}
              <View
                style={[styles.priorityBadge, { borderColor: priority.color }]}
              >
                <Text style={[styles.priorityLabel, { color: priority.color }]}>
                  {priority.label}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.gearPrice}>{item.priceRange}</Text>
        </View>

        {/* Description */}
        <Text style={styles.gearDesc}>{item.description}</Text>

        {/* Expanded details */}
        {isExpanded && (
          <View style={styles.expandedSection}>
            {/* Brands */}
            {item.brands && item.brands.length > 0 && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}><AppIcon name="thumbsUp" size={11} color={colors.textTertiary} /> Recommended Brands</Text>
                <Text style={styles.detailValue}>
                  {item.brands.join(' • ')}
                </Text>
              </View>
            )}

            {/* Power */}
            {item.powerSource && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}><AppIcon name="battery" size={11} color={colors.textTertiary} /> Power Source</Text>
                <Text style={styles.detailValue}>{item.powerSource}</Text>
              </View>
            )}

            {/* BLE Details */}
            {item.bleProfile && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}><AppIcon name="bluetooth" size={11} color={colors.textTertiary} /> BLE Protocol</Text>
                <Text style={styles.detailValue}>{item.bleProfile}</Text>
              </View>
            )}

            {/* WiFi Details */}
            {item.wifiSpec && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}><AppIcon name="wifi" size={11} color={colors.textTertiary} /> WiFi Spec</Text>
                <Text style={styles.detailValue}>{item.wifiSpec}</Text>
              </View>
            )}

            {/* SIM Details */}
            {item.simSpec && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}><AppIcon name="satellite" size={11} color={colors.textTertiary} /> Cellular/Satellite</Text>
                <Text style={styles.detailValue}>{item.simSpec}</Text>
              </View>
            )}

            {/* App Integration */}
            {item.appIntegration && (
              <View style={[styles.detailBlock, styles.integrationBlock]}>
                <Text style={styles.detailLabel}><AppIcon name="smartphone" size={11} color={colors.textTertiary} /> ProFish Integration</Text>
                <Text style={styles.integrationText}>
                  {item.appIntegration}
                </Text>
              </View>
            )}

            {/* Pro Tip */}
            {item.proTip && (
              <View style={[styles.detailBlock, styles.proTipBlock]}>
                <Text style={styles.proTipLabel}><AppIcon name="lightbulb" size={11} color="#FFD700" /> Pro Tip</Text>
                <Text style={styles.proTipText}>{item.proTip}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <ScreenHeader
        variant="large"
        title="Night Gear Guide"
        subtitle={`${NIGHT_GEAR.length} items • ${essentialCount} essential • ${checkedCount} packed`}
        onBack={() => navigation.goBack()}
      />

      {/* ── Connectivity Summary Banner ── */}
      <View style={styles.connSummary}>
        <View style={styles.connSummaryRow}>
          <View style={styles.connSummaryChip}>
            <Text style={styles.connSummaryIcon}><AppIcon name="bluetooth" size={18} color="#0082FC" /></Text>
            <Text style={styles.connSummaryNum}>
              {connectivity.bluetooth.count}
            </Text>
            <Text style={styles.connSummaryLabel}>Bluetooth</Text>
          </View>
          <View style={styles.connSummaryChip}>
            <Text style={styles.connSummaryIcon}><AppIcon name="wifi" size={18} color="#00CC66" /></Text>
            <Text style={styles.connSummaryNum}>{connectivity.wifi.count}</Text>
            <Text style={styles.connSummaryLabel}>WiFi</Text>
          </View>
          <View style={styles.connSummaryChip}>
            <Text style={styles.connSummaryIcon}><AppIcon name="satellite" size={18} color="#FF6600" /></Text>
            <Text style={styles.connSummaryNum}>
              {connectivity.cellular.count}
            </Text>
            <Text style={styles.connSummaryLabel}>SIM/Sat</Text>
          </View>
          <View style={styles.connSummaryChip}>
            <Text style={styles.connSummaryIcon}><AppIcon name="plug" size={18} color="#888" /></Text>
            <Text style={styles.connSummaryNum}>{connectivity.usb.count}</Text>
            <Text style={styles.connSummaryLabel}>USB</Text>
          </View>
          <View style={styles.connSummaryChip}>
            <Text style={styles.connSummaryIcon}><AppIcon name="package" size={18} color={colors.textTertiary} /></Text>
            <Text style={styles.connSummaryNum}>
              {connectivity.passive.count}
            </Text>
            <Text style={styles.connSummaryLabel}>Passive</Text>
          </View>
        </View>
      </View>

      {/* ── Category Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabContainer}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.tab, category === cat.id && styles.tabActive]}
            onPress={() => {
              setCategory(cat.id);
              setShowGigging(cat.id === 'gigging');
            }}
          >
            <Text style={styles.tabEmoji}><AppIcon name={cat.icon} size={14} color={category === cat.id ? '#00FF88' : colors.textTertiary} /></Text>
            <Text
              style={[
                styles.tabLabel,
                category === cat.id && styles.tabLabelActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Gigging Guide (shown when gigging tab selected) ── */}
      {showGigging && (
        <View style={styles.giggingGuide}>
          <Text style={styles.giggingSectionTitle}>
            <AppIcon name="crosshair" size={15} color="#FFD700" /> Flounder Gigging Conditions
          </Text>
          <View style={styles.giggingConditions}>
            <Text style={styles.giggingCond}>
              <AppIcon name="waves" size={12} color={colors.textSecondary} /> Tide: {GIGGING_CONFIG.bestConditions.tide}
            </Text>
            <Text style={styles.giggingCond}>
              <AppIcon name="droplet" size={12} color={colors.textSecondary} /> Water: {GIGGING_CONFIG.bestConditions.water}
            </Text>
            <Text style={styles.giggingCond}>
              <AppIcon name="wind" size={12} color={colors.textSecondary} /> Wind: {GIGGING_CONFIG.bestConditions.wind}
            </Text>
            <Text style={styles.giggingCond}>
              <AppIcon name="moon" size={12} color={colors.textSecondary} /> Moon: {GIGGING_CONFIG.bestConditions.moon}
            </Text>
            <Text style={styles.giggingCond}>
              <AppIcon name="thermometer" size={12} color={colors.textSecondary} /> Temp: {GIGGING_CONFIG.bestConditions.temp}
            </Text>
          </View>

          <Text style={styles.giggingSectionTitle}><AppIcon name="clipboard" size={15} color="#FFD700" /> Technique Steps</Text>
          {GIGGING_CONFIG.technique.steps.map((step, i) => (
            <Text key={i} style={styles.giggingStep}>
              {i + 1}. {step}
            </Text>
          ))}

          <View style={styles.giggingTipBox}>
            <Text style={styles.giggingTipTitle}><AppIcon name="eye" size={12} color="#00FF88" /> What to Look For</Text>
            <Text style={styles.giggingTipText}>
              {GIGGING_CONFIG.technique.whatToLookFor}
            </Text>
          </View>

          <Text style={styles.giggingSectionTitle}><AppIcon name="alertTriangle" size={15} color="#FFD700" /> Safety Rules</Text>
          {GIGGING_CONFIG.safetyRules.map((rule, i) => (
            <Text key={i} style={styles.giggingSafetyRule}>
              <AppIcon name="alertTriangle" size={12} color="#FF8800" /> {rule}
            </Text>
          ))}
        </View>
      )}

      {/* ── Gear List ── */}
      <FlatList
        data={filteredGear}
        keyExtractor={item => item.id}
        renderItem={renderGearItem}
        contentContainerStyle={styles.gearList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const createStyles = colors =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050510' },

    // Connectivity Summary
    connSummary: { paddingHorizontal: 16, marginBottom: 12 },
    connSummaryRow: { flexDirection: 'row', gap: 8 },
    connSummaryChip: {
      flex: 1,
      backgroundColor: '#0a0f20',
      borderRadius: 10,
      padding: 8,
      alignItems: 'center',
    },
    connSummaryIcon: { fontSize: 18, marginBottom: 2 },
    connSummaryNum: { fontSize: 18, fontWeight: '800', color: colors.text },
    connSummaryLabel: {
      fontSize: 9,
      color: colors.textTertiary,
      fontWeight: '600',
      marginTop: 1,
    },

    // Category Tabs
    tabScroll: { maxHeight: 48, marginBottom: 8 },
    tabContainer: { paddingHorizontal: 12, gap: 8 },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#0a0f20',
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: '#1a2040',
    },
    tabActive: { borderColor: '#00FF88', backgroundColor: '#0a1a10' },
    tabEmoji: { fontSize: 14, marginRight: 6 },
    tabLabel: { fontSize: 12, fontWeight: '600', color: colors.textTertiary },
    tabLabelActive: { color: '#00FF88' },

    // Gear List
    gearList: { paddingHorizontal: 16, paddingBottom: 40 },
    gearCard: {
      backgroundColor: '#0a0f20',
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: '#1a2040',
    },
    gearCardChecked: {
      borderColor: '#00FF88',
      backgroundColor: '#0a1510',
      opacity: 0.8,
    },
    gearHeader: { flexDirection: 'row', alignItems: 'center' },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    checkboxChecked: { backgroundColor: '#00FF88', borderColor: '#00FF88' },
    checkmark: { fontSize: 14, fontWeight: '800', color: '#000' },
    gearEmoji: { fontSize: 24, marginRight: 10 },
    gearInfo: { flex: 1 },
    gearName: { fontSize: 14, fontWeight: '700', color: colors.text },
    gearNameChecked: {
      textDecorationLine: 'line-through',
      color: colors.textTertiary,
    },
    badgeRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
    connBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    connEmoji: { fontSize: 10, marginRight: 4 },
    connLabel: { fontSize: 9, fontWeight: '700' },
    priorityBadge: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    priorityLabel: { fontSize: 9, fontWeight: '700' },
    gearPrice: { fontSize: 11, color: '#FFD700', fontWeight: '600' },
    gearDesc: { fontSize: 12, color: '#999', marginTop: 8, lineHeight: 18 },

    // Expanded
    expandedSection: {
      marginTop: 14,
      borderTopWidth: 1,
      borderTopColor: '#1a2040',
      paddingTop: 12,
    },
    detailBlock: { marginBottom: 10 },
    detailLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textTertiary,
      marginBottom: 3,
    },
    detailValue: { fontSize: 13, color: colors.textSecondary },
    integrationBlock: {
      backgroundColor: '#050a20',
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: '#0040FF33',
    },
    integrationText: { fontSize: 13, color: '#80BBFF', lineHeight: 20 },
    proTipBlock: {
      backgroundColor: '#1a1a0a',
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: '#FFD70033',
    },
    proTipLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: '#FFD700',
      marginBottom: 3,
    },
    proTipText: { fontSize: 13, color: '#ddd', lineHeight: 20 },

    // Gigging Guide
    giggingGuide: {
      backgroundColor: '#1a0f05',
      borderRadius: 14,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#4a3010',
    },
    giggingSectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFD700',
      marginTop: 10,
      marginBottom: 8,
    },
    giggingConditions: { gap: 4 },
    giggingCond: { fontSize: 12, color: colors.textSecondary },
    giggingStep: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
      lineHeight: 18,
    },
    giggingTipBox: {
      backgroundColor: '#0a0f20',
      borderRadius: 10,
      padding: 12,
      marginVertical: 10,
    },
    giggingTipTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: '#00FF88',
      marginBottom: 4,
    },
    giggingTipText: { fontSize: 12, color: '#aaa', lineHeight: 18 },
    giggingSafetyRule: { fontSize: 12, color: '#FF8800', marginBottom: 4 },
  });
