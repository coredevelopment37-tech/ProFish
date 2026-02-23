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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useTheme from '../../hooks/useTheme';
import { AppIcon } from '../../constants/icons';
import { Button, Input, ScreenHeader } from '../../components/Common';

const GEAR_CHECKLIST = [
  { id: 'rod', label: 'Rod & Reel', icon: 'fish', category: 'essentials' },
  { id: 'tackle', label: 'Tackle Box', icon: 'package', category: 'essentials' },
  { id: 'bait', label: 'Bait / Lures', icon: 'anchor', category: 'essentials' },
  { id: 'line', label: 'Extra Line', icon: 'anchor', category: 'essentials' },
  {
    id: 'hooks',
    label: 'Hooks & Weights',
    icon: 'anchor',
    category: 'essentials',
  },
  { id: 'net', label: 'Landing Net', icon: 'fish', category: 'essentials' },
  {
    id: 'pliers',
    label: 'Pliers / Forceps',
    icon: 'wrench',
    category: 'essentials',
  },
  { id: 'knife', label: 'Fillet Knife', icon: 'scissors', category: 'essentials' },
  { id: 'cooler', label: 'Cooler / Ice', icon: 'snowflake', category: 'storage' },
  { id: 'sunscreen', label: 'Sunscreen', icon: 'droplet', category: 'safety' },
  {
    id: 'sunglasses',
    label: 'Polarized Sunglasses',
    icon: 'glasses',
    category: 'safety',
  },
  { id: 'hat', label: 'Hat', icon: 'shield', category: 'safety' },
  { id: 'pfd', label: 'Life Jacket / PFD', icon: 'shield', category: 'safety' },
  { id: 'firstaid', label: 'First Aid Kit', icon: 'shieldAlert', category: 'safety' },
  { id: 'water', label: 'Water / Drinks', icon: 'droplet', category: 'food' },
  { id: 'snacks', label: 'Snacks / Food', icon: 'package', category: 'food' },
  { id: 'license', label: 'Fishing License', icon: 'fileText', category: 'legal' },
  { id: 'phone', label: 'Phone (charged)', icon: 'smartphone', category: 'tech' },
  { id: 'camera', label: 'Camera', icon: 'camera', category: 'tech' },
  { id: 'gps', label: 'GPS / Fish Finder', icon: 'satellite', category: 'tech' },
  { id: 'raincoat', label: 'Rain Gear', icon: 'cloudRain', category: 'clothing' },
  { id: 'boots', label: 'Waterproof Boots', icon: 'footprints', category: 'clothing' },
  { id: 'gloves', label: 'Fishing Gloves', icon: 'shield', category: 'clothing' },
  { id: 'headlamp', label: 'Headlamp', icon: 'flashlight', category: 'night' },
  { id: 'bugspray', label: 'Bug Spray', icon: 'bug', category: 'comfort' },
];

export default function TripPlannerScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

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
      <ScreenHeader variant="large" title="Trip Planner" onBack={() => navigation.goBack()} />

      {/* Trip details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trip Details</Text>
        <Input
          value={tripName}
          onChangeText={setTripName}
          placeholder="Trip name"
        />
        <Input
          value={tripDate}
          onChangeText={setTripDate}
          placeholder="Date (e.g. 2025-07-15)"
        />
        <Input
          value={tripLocation}
          onChangeText={setTripLocation}
          placeholder="Location"
        />
        <Input
          value={targetSpecies}
          onChangeText={setTargetSpecies}
          placeholder="Target species"
        />
        <Input
          value={notes}
          onChangeText={setNotes}
          placeholder="Notes, tactics, etc."
          multiline
        />
      </View>

      {/* Gear checklist */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}><AppIcon name="package" size={18} color={colors.text} /> Gear Checklist</Text>
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
              {checkedGear[item.id] ? <AppIcon name="checkCircle" size={20} color={colors.accent} /> : <AppIcon name="circle" size={20} color={colors.textTertiary} />}
            </Text>
            <Text style={styles.gearEmoji}><AppIcon name={item.icon} size={20} color={colors.text} /></Text>
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
      <Button
        title={saved ? 'Trip Saved!' : 'Save Trip'}
        onPress={saveTrip}
        variant="primary"
        size="lg"
        icon={saved ? 'check-circle' : 'save'}
        disabled={saved}
        style={{ marginHorizontal: 16, borderRadius: 24, ...(saved && { backgroundColor: colors.accent }) }}
      />
    </ScrollView>
  );
}

export { GEAR_CHECKLIST };

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 100 },
  section: { margin: 16, marginTop: 8 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  progressText: { fontSize: 14, color: colors.accent, fontWeight: '600' },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 12,
  },
  progressFill: { height: 4, backgroundColor: colors.accent, borderRadius: 2 },
  gearItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  gearCheck: { fontSize: 20, marginRight: 10 },
  gearEmoji: { fontSize: 20, marginRight: 10 },
  gearLabel: { fontSize: 15, color: colors.text },
  gearLabelChecked: { textDecorationLine: 'line-through', color: colors.textTertiary },

});
