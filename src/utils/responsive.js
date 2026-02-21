/**
 * Responsive Layout Utility — ProFish
 *
 * Provides breakpoints, grid column count, and hooks for
 * adaptive layouts on phones vs tablets.
 *
 * Usage:
 *   import { useResponsive, isTablet, getColumns } from '../utils/responsive';
 *
 *   const { isTablet, columns, width, breakpoint } = useResponsive();
 */

import { useState, useEffect } from 'react';
import { Dimensions, Platform, PixelRatio } from 'react-native';

// ── Breakpoints ──────────────────────────────────────────

export const BREAKPOINTS = {
  phone: 0, // < 600
  tabletPortrait: 600, // 600-899
  tabletLandscape: 900, // 900-1199
  desktop: 1200, // 1200+
};

/**
 * Determine if the current device is a tablet based on
 * screen size and pixel density.
 */
export function isTablet() {
  const { width, height } = Dimensions.get('window');
  const maxDim = Math.max(width, height);
  const minDim = Math.min(width, height);

  // Simple heuristic: shortest dimension > 600dp
  if (minDim >= 600) return true;

  // iPad check (screen ≥ 768 common)
  if (Platform.OS === 'ios' && Platform.isPad) return true;

  // Large Android: physical size > 7"
  const density = PixelRatio.get();
  const screenInches =
    Math.sqrt(Math.pow(maxDim * density, 2) + Math.pow(minDim * density, 2)) /
    (density * 160);
  if (screenInches > 7) return true;

  return false;
}

/**
 * Get current breakpoint name
 */
export function getBreakpoint(width) {
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tabletLandscape) return 'tabletLandscape';
  if (width >= BREAKPOINTS.tabletPortrait) return 'tabletPortrait';
  return 'phone';
}

/**
 * Get number of columns for a grid layout
 * Phone: 1 column, Tablet portrait: 2, Tablet landscape: 3
 */
export function getColumns(width) {
  if (width >= BREAKPOINTS.tabletLandscape) return 3;
  if (width >= BREAKPOINTS.tabletPortrait) return 2;
  return 1;
}

/**
 * Get content max-width for readability on large screens
 */
export function getContentMaxWidth(width) {
  if (width >= BREAKPOINTS.desktop) return 960;
  if (width >= BREAKPOINTS.tabletLandscape) return 840;
  if (width >= BREAKPOINTS.tabletPortrait) return Math.min(width - 32, 720);
  return width;
}

/**
 * Calculate grid item width based on columns + gap
 */
export function getGridItemWidth(screenWidth, columns, gap = 12, padding = 16) {
  const totalGaps = (columns - 1) * gap;
  const totalPadding = padding * 2;
  return (screenWidth - totalPadding - totalGaps) / columns;
}

// ── React Hook ───────────────────────────────────────────

/**
 * useResponsive — responds to dimension changes (rotation, split-screen)
 *
 * Returns: { width, height, isTablet, columns, breakpoint, contentMaxWidth, gridItemWidth }
 */
export function useResponsive() {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const handler = ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    };
    const sub = Dimensions.addEventListener('change', handler);
    return () => sub?.remove?.();
  }, []);

  const { width, height } = dimensions;
  const tablet = isTablet();
  const columns = getColumns(width);
  const breakpoint = getBreakpoint(width);
  const contentMaxWidth = getContentMaxWidth(width);
  const gridItemWidth = getGridItemWidth(width, columns);

  return {
    width,
    height,
    isTablet: tablet,
    columns,
    breakpoint,
    contentMaxWidth,
    gridItemWidth,
  };
}

/**
 * Adaptive style helper — returns phone or tablet styles
 *
 * Usage:
 *   const style = adaptive(baseStyles, { padding: 24, fontSize: 18 });
 */
export function adaptive(baseStyle, tabletOverrides) {
  if (!isTablet()) return baseStyle;
  return { ...baseStyle, ...tabletOverrides };
}

/**
 * Platform-aware responsive padding
 */
export function responsivePadding(width) {
  if (width >= BREAKPOINTS.tabletLandscape) return 32;
  if (width >= BREAKPOINTS.tabletPortrait) return 24;
  return 16;
}

export default {
  isTablet,
  getBreakpoint,
  getColumns,
  getContentMaxWidth,
  getGridItemWidth,
  useResponsive,
  adaptive,
  responsivePadding,
  BREAKPOINTS,
};
