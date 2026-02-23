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
import useTheme from '../../hooks/useTheme';
import { AppIcon } from '../../constants/icons';
import { Card, ScreenHeader } from '../../components/Common';

const { width } = Dimensions.get('window');

export default function CatchDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
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
        `${item.species || 'Catch'}`,
        item.weight ? `${formatWeight(item.weight, units)}` : '',
        item.length ? `${formatLength(item.length, units)}` : '',
        item.bait ? `${item.bait}` : '',
        '',
        'Caught with ProFish',
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
      <ScreenHeader
        title={item.species || t('catches.unknownSpecies', 'Unknown Species')}
        onBack={() => navigation.goBack()}
        rightActions={[
          { icon: 'trash', onPress: handleDelete, color: colors.error },
          { icon: 'share', onPress: handleShare },
        ]}
      />

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
            <AppIcon name="fish" size={48} color={colors.textTertiary} />
          </View>
        )}

        {/* Badges */}
        <View style={styles.badges}>
          {item.released && (
            <View style={[styles.badge, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
              <AppIcon name="refresh" size={14} color={colors.success} />
              <Text style={styles.badgeText}>
                {t('catch.released', 'Released')}
              </Text>
            </View>
          )}
          {item.waterType && (
            <View style={[styles.badge, styles.badgeBlue, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
              <AppIcon
                name={item.waterType === 'freshwater' ? 'treePine' : item.waterType === 'saltwater' ? 'waves' : 'leaf'}
                size={14}
                color={colors.primary}
              />
              <Text style={styles.badgeText}>
                {t(`species.${item.waterType}`, item.waterType)}
              </Text>
            </View>
          )}
          {item.method && (
            <View style={[styles.badge, styles.badgeGray, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
              <AppIcon name="fish" size={14} color={colors.text} />
              <Text style={styles.badgeText}>{item.method}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {item.weight != null && (
            <StatCard
              iconName="scale"
              iconColor={colors.textSecondary}
              label={t('catch.weight', 'Weight')}
              value={formatWeight(item.weight, units)}
            />
          )}
          {item.length != null && (
            <StatCard
              iconName="ruler"
              iconColor={colors.textSecondary}
              label={t('catch.length', 'Length')}
              value={formatLength(item.length, units)}
            />
          )}
          {item.bait && (
            <StatCard
              iconName="anchor"
              iconColor={colors.textSecondary}
              label={t('catch.bait', 'Bait')}
              value={item.bait}
            />
          )}
          {item.method && (
            <StatCard
              iconName="fish"
              iconColor={colors.textSecondary}
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
                  iconName="thermometer"
                  iconColor={colors.textSecondary}
                  value={formatTemp(item.conditions.temperature, units)}
                />
              )}
              {item.conditions.windSpeed != null && (
                <ConditionPill
                  iconName="wind"
                  iconColor={colors.textSecondary}
                  value={formatWind(item.conditions.windSpeed, units)}
                />
              )}
              {item.conditions.pressure != null && (
                <ConditionPill
                  iconName="chevronDown"
                  iconColor={colors.textSecondary}
                  value={`${Math.round(item.conditions.pressure)} hPa`}
                />
              )}
              {item.conditions.moonPhase && (
                <ConditionPill iconName="moon" iconColor={colors.textSecondary} value={item.conditions.moonPhase} />
              )}
              {item.conditions.tideState && (
                <ConditionPill iconName="waves" iconColor={colors.textSecondary} value={item.conditions.tideState} />
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

function StatCard({ iconName, iconColor, label, value }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <Card radius={12} style={{ width: (width - 44) / 2, alignItems: 'center' }}>
      <AppIcon name={iconName} size={24} color={iconColor || colors.textSecondary} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </Card>
  );
}

function ConditionPill({ iconName, iconColor, value }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.conditionPill}>
      <AppIcon name={iconName} size={14} color={iconColor || colors.textSecondary} />
      <Text style={styles.conditionValue}>{value}</Text>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scroll: { flex: 1 },
  photo: {
    width: width,
    height: width * 0.75,
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    width: width,
    height: 200,
    backgroundColor: colors.surface,
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
    backgroundColor: colors.success + '33',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.success + '66',
  },
  badgeBlue: {
    backgroundColor: colors.primary + '26',
    borderColor: colors.primary + '4D',
  },
  badgeGray: {
    backgroundColor: colors.textTertiary + '26',
    borderColor: colors.textTertiary + '4D',
  },
  badgeText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },

  statIcon: { fontSize: 24, marginBottom: 4 },
  statLabel: { color: colors.textTertiary, fontSize: 12, marginBottom: 2 },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '700' },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  sectionText: { fontSize: 16, color: colors.textSecondary, lineHeight: 22 },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  conditionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  conditionIcon: { fontSize: 16 },
  conditionValue: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
});
