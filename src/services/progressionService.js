/**
 * Progression Service — Beginner → Pro skill tracking system
 * #530 — Skill level, XP, badges, learning path
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@profish_progression';

const SKILL_LEVELS = [
  {
    level: 1,
    name: 'Beginner',
    xpRequired: 0,
    badge: 'fish',
    perks: ['Basic catch logging', 'Weather view'],
  },
  {
    level: 2,
    name: 'Novice',
    xpRequired: 100,
    badge: 'fish',
    perks: ['Unlock FishCast score', 'Basic map layers'],
  },
  {
    level: 3,
    name: 'Apprentice',
    xpRequired: 300,
    badge: 'target',
    perks: ['Tide calendar', 'Species library'],
  },
  {
    level: 4,
    name: 'Intermediate',
    xpRequired: 600,
    badge: 'medal',
    perks: ['Advanced map layers', 'Catch stats'],
  },
  {
    level: 5,
    name: 'Advanced',
    xpRequired: 1000,
    badge: 'trophy',
    perks: ['Fishing predictions', 'Hotspot analysis'],
  },
  {
    level: 6,
    name: 'Expert',
    xpRequired: 1500,
    badge: 'gem',
    perks: ['Pattern recognition', 'Pro tips'],
  },
  {
    level: 7,
    name: 'Master',
    xpRequired: 2500,
    badge: 'crown',
    perks: ['Master badges', 'Mentor mode'],
  },
  {
    level: 8,
    name: 'Pro Angler',
    xpRequired: 4000,
    badge: 'star',
    perks: ['All features', 'Elite status'],
  },
];

/**
 * XP values for activities
 */
const XP_TABLE = {
  LOG_CATCH: 25,
  LOG_CATCH_WITH_PHOTO: 40,
  LOG_CATCH_WITH_DETAILS: 50, // weight, length, bait, conditions
  FIRST_SPECIES: 100, // first time catching a new species
  COMPLETE_LESSON: 15,
  COMPLETE_KNOT_GUIDE: 20,
  QUIZ_CORRECT_ANSWER: 10,
  QUIZ_PERFECT_SCORE: 100,
  SHARE_COMMUNITY_POST: 10,
  SAVE_FISHING_SPOT: 15,
  PLAN_TRIP: 20,
  DAILY_LOGIN: 5,
  SEVEN_DAY_STREAK: 50,
  THIRTY_DAY_STREAK: 200,
  BUCKET_LIST_SPECIES: 75,

  // Multipliers
  STREAK_MULTIPLIER: 0.1, // +10% per day streak (max 50%)
};

/**
 * Achievement badges
 */
const ACHIEVEMENTS = [
  // Catch achievements
  {
    id: 'first_catch',
    name: 'First Catch',
    emoji: 'fish',
    desc: 'Log your first catch',
    condition: { type: 'catches', count: 1 },
  },
  {
    id: 'ten_catches',
    name: 'Getting Hooked',
    emoji: 'fish',
    desc: 'Log 10 catches',
    condition: { type: 'catches', count: 10 },
  },
  {
    id: 'fifty_catches',
    name: 'Reel Deal',
    emoji: 'flame',
    desc: 'Log 50 catches',
    condition: { type: 'catches', count: 50 },
  },
  {
    id: 'hundred_catches',
    name: 'Centurion',
    emoji: 'trophy',
    desc: 'Log 100 catches',
    condition: { type: 'catches', count: 100 },
  },
  {
    id: 'five_hundred_catches',
    name: 'Legend',
    emoji: 'crown',
    desc: 'Log 500 catches',
    condition: { type: 'catches', count: 500 },
  },

  // Species achievements
  {
    id: 'five_species',
    name: 'Explorer',
    emoji: 'map',
    desc: 'Catch 5 different species',
    condition: { type: 'species', count: 5 },
  },
  {
    id: 'twenty_species',
    name: 'Collector',
    emoji: 'bookOpen',
    desc: 'Catch 20 different species',
    condition: { type: 'species', count: 20 },
  },
  {
    id: 'fifty_species',
    name: 'Ichthyologist',
    emoji: 'dna',
    desc: 'Catch 50 different species',
    condition: { type: 'species', count: 50 },
  },

  // Learning achievements
  {
    id: 'first_lesson',
    name: 'Student',
    emoji: 'bookOpen',
    desc: 'Complete your first lesson',
    condition: { type: 'lessons', count: 1 },
  },
  {
    id: 'ten_lessons',
    name: 'Scholar',
    emoji: 'graduationCap',
    desc: 'Complete 10 lessons',
    condition: { type: 'lessons', count: 10 },
  },
  {
    id: 'knot_master',
    name: 'Knot Master',
    emoji: 'link',
    desc: 'Learn all 20 knots',
    condition: { type: 'knots', count: 20 },
  },
  {
    id: 'quiz_ace',
    name: 'Quiz Ace',
    emoji: 'brain',
    desc: 'Get 100% on a quiz',
    condition: { type: 'quiz_perfect', count: 1 },
  },

  // Streak achievements
  {
    id: 'week_streak',
    name: 'Week Warrior',
    emoji: 'calendar',
    desc: '7-day login streak',
    condition: { type: 'streak', count: 7 },
  },
  {
    id: 'month_streak',
    name: 'Committed',
    emoji: 'calendar',
    desc: '30-day login streak',
    condition: { type: 'streak', count: 30 },
  },

  // Social achievements
  {
    id: 'first_post',
    name: 'Social Fisher',
    emoji: 'messageCircle',
    desc: 'Share your first community post',
    condition: { type: 'posts', count: 1 },
  },
  {
    id: 'first_spot',
    name: 'Scout',
    emoji: 'mapPin',
    desc: 'Save your first fishing spot',
    condition: { type: 'spots', count: 1 },
  },
];

