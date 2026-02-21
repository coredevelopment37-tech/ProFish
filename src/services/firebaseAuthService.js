/**
 * Firebase Auth Service — ProFish
 * Google Sign-In + Apple Sign-In + anonymous auth
 */

let auth = null;
let firestore = null;

try {
  auth = require('@react-native-firebase/auth').default;
  firestore = require('@react-native-firebase/firestore').default;
} catch (e) {
  // Firebase not linked yet
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
    // TODO: Implement with @react-native-google-signin/google-signin
    throw new Error('Google Sign-In not yet implemented');
  },

  /**
   * Sign in with Apple
   */
  async signInWithApple() {
    // TODO: Implement with @invertase/react-native-apple-authentication
    throw new Error('Apple Sign-In not yet implemented');
  },

  /**
   * Sign in anonymously (for free tier exploration)
   */
  async signInAnonymously() {
    if (!auth) throw new Error('Firebase Auth not available');
    return await auth().signInAnonymously();
  },

  /**
   * Sign out
   */
  async signOut() {
    if (!auth) return;
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
};

export default firebaseAuthService;
