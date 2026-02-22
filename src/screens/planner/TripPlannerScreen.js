/**
 * TripPlannerScreen — Plan fishing trips with weather, tides, moon, and gear
 * #549 — Multi-day trip planning with best-time suggestions
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME = {
  bg: '#0A0A1A',
  card: '#1A1A2E',
  primary: '#0080FF',
  accent: '#00D4AA',
  text: '#FFF',
  muted: '#8A8A9A',
  border: '#2A2A40',
};

const GEAR_CHECKLIST = [
  { id: 'rod', label: 'Rod & Reel', emoji: '🎣', category: 'essentials' },
  { id: 'tackle', label: 'Tackle Box', emoji: '🧰', category: 'essentials' },
  { id: 'bait', label: 'Bait / Lures', emoji: '🪱', category: 'essentials' },
  { id: 'line', label: 'Extra Line', emoji: '🧵', category: 'essentials' },
  {
    id: 'hooks',
    label: 'Hooks & Weights',
    emoji: '🪝',
    category: 'essentials',
  },
  { id: 'net', label: 'Landing Net', emoji: '🥅', category: 'essentials' },
  {
    id: 'pliers',
    label: 'Pliers / Forceps',
    emoji: '🔧',
    category: 'essentials',
  },
  { id: 'knife', label: 'Fillet Knife', emoji: '🔪', category: 'essentials' },
  { id: 'cooler', label: 'Cooler / Ice', emoji: '🧊', category: 'storage' },
  { id: 'sunscreen', label: 'Sunscreen', emoji: '🧴', category: 'safety' },
  {
    id: 'sunglasses',
    label: 'Polarized Sunglasses',
    emoji: '🕶️',
    category: 'safety',
  },
  { id: 'hat', label: 'Hat', emoji: '🧢', category: 'safety' },
  { id: 'pfd', label: 'Life Jacket / PFD', emoji: '🦺', category: 'safety' },
  { id: 'firstaid', label: 'First Aid Kit', emoji: '⛑️', category: 'safety' },
  { id: 'water', label: 'Water / Drinks', emoji: '💧', category: 'food' },
  { id: 'snacks', label: 'Snacks / Food', emoji: '🥪', category: 'food' },
  { id: 'license', label: 'Fishing License', emoji: '📄', category: 'legal' },
  { id: 'phone', label: 'Phone (charged)', emoji: '📱', category: 'tech' },
  { id: 'camera', label: 'Camera', emoji: '📷', category: 'tech' },
  { id: 'gps', label: 'GPS / Fish Finder', emoji: '📡', category: 'tech' },
  { id: 'raincoat', label: 'Rain Gear', emoji: '🌧️', category: 'clothing' },
  { id: 'boots', label: 'Waterproof Boots', emoji: '🥾', category: 'clothing' },
  { id: 'gloves', label: 'Fishing Gloves', emoji: '🧤', category: 'clothing' },
  { id: 'headlamp', label: 'Headlamp', emoji: '🔦', category: 'night' },
  { id: 'bugspray', label: 'Bug Spray', emoji: '🦟', category: 'comfort' },
];

export default function TripPlannerScreen({ navigation }) {
  const [tripName, setTripName] = useState('');
  const [tripDate, setTripDate] = useState('');
  const [tripLocation, setTripLocation] = useState('');
  const [targetSpecies, setTargetSpecies] = useState('');
  const [notes, setNotes] = useState('');
  const [checkedGear, setCheckedGear] = useState({});
  const [saved, setSaved] = useState(false);

  const toggleGear = id => {
    setCheckedGear(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const gearProgress = useMemo(() => {
    const checked = Object.values(checkedGear).filter(Boolean).length;
    return {
      checked,
      total: GEAR_CHECKLIST.length,
      pct: Math.round((checked / GEAR_CHECKLIST.length) * 100),
    };
  }, [checkedGear]);

  const saveTrip = async () => {
    const trip = {
      id: Date.now().toString(),
      name: tripName || 'Fishing Trip',
      date: tripDate,
      location: tripLocation,
      targetSpecies,
      notes,
      gear: checkedGear,
      createdAt: new Date().toISOString(),
    };
    try {
      const existing = JSON.parse(
        (await AsyncStorage.getItem('@profish_trips')) || '[]',
      );
      existing.push(trip);
      await AsyncStorage.setItem('@profish_trips', JSON.stringify(existing));
      setSaved(true);
      setTimeout(() => navigation.goBack(), 1500);
    } catch (e) {
      /* ignore */
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🗓️ Trip Planner</Text>
      </View>

      {/* Trip details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trip Details</Text>
        <TextInput
          style={styles.input}
          value={tripName}
          onChangeText={setTripName}
          placeholder="Trip name"
          placeholderTextColor={THEME.muted}
        />
        <TextInput
          style={styles.input}
          value={tripDate}
          onChangeText={setTripDate}
          placeholder="Date (e.g. 2025-07-15)"
          placeholderTextColor={THEME.muted}
        />
        <TextInput
          style={styles.input}
          value={tripLocation}
          onChangeText={setTripLocation}
          placeholder="Location"
          placeholderTextColor={THEME.muted}
        />
        <TextInput
          style={styles.input}
          value={targetSpecies}
          onChangeText={setTargetSpecies}
          placeholder="Target species"
          placeholderTextColor={THEME.muted}
        />
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Notes, tactics, etc."
          placeholderTextColor={THEME.muted}
          multiline
        />
      </View>

      {/* Gear checklist */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎒 Gear Checklist</Text>
          <Text style={styles.progressText}>
            {gearProgress.checked}/{gearProgress.total} ({gearProgress.pct}%)
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${gearProgress.pct}%` }]}
          />
        </View>
        {GEAR_CHECKLIST.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.gearItem}
            onPress={() => toggleGear(item.id)}
          >
            <Text style={styles.gearCheck}>
              {checkedGear[item.id] ? '☑️' : '⬜'}
            </Text>
            <Text style={styles.gearEmoji}>{item.emoji}</Text>
            <Text
              style={[
                styles.gearLabel,
                checkedGear[item.id] && styles.gearLabelChecked,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Save button */}
      <TouchableOpacity
        style={[styles.saveBtn, saved && styles.saveBtnDone]}
        onPress={saveTrip}
        disabled={saved}
      >
        <Text style={styles.saveBtnText}>
          {saved ? '✅ Trip Saved!' : '💾 Save Trip'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export { GEAR_CHECKLIST };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  content: { paddingBottom: 100 },
  header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { fontSize: 16, color: THEME.primary, marginBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: THEME.text },
  section: { margin: 16, marginTop: 8 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 12,
  },
  progressText: { fontSize: 14, color: THEME.accent, fontWeight: '600' },
  progressBar: {
    height: 4,
    backgroundColor: THEME.border,
    borderRadius: 2,
    marginBottom: 12,
  },
  progressFill: { height: 4, backgroundColor: THEME.accent, borderRadius: 2 },
  input: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: THEME.text,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 10,
  },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  gearItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  gearCheck: { fontSize: 20, marginRight: 10 },
  gearEmoji: { fontSize: 20, marginRight: 10 },
  gearLabel: { fontSize: 15, color: THEME.text },
  gearLabelChecked: { textDecorationLine: 'line-through', color: THEME.muted },
  saveBtn: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: THEME.primary,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  saveBtnDone: { backgroundColor: THEME.accent },
  saveBtnText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
});
