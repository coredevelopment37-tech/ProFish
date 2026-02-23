/**
 * MoonCalendarScreen — Solunar theory + moon phase fishing calendar
 * #551 — Moon phases with best fishing times
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import useTheme from '../../hooks/useTheme';

/**
 * Calculate moon phase for a given date
 * Returns 0-29.5 (synodic month)
 */
function getMoonPhase(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Conway's algorithm approximation
  let r = year % 100;
  r %= 19;
  if (r > 9) r -= 19;
  r = ((r * 11) % 30) + month + day;
  if (month < 3) r += 2;
  r = (r - (year < 2000 ? 4 : 8.3)) % 30;
  r = Math.round(r < 0 ? r + 30 : r);
  return r;
}

/**
 * Get moon phase name and emoji
 */
function getMoonInfo(phase) {
  if (phase <= 1 || phase >= 29)
    return { name: 'New Moon', emoji: '🌑', fishing: 'Excellent', score: 95 };
  if (phase <= 3)
    return { name: 'Waxing Crescent', emoji: '🌒', fishing: 'Good', score: 70 };
  if (phase <= 5)
    return { name: 'Waxing Crescent', emoji: '🌒', fishing: 'Good', score: 65 };
  if (phase <= 8)
    return { name: 'First Quarter', emoji: '🌓', fishing: 'Fair', score: 55 };
  if (phase <= 11)
    return { name: 'Waxing Gibbous', emoji: '🌔', fishing: 'Fair', score: 50 };
  if (phase <= 16)
    return { name: 'Full Moon', emoji: '🌕', fishing: 'Excellent', score: 90 };
  if (phase <= 19)
    return { name: 'Waning Gibbous', emoji: '🌖', fishing: 'Good', score: 65 };
  if (phase <= 22)
    return { name: 'Last Quarter', emoji: '🌗', fishing: 'Fair', score: 55 };
  return { name: 'Waning Crescent', emoji: '🌘', fishing: 'Good', score: 70 };
}

/**
 * Calculate solunar major/minor periods
 * @returns {{ major: [string, string], minor: [string, string] }}
 */
function getSolunarPeriods(date, lat = 40) {
  // Simplified solunar calculation based on moon transit
  const phase = getMoonPhase(date);
  const dayOfYear = Math.floor(
    (date - new Date(date.getFullYear(), 0, 0)) / 86400000,
  );

  // Moon overhead (transit) roughly shifts ~50 min per day
  const baseMinutes = (dayOfYear * 50) % 1440;
  const majorStart1 = baseMinutes;
  const majorStart2 = (majorStart1 + 720) % 1440; // Opposite transit
  const minorStart1 = (majorStart1 + 360) % 1440; // Moonrise/set
  const minorStart2 = (majorStart1 + 1080) % 1440;

  const fmt = mins => {
    const h = Math.floor(mins / 60) % 24;
    const m = Math.floor(mins % 60);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
  };

  return {
    major: [
      { start: fmt(majorStart1), end: fmt(majorStart1 + 120), duration: '2h' },
      { start: fmt(majorStart2), end: fmt(majorStart2 + 120), duration: '2h' },
    ],
    minor: [
      { start: fmt(minorStart1), end: fmt(minorStart1 + 60), duration: '1h' },
      { start: fmt(minorStart2), end: fmt(minorStart2 + 60), duration: '1h' },
    ],
  };
}

/**
 * Generate 30-day calendar data
 */
function generateCalendar(startDate) {
  const days = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const phase = getMoonPhase(date);
    const moonInfo = getMoonInfo(phase);
    const solunar = getSolunarPeriods(date);

    days.push({
      date,
      dateStr: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      phase,
      ...moonInfo,
      solunar,
      isToday: i === 0,
    });
  }
  return days;
}

function DayCard({ day, colors, styles }) {
  const scoreColor =
    day.score >= 80 ? colors.success : day.score >= 60 ? colors.accent : colors.error;

  return (
    <View style={[styles.dayCard, day.isToday && styles.dayCardToday]}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayDate}>{day.dateStr}</Text>
        <View style={styles.dayRight}>
          <Text style={styles.moonEmoji}>{day.emoji}</Text>
          <View
            style={[styles.scoreBadge, { backgroundColor: scoreColor + '20' }]}
          >
            <Text style={[styles.scoreText, { color: scoreColor }]}>
              {day.score}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.moonName}>{day.name}</Text>
      <Text style={styles.fishingRating}>Fishing: {day.fishing}</Text>

      <View style={styles.solunarRow}>
        <View style={styles.solunarBlock}>
          <Text style={styles.solunarLabel}>🔴 Major Periods</Text>
          {day.solunar.major.map((p, i) => (
            <Text key={i} style={styles.solunarTime}>
              {p.start} — {p.end} ({p.duration})
            </Text>
          ))}
        </View>
        <View style={styles.solunarBlock}>
          <Text style={styles.solunarLabel}>🟡 Minor Periods</Text>
          {day.solunar.minor.map((p, i) => (
            <Text key={i} style={styles.solunarTime}>
              {p.start} — {p.end} ({p.duration})
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function MoonCalendarScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [startDate] = useState(new Date());
  const calendar = useMemo(() => generateCalendar(startDate), [startDate]);

  // Best days in next 30 days
  const bestDays = useMemo(
    () => [...calendar].sort((a, b) => b.score - a.score).slice(0, 5),
    [calendar],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🌙 Moon Calendar</Text>
        <Text style={styles.headerDesc}>Solunar fishing predictions</Text>
      </View>

      {/* Best days banner */}
      <View style={styles.bestDaysBanner}>
        <Text style={styles.bestDaysTitle}>🏆 Best Days This Month</Text>
        <View style={styles.bestDaysList}>
          {bestDays.map((d, i) => (
            <View key={i} style={styles.bestDayChip}>
              <Text style={styles.bestDayText}>
                {d.emoji} {d.dateStr} ({d.score})
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Calendar */}
      <FlatList
        data={calendar}
        keyExtractor={item => item.dateStr}
        renderItem={({ item }) => <DayCard day={item} colors={colors} styles={styles} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

export { getMoonPhase, getMoonInfo, getSolunarPeriods };

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { fontSize: 16, color: colors.primary, marginBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: colors.text },
  headerDesc: { fontSize: 14, color: colors.textTertiary, marginTop: 4 },
  bestDaysBanner: {
    margin: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.accent + '40',
  },
  bestDaysTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 8,
  },
  bestDaysList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  bestDayChip: {
    backgroundColor: colors.accent + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  bestDayText: { fontSize: 12, color: colors.accent },
  listContent: { padding: 16, paddingTop: 0, paddingBottom: 100 },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayCardToday: { borderColor: colors.primary, borderWidth: 2 },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dayDate: { fontSize: 15, fontWeight: '700', color: colors.text },
  dayRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  moonEmoji: { fontSize: 24 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  scoreText: { fontSize: 14, fontWeight: '700' },
  moonName: { fontSize: 13, color: colors.textTertiary, marginBottom: 2 },
  fishingRating: { fontSize: 13, color: colors.accent, marginBottom: 10 },
  solunarRow: { flexDirection: 'row', gap: 12 },
  solunarBlock: { flex: 1 },
  solunarLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  solunarTime: { fontSize: 11, color: colors.textTertiary, lineHeight: 16 },
});
