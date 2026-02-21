/**
 * Haptic feedback utility
 * Wraps react-native-haptic-feedback or falls back to Vibration
 */

import { Platform, Vibration } from 'react-native';

let HapticFeedback = null;
try {
  HapticFeedback = require('react-native-haptic-feedback').default;
} catch (e) {
  // Not linked — use Vibration fallback
}

const defaults = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

/**
 * Light impact — for button presses, toggles
 */
export function impactLight() {
  if (HapticFeedback) {
    HapticFeedback.trigger('impactLight', defaults);
  } else if (Platform.OS === 'android') {
    Vibration.vibrate(10);
  }
}

/**
 * Medium impact — for important actions (save, delete, catch logged)
 */
export function impactMedium() {
  if (HapticFeedback) {
    HapticFeedback.trigger('impactMedium', defaults);
  } else if (Platform.OS === 'android') {
    Vibration.vibrate(20);
  }
}

/**
 * Success — for confirmed actions (catch saved, purchase complete)
 */
export function notificationSuccess() {
  if (HapticFeedback) {
    HapticFeedback.trigger('notificationSuccess', defaults);
  } else if (Platform.OS === 'android') {
    Vibration.vibrate([0, 15, 50, 15]);
  }
}

/**
 * Warning — for warnings (limit reached, error)
 */
export function notificationWarning() {
  if (HapticFeedback) {
    HapticFeedback.trigger('notificationWarning', defaults);
  } else if (Platform.OS === 'android') {
    Vibration.vibrate(30);
  }
}

/**
 * Selection changed — for picker/scroll selections
 */
export function selectionChanged() {
  if (HapticFeedback) {
    HapticFeedback.trigger('selection', defaults);
  }
  // No vibration fallback for selection — too subtle
}
