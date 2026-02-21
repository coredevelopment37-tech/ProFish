/**
 * Notification Service — ProFish
 *
 * Firebase Cloud Messaging integration for push notifications.
 * Handles: FCM token management, permission requests, foreground
 * message display, background handler registration, topic subscriptions.
 *
 * Trigger categories:
 *   - social: new follower, comment, like milestone
 *   - fishcast: score alerts ("Great fishing at 6 AM!")
 *   - community: trending posts, leaderboard changes
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

const PREFS_KEY = '@profish_notification_prefs';
const TOKEN_KEY = '@profish_fcm_token';
const NOTIFICATIONS_KEY = '@profish_notifications';
const MAX_STORED = 100;

let messaging = null;
let firestore = null;
let auth = null;

try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (e) {}

try {
  firestore = require('@react-native-firebase/firestore').default;
  auth = require('@react-native-firebase/auth').default;
} catch (e) {}

// ── Default notification preferences ─────────────────────

const DEFAULT_PREFS = {
  enabled: true,
  // Social
  newFollower: true,
  commentOnPost: true,
  likeMilestone: true, // 10, 50, 100 likes
  // FishCast
  fishcastAlerts: true,
  fishcastThreshold: 80, // Minimum score to trigger alert
  fishcastTime: '05:00', // When to check (local time)
  // Community
  trendingPosts: false,
  leaderboardChanges: false,
  // System
  appUpdates: true,
  weeklyDigest: true,
};

// ── Notification data model ──────────────────────────────

function createNotification({ type, title, body, data = {} }) {
  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type, // 'follower' | 'comment' | 'like' | 'fishcast' | 'leaderboard' | 'system'
    title,
    body,
    data,
    read: false,
    createdAt: new Date().toISOString(),
  };
}

// ── Service ──────────────────────────────────────────────

const notificationService = {
  _prefs: null,
  _notifications: [],
  _listeners: new Set(),
  _foregroundUnsubscribe: null,

  // ─── Initialization ──────────────────────────────────

  async init() {
    await this._loadPrefs();
    await this._loadNotifications();
    await this.requestPermission();
    await this._registerToken();
    this._setupForegroundHandler();
    this._setupBackgroundHandler();
    console.log('[Notifications] Initialized');
  },

  // ─── Permissions ─────────────────────────────────────

  async requestPermission() {
    if (!messaging) return false;

    try {
      const status = await messaging().requestPermission();
      const granted =
        status === messaging.AuthorizationStatus?.AUTHORIZED ||
        status === messaging.AuthorizationStatus?.PROVISIONAL;

      if (!granted) {
        console.log('[Notifications] Permission denied');
      }
      return granted;
    } catch (e) {
      console.warn('[Notifications] Permission error:', e);
      return false;
    }
  },

  // ─── FCM Token ──────────────────────────────────────

  async _registerToken() {
    if (!messaging) return;

    try {
      const token = await messaging().getToken();
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);

      if (token !== storedToken) {
        await AsyncStorage.setItem(TOKEN_KEY, token);
        await this._saveTokenToFirestore(token);
      }

      // Listen for token refresh
      messaging().onTokenRefresh(async newToken => {
        await AsyncStorage.setItem(TOKEN_KEY, newToken);
        await this._saveTokenToFirestore(newToken);
      });
    } catch (e) {
      console.warn('[Notifications] Token registration failed:', e);
    }
  },

  async _saveTokenToFirestore(token) {
    if (!firestore || !auth) return;

    const user = auth().currentUser;
    if (!user) return;

    try {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .set(
          {
            fcmTokens: {
              [Platform.OS]: token,
            },
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
    } catch (e) {
      console.warn('[Notifications] Token save failed:', e);
    }
  },

  // ─── Message Handlers ───────────────────────────────

  _setupForegroundHandler() {
    if (!messaging) return;

    this._foregroundUnsubscribe = messaging().onMessage(async remoteMessage => {
      const notification = createNotification({
        type: remoteMessage.data?.type || 'system',
        title: remoteMessage.notification?.title || 'ProFish',
        body: remoteMessage.notification?.body || '',
        data: remoteMessage.data || {},
      });

      await this._addNotification(notification);
      this._notifyListeners();

      // Show in-app alert for foreground messages
      if (this._prefs?.enabled !== false) {
        Alert.alert(notification.title, notification.body);
      }
    });
  },

  _setupBackgroundHandler() {
    if (!messaging) return;

    messaging().setBackgroundMessageHandler(async remoteMessage => {
      const notification = createNotification({
        type: remoteMessage.data?.type || 'system',
        title: remoteMessage.notification?.title || 'ProFish',
        body: remoteMessage.notification?.body || '',
        data: remoteMessage.data || {},
      });

      await this._addNotification(notification);
    });
  },

  // ─── Topic Subscriptions ────────────────────────────

  async subscribeToTopic(topic) {
    if (!messaging) return;
    try {
      await messaging().subscribeToTopic(topic);
    } catch (e) {
      console.warn('[Notifications] Subscribe failed:', topic, e);
    }
  },

  async unsubscribeFromTopic(topic) {
    if (!messaging) return;
    try {
      await messaging().unsubscribeFromTopic(topic);
    } catch (e) {
      console.warn('[Notifications] Unsubscribe failed:', topic, e);
    }
  },

  // ─── Notification Triggers ──────────────────────────

  /**
   * Trigger: New follower
   */
  async triggerNewFollower(followerName, followerUid) {
    if (!this._prefs?.newFollower) return;

    const notification = createNotification({
      type: 'follower',
      title: 'New Follower',
      body: `${followerName} started following you`,
      data: { followerUid },
    });

    await this._addNotification(notification);
    this._notifyListeners();
    await this._sendPush(notification);
  },

  /**
   * Trigger: Comment on your post
   */
  async triggerComment(commenterName, postId, preview) {
    if (!this._prefs?.commentOnPost) return;

    const notification = createNotification({
      type: 'comment',
      title: 'New Comment',
      body: `${commenterName}: ${preview.substring(0, 50)}`,
      data: { postId },
    });

    await this._addNotification(notification);
    this._notifyListeners();
    await this._sendPush(notification);
  },

  /**
   * Trigger: Like milestone (10, 50, 100)
   */
  async triggerLikeMilestone(postId, likeCount) {
    if (!this._prefs?.likeMilestone) return;

    const milestones = [10, 50, 100, 500, 1000];
    if (!milestones.includes(likeCount)) return;

    const notification = createNotification({
      type: 'like',
      title: 'Like Milestone! 🎉',
      body: `Your post just hit ${likeCount} likes!`,
      data: { postId, likeCount },
    });

    await this._addNotification(notification);
    this._notifyListeners();
    await this._sendPush(notification);
  },

  /**
   * Trigger: FishCast alert
   * Called from a background task or cloud function
   */
  async triggerFishCastAlert(score, locationName, bestHour) {
    if (!this._prefs?.fishcastAlerts) return;
    if (score < (this._prefs?.fishcastThreshold || 80)) return;

    const timeStr =
      bestHour < 12
        ? `${bestHour}:00 AM`
        : `${bestHour === 12 ? 12 : bestHour - 12}:00 PM`;

    const notification = createNotification({
      type: 'fishcast',
      title: `Great Fishing at ${timeStr}! 🎣`,
      body: `FishCast Score: ${score} near ${locationName}`,
      data: { score, locationName, bestHour },
    });

    await this._addNotification(notification);
    this._notifyListeners();
    await this._sendPush(notification);
  },

  // ─── Send Push via Firestore trigger ────────────────

  async _sendPush(notification) {
    if (!firestore || !auth) return;
    const user = auth().currentUser;
    if (!user) return;

    try {
      // Write to user's notification queue — Cloud Function picks it up and sends FCM
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('pendingNotifications')
        .add({
          ...notification,
          sentAt: new Date().toISOString(),
        });
    } catch (e) {
      // Silently fail — notification still saved locally
    }
  },

  // ─── Local Storage ──────────────────────────────────

  async _addNotification(notification) {
    this._notifications.unshift(notification);
    if (this._notifications.length > MAX_STORED) {
      this._notifications = this._notifications.slice(0, MAX_STORED);
    }
    await this._persistNotifications();
  },

  async _loadNotifications() {
    try {
      const raw = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      this._notifications = raw ? JSON.parse(raw) : [];
    } catch (e) {
      this._notifications = [];
    }
  },

  async _persistNotifications() {
    try {
      await AsyncStorage.setItem(
        NOTIFICATIONS_KEY,
        JSON.stringify(this._notifications),
      );
    } catch (e) {}
  },

  // ─── Preferences ────────────────────────────────────

  async _loadPrefs() {
    try {
      const raw = await AsyncStorage.getItem(PREFS_KEY);
      this._prefs = raw
        ? { ...DEFAULT_PREFS, ...JSON.parse(raw) }
        : { ...DEFAULT_PREFS };
    } catch (e) {
      this._prefs = { ...DEFAULT_PREFS };
    }
  },

  async getPrefs() {
    if (!this._prefs) await this._loadPrefs();
    return { ...this._prefs };
  },

  async updatePrefs(updates) {
    this._prefs = { ...this._prefs, ...updates };
    try {
      await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(this._prefs));

      // Update topic subscriptions based on pref changes
      if ('fishcastAlerts' in updates) {
        if (updates.fishcastAlerts) {
          await this.subscribeToTopic('fishcast_alerts');
        } else {
          await this.unsubscribeFromTopic('fishcast_alerts');
        }
      }
      if ('weeklyDigest' in updates) {
        if (updates.weeklyDigest) {
          await this.subscribeToTopic('weekly_digest');
        } else {
          await this.unsubscribeFromTopic('weekly_digest');
        }
      }
    } catch (e) {
      console.warn('[Notifications] Prefs save failed:', e);
    }
    this._notifyListeners();
    return this._prefs;
  },

  // ─── Public API ─────────────────────────────────────

  getNotifications() {
    return [...this._notifications];
  },

  getUnreadCount() {
    return this._notifications.filter(n => !n.read).length;
  },

  async markAsRead(notificationId) {
    const notif = this._notifications.find(n => n.id === notificationId);
    if (notif) {
      notif.read = true;
      await this._persistNotifications();
      this._notifyListeners();
    }
  },

  async markAllAsRead() {
    this._notifications.forEach(n => {
      n.read = true;
    });
    await this._persistNotifications();
    this._notifyListeners();
  },

  async deleteNotification(notificationId) {
    this._notifications = this._notifications.filter(
      n => n.id !== notificationId,
    );
    await this._persistNotifications();
    this._notifyListeners();
  },

  async clearAll() {
    this._notifications = [];
    await this._persistNotifications();
    this._notifyListeners();
  },

  // ─── Listeners (for UI badge updates etc.) ──────────

  addListener(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  },

  _notifyListeners() {
    const count = this.getUnreadCount();
    this._listeners.forEach(cb => {
      try {
        cb(count);
      } catch (e) {}
    });
  },

  // ─── Cleanup ────────────────────────────────────────

  destroy() {
    this._foregroundUnsubscribe?.();
    this._listeners.clear();
  },
};

export default notificationService;
