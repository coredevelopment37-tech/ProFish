/**
 * CoachMarkService — Contextual tooltips for first use of features
 * #508 — Coach marks / tooltips system
 *
 * Tracks which coach marks have been shown via AsyncStorage.
 * Each feature shows its tooltip only once.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@profish_coach_marks';

const COACH_MARKS = {
  MAP_LAYERS: {
    id: 'map_layers',
    title: 'Layer Up Your Map',
    message:
      'Tap here to toggle 18 map layers — bathymetry, SST, weather, and more.',
    position: 'bottom',
    emoji: '🗺️',
  },
  FISHCAST_SCORE: {
    id: 'fishcast_score',
    title: 'Your FishCast Score',
    message:
      'This number (0-100) predicts how good fishing will be right now. 80+ means get out there!',
    position: 'bottom',
    emoji: '🎯',
  },
  LOG_CATCH: {
    id: 'log_catch',
    title: 'Log Your First Catch',
    message:
      'Tap + to record a catch. Add a photo and our AI will identify the species.',
    position: 'top',
    emoji: '📸',
  },
  SAVE_SPOT: {
    id: 'save_spot',
    title: 'Save This Spot',
    message: 'Long-press anywhere on the map to bookmark a fishing spot.',
    position: 'bottom',
    emoji: '📍',
  },
  TIDE_CHART: {
    id: 'tide_chart',
    title: 'Tide Stations',
    message:
      'Tap a tide marker to see the full tide chart with high/low predictions.',
    position: 'top',
    emoji: '🌊',
  },
  SPECIES_DETAIL: {
    id: 'species_detail',
    title: 'Species Intel',
    message:
      'Tap any species to see best baits, seasons, regulations, and a species-tuned FishCast.',
    position: 'top',
    emoji: '🐟',
  },
  COMMUNITY_POST: {
    id: 'community_post',
    title: 'Share Your Catch',
    message:
      'Post your catch to the community feed. Get likes, comments, and climb leaderboards.',
    position: 'bottom',
    emoji: '🏆',
  },
  WEATHER_LAYER: {
    id: 'weather_layer',
    title: 'Weather Overlay',
    message:
      'Enable the weather layer to see real-time conditions directly on the map.',
    position: 'bottom',
    emoji: '⛅',
  },
  TRIP_PLANNER: {
    id: 'trip_planner',
    title: 'Plan Your Trip',
    message:
      "Pick a date, species, and we'll find the perfect spot, time, and bait for you.",
    position: 'top',
    emoji: '📅',
  },
  MOON_CALENDAR: {
    id: 'moon_calendar',
    title: 'Moon Phase Calendar',
    message:
      'Check moon phases and solunar periods. New and full moons = best feeding times.',
    position: 'top',
    emoji: '🌙',
  },
};

let _shownMarks = new Set();
let _loaded = false;

async function _load() {
  if (_loaded) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) _shownMarks = new Set(JSON.parse(raw));
  } catch (e) {
    // ignore
  }
  _loaded = true;
}

async function _save() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([..._shownMarks]));
  } catch (e) {
    // ignore
  }
}

/**
 * Check if a coach mark should be shown (hasn't been shown yet)
 * @param {string} markId — key from COACH_MARKS (e.g. 'MAP_LAYERS')
 * @returns {Promise<Object|null>} — coach mark config or null if already shown
 */
export async function shouldShowCoachMark(markId) {
  await _load();
  const mark = COACH_MARKS[markId];
  if (!mark) return null;
  if (_shownMarks.has(mark.id)) return null;
  return mark;
}

/**
 * Mark a coach mark as shown (won't appear again)
 * @param {string} markId
 */
export async function dismissCoachMark(markId) {
  await _load();
  const mark = COACH_MARKS[markId];
  if (!mark) return;
  _shownMarks.add(mark.id);
  await _save();
}

/**
 * Reset all coach marks (for testing or re-onboarding)
 */
export async function resetCoachMarks() {
  _shownMarks.clear();
  _loaded = true;
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/**
 * Get all coach mark definitions
 */
export function getAllCoachMarks() {
  return COACH_MARKS;
}

export default {
  shouldShowCoachMark,
  dismissCoachMark,
  resetCoachMarks,
  getAllCoachMarks,
  COACH_MARKS,
};
