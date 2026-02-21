/**
 * SeasonalCalendarScreen — ProFish
 *
 * Shows a 12-month species calendar for the user's region.
 * Each species has a colour-coded "best season" bar spanning
 * peak, good, and off-season months.
 *
 * Data driven by species peak-season metadata + user's catches.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import catchService from '../../services/catchService';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// ── Default species season data ──────────────────────────
// Each entry: { species, peak: [months], good: [months] }
// months are 0-indexed (Jan=0)
// Derived from general fishing knowledge; will be personalised via catch history

const DEFAULT_SEASONS = [
  {
    species: 'Largemouth Bass',
    peak: [4, 5, 6], // May-Jul
    good: [3, 7, 8, 9], // Apr, Aug-Oct
    color: '#50C878',
  },
  {
    species: 'Smallmouth Bass',
    peak: [5, 6, 7], // Jun-Aug
    good: [4, 8, 9], // May, Sep, Oct
    color: '#4A90D9',
  },
  {
    species: 'Rainbow Trout',
    peak: [2, 3, 4, 9, 10], // Mar-May, Oct-Nov
    good: [1, 5, 8, 11], // Feb, Jun, Sep, Dec
    color: '#FF6B8A',
  },
  {
    species: 'Northern Pike',
    peak: [3, 4, 9, 10], // Apr-May, Oct-Nov
    good: [2, 5, 8, 11], // Mar, Jun, Sep, Dec
    color: '#8B5CF6',
  },
  {
    species: 'Walleye',
    peak: [3, 4, 5, 9, 10], // Apr-Jun, Oct-Nov
    good: [2, 6, 8], // Mar, Jul, Sep
    color: '#FFB347',
  },
  {
    species: 'Bluefin Tuna',
    peak: [5, 6, 7, 8], // Jun-Sep
    good: [4, 9, 10], // May, Oct, Nov
    color: '#0080FF',
  },
  {
    species: 'Striped Bass',
    peak: [3, 4, 5, 9, 10], // Apr-Jun, Oct-Nov
    good: [2, 6, 8, 11], // Mar, Jul, Sep, Dec
    color: '#00BFA5',
  },
  {
    species: 'Redfish',
    peak: [8, 9, 10], // Sep-Nov
    good: [3, 4, 7, 11], // Apr, May, Aug, Dec
    color: '#FF5252',
  },
  {
    species: 'Snook',
    peak: [5, 6, 7, 8], // Jun-Sep
    good: [4, 9, 10], // May, Oct, Nov
    color: '#FFEA00',
  },
  {
    species: 'Salmon',
    peak: [6, 7, 8, 9], // Jul-Oct
    good: [5, 10], // Jun, Nov
    color: '#FF7043',
  },
  {
    species: 'Carp',
    peak: [4, 5, 6, 7, 8], // May-Sep
    good: [3, 9], // Apr, Oct
    color: '#795548',
  },
  {
    species: 'Catfish',
    peak: [5, 6, 7], // Jun-Aug
    good: [4, 8, 9], // May, Sep, Oct
    color: '#607D8B',
  },
];

function getMonthState(monthIdx, peak, good) {
  if (peak.includes(monthIdx)) return 'peak';
  if (good.includes(monthIdx)) return 'good';
  return 'off';
}

export default function SeasonalCalendarScreen({ navigation }) {
  const { t } = useTranslation();
  const [catches, setCatches] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState(null);

  useEffect(() => {
    (async () => {
      await catchService.init();
      const all = await catchService.getCatches({ limit: 500 });
      setCatches(all);
    })();
  }, []);

  // Derive personal season data from catch history
  const personalSeasons = useMemo(() => {
    const speciesMonthMap = {};
    for (const c of catches) {
      if (!c.species) continue;
      const month = new Date(c.createdAt).getMonth();
      if (!speciesMonthMap[c.species]) {
        speciesMonthMap[c.species] = Array(12).fill(0);
      }
      speciesMonthMap[c.species][month]++;
    }

    // Merge catch-data species with defaults
    const personal = [];
    for (const [species, months] of Object.entries(speciesMonthMap)) {
      const maxCount = Math.max(...months);
      if (maxCount === 0) continue;
      const peak = [];
      const good = [];
      months.forEach((count, i) => {
        if (count >= maxCount * 0.7) peak.push(i);
        else if (count >= maxCount * 0.3) good.push(i);
      });
      personal.push({
        species,
        peak,
        good,
        color: `hsl(${Math.abs(species.charCodeAt(0) * 37) % 360}, 65%, 55%)`,
        catchCount: months.reduce((a, b) => a + b, 0),
        fromCatches: true,
      });
    }

    return personal;
  }, [catches]);

  // Combine: personal first, then defaults (excluding duplicates)
  const allSeasons = useMemo(() => {
    const personalNames = new Set(
      personalSeasons.map(p => p.species.toLowerCase()),
    );
    const defaults = DEFAULT_SEASONS.filter(
      d => !personalNames.has(d.species.toLowerCase()),
    );
    return [...personalSeasons, ...defaults];
  }, [personalSeasons]);

  const currentMonth = new Date().getMonth();

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
        <Text style={styles.headerTitle}>Seasonal Calendar</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#50C878' }]} />
          <Text style={styles.legendText}>Peak season</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FFB34766' }]} />
          <Text style={styles.legendText}>Good</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#333' }]} />
          <Text style={styles.legendText}>Off-season</Text>
        </View>
        {personalSeasons.length > 0 && (
          <View style={styles.legendItem}>
            <Text style={styles.legendText}>⭐ = from your catches</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Month header row */}
        <View style={styles.monthRow}>
          <View style={styles.speciesCol} />
          {MONTHS.map((m, i) => (
            <View
              key={m}
              style={[
                styles.monthCell,
                i === currentMonth && styles.monthCellCurrent,
              ]}
            >
              <Text
                style={[
                  styles.monthText,
                  i === currentMonth && styles.monthTextCurrent,
                ]}
              >
                {m}
              </Text>
            </View>
          ))}
        </View>

        {/* Species rows */}
        {allSeasons.map((entry, idx) => (
          <TouchableOpacity
            key={`${entry.species}-${idx}`}
            style={[
              styles.speciesRow,
              selectedSpecies === entry.species && styles.speciesRowSelected,
            ]}
            onPress={() =>
              setSelectedSpecies(
                selectedSpecies === entry.species ? null : entry.species,
              )
            }
          >
            <View style={styles.speciesCol}>
              <Text style={styles.speciesName} numberOfLines={1}>
                {entry.fromCatches ? '⭐ ' : ''}
                {entry.species}
              </Text>
              {entry.fromCatches && (
                <Text style={styles.catchCountLabel}>
                  {entry.catchCount} catch{entry.catchCount !== 1 ? 'es' : ''}
                </Text>
              )}
            </View>
            {MONTHS.map((_, mi) => {
              const state = getMonthState(mi, entry.peak, entry.good);
              return (
                <View key={mi} style={styles.calCell}>
                  <View
                    style={[
                      styles.calBar,
                      state === 'peak' && { backgroundColor: entry.color },
                      state === 'good' && {
                        backgroundColor: entry.color + '44',
                      },
                      state === 'off' && { backgroundColor: '#222' },
                      mi === currentMonth && styles.calBarCurrent,
                    ]}
                  />
                </View>
              );
            })}
          </TouchableOpacity>
        ))}

        {/* Detail panel for selected species */}
        {selectedSpecies &&
          (() => {
            const entry = allSeasons.find(e => e.species === selectedSpecies);
            if (!entry) return null;
            return (
              <View style={styles.detailPanel}>
                <Text style={styles.detailTitle}>{entry.species}</Text>
                <Text style={styles.detailRow}>
                  Peak months:{' '}
                  {entry.peak.map(m => MONTHS[m]).join(', ') || 'N/A'}
                </Text>
                <Text style={styles.detailRow}>
                  Good months:{' '}
                  {entry.good.map(m => MONTHS[m]).join(', ') || 'N/A'}
                </Text>
                {entry.fromCatches && (
                  <Text style={styles.detailRow}>
                    Based on your {entry.catchCount} logged catch
                    {entry.catchCount !== 1 ? 'es' : ''}
                  </Text>
                )}
              </View>
            );
          })()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#1a1a2e',
  },
  backBtn: { padding: 8 },
  backText: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendText: { color: '#888', fontSize: 11 },

  scrollContent: { paddingBottom: 40 },

  monthRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  speciesCol: { width: 100, paddingLeft: 12 },
  monthCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  monthCellCurrent: {
    backgroundColor: '#0080FF11',
    borderRadius: 4,
  },
  monthText: { color: '#666', fontSize: 10, fontWeight: '600' },
  monthTextCurrent: { color: '#0080FF', fontWeight: '700' },

  speciesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1a1a2e',
  },
  speciesRowSelected: {
    backgroundColor: '#0080FF0a',
  },
  speciesName: { color: '#ccc', fontSize: 11, fontWeight: '600' },
  catchCountLabel: { color: '#888', fontSize: 9, marginTop: 1 },

  calCell: {
    flex: 1,
    paddingHorizontal: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calBar: { width: '85%', height: 16, borderRadius: 3 },
  calBarCurrent: { borderWidth: 1, borderColor: '#0080FF88' },

  detailPanel: {
    margin: 16,
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  detailTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  detailRow: { color: '#aaa', fontSize: 13, marginBottom: 4 },
});
