/**
 * Anti-Cheat Service — ProFish (#363)
 *
 * Photo verification system to prevent fake/recycled catch submissions.
 *
 * Checks:
 *   1. EXIF timestamp validation — photo taken within last 24h
 *   2. GPS metadata matching — photo GPS near claimed catch location
 *   3. Duplicate hash detection — same photo not submitted twice
 *   4. Metadata stripping detection — flags photos with no EXIF
 *   5. File size / dimension sanity — flags suspiciously perfect images
 *
 * Verification levels:
 *   - VERIFIED: All checks pass
 *   - UNVERIFIED: No photo or insufficient metadata
 *   - SUSPICIOUS: One or more checks failed
 *   - REJECTED: Known duplicate or manipulated
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

let firestore = null;
let auth = null;
try {
  firestore = require('@react-native-firebase/firestore').default;
  auth = require('@react-native-firebase/auth').default;
} catch (e) {}

// ── Verification constants ──────────────────────────────

export const VERIFICATION_STATUS = {
  VERIFIED: 'verified',
  UNVERIFIED: 'unverified',
  SUSPICIOUS: 'suspicious',
  REJECTED: 'rejected',
  PENDING: 'pending',
};

export const VERIFICATION_CHECKS = {
  TIMESTAMP: 'timestamp',
  GPS_MATCH: 'gps_match',
  DUPLICATE: 'duplicate',
  METADATA: 'metadata',
  DIMENSIONS: 'dimensions',
};

const MAX_PHOTO_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const GPS_TOLERANCE_KM = 50; // Allow 50km radius for GPS matching
const HASH_STORE_KEY = '@profish_photo_hashes';
const MAX_STORED_HASHES = 500;

// ── Service ─────────────────────────────────────────────

const antiCheatService = {
  /**
   * Verify a catch photo before submission.
   * Returns a verification result with status and check details.
   *
   * @param {Object} params
   * @param {string} params.photoUri - Local photo URI
   * @param {Object} [params.exifData] - EXIF metadata if available
   * @param {Object} [params.claimedLocation] - { latitude, longitude }
   * @param {number} [params.fileSize] - File size in bytes
   * @param {Object} [params.dimensions] - { width, height }
   * @returns {Promise<Object>} Verification result
   */
  async verifyPhoto({
    photoUri,
    exifData = null,
    claimedLocation = null,
    fileSize = 0,
    dimensions = null,
  }) {
    const checks = {};
    const warnings = [];
    let score = 100; // Start at 100, deduct for failures

    // 1. Timestamp check
    checks[VERIFICATION_CHECKS.TIMESTAMP] = this._checkTimestamp(exifData);
    if (!checks[VERIFICATION_CHECKS.TIMESTAMP].passed) {
      score -= 25;
      warnings.push(checks[VERIFICATION_CHECKS.TIMESTAMP].reason);
    }

    // 2. GPS location match
    checks[VERIFICATION_CHECKS.GPS_MATCH] = this._checkGpsMatch(
      exifData,
      claimedLocation,
    );
    if (!checks[VERIFICATION_CHECKS.GPS_MATCH].passed) {
      score -= 20;
      warnings.push(checks[VERIFICATION_CHECKS.GPS_MATCH].reason);
    }

    // 3. Duplicate detection
    checks[VERIFICATION_CHECKS.DUPLICATE] = await this._checkDuplicate(
      photoUri,
      fileSize,
      dimensions,
    );
    if (!checks[VERIFICATION_CHECKS.DUPLICATE].passed) {
      score -= 40;
      warnings.push(checks[VERIFICATION_CHECKS.DUPLICATE].reason);
    }

    // 4. Metadata presence
    checks[VERIFICATION_CHECKS.METADATA] = this._checkMetadata(exifData);
    if (!checks[VERIFICATION_CHECKS.METADATA].passed) {
      score -= 10;
      warnings.push(checks[VERIFICATION_CHECKS.METADATA].reason);
    }

    // 5. Dimension sanity
    checks[VERIFICATION_CHECKS.DIMENSIONS] = this._checkDimensions(
      dimensions,
      fileSize,
    );
    if (!checks[VERIFICATION_CHECKS.DIMENSIONS].passed) {
      score -= 5;
      warnings.push(checks[VERIFICATION_CHECKS.DIMENSIONS].reason);
    }

    // Determine overall status
    let status;
    if (score >= 80) {
      status = VERIFICATION_STATUS.VERIFIED;
    } else if (score >= 50) {
      status = VERIFICATION_STATUS.UNVERIFIED;
    } else if (score >= 20) {
      status = VERIFICATION_STATUS.SUSPICIOUS;
    } else {
      status = VERIFICATION_STATUS.REJECTED;
    }

    const result = {
      status,
      score,
      checks,
      warnings,
      verifiedAt: new Date().toISOString(),
    };

    // Store hash for future duplicate detection
    if (status !== VERIFICATION_STATUS.REJECTED) {
      await this._storePhotoHash(photoUri, fileSize, dimensions);
    }

    return result;
  },

  /**
   * Check if photo timestamp is recent (within 24h)
   */
  _checkTimestamp(exifData) {
    if (!exifData?.DateTimeOriginal && !exifData?.DateTime) {
      return {
        passed: false,
        reason: 'No timestamp in photo metadata',
        severity: 'low',
      };
    }

    const photoDate = new Date(exifData.DateTimeOriginal || exifData.DateTime);
    const ageMs = Date.now() - photoDate.getTime();

    if (isNaN(ageMs)) {
      return {
        passed: false,
        reason: 'Invalid photo timestamp',
        severity: 'medium',
      };
    }

    if (ageMs > MAX_PHOTO_AGE_MS) {
      const hoursAgo = Math.round(ageMs / (1000 * 60 * 60));
      return {
        passed: false,
        reason: `Photo taken ${hoursAgo} hours ago (max 24h allowed)`,
        severity: 'medium',
      };
    }

    if (ageMs < 0) {
      return {
        passed: false,
        reason: 'Photo timestamp is in the future',
        severity: 'high',
      };
    }

    return { passed: true, reason: null, severity: null };
  },

  /**
   * Check if photo GPS matches claimed catch location
   */
  _checkGpsMatch(exifData, claimedLocation) {
    if (!exifData?.GPSLatitude || !claimedLocation) {
      return {
        passed: false,
        reason: 'No GPS data to verify location',
        severity: 'low',
      };
    }

    const photoLat = this._parseGpsCoord(
      exifData.GPSLatitude,
      exifData.GPSLatitudeRef,
    );
    const photoLng = this._parseGpsCoord(
      exifData.GPSLongitude,
      exifData.GPSLongitudeRef,
    );

    if (isNaN(photoLat) || isNaN(photoLng)) {
      return {
        passed: false,
        reason: 'Invalid GPS coordinates in photo',
        severity: 'medium',
      };
    }

    const distanceKm = this._haversineDistance(
      photoLat,
      photoLng,
      claimedLocation.latitude,
      claimedLocation.longitude,
    );

    if (distanceKm > GPS_TOLERANCE_KM) {
      return {
        passed: false,
        reason: `Photo taken ${Math.round(distanceKm)}km from claimed location`,
        severity: 'high',
      };
    }

    return { passed: true, reason: null, severity: null, distanceKm };
  },

  /**
   * Check for duplicate photo submissions
   */
  async _checkDuplicate(photoUri, fileSize, dimensions) {
    const hash = this._generateSimpleHash(photoUri, fileSize, dimensions);
    const storedHashes = await this._getStoredHashes();

    if (storedHashes.includes(hash)) {
      return {
        passed: false,
        reason: 'This photo appears to have been submitted before',
        severity: 'high',
      };
    }

    return { passed: true, reason: null, severity: null };
  },

  /**
   * Check if photo has expected metadata (not stripped)
   */
  _checkMetadata(exifData) {
    if (!exifData) {
      return {
        passed: false,
        reason: 'Photo has no metadata (may be a screenshot or download)',
        severity: 'low',
      };
    }

    const hasCamera = !!exifData.Make || !!exifData.Model;
    const hasTimestamp = !!exifData.DateTimeOriginal || !!exifData.DateTime;
    const metadataCount = Object.keys(exifData).length;

    if (metadataCount < 3 && !hasCamera) {
      return {
        passed: false,
        reason: 'Minimal metadata — photo may be edited or downloaded',
        severity: 'low',
      };
    }

    if (!hasTimestamp) {
      return {
        passed: false,
        reason: 'No timestamp metadata found',
        severity: 'low',
      };
    }

    return { passed: true, reason: null, severity: null };
  },

  /**
   * Check photo dimensions and file size for sanity
   */
  _checkDimensions(dimensions, fileSize) {
    if (!dimensions) {
      return { passed: true, reason: null, severity: null }; // Can't check
    }

    const { width, height } = dimensions;

    // Flag tiny images (likely thumbnails or fake)
    if (width < 200 || height < 200) {
      return {
        passed: false,
        reason: 'Image too small — minimum 200x200px',
        severity: 'medium',
      };
    }

    // Flag exact square crops that look auto-generated
    if (width === height && width > 1000 && fileSize < 50000) {
      return {
        passed: false,
        reason: 'Suspiciously uniform dimensions with small file size',
        severity: 'low',
      };
    }

    return { passed: true, reason: null, severity: null };
  },

  /**
   * Generate a simple hash from photo properties
   * (In production, use a proper perceptual hash like pHash)
   */
  _generateSimpleHash(uri, fileSize, dimensions) {
    const parts = [
      fileSize || 0,
      dimensions?.width || 0,
      dimensions?.height || 0,
      uri?.split('/').pop() || '',
    ];
    return parts.join('_');
  },

  /**
   * Parse GPS coordinate from EXIF format
   */
  _parseGpsCoord(coord, ref) {
    if (typeof coord === 'number') return coord;
    if (!Array.isArray(coord) || coord.length < 3) return NaN;

    let decimal = coord[0] + coord[1] / 60 + coord[2] / 3600;
    if (ref === 'S' || ref === 'W') decimal = -decimal;
    return decimal;
  },

  /**
   * Haversine distance between two GPS points (km)
   */
  _haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  /**
   * Store a photo hash locally for future duplicate detection
   */
  async _storePhotoHash(uri, fileSize, dimensions) {
    try {
      const hash = this._generateSimpleHash(uri, fileSize, dimensions);
      const hashes = await this._getStoredHashes();

      if (!hashes.includes(hash)) {
        hashes.push(hash);
        // Keep only the most recent N hashes
        const trimmed = hashes.slice(-MAX_STORED_HASHES);
        await AsyncStorage.setItem(HASH_STORE_KEY, JSON.stringify(trimmed));
      }
    } catch {}
  },

  /**
   * Get stored photo hashes
   */
  async _getStoredHashes() {
    try {
      const stored = await AsyncStorage.getItem(HASH_STORE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  /**
   * Submit verification result to Firestore for audit trail
   */
  async submitVerification(catchId, verificationResult) {
    if (!firestore) return;

    const user = auth?.().currentUser;
    try {
      await firestore()
        .collection('catch_verifications')
        .doc(catchId)
        .set({
          catchId,
          userId: user?.uid,
          ...verificationResult,
        });
    } catch (e) {
      console.warn('[AntiCheat] Submit verification error:', e);
    }
  },

  /**
   * Get verification badge text/color for display
   */
  getVerificationBadge(status) {
    switch (status) {
      case VERIFICATION_STATUS.VERIFIED:
        return { text: '✓ Verified', color: '#4CAF50', icon: 'check-circle' };
      case VERIFICATION_STATUS.SUSPICIOUS:
        return { text: '⚠ Suspicious', color: '#FF9800', icon: 'alert' };
      case VERIFICATION_STATUS.REJECTED:
        return { text: '✗ Rejected', color: '#F44336', icon: 'close-circle' };
      case VERIFICATION_STATUS.PENDING:
        return { text: '⏳ Pending', color: '#2196F3', icon: 'clock' };
      default:
        return { text: 'Unverified', color: '#888', icon: 'help-circle' };
    }
  },
};

export default antiCheatService;
