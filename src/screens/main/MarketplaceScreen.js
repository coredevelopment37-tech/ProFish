/**
 * Marketplace Screen — ProFish (#411)
 *
 * Browse marketplace: gear, guides, charters.
 * Tabs for category + location-based search.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
  Image,
  Linking,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import useTheme from '../../hooks/useTheme';
import marketplaceService, {
  LISTING_TYPE,
  GEAR_CATEGORY,
  GEAR_CONDITION,
} from '../../services/marketplaceService';

const { width } = Dimensions.get('window');

// ── Tabs ─────────────────────────────────────────────────

const TABS = [
  { key: 'gear', label: '🎣 Gear', type: LISTING_TYPE.GEAR },
  { key: 'guides', label: '🧭 Guides', type: LISTING_TYPE.GUIDE },
  { key: 'charters', label: '⛵ Charters', type: LISTING_TYPE.CHARTER },
  { key: 'affiliate', label: '🛒 Shop', type: 'affiliate' },
];

const GEAR_CATEGORIES = [
  { key: 'all', label: 'All' },
  ...Object.entries(GEAR_CATEGORY).map(([k, v]) => ({
    key: v,
    label: k.charAt(0) + k.slice(1).toLowerCase(),
  })),
];

// ── Mock Data (for development) ──────────────────────────

const MOCK_GEAR = [
  {
    id: '1',
    title: 'Shimano Stradic FL 3000',
    category: 'reels',
    condition: 'like_new',
    price: 149.99,
    photos: [],
    sellerName: 'FishingJoe',
    location: { city: 'Tampa', state: 'FL' },
    createdAt: Date.now() - 86400000,
  },
  {
    id: '2',
    title: "St. Croix Mojo Bass 7' MH",
    category: 'rods',
    condition: 'good',
    price: 89.99,
    photos: [],
    sellerName: 'BassMaster22',
    location: { city: 'Orlando', state: 'FL' },
    createdAt: Date.now() - 172800000,
  },
  {
    id: '3',
    title: 'Tackle Box Full of Crankbaits',
    category: 'lures',
    condition: 'good',
    price: 45.0,
    photos: [],
    sellerName: 'CrankQueen',
    location: { city: 'Austin', state: 'TX' },
    createdAt: Date.now() - 259200000,
  },
  {
    id: '4',
    title: 'Garmin Striker 4 Fish Finder',
    category: 'electronics',
    condition: 'fair',
    price: 99.0,
    photos: [],
    sellerName: 'TechAngler',
    location: { city: 'Seattle', state: 'WA' },
    createdAt: Date.now() - 345600000,
  },
];

const MOCK_GUIDES = [
  {
    id: 'g1',
    displayName: 'Captain Mike Thomas',
    bio: 'Licensed USCG Captain with 15 years experience in Tampa Bay inshore fishing.',
    specialties: ['red_drum', 'snook', 'tarpon'],
    avgRating: 4.9,
    reviewCount: 127,
    rates: { halfDay: 350, fullDay: 550, currency: 'USD' },
    location: { city: 'Tampa', state: 'FL' },
  },
  {
    id: 'g2',
    displayName: 'Sarah Johnson',
    bio: 'Fly fishing guide specializing in trout streams in the Smoky Mountains.',
    specialties: ['rainbow_trout', 'brown_trout', 'brook_trout'],
    avgRating: 4.8,
    reviewCount: 89,
    rates: { halfDay: 250, fullDay: 400, currency: 'USD' },
    location: { city: 'Gatlinburg', state: 'TN' },
  },
];

const MOCK_CHARTERS = [
  {
    id: 'c1',
    businessName: 'Gulf Stream Adventures',
    captainName: 'Capt. Rodriguez',
    vessel: {
      name: 'Sea Hunter',
      type: 'sportfisher',
      length: 36,
      capacity: 6,
    },
    targetSpecies: ['mahi_mahi', 'sailfish', 'wahoo'],
    avgRating: 4.7,
    reviewCount: 203,
    tripTypes: [
      { name: 'Half Day', duration: 4, price: 600 },
      { name: 'Full Day', duration: 8, price: 1100 },
    ],
    location: { port: 'Miami Beach Marina', city: 'Miami', state: 'FL' },
  },
];

// ── Components ───────────────────────────────────────────

function GearCard({ item, styles }) {
  const condition =
    GEAR_CONDITION[item.condition?.toUpperCase()] || GEAR_CONDITION.GOOD;
  const timeAgo = Math.floor((Date.now() - (item.createdAt || 0)) / 86400000);

  return (
    <TouchableOpacity style={styles.gearCard}>
      <View style={styles.gearImagePlaceholder}>
        {item.photos?.[0] ? (
          <Image source={{ uri: item.photos[0] }} style={styles.gearImage} />
        ) : (
          <Text style={styles.gearImageEmoji}>🎣</Text>
        )}
      </View>
      <View style={styles.gearInfo}>
        <Text style={styles.gearTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.gearPrice}>${item.price?.toFixed(2)}</Text>
        <View style={styles.gearMeta}>
          <View
            style={[
              styles.conditionBadge,
              { backgroundColor: condition.color + '22' },
            ]}
          >
            <Text style={[styles.conditionText, { color: condition.color }]}>
              {condition.label}
            </Text>
          </View>
          <Text style={styles.gearLocation}>
            {item.location?.city}
            {item.location?.state ? `, ${item.location.state}` : ''}
          </Text>
        </View>
        <Text style={styles.gearSeller}>
          {item.sellerName} • {timeAgo}d ago
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function GuideCard({ item, styles }) {
  return (
    <TouchableOpacity style={styles.guideCard}>
      <View style={styles.guideHeader}>
        <View style={styles.guideAvatar}>
          <Text style={styles.guideAvatarText}>
            {(item.displayName || '?')[0]}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.guideName}>{item.displayName}</Text>
          <Text style={styles.guideLocation}>
            📍 {item.location?.city}, {item.location?.state}
          </Text>
        </View>
        <View style={styles.ratingBox}>
          <Text style={styles.ratingText}>⭐ {item.avgRating}</Text>
          <Text style={styles.reviewCount}>{item.reviewCount} reviews</Text>
        </View>
      </View>
      <Text style={styles.guideBio} numberOfLines={2}>
        {item.bio}
      </Text>
      <View style={styles.guideSpecies}>
        {item.specialties?.slice(0, 3).map((s, i) => (
          <View key={i} style={styles.speciesBadge}>
            <Text style={styles.speciesText}>
              {s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.guideRates}>
        {item.rates?.halfDay > 0 && (
          <Text style={styles.rateText}>Half Day: ${item.rates.halfDay}</Text>
        )}
        {item.rates?.fullDay > 0 && (
          <Text style={styles.rateText}>Full Day: ${item.rates.fullDay}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function CharterCard({ item, styles }) {
  return (
    <TouchableOpacity style={styles.charterCard}>
      <View style={styles.charterHeader}>
        <Text style={styles.charterName}>{item.businessName}</Text>
        <View style={styles.ratingBox}>
          <Text style={styles.ratingText}>⭐ {item.avgRating}</Text>
          <Text style={styles.reviewCount}>{item.reviewCount} reviews</Text>
        </View>
      </View>
      <Text style={styles.charterCaptain}>Capt. {item.captainName}</Text>
      {item.vessel && (
        <Text style={styles.charterVessel}>
          ⛵ {item.vessel.name} — {item.vessel.length}ft{' '}
          {item.vessel.type?.replace(/_/g, ' ')} (up to {item.vessel.capacity}{' '}
          guests)
        </Text>
      )}
      <Text style={styles.charterPort}>
        📍 {item.location?.port || item.location?.city}, {item.location?.state}
      </Text>
      <View style={styles.tripTypes}>
        {item.tripTypes?.map((t, i) => (
          <View key={i} style={styles.tripTypeBadge}>
            <Text style={styles.tripTypeText}>
              {t.name} — ${t.price}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

function AffiliateSection({ styles }) {
  const gear =
    marketplaceService.affiliate.getRecommendedGear('largemouth_bass');

  return (
    <View style={styles.affiliateSection}>
      <Text style={styles.sectionTitle}>🛒 Recommended Gear</Text>
      <Text style={styles.sectionSubtitle}>
        Curated picks for your target species
      </Text>
      {gear.map((item, i) => (
        <TouchableOpacity
          key={i}
          style={styles.affiliateCard}
          onPress={() =>
            item.affiliateUrl && Linking.openURL(item.affiliateUrl)
          }
        >
          <View style={styles.affiliateInfo}>
            <Text style={styles.affiliateTitle}>{item.name}</Text>
            <Text style={styles.affiliatePrice}>${item.price?.toFixed(2)}</Text>
            <Text style={styles.affiliateCategory}>{item.category}</Text>
          </View>
          <Text style={styles.affiliateArrow}>›</Text>
        </TouchableOpacity>
      ))}
      <Text style={styles.affiliateDisclaimer}>
        * Affiliate links — ProFish may earn a small commission
      </Text>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────

export default function MarketplaceScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [activeTab, setActiveTab] = useState('gear');
  const [search, setSearch] = useState('');
  const [gearCategory, setGearCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Use mock data for now
  const [gear] = useState(MOCK_GEAR);
  const [guides] = useState(MOCK_GUIDES);
  const [charters] = useState(MOCK_CHARTERS);

  const filteredGear = gear.filter(g => {
    if (gearCategory !== 'all' && g.category !== gearCategory) return false;
    if (search && !g.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  function renderContent() {
    switch (activeTab) {
      case 'gear':
        return (
          <>
            {/* Category filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {GEAR_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryChip,
                    gearCategory === cat.key && styles.categoryChipActive,
                  ]}
                  onPress={() => setGearCategory(cat.key)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      gearCategory === cat.key && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <FlatList
              data={filteredGear}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <GearCard item={item} styles={styles} />}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No gear found</Text>
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.primary}
                />
              }
            />
          </>
        );

      case 'guides':
        return (
          <FlatList
            data={guides}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <GuideCard item={item} styles={styles} />}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No guides found nearby</Text>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
          />
        );

      case 'charters':
        return (
          <FlatList
            data={charters}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <CharterCard item={item} styles={styles} />}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No charters found nearby</Text>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
          />
        );

      case 'affiliate':
        return (
          <ScrollView
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
          >
            <AffiliateSection styles={styles} />
          </ScrollView>
        );

      default:
        return null;
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketplace</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search marketplace..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
      >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      ) : (
        renderContent()
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 },
  headerTitle: { color: colors.text, fontSize: 28, fontWeight: '700' },

  searchBox: { paddingHorizontal: 20, paddingBottom: 8 },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
  },

  tabBar: { paddingHorizontal: 16, paddingVertical: 4, maxHeight: 48 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textTertiary, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#fff' },

  categoryScroll: { paddingHorizontal: 16, paddingVertical: 8, maxHeight: 44 },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
  },
  categoryChipActive: { backgroundColor: colors.primary + '22', borderColor: colors.primary },
  categoryChipText: { color: colors.textTertiary, fontSize: 12 },
  categoryChipTextActive: { color: colors.primary },

  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  emptyText: {
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },

  // Gear Card
  gearCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  gearImagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gearImage: { width: 100, height: 100 },
  gearImageEmoji: { fontSize: 32 },
  gearInfo: { flex: 1, padding: 10 },
  gearTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  gearPrice: {
    color: colors.success,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  gearMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  conditionBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  conditionText: { fontSize: 10, fontWeight: '600' },
  gearLocation: { color: colors.textTertiary, fontSize: 11 },
  gearSeller: { color: colors.textTertiary, fontSize: 11, marginTop: 2 },

  // Guide Card
  guideCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  guideHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  guideAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideAvatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  guideName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  guideLocation: { color: colors.textTertiary, fontSize: 12, marginTop: 2 },
  ratingBox: { alignItems: 'flex-end' },
  ratingText: { color: '#FFD700', fontSize: 14, fontWeight: '600' },
  reviewCount: { color: colors.textTertiary, fontSize: 10 },
  guideBio: { color: colors.textSecondary, fontSize: 13, marginTop: 8, lineHeight: 18 },
  guideSpecies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  speciesBadge: {
    backgroundColor: colors.primary + '22',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  speciesText: { color: colors.primary, fontSize: 11 },
  guideRates: { flexDirection: 'row', gap: 16, marginTop: 8 },
  rateText: { color: colors.success, fontSize: 13, fontWeight: '600' },

  // Charter Card
  charterCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  charterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charterName: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1 },
  charterCaptain: { color: colors.primary, fontSize: 13, marginTop: 2 },
  charterVessel: { color: colors.textSecondary, fontSize: 12, marginTop: 6 },
  charterPort: { color: colors.textTertiary, fontSize: 12, marginTop: 4 },
  tripTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tripTypeBadge: {
    backgroundColor: colors.success + '22',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tripTypeText: { color: colors.success, fontSize: 12, fontWeight: '600' },

  // Affiliate
  affiliateSection: { marginTop: 8 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  sectionSubtitle: { color: colors.textTertiary, fontSize: 13, marginBottom: 12 },
  affiliateCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    alignItems: 'center',
  },
  affiliateInfo: { flex: 1 },
  affiliateTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  affiliatePrice: {
    color: colors.success,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  affiliateCategory: {
    color: colors.textTertiary,
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  affiliateArrow: { color: colors.primary, fontSize: 24, fontWeight: '300' },
  affiliateDisclaimer: {
    color: colors.textTertiary,
    fontSize: 10,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
