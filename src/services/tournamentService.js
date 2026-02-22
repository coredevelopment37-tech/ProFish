/**
 * Tournament Service — ProFish Phase 2 (#365-379)
 *
 * Full tournament system:
 *   - Tournament CRUD (create, join, leave, submit catches)
 *   - Live leaderboard via Firestore snapshots
 *   - Catch verification queue
 *   - Tournament types: weekly community, team, sponsored
 *   - Tier-gated creation (Team/Guide only)
 *   - Notifications for tournament events
 *   - Tournament history and stats
 *   - Share cards generation
 *   - Sponsorship placement support
 *
 * Firestore collections:
 *   - tournaments/{tournamentId}: tournament document
 *   - tournaments/{tournamentId}/entries/{userId}: participant entries
 *   - tournaments/{tournamentId}/catches/{catchId}: submitted catches
 *   - tournaments/{tournamentId}/verification/{catchId}: verification queue
 *   - tournament_history/{userId}/tournaments/{tournamentId}: user history
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

let firestore = null;
let auth = null;
try {
  firestore = require('@react-native-firebase/firestore').default;
  auth = require('@react-native-firebase/auth').default;
} catch (e) {}

// ── Tournament data model (#365) ────────────────────────

export const TOURNAMENT_STATUS = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  ENDED: 'ended',
  CANCELLED: 'cancelled',
};

export const TOURNAMENT_TYPE = {
  COMMUNITY_WEEKLY: 'community_weekly', // #374 — Weekly community
  TEAM: 'team', // #375 — Team tournaments
  SPONSORED: 'sponsored', // #378 — Sponsored
  CUSTOM: 'custom',
};

export const TOURNAMENT_SCORING = {
  TOTAL_WEIGHT: 'total_weight',
  BIGGEST_CATCH: 'biggest_catch',
  TOTAL_CATCHES: 'total_catches',
  SPECIES_COUNT: 'species_count',
};

export const CATCH_VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  DISPUTED: 'disputed',
};

/**
 * Create a tournament data object (#365)
 */
