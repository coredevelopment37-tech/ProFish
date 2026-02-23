/**
 * CatchCard — Reusable catch list item component
 * Shows species, weight, length, date, photo thumbnail, and location
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { formatWeight, formatLength } from '../utils/units';
import useTheme from '../hooks/useTheme';

export default function CatchCard({
  item,
  onPress,
  onLongPress,
  units = 'metric',
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const hasPhoto = !!item.photo;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(item)}
      onLongPress={() => onLongPress?.(item)}
      activeOpacity={0.7}
    >
      {/* Photo thumbnail */}
      <View style={styles.photoContainer}>
        {hasPhoto ? (
          <Image source={{ uri: item.photo }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoEmoji}>🐟</Text>
          </View>
        )}
        {item.released && (
          <View style={styles.releasedBadge}>
            <Text style={styles.releasedText}>C&R</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.speciesRow}>
          <Text style={styles.species} numberOfLines={1}>
            {item.species || 'Unknown species'}
          </Text>
          {item.synced === true && <Text style={styles.syncBadge}>✓</Text>}
          {item.synced === false && !item._syncError && (
            <Text style={styles.pendingBadge}>↻</Text>
          )}
          {item._syncError && <Text style={styles.errorBadge}>✗</Text>}
        </View>

        <View style={styles.stats}>
          {item.weight != null && (
            <View style={styles.stat}>
              <Text style={styles.statIcon}>⚖️</Text>
              <Text style={styles.statValue}>
                {formatWeight(item.weight, units)}
              </Text>
            </View>
          )}
          {item.length != null && (
            <View style={styles.stat}>
              <Text style={styles.statIcon}>📏</Text>
              <Text style={styles.statValue}>
                {formatLength(item.length, units)}
              </Text>
            </View>
          )}
        </View>

        {item.bait ? (
          <Text style={styles.bait} numberOfLines={1}>
            🪝 {item.bait}
          </Text>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          {item.waterType && (
            <Text style={styles.waterType}>
              {item.waterType === 'freshwater'
                ? '🏞️'
                : item.waterType === 'saltwater'
                ? '🌊'
                : '🏝️'}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffHrs = diffMs / (1000 * 60 * 60);

  if (diffHrs < 1) return 'Just now';
  if (diffHrs < 24) return `${Math.floor(diffHrs)}h ago`;
  if (diffHrs < 48) return 'Yesterday';
  if (diffHrs < 168) return `${Math.floor(diffHrs / 24)}d ago`;

  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const createStyles = (colors) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  photoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoEmoji: { fontSize: 28 },
  releasedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.success,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  releasedText: { fontSize: 9, color: colors.text, fontWeight: 'bold' },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  species: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
    marginBottom: 4,
    flex: 1,
  },
  speciesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  syncBadge: {
    fontSize: 12,
    color: colors.success,
    marginLeft: 6,
  },
  pendingBadge: {
    fontSize: 12,
    color: colors.accent,
    marginLeft: 6,
  },
  errorBadge: {
    fontSize: 12,
    color: colors.error,
    marginLeft: 6,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statIcon: { fontSize: 12 },
  statValue: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  bait: { fontSize: 12, color: colors.textTertiary, marginBottom: 4 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: { fontSize: 11, color: colors.textDisabled },
  waterType: { fontSize: 14 },
});
