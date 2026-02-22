/**
 * castingService.js — Casting Simulator engine
 * Physics, scoring, progression, and technique definitions.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@profish_casting_progress';

// ── Technique Definitions ──────────────────────────────────────────
export const TECHNIQUES = [
  {
    id: 'overhead',
    name: 'Overhead Cast',
    difficulty: 'beginner',
    stars: 1,
    unlocked: true,
    emoji: '🎣',
    scene: 'lake',
    description:
      'The foundation of all casting. Straight back, forward release.',
    tip: "Flick forward smoothly — release at the 10 o'clock position.",
    powerWeight: 0.5,
    accuracyWeight: 0.5,
    maxDistance: 40, // meters
    targetZone: { min: 15, max: 35 },
    windFactor: 0.3,
  },
  {
    id: 'sidearm',
    name: 'Sidearm Cast',
    difficulty: 'beginner',
    stars: 1,
    unlocked: true,
    emoji: '🌿',
    scene: 'river',
    description: 'Low-profile cast under branches, docks, and overhangs.',
    tip: 'Swipe sideways — keep the rod tip low to skip under obstacles.',
    powerWeight: 0.3,
    accuracyWeight: 0.7,
    maxDistance: 25,
    targetZone: { min: 8, max: 20 },
    windFactor: 0.2,
  },
  {
    id: 'roll_cast',
    name: 'Roll Cast',
    difficulty: 'intermediate',
    stars: 2,
    unlocked: false,
    emoji: '🌊',
    scene: 'river',
    description:
      'No back-cast needed — line rolls off the water surface forward.',
    tip: 'Lift rod tip slowly, then snap forward. Timing is everything.',
    powerWeight: 0.4,
    accuracyWeight: 0.6,
    maxDistance: 20,
    targetZone: { min: 5, max: 18 },
    windFactor: 0.15,
  },
  {
    id: 'pitch',
    name: 'Pitch Cast',
    difficulty: 'intermediate',
    stars: 2,
    unlocked: false,
    emoji: '🎯',
    scene: 'lake',
    description:
      'Underhand pendulum swing for silent, precise short-range drops.',
    tip: 'Gentle underhand lob — let the lure swing like a pendulum.',
    powerWeight: 0.2,
    accuracyWeight: 0.8,
    maxDistance: 15,
    targetZone: { min: 3, max: 12 },
    windFactor: 0.1,
  },
  {
    id: 'flip',
    name: 'Flip Cast',
    difficulty: 'intermediate',
    stars: 2,
    unlocked: false,
    emoji: '🪵',
    scene: 'swamp',
    description: 'One-handed jig delivery into tight cover. Stealth fishing.',
    tip: 'Quick wrist flip upward — accuracy beats distance.',
    powerWeight: 0.15,
    accuracyWeight: 0.85,
    maxDistance: 10,
    targetZone: { min: 2, max: 8 },
    windFactor: 0.05,
  },
  {
    id: 'surf',
    name: 'Surf Cast',
    difficulty: 'advanced',
    stars: 3,
    unlocked: false,
    emoji: '🏖️',
    scene: 'ocean',
    description:
      'Two-handed power cast from the beach. Maximum distance over waves.',
    tip: 'Load the rod fully — big swing, explosive forward release.',
    powerWeight: 0.7,
    accuracyWeight: 0.3,
    maxDistance: 80,
    targetZone: { min: 30, max: 70 },
    windFactor: 0.5,
  },
  {
    id: 'fly',
    name: 'Fly Cast',
    difficulty: 'advanced',
    stars: 3,
    unlocked: false,
    emoji: '🪰',
    scene: 'river',
    description:
      'False casts to load the rod, then shoot the line. Rhythm is key.',
    tip: 'Build rhythm with 2-3 false casts, then release on the forward stroke.',
    powerWeight: 0.35,
    accuracyWeight: 0.65,
    maxDistance: 25,
    targetZone: { min: 8, max: 22 },
    windFactor: 0.4,
  },
  {
    id: 'double_haul',
    name: 'Double Haul',
    difficulty: 'advanced',
    stars: 3,
    unlocked: false,
    emoji: '💨',
    scene: 'ocean',
    description:
      'Fly fishing power technique — haul line on both back and forward cast.',
    tip: 'Pull line on back-cast AND forward-cast for maximum line speed.',
    powerWeight: 0.6,
    accuracyWeight: 0.4,
    maxDistance: 40,
    targetZone: { min: 15, max: 35 },
    windFactor: 0.5,
  },
  {
    id: 'deep_sea',
    name: 'Deep Sea Cast',
    difficulty: 'pro',
    stars: 4,
    unlocked: false,
    emoji: '🦈',
    scene: 'deep_ocean',
    description:
      'Heavy tackle offshore cast — big game lures, fighting the swell.',
    tip: "Massive power swing — time it with the boat's roll for extra reach.",
    powerWeight: 0.8,
    accuracyWeight: 0.2,
    maxDistance: 60,
    targetZone: { min: 20, max: 55 },
    windFactor: 0.6,
  },
  {
    id: 'skipping',
    name: 'Skipping',
    difficulty: 'pro',
    stars: 4,
    unlocked: false,
    emoji: '💎',
    scene: 'lake',
    description:
      'Skip your lure across water like a stone — under docks and mangroves.',
    tip: 'Low sidearm cast with backspin — aim flat at the water surface.',
    powerWeight: 0.4,
    accuracyWeight: 0.6,
    maxDistance: 20,
    targetZone: { min: 5, max: 18 },
    windFactor: 0.2,
  },
];

export const DIFFICULTY_COLORS = {
  beginner: '#4CAF50',
  intermediate: '#FF9800',
  advanced: '#F44336',
  pro: '#9C27B0',
};

export const SCENE_CONFIG = {
  lake: { bg1: '#0a0a2e', bg2: '#0d1b3e', water: '#1a3a5c', label: 'Lake' },
  river: { bg1: '#0a1a0a', bg2: '#0d2d1b', water: '#1a4a3c', label: 'River' },
  ocean: { bg1: '#0a0a2e', bg2: '#0b1540', water: '#0d2a5c', label: 'Ocean' },
  deep_ocean: {
    bg1: '#050520',
    bg2: '#080830',
    water: '#0a1a4a',
    label: 'Deep Ocean',
  },
  swamp: { bg1: '#0a1a0a', bg2: '#1a2a10', water: '#2a3a1a', label: 'Swamp' },
};

// ── Physics Engine ─────────────────────────────────────────────────

/**
 * Calculate cast result from gesture data.
 * @param {object} gesture - { power: 0-1, timing: 0-1, angle: degrees }
 * @param {object} technique - technique config from TECHNIQUES
 * @param {number} windSpeed - 0-1 random wind factor
 * @param {number} windDir - -1 or 1 (left/right)
 * @returns {object} { distance, accuracy, drift, landingX, score, stars }
 */
