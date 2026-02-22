/**
 * Content Moderation Service — ProFish (#352)
 *
 * Firebase-backed moderation queue for community content.
 * Handles: auto-flagging, manual review, actions (approve/reject/warn/ban).
 *
 * Firestore collections:
 *   - moderation_queue/{docId}: flagged items pending review
 *   - moderation_actions/{docId}: action log
 *   - users/{uid}/strikes: user strike history
 *
 * Auto-flag triggers:
 *   - Post reported 3+ times
 *   - Profanity detected
 *   - Duplicate photo hash (anti-cheat)
 *   - New user (<24h) posting links
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

let firestore = null;
let auth = null;
try {
  firestore = require('@react-native-firebase/firestore').default;
  auth = require('@react-native-firebase/auth').default;
} catch (e) {}

// ── Moderation constants ────────────────────────────────

export const MOD_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ESCALATED: 'escalated',
};

export const MOD_ACTION = {
  APPROVE: 'approve',
  REJECT: 'reject',
  WARN: 'warn',
  MUTE: 'mute', // 24h post ban
  BAN: 'ban', // permanent
  ESCALATE: 'escalate',
};

export const MOD_REASON = {
  SPAM: 'spam',
  PROFANITY: 'profanity',
  HARASSMENT: 'harassment',
  FAKE_CATCH: 'fake_catch',
  INAPPROPRIATE: 'inappropriate',
  DUPLICATE: 'duplicate',
  AUTO_FLAGGED: 'auto_flagged',
  USER_REPORT: 'user_report',
};

const REPORT_THRESHOLD = 3; // auto-flag after this many reports
const STRIKE_THRESHOLD = 3; // auto-ban after this many strikes

// ── Profanity filter (basic word list) ──────────────────
const PROFANITY_LIST = [
  'fuck',
  'shit',
  'ass',
  'bitch',
  'damn',
  'crap',
  'dick',
  'bastard',
  'cunt',
  'whore',
  'slut',
  'nigger',
  'faggot',
];

const PROFANITY_REGEX = new RegExp(`\\b(${PROFANITY_LIST.join('|')})\\b`, 'gi');

// ── Service ─────────────────────────────────────────────

const moderationService = {
  /**
   * Check text content for profanity
   * @returns {{ clean: boolean, flagged: string[] }}
   */
  checkProfanity(text) {
    if (!text) return { clean: true, flagged: [] };
    const matches = text.match(PROFANITY_REGEX) || [];
    return {
      clean: matches.length === 0,
      flagged: [...new Set(matches.map(m => m.toLowerCase()))],
    };
  },

  /**
   * Sanitize text by replacing profanity with asterisks
   */
  sanitizeText(text) {
    if (!text) return text;
    return text.replace(
      PROFANITY_REGEX,
      match => match[0] + '*'.repeat(match.length - 1),
    );
  },

  /**
   * Auto-check a post before publishing.
   * Returns { allowed, warnings[], autoFlagged, reason }
   */
  async preScreenPost(post) {
    const warnings = [];
    let autoFlagged = false;
    let reason = null;

    // 1. Profanity check
    const profanityCheck = this.checkProfanity(post.content);
    if (!profanityCheck.clean) {
      warnings.push(
        `Contains prohibited language: ${profanityCheck.flagged.join(', ')}`,
      );
      autoFlagged = true;
      reason = MOD_REASON.PROFANITY;
    }

    // 2. New user link check (spam prevention)
    const user = auth?.().currentUser;
    if (user) {
      const createdMs = new Date(user.metadata.creationTime).getTime();
      const ageHours = (Date.now() - createdMs) / (1000 * 60 * 60);
      const hasLinks = /https?:\/\/\S+/i.test(post.content);
      if (ageHours < 24 && hasLinks) {
        warnings.push('New accounts cannot post links in the first 24 hours');
        autoFlagged = true;
        reason = MOD_REASON.SPAM;
      }
    }

    // 3. Check if user is muted/banned
    const userStatus = await this.getUserModerationStatus();
    if (userStatus.banned) {
      return {
        allowed: false,
        warnings: ['Your account has been suspended'],
        autoFlagged: false,
        reason: MOD_REASON.HARASSMENT,
      };
    }
    if (userStatus.muted && userStatus.muteExpires > Date.now()) {
      const remaining = Math.ceil(
        (userStatus.muteExpires - Date.now()) / (60 * 60 * 1000),
      );
      return {
        allowed: false,
        warnings: [`You are temporarily muted for ${remaining} more hours`],
        autoFlagged: false,
        reason: MOD_REASON.HARASSMENT,
      };
    }

    return {
      allowed: !autoFlagged,
      warnings,
      autoFlagged,
      reason,
    };
  },

  /**
   * Flag a post for moderation review
   */
  async flagPost(postId, reason = MOD_REASON.USER_REPORT, details = '') {
    if (!firestore) return null;

    const user = auth?.().currentUser;
    const flagDoc = {
      contentType: 'post',
      contentId: postId,
      reason,
      details,
      reporterUid: user?.uid || 'system',
      status: MOD_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      actionTaken: null,
    };

    try {
      const ref = await firestore().collection('moderation_queue').add(flagDoc);
      return ref.id;
    } catch (e) {
      console.warn('[Moderation] Flag error:', e);
      return null;
    }
  },

  /**
   * Auto-flag a post that exceeds report threshold
   */
  async checkReportThreshold(postId, reportCount) {
    if (reportCount >= REPORT_THRESHOLD) {
      await this.flagPost(
        postId,
        MOD_REASON.AUTO_FLAGGED,
        `${reportCount} reports received`,
      );
      return true;
    }
    return false;
  },

  /**
   * Get moderation queue (admin function)
   * @param {string} status - Filter by status
   * @param {number} limit - Max results
   */
  async getQueue({ status = MOD_STATUS.PENDING, limit = 50 } = {}) {
    if (!firestore) return [];

    try {
      const snapshot = await firestore()
        .collection('moderation_queue')
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('[Moderation] Queue fetch error:', e);
      return [];
    }
  },

  /**
   * Take moderation action on a flagged item
   */
  async takeAction(queueItemId, action, { moderatorNote = '' } = {}) {
    if (!firestore) return false;
    const moderator = auth?.().currentUser;

    try {
      // Update queue item
      const newStatus =
        action === MOD_ACTION.APPROVE
          ? MOD_STATUS.APPROVED
          : action === MOD_ACTION.ESCALATE
          ? MOD_STATUS.ESCALATED
          : MOD_STATUS.REJECTED;

      await firestore()
        .collection('moderation_queue')
        .doc(queueItemId)
        .update({
          status: newStatus,
          actionTaken: action,
          reviewedAt: new Date().toISOString(),
          reviewedBy: moderator?.uid || 'admin',
          moderatorNote,
        });

      // Log action
      await firestore()
        .collection('moderation_actions')
        .add({
          queueItemId,
          action,
          moderatorUid: moderator?.uid || 'admin',
          moderatorNote,
          createdAt: new Date().toISOString(),
        });

      // If rejection/warn/mute/ban, apply to user
      const queueItem = await firestore()
        .collection('moderation_queue')
        .doc(queueItemId)
        .get();
      const itemData = queueItem.data();

      if (action === MOD_ACTION.REJECT && itemData?.contentType === 'post') {
        // Hide the post
        await firestore()
          .collection('posts')
          .doc(itemData.contentId)
          .update({ hidden: true, moderatedAt: new Date().toISOString() });
      }

      if (action === MOD_ACTION.WARN) {
        await this._addStrike(itemData?.reporterUid, 'warning', moderatorNote);
      }

      if (action === MOD_ACTION.MUTE) {
        await this._muteUser(itemData?.reporterUid, 24);
      }

      if (action === MOD_ACTION.BAN) {
        await this._banUser(itemData?.reporterUid);
      }

      return true;
    } catch (e) {
      console.warn('[Moderation] Action error:', e);
      return false;
    }
  },

  /**
   * Get current user's moderation status
   */
  async getUserModerationStatus(uid = null) {
    const userId = uid || auth?.().currentUser?.uid;
    if (!userId) return { banned: false, muted: false, strikes: 0 };

    try {
      // Check local cache first
      const cacheKey = `@profish_mod_status_${userId}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed._cachedAt < 5 * 60 * 1000) {
          return parsed;
        }
      }

      if (!firestore) {
        return { banned: false, muted: false, strikes: 0, muteExpires: 0 };
      }

      const doc = await firestore().collection('users').doc(userId).get();

      const data = doc.data() || {};
      const status = {
        banned: data.banned || false,
        muted: data.muted || false,
        muteExpires: data.muteExpires || 0,
        strikes: data.strikes || 0,
        _cachedAt: Date.now(),
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(status));
      return status;
    } catch (e) {
      return { banned: false, muted: false, strikes: 0, muteExpires: 0 };
    }
  },

  // ── Internal helpers ──────────────────────────────────

  async _addStrike(userId, type, note) {
    if (!firestore || !userId) return;

    try {
      await firestore()
        .collection('users')
        .doc(userId)
        .collection('strikes')
        .add({
          type,
          note,
          createdAt: new Date().toISOString(),
        });

      // Increment strike count on user doc
      await firestore()
        .collection('users')
        .doc(userId)
        .update({
          strikes: firestore.FieldValue.increment(1),
        });

      // Check auto-ban threshold
      const userDoc = await firestore().collection('users').doc(userId).get();
      if ((userDoc.data()?.strikes || 0) >= STRIKE_THRESHOLD) {
        await this._banUser(userId);
      }
    } catch (e) {
      console.warn('[Moderation] Add strike error:', e);
    }
  },

  async _muteUser(userId, hours = 24) {
    if (!firestore || !userId) return;

    try {
      await firestore()
        .collection('users')
        .doc(userId)
        .update({
          muted: true,
          muteExpires: Date.now() + hours * 60 * 60 * 1000,
        });
    } catch (e) {
      console.warn('[Moderation] Mute error:', e);
    }
  },

  async _banUser(userId) {
    if (!firestore || !userId) return;

    try {
      await firestore().collection('users').doc(userId).update({
        banned: true,
        bannedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('[Moderation] Ban error:', e);
    }
  },
};

export default moderationService;
