/**
 * NotificationBell — Header icon with unread count badge
 * Shows notification count and navigates to notifications
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useTheme from '../hooks/useTheme';

const NOTIF_COUNT_KEY = '@profish_unread_notif_count';

export default function NotificationBell({ onPress, size = 24 }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [count, setCount] = useState(0);

  useEffect(() => {
    loadCount();
  }, []);

  async function loadCount() {
    try {
      const stored = await AsyncStorage.getItem(NOTIF_COUNT_KEY);
      if (stored) setCount(parseInt(stored, 10) || 0);
    } catch {}
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={
        count > 0 ? `Notifications, ${count} unread` : 'Notifications'
      }
    >
      <Text style={[styles.icon, { fontSize: size }]}>🔔</Text>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

/**
 * Update the notification badge count (call from push handler)
 */
export async function setNotificationCount(count) {
  try {
    await AsyncStorage.setItem(NOTIF_COUNT_KEY, String(count));
  } catch {}
}

/**
 * Increment unread notification count
 */
export async function incrementNotificationCount() {
  try {
    const stored = await AsyncStorage.getItem(NOTIF_COUNT_KEY);
    const current = parseInt(stored, 10) || 0;
    await AsyncStorage.setItem(NOTIF_COUNT_KEY, String(current + 1));
  } catch {}
}

/**
 * Clear the notification badge
 */
export async function clearNotificationCount() {
  try {
    await AsyncStorage.setItem(NOTIF_COUNT_KEY, '0');
  } catch {}
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
});
