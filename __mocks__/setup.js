/**
 * Jest Global Setup — ProFish
 *
 * Mock native modules that aren't available in test environment.
 */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(key => Promise.resolve(store[key] || null)),
      setItem: jest.fn((key, value) => {
        store[key] = value;
        return Promise.resolve();
      }),
      removeItem: jest.fn(key => {
        delete store[key];
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
        return Promise.resolve();
      }),
      getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
      multiGet: jest.fn(keys =>
        Promise.resolve(keys.map(k => [k, store[k] || null])),
      ),
      multiSet: jest.fn(pairs => {
        pairs.forEach(([k, v]) => {
          store[k] = v;
        });
        return Promise.resolve();
      }),
    },
  };
});

// Mock Firebase
jest.mock('@react-native-firebase/firestore', () => {
  const docData = {};
  const docRef = {
    set: jest.fn(() => Promise.resolve()),
    get: jest.fn(() => Promise.resolve({ exists: true, data: () => docData })),
    update: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve()),
    onSnapshot: jest.fn(),
  };
  const collectionRef = {
    add: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
    doc: jest.fn(() => docRef),
    where: jest.fn(() => collectionRef),
    orderBy: jest.fn(() => collectionRef),
    limit: jest.fn(() => collectionRef),
    get: jest.fn(() => Promise.resolve({ docs: [], empty: true })),
    onSnapshot: jest.fn(),
  };
  return {
    __esModule: true,
    default: jest.fn(() => ({
      collection: jest.fn(() => collectionRef),
      doc: jest.fn(() => docRef),
    })),
  };
});

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    currentUser: { uid: 'test-user-123', email: 'test@profish.com' },
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(cb => {
      cb({ uid: 'test-user-123' });
      return jest.fn();
    }),
  })),
}));

jest.mock('@react-native-firebase/analytics', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    logEvent: jest.fn(),
    setUserId: jest.fn(),
    setUserProperties: jest.fn(),
  })),
}));

jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getToken: jest.fn(() => Promise.resolve('mock-fcm-token')),
    onMessage: jest.fn(),
    requestPermission: jest.fn(() => Promise.resolve(1)),
  })),
}));

// Mock react-native-purchases (RevenueCat)
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    getCustomerInfo: jest.fn(() =>
      Promise.resolve({
        activeSubscriptions: [],
        entitlements: { active: {} },
      }),
    ),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(() => jest.fn()),
  },
  LOG_LEVEL: { DEBUG: 'DEBUG' },
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => ({
  __esModule: true,
  default: 'MapView',
  Marker: 'Marker',
  Callout: 'Callout',
  PROVIDER_GOOGLE: 'google',
}));

// Mock Mapbox
jest.mock('@rnmapbox/maps', () => ({
  __esModule: true,
  default: {
    setAccessToken: jest.fn(),
    MapView: 'MapView',
  },
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  }),
);

// Silence console warnings in tests
console.warn = jest.fn();