export function calculateCast(gesture, technique, windSpeed = 0, windDir = 1) {
  const { power, timing, angle } = gesture;

  // Distance based on power and technique max
  const powerCurve = Math.pow(power, 1.3); // slightly exponential
  const rawDistance = powerCurve * technique.maxDistance;

  // Timing affects accuracy: perfect timing (0.5) = best accuracy
  const timingError = Math.abs(timing - 0.5) * 2; // 0 = perfect, 1 = worst
  const timingAccuracy = 1 - timingError;

  // Wind drift
  const drift = windSpeed * technique.windFactor * windDir * rawDistance * 0.15;

  // Landing position
  const landingDistance = Math.max(0, rawDistance + drift * 0.3);

  // Calculate accuracy: how close to target zone center
  const targetCenter =
    (technique.targetZone.min + technique.targetZone.max) / 2;
  const targetRange = technique.targetZone.max - technique.targetZone.min;
  const distFromCenter = Math.abs(landingDistance - targetCenter);
  const rawAccuracy = Math.max(0, 1 - distFromCenter / (targetRange * 0.8));
  const accuracy = rawAccuracy * timingAccuracy * 100;

  // Distance score: reward landing in target zone
  const inZone =
    landingDistance >= technique.targetZone.min &&
    landingDistance <= technique.targetZone.max;
  const distanceScore = inZone
    ? 60 + (rawDistance / technique.maxDistance) * 40
    : (rawDistance / technique.maxDistance) * 50;

  // Combined score
  const score = Math.round(
    distanceScore * technique.powerWeight + accuracy * technique.accuracyWeight,
  );

  // Stars based on score
  let stars = 0;
  if (score >= 90) stars = 3;
  else if (score >= 75) stars = 2;
  else if (score >= 50) stars = 1;

  return {
    distance: Math.round(landingDistance * 10) / 10,
    accuracy: Math.round(accuracy),
    drift: Math.round(drift * 10) / 10,
    landingX: drift,
    score: Math.min(100, Math.max(0, score)),
    stars,
    inZone,
  };
}

