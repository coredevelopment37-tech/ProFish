/**
 * CatchDetailScreen — Full catch detail view
 * Shows photo, species, stats, conditions, map pin, and delete option.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  Share,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import catchService from '../../services/catchService';
import { useApp } from '../../store/AppContext';
import {
  formatWeight,
  formatLength,
  formatTemp,
  formatWind,
} from '../../utils/units';
import PhotoViewer from '../../components/PhotoViewer';

const { width } = Dimensions.get('window');

export default function CatchDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { state } = useApp();
  const units = state.units || 'metric';
  const { catchData } = route.params;
  const [item] = useState(catchData);
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);

  if (!item) {
    navigation.goBack();
    return null;
  }

  const handleDelete = () => {
    Alert.alert(
      t('common.delete', 'Delete'),
      t('catches.deleteConfirm', 'Delete this catch permanently?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            await catchService.deleteCatch(item.id);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handleShare = async () => {
    try {
      const lines = [
        `🐟 ${item.species || 'Catch'}`,
        item.weight ? `⚖️ ${formatWeight(item.weight, units)}` : '',
        item.length ? `📏 ${formatLength(item.length, units)}` : '',
        item.bait ? `🪱 ${item.bait}` : '',
        '',
        'Caught with ProFish 🎣',
      ].filter(Boolean);
      await Share.share({
        message: lines.join('\n'),
        title: `${item.species || 'Catch'} - ProFish`,
      });
    } catch {}
  };

  const date = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

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
          {item.species || t('catches.unknownSpecies', 'Unknown Species')}
        </Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>🗑️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Text style={styles.shareText}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Photo */}
        {item.photo ? (
          <TouchableOpacity
            onPress={() => setPhotoViewerVisible(true)}
            activeOpacity={0.9}
          >
            <Image source={{ uri: item.photo }} style={styles.photo} />
          </TouchableOpacity>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoEmoji}>🐟</Text>
          </View>
        )}

        {/* Badges */}
        <View style={styles.badges}>
          {item.released && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                🔄 {t('catch.released', 'Released')}
              </Text>
            </View>
          )}
          {item.waterType && (
            <View style={[styles.badge, styles.badgeBlue]}>
              <Text style={styles.badgeText}>
                {item.waterType === 'freshwater'
                  ? '🏞️'
                  : item.waterType === 'saltwater'
                  ? '🌊'
                  : '🏝️'}{' '}
                {t(`species.${item.waterType}`, item.waterType)}
              </Text>
            </View>
          )}
          {item.method && (
            <View style={[styles.badge, styles.badgeGray]}>
              <Text style={styles.badgeText}>🎣 {item.method}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {item.weight != null && (
            <StatCard
              icon="⚖️"
              label={t('catch.weight', 'Weight')}
              value={formatWeight(item.weight, units)}
            />
          )}
          {item.length != null && (
            <StatCard
              icon="📏"
              label={t('catch.length', 'Length')}
              value={formatLength(item.length, units)}
            />
          )}
          {item.bait && (
            <StatCard
              icon="🪱"
              label={t('catch.bait', 'Bait')}
              value={item.bait}
            />
          )}
          {item.method && (
            <StatCard
              icon="🎣"
              label={t('catch.method', 'Method')}
              value={item.method}
            />
          )}
        </View>

        {/* Date & Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('catch.when', 'When')}</Text>
          <Text style={styles.sectionText}>{date}</Text>
        </View>

        {item.latitude && item.longitude && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('catch.where', 'Where')}</Text>
            <Text style={styles.sectionText}>
              {item.locationName ||
                `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`}
            </Text>
          </View>
        )}

        {/* Conditions */}
        {item.conditions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('catch.conditions', 'Conditions')}
            </Text>
            <View style={styles.conditionsGrid}>
              {item.conditions.temperature != null && (
                <ConditionPill
                  icon="🌡️"
                  value={formatTemp(item.conditions.temperature, units)}
                />
              )}
              {item.conditions.windSpeed != null && (
                <ConditionPill
                  icon="💨"
                  value={formatWind(item.conditions.windSpeed, units)}
                />
              )}
              {item.conditions.pressure != null && (
                <ConditionPill
                  icon="🔽"
                  value={`${Math.round(item.conditions.pressure)} hPa`}
                />
              )}
              {item.conditions.moonPhase && (
                <ConditionPill icon="🌙" value={item.conditions.moonPhase} />
              )}
              {item.conditions.tideState && (
                <ConditionPill icon="🌊" value={item.conditions.tideState} />
              )}
            </View>
          </View>
        )}

        {/* Notes */}
        {item.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('catch.notes', 'Notes')}</Text>
            <Text style={styles.sectionText}>{item.notes}</Text>
          </View>
        ) : null}

        <View style={{ height: 60 }} />
      </ScrollView>

      <PhotoViewer
        visible={photoViewerVisible}
        uri={item.photo}
        onClose={() => setPhotoViewerVisible(false)}
      />
    </View>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function ConditionPill({ icon, value }) {
  return (
    <View style={styles.conditionPill}>
      <Text style={styles.conditionIcon}>{icon}</Text>
      <Text style={styles.conditionValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#0a0a1a',
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: { fontSize: 28, color: '#fff' },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 4,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: { fontSize: 22 },
  shareBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareText: { fontSize: 22 },
  scroll: { flex: 1 },
  photo: {
    width: width,
    height: width * 0.75,
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    width: width,
    height: 200,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoEmoji: { fontSize: 64 },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.4)',
  },
  badgeBlue: {
    backgroundColor: 'rgba(0, 128, 255, 0.15)',
    borderColor: 'rgba(0, 128, 255, 0.3)',
  },
  badgeGray: {
    backgroundColor: 'rgba(136, 136, 136, 0.15)',
    borderColor: 'rgba(136, 136, 136, 0.3)',
  },
  badgeText: { color: '#ccc', fontSize: 13, fontWeight: '500' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: { fontSize: 24, marginBottom: 4 },
  statLabel: { color: '#888', fontSize: 12, marginBottom: 2 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0080FF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  sectionText: { fontSize: 16, color: '#ccc', lineHeight: 22 },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  conditionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  conditionIcon: { fontSize: 16 },
  conditionValue: { color: '#ccc', fontSize: 13, fontWeight: '500' },
});
