/**
 * NightSafetyScreen — ProFish
 * Night fishing safety center: check-in timer, emergency contacts,
 * sunrise countdown, weather danger alerts, and safety checklist.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Vibration,
  AppState,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  SAFETY_CHECKIN_INTERVALS,
  setSafetyCheckIn,
  performCheckIn,
} from '../../services/nightFishingService';
import useTheme from '../../hooks/useTheme';
import { AppIcon } from '../../constants/icons';
import { Button, Input, ScreenHeader } from '../../components/Common';

// ── Safety Checklist ──
const SAFETY_CHECKLIST = [
  { id: 'sc_pfd', text: 'Wearing PFD / Life Jacket', critical: true },
  {
    id: 'sc_lights',
    text: 'Navigation lights on (if on boat)',
    critical: true,
  },
  {
    id: 'sc_phone',
    text: 'Phone fully charged + waterproof case',
    critical: true,
  },
  { id: 'sc_powerbank', text: 'Power bank packed', critical: false },
  { id: 'sc_buddy', text: "Told someone where you're going", critical: true },
  { id: 'sc_return', text: 'Shared estimated return time', critical: true },
  { id: 'sc_firstaid', text: 'First aid kit accessible', critical: true },
  { id: 'sc_whistle', text: 'Whistle / signal device', critical: true },
  { id: 'sc_strobe', text: 'Emergency strobe light', critical: false },
  { id: 'sc_headlamp', text: 'Red-light headlamp tested', critical: false },
  { id: 'sc_radio', text: 'VHF radio / walkie-talkie', critical: false },
  {
    id: 'sc_weather',
    text: 'Weather forecast checked (no storms)',
    critical: true,
  },
  { id: 'sc_tide', text: 'Tide schedule reviewed', critical: false },
  {
    id: 'sc_wading',
    text: 'Wading: studded boots + stingray shuffle',
    critical: false,
  },
  { id: 'sc_reflective', text: 'Wearing reflective gear', critical: false },
  {
    id: 'sc_license',
    text: 'Fishing license (+ night/gigging permit if needed)',
    critical: true,
  },
];

// ── Emergency numbers ──
const EMERGENCY_NUMBERS = [
  {
    id: 'em_911',
    label: '🆘 Emergency (911)',
    number: '911',
    region: 'US/Canada',
  },
  {
    id: 'em_112',
    label: '🆘 Emergency (112)',
    number: '112',
    region: 'EU/International',
  },
  {
    id: 'em_uscg',
    label: 'US Coast Guard',
    labelIcon: 'anchor',
    number: '+1-800-424-8802',
    region: 'US',
  },
  {
    id: 'em_vhf16',
    label: 'VHF Channel 16',
    labelIcon: 'radio',
    number: null,
    region: 'Maritime',
    note: 'Tune radio to Ch 16 for distress',
  },
  {
    id: 'em_epirbsart',
    label: 'EPIRB/SART',
    labelIcon: 'lifebuoy',
    number: null,
    region: 'Maritime',
    note: 'Activate if capsized or person overboard',
  },
];

export default function NightSafetyScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { t } = useTranslation();
  const [checkedItems, setCheckedItems] = useState({});
  const [checkInInterval, setCheckInInterval] = useState('every_60');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [checkInActive, setCheckInActive] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [sunriseTime, setSunriseTime] = useState(null);
  const checkInTimerRef = useRef(null);

  useEffect(() => {
    // Simple sunrise estimate (in production: use solunarService.getSunTimes)
    const now = new Date();
    const sunrise = new Date(now);
    if (now.getHours() >= 19) {
      sunrise.setDate(sunrise.getDate() + 1);
    }
    sunrise.setHours(6, 30, 0, 0); // Approximate sunrise
    setSunriseTime(sunrise);

    return () => {
      if (checkInTimerRef.current) clearInterval(checkInTimerRef.current);
    };
  }, []);

  // ── Sunrise countdown ──
  useEffect(() => {
    if (!sunriseTime) return;

    const timer = setInterval(() => {
      const now = new Date();
      const diff = sunriseTime.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown('Sunrise!');
        clearInterval(timer);
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setCountdown(`${hours}h ${mins}m until sunrise`);
    }, 60000);

    // Initial calc
    const diff = sunriseTime.getTime() - Date.now();
    if (diff > 0) {
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setCountdown(`${hours}h ${mins}m until sunrise`);
    }

    return () => clearInterval(timer);
  }, [sunriseTime]);

  // ── Toggle safety item ──
  const toggleCheck = id => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const criticalChecked = SAFETY_CHECKLIST.filter(s => s.critical).every(
    s => checkedItems[s.id],
  );

  const totalChecked = Object.values(checkedItems).filter(Boolean).length;
  const progress = totalChecked / SAFETY_CHECKLIST.length;

  // ── Start check-in timer ──
  const startCheckIn = async () => {
    const interval = SAFETY_CHECKIN_INTERVALS.find(
      i => i.id === checkInInterval,
    );
    if (!interval || interval.ms === 0) {
      Alert.alert(
        'Check-In Disabled',
        'Select an interval to enable safety check-ins.',
      );
      return;
    }

    await setSafetyCheckIn(checkInInterval, emergencyContact);
    setCheckInActive(true);
    setLastCheckIn(new Date());

    // Set timer for check-in reminder
    checkInTimerRef.current = setInterval(() => {
      Vibration.vibrate([500, 500, 500, 500, 500]); // Urgent vibration
      Alert.alert(
        '🆘 Safety Check-In',
        'Are you OK? Tap "I\'m OK" to reset the timer. If no response, your emergency contact will be notified.',
        [
          {
            text: "✅ I'm OK",
            onPress: async () => {
              await performCheckIn();
              setLastCheckIn(new Date());
            },
          },
          {
            text: '🆘 Need Help',
            style: 'destructive',
            onPress: () => {
              if (emergencyContact) {
                Linking.openURL(`tel:${emergencyContact}`);
              } else {
                Linking.openURL('tel:911');
              }
            },
          },
        ],
        { cancelable: false },
      );
    }, interval.ms);

    Alert.alert(
      '✅ Check-In Active',
      `You'll be prompted every ${interval.label.toLowerCase()} to confirm you're safe.`,
    );
  };

  const stopCheckIn = () => {
    if (checkInTimerRef.current) {
      clearInterval(checkInTimerRef.current);
      checkInTimerRef.current = null;
    }
    setCheckInActive(false);
    Alert.alert('Check-In Stopped', 'Safety check-in timer has been disabled.');
  };

  // ── Emergency call handler ──
  const callEmergency = number => {
    if (!number) return;
    Alert.alert('Call Emergency', `Dial ${number}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => Linking.openURL(`tel:${number}`) },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* ── Header ── */}
      <ScreenHeader
        variant="large"
        title="🆘 Night Safety Center"
        subtitle="Stay safe after dark"
        onBack={() => navigation.goBack()}
      />

      {/* ── Sunrise Countdown ── */}
      <View style={styles.sunriseCard}>
        <Text style={styles.sunriseIcon}><AppIcon name="sunrise" size={40} color="#FFD700" /></Text>
        <View style={styles.sunriseInfo}>
          <Text style={styles.sunriseLabel}>SUNRISE COUNTDOWN</Text>
          <Text style={styles.sunriseTime}>
            {countdown || 'Calculating...'}
          </Text>
        </View>
      </View>

      {/* ── Safety Checklist ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <AppIcon name="checkCircle" size={17} color={colors.text} /> Pre-Trip Safety Checklist ({totalChecked}/{SAFETY_CHECKLIST.length}
          )
        </Text>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>

        {!criticalChecked && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              <AppIcon name="alertTriangle" size={12} color="#FF8800" /> Critical safety items unchecked — please review before going
              out
            </Text>
          </View>
        )}

        {SAFETY_CHECKLIST.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.checkRow}
            onPress={() => toggleCheck(item.id)}
          >
            <View
              style={[
                styles.checkbox,
                checkedItems[item.id] && styles.checkboxChecked,
                item.critical &&
                  !checkedItems[item.id] &&
                  styles.checkboxCritical,
              ]}
            >
              {checkedItems[item.id] && <Text style={styles.checkmark}><AppIcon name="check" size={14} color="#000" /></Text>}
            </View>
            <Text
              style={[
                styles.checkText,
                checkedItems[item.id] && styles.checkTextDone,
              ]}
            >
              {item.critical ? <AppIcon name="circleDot" size={8} color="#FF4444" /> : <AppIcon name="circleDot" size={8} color="#FFD700" />}
              {' '}{item.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Check-In Timer ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}><AppIcon name="alarmClock" size={17} color={colors.text} /> Safety Check-In Timer</Text>
        <Text style={styles.sectionDesc}>
          The app will prompt you at intervals to confirm you're safe. If you
          don't respond, your emergency contact is notified.
        </Text>

        {/* Interval selection */}
        <View style={styles.intervalRow}>
          {SAFETY_CHECKIN_INTERVALS.map(interval => (
            <TouchableOpacity
              key={interval.id}
              style={[
                styles.intervalBtn,
                checkInInterval === interval.id && styles.intervalBtnActive,
              ]}
              onPress={() => setCheckInInterval(interval.id)}
            >
              <Text
                style={[
                  styles.intervalLabel,
                  checkInInterval === interval.id && styles.intervalLabelActive,
                ]}
              >
                {interval.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Emergency contact */}
        <Input
          label="Emergency Contact Phone"
          value={emergencyContact}
          onChangeText={setEmergencyContact}
          placeholder="e.g. +1-555-123-4567"
          keyboardType="phone-pad"
        />

        {/* Start/Stop button */}
        {!checkInActive ? (
          <Button
            title="Start Check-In Timer"
            onPress={startCheckIn}
            variant="primary"
            size="lg"
            icon="play"
            style={{ backgroundColor: '#00FF88' }}
            textStyle={{ color: '#000' }}
          />
        ) : (
          <View>
            <View style={styles.activeBox}>
              <Text style={styles.activeText}>
                <AppIcon name="checkCircle" size={13} color="#00FF88" /> Check-in active — Last:{' '}
                {lastCheckIn?.toLocaleTimeString() || 'just now'}
              </Text>
            </View>
            <Button
              title="Stop Check-In"
              onPress={stopCheckIn}
              variant="danger"
              size="md"
              icon="square"
            />
          </View>
        )}
      </View>

      {/* ── Emergency Numbers ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}><AppIcon name="phone" size={17} color={colors.text} /> Emergency Contacts</Text>
        {EMERGENCY_NUMBERS.map(em => (
          <TouchableOpacity
            key={em.id}
            style={styles.emergencyRow}
            onPress={() => em.number && callEmergency(em.number)}
            disabled={!em.number}
          >
            <View style={styles.emergencyInfo}>
              <Text style={styles.emergencyLabel}>{em.labelIcon ? <AppIcon name={em.labelIcon} size={14} color={colors.text} /> : null} {em.label}</Text>
              <Text style={styles.emergencyRegion}>{em.region}</Text>
              {em.note && <Text style={styles.emergencyNote}>{em.note}</Text>}
            </View>
            {em.number ? (
              <Text style={styles.emergencyNumber}>{em.number}</Text>
            ) : (
              <Text style={styles.emergencyNoCall}>Info only</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Night Safety Tips ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}><AppIcon name="lightbulb" size={17} color={colors.text} /> Night Safety Tips</Text>
        {[
          {
            icon: 'circleDot',
            iconColor: '#FF4444',
            tip: 'Use red light only — white light destroys your night vision for 20-30 minutes',
          },
          {
            icon: 'shield',
            iconColor: '#FF8800',
            tip: 'Wear your PFD at ALL times. Falling in at night is 5x more deadly than daytime',
          },
          {
            icon: 'smartphone',
            iconColor: '#AA66FF',
            tip: 'Tell someone your exact location and expected return time before EVERY trip',
          },
          {
            icon: 'waves',
            iconColor: '#00BBFF',
            tip: 'Know your tide schedule — rising water at night is disorienting and dangerous',
          },
          {
            icon: 'zap',
            iconColor: '#FFD700',
            tip: 'If you see lightning or hear thunder — GET OFF THE WATER immediately',
          },
          {
            icon: 'fish',
            iconColor: '#888',
            tip: 'Sharks are more active at night. Avoid wading in murky water near inlets',
          },
          {
            icon: 'alertTriangle',
            iconColor: '#FF8800',
            tip: "Watch for snakes on banks and docks at night — they're active after sunset",
          },
          {
            icon: 'snowflake',
            iconColor: '#80DDFF',
            tip: 'Hypothermia risk increases dramatically at night. Bring extra dry layers',
          },
          {
            icon: 'bug',
            iconColor: '#88AA00',
            tip: 'Treat clothes with Permethrin + use Thermacell for mosquitoes at night',
          },
          {
            icon: 'battery',
            iconColor: '#00FF88',
            tip: 'Start with a fully charged phone. GPS + screen = dead battery in 3-4 hours',
          },
        ].map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Text style={styles.tipEmoji}><AppIcon name={tip.icon} size={18} color={tip.iconColor} /></Text>
            <Text style={styles.tipText}>{tip.tip}</Text>
          </View>
        ))}
      </View>

      {/* ── Disclaimer ── */}
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>
          <AppIcon name="alertTriangle" size={11} color="#FF8888" /> Night fishing carries inherent risks. ProFish provides safety tools
          and information but cannot guarantee your safety. Always exercise good
          judgment, check weather conditions, and never fish alone in dangerous
          conditions. In any emergency, call 911 (US) or 112 (EU) immediately.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const createStyles = colors =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050510' },

    // Sunrise
    sunriseCard: {
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: '#1a1000',
      borderRadius: 16,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#FFD70033',
    },
    sunriseIcon: { fontSize: 40, marginRight: 16 },
    sunriseInfo: { flex: 1 },
    sunriseLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textTertiary,
      letterSpacing: 1.5,
    },
    sunriseTime: {
      fontSize: 22,
      fontWeight: '800',
      color: '#FFD700',
      marginTop: 4,
    },

    // Section
    section: { paddingHorizontal: 16, marginBottom: 24 },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    sectionDesc: {
      fontSize: 12,
      color: colors.textTertiary,
      lineHeight: 18,
      marginBottom: 12,
    },

    // Progress bar
    progressBar: {
      height: 6,
      backgroundColor: colors.surface,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 12,
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#00FF88',
      borderRadius: 3,
    },

    // Warning
    warningBox: {
      backgroundColor: '#2a1a0a',
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#FF880033',
    },
    warningText: { fontSize: 12, color: '#FF8800', lineHeight: 18 },

    // Checklist
    checkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.surface,
    },
    checkbox: {
      width: 26,
      height: 26,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    checkboxChecked: { backgroundColor: '#00FF88', borderColor: '#00FF88' },
    checkboxCritical: { borderColor: '#FF4444' },
    checkmark: { fontSize: 14, fontWeight: '800', color: '#000' },
    checkText: { fontSize: 14, color: colors.textSecondary, flex: 1 },
    checkTextDone: {
      color: colors.textTertiary,
      textDecorationLine: 'line-through',
    },

    // Check-in timer
    intervalRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
      flexWrap: 'wrap',
    },
    intervalBtn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: '#0a0f20',
      borderWidth: 1,
      borderColor: '#1a2040',
    },
    intervalBtnActive: { borderColor: '#00FF88', backgroundColor: '#0a1a10' },
    intervalLabel: {
      fontSize: 13,
      color: colors.textTertiary,
      fontWeight: '600',
    },
    intervalLabelActive: { color: '#00FF88' },
    activeBox: {
      backgroundColor: '#0a2a0a',
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: '#00FF8833',
    },
    activeText: { fontSize: 13, color: '#00FF88', fontWeight: '600' },
    // Emergency
    emergencyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.surface,
    },
    emergencyInfo: { flex: 1 },
    emergencyLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
    emergencyRegion: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
    emergencyNote: {
      fontSize: 11,
      color: colors.textTertiary,
      fontStyle: 'italic',
      marginTop: 2,
    },
    emergencyNumber: { fontSize: 16, fontWeight: '800', color: '#FF4444' },
    emergencyNoCall: { fontSize: 12, color: colors.textDisabled },

    // Tips
    tipRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.surface,
    },
    tipEmoji: { fontSize: 18, marginRight: 12, marginTop: 1 },
    tipText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
      flex: 1,
    },

    // Disclaimer
    disclaimerBox: {
      marginHorizontal: 16,
      backgroundColor: '#1a0a0a',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: '#FF444422',
    },
    disclaimerText: { fontSize: 11, color: '#FF8888', lineHeight: 18 },
  });
