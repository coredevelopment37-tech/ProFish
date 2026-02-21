/**
 * ProFish Design System Constants
 *
 * Centralized design tokens for consistent UI across all screens.
 * Based on 4px grid system with dark theme as default.
 */

// ── Colors ─────────────────────────────────────────
export const COLORS = {
  // Brand
  primary: '#0080FF',
  primaryDark: '#0060CC',
  primaryLight: '#4DA6FF',
  accent: '#FF9800',
  accentDark: '#E68900',

  // Background
  background: '#0a0a1a',
  surface: '#1a1a2e',
  surfaceLight: '#2a2a3e',
  card: '#1a1a2e',

  // Text
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textTertiary: '#888888',
  textDisabled: '#555555',
  textLink: '#0080FF',

  // Semantic
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Water types
  freshwater: '#4FC3F7',
  saltwater: '#0080FF',
  brackish: '#66BB6A',

  // Tier colors
  tierFree: '#888888',
  tierPro: '#FF9800',
  tierTeam: '#4CAF50',
  tierGuide: '#2196F3',

  // UI
  border: '#333333',
  borderLight: '#2a2a3e',
  divider: '#1a1a2e',
  overlay: 'rgba(0, 0, 0, 0.5)',
  ripple: 'rgba(0, 128, 255, 0.1)',

  // Score colors
  scoreExcellent: '#4CAF50',
  scoreGood: '#8BC34A',
  scoreFair: '#FF9800',
  scorePoor: '#F44336',
};

// ── Typography ─────────────────────────────────────
export const FONTS = {
  h1: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  h2: { fontSize: 22, fontWeight: '600', color: COLORS.text },
  h3: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  body: { fontSize: 16, color: COLORS.text },
  bodySecondary: { fontSize: 16, color: COLORS.textSecondary },
  caption: { fontSize: 13, color: COLORS.textTertiary },
  captionSmall: { fontSize: 11, color: COLORS.textTertiary },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  button: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  buttonSmall: { fontSize: 14, fontWeight: '600', color: COLORS.text },
};

// ── Spacing (4px grid) ─────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// ── Border Radius ──────────────────────────────────
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 9999,
};

// ── Shadows ────────────────────────────────────────
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
};

// ── Common Styles ──────────────────────────────────
export const COMMON = {
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipActive: {
    backgroundColor: 'rgba(0, 128, 255, 0.15)',
    borderColor: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.lg,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...FONTS.button,
    color: '#fff',
  },
};

// ── Score helpers ──────────────────────────────────
export function getScoreColor(score) {
  if (score >= 80) return COLORS.scoreExcellent;
  if (score >= 60) return COLORS.scoreGood;
  if (score >= 40) return COLORS.scoreFair;
  return COLORS.scorePoor;
}

export function getScoreLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}
