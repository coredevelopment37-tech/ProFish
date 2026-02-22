/**
 * AR Measurement Service — ProFish (#401-402)
 *
 * Augmented Reality measurement tool and overlay for fish.
 *   #401 — AR measurement tool (reference object calibration)
 *   #402 — AR overlay (species info overlay on camera)
 *
 * Phase 1: Manual reference-object measurement
 * Phase 2: ARKit/ARCore depth-based measurement
 */

import { Dimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Configuration ────────────────────────────────────────

const AR_CONFIG = {
  // Reference objects for calibration (known real-world sizes)
  REFERENCE_OBJECTS: [
    {
      id: 'credit_card',
      label: 'Credit Card',
      width: 3.375,
      height: 2.125,
      unit: 'in',
    },
    {
      id: 'dollar_bill',
      label: 'Dollar Bill',
      width: 6.14,
      height: 2.61,
      unit: 'in',
    },
    {
      id: 'rod_handle',
      label: 'Rod Handle (12")',
      width: 12,
      height: 1,
      unit: 'in',
    },
    {
      id: 'hand_span',
      label: 'Hand Span (~8")',
      width: 8,
      height: 3,
      unit: 'in',
    },
    { id: 'ruler', label: 'Ruler (12")', width: 12, height: 1.5, unit: 'in' },
    {
      id: 'tackle_box',
      label: 'Tackle Box Lid',
      width: 14,
      height: 9,
      unit: 'in',
    },
    { id: 'custom', label: 'Custom Size', width: 0, height: 0, unit: 'in' },
  ],

  // Measurement constraints
  MIN_FISH_LENGTH: 1, // inches
  MAX_FISH_LENGTH: 120, // inches (10 feet)
  PIXEL_RATIO_TOLERANCE: 0.15, // 15% acceptable error

  // AR overlay
  OVERLAY_FADE_MS: 300,
  OVERLAY_PERSIST_MS: 5000,

  // Unit preferences
  UNITS: {
    imperial: { length: 'in', weight: 'lb', label: 'Imperial' },
    metric: { length: 'cm', weight: 'kg', label: 'Metric' },
  },
};

// ── Unit Conversion ──────────────────────────────────────

const CONVERSIONS = {
  in_to_cm: 2.54,
  cm_to_in: 0.3937,
  lb_to_kg: 0.4536,
  kg_to_lb: 2.2046,
};

function convert(value, from, to) {
  const key = `${from}_to_${to}`;
  if (CONVERSIONS[key]) return value * CONVERSIONS[key];
  return value;
}

// ── Measurement Engine ───────────────────────────────────

const CALIBRATION_KEY = '@profish_ar_calibration';

const measurementEngine = {
  /**
   * Calculate pixels-per-inch ratio from a reference object photo
   *
   * @param {Object} referenceBox - { x, y, width, height } in pixels (user-drawn rect)
   * @param {string} referenceId - ID from REFERENCE_OBJECTS
   * @param {number} customWidth - Custom width if referenceId is 'custom'
   * @returns {Object} { pixelsPerInch, confidence }
   */
  calibrate(referenceBox, referenceId, customWidth) {
    const refObj = AR_CONFIG.REFERENCE_OBJECTS.find(r => r.id === referenceId);
    if (!refObj) throw new Error('Unknown reference object');

    const realWidth = referenceId === 'custom' ? customWidth : refObj.width;
    if (!realWidth || realWidth <= 0)
      throw new Error('Invalid reference width');

    const pixelsPerInch = referenceBox.width / realWidth;

    // Confidence based on pixel density (higher = better)
    let confidence = 'high';
    if (pixelsPerInch < 20) confidence = 'low';
    else if (pixelsPerInch < 50) confidence = 'medium';

    return {
      pixelsPerInch,
      confidence,
      referenceId,
      realWidth,
    };
  },

  /**
   * Measure fish length from calibrated photo
   *
   * @param {Object} fishLine - { startX, startY, endX, endY } in pixels
   * @param {number} pixelsPerInch - from calibration
   * @param {string} unit - 'in' or 'cm'
   * @returns {Object} { length, unit, confidence }
   */
  measureLength(fishLine, pixelsPerInch, unit = 'in') {
    const dx = fishLine.endX - fishLine.startX;
    const dy = fishLine.endY - fishLine.startY;
    const pixelLength = Math.sqrt(dx * dx + dy * dy);

    let lengthInches = pixelLength / pixelsPerInch;

    // Sanity check
    if (
      lengthInches < AR_CONFIG.MIN_FISH_LENGTH ||
      lengthInches > AR_CONFIG.MAX_FISH_LENGTH
    ) {
      return {
        length: lengthInches,
        unit,
        confidence: 'low',
        warning: `Measured ${lengthInches.toFixed(
          1,
        )}" seems unusual. Re-calibrate?`,
      };
    }

    let finalLength =
      unit === 'cm' ? convert(lengthInches, 'in', 'cm') : lengthInches;

    return {
      length: Math.round(finalLength * 10) / 10, // One decimal
      unit,
      confidence:
        pixelsPerInch > 50 ? 'high' : pixelsPerInch > 20 ? 'medium' : 'low',
      pixelLength,
    };
  },

  /**
   * Estimate weight from length using species-specific length-weight relationships
   * W = a * L^b (where L is in cm)
   */
  estimateWeight(lengthInches, speciesId, unit = 'lb') {
    // Length-weight coefficients (a, b) for common species
    // Source: FishBase length-weight relationships
    const coefficients = {
      largemouth_bass: { a: 0.0000158, b: 3.02 },
      smallmouth_bass: { a: 0.0000135, b: 3.05 },
      rainbow_trout: { a: 0.000011, b: 3.0 },
      brown_trout: { a: 0.0000108, b: 3.03 },
      walleye: { a: 0.0000089, b: 3.1 },
      northern_pike: { a: 0.0000044, b: 3.15 },
      channel_catfish: { a: 0.0000071, b: 3.17 },
      bluegill: { a: 0.0000191, b: 3.12 },
      crappie: { a: 0.0000158, b: 3.0 },
      striped_bass: { a: 0.0000112, b: 3.01 },
      red_snapper: { a: 0.0000148, b: 3.02 },
      red_drum: { a: 0.0000098, b: 3.08 },
      bluefin_tuna: { a: 0.0000206, b: 2.98 },
      mahi_mahi: { a: 0.0000063, b: 3.14 },
      // Generic fallback
      default: { a: 0.000012, b: 3.05 },
    };

    const { a, b } = coefficients[speciesId] || coefficients.default;
    const lengthCm = lengthInches * 2.54;
    const weightGrams = a * Math.pow(lengthCm, b);
    const weightLb = weightGrams / 453.592;

    const finalWeight = unit === 'kg' ? weightLb * 0.4536 : weightLb;

    return {
      weight: Math.round(finalWeight * 100) / 100,
      unit,
      method: 'length_weight_regression',
      confidence: coefficients[speciesId] ? 'medium' : 'low',
    };
  },

  /**
   * Save calibration for reuse
   */
  async saveCalibration(calibration) {
    try {
      await AsyncStorage.setItem(
        CALIBRATION_KEY,
        JSON.stringify({
          ...calibration,
          savedAt: Date.now(),
        }),
      );
    } catch (e) {
      // Non-critical
    }
  },

  /**
   * Load last calibration
   */
  async loadCalibration() {
    try {
      const raw = await AsyncStorage.getItem(CALIBRATION_KEY);
      if (!raw) return null;
      const cal = JSON.parse(raw);
      // Calibration valid for 24 hours (camera zoom changes)
      if (Date.now() - cal.savedAt > 86400000) return null;
      return cal;
    } catch (e) {
      return null;
    }
  },
};

// ── AR Overlay Service (#402) ────────────────────────────

const OVERLAY_SPECIES_INFO = {
  /**
   * Generate overlay data for a detected species
   */
  getOverlayInfo(speciesId, speciesData, userRegion) {
    if (!speciesData) return null;

    return {
      species: speciesData.id,
      name: speciesData.id
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase()),
      scientific: speciesData.scientific,
      family: speciesData.family,
      habitat: speciesData.habitat,
      iucn: speciesData.iucn || 'NE',

      // Overlay rendering config
      overlay: {
        position: 'bottom', // 'top' | 'bottom' | 'side'
        style: 'card', // 'card' | 'minimal' | 'full'
        fadeIn: AR_CONFIG.OVERLAY_FADE_MS,
        duration: AR_CONFIG.OVERLAY_PERSIST_MS,
        backgroundColor: 'rgba(10,10,26,0.85)',
        textColor: '#ffffff',
        accentColor: '#0a84ff',
      },

      // Quick actions
      actions: [
        { id: 'log_catch', label: 'Log Catch', icon: '🐟' },
        { id: 'species_info', label: 'Details', icon: '📖' },
        { id: 'measure', label: 'Measure', icon: '📏' },
      ],
    };
  },

  /**
   * AR camera frame overlay configuration
   */
  getCameraOverlayConfig() {
    return {
      // Guide frame for fish positioning
      guideFrame: {
        visible: true,
        aspectRatio: 3.5, // Typical fish length:height ratio
        color: 'rgba(10,132,255,0.5)',
        strokeWidth: 2,
        cornerRadius: 12,
        padding: 40,
        label: 'Position fish within frame',
      },
      // Measurement markers
      ruler: {
        visible: false, // Shown after calibration
        color: '#0a84ff',
        tickSpacing: 50, // pixels
        labelInterval: 5,
      },
      // Detection indicator
      detectionIndicator: {
        visible: true,
        position: 'top-center',
        states: {
          scanning: { label: 'Scanning...', color: '#FF9800' },
          detected: { label: 'Fish Detected', color: '#4CAF50' },
          identifying: { label: 'Identifying...', color: '#0a84ff' },
          identified: { label: 'Species Found', color: '#4CAF50' },
        },
      },
    };
  },
};

