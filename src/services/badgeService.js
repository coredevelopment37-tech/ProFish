/**
 * Badge System — ProFish
 *
 * Defines milestone badges that users earn through fishing activity.
 * Badges are evaluated locally against catch data and stored in AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const BADGE_STORAGE_KEY = '@profish_badges';

/**
 * Badge definitions — each has:
 *   id, name, icon, description, category, check(catches) => boolean
 */
export const BADGE_DEFINITIONS = [
  // ── Catch Count ────────────────────────────
  {
    id: 'first_catch',
    name: 'First Blood',
    icon: 'fish',
    description: 'Log your first catch',
    category: 'milestones',
    check: catches => catches.length >= 1,
  },
  {
    id: 'ten_catches',
    name: 'Getting Started',
    icon: 'award',
    description: 'Log 10 catches',
    category: 'milestones',
    check: catches => catches.length >= 10,
  },
  {
    id: 'fifty_catches',
    name: 'Dedicated Angler',
    icon: 'star',
    description: 'Log 50 catches',
    category: 'milestones',
    check: catches => catches.length >= 50,
  },
  {
    id: 'hundred_catches',
    name: 'Century Club',
    icon: 'trophy',
    description: 'Log 100 catches',
    category: 'milestones',
    check: catches => catches.length >= 100,
  },
  {
    id: 'five_hundred_catches',
    name: 'Master Angler',
    icon: 'trophy',
    description: 'Log 500 catches',
    category: 'milestones',
    check: catches => catches.length >= 500,
  },

  // ── Species Diversity ──────────────────────
  {
    id: 'five_species',
    name: 'Diverse Angler',
    icon: 'fish',
    description: 'Catch 5 different species',
    category: 'species',
    check: catches => {
      const unique = new Set(catches.map(c => c.species).filter(Boolean));
      return unique.size >= 5;
    },
  },
  {
    id: 'ten_species',
    name: 'Species Explorer',
    icon: 'fish',
    description: 'Catch 10 different species',
    category: 'species',
    check: catches => {
      const unique = new Set(catches.map(c => c.species).filter(Boolean));
      return unique.size >= 10;
    },
  },
  {
    id: 'twenty_species',
    name: 'Ichthyologist',
    icon: 'dna',
    description: 'Catch 20 different species',
    category: 'species',
    check: catches => {
      const unique = new Set(catches.map(c => c.species).filter(Boolean));
      return unique.size >= 20;
    },
  },

  // ── Size Records ───────────────────────────
  {
    id: 'five_kg',
    name: 'Heavy Hitter',
    icon: 'zap',
    description: 'Catch a fish over 5 kg',
    category: 'records',
    check: catches => catches.some(c => c.weight >= 5),
  },
  {
    id: 'ten_kg',
    name: 'Trophy Fish',
    icon: 'medal',
    description: 'Catch a fish over 10 kg',
    category: 'records',
    check: catches => catches.some(c => c.weight >= 10),
  },
  {
    id: 'twenty_kg',
    name: 'Monster Catch',
    icon: 'fish',
    description: 'Catch a fish over 20 kg',
    category: 'records',
    check: catches => catches.some(c => c.weight >= 20),
  },

  // ── Consistency ────────────────────────────
  {
    id: 'streak_3',
    name: 'Three-Peat',
    icon: 'flame',
    description: 'Log catches 3 days in a row',
    category: 'streaks',
    check: catches => hasConsecutiveDays(catches, 3),
  },
  {
    id: 'streak_7',
    name: 'Weekly Warrior',
    icon: 'flame',
    description: 'Log catches 7 days in a row',
    category: 'streaks',
    check: catches => hasConsecutiveDays(catches, 7),
  },
  {
    id: 'streak_30',
    name: 'Iron Angler',
    icon: 'zap',
    description: 'Log catches 30 days in a row',
    category: 'streaks',
    check: catches => hasConsecutiveDays(catches, 30),
  },

  // ── Special ────────────────────────────────
  {
    id: 'catch_and_release',
    name: 'Conservation Hero',
    icon: 'leaf',
    description: 'Release 10 catches',
    category: 'special',
    check: catches => catches.filter(c => c.released).length >= 10,
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    icon: 'moon',
    description: 'Log a catch between midnight and 5 AM',
    category: 'special',
    check: catches =>
      catches.some(c => {
        const h = new Date(c.createdAt).getHours();
        return h >= 0 && h < 5;
      }),
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    icon: 'sunrise',
    description: 'Log a catch before 6 AM',
    category: 'special',
    check: catches =>
      catches.some(c => {
        const h = new Date(c.createdAt).getHours();
        return h >= 5 && h < 6;
      }),
  },
  {
    id: 'photo_logger',
    name: 'Shutterbug',
    icon: 'camera',
    description: 'Log 10 catches with photos',
    category: 'special',
    check: catches => catches.filter(c => c.photoUri || c.photo).length >= 10,
  },
];

/**
 * Helper: check if catches span N consecutive days
 */
function hasConsecutiveDays(catches, n) {
  if (catches.length < n) return false;
  const days = new Set(
    catches.map(c => {
      const d = new Date(c.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  );
  const sorted = [...days].sort();
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak++;
      if (streak >= n) return true;
    } else {
      streak = 1;
    }
  }
  return streak >= n;
}

// ── Badge Service ─────────────────────────────

const badgeService = {
  /**
   * Evaluate all badges against current catch data.
   * Returns { earned: BadgeDef[], new: BadgeDef[], total: number }
   */
  async evaluateBadges(catches) {
    const previously = await this.getEarnedBadgeIds();
    const earned = [];
    const newly = [];

    for (const badge of BADGE_DEFINITIONS) {
      try {
        if (badge.check(catches)) {
          earned.push(badge);
          if (!previously.has(badge.id)) {
            newly.push(badge);
          }
        }
      } catch {}
    }

    // Persist earned badges
    if (newly.length > 0) {
      const allIds = earned.map(b => b.id);
      await AsyncStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(allIds));
    }

    return {
      earned,
      new: newly,
      total: BADGE_DEFINITIONS.length,
      progress: earned.length / BADGE_DEFINITIONS.length,
    };
  },

  /**
   * Get set of previously earned badge IDs
   */
  async getEarnedBadgeIds() {
    try {
      const raw = await AsyncStorage.getItem(BADGE_STORAGE_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  },

  /**
   * Get all badge definitions grouped by category
   */
  getBadgesByCategory() {
    const groups = {};
    for (const b of BADGE_DEFINITIONS) {
      if (!groups[b.category]) groups[b.category] = [];
      groups[b.category].push(b);
    }
    return groups;
  },
};

export default badgeService;
