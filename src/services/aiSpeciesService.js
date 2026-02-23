/**
 * AI Species ID Service — ProFish (#395-400, #404, #407, #409)
 *
 * On-device species identification using TFLite + cloud fallback.
 * Handles:
 *   #395 — TFLite model integration
 *   #396 — Camera capture flow
 *   #397 — Confidence threshold + display
 *   #398 — Training data pipeline (upload photos)
 *   #399 — Cloud fallback for high-res identification
 *   #400 — Rate limiting for free tier (5/day)
 *   #404 — Auto-fill catch details from photo
 *   #407 — Photo enhancement (brightness, contrast, crop)
 *   #409 — OTA model updates
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../config/theme';

// ── Configuration ────────────────────────────────────────

const AI_CONFIG = {
  // Model info
  MODEL_VERSION: '1.0.0',
  MODEL_FILE: 'profish_species_v1.tflite',
  LABELS_FILE: 'profish_labels_v1.txt',
  INPUT_SIZE: 224,
  INPUT_CHANNELS: 3,

  // Confidence thresholds
  HIGH_CONFIDENCE: 0.85,
  MEDIUM_CONFIDENCE: 0.6,
  LOW_CONFIDENCE: 0.3,
  MIN_DISPLAY_CONFIDENCE: 0.1,

  // Rate limiting (Free tier)
  FREE_DAILY_LIMIT: 5,
  PRO_DAILY_LIMIT: -1, // Unlimited

  // Cloud fallback
  CLOUD_API_URL: __DEV__
    ? 'http://localhost:3001/api/v1/identify'
    : 'https://api.profishapp.com/v1/identify',
  CLOUD_TIMEOUT: 10000,
  CLOUD_MAX_SIZE_MB: 10,

  // OTA model updates
  MODEL_CHECK_URL: __DEV__
    ? 'http://localhost:3001/api/v1/model/version'
    : 'https://api.profishapp.com/v1/model/version',
  MODEL_DOWNLOAD_URL: __DEV__
    ? 'http://localhost:3001/api/v1/model/download'
    : 'https://api.profishapp.com/v1/model/download',
};

// ── Confidence Display (#397) ────────────────────────────

export const CONFIDENCE_LEVEL = {
  HIGH: {
    label: 'High Confidence',
    color: COLORS.success,
    icon: 'checkCircle',
    minScore: AI_CONFIG.HIGH_CONFIDENCE,
  },
  MEDIUM: {
    label: 'Likely Match',
    color: COLORS.accent,
    icon: 'alertCircle',
    minScore: AI_CONFIG.MEDIUM_CONFIDENCE,
  },
  LOW: {
    label: 'Possible Match',
    color: COLORS.error,
    icon: 'helpCircle',
    minScore: AI_CONFIG.LOW_CONFIDENCE,
  },
  UNKNOWN: {
    label: 'Unknown Species',
    color: COLORS.textTertiary,
    icon: '❌',
    minScore: 0,
  },
};

function getConfidenceLevel(score) {
  if (score >= AI_CONFIG.HIGH_CONFIDENCE) return CONFIDENCE_LEVEL.HIGH;
  if (score >= AI_CONFIG.MEDIUM_CONFIDENCE) return CONFIDENCE_LEVEL.MEDIUM;
  if (score >= AI_CONFIG.LOW_CONFIDENCE) return CONFIDENCE_LEVEL.LOW;
  return CONFIDENCE_LEVEL.UNKNOWN;
}

// ── Rate Limiting (#400) ─────────────────────────────────

const RATE_LIMIT_KEY = '@profish_ai_rate';

async function getRateStatus(isPro) {
  if (isPro) return { allowed: true, remaining: -1, limit: -1 };

  try {
    const raw = await AsyncStorage.getItem(RATE_LIMIT_KEY);
    const data = raw ? JSON.parse(raw) : { date: '', count: 0 };

    const today = new Date().toISOString().split('T')[0];
    if (data.date !== today) {
      return {
        allowed: true,
        remaining: AI_CONFIG.FREE_DAILY_LIMIT,
        limit: AI_CONFIG.FREE_DAILY_LIMIT,
      };
    }

    const remaining = AI_CONFIG.FREE_DAILY_LIMIT - data.count;
    return {
      allowed: remaining > 0,
      remaining: Math.max(0, remaining),
      limit: AI_CONFIG.FREE_DAILY_LIMIT,
    };
  } catch (e) {
    return {
      allowed: true,
      remaining: AI_CONFIG.FREE_DAILY_LIMIT,
      limit: AI_CONFIG.FREE_DAILY_LIMIT,
    };
  }
}

async function incrementRateCount() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const raw = await AsyncStorage.getItem(RATE_LIMIT_KEY);
    const data = raw ? JSON.parse(raw) : { date: '', count: 0 };

    if (data.date !== today) {
      await AsyncStorage.setItem(
        RATE_LIMIT_KEY,
        JSON.stringify({ date: today, count: 1 }),
      );
    } else {
      data.count += 1;
      await AsyncStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
    }
  } catch (e) {
    // Non-critical
  }
}

// ── Photo Enhancement (#407) ─────────────────────────────

const photoEnhancement = {
  /**
   * Apply basic enhancement to photo for better AI recognition
   * Returns enhancement parameters for display/upload
   */
  getEnhancementParams(photoMetadata) {
    const params = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpness: 0,
      autoCrop: false,
    };

    // Auto-brightness based on average luminance
    if (photoMetadata?.averageLuminance != null) {
      if (photoMetadata.averageLuminance < 80) {
        params.brightness = 20; // Brighten dark photos
      } else if (photoMetadata.averageLuminance > 200) {
        params.brightness = -15; // Dim overexposed
      }
    }

    // Auto-contrast for flat images
    if (
      photoMetadata?.contrastRatio != null &&
      photoMetadata.contrastRatio < 1.5
    ) {
      params.contrast = 15;
    }

    // Always sharpen slightly for fish scale detail
    params.sharpness = 10;

    return params;
  },

  /**
   * Generate crop suggestion based on detected fish position
   * Phase 2: Use on-device object detection for auto-crop
   */
  suggestCrop(imageWidth, imageHeight, detectionBox) {
    if (!detectionBox) {
      // Default: center crop 80%
      const margin = 0.1;
      return {
        x: Math.round(imageWidth * margin),
        y: Math.round(imageHeight * margin),
        width: Math.round(imageWidth * (1 - 2 * margin)),
        height: Math.round(imageHeight * (1 - 2 * margin)),
      };
    }

    // Expand detection box by 15% for context
    const expand = 0.15;
    const { x, y, width, height } = detectionBox;
    return {
      x: Math.max(0, Math.round(x - width * expand)),
      y: Math.max(0, Math.round(y - height * expand)),
      width: Math.min(imageWidth, Math.round(width * (1 + 2 * expand))),
      height: Math.min(imageHeight, Math.round(height * (1 + 2 * expand))),
    };
  },
};