// ── Main AR Service ──────────────────────────────────────

const arMeasurementService = {
  config: AR_CONFIG,

  // Measurement engine
  calibrate: measurementEngine.calibrate.bind(measurementEngine),
  measureLength: measurementEngine.measureLength.bind(measurementEngine),
  estimateWeight: measurementEngine.estimateWeight.bind(measurementEngine),
  saveCalibration: measurementEngine.saveCalibration.bind(measurementEngine),
  loadCalibration: measurementEngine.loadCalibration.bind(measurementEngine),

  // AR overlay
  getOverlayInfo:
    OVERLAY_SPECIES_INFO.getOverlayInfo.bind(OVERLAY_SPECIES_INFO),
  getCameraOverlayConfig:
    OVERLAY_SPECIES_INFO.getCameraOverlayConfig.bind(OVERLAY_SPECIES_INFO),

  // Unit conversion
  convert,

  // Reference objects list
  getReferenceObjects() {
    return AR_CONFIG.REFERENCE_OBJECTS;
  },

  // Get user's preferred units
  async getPreferredUnits() {
    try {
      const raw = await AsyncStorage.getItem('@profish_unit_pref');
      return raw || 'imperial';
    } catch (e) {
      return 'imperial';
    }
  },

  async setPreferredUnits(system) {
    await AsyncStorage.setItem('@profish_unit_pref', system);
  },
};

export default arMeasurementService;
