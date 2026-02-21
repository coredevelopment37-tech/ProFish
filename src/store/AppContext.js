/**
 * AppContext — Global state provider for ProFish
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import subscriptionService from '../services/subscriptionService';
import regionGatingService from '../services/regionGatingService';
import firebaseAuthService from '../services/firebaseAuthService';

const AppContext = createContext(null);

const initialState = {
  user: null,
  isAuthenticated: false,
  subscriptionTier: 'free',
  region: null,
  country: null,
  language: 'en',
  units: 'metric', // metric | imperial
  theme: 'dark', // dark | light
  catches: [],
  isLoading: true,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };
    case 'SET_TIER':
      return { ...state, subscriptionTier: action.payload };
    case 'SET_REGION':
      return {
        ...state,
        region: action.payload.region,
        country: action.payload.country,
      };
    case 'SET_LANGUAGE':
      AsyncStorage.setItem('@profish_language', action.payload).catch(() => {});
      return { ...state, language: action.payload };
    case 'SET_UNITS':
      AsyncStorage.setItem('@profish_units', action.payload).catch(() => {});
      return { ...state, units: action.payload };
    case 'SET_THEME':
      AsyncStorage.setItem('@profish_theme', action.payload).catch(() => {});
      return { ...state, theme: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'ADD_CATCH':
      return { ...state, catches: [action.payload, ...state.catches] };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    // Restore persisted preferences
    AsyncStorage.getItem('@profish_units')
      .then(val => {
        if (val) dispatch({ type: 'SET_UNITS', payload: val });
      })
      .catch(() => {});
    AsyncStorage.getItem('@profish_language')
      .then(val => {
        if (val) dispatch({ type: 'SET_LANGUAGE', payload: val });
      })
      .catch(() => {});
    AsyncStorage.getItem('@profish_theme')
      .then(val => {
        if (val) dispatch({ type: 'SET_THEME', payload: val });
      })
      .catch(() => {});

    // Initialize subscription service
    subscriptionService.init().then(() => {
      dispatch({
        type: 'SET_TIER',
        payload: subscriptionService.getCurrentTier(),
      });
    });

    // Detect region
    const { region, country } = regionGatingService.detect();
    dispatch({ type: 'SET_REGION', payload: { region, country } });

    // Listen for Firebase auth state changes
    const unsubAuth = firebaseAuthService.onAuthStateChanged(user => {
      if (user) {
        dispatch({
          type: 'SET_USER',
          payload: {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            isAnonymous: user.isAnonymous,
            provider: user.providerData?.[0]?.providerId || 'anonymous',
          },
        });
        // Identify user for RevenueCat
        subscriptionService.identify(user.uid).catch(() => {});
      } else {
        dispatch({ type: 'SET_USER', payload: null });
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    });

    // Listen for tier changes
    const unsubTier = subscriptionService.addListener(tier => {
      dispatch({ type: 'SET_TIER', payload: tier });
    });

    return () => {
      unsubAuth();
      unsubTier();
    };
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export default AppContext;
