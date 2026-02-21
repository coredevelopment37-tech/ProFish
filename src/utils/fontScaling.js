/**
 * Dynamic Font Scaling — ProFish
 *
 * Provides responsive font sizes that respect device accessibility settings.
 * Uses PixelRatio to scale fonts consistently across screen densities.
 *
 * Usage:
 *   import { scaledFont, setupDefaultTextProps } from '../utils/fontScaling';
 *   const fs = scaledFont(16); // returns scaled size
 *
 * Call setupDefaultTextProps() once at app startup to enable
 * allowFontScaling on all Text components by default.
 */

import { Dimensions, PixelRatio, Text, Platform } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 375; // iPhone 8 baseline

/**
 * Scale a font size relative to screen width and pixel density.
 * Caps at 1.4x to avoid extreme scaling on tablets.
 *
 * @param {number} size - Base font size (designed for 375px width)
 * @returns {number} Scaled font size
 */
export function scaledFont(size) {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const capped = Math.min(scale, 1.4); // Max 1.4x for tablets
  const newSize = size * capped;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

/**
 * Get a set of scaled type sizes for common use cases.
 * Returns an object with named sizes all properly scaled.
 */
export function getTypeScale() {
  return {
    caption: scaledFont(11),
    body2: scaledFont(13),
    body: scaledFont(15),
    subtitle: scaledFont(16),
    title: scaledFont(18),
    heading: scaledFont(22),
    display: scaledFont(28),
    hero: scaledFont(36),
  };
}

/**
 * Set up default Text props to enable proper font scaling.
 * Call once in App.js or index.js before any rendering.
 *
 * Sets:
 * - allowFontScaling: true (respect OS accessibility settings)
 * - maxFontSizeMultiplier: 1.5 (prevent extreme scaling that breaks layouts)
 */
export function setupDefaultTextProps() {
  if (Text.defaultProps == null) {
    Text.defaultProps = {};
  }
  Text.defaultProps.allowFontScaling = true;
  Text.defaultProps.maxFontSizeMultiplier = 1.5;
}

/**
 * Get minimum touch target size for accessibility (48dp recommended).
 * Scales slightly on larger screens.
 */
export function getMinTouchTarget() {
  const base = 48;
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return Math.max(base, Math.round(base * Math.min(scale, 1.2)));
}

export default {
  scaledFont,
  getTypeScale,
  setupDefaultTextProps,
  getMinTouchTarget,
};
