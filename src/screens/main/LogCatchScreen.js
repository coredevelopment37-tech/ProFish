/**
 * LogCatchScreen — Modal for logging a new catch
 * Features: SpeciesPicker, GPS auto-fill, photo picker, weather auto-capture
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
import useTheme from '../../hooks/useTheme';
import { AppIcon } from '../../constants/icons';
import { Input, ScreenHeader } from '../../components/Common';

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
  { key: 'freshwater', label: 'Fresh', icon: 'treePine', color: '#4FC3F7' },
  { key: 'saltwater', label: 'Salt', icon: 'waves', color: '#0080FF' },
  { key: 'brackish', label: 'Brackish', icon: 'leaf', color: '#66BB6A' },
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
  const { colors } = useTheme();
  const styles = createStyles(colors);
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
          t('catch.saved', 'Catch Saved!'),
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
        <ScreenHeader
          variant="modal"
          title={isEditing ? t('catch.editCatch', 'Edit Catch') : t('catch.logCatch', 'Log Catch')}
          onCancel={() => navigation.goBack()}
          onSave={handleSave}
          saveLabel={saving ? '...' : t('common.save', 'Save')}
          saveDisabled={saving}
        />

        {/* Photo */}
        <TouchableOpacity
          style={styles.photoBox}
          onPress={handlePhoto}
          accessibilityLabel={t('catch.addPhoto', 'Add Photo')}
          accessibilityRole="imagebutton"
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoImage} />
          ) : (
            <>
              <View style={{ marginBottom: 8 }}>
                <AppIcon name="camera" size={24} color={colors.textSecondary} />
              </View>
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
              <Input
                label={units === 'metric'
                  ? t('catch.weightKg', 'Weight (kg)')
                  : t('catch.weightLb', 'Weight (lb)')}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="0.0"
              />
            </View>
            <View style={styles.halfField}>
              <Input
                label={units === 'metric'
                  ? t('catch.lengthCm', 'Length (cm)')
                  : t('catch.lengthIn', 'Length (in)')}
                value={length}
                onChangeText={setLength}
                keyboardType="decimal-pad"
                placeholder="0"
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <AppIcon name={wt.icon} size={14} color={waterType === wt.key ? wt.color : colors.textSecondary} />
                  <Text
                    style={[
                      styles.chipText,
                      waterType === wt.key && { color: wt.color },
                    ]}
                  >
                    {wt.label}
                  </Text>
                </View>
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
                    borderColor: colors.primary,
                    backgroundColor: colors.primary + '26',
                  },
                ]}
                onPress={() => setMethod(method === m ? '' : m)}
              >
                <Text
                  style={[
                    styles.chipText,
                    method === m && { color: colors.primary },
                  ]}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Bait */}
          <Text style={styles.label}>{t('catch.bait', 'Bait / Lure')}</Text>
          <Input
            value={bait}
            onChangeText={setBait}
            placeholder={t('catch.baitPlaceholder', 'e.g. Worm, Spinner, Fly')}
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
                    borderColor: colors.accent,
                    backgroundColor: colors.accent + '26',
                  },
                ]}
                onPress={() => setBait(bait === b ? '' : b)}
              >
                <Text
                  style={[styles.chipText, bait === b && { color: colors.accent }]}
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
              {released && <AppIcon name="check" size={16} color={colors.success} />}
            </View>
            <Text style={styles.releaseText}>
              {t('catch.released', 'Catch & Release')}
            </Text>
          </TouchableOpacity>

          {/* Notes */}
          <Text style={styles.label}>{t('catch.notes', 'Notes')}</Text>
          <Input
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholder={t(
              'catch.notesPlaceholder',
              'Any details about the catch...',
            )}
          />

          {/* Auto-captured info */}
          <View style={styles.autoSection}>
            <Text style={styles.autoTitle}>
              {t('catch.autoCapture', 'Auto-captured')}
            </Text>
            <View style={styles.autoRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <AppIcon name="mapPin" size={14} color={colors.textSecondary} />
                <Text style={styles.autoLabel}>GPS</Text>
              </View>
              {gpsLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <AppIcon name="cloudSun" size={14} color={colors.textSecondary} />
                  <Text style={styles.autoLabel}>Weather</Text>
                </View>
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

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  photoBox: {
    margin: 20,
    height: 200,
    backgroundColor: colors.surface,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  photoIcon: { fontSize: 48, marginBottom: 8 },
  photoText: { color: colors.textTertiary, fontSize: 16 },
  form: { padding: 20, paddingTop: 0 },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 6,
    marginTop: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  methodScroll: { marginBottom: -8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: 6,
    marginBottom: 6,
  },
  chipText: { color: colors.textSecondary, fontSize: 14 },
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
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    borderColor: colors.success,
    backgroundColor: colors.success + '33',
  },
  checkmark: { color: colors.success, fontSize: 14, fontWeight: 'bold' },
  releaseText: { color: colors.text, fontSize: 16 },
  autoSection: {
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  autoTitle: {
    color: colors.textTertiary,
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
  autoLabel: { color: colors.textTertiary, fontSize: 14 },
  autoValue: { color: colors.textSecondary, fontSize: 14 },
  autoMissing: { color: colors.textDisabled, fontSize: 14, fontStyle: 'italic' },
});
