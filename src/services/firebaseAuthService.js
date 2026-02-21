/**
 * Firebase Auth Service — ProFish
 * Google Sign-In + Apple Sign-In + anonymous auth
 */

import { GOOGLE_WEB_CLIENT_ID } from '../config/env';

let auth = null;
let firestore = null;
let GoogleSignin = null;
let appleAuth = null;

try {
  auth = require('@react-native-firebase/auth').default;
  firestore = require('@react-native-firebase/firestore').default;
} catch (e) {
  // Firebase not linked yet
}

try {
  const gsi = require('@react-native-google-signin/google-signin');
  GoogleSignin = gsi.GoogleSignin;
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
  });
} catch (e) {
  // Google Sign-In not linked yet
}

try {
  const apple = require('@invertase/react-native-apple-authentication');
  appleAuth = apple.appleAuth;
} catch (e) {
  // Apple auth not linked yet (or Android)
}

const firebaseAuthService = {
  /**
   * Get current user
   */
  getCurrentUser() {
    return auth ? auth().currentUser : null;
  },

  /**
   * Sign in with Google
   */
  async signInWithGoogle() {
    if (!auth) throw new Error('Firebase Auth not available');
    if (!GoogleSignin) throw new Error('Google Sign-In not available');

    // Check play services
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Sign in and get tokens
    const signInResult = await GoogleSignin.signIn();
    const idToken = signInResult?.data?.idToken;
    if (!idToken) throw new Error('No ID token from Google');

    // Create Firebase credential and sign in
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await auth().signInWithCredential(googleCredential);

    // Save profile to Firestore
    const user = userCredential.user;
    await this.saveUserProfile({
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      provider: 'google',
      createdAt: user.metadata.creationTime,
    });

    return userCredential;
  },

  /**
   * Sign in with Apple (iOS only)
   */
  async signInWithApple() {
    if (!auth) throw new Error('Firebase Auth not available');
    if (!appleAuth)
      throw new Error('Apple Sign-In not available on this device');

    // Perform Apple sign-in request
    const appleAuthResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    // Verify credential state
    const credentialState = await appleAuth.getCredentialStateForUser(
      appleAuthResponse.user,
    );
    if (credentialState !== appleAuth.State.AUTHORIZED) {
      throw new Error('Apple Sign-In not authorized');
    }

    // Create Firebase credential
    const { identityToken, nonce } = appleAuthResponse;
    if (!identityToken) throw new Error('No identity token from Apple');

    const appleCredential = auth.AppleAuthProvider.credential(
      identityToken,
      nonce,
    );
    const userCredential = await auth().signInWithCredential(appleCredential);

    // Save profile (Apple may only provide name on first sign-in)
    const user = userCredential.user;
    const fullName = appleAuthResponse.fullName;
    const displayName =
      fullName && fullName.givenName
        ? `${fullName.givenName} ${fullName.familyName || ''}`.trim()
        : user.displayName;

    await this.saveUserProfile({
      displayName,
      email: appleAuthResponse.email || user.email,
      provider: 'apple',
      createdAt: user.metadata.creationTime,
    });

    return userCredential;
  },

  /**
   * Sign in anonymously (for free tier exploration)
   */
  async signInAnonymously() {
    if (!auth) throw new Error('Firebase Auth not available');
    return await auth().signInAnonymously();
  },

  /**
   * Link anonymous account to Google/Apple (upgrade without losing data)
   */
  async linkWithGoogle() {
    if (!auth || !GoogleSignin) throw new Error('Not available');
    const user = auth().currentUser;
    if (!user || !user.isAnonymous) throw new Error('Not an anonymous user');

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const signInResult = await GoogleSignin.signIn();
    const idToken = signInResult?.data?.idToken;
    if (!idToken) throw new Error('No ID token');

    const credential = auth.GoogleAuthProvider.credential(idToken);
    return await user.linkWithCredential(credential);
  },

  async linkWithApple() {
    if (!auth || !appleAuth) throw new Error('Not available');
    const user = auth().currentUser;
    if (!user || !user.isAnonymous) throw new Error('Not an anonymous user');

    const appleAuthResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    const { identityToken, nonce } = appleAuthResponse;
    if (!identityToken) throw new Error('No identity token');

    const credential = auth.AppleAuthProvider.credential(identityToken, nonce);
    return await user.linkWithCredential(credential);
  },

  /**
   * Sign out
   */
  async signOut() {
    if (!auth) return;
    try {
      if (GoogleSignin) await GoogleSignin.signOut().catch(() => {});
    } catch {}
    await auth().signOut();
  },

  /**
   * Listen for auth state changes
   */
  onAuthStateChanged(callback) {
    if (!auth) return () => {};
    return auth().onAuthStateChanged(callback);
  },

  /**
   * Check which providers are available
   */
  getAvailableProviders() {
    return {
      google: !!GoogleSignin,
      apple: !!appleAuth,
      anonymous: !!auth,
    };
  },

  /**
   * Save user profile to Firestore
   */
  async saveUserProfile(data) {
    const user = this.getCurrentUser();
    if (!user || !firestore) return;

    await firestore()
      .collection('users')
      .doc(user.uid)
      .set(
        {
          ...data,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
  },

  /**
   * Get user profile from Firestore
   */
  async getUserProfile() {
    const user = this.getCurrentUser();
    if (!user || !firestore) return null;

    const doc = await firestore().collection('users').doc(user.uid).get();
    return doc.exists ? doc.data() : null;
  },

  /**
   * Delete account and all user data
   */
  async deleteAccount() {
    const user = this.getCurrentUser();
    if (!user) return;

    // Delete Firestore profile
    if (firestore) {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .delete()
        .catch(() => {});
    }

    // Delete Firebase auth account
    await user.delete();
  },
};

export default firebaseAuthService;
