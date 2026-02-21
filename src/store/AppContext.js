/**
 * AppContext — Global state provider for ProFish
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import subscriptionService from '../services/subscriptionService';
import regionGatingService from '../services/regionGatingService';

const AppContext = createContext(null);

const initialState = {
  user: null,
  isAuthenticated: false,
  subscriptionTier: 'free',
  region: null,
  country: null,
  language: 'en',
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
      return { ...state, language: action.payload };
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
    async function init() {
      // Initialize subscription service
      await subscriptionService.init();
      dispatch({
        type: 'SET_TIER',
        payload: subscriptionService.getCurrentTier(),
      });

      // Detect region
      const { region, country } = regionGatingService.detect();
      dispatch({ type: 'SET_REGION', payload: { region, country } });

      dispatch({ type: 'SET_LOADING', payload: false });
    }

    init();

    // Listen for tier changes
    const unsub = subscriptionService.addListener(tier => {
      dispatch({ type: 'SET_TIER', payload: tier });
    });

    return unsub;
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