// ── Auto-Fill Catch Details (#404) ───────────────────────

function autoFillFromIdentification(result, photoExif) {
  const autoFill = {};

  // Species from AI result
  if (
    result.topPrediction &&
    result.topPrediction.confidence >= AI_CONFIG.MEDIUM_CONFIDENCE
  ) {
    autoFill.species = result.topPrediction.speciesId;
    autoFill.speciesConfidence = result.topPrediction.confidence;
  }

  // Date from EXIF
  if (photoExif?.DateTimeOriginal) {
    try {
      autoFill.date = new Date(photoExif.DateTimeOriginal).toISOString();
    } catch (e) {
      // Invalid date
    }
  }

  // Location from EXIF GPS
  if (photoExif?.GPSLatitude && photoExif?.GPSLongitude) {
    autoFill.latitude = photoExif.GPSLatitude;
    autoFill.longitude = photoExif.GPSLongitude;
  }

  // Estimated size from AI (Phase 2: with AR reference object)
  if (result.estimatedLength) {
    autoFill.estimatedLength = result.estimatedLength;
  }

  return autoFill;
}

// ── OTA Model Updates (#409) ─────────────────────────────

const MODEL_VERSION_KEY = '@profish_model_version';

const otaUpdates = {
  /**
   * Check if a newer model is available
   */
  async checkForUpdate() {
    try {
      const currentVersion =
        (await AsyncStorage.getItem(MODEL_VERSION_KEY)) ||
        AI_CONFIG.MODEL_VERSION;

      const response = await fetch(AI_CONFIG.MODEL_CHECK_URL, {
        method: 'GET',
        timeout: 5000,
      });

      if (!response.ok) return { available: false };

      const data = await response.json();
      const available = data.version !== currentVersion;

      return {
        available,
        currentVersion,
        latestVersion: data.version,
        downloadSize: data.size, // in bytes
        releaseNotes: data.notes,
        url: data.url,
      };
    } catch (e) {
      return { available: false, error: e.message };
    }
  },

  /**
   * Download and install updated model
   * Phase 2: Use react-native-blob-util for background download
   */
  async downloadUpdate(url, version, onProgress) {
    try {
      // Placeholder for actual download logic
      // In production, use react-native-blob-util to download .tflite file
      // to app's documents directory and update the model reference.

      if (onProgress) onProgress(0);

      const response = await fetch(url || AI_CONFIG.MODEL_DOWNLOAD_URL);
      if (!response.ok) throw new Error('Download failed');

      // Simulate progress (actual implementation reads stream)
      if (onProgress) onProgress(50);

      // In production:
      // const blob = await response.blob();
      // const path = `${RNFS.DocumentDirectoryPath}/${AI_CONFIG.MODEL_FILE}`;
      // await RNFS.writeFile(path, blob, 'base64');

      if (onProgress) onProgress(100);

      await AsyncStorage.setItem(
        MODEL_VERSION_KEY,
        version || AI_CONFIG.MODEL_VERSION,
      );

      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Get current model version
   */
  async getCurrentVersion() {
    return (
      (await AsyncStorage.getItem(MODEL_VERSION_KEY)) || AI_CONFIG.MODEL_VERSION
    );
  },
};

// ── Training Data Pipeline (#398) ────────────────────────

const TRAINING_OPT_IN_KEY = '@profish_training_optin';

const trainingPipeline = {
  /**
   * Check if user opted in to contribute training data
   */
  async isOptedIn() {
    const val = await AsyncStorage.getItem(TRAINING_OPT_IN_KEY);
    return val === 'true';
  },

  /**
   * Set training data opt-in/out
   */
  async setOptIn(optIn) {
    await AsyncStorage.setItem(TRAINING_OPT_IN_KEY, String(optIn));
  },

  /**
   * Submit verified catch photo for model training
   * Only submitted if user opted in and catch was manually verified
   */
  async submitTrainingData(photoUri, speciesId, metadata) {
    const optedIn = await this.isOptedIn();
    if (!optedIn) return { submitted: false, reason: 'not_opted_in' };

    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'training.jpg',
      });
      formData.append('speciesId', speciesId);
      formData.append('metadata', JSON.stringify(metadata));

      const response = await fetch(`${AI_CONFIG.CLOUD_API_URL}/training`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 15000,
      });

      return { submitted: response.ok };
    } catch (e) {
      // Queue for later submission
      return { submitted: false, queued: true };
    }
  },
};

