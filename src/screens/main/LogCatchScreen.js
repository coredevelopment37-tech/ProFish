/**
 * LogCatchScreen — Modal for logging a new catch
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import catchService from '../../services/catchService';

export default function LogCatchScreen({ navigation }) {
  const { t } = useTranslation();
  const [species, setSpecies] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [bait, setBait] = useState('');
  const [notes, setNotes] = useState('');
  const [released, setReleased] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!species.trim()) {
      Alert.alert(
        t('catch.error', 'Error'),
        t('catch.speciesRequired', 'Please enter a species'),
      );
      return;
    }

    setSaving(true);
    try {
      await catchService.init();
      await catchService.logCatch({
        species: species.trim(),
        weight: weight ? parseFloat(weight) : null,
        length: length ? parseFloat(length) : null,
        bait: bait.trim(),
        notes: notes.trim(),
        released,
        latitude: 0, // TODO: Get from GPS
        longitude: 0,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert(t('catch.error', 'Error'), e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancel}>{t('common.cancel', 'Cancel')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('catch.logCatch', 'Log Catch')}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.save, saving && { opacity: 0.5 }]}>
            {t('common.save', 'Save')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Photo placeholder */}
      <TouchableOpacity style={styles.photoBox}>
        <Text style={styles.photoIcon}>📷</Text>
        <Text style={styles.photoText}>{t('catch.addPhoto', 'Add Photo')}</Text>
      </TouchableOpacity>

      <View style={styles.form}>
        <Text style={styles.label}>{t('catch.species', 'Species')} *</Text>
        <TextInput
          style={styles.input}
          value={species}
          onChangeText={setSpecies}
          placeholder={t('catch.speciesPlaceholder', 'e.g. Largemouth Bass')}
          placeholderTextColor="#555"
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>{t('catch.weight', 'Weight (kg)')}</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="0.0"
              placeholderTextColor="#555"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>{t('catch.length', 'Length (cm)')}</Text>
            <TextInput
              style={styles.input}
              value={length}
              onChangeText={setLength}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#555"
            />
          </View>
        </View>

        <Text style={styles.label}>{t('catch.bait', 'Bait / Lure')}</Text>
        <TextInput
          style={styles.input}
          value={bait}
          onChangeText={setBait}
          placeholder={t('catch.baitPlaceholder', 'e.g. Worm, Spinner, Fly')}
          placeholderTextColor="#555"
        />

        <Text style={styles.label}>{t('catch.notes', 'Notes')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          placeholder={t(
            'catch.notesPlaceholder',
            'Any details about the catch...',
          )}
          placeholderTextColor="#555"
        />

        <TouchableOpacity
          style={styles.releaseToggle}
          onPress={() => setReleased(!released)}
        >
          <Text style={styles.releaseIcon}>{released ? '✅' : '⬜'}</Text>
          <Text style={styles.releaseText}>
            {t('catch.released', 'Catch & Release')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  cancel: { color: '#888', fontSize: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  save: { color: '#0080FF', fontSize: 16, fontWeight: '600' },
  photoBox: {
    margin: 20,
    height: 200,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  photoIcon: { fontSize: 48, marginBottom: 8 },
  photoText: { color: '#888', fontSize: 16 },
  form: { padding: 20 },
  label: { color: '#ccc', fontSize: 14, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  releaseToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
  },
  releaseIcon: { fontSize: 20 },
  releaseText: { color: '#fff', fontSize: 16 },
});
