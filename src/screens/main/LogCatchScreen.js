/**
 * LogCatchScreen — Modal for logging a new catch
 * Features: SpeciesPicker, GPS auto-fill, photo picker, weather auto-capture
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Geolocation from '@react-native-community/geolocation';
import catchService from '../../services/catchService';
import weatherService from '../../services/weatherService';
import { useApp } from '../../store/AppContext';
import { checkLimit, requireFeature } from '../../services/featureGate';
import { notificationSuccess, notificationWarning } from '../../utils/haptics';
import SpeciesPicker from '../../components/SpeciesPicker';

// Image picker - graceful import
let launchImageLibrary, launchCamera;
try {
  const imagePicker = require('react-native-image-picker');
  launchImageLibrary = imagePicker.launchImageLibrary;
  launchCamera = imagePicker.launchCamera;
} catch (e) {
  // Not linked yet
}

const PHOTO_OPTIONS = {
  mediaType: 'photo',
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.8,
  includeExtra: false,
};

// Water type options
const WATER_TYPES = [
  { key: 'freshwater', label: '🏞️ Fresh', color: '#4FC3F7' },
  { key: 'saltwater', label: '🌊 Salt', color: '#0080FF' },
  { key: 'brackish', label: '🌿 Brackish', color: '#66BB6A' },
];

// Fishing method options
const METHODS = [
  'Spinning',
  'Fly',
  'Baitcasting',
  'Trolling',
  'Bottom',
  'Jigging',
  'Surf',
  'Ice',
  'Spearfishing',
  'Other',
];

// Common bait presets
const BAIT_PRESETS = [
  'Worm',
  'Minnow',
  'Shrimp',
  'Crab',
  'Squid',
  'Spinner',
  'Spoon',
  'Jig',
  'Crankbait',
  'Soft Plastic',
  'Fly',
  'Popper',
  'Swimbait',
  'Drop Shot',
  'Live Bait',
];

export default function LogCatchScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { state, dispatch } = useApp();
  const units = state.units || 'metric';

  // Accept pre-filled coordinates from map long-press or edit data
  const routeCoords = route?.params;
  const editCatch = route?.params?.editCatch || null;
  const isEditing = !!editCatch;

  // Form state — pre-fill from editCatch if editing
  const [species, setSpecies] = useState(editCatch?.species || '');
  const [weight, setWeight] = useState(
    editCatch?.weight
      ? units === 'imperial'
        ? String((editCatch.weight / 0.453592).toFixed(1))
        : String(editCatch.weight)
      : '',
  );
  const [length, setLength] = useState(
    editCatch?.length
      ? units === 'imperial'
        ? String((editCatch.length / 2.54).toFixed(1))
        : String(editCatch.length)
      : '',
  );
  const [bait, setBait] = useState(editCatch?.bait || '');
  const [notes, setNotes] = useState(editCatch?.notes || '');
  const [released, setReleased] = useState(editCatch?.released || false);
  const [photoUri, setPhotoUri] = useState(editCatch?.photo || null);
  const [waterType, setWaterType] = useState(
    editCatch?.waterType || 'freshwater',
  );
  const [method, setMethod] = useState(editCatch?.method || '');
  const [saving, setSaving] = useState(false);

  // Auto-captured data
  const [coords, setCoords] = useState(
    editCatch
      ? { latitude: editCatch.latitude, longitude: editCatch.longitude }
      : routeCoords?.latitude
      ? routeCoords
      : null,
  );
  const [autoWeather, setAutoWeather] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(
    !editCatch && !routeCoords?.latitude,
  );

  // Get GPS on mount (skip if coords came from route or editing)
  useEffect(() => {
    if (editCatch) return; // Already have coords from edited catch
    if (routeCoords?.latitude) {
      // Coords from map long-press — fetch weather for that location
      weatherService
        .getWeather(routeCoords.latitude, routeCoords.longitude)
        .then(setAutoWeather)
        .catch(() => {});
      return;
    }
    (async () => {
      try {
        if (Platform.OS === 'android') {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
        }
        Geolocation.getCurrentPosition(
          pos => {
            const { latitude, longitude } = pos.coords;
            setCoords({ latitude, longitude });
            setGpsLoading(false);
            // Auto-fetch weather
            weatherService
              .getWeather(latitude, longitude)
              .then(setAutoWeather)
              .catch(() => {});
          },
          () => setGpsLoading(false),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
        );
      } catch {
        setGpsLoading(false);
      }
    })();
  }, []);

  function handlePhoto() {
    if (!launchImageLibrary) {
      Alert.alert(
        'Photo',
        'Image picker not available yet. Link native module.',
      );
      return;
    }
    Alert.alert(t('catch.addPhoto', 'Add Photo'), '', [
      {
        text: t('catch.takePhoto', 'Take Photo'),
        onPress: () => {
          launchCamera({ ...PHOTO_OPTIONS, saveToPhotos: false }, res => {
            if (!res.didCancel && !res.errorCode && res.assets?.[0]) {
              setPhotoUri(res.assets[0].uri);
            }
          });
        },
      },
      {
        text: t('catch.chooseFromLibrary', 'Choose from Library'),
        onPress: () => {
          launchImageLibrary(PHOTO_OPTIONS, res => {
            if (!res.didCancel && !res.errorCode && res.assets?.[0]) {
              setPhotoUri(res.assets[0].uri);
            }
          });
        },
      },
      { text: t('common.cancel', 'Cancel'), style: 'cancel' },
    ]);
  }

  async function handleSave() {
    if (!species.trim()) {
      Alert.alert(
        t('catch.error', 'Error'),
        t('catch.speciesRequired', 'Please enter a species'),
      );
      return;
    }

    // Enforce free tier catch limit (skip if editing)
    if (!isEditing) {
      try {
        await catchService.init();
        const monthCount = await catchService.getMonthCatchCount();
        const { allowed, max } = checkLimit('maxCatchesPerMonth', monthCount);
        if (!allowed) {
          const wantsUpgrade = await requireFeature('maxCatchesPerMonth');
          if (wantsUpgrade) {
            navigation.navigate('Profile');
          }
          return;
        }
      } catch {}
    }

    setSaving(true);
    try {
      await catchService.init();
      const catchData = {
        species: species.trim(),
        weight: weight
          ? units === 'imperial'
            ? parseFloat(weight) * 0.453592
            : parseFloat(weight)
          : null,
        length: length
          ? units === 'imperial'
            ? parseFloat(length) * 2.54
            : parseFloat(length)
          : null,
        bait: bait.trim(),
        method,
        waterType,
        notes: notes.trim(),
        released,
        photo: photoUri,
        latitude: coords?.latitude || 0,
        longitude: coords?.longitude || 0,
        conditions: autoWeather
          ? {
              temp: autoWeather.temp,
              weather: autoWeather.description,
              wind: autoWeather.wind,
              pressure: autoWeather.pressure,
            }
          : editCatch?.conditions || null,
      };

      if (isEditing) {
        const updated = await catchService.updateCatch(editCatch.id, catchData);
        dispatch({ type: 'UPDATE_CATCH', payload: updated });
        notificationSuccess();
        navigation.goBack();
      } else {
        const saved = await catchService.logCatch(catchData);
        dispatch({ type: 'ADD_CATCH', payload: saved });
        notificationSuccess();

        // Offer "Log Another" quick action
        Alert.alert(
          t('catch.saved', '🎉 Catch Saved!'),
          t('catch.savedMessage', 'Your catch has been logged successfully.'),
          [
            {
              text: t('catch.logAnother', 'Log Another'),
              onPress: () => {
                // Reset all form fields
                setSpecies('');
                setWeight('');
                setLength('');
                setBait('');
                setMethod('');
                setWaterType('saltwater');
                setNotes('');
                setReleased(false);
                setPhotoUri(null);
              },
            },
            {
              text: t('common.done', 'Done'),
              style: 'cancel',
              onPress: () => navigation.goBack(),
            },
          ],
        );
      }
    } catch (e) {
      notificationWarning();
      Alert.alert(t('catch.error', 'Error'), e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancel}>{t('common.cancel', 'Cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEditing
              ? t('catch.editCatch', 'Edit Catch')
              : t('catch.logCatch', 'Log Catch')}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text style={[styles.save, saving && { opacity: 0.5 }]}>
              {saving ? '...' : t('common.save', 'Save')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Photo */}
        <TouchableOpacity style={styles.photoBox} onPress={handlePhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoImage} />
          ) : (
            <>
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={styles.photoText}>
                {t('catch.addPhoto', 'Add Photo')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.form}>
          {/* Species picker */}
          <Text style={styles.label}>{t('catch.species', 'Species')} *</Text>
          <SpeciesPicker value={species} onSelect={setSpecies} />

          {/* Weight + Length row */}
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>
                {units === 'metric'
                  ? t('catch.weightKg', 'Weight (kg)')
                  : t('catch.weightLb', 'Weight (lb)')}
              </Text>
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
              <Text style={styles.label}>
                {units === 'metric'
                  ? t('catch.lengthCm', 'Length (cm)')
                  : t('catch.lengthIn', 'Length (in)')}
              </Text>
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

          {/* Water type selector */}
          <Text style={styles.label}>{t('catch.waterType', 'Water Type')}</Text>
          <View style={styles.chipRow}>
            {WATER_TYPES.map(wt => (
              <TouchableOpacity
                key={wt.key}
                style={[
                  styles.chip,
                  waterType === wt.key && {
                    borderColor: wt.color,
                    backgroundColor: wt.color + '20',
                  },
                ]}
                onPress={() => setWaterType(wt.key)}
              >
                <Text
                  style={[
                    styles.chipText,
                    waterType === wt.key && { color: wt.color },
                  ]}
                >
                  {wt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Method selector */}
          <Text style={styles.label}>{t('catch.method', 'Method')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.methodScroll}
          >
            {METHODS.map(m => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.chip,
                  method === m && {
                    borderColor: '#0080FF',
                    backgroundColor: 'rgba(0,128,255,0.15)',
                  },
                ]}
                onPress={() => setMethod(method === m ? '' : m)}
              >
                <Text
                  style={[
                    styles.chipText,
                    method === m && { color: '#0080FF' },
                  ]}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Bait */}
          <Text style={styles.label}>{t('catch.bait', 'Bait / Lure')}</Text>
          <TextInput
            style={styles.input}
            value={bait}
            onChangeText={setBait}
            placeholder={t('catch.baitPlaceholder', 'e.g. Worm, Spinner, Fly')}
            placeholderTextColor="#555"
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.methodScroll}
          >
            {BAIT_PRESETS.map(b => (
              <TouchableOpacity
                key={b}
                style={[
                  styles.chip,
                  bait === b && {
                    borderColor: '#FF9800',
                    backgroundColor: 'rgba(255,152,0,0.15)',
                  },
                ]}
                onPress={() => setBait(bait === b ? '' : b)}
              >
                <Text
                  style={[styles.chipText, bait === b && { color: '#FF9800' }]}
                >
                  {b}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Release toggle */}
          <TouchableOpacity
            style={styles.releaseToggle}
            onPress={() => setReleased(!released)}
          >
            <View style={[styles.checkbox, released && styles.checkboxActive]}>
              {released && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.releaseText}>
              {t('catch.released', 'Catch & Release')}
            </Text>
          </TouchableOpacity>

          {/* Notes */}
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

          {/* Auto-captured info */}
          <View style={styles.autoSection}>
            <Text style={styles.autoTitle}>
              {t('catch.autoCapture', 'Auto-captured')}
            </Text>
            <View style={styles.autoRow}>
              <Text style={styles.autoLabel}>📍 GPS</Text>
              {gpsLoading ? (
                <ActivityIndicator size="small" color="#0080FF" />
              ) : coords ? (
                <Text style={styles.autoValue}>
                  {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
                </Text>
              ) : (
                <Text style={styles.autoMissing}>Not available</Text>
              )}
            </View>
            {autoWeather && (
              <View style={styles.autoRow}>
                <Text style={styles.autoLabel}>🌤️ Weather</Text>
                <Text style={styles.autoValue}>
                  {autoWeather.temp}° • {autoWeather.description} •{' '}
                  {autoWeather.wind} km/h
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
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
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  photoIcon: { fontSize: 48, marginBottom: 8 },
  photoText: { color: '#888', fontSize: 16 },
  form: { padding: 20, paddingTop: 0 },
  label: {
    color: '#999',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  methodScroll: { marginBottom: -8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1a1a2e',
    marginRight: 6,
    marginBottom: 6,
  },
  chipText: { color: '#999', fontSize: 14 },
  releaseToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76,175,80,0.2)',
  },
  checkmark: { color: '#4CAF50', fontSize: 14, fontWeight: 'bold' },
  releaseText: { color: '#fff', fontSize: 16 },
  autoSection: {
    marginTop: 24,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
  },
  autoTitle: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  autoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  autoLabel: { color: '#888', fontSize: 14 },
  autoValue: { color: '#ccc', fontSize: 14 },
  autoMissing: { color: '#555', fontSize: 14, fontStyle: 'italic' },
});
