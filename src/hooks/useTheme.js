/**
 * useTheme — hook that returns theme-aware colors, fonts, spacing, and common styles.
 *
 * Usage:
 *   const { colors, fonts, spacing, radius, shadows, common } = useTheme();
 *   <View style={{ backgroundColor: colors.background }}>
 *
 * Reads `state.theme` from AppContext ('dark' | 'light').
 * All returned objects update reactively when the user toggles the theme.
 */

import { useMemo } from 'react';
import { useApp } from '../store/AppContext';
import {
  getThemeColors,
  SPACING,
  RADIUS,
  SHADOWS,
  buildFonts,
  buildCommon,
} from '../config/theme';

export default function useTheme() {
  const { state } = useApp();
  const mode = state.theme || 'dark';

  return useMemo(() => {
    const colors = getThemeColors(mode);
    const fonts = buildFonts(colors);
    const common = buildCommon(colors, fonts);

    return {
      mode,
      isDark: mode === 'dark',
      colors,
      fonts,
      spacing: SPACING,
      radius: RADIUS,
      shadows: SHADOWS,
      common,
    };
  }, [mode]);
}