/**
 * Default player state
 */
function getDefaultState() {
  return {
    xp: 0,
    level: 1,
    totalCatches: 0,
    uniqueSpecies: [],
    completedLessons: [],
    completedKnots: [],
    quizPerfects: 0,
    totalQuizCorrect: 0,
    communityPosts: 0,
    savedSpots: 0,
    loginStreak: 0,
    longestStreak: 0,
    lastLoginDate: null,
    earnedAchievements: [],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Load player progression from storage
 */
async function loadProgression() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* ignore */
  }
  return getDefaultState();
}

/**
 * Save player progression
 */
async function saveProgression(state) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    /* ignore */
  }
}

/**
 * Calculate level from XP
 */
function calculateLevel(xp) {
  let lvl = SKILL_LEVELS[0];
  for (const sl of SKILL_LEVELS) {
    if (xp >= sl.xpRequired) lvl = sl;
    else break;
  }
  return lvl;
}

/**
 * Calculate XP needed for next level
 */
function xpToNextLevel(xp) {
  const currentLevel = calculateLevel(xp);
  const nextLevel = SKILL_LEVELS.find(sl => sl.xpRequired > xp);
  if (!nextLevel) return { needed: 0, total: 0, progress: 1 };
  const needed = nextLevel.xpRequired - xp;
  const total = nextLevel.xpRequired - currentLevel.xpRequired;
  const progress = 1 - needed / total;
  return { needed, total, progress };
}

/**
 * Add XP with streak multiplier
 */
async function addXP(activity, extraMultiplier = 1) {
  const state = await loadProgression();
  const baseXP = XP_TABLE[activity] || 0;
  const streakBonus = Math.min(
    state.loginStreak * XP_TABLE.STREAK_MULTIPLIER,
    0.5,
  );
  const totalXP = Math.round(baseXP * (1 + streakBonus) * extraMultiplier);

  const oldLevel = calculateLevel(state.xp);
  state.xp += totalXP;
  const newLevel = calculateLevel(state.xp);

  await saveProgression(state);

  return {
    xpGained: totalXP,
    totalXP: state.xp,
    leveledUp: newLevel.level > oldLevel.level,
    newLevel: newLevel,
    streakBonus: Math.round(streakBonus * 100),
  };
}

/**
 * Record a catch and update progression
 */
async function recordCatch(speciesId, hasPhoto = false, hasDetails = false) {
  const state = await loadProgression();
  state.totalCatches += 1;

  let xp = XP_TABLE.LOG_CATCH;
  if (hasPhoto) xp = XP_TABLE.LOG_CATCH_WITH_PHOTO;
  if (hasDetails) xp = XP_TABLE.LOG_CATCH_WITH_DETAILS;

  // First time species bonus
  const isNew = !state.uniqueSpecies.includes(speciesId);
  if (isNew) {
    state.uniqueSpecies.push(speciesId);
    xp += XP_TABLE.FIRST_SPECIES;
  }

  const streakBonus = Math.min(
    state.loginStreak * XP_TABLE.STREAK_MULTIPLIER,
    0.5,
  );
  const totalXP = Math.round(xp * (1 + streakBonus));

  const oldLevel = calculateLevel(state.xp);
  state.xp += totalXP;
  const newLevel = calculateLevel(state.xp);

  // Check achievements
  const newAchievements = checkAchievements(state);

  await saveProgression(state);

  return {
    xpGained: totalXP,
    newSpecies: isNew,
    totalSpecies: state.uniqueSpecies.length,
    leveledUp: newLevel.level > oldLevel.level,
    newLevel,
    newAchievements,
  };
}

