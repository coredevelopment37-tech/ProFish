/**
 * Referral Program Service (#495)
 *
 * Invite a friend → both get 1 week Pro free.
 * Uses Firebase Dynamic Links for deep linking.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const REFERRAL_KEY = '@profish_referral';
const REFERRAL_REWARD_DAYS = 7; // 1 week Pro free

let firestore = null;
let auth = null;
try {
  firestore = require('@react-native-firebase/firestore').default;
  auth = require('@react-native-firebase/auth').default;
} catch {}

const referralService = {
  /**
   * Generate a unique referral code for the current user
   */
  async getReferralCode() {
    const userId = auth()?.currentUser?.uid;
    if (!userId) return null;

    // Check if user already has a code
    const stored = await AsyncStorage.getItem(REFERRAL_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.code) return parsed.code;
    }

    // Generate code: first 4 chars of UID + random 4 chars
    const code = (
      userId.substring(0, 4) + Math.random().toString(36).substring(2, 6)
    ).toUpperCase();

    // Save to Firestore
    if (firestore) {
      try {
        await firestore().collection('referrals').doc(code).set({
          referrerId: userId,
          code,
          createdAt: new Date().toISOString(),
          redeemCount: 0,
          maxRedeems: 50, // Cap to prevent abuse
        });
      } catch {}
    }

    await AsyncStorage.setItem(REFERRAL_KEY, JSON.stringify({ code, userId }));
    return code;
  },

  /**
   * Build a shareable referral link
   */
  async getReferralLink() {
    const code = await this.getReferralCode();
    if (!code) return null;

    // Firebase Dynamic Link format
    return `https://profish.app/invite?ref=${code}`;
  },

  /**
   * Get share message for referral
   */
  async getShareMessage() {
    const link = await this.getReferralLink();
    return {
      title: 'Try ProFish — Free Fishing App',
      message: `I've been using ProFish to track my catches and check FishCast scores. Sign up with my link and we both get 1 week of Pro free! 🎣\n\n${link}`,
      url: link,
    };
  },

  /**
   * Redeem a referral code (called when new user signs up with code)
   */
  async redeemCode(code) {
    if (!code || !firestore) return { success: false, error: 'Invalid code' };

    const userId = auth()?.currentUser?.uid;
    if (!userId) return { success: false, error: 'Must be signed in' };

    try {
      const doc = await firestore().collection('referrals').doc(code).get();
      if (!doc.exists) return { success: false, error: 'Code not found' };

      const data = doc.data();

      // Prevent self-referral
      if (data.referrerId === userId) {
        return { success: false, error: 'Cannot use your own code' };
      }

      // Check redeem limit
      if (data.redeemCount >= data.maxRedeems) {
        return { success: false, error: 'Code has reached maximum uses' };
      }

      // Record redemption
      await firestore().collection('referral_redemptions').add({
        code,
        referrerId: data.referrerId,
        referredUserId: userId,
        redeemedAt: new Date().toISOString(),
        rewardDays: REFERRAL_REWARD_DAYS,
      });

      // Increment redeem count
      await doc.ref.update({
        redeemCount: data.redeemCount + 1,
      });

      // Grant reward to both users
      await this._grantProTrial(userId, REFERRAL_REWARD_DAYS);
      await this._grantProTrial(data.referrerId, REFERRAL_REWARD_DAYS);

      return {
        success: true,
        reward: `${REFERRAL_REWARD_DAYS} days Pro free`,
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Grant a temporary Pro access period
   * In production, this would use RevenueCat's promotional entitlements
   */
  async _grantProTrial(userId, days) {
    if (!firestore) return;

    const expiresAt = new Date(
      Date.now() + days * 24 * 60 * 60 * 1000,
    ).toISOString();

    try {
      await firestore().collection('users').doc(userId).set(
        {
          referralProExpires: expiresAt,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch {}
  },

  /**
   * Get referral stats for current user
   */
  async getStats() {
    const code = await this.getReferralCode();
    if (!code || !firestore) return { code, referrals: 0, rewardDays: 0 };

    try {
      const doc = await firestore().collection('referrals').doc(code).get();
      if (!doc.exists) return { code, referrals: 0, rewardDays: 0 };

      const data = doc.data();
      return {
        code,
        referrals: data.redeemCount || 0,
        rewardDays: (data.redeemCount || 0) * REFERRAL_REWARD_DAYS,
        maxRedeems: data.maxRedeems,
      };
    } catch {
      return { code, referrals: 0, rewardDays: 0 };
    }
  },
};

export default referralService;