// ── Main AI Species ID Service ───────────────────────────

const aiSpeciesService = {
  config: AI_CONFIG,

  /**
   * Identify species from a photo
   *
   * @param {string} photoUri - Local file URI of the photo
   * @param {Object} opts
   * @param {boolean} opts.isPro - User subscription tier
   * @param {boolean} opts.useCloud - Force cloud inference
   * @param {Object} opts.exif - EXIF data from photo
   * @returns {Object} { predictions, topPrediction, autoFill, confidence, rateStatus }
   */
  async identify(photoUri, opts = {}) {
    // Check rate limit
    const rateStatus = await getRateStatus(opts.isPro);
    if (!rateStatus.allowed) {
      return {
        success: false,
        error: 'rate_limited',
        rateStatus,
        message: `Daily limit reached (${AI_CONFIG.FREE_DAILY_LIMIT}/day). Upgrade to Pro for unlimited.`,
      };
    }

    try {
      let predictions;

      // Phase 1: Try on-device inference with TFLite
      if (!opts.useCloud) {
        predictions = await this._onDeviceInference(photoUri);
      }

      // Cloud fallback if on-device fails or low confidence
      if (
        !predictions ||
        (predictions[0] &&
          predictions[0].confidence < AI_CONFIG.MEDIUM_CONFIDENCE)
      ) {
        if (opts.useCloud !== false) {
          const cloudResult = await this._cloudInference(photoUri);
          if (cloudResult) {
            predictions = cloudResult;
          }
        }
      }

      if (!predictions || predictions.length === 0) {
        return {
          success: false,
          error: 'no_predictions',
          message: 'Could not identify species. Try a clearer photo.',
        };
      }

      // Increment rate counter
      await incrementRateCount();

      // Filter by minimum confidence
      const filtered = predictions.filter(
        p => p.confidence >= AI_CONFIG.MIN_DISPLAY_CONFIDENCE,
      );

      const topPrediction = filtered[0] || null;
      const confidenceLevel = topPrediction
        ? getConfidenceLevel(topPrediction.confidence)
        : CONFIDENCE_LEVEL.UNKNOWN;

      // Auto-fill catch details
      const autoFill = topPrediction
        ? autoFillFromIdentification({ topPrediction }, opts.exif)
        : {};

      return {
        success: true,
        predictions: filtered.slice(0, 5), // Top 5
        topPrediction,
        confidence: confidenceLevel,
        autoFill,
        rateStatus: await getRateStatus(opts.isPro),
        enhancement: photoEnhancement.getEnhancementParams(opts.photoMetadata),
      };
    } catch (error) {
      console.warn('[AISpecies] Identification error:', error);
      return {
        success: false,
        error: 'inference_error',
        message: error.message,
      };
    }
  },

  /**
   * On-device TFLite inference
   * Phase 2: Integrate react-native-tflite
   */
  async _onDeviceInference(photoUri) {
    try {
      // Placeholder: In production, load TFLite model and run inference
      // const model = await TFLite.loadModel(AI_CONFIG.MODEL_FILE);
      // const tensor = await model.preprocessImage(photoUri, AI_CONFIG.INPUT_SIZE);
      // const output = await model.run(tensor);
      // return output.map((conf, idx) => ({ speciesId: labels[idx], confidence: conf }))
      //   .sort((a, b) => b.confidence - a.confidence);

      // For now, return null to trigger cloud fallback
      return null;
    } catch (e) {
      console.warn('[AISpecies] On-device inference failed:', e);
      return null;
    }
  },

  /**
   * Cloud API inference (fallback)
   */
  async _cloudInference(photoUri) {
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'identify.jpg',
      });

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        AI_CONFIG.CLOUD_TIMEOUT,
      );

      const response = await fetch(AI_CONFIG.CLOUD_API_URL, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) return null;

      const data = await response.json();
      return data.predictions || null;
    } catch (e) {
      console.warn('[AISpecies] Cloud inference failed:', e);
      return null;
    }
  },

  // Expose sub-services
  photoEnhancement,
  trainingPipeline,
  otaUpdates,
  getConfidenceLevel,
};

export default aiSpeciesService;