/**
 * Record lesson completion
 */
async function recordLessonComplete(lessonId) {
  const state = await loadProgression();
  if (!state.completedLessons.includes(lessonId)) {
    state.completedLessons.push(lessonId);
  }
  const result = await addXP('COMPLETE_LESSON');
  return { ...result, totalLessons: state.completedLessons.length };
}

/**
 * Record knot learned
 */
async function recordKnotLearned(knotId) {
  const state = await loadProgression();
  if (!state.completedKnots.includes(knotId)) {
    state.completedKnots.push(knotId);
  }
  const result = await addXP('COMPLETE_KNOT_GUIDE');
  return { ...result, totalKnots: state.completedKnots.length };
}

/**
 * Record daily login streak
 */
async function recordDailyLogin() {
  const state = await loadProgression();
  const today = new Date().toISOString().split('T')[0];

  if (state.lastLoginDate === today)
    return { streak: state.loginStreak, xpGained: 0 };

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (state.lastLoginDate === yesterday) {
    state.loginStreak += 1;
  } else {
    state.loginStreak = 1;
  }

  state.lastLoginDate = today;
  state.longestStreak = Math.max(state.longestStreak, state.loginStreak);

  let bonusXP = XP_TABLE.DAILY_LOGIN;
  if (state.loginStreak === 7) bonusXP += XP_TABLE.SEVEN_DAY_STREAK;
  if (state.loginStreak === 30) bonusXP += XP_TABLE.THIRTY_DAY_STREAK;

  state.xp += bonusXP;
  const newAchievements = checkAchievements(state);
  await saveProgression(state);

  return { streak: state.loginStreak, xpGained: bonusXP, newAchievements };
}

/**
 * Check and award achievements
 */
function checkAchievements(state) {
  const newlyEarned = [];

  for (const ach of ACHIEVEMENTS) {
    if (state.earnedAchievements.includes(ach.id)) continue;

    let earned = false;
    const c = ach.condition;

    switch (c.type) {
      case 'catches':
        earned = state.totalCatches >= c.count;
        break;
      case 'species':
        earned = state.uniqueSpecies.length >= c.count;
        break;
      case 'lessons':
        earned = state.completedLessons.length >= c.count;
        break;
      case 'knots':
        earned = state.completedKnots.length >= c.count;
        break;
      case 'quiz_perfect':
        earned = state.quizPerfects >= c.count;
        break;
      case 'streak':
        earned = state.loginStreak >= c.count;
        break;
      case 'posts':
        earned = state.communityPosts >= c.count;
        break;
      case 'spots':
        earned = state.savedSpots >= c.count;
        break;
    }

    if (earned) {
      state.earnedAchievements.push(ach.id);
      newlyEarned.push(ach);
    }
  }

  return newlyEarned;
}

/**
 * Get full progression summary
 */
async function getProgressionSummary() {
  const state = await loadProgression();
  const level = calculateLevel(state.xp);
  const nextLevel = xpToNextLevel(state.xp);

  return {
    ...state,
    currentLevel: level,
    nextLevel,
    totalAchievements: ACHIEVEMENTS.length,
    earnedCount: state.earnedAchievements.length,
    achievements: ACHIEVEMENTS.map(a => ({
      ...a,
      earned: state.earnedAchievements.includes(a.id),
    })),
  };
}

/**
 * Reset progression (for testing)
 */
async function resetProgression() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export {
  SKILL_LEVELS,
  XP_TABLE,
  ACHIEVEMENTS,
  loadProgression,
  saveProgression,
  calculateLevel,
  xpToNextLevel,
  addXP,
  recordCatch,
  recordLessonComplete,
  recordKnotLearned,
  recordDailyLogin,
  getProgressionSummary,
  resetProgression,
};

export default {
  loadProgression,
  calculateLevel,
  xpToNextLevel,
  addXP,
  recordCatch,
  recordLessonComplete,
  recordKnotLearned,
  recordDailyLogin,
  getProgressionSummary,
  resetProgression,
};