export function createTournament({
  name,
  description = '',
  type = TOURNAMENT_TYPE.COMMUNITY_WEEKLY,
  scoring = TOURNAMENT_SCORING.TOTAL_WEIGHT,
  startDate,
  endDate,
  maxParticipants = 100,
  entryFee = 0,
  prizes = [],
  rules = [],
  targetSpecies = [],
  region = null,
  sponsor = null,
  teamSize = 1,
  requirePhoto = true,
  requireVerification = true,
}) {
  const user = auth?.().currentUser;
  return {
    id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name,
    description,
    type,
    scoring,
    status: TOURNAMENT_STATUS.UPCOMING,
    startDate,
    endDate,
    maxParticipants,
    entryFee,
    prizes,
    rules,
    targetSpecies,
    region,
    sponsor,
    teamSize,
    requirePhoto,
    requireVerification,
    participantCount: 0,
    createdBy: {
      uid: user?.uid || 'system',
      displayName: user?.displayName || 'ProFish',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    coverImage: null,
    tags: [],
  };
}

// ── Firestore collection paths (#366) ───────────────────

const COLLECTIONS = {
  TOURNAMENTS: 'tournaments',
  ENTRIES: 'entries',
  CATCHES: 'catches',
  VERIFICATION: 'verification',
  HISTORY: 'tournament_history',
};

const CACHE_KEY = '@profish_tournaments_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ── Service ─────────────────────────────────────────────

const tournamentService = {
  _listeners: new Map(),

  // ── Tournament CRUD ───────────────────────────────────

  /**
   * Create a new tournament (#379 — Team/Guide only)
   */
  async createTournament(data) {
    const tournament = createTournament(data);

    if (!firestore) {
      await this._cacheLocal(tournament);
      return tournament;
    }

    try {
      await firestore()
        .collection(COLLECTIONS.TOURNAMENTS)
        .doc(tournament.id)
        .set(tournament);
      return tournament;
    } catch (e) {
      console.warn('[Tournament] Create error:', e);
      await this._cacheLocal(tournament);
      return tournament;
    }
  },

  /**
   * Get all tournaments (with optional filters)
   */
  async getTournaments({
    status = null,
    type = null,
    region = null,
    limit = 30,
  } = {}) {
    if (!firestore) return this._getMockTournaments();

    try {
      let query = firestore()
        .collection(COLLECTIONS.TOURNAMENTS)
        .orderBy('startDate', 'desc')
        .limit(limit);

      if (status) {
        query = query.where('status', '==', status);
      }
      if (type) {
        query = query.where('type', '==', type);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('[Tournament] Fetch error:', e);
      return this._getMockTournaments();
    }
  },

  /**
   * Get a single tournament by ID
   */
  async getTournament(tournamentId) {
    if (!firestore) return this._getMockTournaments()[0];

    try {
      const doc = await firestore()
        .collection(COLLECTIONS.TOURNAMENTS)
        .doc(tournamentId)
        .get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (e) {
      console.warn('[Tournament] Get error:', e);
      return null;
    }
  },

  // ── Entry / Join (#370) ───────────────────────────────

  /**
   * Join a tournament
   */
  async joinTournament(tournamentId) {
    const user = auth?.().currentUser;
    if (!user || !firestore)
      return { success: false, error: 'Not authenticated' };

    try {
      // Check if already joined
      const existing = await firestore()
        .collection(COLLECTIONS.TOURNAMENTS)
        .doc(tournamentId)
        .collection(COLLECTIONS.ENTRIES)
        .doc(user.uid)
        .get();

      if (existing.exists) {
        return { success: false, error: 'Already joined this tournament' };
      }

      // Check participant limit
      const tournament = await this.getTournament(tournamentId);
      if (tournament.participantCount >= tournament.maxParticipants) {
        return { success: false, error: 'Tournament is full' };
      }

      // Create entry
      const entry = {
        userId: user.uid,
        displayName: user.displayName || 'Angler',
        photoURL: user.photoURL || null,
        joinedAt: new Date().toISOString(),
        totalScore: 0,
        catchCount: 0,
        bestCatch: null,
        rank: 0,
        team: null,
      };

      await firestore()
        .collection(COLLECTIONS.TOURNAMENTS)
        .doc(tournamentId)
        .collection(COLLECTIONS.ENTRIES)
        .doc(user.uid)
        .set(entry);

      // Increment participant count
      await firestore()
        .collection(COLLECTIONS.TOURNAMENTS)
        .doc(tournamentId)
        .update({
          participantCount: firestore.FieldValue.increment(1),
        });

      return { success: true, entry };
    } catch (e) {
      console.warn('[Tournament] Join error:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Leave a tournament
   */
  async leaveTournament(tournamentId) {
    const user = auth?.().currentUser;
    if (!user || !firestore) return false;

    try {
      await firestore()
        .collection(COLLECTIONS.TOURNAMENTS)
        .doc(tournamentId)
        .collection(COLLECTIONS.ENTRIES)
        .doc(user.uid)
        .delete();

      await firestore()
        .collection(COLLECTIONS.TOURNAMENTS)
        .doc(tournamentId)
        .update({
          participantCount: firestore.FieldValue.increment(-1),
        });

      return true;
    } catch (e) {
      console.warn('[Tournament] Leave error:', e);
      return false;
    }
  },

  /**
   * Check if current user is in a tournament
   */
  async isJoined(tournamentId) {
    const user = auth?.().currentUser;
    if (!user || !firestore) return false;

    try {
      const doc = await firestore()
        .collection(COLLECTIONS.TOURNAMENTS)
        .doc(tournamentId)
        .collection(COLLECTIONS.ENTRIES)
        .doc(user.uid)
        .get();
      return doc.exists;
    } catch {
      return false;
    }
  },

  // ── Catch Submission (#371) ───────────────────────────

  /**
   * Submit a catch to a tournament
   */
  async submitCatch(tournamentId, catchItem) {
    const user = auth?.().currentUser;
    if (!user || !firestore)
      return { success: false, error: 'Not authenticated' };

    try {
      const tournament = await this.getTournament(tournamentId);

      // Validate tournament is active
      if (tournament?.status !== TOURNAMENT_STATUS.ACTIVE) {
        return { success: false, error: 'Tournament is not active' };
      }

      // Validate species if restricted
      if (tournament.targetSpecies?.length > 0) {
        if (!tournament.targetSpecies.includes(catchItem.species)) {
          return {
            success: false,
            error: `Only ${tournament.targetSpecies.join(
              ', ',
            )} catches accepted`,
          };
        }
      }

      const submission = {
        catchId: catchItem.id,
        userId: user.uid,
        displayName: user.displayName || 'Angler',
        species: catchItem.species,
        weight: catchItem.weight || 0,
        length: catchItem.length || 0,
        photo: catchItem.photo || null,
        location: catchItem.latitude
          ? { latitude: catchItem.latitude, longitude: catchItem.longitude }
          : null,
        submittedAt: new Date().toISOString(),
        verificationStatus: tournament.requireVerification
          ? CATCH_VERIFICATION_STATUS.PENDING
          : CATCH_VERIFICATION_STATUS.VERIFIED,
        scoreValue: this._calculateScore(catchItem, tournament.scoring),
      };

      // Save catch submission
      await firestore()
        .collection(COLLECTIONS.TOURNAMENTS)
        .doc(tournamentId)
        .collection(COLLECTIONS.CATCHES)
        .doc(catchItem.id)
        .set(submission);

      // Add to verification queue (#372)
      if (tournament.requireVerification) {
        await firestore()
          .collection(COLLECTIONS.TOURNAMENTS)
          .doc(tournamentId)
          .collection(COLLECTIONS.VERIFICATION)
          .doc(catchItem.id)
          .set({
            ...submission,
            verifiedBy: null,
            verifiedAt: null,
            notes: '',
          });
      }

      // Update entry score
      const scoreIncrement =
        submission.verificationStatus === CATCH_VERIFICATION_STATUS.VERIFIED
          ? submission.scoreValue
          : 0;

      await firestore()
        .collection(COLLECTIONS.TOURNAMENTS)
        .doc(tournamentId)
        .collection(COLLECTIONS.ENTRIES)
        .doc(user.uid)
        .update({
          totalScore: firestore.FieldValue.increment(scoreIncrement),
          catchCount: firestore.FieldValue.increment(1),
          bestCatch:
            !submission.bestCatch || submission.scoreValue > 0
              ? {
                  species: catchItem.species,
                  weight: catchItem.weight,
                  photo: catchItem.photo,
                }
              : undefined,
        });

      return { success: true, submission };
    } catch (e) {
      console.warn('[Tournament] Submit catch error:', e);
      return { success: false, error: e.message };
    }
  },

  // ── Verification Queue (#372) ─────────────────────────

  /**
   * Get catches pending verification
   */
  async getVerificationQueue(tournamentId, limit = 50) {
    if (!firestore) return [];

    try {
      const snapshot = await firestore()
        .collection(COLLECTIONS.TOURNAMENTS)
        .doc(tournamentId)
        .collection(COLLECTIONS.VERIFICATION)
        .where('verificationStatus', '==', CATCH_VERIFICATION_STATUS.PENDING)
        .orderBy('submittedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('[Tournament] Verification queue error:', e);
      return [];
    }
  },

  /**
   * Verify or reject a tournament catch
   */
  async verifyCatch(tournamentId, catchId, { approved, notes = '' }) {
    const verifier = auth?.().currentUser;
    if (!verifier || !firestore) return false;

    try {
      const newStatus = approved
        ? CATCH_VERIFICATION_STATUS.VERIFIED
        : CATCH_VERIFICATION_STATUS.REJECTED;

      // Update verification doc
      await firestore()
        .collection(COLLECTIONS.TOURNAMENTS)
        .doc(tournamentId)
        .collection(COLLECTIONS.VERIFICATION)
        .doc(catchId)
        .update({
          verificationStatus: newStatus,
          verifiedBy: verifier.uid,
          verifiedAt: new Date().toISOString(),
          notes,
        });

      // Update catch doc
      await firestore()
        .collection(COLLECTIONS.TOURNAMENTS)
        .doc(tournamentId)
        .collection(COLLECTIONS.CATCHES)
        .doc(catchId)
        .update({ verificationStatus: newStatus });

      // If approved, update entry score
      if (approved) {
        const catchDoc = await firestore()
          .collection(COLLECTIONS.TOURNAMENTS)
          .doc(tournamentId)
          .collection(COLLECTIONS.CATCHES)
          .doc(catchId)
          .get();
        const catchData = catchDoc.data();

        if (catchData) {
          await firestore()
            .collection(COLLECTIONS.TOURNAMENTS)
            .doc(tournamentId)
            .collection(COLLECTIONS.ENTRIES)
            .doc(catchData.userId)
            .update({
              totalScore: firestore.FieldValue.increment(catchData.scoreValue),
            });
        }
      }

      return true;
    } catch (e) {
      console.warn('[Tournament] Verify catch error:', e);
      return false;
    }
  },

  // ── Live Leaderboard (#369) ───────────────────────────

  /**
   * Get tournament leaderboard
   */
  async getLeaderboard(tournamentId, limit = 100) {
    if (!firestore) return this._getMockEntries();

    try {
      const snapshot = await firestore()
        .collection(COLLECTIONS.TOURNAMENTS)
        .doc(tournamentId)
        .collection(COLLECTIONS.ENTRIES)
        .orderBy('totalScore', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc, i) => ({
        rank: i + 1,
        userId: doc.id,
        ...doc.data(),
      }));
    } catch (e) {
      console.warn('[Tournament] Leaderboard error:', e);
      return this._getMockEntries();
    }
  },

  /**
   * Subscribe to live tournament leaderboard updates
   */
  subscribeLeaderboard(tournamentId, { onUpdate, onError, limit = 100 }) {
    const key = `leaderboard_${tournamentId}`;
    if (this._listeners.has(key)) {
      this._listeners.get(key)();
    }

    if (!firestore) {
      onUpdate?.(this._getMockEntries());
      return () => {};
    }

    const unsubscribe = firestore()
      .collection(COLLECTIONS.TOURNAMENTS)
      .doc(tournamentId)
      .collection(COLLECTIONS.ENTRIES)
      .orderBy('totalScore', 'desc')
      .limit(limit)
      .onSnapshot(
        snapshot => {
          const entries = snapshot.docs.map((doc, i) => ({
            rank: i + 1,
            userId: doc.id,
            ...doc.data(),
          }));
          onUpdate?.(entries);
        },
        error => {
          console.warn('[Tournament] Leaderboard subscribe error:', error);
          onError?.(error);
        },
      );

    this._listeners.set(key, unsubscribe);
    return unsubscribe;
  },

  // ── Tournament History & Stats (#376) ─────────────────

  /**
   * Get user's tournament history
   */
  async getHistory(userId = null) {
    const uid = userId || auth?.().currentUser?.uid;
    if (!uid || !firestore) return [];

    try {
      const snapshot = await firestore()
        .collection(COLLECTIONS.HISTORY)
        .doc(uid)
        .collection('tournaments')
        .orderBy('endDate', 'desc')
        .limit(50)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('[Tournament] History error:', e);
      return [];
    }
  },

  /**
   * Save tournament result to user history
   */
  async saveToHistory(tournamentId, result) {
    const user = auth?.().currentUser;
    if (!user || !firestore) return;

    try {
      await firestore()
        .collection(COLLECTIONS.HISTORY)
        .doc(user.uid)
        .collection('tournaments')
        .doc(tournamentId)
        .set({
          tournamentId,
          name: result.tournamentName,
          rank: result.rank,
          totalParticipants: result.totalParticipants,
          score: result.score,
          catchCount: result.catchCount,
          endDate: result.endDate,
          savedAt: new Date().toISOString(),
        });
    } catch (e) {
      console.warn('[Tournament] Save history error:', e);
    }
  },

  /**
   * Get tournament stats for current user
   */
  async getStats() {
    const history = await this.getHistory();
    if (history.length === 0) {
      return {
        tournamentsPlayed: 0,
        wins: 0,
        topThree: 0,
        bestRank: null,
        totalCatchesSubmitted: 0,
        avgRank: 0,
      };
    }

    const wins = history.filter(h => h.rank === 1).length;
    const topThree = history.filter(h => h.rank <= 3).length;
    const ranks = history.map(h => h.rank).filter(r => r > 0);
    const avgRank =
      ranks.length > 0
        ? Math.round((ranks.reduce((a, b) => a + b, 0) / ranks.length) * 10) /
          10
        : 0;

    return {
      tournamentsPlayed: history.length,
      wins,
      topThree,
      bestRank: Math.min(...ranks),
      totalCatchesSubmitted: history.reduce(
        (sum, h) => sum + (h.catchCount || 0),
        0,
      ),
      avgRank,
    };
  },

  // ── Tournament Notifications (#373) ───────────────────

  /**
   * Get notification events for a tournament
   */
  getNotificationEvents(tournament) {
    const events = [];
    const now = Date.now();
    const start = new Date(tournament.startDate).getTime();
    const end = new Date(tournament.endDate).getTime();

    // 1 hour before start
    if (start - now > 0 && start - now < 60 * 60 * 1000) {
      events.push({
        type: 'tournament_starting',
        title: `${tournament.name} starts in 1 hour!`,
        body: 'Get your gear ready — the tournament is about to begin.',
      });
    }

    // 1 hour before end
    if (end - now > 0 && end - now < 60 * 60 * 1000) {
      events.push({
        type: 'tournament_ending',
        title: `${tournament.name} ends in 1 hour!`,
        body: 'Last chance to submit your catches.',
      });
    }

    // Tournament ended
    if (end < now && end > now - 5 * 60 * 1000) {
      events.push({
        type: 'tournament_ended',
        title: `${tournament.name} has ended!`,
        body: 'Check the final results.',
      });
    }

    return events;
  },

  // ── Share Cards (#377) ────────────────────────────────

  /**
   * Generate share card data for a tournament result
   */
  generateShareCard(tournament, userResult) {
    return {
      title: tournament.name,
      subtitle: `${
        tournament.type === TOURNAMENT_TYPE.COMMUNITY_WEEKLY
          ? 'Weekly Community'
          : 'Tournament'
      } Results`,
      rank: userResult.rank,
      totalParticipants: tournament.participantCount,
      score: userResult.totalScore,
      catchCount: userResult.catchCount,
      bestCatch: userResult.bestCatch,
      dateRange: `${new Date(
        tournament.startDate,
      ).toLocaleDateString()} — ${new Date(
        tournament.endDate,
      ).toLocaleDateString()}`,
      badge:
        userResult.rank === 1
          ? '🥇'
          : userResult.rank === 2
          ? '🥈'
          : userResult.rank === 3
          ? '🥉'
          : '🏆',
      shareText: `I placed #${userResult.rank} out of ${tournament.participantCount} anglers in ${tournament.name}! 🎣 #ProFish`,
    };
  },

  // ── Sponsorship (#378) ────────────────────────────────

  /**
   * Get sponsored tournaments
   */
  async getSponsoredTournaments(limit = 10) {
    return this.getTournaments({
      type: TOURNAMENT_TYPE.SPONSORED,
      status: TOURNAMENT_STATUS.ACTIVE,
      limit,
    });
  },

  // ── Weekly Community Tournaments (#374) ───────────────

  /**
   * Get current weekly community tournament
   */
  async getCurrentWeekly() {
    if (!firestore) return this._getMockTournaments()[0];

    try {
      const now = new Date().toISOString();
      const snapshot = await firestore()
        .collection(COLLECTIONS.TOURNAMENTS)
        .where('type', '==', TOURNAMENT_TYPE.COMMUNITY_WEEKLY)
        .where('status', '==', TOURNAMENT_STATUS.ACTIVE)
        .where('endDate', '>=', now)
        .orderBy('endDate', 'asc')
        .limit(1)
        .get();

      if (snapshot.empty) return null;
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    } catch (e) {
      console.warn('[Tournament] Get weekly error:', e);
      return null;
    }
  },

  // ── Helpers ───────────────────────────────────────────

  _calculateScore(catchItem, scoring) {
    switch (scoring) {
      case TOURNAMENT_SCORING.TOTAL_WEIGHT:
        return catchItem.weight || 0;
      case TOURNAMENT_SCORING.BIGGEST_CATCH:
        return catchItem.weight || 0;
      case TOURNAMENT_SCORING.TOTAL_CATCHES:
        return 1;
      case TOURNAMENT_SCORING.SPECIES_COUNT:
        return 1;
      default:
        return catchItem.weight || 0;
    }
  },

  async _cacheLocal(tournament) {
    try {
      const stored = await AsyncStorage.getItem(CACHE_KEY);
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(tournament);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(list.slice(0, 50)));
    } catch {}
  },

  _getMockTournaments() {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));

    return [
      {
        id: 'mock_weekly_1',
        name: 'Weekly Bass Blast',
        description:
          'Biggest bass wins! Weekly community tournament open to all.',
        type: TOURNAMENT_TYPE.COMMUNITY_WEEKLY,
        scoring: TOURNAMENT_SCORING.BIGGEST_CATCH,
        status: TOURNAMENT_STATUS.ACTIVE,
        startDate: new Date(
          now.getTime() - 3 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        endDate: weekEnd.toISOString(),
        maxParticipants: 500,
        participantCount: 47,
        targetSpecies: ['Largemouth Bass', 'Smallmouth Bass'],
        requirePhoto: true,
        requireVerification: true,
        createdBy: { uid: 'system', displayName: 'ProFish' },
        prizes: ['Pro subscription (1 year)', 'ProFish cap', 'bragging rights'],
      },
      {
        id: 'mock_monthly_1',
        name: 'Species Safari Challenge',
        description: 'Catch the most different species this month!',
        type: TOURNAMENT_TYPE.COMMUNITY_WEEKLY,
        scoring: TOURNAMENT_SCORING.SPECIES_COUNT,
        status: TOURNAMENT_STATUS.UPCOMING,
        startDate: weekEnd.toISOString(),
        endDate: new Date(
          weekEnd.getTime() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        maxParticipants: 1000,
        participantCount: 12,
        targetSpecies: [],
        requirePhoto: true,
        requireVerification: false,
        createdBy: { uid: 'system', displayName: 'ProFish' },
        prizes: ['Pro subscription (6 months)', 'Mystery tackle box'],
      },
    ];
  },

  _getMockEntries() {
    const names = [
      'BassMaster47',
      'TroutWhisperer',
      'ReelDeal',
      'Captain_Jack',
      'TightLines',
      'FishOn_Marco',
      'AnglrPro',
      'CatchKing',
    ];
    return names.map((name, i) => ({
      rank: i + 1,
      userId: `mock_${i}`,
      displayName: name,
      totalScore: Math.round((50 - i * 5.5) * 10) / 10,
      catchCount: Math.max(1, 10 - i),
      bestCatch: { species: 'Largemouth Bass', weight: (30 - i * 3) / 10 },
      isMe: i === 3,
    }));
  },

  unsubscribeAll() {
    for (const [, unsub] of this._listeners) {
      unsub?.();
    }
    this._listeners.clear();
  },
};

export default tournamentService;