// ── Line trajectory for animation ──────────────────────────────────
/**
 * Generate bezier points for the cast arc animation.
 * Returns array of { x, y } normalized 0-1.
 */
export function getCastTrajectory(power, distance, maxDistance, drift) {
  const normalDist = distance / maxDistance;
  const points = [];
  const steps = 30;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Parabolic arc
    const x = t * normalDist + (drift / maxDistance) * t * t;
    const y = -4 * t * (t - 1) * (0.3 + power * 0.4); // arc height
    points.push({ x: Math.min(1, Math.max(0, x)), y: Math.max(0, y) });
  }
  return points;
}

// ── Progression ────────────────────────────────────────────────────

/**
 * Load saved progress from AsyncStorage.
 * Returns { techniques: { [id]: { bestScore, stars, attempts } }, totalStars, masterCaster }
 */
export async function loadProgress() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('castingService: failed to load progress', e);
  }
  return { techniques: {}, totalStars: 0, masterCaster: false };
}

/**
 * Save a cast result and update progression.
 */
export async function saveResult(techniqueId, score, stars) {
  const progress = await loadProgress();
  const prev = progress.techniques[techniqueId] || {
    bestScore: 0,
    stars: 0,
    attempts: 0,
  };

  progress.techniques[techniqueId] = {
    bestScore: Math.max(prev.bestScore, score),
    stars: Math.max(prev.stars, stars),
    attempts: prev.attempts + 1,
  };

  // Recalculate total stars
  let totalStars = 0;
  Object.values(progress.techniques).forEach(t => {
    totalStars += t.stars;
  });
  progress.totalStars = totalStars;
  progress.masterCaster = totalStars >= 30; // 10 techniques × 3 stars

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('castingService: failed to save progress', e);
  }

  return progress;
}

/**
 * Determine which techniques are unlocked based on progress.
 * - Overhead + Sidearm: always unlocked
 * - Each 2+ stars on any technique unlocks the next locked one
 */
export function getUnlockedTechniques(progress) {
  const unlocked = new Set(['overhead', 'sidearm']);
  let unlocksAvailable = 0;

  // Count techniques with 2+ stars
  Object.entries(progress.techniques || {}).forEach(([id, data]) => {
    if (data.stars >= 2) unlocksAvailable++;
  });

  // Unlock techniques in order
  for (const tech of TECHNIQUES) {
    if (unlocked.has(tech.id)) continue;
    if (unlocksAvailable > 0) {
      unlocked.add(tech.id);
      unlocksAvailable--;
    }
  }

  return unlocked;
}

/**
 * Generate random wind conditions.
 */
export function generateWind() {
  const speed = Math.random() * 0.8; // 0-0.8
  const direction = Math.random() > 0.5 ? 1 : -1;
  let label = 'Calm';
  if (speed > 0.6) label = 'Strong Wind';
  else if (speed > 0.35) label = 'Moderate Wind';
  else if (speed > 0.15) label = 'Light Breeze';
  return { speed, direction, label };
}
