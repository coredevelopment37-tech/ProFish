/**
 * RTL-aware style helpers — ProFish
 * Provides directional styles for Arabic and other RTL languages
 */

import { I18nManager, StyleSheet, Platform } from 'react-native';
import { isRTL } from '../config/i18n';

/**
 * Apply RTL layout based on current language
 * Call this on language change — requires app restart for full effect
 */
export function applyRTLLayout(language) {
  const rtl = isRTL(language);
  if (I18nManager.isRTL !== rtl) {
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
    // Note: Full RTL change requires app restart on RN
    return true; // Restart needed
  }
  return false; // No change
}

/**
 * Get flexDirection based on RTL state
 */
export function rowDirection() {
  return I18nManager.isRTL ? 'row-reverse' : 'row';
}

/**
 * Get text alignment based on RTL state
 */
export function textAlign() {
  return I18nManager.isRTL ? 'right' : 'left';
}

/**
 * Flip a horizontal value for RTL
 * flip('left') → 'right' in RTL mode
 */
export function flip(side) {
  if (!I18nManager.isRTL) return side;
  if (side === 'left') return 'right';
  if (side === 'right') return 'left';
  return side;
}

/**
 * Create RTL-aware margin/padding
 * directionalPadding(10, 20) → { paddingLeft: 10, paddingRight: 20 }
 * In RTL: { paddingLeft: 20, paddingRight: 10 }
 */
export function directionalPadding(start, end) {
  if (I18nManager.isRTL) {
    return { paddingLeft: end, paddingRight: start };
  }
  return { paddingLeft: start, paddingRight: end };
}

export function directionalMargin(start, end) {
  if (I18nManager.isRTL) {
    return { marginLeft: end, marginRight: start };
  }
  return { marginLeft: start, marginRight: end };
}

/**
 * Flip transform for arrows/chevrons etc.
 */
export function flipTransform() {
  return I18nManager.isRTL ? [{ scaleX: -1 }] : [];
}

/**
 * Common RTL-aware layout styles
 */
export const rtlStyles = StyleSheet.create({
  row: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
  },
  textStart: {
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  textEnd: {
    textAlign: I18nManager.isRTL ? 'left' : 'right',
  },
});
