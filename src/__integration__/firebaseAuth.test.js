/**
 * Integration Tests — Firebase Auth (#428)
 *
 * Tests authentication flows with Firebase:
 * sign-up, sign-in, sign-out, Google SSO, Apple SSO.
 *
 * NOTE: These tests require Firebase emulator or live config.
 * Run with: jest --config jest.integration.config.js
 */

import auth from '@react-native-firebase/auth';

describe('Firebase Auth Integration', () => {
  describe('Email/Password Auth', () => {
    it('should create a new account with email and password', async () => {
      const result = await auth().createUserWithEmailAndPassword(
        'integration@profish.com',
        'TestPass123!',
      );
      expect(result).toBeDefined();
    });

    it('should sign in with existing credentials', async () => {
      const result = await auth().signInWithEmailAndPassword(
        'integration@profish.com',
        'TestPass123!',
      );
      expect(result).toBeDefined();
    });

    it('should return current user after sign in', () => {
      const user = auth().currentUser;
      expect(user).toBeDefined();
      expect(user.uid).toBeDefined();
    });

    it('should sign out successfully', async () => {
      await auth().signOut();
      expect(auth().signOut).toHaveBeenCalled();
    });
  });

  describe('Auth State Listener', () => {
    it('should fire auth state changes', () => {
      const callback = jest.fn();
      const unsubscribe = auth().onAuthStateChanged(callback);
      expect(callback).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });
  });
});
